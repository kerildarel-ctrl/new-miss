import { NextResponse } from 'next/server';
import { queryDb } from '@/lib/pgDb';
import { getRequestDomain } from '@/utils/domain';

function sanitizeCameroonPhone(raw: string): string {
  let digits = (raw || '').replace(/\D/g, '');
  if (digits.startsWith('00237')) digits = digits.slice(5);
  else if (digits.startsWith('237')) digits = digits.slice(3);
  if (digits.startsWith('0') && digits.length === 10) digits = digits.slice(1);
  if (digits.length >= 9) digits = digits.slice(-9);
  return digits;
}

function detectOperator(phone: string): { operator: 'ORANGE' | 'MTN'; medium: 'orange money' | 'mobile money'; ussdPrompt: string } {
  // Orange Cameroon: 69x, 655-659
  if (phone.startsWith('69') || /^65[5-9]/.test(phone)) {
    return {
      operator: 'ORANGE',
      medium: 'orange money',
      ussdPrompt: '#150*50#'
    };
  }
  // MTN Cameroon: 67x, 68x, 650-654
  return {
    operator: 'MTN',
    medium: 'mobile money',
    ussdPrompt: '*126#'
  };
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      candidateId,
      candidateName,
      competitionSlug,
      voteCount = 1,
      amount,
      phone = '',
      email = '',
    } = body;

    const count = Math.max(1, parseInt(voteCount, 10) || 1);
    const voteAmount = amount ? Math.max(100, Math.round(Number(amount))) : count * 100;
    const voteId = `vote_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    // 1. Nettoyage strict du numéro camerounais (9 chiffres commençant par 6)
    const cleanPhone = sanitizeCameroonPhone(phone);
    if (!cleanPhone || cleanPhone.length !== 9 || !cleanPhone.startsWith('6')) {
      return NextResponse.json({
        success: false,
        error: 'Veuillez saisir un numéro de téléphone valide à 9 chiffres commençant par 6 (ex: 690123456 ou 670123456).'
      }, { status: 400 });
    }

    const { operator, medium, ussdPrompt } = detectOperator(cleanPhone);

    const fapshiApiUser = process.env.FAPSHI_API_USER || '2aa10fd5-e2e0-4f94-bc2f-01585657f418';
    const fapshiApiKey = process.env.FAPSHI_API_KEY || 'FAK_f8e3d6d682775ca2f34e34c80da6ccc6';
    const fapshiBaseUrl = process.env.FAPSHI_BASE_URL || 'https://live.fapshi.com';

    const voterEmail = (email && email.includes('@'))
      ? email.trim()
      : (process.env.FAPSHI_PAYMENT_EMAIL || 'MKprog.assistant@gmail.com');

    // Détection automatique du nom de domaine pour le site (tous hébergeurs)
    const siteUrl = getRequestDomain(request);
    const returnBase = `${siteUrl}/competition/${competitionSlug || 'copa'}`;

    // 2. INITIALISATION DU DÉBIT DIRECT (avec medium explicite)
    let transId = '';
    let paymentLink = '';

    const directPayload: any = {
      amount: voteAmount,
      phone: cleanPhone,
      medium: medium,
      email: voterEmail,
      userId: candidateId,
      externalId: voteId,
      message: `Vote VoteMoi (${count} vote(s)) pour ${candidateName || 'candidat'}`
    };

    // Appel direct-pay
    try {
      const directRes = await fetch(`${fapshiBaseUrl}/direct-pay`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apiuser': fapshiApiUser,
          'apikey': fapshiApiKey
        },
        body: JSON.stringify(directPayload)
      });

      if (directRes.ok) {
        const directData = await directRes.json();
        if (directData && directData.transId) {
          transId = directData.transId;
        }
      }
    } catch (directErr) {
      console.warn('Fapshi direct-pay error, will fallback to initiate-pay:', directErr);
    }

    // 3. GÉNÉRATION DU LIEN DE SECOURS (initiate-pay)
    // Permet au votant de valider via Fapshi si la notification USSD ne pop pas sur son mobile
    try {
      const initPayload: any = {
        amount: voteAmount,
        phone: cleanPhone,
        email: voterEmail,
        userId: candidateId,
        externalId: voteId,
        redirectUrl: `${returnBase}?voteSuccess=true&voteId=${voteId}&candidateId=${candidateId}&voteCount=${count}&email=${encodeURIComponent(voterEmail)}`,
        webhookUrl: `${siteUrl}/api/pay/webhook`,
        message: `Vote VoteMoi (${count} vote(s)) pour ${candidateName || 'candidat'}`,
        serviceName: 'VoteMoi'
      };

      const initRes = await fetch(`${fapshiBaseUrl}/initiate-pay`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apiuser': fapshiApiUser,
          'apikey': fapshiApiKey
        },
        body: JSON.stringify(initPayload)
      });

      if (initRes.ok) {
        const initData = await initRes.json();
        if (initData && initData.link) {
          paymentLink = initData.link;
          // Si direct-pay n'avait pas retourné de transId, on utilise celui de initiate-pay
          if (!transId && initData.transId) {
            transId = initData.transId;
          }
        }
      }
    } catch (initErr) {
      console.warn('Fapshi initiate-pay fallback error:', initErr);
    }

    if (!transId) {
      return NextResponse.json({
        success: false,
        error: 'Impossible d’initialiser le paiement avec la passerelle Fapshi. Veuillez vérifier vos informations.'
      }, { status: 400 });
    }

    // 4. ENREGISTREMENT DU VOTE EN ATTENTE DANS POSTGRESQL NEON
    try {
      await queryDb(
        `INSERT INTO public.votes (
          id, candidate_id, candidate_name, competition_slug, vote_count,
          amount_fcfa, payment_method, payment_status, fapshi_trans_id,
          voter_email, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, 'fapshi_direct_pay', 'PENDING', $7, $8, NOW())
        ON CONFLICT (id) DO UPDATE SET
          fapshi_trans_id = EXCLUDED.fapshi_trans_id,
          payment_status = 'PENDING';`,
        [
          voteId,
          candidateId,
          candidateName || '',
          competitionSlug || 'copa',
          count,
          voteAmount,
          transId,
          voterEmail
        ]
      );
    } catch (dbErr) {
      console.warn('PostgreSQL direct pay vote insert notice:', dbErr);
    }

    return NextResponse.json({
      success: true,
      transId: transId,
      voteId: voteId,
      candidateId: candidateId,
      voteCount: count,
      amount: voteAmount,
      phone: cleanPhone,
      operator: operator,
      medium: medium,
      ussdPrompt: ussdPrompt,
      paymentLink: paymentLink,
      status: 'PENDING',
      message: `Demande de débit envoyée au +237 ${cleanPhone}. Saisissez votre code secret pour valider.`
    });

  } catch (error: any) {
    console.error('Direct pay global error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Une erreur inattendue est survenue lors du paiement.'
    }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { queryDb } from '@/lib/pgDb';
import { getSupabaseAdmin } from '@/lib/supabaseClient';
import { getRequestDomain } from '@/utils/domain';

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
      returnUrl = ''
    } = body;

    const count = Math.max(1, parseInt(voteCount, 10) || 1);
    // Prix unitaire standard : 100 FCFA par vote
    const voteAmount = amount ? Math.max(100, Math.round(Number(amount))) : count * 100;
    const voteId = `vote_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    const fapshiApiUser = process.env.FAPSHI_API_USER || '2aa10fd5-e2e0-4f94-bc2f-01585657f418';
    const fapshiApiKey = process.env.FAPSHI_API_KEY || 'FAK_f8e3d6d682775ca2f34e34c80da6ccc6';
    const fapshiBaseUrl = process.env.FAPSHI_BASE_URL || 'https://live.fapshi.com';

    // Détection automatique du nom de domaine pour le site (tous hébergeurs)
    const siteUrl = getRequestDomain(request);

    // URL de retour exacte vers la page du concours / candidat
    let returnBase = returnUrl && typeof returnUrl === 'string' && returnUrl.startsWith('http')
      ? returnUrl.split('?')[0]
      : `${siteUrl}/competition/${competitionSlug || 'copa'}`;

    const webhookUrl = `${siteUrl}/api/pay/webhook`;

    // Nettoyage du numéro de téléphone camerounais (9 chiffres) si renseigné
    let cleanPhone: string | undefined = undefined;
    if (phone && typeof phone === 'string') {
      const digits = phone.replace(/\D/g, '');
      if (digits.length >= 9) {
        cleanPhone = digits.slice(-9);
      }
    }

    // Email du votant ou email de notification par défaut
    const voterEmail = (email && email.includes('@'))
      ? email.trim()
      : (process.env.FAPSHI_PAYMENT_EMAIL || 'MKprog.assistant@gmail.com');

    // 1. APPEL OFFICIEL DE LA PASSERELLE FAPSHI (Orange Money & MTN MoMo)
    // Note : Fapshi va générer le lien de paiement direct https://checkout.fapshi.com/...
    const fapshiPayload: any = {
      amount: voteAmount,
      email: voterEmail,
      userId: candidateId,
      externalId: voteId,
      redirectUrl: `${returnBase}?voteSuccess=true&voteId=${voteId}&candidateId=${candidateId}&voteCount=${count}`,
      webhookUrl: webhookUrl,
      message: `Vote VoteMoi (${count} vote(s)) pour ${candidateName || 'candidat'}`,
      serviceName: 'VoteMoi'
    };

    if (cleanPhone) {
      fapshiPayload.phone = cleanPhone;
    }

    const fapshiResponse = await fetch(`${fapshiBaseUrl}/initiate-pay`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apiuser': fapshiApiUser,
        'apikey': fapshiApiKey
      },
      body: JSON.stringify(fapshiPayload)
    });

    const fapshiData = await fapshiResponse.json().catch(() => ({}));

    if (!fapshiResponse.ok || !fapshiData.link) {
      console.error('Fapshi initiate-pay API error:', fapshiData);
      return NextResponse.json({
        success: false,
        error: fapshiData.message || fapshiData.error || 'Erreur lors de la connexion à la passerelle de paiement sécurisée.'
      }, { status: 400 });
    }

    const transId = fapshiData.transId || '';

    // Si Fapshi a retourné un transId, on peut l'inclure dans l'URL de redirection
    const finalRedirectUrl = `${returnBase}?voteSuccess=true&voteId=${voteId}&candidateId=${candidateId}&transId=${transId}&voteCount=${count}`;

    // 2. ENREGISTREMENT DU VOTE EN ATTENTE (PENDING) DANS POSTGRESQL NEON
    try {
      await queryDb(
        `INSERT INTO public.votes (
          id, candidate_id, candidate_name, competition_slug, vote_count,
          amount_fcfa, payment_method, payment_status, fapshi_trans_id,
          voter_email, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, 'fapshi_mobile_money', 'PENDING', $7, $8, NOW())
        ON CONFLICT (id) DO UPDATE SET
          fapshi_trans_id = EXCLUDED.fapshi_trans_id,
          payment_status = 'PENDING';`,
        [
          voteId,
          candidateId,
          candidateName,
          competitionSlug,
          count,
          voteAmount,
          transId,
          voterEmail || null,
        ]
      );
    } catch (dbErr) {
      console.warn('PostgreSQL pending vote record notice:', dbErr);
    }

    // 3. RETOURNER LE LIEN FAPSHI POUR REDIRECTION IMMÉDIATE DU VOTANT
    return NextResponse.json({
      success: true,
      link: fapshiData.link,
      transId: transId,
      voteId: voteId,
      redirectUrl: finalRedirectUrl,
      message: 'Redirection vers Fapshi en cours...'
    });

  } catch (error: any) {
    console.error('Erreur initiate-pay:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Erreur interne lors de l’initialisation du vote' },
      { status: 500 }
    );
  }
}

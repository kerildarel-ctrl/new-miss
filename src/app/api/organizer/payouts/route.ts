import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { queryDb } from '@/lib/pgDb';

// Re-export from shared types file (single source of truth)
export type { PayoutRequest } from '@/types/payouts';
import type { PayoutRequest } from '@/types/payouts';


const payoutsFilePath = path.join(process.cwd(), 'src', 'data', 'payouts.json');

function readPayouts(): PayoutRequest[] {
  try {
    if (!fs.existsSync(payoutsFilePath)) {
      fs.writeFileSync(payoutsFilePath, '[]', 'utf-8');
      return [];
    }
    const file = fs.readFileSync(payoutsFilePath, 'utf-8');
    return JSON.parse(file || '[]');
  } catch {
    return [];
  }
}

function writePayouts(data: PayoutRequest[]) {
  try {
    fs.writeFileSync(payoutsFilePath, JSON.stringify(data, null, 2), 'utf-8');
  } catch {
    // continue
  }
}

function sanitizeCameroonPhone(rawPhone: string): string {
  let digits = rawPhone.replace(/\D/g, '');
  if (digits.startsWith('237') && digits.length === 12) {
    digits = digits.slice(3);
  }
  return digits;
}

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug');

    // Consultation optionnelle du solde Fapshi
    if (searchParams.get('checkBalance') === 'true') {
      const fapshiApiUser =
        process.env.FAPSHI_PAYOUT_API_USER ||
        process.env.FAPSHI_API_USER ||
        '2aa10fd5-e2e0-4f94-bc2f-01585657f418';
      const fapshiApiKey =
        process.env.FAPSHI_PAYOUT_API_KEY ||
        process.env.FAPSHI_API_KEY ||
        'FAK_f8e3d6d682775ca2f34e34c80da6ccc6';
      const fapshiBaseUrl =
        process.env.FAPSHI_PAYOUT_BASE_URL ||
        process.env.FAPSHI_BASE_URL ||
        'https://live.fapshi.com';

      try {
        const balRes = await fetch(`${fapshiBaseUrl}/balance`, {
          headers: {
            apiuser: fapshiApiUser,
            apikey: fapshiApiKey,
          },
        });
        if (balRes.ok) {
          const balData = await balRes.json();
          return NextResponse.json({
            success: true,
            balance: balData.balance ?? 0,
            currency: balData.currency || 'XAF',
          });
        }
      } catch {
        // Fallback
      }
      return NextResponse.json({ success: false, error: 'Solde Fapshi indisponible' });
    }

    // 1. Lire depuis PostgreSQL Neon
    try {
      let sql = 'SELECT * FROM public.payouts';
      const params: any[] = [];
      if (slug) {
        sql += ' WHERE competition_slug = $1';
        params.push(slug);
      }
      sql += ' ORDER BY created_at DESC;';

      const rows = await queryDb<any>(sql, params);
      if (rows && rows.length > 0) {
        const mapped: PayoutRequest[] = rows.map((p) => ({
          id: p.id,
          competitionSlug: p.competition_slug,
          competitionTitle: p.competition_title,
          organizerName: p.organizer_name,
          organizerPhone: p.organizer_phone,
          operator: p.operator || 'ORANGE_MONEY',
          amount: Number(p.amount) || 0,
          status: p.status || 'PENDING',
          createdAt: p.created_at ? new Date(p.created_at).toISOString() : new Date().toISOString(),
          paidAt: p.paid_at ? new Date(p.paid_at).toISOString() : undefined,
          transactionRef: p.transaction_ref,
          organizerToken: p.organizer_token,
        }));
        return NextResponse.json({ success: true, data: mapped });
      }
    } catch (e) {
      console.warn('PostgreSQL payouts fetch fallback to disk:', e);
    }

    const payouts = readPayouts();
    const filtered = slug ? payouts.filter((p) => p.competitionSlug === slug) : payouts;

    return NextResponse.json({ success: true, data: filtered });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body: Partial<PayoutRequest> & { organizerToken?: string } = await request.json();

    if (!body.amount || !body.organizerPhone) {
      return NextResponse.json(
        { success: false, error: 'Champs requis manquants (montant, numéro Mobile Money).' },
        { status: 400 }
      );
    }

    const amountNum = Number(body.amount);
    if (isNaN(amountNum) || amountNum < 100) {
      return NextResponse.json(
        { success: false, error: 'Le montant minimum de retrait est de 100 FCFA.' },
        { status: 400 }
      );
    }

    let compSlug = body.competitionSlug;
    let compTitle = body.competitionTitle || 'Compétition';

    if (body.organizerToken) {
      try {
        const comps = await queryDb<any>(
          'SELECT slug, title FROM public.competitions WHERE organizer_token = $1 LIMIT 1;',
          [body.organizerToken]
        );
        if (comps && comps.length > 0) {
          compSlug = comps[0].slug;
          compTitle = comps[0].title;
        }
      } catch {
        // Fallback local
        const compFilePath = path.join(process.cwd(), 'src', 'data', 'competitions.json');
        if (fs.existsSync(compFilePath)) {
          const comps = JSON.parse(fs.readFileSync(compFilePath, 'utf-8') || '[]');
          const found = comps.find(
            (c: any) => c.organizerToken === body.organizerToken || c.organizer_token === body.organizerToken
          );
          if (found) {
            compSlug = found.slug;
            compTitle = found.title;
          }
        }
      }
    }

    if (!compSlug) {
      return NextResponse.json(
        { success: false, error: "Identifiant ou clé secrète d'élection manquante." },
        { status: 400 }
      );
    }

    const newPayout: PayoutRequest = {
      id: `payout_${Date.now()}`,
      competitionSlug: compSlug,
      competitionTitle: compTitle,
      organizerName: body.organizerName || 'Organisateur',
      organizerPhone: body.organizerPhone,
      operator: body.operator || 'ORANGE_MONEY',
      amount: Number(body.amount),
      status: 'PENDING',
      createdAt: new Date().toISOString(),
      organizerToken: body.organizerToken,
    };

    // 1. Sauvegarder dans PostgreSQL Neon
    try {
      await queryDb(
        `INSERT INTO public.payouts (
          id, competition_slug, competition_title, organizer_name,
          organizer_phone, operator, amount, status, organizer_token, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW());`,
        [
          newPayout.id,
          newPayout.competitionSlug,
          newPayout.competitionTitle,
          newPayout.organizerName,
          newPayout.organizerPhone,
          newPayout.operator,
          newPayout.amount,
          newPayout.status,
          newPayout.organizerToken || null,
        ]
      );
    } catch (e) {
      console.warn('PostgreSQL insert payout error:', e);
    }

    // 2. Réplication locale sur disque
    const payouts = readPayouts();
    payouts.unshift(newPayout);
    writePayouts(payouts);

    return NextResponse.json({ success: true, data: newPayout });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// Super Admin : Valider (manuel ou Fapshi Disburse) ou Rejeter
export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, status, transactionRef, useFapshiDisburse } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID requis' }, { status: 400 });
    }

    const payouts = readPayouts();
    const payout = payouts.find((p) => p.id === id);
    if (!payout) {
      return NextResponse.json({ success: false, error: 'Demande de retrait introuvable' }, { status: 404 });
    }

    // 1. ACTION DE REJET
    if (status === 'REJECTED') {
      try {
        await queryDb('UPDATE public.payouts SET status = $1 WHERE id = $2;', ['REJECTED', id]);
      } catch (e) {
        console.warn('PostgreSQL reject payout error:', e);
      }

      const updated = payouts.map((p) => {
        if (p.id === id) {
          return {
            ...p,
            status: 'REJECTED' as const,
            paidAt: undefined,
          };
        }
        return p;
      });
      writePayouts(updated);
      return NextResponse.json({ success: true, data: updated.find((p) => p.id === id) });
    }

    // 2. REVERSEMENT AUTOMATIQUE VIA L'API FAPSHI DISBURSE
    if (useFapshiDisburse) {
      const cleanPhone = sanitizeCameroonPhone(payout.organizerPhone);
      if (cleanPhone.length !== 9) {
        return NextResponse.json(
          {
            success: false,
            error: `Numéro de téléphone invalide pour Fapshi (${payout.organizerPhone}). Format attendu : 9 chiffres (ex: 690123456 ou 670123456).`,
          },
          { status: 400 }
        );
      }

      const fapshiApiUser =
        process.env.FAPSHI_PAYOUT_API_USER ||
        process.env.FAPSHI_API_USER ||
        '2aa10fd5-e2e0-4f94-bc2f-01585657f418';
      const fapshiApiKey =
        process.env.FAPSHI_PAYOUT_API_KEY ||
        process.env.FAPSHI_API_KEY ||
        'FAK_f8e3d6d682775ca2f34e34c80da6ccc6';
      const fapshiBaseUrl =
        process.env.FAPSHI_PAYOUT_BASE_URL ||
        process.env.FAPSHI_BASE_URL ||
        'https://live.fapshi.com';

      const medium = payout.operator === 'ORANGE_MONEY' ? 'orange money' : 'mobile money';

      const fapshiPayload = {
        amount: Math.round(payout.amount),
        phone: cleanPhone,
        medium,
        name: payout.organizerName || 'Organisateur',
        externalId: payout.id,
        message: `Reversement VoteMoi: ${payout.competitionTitle}`,
      };

      try {
        const fapshiRes = await fetch(`${fapshiBaseUrl}/payout`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            apiuser: fapshiApiUser,
            apikey: fapshiApiKey,
          },
          body: JSON.stringify(fapshiPayload),
        });

        const fapshiData = await fapshiRes.json().catch(() => ({}));

        if (fapshiRes.ok && (fapshiData.transId || fapshiData.message === 'Accepted')) {
          const transId = fapshiData.transId || `FAPSHI_${Date.now()}`;

          try {
            await queryDb(
              'UPDATE public.payouts SET status = $1, transaction_ref = $2, paid_at = NOW() WHERE id = $3;',
              ['PAID', transId, id]
            );
          } catch (e) {
            console.warn('PostgreSQL update paid payout error:', e);
          }

          const updated = payouts.map((p) => {
            if (p.id === id) {
              return {
                ...p,
                status: 'PAID' as const,
                transactionRef: transId,
                paidAt: new Date().toISOString(),
              };
            }
            return p;
          });
          writePayouts(updated);

          return NextResponse.json({
            success: true,
            mode: 'FAPSHI_AUTO',
            transId,
            message: `Reversement de ${payout.amount.toLocaleString('fr-FR')} FCFA envoyé avec succès via Fapshi !`,
            data: updated.find((p) => p.id === id),
          });
        } else {
          const errMsg =
            fapshiData.message ||
            fapshiData.error ||
            `Erreur HTTP ${fapshiRes.status} reçue de Fapshi`;

          return NextResponse.json(
            {
              success: false,
              error: `Fapshi Disburse : ${errMsg}`,
              details: fapshiData,
            },
            { status: 400 }
          );
        }
      } catch (fapshiErr: any) {
        return NextResponse.json(
          {
            success: false,
            error: `Connexion à l'API Fapshi échouée : ${fapshiErr.message}`,
          },
          { status: 502 }
        );
      }
    }

    // 3. VALIDATION MANUELLE (Transfert fait manuellement par l'admin)
    const txRef = transactionRef || payout.transactionRef || `MANUEL_${Date.now()}`;
    try {
      await queryDb(
        'UPDATE public.payouts SET status = $1, transaction_ref = $2, paid_at = NOW() WHERE id = $3;',
        ['PAID', txRef, id]
      );
    } catch (e) {
      console.warn('PostgreSQL manual payout update error:', e);
    }

    const updated = payouts.map((p) => {
      if (p.id === id) {
        return {
          ...p,
          status: 'PAID' as const,
          transactionRef: txRef,
          paidAt: new Date().toISOString(),
        };
      }
      return p;
    });

    writePayouts(updated);

    return NextResponse.json({ success: true, data: updated.find((p) => p.id === id) });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

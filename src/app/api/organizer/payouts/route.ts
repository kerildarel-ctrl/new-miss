import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export interface PayoutRequest {
  id: string;
  competitionSlug: string;
  competitionTitle: string;
  organizerName: string;
  organizerPhone: string;
  operator: 'MTN_MOMO' | 'ORANGE_MONEY';
  amount: number;
  status: 'PENDING' | 'PAID' | 'REJECTED';
  createdAt: string;
  paidAt?: string;
  transactionRef?: string;
  organizerToken?: string;
}

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

    let compSlug = body.competitionSlug;
    let compTitle = body.competitionTitle || 'Compétition';

    if (body.organizerToken) {
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
          // Message d'erreur renvoyé par Fapshi
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
    const updated = payouts.map((p) => {
      if (p.id === id) {
        return {
          ...p,
          status: 'PAID' as const,
          transactionRef: transactionRef || p.transactionRef || `MANUEL_${Date.now()}`,
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

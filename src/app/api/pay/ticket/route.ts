import { NextResponse } from 'next/server';
import { queryDb } from '@/lib/pgDb';

export const dynamic = 'force-dynamic';

const FAPSHI_API_USER = process.env.FAPSHI_API_USER || '';
const FAPSHI_API_KEY  = process.env.FAPSHI_API_KEY  || '';

const FAPSHI_BASE_URL = 'https://live.fapshi.com';

async function ensureOrdersTable() {
  await queryDb(`
    CREATE TABLE IF NOT EXISTS public.ticket_orders (
      id TEXT PRIMARY KEY,
      event_id TEXT DEFAULT '',
      event_title TEXT DEFAULT '',
      event_slug TEXT DEFAULT '',
      pass_id TEXT DEFAULT '',
      pass_name TEXT DEFAULT '',
      buyer_name TEXT DEFAULT '',
      buyer_email TEXT DEFAULT '',
      buyer_phone TEXT DEFAULT '',
      quantity INTEGER DEFAULT 1,
      unit_price INTEGER DEFAULT 0,
      total_price INTEGER DEFAULT 0,
      payment_status TEXT DEFAULT 'PENDING',
      fapshi_trans_id TEXT DEFAULT '',
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);
}

/**
 * POST /api/pay/ticket
 * Crée une commande PENDING et initie le paiement Fapshi
 */
export async function POST(request: Request) {
  try {
    await ensureOrdersTable();

    const body = await request.json();
    const {
      eventId, eventTitle, eventSlug,
      passId, passName, unitPrice,
      quantity = 1,
      buyerName, buyerEmail, buyerPhone,
    } = body;

    if (!eventId || !passName || !unitPrice || !buyerName || !buyerEmail || !buyerPhone) {
      return NextResponse.json({ success: false, error: 'Champs requis manquants' }, { status: 400 });
    }

    const qty = Math.max(1, parseInt(String(quantity), 10) || 1);
    const totalPrice = Number(unitPrice) * qty;
    const orderId = `ORD-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

    // 1. Sauvegarder la commande PENDING dans Neon
    await queryDb(
      `INSERT INTO public.ticket_orders
        (id, event_id, event_title, event_slug, pass_id, pass_name, buyer_name,
         buyer_email, buyer_phone, quantity, unit_price, total_price, payment_status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,'PENDING')`,
      [orderId, eventId, eventTitle || '', eventSlug || '', passId || '', passName,
       buyerName, buyerEmail, buyerPhone, qty, Number(unitPrice), totalPrice]
    ).catch((e) => console.warn('Order insert warning:', e?.message));

    // 2. Initier le paiement Fapshi
    const origin = request.headers.get('origin') || 'https://miss-template.netlify.app';
    const redirectUrl = `${origin}/billetterie/confirmation/${orderId}`;

    const fapshiPayload = {
      amount: totalPrice,
      email: buyerEmail,
      userId: buyerPhone,
      externalId: orderId,
      redirectUrl,
      message: `Billet ${passName} × ${qty} — ${eventTitle || 'Événement VoteMoi'}`,
    };

    console.log('[Fapshi] Initiating payment:', JSON.stringify(fapshiPayload));

    const fapshiRes = await fetch(`${FAPSHI_BASE_URL}/initiate-pay`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apiuser': FAPSHI_API_USER,
        'apikey': FAPSHI_API_KEY,
      },
      body: JSON.stringify(fapshiPayload),
    });

    const fapshiData = await fapshiRes.json().catch(() => ({}));
    console.log('[Fapshi] Response:', JSON.stringify(fapshiData), 'status:', fapshiRes.status);

    // Fapshi renvoie "link" (pas "paymentLink") — on supporte les deux
    const paymentLink = fapshiData.link || fapshiData.paymentLink || fapshiData.payment_link || '';
    const transId = fapshiData.transId || fapshiData.trans_id || '';

    if (!fapshiRes.ok || !paymentLink) {
      const errMsg = fapshiData.message || fapshiData.error || `Erreur Fapshi ${fapshiRes.status}`;
      console.error('[Fapshi] Error:', errMsg, fapshiData);
      return NextResponse.json({ success: false, error: errMsg }, { status: 500 });
    }

    // Sauvegarder le transId Fapshi
    if (transId) {
      await queryDb(
        'UPDATE public.ticket_orders SET fapshi_trans_id = $1 WHERE id = $2',
        [transId, orderId]
      ).catch(() => {});
    }

    return NextResponse.json({ success: true, orderId, paymentLink, transId });
  } catch (error: any) {
    console.error('[pay/ticket] error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

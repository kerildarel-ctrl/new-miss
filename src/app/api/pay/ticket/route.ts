import { NextResponse } from 'next/server';
import { queryDb } from '@/lib/pgDb';

export const dynamic = 'force-dynamic';

const FAPSHI_API_USER = process.env.FAPSHI_API_USER || '';
const FAPSHI_API_KEY  = process.env.FAPSHI_API_KEY  || '';
const FAPSHI_BASE_URL = 'https://live.fapshi.com';

// Allowed redirect origins (prevents open-redirect via Origin header spoofing)
const ALLOWED_ORIGINS = [
  'https://miss-template.netlify.app',
  'https://votemoi.netlify.app',
  process.env.NEXT_PUBLIC_SITE_URL,
  // Allow local development
  'http://localhost:3000',
  'http://localhost:3001',
].filter(Boolean) as string[];

const MAX_QUANTITY = 20; // Safety cap

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
 * Crée une commande PENDING et initie le paiement Fapshi.
 * Le prix est TOUJOURS lu depuis la DB — jamais depuis le client.
 */
export async function POST(request: Request) {
  try {
    if (!FAPSHI_API_USER || !FAPSHI_API_KEY) {
      console.error('[pay/ticket] Fapshi credentials not configured');
      return NextResponse.json({ success: false, error: 'Service de paiement non configuré.' }, { status: 503 });
    }

    await ensureOrdersTable();

    const body = await request.json();
    const {
      eventId, eventTitle, eventSlug,
      passId, passName,
      quantity = 1,
      buyerName, buyerEmail, buyerPhone,
    } = body;

    if (!eventId || !passName || !buyerName || !buyerEmail || !buyerPhone) {
      return NextResponse.json({ success: false, error: 'Champs requis manquants.' }, { status: 400 });
    }

    // ── Quantity cap (never trust the client) ──────────────────────────
    const qty = Math.min(Math.max(1, parseInt(String(quantity), 10) || 1), MAX_QUANTITY);

    // ── Fetch authoritative price from DB ─────────────────────────────
    // NEVER trust the unitPrice sent by the client
    const evtRows = await queryDb<any>(
      'SELECT passes FROM public.events WHERE id = $1 LIMIT 1',
      [eventId]
    );
    if (!evtRows.length) {
      return NextResponse.json({ success: false, error: 'Événement introuvable.' }, { status: 404 });
    }

    const passes: { name: string; price: number; id?: string }[] = evtRows[0].passes || [];
    const pass = passes.find(
      (p) => p.name === passName || (passId && p.id === passId)
    );
    if (!pass || typeof pass.price !== 'number' || pass.price <= 0) {
      return NextResponse.json({ success: false, error: 'Type de billet introuvable ou prix invalide.' }, { status: 400 });
    }

    const unitPrice  = pass.price;
    const totalPrice = unitPrice * qty;

    // ── Safe redirect URL (whitelist-based) ───────────────────────────
    const requestOrigin = request.headers.get('origin') || '';
    const safeOrigin = ALLOWED_ORIGINS.includes(requestOrigin)
      ? requestOrigin
      : ALLOWED_ORIGINS[0];
    const redirectUrl = `${safeOrigin}/billetterie/confirmation/`;

    // ── Generate order ID with entropy ────────────────────────────────
    const entropy = `${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
    const orderId  = `ORD-${entropy}`;

    // ── Save PENDING order ────────────────────────────────────────────
    await queryDb(
      `INSERT INTO public.ticket_orders
        (id, event_id, event_title, event_slug, pass_id, pass_name, buyer_name,
         buyer_email, buyer_phone, quantity, unit_price, total_price, payment_status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,'PENDING')`,
      [orderId, eventId, eventTitle || '', eventSlug || '', passId || '', passName,
       buyerName, buyerEmail, buyerPhone, qty, unitPrice, totalPrice]
    ); // Let errors propagate — don't silently swallow

    // ── Initiate Fapshi payment ───────────────────────────────────────
    const fapshiPayload = {
      amount: totalPrice,
      email: buyerEmail,
      userId: buyerPhone,
      externalId: orderId,
      redirectUrl: `${redirectUrl}${orderId}`,
      message: `Billet ${passName} × ${qty} — ${eventTitle || 'Événement VoteMoi'}`,
    };

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
    console.info('[Fapshi] initiate-pay status:', fapshiRes.status);

    const paymentLink = fapshiData.link || fapshiData.paymentLink || fapshiData.payment_link || '';
    const transId     = fapshiData.transId || fapshiData.trans_id || '';

    if (!fapshiRes.ok || !paymentLink) {
      const errMsg = fapshiData.message || fapshiData.error || `Erreur Fapshi ${fapshiRes.status}`;
      console.error('[Fapshi] Error:', errMsg);
      return NextResponse.json({ success: false, error: errMsg }, { status: 500 });
    }

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

import { NextResponse } from 'next/server';
import { queryDb } from '@/lib/pgDb';
import QRCode from 'qrcode';

export const dynamic = 'force-dynamic';

const FAPSHI_API_USER = process.env.FAPSHI_API_USER || '2aa10fd5-e2e0-4f94-bc2f-01585657f418';
const FAPSHI_API_KEY  = process.env.FAPSHI_API_KEY  || 'FAK_f8e3d6d682775ca2f34e34c80da6ccc6';
const FAPSHI_BASE_URL = 'https://live.fapshi.com';
const BREVO_API_KEY   = process.env.BREVO_API_KEY   || '';

function genTicketCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = 'TKT-';
  for (let i = 0; i < 8; i++) {
    if (i === 4) code += '-';
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

async function generateQRDataUrl(text: string): Promise<string> {
  return QRCode.toDataURL(text, { width: 200, margin: 2, color: { dark: '#27149F', light: '#FFFFFF' } });
}

function buildTicketEmailHtml(p: {
  buyerName: string; eventTitle: string; eventDate: string; eventVenue: string;
  passName: string; ticketCode: string; qrDataUrl: string;
  seatIndex: number; totalTickets: number;
}): string {
  return `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Votre billet — ${p.eventTitle}</title></head>
<body style="margin:0;padding:0;background:#ECEBF7;font-family:Arial,Helvetica,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#ECEBF7;padding:28px 12px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#fff;border-radius:18px;overflow:hidden;box-shadow:0 8px 30px rgba(39,20,159,0.15);">
<tr><td style="background:linear-gradient(135deg,#1B0E78 0%,#27149F 50%,#4B2CE0 100%);padding:36px;text-align:center;">
  <img src="https://miss-template.netlify.app/images/logo.png" width="180" alt="VoteMoi" style="display:block;margin:0 auto 16px;border:0;">
  <div style="font-size:40px;line-height:1;margin-bottom:8px;">🎟️</div>
  <h1 style="margin:0;color:#fff;font-size:22px;font-weight:800;">Votre billet est confirmé !</h1>
  <p style="margin:8px 0 0;color:#D9D4FA;font-size:14px;">Place ${p.seatIndex} sur ${p.totalTickets}</p>
</td></tr>
<tr><td style="padding:32px 36px;">
  <p style="margin:0 0 20px;font-size:16px;color:#1C1647;">Bonjour <strong>${p.buyerName}</strong>,<br>Voici votre billet d'accès à :</p>
  <table width="100%" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg,#1B0E78,#4B2CE0);border-radius:16px;overflow:hidden;">
  <tr>
    <td style="padding:24px;vertical-align:middle;">
      <div style="font-size:11px;letter-spacing:3px;color:#BDB6EE;font-weight:700;text-transform:uppercase;margin-bottom:6px;">BILLET D'ENTRÉE</div>
      <div style="font-size:22px;font-weight:800;color:#fff;margin-bottom:6px;">${p.eventTitle}</div>
      <div style="font-size:13px;color:#D9D4FA;margin-bottom:4px;">📅 ${p.eventDate}</div>
      <div style="font-size:13px;color:#D9D4FA;margin-bottom:12px;">📍 ${p.eventVenue}</div>
      <div style="display:inline-block;background:rgba(255,255,255,0.15);border:1px solid rgba(255,255,255,0.3);border-radius:99px;padding:6px 16px;font-size:13px;color:#fff;font-weight:700;">${p.passName}</div>
    </td>
    <td width="140" style="padding:20px;text-align:center;border-left:2px dashed rgba(255,255,255,0.25);vertical-align:middle;">
      <img src="${p.qrDataUrl}" width="110" height="110" alt="QR" style="display:block;margin:0 auto 8px;border-radius:8px;">
      <div style="font-size:10px;color:#BDB6EE;font-weight:700;letter-spacing:1px;">${p.ticketCode}</div>
    </td>
  </tr>
  </table>
  <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:24px;background:#EEF0FC;border-radius:12px;">
  <tr><td style="padding:20px;">
    <p style="margin:0 0 10px;font-size:14px;font-weight:700;color:#27149F;">ℹ️ Instructions d'entrée :</p>
    <ul style="margin:0;padding-left:18px;font-size:13px;color:#4B4780;line-height:1.8;">
      <li>Présentez ce QR code à l'entrée (téléphone ou imprimé)</li>
      <li>Le billet est nominatif — valable une seule fois</li>
      <li>Code de référence : <strong style="color:#27149F;font-family:monospace;">${p.ticketCode}</strong></li>
    </ul>
  </td></tr>
  </table>
</td></tr>
<tr><td style="background:#1B0E78;padding:20px 36px;text-align:center;">
  <p style="margin:0;font-size:12px;color:#BDB6EE;line-height:1.6;">
    VoteMoi — conçu et développé par MK PROG<br>
    © ${new Date().getFullYear()} VoteMoi. Tous droits réservés.
  </p>
</td></tr>
</table></td></tr></table></body></html>`;
}

async function sendTicketEmail(p: {
  to: string; buyerName: string; eventTitle: string; eventDate: string;
  eventVenue: string; passName: string; ticketCode: string;
  qrDataUrl: string; seatIndex: number; totalTickets: number;
}): Promise<void> {
  if (!BREVO_API_KEY) { console.warn('No BREVO_API_KEY'); return; }
  const html = buildTicketEmailHtml(p);
  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: { 'accept': 'application/json', 'api-key': BREVO_API_KEY, 'content-type': 'application/json' },
    body: JSON.stringify({
      sender: { name: 'VoteMoi Billetterie', email: 'kerildarel@gmail.com' },
      to: [{ email: p.to, name: p.buyerName }],
      subject: `🎟️ Votre billet — ${p.eventTitle} (${p.passName})`,
      htmlContent: html,
    }),
  }).catch((e) => { console.warn('Email send failed:', e?.message); return null; });
  if (res && !res.ok) {
    const txt = await res.text().catch(() => '');
    console.warn('[Brevo] Error:', res.status, txt);
  }
}

async function ensureTables() {
  await queryDb(`
    CREATE TABLE IF NOT EXISTS public.ticket_orders (
      id TEXT PRIMARY KEY,
      event_id TEXT DEFAULT '', event_title TEXT DEFAULT '',
      event_slug TEXT DEFAULT '', pass_id TEXT DEFAULT '',
      pass_name TEXT DEFAULT '', buyer_name TEXT DEFAULT '',
      buyer_email TEXT DEFAULT '', buyer_phone TEXT DEFAULT '',
      quantity INTEGER DEFAULT 1, unit_price INTEGER DEFAULT 0,
      total_price INTEGER DEFAULT 0, payment_status TEXT DEFAULT 'PENDING',
      fapshi_trans_id TEXT DEFAULT '', created_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS public.tickets (
      id TEXT PRIMARY KEY, ticket_code TEXT UNIQUE NOT NULL,
      event_id TEXT DEFAULT '', event_title TEXT DEFAULT '',
      pass_name TEXT DEFAULT '', unit_price INTEGER DEFAULT 0,
      quantity INTEGER DEFAULT 1, total_price INTEGER DEFAULT 0,
      buyer_name TEXT DEFAULT '', buyer_email TEXT DEFAULT '',
      buyer_phone TEXT DEFAULT '', order_ref TEXT DEFAULT '',
      payment_status TEXT DEFAULT 'PAID', status TEXT DEFAULT 'VALID',
      purchased_at TIMESTAMPTZ DEFAULT NOW(),
      scanned_at TIMESTAMPTZ, scanned_by_agent_name TEXT
    );
  `);
}

/**
 * POST /api/pay/ticket/verify
 */
export async function POST(request: Request) {
  try {
    await ensureTables();
    const { orderId, transId } = await request.json();
    if (!orderId) return NextResponse.json({ success: false, error: 'orderId requis' }, { status: 400 });

    // 1. Récupérer la commande depuis Neon
    const rows = await queryDb<any>('SELECT * FROM public.ticket_orders WHERE id = $1 LIMIT 1', [orderId]);
    const order = rows[0];

    if (!order) {
      return NextResponse.json({ success: false, error: 'Commande introuvable. Réessayez.' }, { status: 404 });
    }

    // Déjà payé ?
    if (order.payment_status === 'PAID') {
      const tickets = await queryDb<any>('SELECT * FROM public.tickets WHERE order_ref = $1', [orderId]);
      const origin = request.headers.get('origin') || 'https://miss-template.netlify.app';
      const evtRows = await queryDb<any>('SELECT title,date,venue FROM public.events WHERE id = $1 LIMIT 1', [order.event_id]).catch(() => []);
      const evt = evtRows[0] || {};
      return NextResponse.json({
        success: true, alreadyPaid: true, orderId,
        tickets: tickets.map((t: any) => ({ ticketCode: t.ticket_code, ticketUrl: `${origin}/billetterie/${t.ticket_code}` })),
        buyerName: order.buyer_name, buyerEmail: order.buyer_email,
        eventTitle: evt.title || order.event_title,
        eventDate: evt.date || '', eventVenue: evt.venue || '',
        passName: order.pass_name, quantity: order.quantity || 1, totalPrice: order.total_price,
      });
    }

    // 2. Vérifier le paiement Fapshi
    const fapshiTransId = transId || order.fapshi_trans_id;
    let paymentConfirmed = false;

    if (fapshiTransId) {
      try {
        const verifyRes = await fetch(`${FAPSHI_BASE_URL}/payment-status/${fapshiTransId}`, {
          headers: { 'apiuser': FAPSHI_API_USER, 'apikey': FAPSHI_API_KEY },
        });
        const verifyData = await verifyRes.json().catch(() => ({}));
        console.log('[Fapshi] verify status:', JSON.stringify(verifyData));
        const status = (verifyData.status || verifyData.data?.status || '').toUpperCase();
        paymentConfirmed = ['SUCCESSFUL', 'SUCCESS', 'PAID'].includes(status);
        if (!paymentConfirmed) {
          return NextResponse.json({
            success: false,
            error: `Paiement non encore confirmé (statut: ${status || 'en attente'}). Réessayez dans quelques secondes.`,
          }, { status: 402 });
        }
      } catch (e: any) {
        console.warn('[Fapshi] verify error:', e?.message);
        // Si Fapshi inaccessible → on bloque (ne pas émettre des billets non payés)
        return NextResponse.json({
          success: false,
          error: 'Impossible de vérifier le paiement. Réessayez.',
        }, { status: 503 });
      }
    } else {
      return NextResponse.json({
        success: false,
        error: 'ID de transaction manquant. Réessayez.',
      }, { status: 400 });
    }

    // 3. Récupérer les détails de l'événement
    const evtRows = await queryDb<any>(
      'SELECT title, date, venue FROM public.events WHERE id = $1 LIMIT 1',
      [order.event_id]
    ).catch(() => []);
    const evt = evtRows[0] || {};
    const eventTitle = evt.title || order.event_title || 'Événement VoteMoi';
    const eventDate  = evt.date  || '';
    const eventVenue = evt.venue || '';

    // 4. Générer les billets (un par place)
    const qty = order.quantity || 1;
    const origin = request.headers.get('origin') || 'https://miss-template.netlify.app';
    const issuedTickets: { ticketCode: string; ticketUrl: string; qrDataUrl: string }[] = [];

    for (let i = 0; i < qty; i++) {
      const ticketCode = genTicketCode();
      const ticketId   = `tck_${Date.now()}_${i}_${Math.random().toString(36).slice(2, 5)}`;
      const ticketUrl  = `${origin}/billetterie/${ticketCode}`;
      const qrDataUrl  = await generateQRDataUrl(ticketUrl).catch(() => '');

      await queryDb(
        `INSERT INTO public.tickets
          (id, ticket_code, event_id, event_title, pass_name, unit_price, quantity,
           total_price, buyer_name, buyer_email, buyer_phone, order_ref,
           payment_status, status, purchased_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,'PAID','VALID',NOW())
         ON CONFLICT (ticket_code) DO NOTHING`,
        [ticketId, ticketCode, order.event_id, eventTitle, order.pass_name,
         order.unit_price, 1, order.unit_price,
         order.buyer_name, order.buyer_email, order.buyer_phone, orderId]
      ).catch((e) => console.warn('Ticket insert warn:', e?.message));

      issuedTickets.push({ ticketCode, ticketUrl, qrDataUrl });

      // Envoyer l'email
      await sendTicketEmail({
        to: order.buyer_email, buyerName: order.buyer_name,
        eventTitle, eventDate, eventVenue,
        passName: order.pass_name, ticketCode, qrDataUrl,
        seatIndex: i + 1, totalTickets: qty,
      });
    }

    // 5. Marquer la commande PAID
    await queryDb(
      'UPDATE public.ticket_orders SET payment_status = $1, fapshi_trans_id = $2 WHERE id = $3',
      ['PAID', fapshiTransId || '', orderId]
    ).catch(() => {});

    return NextResponse.json({
      success: true, orderId,
      tickets: issuedTickets,
      buyerName: order.buyer_name, buyerEmail: order.buyer_email,
      eventTitle, eventDate, eventVenue,
      passName: order.pass_name, quantity: qty, totalPrice: order.total_price,
    });
  } catch (error: any) {
    console.error('[verify] error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

/**
 * GET /api/pay/ticket/verify?orderId=...
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('orderId');
    if (!orderId) return NextResponse.json({ success: false, error: 'orderId requis' }, { status: 400 });

    const rows = await queryDb<any>('SELECT * FROM public.ticket_orders WHERE id = $1 LIMIT 1', [orderId]);
    const order = rows[0];
    if (!order) return NextResponse.json({ success: false, error: 'Commande introuvable' }, { status: 404 });

    let tickets: any[] = [];
    if (order.payment_status === 'PAID') {
      tickets = await queryDb<any>('SELECT * FROM public.tickets WHERE order_ref = $1', [orderId]);
    }
    return NextResponse.json({ success: true, order, tickets });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

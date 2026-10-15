import { NextResponse } from 'next/server';
import { queryDb } from '@/lib/pgDb';
import QRCode from 'qrcode';

export const dynamic = 'force-dynamic';

const FAPSHI_API_USER = process.env.FAPSHI_API_USER || '';
const FAPSHI_API_KEY  = process.env.FAPSHI_API_KEY  || '';

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

/** Color palette per pass type */
function getPassPalette(passName: string) {
  const n = passName.toLowerCase();
  if (n.includes('vvip') || n.includes('v.v.i.p'))
    return { bg1:'#0a0800', bg2:'#1a1200', bg3:'#2d1f00',
             accent:'#F59E0B', accentLight:'#FDE68A', labelBg:'#92400E', label:'VVIP ✦' };
  if (n.includes('vip'))
    return { bg1:'#2d1515', bg2:'#7f1d1d', bg3:'#991b1b',
             accent:'#FCA5A5', accentLight:'#FEE2E2', labelBg:'#b91c1c', label:'VIP' };
  if (n.includes('platine') || n.includes('platinum'))
    return { bg1:'#042322', bg2:'#064e3b', bg3:'#065f46',
             accent:'#6EE7B7', accentLight:'#D1FAE5', labelBg:'#047857', label:'PLATINUM' };
  if (n.includes('gold') || n.includes('or ') || n === 'or')
    return { bg1:'#1c1508', bg2:'#451a03', bg3:'#78350f',
             accent:'#FCD34D', accentLight:'#FEF3C7', labelBg:'#b45309', label:'GOLD' };
  if (n.includes('diamant') || n.includes('diamond'))
    return { bg1:'#0a0c2e', bg2:'#1e1b4b', bg3:'#3730a3',
             accent:'#C7D2FE', accentLight:'#EEF2FF', labelBg:'#4338ca', label:'DIAMOND' };
  // Standard / General — brand purple
  return { bg1:'#0f0820', bg2:'#1B0E78', bg3:'#27149F',
           accent:'#A78BFA', accentLight:'#EDE9FE', labelBg:'#4B2CE0', label:'STANDARD' };
}

function buildTicketEmailHtml(p: {
  buyerName: string; eventTitle: string; eventDate: string; eventVenue: string;
  passName: string; ticketCode: string; qrDataUrl: string;
  seatIndex: number; totalTickets: number;
}): string {
  const pal = getPassPalette(p.passName);
  const yr  = new Date().getFullYear();
  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>🎟️ ${p.eventTitle} — Votre billet</title>
</head>
<body style="margin:0;padding:0;background:#0d0d1a;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">

<table width="100%" cellpadding="0" cellspacing="0" style="background:linear-gradient(160deg,#0d0d1a,#1a1035,#0d0d1a);padding:36px 12px 56px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

  <!-- ─── HEADER ─────────────────────────────────────────── -->
  <tr><td style="background:${pal.bg2};border-radius:20px 20px 0 0;padding:22px 32px;">
    <table width="100%" cellpadding="0" cellspacing="0"><tr>
      <td>
        <div style="font-size:26px;font-weight:900;color:#fff;letter-spacing:-1px;">
          Vote<span style="color:${pal.accent};">Moi</span>
        </div>
        <div style="font-size:10px;color:rgba(255,255,255,0.45);letter-spacing:3px;text-transform:uppercase;">Billetterie Officielle</div>
      </td>
      <td style="text-align:right;vertical-align:middle;">
        <span style="display:inline-block;background:${pal.labelBg};border-radius:99px;padding:7px 16px;font-size:11px;font-weight:900;color:#fff;letter-spacing:2px;text-transform:uppercase;">${pal.label}</span>
      </td>
    </tr></table>
  </td></tr>

  <!-- ─── CONFIRMATION BANNER ────────────────────────────── -->
  <tr><td style="background:${pal.bg1};padding:28px 32px 0;">
    <div style="text-align:center;margin-bottom:20px;">
      <div style="display:inline-block;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);border-radius:14px;padding:12px 24px;">
        <span style="font-size:24px;">🎉</span>
        <span style="font-size:15px;font-weight:800;color:#fff;margin-left:8px;vertical-align:middle;">Réservation confirmée !</span>
      </div>
      <div style="font-size:12px;color:rgba(255,255,255,0.35);margin-top:10px;">
        Place ${p.seatIndex} sur ${p.totalTickets} &nbsp;•&nbsp; ${p.passName}
      </div>
    </div>
    <p style="margin:0 0 24px;font-size:14px;color:rgba(255,255,255,0.65);line-height:1.7;">
      Bonjour <strong style="color:#fff;">${p.buyerName}</strong>,<br>
      votre billet est prêt. Présentez le QR code ci-dessous à l&apos;entrée.
    </p>
  </td></tr>

  <!-- ─── PHYSICAL TICKET ─────────────────────────────────── -->
  <tr><td style="background:${pal.bg1};padding:0 20px 8px;">
    <table width="100%" cellpadding="0" cellspacing="0"
      style="border-radius:16px;overflow:hidden;box-shadow:0 24px 64px rgba(0,0,0,0.6);">

      <!-- Ticket main body -->
      <tr>
        <!-- LEFT: event info -->
        <td style="background:linear-gradient(135deg,${pal.bg2},${pal.bg3});padding:28px 22px;vertical-align:top;width:58%;">
          <div style="font-size:9px;letter-spacing:4px;color:${pal.accent};font-weight:800;text-transform:uppercase;margin-bottom:10px;">◆ BILLET D&apos;ENTRÉE</div>
          <div style="font-size:18px;font-weight:900;color:#fff;line-height:1.25;margin-bottom:18px;">${p.eventTitle}</div>

          <table cellpadding="0" cellspacing="4">
            <tr>
              <td style="padding-bottom:10px;">
                <table cellpadding="0" cellspacing="0"><tr>
                  <td style="width:30px;height:30px;background:rgba(255,255,255,0.1);border-radius:8px;text-align:center;vertical-align:middle;font-size:13px;">📅</td>
                  <td style="padding-left:10px;font-size:12px;color:rgba(255,255,255,0.75);">${p.eventDate || 'Date à confirmer'}</td>
                </tr></table>
              </td>
            </tr>
            <tr>
              <td style="padding-bottom:18px;">
                <table cellpadding="0" cellspacing="0"><tr>
                  <td style="width:30px;height:30px;background:rgba(255,255,255,0.1);border-radius:8px;text-align:center;vertical-align:middle;font-size:13px;">📍</td>
                  <td style="padding-left:10px;font-size:12px;color:rgba(255,255,255,0.75);">${p.eventVenue || 'Lieu à confirmer'}</td>
                </tr></table>
              </td>
            </tr>
          </table>

          <div style="display:inline-block;background:${pal.accent};border-radius:99px;padding:7px 18px;">
            <span style="font-size:11px;font-weight:900;color:${pal.bg1};letter-spacing:1px;text-transform:uppercase;">${p.passName}</span>
          </div>
        </td>

        <!-- PERFORATED DIVIDER -->
        <td style="width:1px;background:repeating-linear-gradient(to bottom,transparent 0,transparent 5px,rgba(255,255,255,0.18) 5px,rgba(255,255,255,0.18) 10px);position:relative;overflow:visible;">
          <div style="width:18px;height:18px;background:${pal.bg1};border-radius:50%;position:absolute;top:-9px;left:-8px;"></div>
          <div style="width:18px;height:18px;background:${pal.bg1};border-radius:50%;position:absolute;bottom:-9px;left:-8px;"></div>
        </td>

        <!-- RIGHT: QR stub -->
        <td style="background:linear-gradient(135deg,${pal.bg3},${pal.bg2});padding:22px 16px;text-align:center;vertical-align:middle;width:42%;">
          <div style="font-size:8px;letter-spacing:3px;color:${pal.accent};font-weight:700;text-transform:uppercase;margin-bottom:12px;">SCANNER À L&apos;ENTRÉE</div>
          <div style="background:#fff;border-radius:12px;padding:10px;display:inline-block;box-shadow:0 8px 24px rgba(0,0,0,0.4);">
            <img src="${p.qrDataUrl}" width="120" height="120" alt="QR Code billet" style="display:block;">
          </div>
          <div style="margin-top:12px;font-size:9px;color:rgba(255,255,255,0.4);font-family:monospace;letter-spacing:1px;word-break:break-all;">${p.ticketCode}</div>
        </td>
      </tr>

      <!-- Ticket bottom strip -->
      <tr>
        <td colspan="3" style="background:rgba(0,0,0,0.35);padding:10px 22px;">
          <table width="100%" cellpadding="0" cellspacing="0"><tr>
            <td style="font-size:10px;color:rgba(255,255,255,0.3);">
              REF&nbsp;<span style="color:${pal.accent};font-family:monospace;font-weight:700;">${p.ticketCode}</span>
            </td>
            <td style="text-align:right;font-size:10px;color:rgba(255,255,255,0.25);">VoteMoi × MK PROG © ${yr}</td>
          </tr></table>
        </td>
      </tr>
    </table>
  </td></tr>

  <!-- ─── INSTRUCTIONS ────────────────────────────────────── -->
  <tr><td style="background:${pal.bg1};padding:28px 32px 32px;">
    <div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:14px;padding:22px;">
      <div style="font-size:11px;font-weight:800;color:${pal.accent};letter-spacing:2px;text-transform:uppercase;margin-bottom:16px;">Comment utiliser votre billet</div>
      <table cellpadding="0" cellspacing="0">
        <tr><td style="padding-bottom:12px;vertical-align:top;">
          <table cellpadding="0" cellspacing="0"><tr>
            <td style="width:32px;height:32px;background:rgba(255,255,255,0.06);border-radius:8px;text-align:center;vertical-align:middle;font-size:15px;flex-shrink:0;">📱</td>
            <td style="padding-left:12px;font-size:13px;color:rgba(255,255,255,0.65);vertical-align:middle;">Présentez le QR code à l&apos;entrée — sur téléphone ou imprimé</td>
          </tr></table>
        </td></tr>
        <tr><td style="padding-bottom:12px;vertical-align:top;">
          <table cellpadding="0" cellspacing="0"><tr>
            <td style="width:32px;height:32px;background:rgba(255,255,255,0.06);border-radius:8px;text-align:center;vertical-align:middle;font-size:15px;">🔒</td>
            <td style="padding-left:12px;font-size:13px;color:rgba(255,255,255,0.65);vertical-align:middle;">Ce billet est nominatif — utilisable une seule fois</td>
          </tr></table>
        </td></tr>
        <tr><td style="vertical-align:top;">
          <table cellpadding="0" cellspacing="0"><tr>
            <td style="width:32px;height:32px;background:rgba(255,255,255,0.06);border-radius:8px;text-align:center;vertical-align:middle;font-size:15px;">🪪</td>
            <td style="padding-left:12px;font-size:13px;color:rgba(255,255,255,0.65);vertical-align:middle;">Code de référence : <strong style="color:${pal.accent};font-family:monospace;">${p.ticketCode}</strong></td>
          </tr></table>
        </td></tr>
      </table>
    </div>
  </td></tr>

  <!-- ─── FOOTER ──────────────────────────────────────────── -->
  <tr><td style="background:#060610;border-radius:0 0 20px 20px;padding:20px 32px;text-align:center;">
    <div style="font-size:11px;color:rgba(255,255,255,0.2);line-height:1.9;">
      Vote<strong style="color:rgba(255,255,255,0.4);">Moi</strong> — Conçu &amp; développé par <strong style="color:rgba(255,255,255,0.4);">MK PROG</strong><br>
      © ${yr} VoteMoi. Tous droits réservés. | Ne pas transférer ce billet.
    </div>
  </td></tr>

</table>
</td></tr>
</table>
</body></html>`;
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

    // 4. Verrou atomique — empêche la double-émission en cas de double-clic / retry simultané
    // Si la commande est déjà PROCESSING ou PAID, un autre appel est en cours → on refuse
    const lockResult = await queryDb<any>(
      `UPDATE public.ticket_orders
         SET payment_status = 'PROCESSING', fapshi_trans_id = $1
       WHERE id = $2 AND payment_status = 'PENDING'
       RETURNING id`,
      [fapshiTransId || '', orderId]
    ).catch(() => []);

    if (!lockResult.length) {
      // Either already PROCESSING (race) or PAID (already done — resend existing tickets)
      const existingOrder = await queryDb<any>('SELECT * FROM public.ticket_orders WHERE id = $1 LIMIT 1', [orderId]);
      if (existingOrder[0]?.payment_status === 'PAID') {
        const existingTickets = await queryDb<any>('SELECT * FROM public.tickets WHERE order_ref = $1', [orderId]);
        const origin = request.headers.get('origin') || 'https://miss-template.netlify.app';
        return NextResponse.json({
          success: true, alreadyPaid: true, orderId,
          tickets: existingTickets.map((t: any) => ({ ticketCode: t.ticket_code, ticketUrl: `${origin}/billetterie/${t.ticket_code}` })),
          buyerName: order.buyer_name, buyerEmail: order.buyer_email,
          eventTitle, eventDate, eventVenue,
          passName: order.pass_name, quantity: order.quantity || 1, totalPrice: order.total_price,
        });
      }
      return NextResponse.json({
        success: false,
        error: 'Vérification déjà en cours. Merci de patienter quelques secondes.',
      }, { status: 409 });
    }

    // 5. Générer les billets (un par place)
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

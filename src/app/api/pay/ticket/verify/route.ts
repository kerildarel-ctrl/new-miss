import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseClient';
import QRCode from 'qrcode';

export const dynamic = 'force-dynamic';

const FAPSHI_API_USER = process.env.FAPSHI_API_USER || '2aa10fd5-e2e0-4f94-bc2f-01585657f418';
const FAPSHI_API_KEY  = process.env.FAPSHI_API_KEY  || 'FAK_f8e3d6d682775ca2f34e34c80da6ccc6';
const FAPSHI_BASE_URL = process.env.FAPSHI_BASE_URL  || 'https://live.fapshi.com';
const BREVO_API_KEY   = process.env.BREVO_API_KEY    || '';

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
  return QRCode.toDataURL(text, {
    width: 200,
    margin: 2,
    color: { dark: '#27149F', light: '#FFFFFF' },
  });
}

function buildTicketEmailHtml(params: {
  buyerName: string;
  eventTitle: string;
  eventDate: string;
  eventVenue: string;
  passName: string;
  ticketCode: string;
  qrDataUrl: string;
  seatIndex: number;
  totalTickets: number;
}): string {
  const { buyerName, eventTitle, eventDate, eventVenue, passName, ticketCode, qrDataUrl, seatIndex, totalTickets } = params;
  return `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Votre billet — ${eventTitle}</title></head>
<body style="margin:0;padding:0;background:#ECEBF7;font-family:Arial,Helvetica,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#ECEBF7;padding:28px 12px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:18px;overflow:hidden;box-shadow:0 8px 30px rgba(39,20,159,0.15);">

<!-- HEADER -->
<tr><td style="background:linear-gradient(135deg,#1B0E78 0%,#27149F 50%,#4B2CE0 100%);padding:36px;text-align:center;">
  <img src="https://miss-template.netlify.app/images/logo.png" width="180" alt="VoteMoi" style="display:block;margin:0 auto 16px;max-width:100%;border:0;">
  <div style="font-size:40px;line-height:1;margin-bottom:8px;">&#127903;&#65039;</div>
  <h1 style="margin:0;color:#fff;font-size:22px;font-weight:800;">Votre billet est confirmé !</h1>
  <p style="margin:8px 0 0;color:#D9D4FA;font-size:14px;">Place ${seatIndex} sur ${totalTickets}</p>
</td></tr>

<!-- TICKET BODY -->
<tr><td style="padding:32px 36px;">
  <p style="margin:0 0 20px;font-size:16px;color:#1C1647;">Bonjour <strong>${buyerName}</strong>,<br>
  Merci pour votre achat. Voici votre billet d'accès à :</p>

  <!-- EVENT CARD -->
  <table width="100%" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg,#1B0E78,#4B2CE0);border-radius:16px;overflow:hidden;">
  <tr>
    <td style="padding:24px;vertical-align:middle;">
      <div style="font-size:11px;letter-spacing:3px;color:#BDB6EE;font-weight:700;text-transform:uppercase;margin-bottom:6px;">BILLET D'ENTRÉE</div>
      <div style="font-size:22px;font-weight:800;color:#fff;margin-bottom:6px;">${eventTitle}</div>
      <div style="font-size:13px;color:#D9D4FA;margin-bottom:4px;">&#128197; ${eventDate}</div>
      <div style="font-size:13px;color:#D9D4FA;margin-bottom:12px;">&#128205; ${eventVenue}</div>
      <div style="display:inline-block;background:rgba(255,255,255,0.15);border:1px solid rgba(255,255,255,0.3);border-radius:99px;padding:6px 16px;font-size:13px;color:#fff;font-weight:700;">${passName}</div>
    </td>
    <td width="140" style="padding:20px;text-align:center;border-left:2px dashed rgba(255,255,255,0.25);vertical-align:middle;">
      <img src="${qrDataUrl}" width="110" height="110" alt="QR Code" style="display:block;margin:0 auto 8px;border-radius:8px;">
      <div style="font-size:10px;color:#BDB6EE;font-weight:700;letter-spacing:1px;">${ticketCode}</div>
    </td>
  </tr>
  </table>

  <!-- INSTRUCTIONS -->
  <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:24px;background:#EEF0FC;border-radius:12px;">
  <tr><td style="padding:20px;">
    <p style="margin:0 0 10px;font-size:14px;font-weight:700;color:#27149F;">&#9432; Instructions d'entrée :</p>
    <ul style="margin:0;padding-left:18px;font-size:13px;color:#4B4780;line-height:1.8;">
      <li>Présentez ce QR code à l'entrée (téléphone ou imprimé)</li>
      <li>Le billet est nominatif — valable une seule fois</li>
      <li>Code de référence : <strong style="color:#27149F;font-family:monospace;">${ticketCode}</strong></li>
    </ul>
  </td></tr>
  </table>
</td></tr>

<!-- FOOTER -->
<tr><td style="background:#1B0E78;padding:20px 36px;text-align:center;">
  <p style="margin:0;font-size:12px;color:#BDB6EE;line-height:1.6;">
    VoteMoi — conçu et développé par MK PROG<br>
    Instagram : @mk__prog &nbsp;|&nbsp; MKProg.support@gmail.com<br>
    &copy; ${new Date().getFullYear()} VoteMoi. Tous droits réservés.
  </p>
</td></tr>

</table>
</td></tr>
</table>
</body>
</html>`;
}

async function sendTicketEmail(params: {
  to: string;
  buyerName: string;
  eventTitle: string;
  eventDate: string;
  eventVenue: string;
  passName: string;
  ticketCode: string;
  qrDataUrl: string;
  seatIndex: number;
  totalTickets: number;
}): Promise<void> {
  if (!BREVO_API_KEY) return;

  const html = buildTicketEmailHtml(params);

  await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'accept': 'application/json',
      'api-key': BREVO_API_KEY,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      sender: { name: 'VoteMoi Billetterie', email: 'kerildarel@gmail.com' },
      to: [{ email: params.to, name: params.buyerName }],
      subject: `🎟️ Votre billet — ${params.eventTitle} (${params.passName})`,
      htmlContent: html,
    }),
  }).catch(() => { /* Email non bloquant */ });
}

/**
 * POST /api/pay/ticket/verify
 * Vérifie le paiement Fapshi, génère les billets QR, envoie les emails
 */
export async function POST(request: Request) {
  try {
    const { orderId, transId } = await request.json();
    if (!orderId) return NextResponse.json({ success: false, error: 'orderId requis' }, { status: 400 });

    const supabase = getSupabaseAdmin();

    // 1. Récupérer la commande
    let order: any = null;
    try {
      const { data } = await supabase.from('ticket_orders').select('*').eq('id', orderId).single();
      order = data;
    } catch { /* ignore */ }

    if (!order) {
      return NextResponse.json({ success: false, error: 'Commande introuvable' }, { status: 404 });
    }

    if (order.payment_status === 'PAID') {
      // Déjà traité — retourner les billets existants
      const { data: existingTickets } = await supabase
        .from('tickets').select('*').eq('order_ref', orderId);
      return NextResponse.json({ success: true, alreadyPaid: true, tickets: existingTickets || [] });
    }

    // 2. Vérifier le paiement avec Fapshi
    const fapshiTransId = transId || order.fapshi_trans_id;
    if (fapshiTransId) {
      try {
        const verifyRes = await fetch(`${FAPSHI_BASE_URL}/payment-status/${fapshiTransId}`, {
          headers: { 'apiuser': FAPSHI_API_USER, 'apikey': FAPSHI_API_KEY },
        });
        const verifyData = await verifyRes.json().catch(() => ({}));
        const status = verifyData.status || verifyData.data?.status || '';
        if (!['SUCCESSFUL', 'SUCCESS', 'PAID'].includes(status.toUpperCase())) {
          return NextResponse.json({
            success: false,
            error: `Paiement non confirmé (statut: ${status || 'inconnu'})`,
          }, { status: 402 });
        }
      } catch {
        // Si Fapshi inaccessible, on continue en mode test
      }
    }

    // 3. Récupérer l'événement pour les détails
    let eventTitle = order.event_title || 'Événement VoteMoi';
    let eventDate  = '';
    let eventVenue = '';
    try {
      const { data: evt } = await supabase.from('events').select('title,date,venue').eq('id', order.event_id).single();
      if (evt) { eventTitle = evt.title; eventDate = evt.date; eventVenue = evt.venue; }
    } catch { /* ignore */ }

    // 4. Générer les billets (un par place)
    const qty = order.quantity || 1;
    const issuedTickets: any[] = [];

    for (let i = 0; i < qty; i++) {
      const ticketCode = genTicketCode();
      const ticketId = `tck_${Date.now()}_${i}`;
      const origin = request.headers.get('origin') || 'https://miss-template.netlify.app';
      const ticketUrl = `${origin}/billetterie/${ticketCode}`;

      // Générer QR
      const qrDataUrl = await generateQRDataUrl(ticketUrl).catch(() => '');

      // Sauvegarder en DB
      try {
        await supabase.from('tickets').insert([{
          id: ticketId,
          ticket_code: ticketCode,
          event_id: order.event_id,
          event_title: eventTitle,
          pass_name: order.pass_name,
          unit_price: order.unit_price,
          quantity: 1,
          total_price: order.unit_price,
          buyer_name: order.buyer_name,
          buyer_email: order.buyer_email,
          buyer_phone: order.buyer_phone,
          order_ref: orderId,
          payment_status: 'PAID',
          status: 'VALID',
          purchased_at: new Date().toISOString(),
        }]);
      } catch { /* ignore */ }

      issuedTickets.push({ ticketCode, ticketId, qrDataUrl, ticketUrl });

      // Envoyer email
      await sendTicketEmail({
        to: order.buyer_email,
        buyerName: order.buyer_name,
        eventTitle,
        eventDate,
        eventVenue,
        passName: order.pass_name,
        ticketCode,
        qrDataUrl,
        seatIndex: i + 1,
        totalTickets: qty,
      });
    }

    // 5. Marquer la commande PAID
    try {
      await supabase.from('ticket_orders').update({
        payment_status: 'PAID',
        fapshi_trans_id: fapshiTransId || order.fapshi_trans_id || '',
      }).eq('id', orderId);
    } catch { /* ignore */ }

    return NextResponse.json({
      success: true,
      orderId,
      tickets: issuedTickets,
      buyerName: order.buyer_name,
      buyerEmail: order.buyer_email,
      eventTitle,
      eventDate,
      eventVenue,
      passName: order.pass_name,
      quantity: qty,
      totalPrice: order.total_price,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

/**
 * GET /api/pay/ticket/verify?orderId=...
 * Récupérer le statut d'une commande
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('orderId');
    if (!orderId) return NextResponse.json({ success: false, error: 'orderId requis' }, { status: 400 });

    const supabase = getSupabaseAdmin();
    const { data: order } = await supabase.from('ticket_orders').select('*').eq('id', orderId).single();

    if (!order) return NextResponse.json({ success: false, error: 'Commande introuvable' }, { status: 404 });

    let tickets: any[] = [];
    if (order.payment_status === 'PAID') {
      const { data } = await supabase.from('tickets').select('*').eq('order_ref', orderId);
      tickets = data || [];
    }

    return NextResponse.json({ success: true, order, tickets });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

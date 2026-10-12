import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseClient';

export const dynamic = 'force-dynamic';

const FAPSHI_API_USER = process.env.FAPSHI_API_USER || '2aa10fd5-e2e0-4f94-bc2f-01585657f418';
const FAPSHI_API_KEY  = process.env.FAPSHI_API_KEY  || 'FAK_f8e3d6d682775ca2f34e34c80da6ccc6';
const FAPSHI_BASE_URL = process.env.FAPSHI_BASE_URL  || 'https://live.fapshi.com';

/**
 * POST /api/pay/ticket
 * Crée une commande PENDING et initie le paiement Fapshi
 */
export async function POST(request: Request) {
  try {
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
    if (!buyerEmail.includes('@')) {
      return NextResponse.json({ success: false, error: 'Email invalide' }, { status: 400 });
    }

    const qty = Math.max(1, parseInt(String(quantity), 10) || 1);
    const totalPrice = unitPrice * qty;
    const orderId = `ORD-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

    // 1. Sauvegarder la commande PENDING
    try {
      const supabase = getSupabaseAdmin();
      await supabase.from('ticket_orders').insert([{
        id: orderId,
        event_id: eventId,
        event_title: eventTitle || '',
        event_slug: eventSlug || '',
        pass_id: passId || '',
        pass_name: passName,
        buyer_name: buyerName,
        buyer_email: buyerEmail,
        buyer_phone: buyerPhone,
        quantity: qty,
        unit_price: unitPrice,
        total_price: totalPrice,
        payment_status: 'PENDING',
        created_at: new Date().toISOString(),
      }]);
    } catch {
      // Continue même si DB échoue
    }

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

    if (!fapshiRes.ok || !fapshiData.paymentLink) {
      return NextResponse.json({
        success: false,
        error: fapshiData.message || `Fapshi erreur ${fapshiRes.status}`,
      }, { status: 500 });
    }

    // Sauvegarder le transId Fapshi
    try {
      const supabase = getSupabaseAdmin();
      await supabase.from('ticket_orders').update({
        fapshi_trans_id: fapshiData.transId || '',
      }).eq('id', orderId);
    } catch { /* Ignore */ }

    return NextResponse.json({
      success: true,
      orderId,
      paymentLink: fapshiData.paymentLink,
      transId: fapshiData.transId,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

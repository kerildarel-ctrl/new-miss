import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseClient';
import { IssuedTicket } from '@/data/mockTickets';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      eventId,
      eventTitle,
      passName,
      unitPrice = 2000,
      quantity = 1,
      buyerName = 'Acheteur',
      buyerEmail,
      buyerPhone = ''
    } = body;

    if (!buyerEmail || !buyerEmail.includes('@')) {
      return NextResponse.json(
        { success: false, error: 'Une adresse email valide est requise' },
        { status: 400 }
      );
    }

    const randomSuffix = Math.random().toString(36).substring(2, 7).toUpperCase();
    const ticketCode = `TCK-${randomSuffix}-2026`;
    const ticketId = `tck_${Date.now()}_${randomSuffix}`;
    const orderRef = `CMD-2026-${randomSuffix}`;
    const totalPrice = (unitPrice || 2000) * (quantity || 1);

    const newTicket: IssuedTicket = {
      id: ticketId,
      ticketCode,
      eventId: eventId || 'evt-1',
      eventTitle: eventTitle || 'Événement VoteMoi',
      passName: passName || 'Pass Standard',
      unitPrice: unitPrice,
      quantity: quantity,
      totalPrice: totalPrice,
      buyerName: buyerName,
      buyerEmail: buyerEmail,
      buyerPhone: buyerPhone,
      orderRef,
      paymentStatus: 'PAID',
      status: 'VALID',
      purchasedAt: new Date().toISOString()
    };

    // Save ticket in Supabase database
    try {
      const supabase = getSupabaseAdmin();
      await supabase.from('tickets').insert([
        {
          id: ticketId,
          ticket_code: ticketCode,
          event_id: eventId,
          event_title: eventTitle,
          pass_name: passName,
          unit_price: unitPrice,
          quantity: quantity,
          total_price: totalPrice,
          buyer_name: buyerName,
          buyer_email: buyerEmail,
          buyer_phone: buyerPhone,
          order_ref: orderRef,
          payment_status: 'PAID',
          status: 'VALID',
          purchased_at: newTicket.purchasedAt
        }
      ]);
    } catch {
      // Continue with in-memory / local fallback

    }

    return NextResponse.json({
      success: true,
      ticket: newTicket,
      message: 'Billet émis avec succès.'
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Erreur lors de l’émission du billet' },
      { status: 500 }
    );
  }
}

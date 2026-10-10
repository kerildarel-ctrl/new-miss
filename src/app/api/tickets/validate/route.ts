import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseClient';
import { INITIAL_ISSUED_TICKETS, IssuedTicket } from '@/data/mockTickets';

// In-memory persistent cache fallback for demo serverless runtime
const localTicketStore: Map<string, IssuedTicket> = new Map();

// Populate initial mock tickets in memory cache
INITIAL_ISSUED_TICKETS.forEach((t) => {
  localTicketStore.set(t.ticketCode, t);
  localTicketStore.set(t.id, t);
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { ticketCode, ticketId } = body;
    const queryCode = (ticketCode || ticketId || '').trim().toUpperCase();

    if (!queryCode) {
      return NextResponse.json(
        { success: false, status: 'INVALID', error: 'Code de billet requis' },
        { status: 400 }
      );
    }

    let foundTicket: IssuedTicket | null = null;

    // 1. Check Supabase
    try {
      const supabase = getSupabaseAdmin();
      const { data } = await supabase
        .from('tickets')
        .select('*')
        .or(`ticket_code.eq.${queryCode},id.eq.${queryCode}`)
        .maybeSingle();

      if (data) {
        foundTicket = {
          id: data.id,
          ticketCode: data.ticket_code,
          eventId: data.event_id,
          eventTitle: data.event_title,
          passName: data.pass_name,
          unitPrice: data.unit_price,
          quantity: data.quantity,
          totalPrice: data.total_price,
          buyerName: data.buyer_name,
          buyerEmail: data.buyer_email,
          buyerPhone: data.buyer_phone,
          status: data.status,
          purchasedAt: data.purchased_at,
          scannedAt: data.scanned_at,
        };
      }
    } catch {
      // Supabase table not created or network issue
    }

    // 2. Check local memory store if not found in Supabase
    if (!foundTicket) {
      foundTicket = localTicketStore.get(queryCode) || null;
    }

    // 3. Handle Ticket Not Found
    if (!foundTicket) {
      return NextResponse.json({
        success: false,
        status: 'NOT_FOUND',
        message: '⛔ BILLET INVALIDE OU INCONNU',
      });
    }

    // 4. Handle Single-Use Check (Already Scanned / Used)
    if (foundTicket.status === 'USED') {
      const formattedScanTime = foundTicket.scannedAt
        ? new Date(foundTicket.scannedAt).toLocaleTimeString('fr-FR', {
            hour: '2-digit',
            minute: '2-digit',
          })
        : 'Précédemment';

      return NextResponse.json({
        success: false,
        status: 'ALREADY_USED',
        message: `🔴 BILLET DÉJÀ UTILISÉ (${formattedScanTime}) ! ACCÈS REFUSÉ.`,
        ticket: foundTicket,
      });
    }

    // 5. Single-Use Validation Success (Mark as USED)
    const scanTime = new Date().toISOString();
    const updatedTicket: IssuedTicket = {
      ...foundTicket,
      status: 'USED',
      scannedAt: scanTime,
    };

    // Save in memory store
    localTicketStore.set(updatedTicket.ticketCode, updatedTicket);
    localTicketStore.set(updatedTicket.id, updatedTicket);

    // Update Supabase
    try {
      const supabase = getSupabaseAdmin();
      await supabase
        .from('tickets')
        .update({ status: 'USED', scanned_at: scanTime })
        .or(`ticket_code.eq.${queryCode},id.eq.${queryCode}`);
    } catch {
      // Memory store already updated
    }

    return NextResponse.json({
      success: true,
      status: 'VALIDATED',
      message: '🟢 BILLET VALIDE - ACCÈS AUTORISÉ',
      ticket: updatedTicket,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, status: 'ERROR', error: error.message || 'Erreur lors de la validation' },
      { status: 500 }
    );
  }
}

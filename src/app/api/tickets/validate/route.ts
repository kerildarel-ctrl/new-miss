import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseClient';
import { isServerAdminAuthorized } from '@/lib/adminAuth';
import { INITIAL_ISSUED_TICKETS, IssuedTicket } from '@/data/mockTickets';

// In-memory store fallback with mutual exclusion lock
const inMemoryTickets = new Map<string, IssuedTicket>();
INITIAL_ISSUED_TICKETS.forEach((t) => inMemoryTickets.set(t.ticketCode.toUpperCase(), t));

export async function POST(request: Request) {
  try {
    // 1. Check Server-Side Authorization (/keril admin or authorized agent)
    const auth = isServerAdminAuthorized(request);
    if (!auth.authorized) {
      return NextResponse.json(
        {
          success: false,
          code: 'UNAUTHORIZED',
          message: 'ACCÈS REFUSÉ — Vous devez être connecté sur /keril pour valider une entrée.',
        },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { ticketCode, ticketId, expectedEventId } = body;
    const queryCode = (ticketCode || ticketId || '').trim().toUpperCase();

    if (!queryCode) {
      return NextResponse.json(
        {
          success: false,
          code: 'INVALID',
          message: 'BILLET INVALIDE — Entrée refusée.',
        },
        { status: 400 }
      );
    }

    const agentId = auth.agentId || 'admin-keril';
    const agentName = auth.agentName || 'Admin /keril';

    // 2. Try Atomic Execution via Supabase RPC function if available
    try {
      const supabase = getSupabaseAdmin();
      const { data: rpcResult, error: rpcError } = await supabase.rpc('validate_ticket_entry', {
        p_ticket_code: queryCode,
        p_agent_id: agentId,
        p_agent_name: agentName,
      });

      if (!rpcError && rpcResult) {
        return NextResponse.json(rpcResult);
      }
    } catch {
      // RPC not installed yet or error, proceed to direct atomic SQL update
    }

    // 3. Direct Atomic Database Check & Update via Supabase Client
    try {
      const supabase = getSupabaseAdmin();

      // Step A: Find the ticket first
      const { data: foundRow } = await supabase
        .from('tickets')
        .select('*')
        .or(`ticket_code.ilike.${queryCode},id.eq.${queryCode}`)
        .maybeSingle();

      if (foundRow) {
        // Condition: Event mismatch
        if (expectedEventId && foundRow.event_id !== expectedEventId) {
          return NextResponse.json({
            success: false,
            code: 'INVALID',
            message: 'BILLET INVALIDE — Entrée refusée (Événement non correspondant).',
            ticket: foundRow,
          });
        }

        // Condition: Payment not confirmed
        const paymentStatus = (foundRow.payment_status || 'PAID').toUpperCase();
        if (!['PAID', 'SUCCESSFUL', 'CONFIRMED'].includes(paymentStatus)) {
          return NextResponse.json({
            success: false,
            code: 'UNPAID',
            message: 'PAIEMENT NON CONFIRMÉ — Entrée refusée.',
            ticket: foundRow,
          });
        }

        // Condition: Already used
        if (foundRow.status === 'USED') {
          const scanTime = foundRow.scanned_at
            ? new Date(foundRow.scanned_at).toLocaleTimeString('fr-FR', {
                hour: '2-digit',
                minute: '2-digit',
              })
            : '';
          const scanDate = foundRow.scanned_at
            ? new Date(foundRow.scanned_at).toLocaleDateString('fr-FR')
            : '';
          const byAgent = foundRow.scanned_by_agent_name || 'Agent /keril';

          return NextResponse.json({
            success: false,
            code: 'ALREADY_USED',
            message: `BILLET DÉJÀ UTILISÉ — Entrée refusée (Validé le ${scanDate} à ${scanTime} par ${byAgent}).`,
            scannedAt: foundRow.scanned_at,
            scannedByAgentName: byAgent,
            ticket: foundRow,
          });
        }

        // Step B: Atomic conditional update (status must be VALID)
        const nowIso = new Date().toISOString();
        const { data: updatedRows, error: updateError } = await supabase
          .from('tickets')
          .update({
            status: 'USED',
            scanned_at: nowIso,
            scanned_by_agent_id: agentId,
            scanned_by_agent_name: agentName,
          })
          .eq('id', foundRow.id)
          .eq('status', 'VALID')
          .select();

        if (updateError || !updatedRows || updatedRows.length === 0) {
          // Concurrency collision: another agent validated it in the exact same millisecond
          return NextResponse.json({
            success: false,
            code: 'ALREADY_USED',
            message: 'BILLET DÉJÀ UTILISÉ — Entrée refusée.',
          });
        }

        const updatedTicket = updatedRows[0];

        // Insert log
        try {
          await supabase.from('ticket_validation_logs').insert([
            {
              id: `log_${Date.now()}`,
              ticket_code: updatedTicket.ticket_code,
              event_id: updatedTicket.event_id,
              event_title: updatedTicket.event_title,
              action: 'VALIDATED',
              agent_id: agentId,
              agent_name: agentName,
              timestamp: nowIso,
            },
          ]);
        } catch {
          // Ignore log error
        }

        return NextResponse.json({
          success: true,
          code: 'VALIDATED',
          message: 'ENTRÉE VALIDÉE — Billet accepté.',
          ticket: updatedTicket,
        });
      }
    } catch {
      // Fall through to memory store fallback
    }

    // 4. Memory Store Fallback
    const mem = inMemoryTickets.get(queryCode);
    if (!mem) {
      return NextResponse.json(
        {
          success: false,
          code: 'INVALID',
          message: 'BILLET INVALIDE — Entrée refusée.',
        },
        { status: 404 }
      );
    }

    if (mem.paymentStatus && !['PAID', 'SUCCESSFUL', 'CONFIRMED'].includes(mem.paymentStatus)) {
      return NextResponse.json({
        success: false,
        code: 'UNPAID',
        message: 'PAIEMENT NON CONFIRMÉ — Entrée refusée.',
        ticket: mem,
      });
    }

    if (mem.status === 'USED') {
      const scanTime = mem.scannedAt
        ? new Date(mem.scannedAt).toLocaleTimeString('fr-FR', {
            hour: '2-digit',
            minute: '2-digit',
          })
        : '';
      return NextResponse.json({
        success: false,
        code: 'ALREADY_USED',
        message: `BILLET DÉJÀ UTILISÉ — Entrée refusée (Validé à ${scanTime}).`,
        ticket: mem,
      });
    }

    // Mark as USED
    mem.status = 'USED';
    mem.scannedAt = new Date().toISOString();
    mem.scannedByAgentId = agentId;
    mem.scannedByAgentName = agentName;
    inMemoryTickets.set(mem.ticketCode.toUpperCase(), mem);

    return NextResponse.json({
      success: true,
      code: 'VALIDATED',
      message: 'ENTRÉE VALIDÉE — Billet accepté.',
      ticket: mem,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        code: 'ERROR',
        message: error.message || 'Erreur interne lors de la validation.',
      },
      { status: 500 }
    );
  }
}

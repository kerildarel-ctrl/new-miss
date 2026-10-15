import { NextResponse } from 'next/server';
import { queryDb } from '@/lib/pgDb';
import { isServerAdminAuthorized } from '@/lib/adminAuth';
import { INITIAL_ISSUED_TICKETS, IssuedTicket } from '@/data/mockTickets';

// Memory fallback (dev only)
const inMemoryTickets = new Map<string, IssuedTicket>();
INITIAL_ISSUED_TICKETS.forEach((t) => inMemoryTickets.set(t.ticketCode.toUpperCase(), t));

export async function POST(request: Request) {
  try {
    const auth = isServerAdminAuthorized(request);
    if (!auth.authorized) {
      return NextResponse.json(
        { success: false, code: 'UNAUTHORIZED', message: 'ACCÈS REFUSÉ — Vous devez être connecté sur /keril pour valider une entrée.' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { ticketCode, ticketId, expectedEventId } = body;
    const queryCode = (ticketCode || ticketId || '').trim().toUpperCase();

    if (!queryCode) {
      return NextResponse.json(
        { success: false, code: 'INVALID', message: 'BILLET INVALIDE — Entrée refusée.' },
        { status: 400 }
      );
    }

    const agentId   = auth.agentId   || 'admin-keril';
    const agentName = auth.agentName || 'Admin /keril';

    // ── PRIMARY: Neon PostgreSQL ───────────────────────────────────────────
    try {
      const rows = await queryDb<any>(
        'SELECT * FROM public.tickets WHERE UPPER(ticket_code) = $1 LIMIT 1',
        [queryCode]
      );

      if (rows.length) {
        const foundRow = rows[0];

        // Event mismatch
        if (expectedEventId && foundRow.event_id !== expectedEventId) {
          return NextResponse.json({
            success: false, code: 'INVALID',
            message: 'BILLET INVALIDE — Entrée refusée (Événement non correspondant).',
            ticket: foundRow,
          });
        }

        // Payment not confirmed
        const paymentStatus = (foundRow.payment_status || 'PAID').toUpperCase();
        if (!['PAID', 'SUCCESSFUL', 'CONFIRMED'].includes(paymentStatus)) {
          return NextResponse.json({
            success: false, code: 'UNPAID',
            message: 'PAIEMENT NON CONFIRMÉ — Entrée refusée.',
            ticket: foundRow,
          });
        }

        // Already used
        if (foundRow.status === 'USED') {
          const scanTime = foundRow.scanned_at
            ? new Date(foundRow.scanned_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
            : '';
          const scanDate = foundRow.scanned_at
            ? new Date(foundRow.scanned_at).toLocaleDateString('fr-FR')
            : '';
          const byAgent = foundRow.scanned_by_agent_name || 'Agent';
          return NextResponse.json({
            success: false, code: 'ALREADY_USED',
            message: `BILLET DÉJÀ UTILISÉ — Entrée refusée (Validé le ${scanDate} à ${scanTime} par ${byAgent}).`,
            scannedAt: foundRow.scanned_at,
            scannedByAgentName: byAgent,
            ticket: foundRow,
          });
        }

        // Atomic update: only if still VALID (prevents race conditions)
        const nowIso = new Date().toISOString();
        const updated = await queryDb<any>(
          `UPDATE public.tickets
             SET status = 'USED', scanned_at = $1, scanned_by_agent_name = $2
           WHERE UPPER(ticket_code) = $3 AND status = 'VALID'
           RETURNING *`,
          [nowIso, agentName, queryCode]
        );

        if (!updated.length) {
          // Race condition: someone else validated it in the same ms
          return NextResponse.json({
            success: false, code: 'ALREADY_USED',
            message: 'BILLET DÉJÀ UTILISÉ — Entrée refusée.',
          });
        }

        return NextResponse.json({
          success: true, code: 'VALIDATED',
          message: 'ENTRÉE VALIDÉE ✅ — Billet accepté.',
          ticket: updated[0],
        });
      }
    } catch (pgErr) {
      console.warn('[validate] Neon error, falling back to memory:', pgErr);
    }

    // ── MEMORY FALLBACK (dev / mock) ───────────────────────────────────────
    const mem = inMemoryTickets.get(queryCode);
    if (!mem) {
      return NextResponse.json(
        { success: false, code: 'INVALID', message: 'BILLET INVALIDE — Entrée refusée.' },
        { status: 404 }
      );
    }

    if (mem.paymentStatus && !['PAID', 'SUCCESSFUL', 'CONFIRMED'].includes(mem.paymentStatus)) {
      return NextResponse.json({ success: false, code: 'UNPAID', message: 'PAIEMENT NON CONFIRMÉ — Entrée refusée.', ticket: mem });
    }

    if (mem.status === 'USED') {
      const scanTime = mem.scannedAt
        ? new Date(mem.scannedAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
        : '';
      return NextResponse.json({ success: false, code: 'ALREADY_USED', message: `BILLET DÉJÀ UTILISÉ — Entrée refusée (Validé à ${scanTime}).`, ticket: mem });
    }

    mem.status = 'USED';
    mem.scannedAt = new Date().toISOString();
    mem.scannedByAgentId = agentId;
    mem.scannedByAgentName = agentName;
    inMemoryTickets.set(mem.ticketCode.toUpperCase(), mem);

    return NextResponse.json({ success: true, code: 'VALIDATED', message: 'ENTRÉE VALIDÉE ✅ — Billet accepté.', ticket: mem });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, code: 'ERROR', message: error.message || 'Erreur interne lors de la validation.' },
      { status: 500 }
    );
  }
}

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle, XCircle, RefreshCw, Download } from 'lucide-react';

interface IssuedTicket {
  ticketCode: string;
  ticketUrl?: string;
  qrDataUrl?: string;
}

interface OrderResult {
  success: boolean;
  orderId: string;
  tickets: IssuedTicket[];
  buyerName: string;
  buyerEmail: string;
  eventTitle: string;
  eventDate: string;
  eventVenue: string;
  passName: string;
  quantity: number;
  totalPrice: number;
  alreadyPaid?: boolean;
  error?: string;
}

export default function ConfirmationPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const orderId = params?.orderId as string;
  const transId = searchParams?.get('transId') || searchParams?.get('trans_id') || '';

  const [result, setResult] = useState<OrderResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [retryCount, setRetryCount] = useState(0);

  const verify = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/pay/ticket/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, transId }),
      });
      const data = await res.json();
      setResult(data);
    } catch {
      setResult({ success: false, error: 'Erreur réseau', orderId, tickets: [], buyerName: '', buyerEmail: '', eventTitle: '', eventDate: '', eventVenue: '', passName: '', quantity: 0, totalPrice: 0 });
    } finally {
      setLoading(false);
    }
  }, [orderId, transId]);

  useEffect(() => { verify(); }, [verify]);

  // ── PDF download via Blob URL (works on mobile Safari + Chrome Android) ──
  const handleDownloadPDF = (ticket: IssuedTicket, index: number) => {
    if (!result) return;
    const qrImg = ticket.qrDataUrl
      ? `<img src="${ticket.qrDataUrl}" width="140" height="140" style="display:block;border-radius:10px;" />`
      : '';
    const html = `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"/><title>Billet ${result.passName} — ${result.eventTitle}</title>
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap');
      *{margin:0;padding:0;box-sizing:border-box}
      body{font-family:'Inter',sans-serif;background:#0f0a1e;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px}
      .ticket{background:linear-gradient(135deg,#1B0E78,#4B2CE0);border-radius:24px;max-width:520px;width:100%;overflow:hidden;box-shadow:0 24px 64px rgba(0,0,0,0.7)}
      .top{display:flex;min-height:200px}
      .left{flex:1;padding:28px 22px;background:linear-gradient(135deg,#1B0E78,#2D1EA0)}
      .divider{width:2px;background:repeating-linear-gradient(to bottom,transparent 0,transparent 5px,rgba(255,255,255,0.15) 5px,rgba(255,255,255,0.15) 10px)}
      .right{width:180px;padding:20px 16px;text-align:center;display:flex;flex-direction:column;align-items:center;justify-content:center;background:linear-gradient(135deg,#2D1EA0,#1B0E78)}
      .label{font-size:9px;letter-spacing:4px;color:#a78bfa;font-weight:800;text-transform:uppercase;margin-bottom:10px}
      .title{font-size:18px;font-weight:900;color:#fff;line-height:1.3;margin-bottom:18px}
      .info{display:flex;align-items:center;gap:8px;margin-bottom:10px;font-size:12px;color:rgba(255,255,255,0.75)}
      .badge{display:inline-block;background:#a78bfa;color:#0f0a1e;font-size:11px;font-weight:900;padding:6px 16px;border-radius:99px;letter-spacing:1px;text-transform:uppercase}
      .qr-label{font-size:8px;letter-spacing:3px;color:#a78bfa;font-weight:700;text-transform:uppercase;margin-bottom:10px}
      .qr-wrap{background:#fff;border-radius:12px;padding:8px;display:inline-block;box-shadow:0 8px 24px rgba(0,0,0,0.4)}
      .code{margin-top:10px;font-size:9px;color:rgba(255,255,255,0.4);font-family:monospace;word-break:break-all}
      .bottom{background:rgba(0,0,0,0.35);padding:10px 22px;display:flex;justify-content:space-between;align-items:center}
      .bottom-ref{font-size:10px;color:rgba(255,255,255,0.35)}
      .bottom-brand{font-size:10px;color:rgba(255,255,255,0.2)}
      .accent{color:#a78bfa;font-family:monospace;font-weight:700}
      @media print{body{background:#fff}}
    </style></head><body>
    <div class="ticket">
      <div class="top">
        <div class="left">
          <div class="label">◆ BILLET D\'ENTRÉE ${index + 1}/${result.tickets.length}</div>
          <div class="title">${result.eventTitle}</div>
          <div class="info">&#128197; ${result.eventDate || 'Date à confirmer'}</div>
          <div class="info">&#128205; ${result.eventVenue || 'Lieu à confirmer'}</div>
          <div class="badge">${result.passName}</div>
        </div>
        <div class="divider"></div>
        <div class="right">
          <div class="qr-label">SCANNER À L\'ENTRÉE</div>
          <div class="qr-wrap">${qrImg}</div>
          <div class="code">${ticket.ticketCode}</div>
        </div>
      </div>
      <div class="bottom">
        <div class="bottom-ref">RÉF <span class="accent">${ticket.ticketCode}</span></div>
        <div class="bottom-brand">VoteMoi × MK PROG © 2026</div>
      </div>
    </div>
    <script>window.onload=function(){window.print();setTimeout(function(){window.close();},1500);}<\/script>
    </body></html>`;

    // Use Blob URL — bypasses mobile popup blockers (Safari iOS, Chrome Android)
    try {
      const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
      const blobUrl = URL.createObjectURL(blob);
      const win = window.open(blobUrl, '_blank');
      // Revoke after 30s to free memory
      setTimeout(() => URL.revokeObjectURL(blobUrl), 30_000);
      if (!win) {
        // Fallback: navigate current tab (last resort for strict popup blockers)
        window.location.href = blobUrl;
      }
    } catch {
      // Ultimate fallback: data URL
      const dataUrl = 'data:text/html;charset=utf-8,' + encodeURIComponent(html);
      window.open(dataUrl, '_blank');
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: 'var(--soft)' }}>
        <div style={{ textAlign: 'center' }}>
          <RefreshCw style={{ width: '40px', height: '40px', color: 'var(--p)', margin: '0 auto 16px', animation: 'spin 1s linear infinite', display: 'block' }} />
          <h2 style={{ fontWeight: 800, fontSize: '1.3rem' }}>Vérification du paiement…</h2>
          <p style={{ color: 'var(--mute)', marginTop: '8px' }}>Merci de patienter quelques secondes.</p>
        </div>
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!result?.success) {
    return (
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: 'var(--soft)', padding: '20px' }}>
        <div style={{ background: 'var(--bg)', borderRadius: '24px', padding: '40px', maxWidth: '480px', width: '100%', textAlign: 'center', border: '1.5px solid var(--line)' }}>
          <XCircle style={{ width: '56px', height: '56px', color: '#ef4444', margin: '0 auto 16px', display: 'block' }} />
          <h2 style={{ fontWeight: 900, fontSize: '1.5rem', marginBottom: '12px' }}>Paiement non confirmé</h2>
          <p style={{ color: 'var(--mute)', lineHeight: 1.6, marginBottom: '24px' }}>
            {result?.error || 'Votre paiement n\'a pas encore été confirmé. Si vous avez payé, cliquez sur Réessayer.'}
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <button
              type="button"
              onClick={() => { setRetryCount(r => r + 1); verify(); }}
              style={{ padding: '14px', borderRadius: '12px', background: 'var(--p)', color: '#fff', border: 'none', fontWeight: 800, cursor: 'pointer', fontSize: '0.95rem' }}
            >
              🔄 Réessayer {retryCount > 0 ? `(${retryCount})` : ''}
            </button>
            <Link href="/billetterie/evenements" style={{ padding: '14px', borderRadius: '12px', background: 'var(--soft)', border: '1.5px solid var(--line)', fontWeight: 700, textDecoration: 'none', color: 'var(--ink)', fontSize: '0.9rem', display: 'block' }}>
              Retour aux événements
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--soft)', padding: 'clamp(20px,4vw,48px) clamp(16px,4vw,32px)' }}>
      <div style={{ maxWidth: '640px', margin: '0 auto' }}>

        {/* SUCCESS HEADER */}
        <div style={{
          background: 'linear-gradient(135deg,#1B0E78,#4B2CE0)',
          borderRadius: '24px', padding: '36px', textAlign: 'center', marginBottom: '24px',
        }}>
          <CheckCircle style={{ width: '56px', height: '56px', color: '#6ee7b7', margin: '0 auto 16px', display: 'block' }} />
          <h1 style={{ color: '#fff', fontWeight: 900, fontSize: 'clamp(1.4rem,4vw,2rem)', margin: '0 0 8px' }}>
            Paiement confirmé ! 🎉
          </h1>
          <p style={{ color: '#D9D4FA', margin: '0 0 16px', fontSize: '0.95rem', lineHeight: 1.6 }}>
            {result.quantity} billet{result.quantity > 1 ? 's' : ''} pour <strong>{result.eventTitle}</strong><br />
            envoyé{result.quantity > 1 ? 's' : ''} à <strong>{result.buyerEmail}</strong>
          </p>
          <div style={{ display: 'inline-flex', gap: '16px', flexWrap: 'wrap', justifyContent: 'center' }}>
            <div style={{ background: 'rgba(255,255,255,0.12)', borderRadius: '12px', padding: '8px 16px', fontSize: '0.82rem', color: '#D9D4FA' }}>
              📧
              Email envoyé
            </div>
            <div style={{ background: 'rgba(255,255,255,0.12)', borderRadius: '12px', padding: '8px 16px', fontSize: '0.82rem', color: '#D9D4FA' }}>
              💰 {result.totalPrice?.toLocaleString('fr-FR')} FCFA
            </div>
          </div>
        </div>

        {/* TICKETS */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
          {result.tickets.map((ticket, i) => (
            <div key={ticket.ticketCode} style={{
              background: 'var(--bg)', borderRadius: '20px', border: '1.5px solid var(--line)',
              overflow: 'hidden',
            }}>
              {/* Ticket header */}
              <div style={{ background: 'linear-gradient(135deg,#1B0E78,#27149F)', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <p style={{ margin: 0, fontSize: '0.7rem', color: '#BDB6EE', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                    BILLET {i + 1}/{result.tickets.length} · {result.passName}
                  </p>
                  <p style={{ margin: '4px 0 0', color: '#fff', fontWeight: 800, fontSize: '1rem' }}>{result.buyerName}</p>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '1.8rem' }}>🎟️</div>
                </div>
              </div>

              {/* QR + info */}
              <div style={{ padding: '20px', display: 'flex', gap: '20px', alignItems: 'center', flexWrap: 'wrap' }}>
                {ticket.qrDataUrl && (
                  <div style={{ flexShrink: 0 }}>
                    <img src={ticket.qrDataUrl} alt="QR" width={120} height={120} style={{ borderRadius: '12px', display: 'block' }} />
                  </div>
                )}
                <div style={{ flex: 1, minWidth: '160px' }}>
                  <p style={{ margin: '0 0 6px', fontSize: '0.75rem', color: 'var(--mute)', fontWeight: 700, textTransform: 'uppercase' }}>Code</p>
                  <p style={{ margin: '0 0 12px', fontFamily: 'monospace', fontWeight: 900, fontSize: '1.1rem', color: 'var(--p)', letterSpacing: '0.05em' }}>
                    {ticket.ticketCode}
                  </p>
                  <p style={{ margin: '0 0 4px', fontSize: '0.82rem', color: 'var(--mute)' }}>📅 {result.eventDate}</p>
                  <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--mute)' }}>📍 {result.eventVenue}</p>
                </div>
              </div>

              {/* Validate link */}
              <div style={{ padding: '0 20px 16px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => handleDownloadPDF(ticket, i)}
                  style={{ padding: '10px 18px', borderRadius: '10px', background: 'linear-gradient(135deg,#4B2CE0,#6d28d9)', color: '#fff', fontWeight: 800, border: 'none', fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '7px', cursor: 'pointer', boxShadow: '0 4px 16px rgba(91,61,245,0.35)' }}
                >
                  <Download style={{ width: '16px', height: '16px' }} />
                  Télécharger mon billet (PDF)
                </button>
                {/* Guard against undefined ticketCode (#4) */}
                {ticket.ticketCode && (
                  <Link
                    href={`/billetterie/${ticket.ticketCode}`}
                    style={{ padding: '10px 16px', borderRadius: '10px', background: 'rgba(255,255,255,0.06)', border: '1.5px solid rgba(255,255,255,0.12)', color: 'var(--ink)', fontWeight: 700, textDecoration: 'none', fontSize: '0.82rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                  >
                    Voir mon billet
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* INFO */}
        <div style={{ background: 'var(--bg)', borderRadius: '16px', padding: '20px', border: '1.5px solid var(--line)', marginBottom: '20px' }}>
          <p style={{ margin: '0 0 8px', fontWeight: 800, fontSize: '0.9rem' }}>📧 Vos billets sont dans votre boîte mail</p>
          <p style={{ margin: 0, fontSize: '0.84rem', color: 'var(--mute)', lineHeight: 1.6 }}>
            Chaque billet a été envoyé à <strong>{result.buyerEmail}</strong> avec son QR code unique.
            Présentez ce QR code à l'entrée de l'événement.
          </p>
        </div>

        <div style={{ textAlign: 'center' }}>
          <Link href="/billetterie/evenements" style={{ color: 'var(--p)', fontWeight: 700, textDecoration: 'none', fontSize: '0.9rem' }}>
            ← Voir d'autres événements
          </Link>
        </div>
      </div>
    </div>
  );
}

'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Header } from '@/components/Header';
import { getAutoDomain } from '@/utils/domain';

interface TicketData {
  id: string;
  ticketCode: string;
  buyerName?: string;
  eventTitle: string;
  passName: string;
  quantity?: number;
  status: 'VALID' | 'USED';
  purchasedAt?: string;
  qrDataUrl?: string;
}

export default function SingleTicketPage() {
  const params = useParams();
  const rawCode = (params?.ticketId as string) || '';
  const cleanCode = rawCode.trim().toUpperCase();

  const [loading, setLoading] = useState(true);
  const [ticket, setTicket] = useState<TicketData | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [siteOrigin, setSiteOrigin] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') setSiteOrigin(getAutoDomain());
  }, []);

  useEffect(() => {
    if (!cleanCode) { setLoading(false); return; }
    const controller = new AbortController();
    fetch(`/api/tickets/${encodeURIComponent(cleanCode)}`, {
      cache: 'no-store',
      signal: controller.signal,
    })
      .then(r => r.json())
      .then(data => {
        if (!data.exists) { setNotFound(true); return; }
        // Build minimal public ticket from whatever we receive
        const t = data.ticket || {};
        setTicket({
          id: t.id || cleanCode,
          ticketCode: t.ticketCode || t.ticket_code || cleanCode,
          buyerName: t.buyerName || t.buyer_name || '',
          eventTitle: t.eventTitle || t.event_title || data.eventTitle || 'Événement',
          passName: t.passName || t.pass_name || 'Pass',
          quantity: t.quantity || 1,
          status: t.status || 'VALID',
          purchasedAt: t.purchasedAt || t.purchased_at || '',
          qrDataUrl: t.qrDataUrl || t.qr_data_url || '',
        });
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [cleanCode]);

  const publicTicketUrl = `${siteOrigin}/billetterie/${encodeURIComponent(cleanCode)}`;
  const qrSrc = ticket?.qrDataUrl ||
    `https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodeURIComponent(publicTicketUrl)}&bgcolor=ffffff&color=1B0E78&margin=10`;

  /* ── Styles ───────────────────────────────────────────── */
  const page: React.CSSProperties = {
    minHeight: '100vh',
    background: 'linear-gradient(160deg,#0f0820 0%,#1B0E78 60%,#4B2CE0 100%)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '32px 16px 64px',
  };

  if (loading) return (
    <>
      <Header />
      <div style={{ ...page, justifyContent: 'center' }}>
        <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '1rem' }}>⏳ Chargement du billet…</div>
      </div>
    </>
  );

  if (notFound) return (
    <>
      <Header />
      <div style={{ ...page, justifyContent: 'center' }}>
        <div style={{
          background: 'rgba(255,255,255,0.07)', backdropFilter: 'blur(12px)',
          borderRadius: '24px', border: '1.5px solid rgba(255,255,255,0.15)',
          padding: '40px 32px', textAlign: 'center', maxWidth: '360px',
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '12px' }}>⛔</div>
          <h2 style={{ color: '#fff', fontWeight: 900, fontSize: '1.3rem', marginBottom: '8px' }}>Billet introuvable</h2>
          <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.9rem' }}>
            Le code <code style={{ color: '#D9D4FA' }}>{cleanCode}</code> ne correspond à aucun billet officiel.
          </p>
          <a href="/billetterie" style={{
            display: 'inline-block', marginTop: '20px', padding: '10px 24px',
            borderRadius: '12px', background: 'rgba(255,255,255,0.12)',
            color: '#fff', fontWeight: 700, textDecoration: 'none',
          }}>← Retour à la billetterie</a>
        </div>
      </div>
    </>
  );

  const isUsed = ticket?.status === 'USED';

  return (
    <>
      <Header />
      <div style={page}>
        {/* Title */}
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.78rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '8px' }}>
          🎟️ Billet Officiel
        </p>
        <h1 style={{ color: '#fff', fontWeight: 900, fontSize: 'clamp(1.3rem,5vw,1.7rem)', marginBottom: '28px', textAlign: 'center' }}>
          {ticket?.eventTitle}
        </h1>

        {/* ── TICKET CARD ────────────────────────────────── */}
        <div style={{
          width: '100%', maxWidth: '480px',
          borderRadius: '20px',
          overflow: 'hidden',
          boxShadow: '0 24px 80px rgba(0,0,0,0.5)',
          background: '#fff',
          position: 'relative',
        }}>

          {/* Top colored band */}
          <div style={{
            background: 'linear-gradient(135deg,#1B0E78,#4B2CE0)',
            padding: '20px 24px 18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
          }}>
            <div>
              <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.1em', margin: 0 }}>
                BILLET D&apos;ENTRÉE
              </p>
              <p style={{ color: '#fff', fontWeight: 900, fontSize: '1.1rem', margin: '4px 0 0' }}>
                {ticket?.passName}
              </p>
            </div>
            <div style={{
              background: isUsed ? 'rgba(239,68,68,0.25)' : 'rgba(16,185,129,0.25)',
              border: `1.5px solid ${isUsed ? '#ef4444' : '#10b981'}`,
              borderRadius: '99px', padding: '4px 14px',
              color: isUsed ? '#fca5a5' : '#6ee7b7',
              fontSize: '0.72rem', fontWeight: 900,
              letterSpacing: '0.08em', whiteSpace: 'nowrap',
            }}>
              {isUsed ? '✗ UTILISÉ' : '✓ VALIDE'}
            </div>
          </div>

          {/* Perforated divider */}
          <div style={{ position: 'relative', height: '1px', background: '#e5e7eb', margin: '0' }}>
            {/* Left notch */}
            <div style={{
              position: 'absolute', left: '-14px', top: '-14px',
              width: '28px', height: '28px', borderRadius: '50%',
              background: 'linear-gradient(160deg,#0f0820,#1B0E78)',
            }} />
            {/* Right notch */}
            <div style={{
              position: 'absolute', right: '-14px', top: '-14px',
              width: '28px', height: '28px', borderRadius: '50%',
              background: 'linear-gradient(160deg,#0f0820,#1B0E78)',
            }} />
            {/* Dashed line */}
            <div style={{
              position: 'absolute', left: '14px', right: '14px', top: '0',
              borderTop: '2px dashed #d1d5db',
            }} />
          </div>

          {/* Body: info left + QR right */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '20px',
            padding: '24px 24px 20px',
          }}>
            {/* Left: details */}
            <div style={{ flex: 1, minWidth: 0 }}>
              {ticket?.buyerName && (
                <div style={{ marginBottom: '14px' }}>
                  <p style={{ color: '#9ca3af', fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.08em', margin: '0 0 2px', textTransform: 'uppercase' }}>Participant</p>
                  <p style={{ color: '#111827', fontWeight: 800, fontSize: '0.95rem', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {ticket.buyerName}
                  </p>
                </div>
              )}

              <div style={{ marginBottom: '14px' }}>
                <p style={{ color: '#9ca3af', fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.08em', margin: '0 0 2px', textTransform: 'uppercase' }}>Catégorie</p>
                <p style={{ color: '#1B0E78', fontWeight: 800, fontSize: '0.9rem', margin: 0 }}>{ticket?.passName}</p>
              </div>

              {(ticket?.quantity || 1) > 1 && (
                <div style={{ marginBottom: '14px' }}>
                  <p style={{ color: '#9ca3af', fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.08em', margin: '0 0 2px', textTransform: 'uppercase' }}>Places</p>
                  <p style={{ color: '#111827', fontWeight: 800, fontSize: '0.9rem', margin: 0 }}>{ticket?.quantity}</p>
                </div>
              )}

              <div>
                <p style={{ color: '#9ca3af', fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.08em', margin: '0 0 2px', textTransform: 'uppercase' }}>Référence</p>
                <p style={{ color: '#4B2CE0', fontWeight: 900, fontSize: '0.85rem', fontFamily: 'monospace', margin: 0, letterSpacing: '0.05em' }}>
                  {ticket?.ticketCode}
                </p>
              </div>
            </div>

            {/* Right: QR code */}
            <div style={{ flexShrink: 0, textAlign: 'center' }}>
              <div style={{
                padding: '10px', background: '#fff',
                borderRadius: '14px', border: '2px solid #e5e7eb',
                boxShadow: '0 4px 16px rgba(27,14,120,0.1)',
              }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={qrSrc}
                  alt={`QR ${cleanCode}`}
                  width={120} height={120}
                  style={{ display: 'block', borderRadius: '6px' }}
                />
              </div>
              <p style={{ margin: '6px 0 0', fontSize: '0.62rem', fontWeight: 700, color: '#6b7280', fontFamily: 'monospace', letterSpacing: '0.04em' }}>
                SCANNER À L&apos;ENTRÉE
              </p>
            </div>
          </div>

          {/* Bottom footer of ticket */}
          <div style={{
            background: '#f9fafb',
            borderTop: '1px solid #e5e7eb',
            padding: '12px 24px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
            <p style={{ margin: 0, fontSize: '0.72rem', color: '#9ca3af', fontWeight: 600 }}>
              🔒 Billet sécurisé & unique
            </p>
            <p style={{ margin: 0, fontSize: '0.72rem', color: '#9ca3af', fontWeight: 600 }}>
              MK Prog © 2025
            </p>
          </div>
        </div>

        {/* ── CAPTURE NOTICE ────────────────────────────── */}
        <div style={{
          marginTop: '28px',
          maxWidth: '480px',
          width: '100%',
          background: 'rgba(255,255,255,0.08)',
          backdropFilter: 'blur(10px)',
          border: '1.5px solid rgba(255,255,255,0.15)',
          borderRadius: '16px',
          padding: '16px 20px',
          display: 'flex',
          gap: '14px',
          alignItems: 'flex-start',
        }}>
          <span style={{ fontSize: '1.6rem', lineHeight: 1 }}>📸</span>
          <div>
            <p style={{ color: '#fff', fontWeight: 800, fontSize: '0.92rem', margin: '0 0 4px' }}>
              Faites une capture d&apos;écran de votre billet !
            </p>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.82rem', margin: 0, lineHeight: 1.5 }}>
              Enregistrez ce billet sur votre téléphone. Il vous sera demandé à l&apos;entrée. Le QR code sera scanné par nos agents pour valider votre accès.
            </p>
          </div>
        </div>

        {/* ── INSTRUCTIONS ──────────────────────────────── */}
        <div style={{
          marginTop: '16px',
          maxWidth: '480px',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
        }}>
          {[
            { icon: '1️⃣', text: 'Faites une capture d\'écran de cette page maintenant' },
            { icon: '2️⃣', text: 'Présentez le QR code à l\'entrée de l\'événement' },
            { icon: '3️⃣', text: 'Un agent scannera votre billet pour valider l\'accès' },
          ].map((step, i) => (
            <div key={i} style={{
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '12px',
              padding: '12px 16px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
            }}>
              <span style={{ fontSize: '1.2rem' }}>{step.icon}</span>
              <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.84rem', margin: 0, fontWeight: 500 }}>
                {step.text}
              </p>
            </div>
          ))}
        </div>

        {/* Back link */}
        <a href="/billetterie" style={{
          display: 'inline-block', marginTop: '32px',
          color: 'rgba(255,255,255,0.45)', fontSize: '0.82rem',
          textDecoration: 'none', fontWeight: 600,
        }}>
          ← Retour à la billetterie
        </a>
      </div>
    </>
  );
}

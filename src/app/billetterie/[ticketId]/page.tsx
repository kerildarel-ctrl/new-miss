'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { INITIAL_ISSUED_TICKETS, IssuedTicket } from '@/data/mockTickets';

export default function SingleTicketPage() {
  const params = useParams();
  const rawCode = (params?.ticketId as string) || '';
  const [ticket, setTicket] = useState<IssuedTicket | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadTicket() {
      if (!rawCode) return;
      const cleanCode = rawCode.trim().toUpperCase();

      // 1. Check local mock store
      const local = INITIAL_ISSUED_TICKETS.find(
        (t) => t.ticketCode.toUpperCase() === cleanCode || t.id.toUpperCase() === cleanCode
      );

      if (local) {
        setTicket(local);
        setLoading(false);
        return;
      }

      // 2. Fetch from backend status check
      try {
        const res = await fetch(`/api/tickets/validate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ticketCode: cleanCode }),
        });
        const data = await res.json();
        if (data.ticket) {
          setTicket(data.ticket);
        }
      } catch {
        // Fallback demo ticket
      }

      setLoading(false);
    }

    loadTicket();
  }, [rawCode]);

  // Construct validation QR URL
  const host = typeof window !== 'undefined' ? window.location.origin : 'https://miss-template.netlify.app';
  const ticketCodeClean = ticket?.ticketCode || rawCode;
  const scanValidationUrl = `${host}/keril/scan?code=${encodeURIComponent(ticketCodeClean)}`;
  const qrCodeImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=280x280&data=${encodeURIComponent(scanValidationUrl)}`;

  return (
    <>
      <Header />

      <main style={{ minHeight: '80vh', padding: '40px 20px', background: 'var(--soft)' }}>
        <div style={{ maxWidth: '560px', margin: '0 auto' }}>

          {/* BACK BREADCRUMB */}
          <Link
            href="/billetterie"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              color: 'var(--p)',
              fontWeight: 700,
              fontSize: '0.9rem',
              textDecoration: 'none',
              marginBottom: '20px',
            }}
          >
            ← Retour à la Billetterie
          </Link>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', background: 'var(--bg)', borderRadius: '24px' }}>
              <p>Chargement du Billet...</p>
            </div>
          ) : !ticket ? (
            <div style={{ textAlign: 'center', padding: '40px', background: 'var(--bg)', borderRadius: '24px', border: '1.5px solid var(--line)' }}>
              <h2 style={{ fontSize: '1.4rem', color: '#ef4444' }}>⛔ Billet Introuvable</h2>
              <p style={{ color: 'var(--mute)', marginTop: '8px' }}>
                Le code <b style={{ color: 'var(--ink)' }}>{rawCode}</b> ne correspond à aucun billet émis.
              </p>
            </div>
          ) : (
            <div
              style={{
                background: '#0f1526',
                color: '#ffffff',
                borderRadius: '28px',
                border: '1.5px solid rgba(255, 255, 255, 0.12)',
                boxShadow: '0 25px 60px rgba(0, 0, 0, 0.4), 0 0 35px rgba(129, 140, 248, 0.15)',
                overflow: 'hidden',
              }}
            >
              {/* TICKET HEADER */}
              <div
                style={{
                  background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                  padding: '24px',
                  textAlign: 'center',
                }}
              >
                <span
                  style={{
                    background: 'rgba(255, 255, 255, 0.2)',
                    color: '#ffffff',
                    padding: '3px 12px',
                    borderRadius: '99px',
                    fontSize: '0.78rem',
                    fontWeight: 800,
                    letterSpacing: '0.05em',
                  }}
                >
                  🎟️ BILLET OFFICIEL ACCÈS ÉVÉNEMENT
                </span>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 900, marginTop: '8px', lineHeight: 1.25 }}>
                  {ticket.eventTitle}
                </h1>
                <p style={{ fontSize: '0.9rem', opacity: 0.9, marginTop: '4px' }}>
                  Catégorie : <b style={{ color: '#fbbf24' }}>{ticket.passName}</b>
                </p>
              </div>

              {/* TICKET STATUS BADGE */}
              <div style={{ padding: '24px', textAlign: 'center' }}>
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 18px',
                    borderRadius: '99px',
                    fontSize: '0.85rem',
                    fontWeight: 800,
                    background: ticket.status === 'VALID' ? 'rgba(16, 185, 129, 0.18)' : 'rgba(239, 68, 68, 0.18)',
                    border: ticket.status === 'VALID' ? '1.5px solid #10b981' : '1.5px solid #ef4444',
                    color: ticket.status === 'VALID' ? '#10b981' : '#fca5a5',
                  }}
                >
                  <span>{ticket.status === 'VALID' ? '🟢' : '🔴'}</span>
                  <span>
                    {ticket.status === 'VALID'
                      ? 'BILLET VALIDE - PRÊT POUR LE SCAN À L’ENTRÉE'
                      : `BILLET DÉJÀ UTILISÉ LE ${new Date(ticket.scannedAt || '').toLocaleTimeString('fr-FR')}`}
                  </span>
                </div>

                {/* QR CODE CARD */}
                <div
                  style={{
                    marginTop: '20px',
                    padding: '20px',
                    background: '#ffffff',
                    borderRadius: '24px',
                    display: 'inline-block',
                    boxShadow: '0 12px 30px rgba(0, 0, 0, 0.3)',
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={qrCodeImageUrl}
                    alt={`QR Code Billet ${ticket.ticketCode}`}
                    width={220}
                    height={220}
                    style={{ display: 'block', borderRadius: '8px' }}
                  />
                  <div style={{ marginTop: '10px', fontSize: '0.9rem', fontWeight: 900, color: '#0f172a', letterSpacing: '0.05em' }}>
                    {ticket.ticketCode}
                  </div>
                </div>

                <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '12px', lineHeight: 1.4 }}>
                  Présentez ce QR Code à l&apos;agent de contrôle à l&apos;entrée.
                  <br />
                  <b style={{ color: '#818cf8' }}>Le QR Code est scannable et validable UNE SEULE FOIS.</b>
                </p>

                {/* TICKET METADATA DETAILS */}
                <div
                  style={{
                    marginTop: '24px',
                    padding: '16px',
                    borderRadius: '16px',
                    background: '#161e33',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    textAlign: 'left',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                    fontSize: '0.88rem',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#94a3b8' }}>Titulaire :</span>
                    <span style={{ fontWeight: 700, color: '#ffffff' }}>{ticket.buyerName}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#94a3b8' }}>Email :</span>
                    <span style={{ fontWeight: 700, color: '#818cf8' }}>{ticket.buyerEmail}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#94a3b8' }}>Prix du Billet :</span>
                    <span style={{ fontWeight: 700, color: '#10b981' }}>{ticket.totalPrice.toLocaleString('fr-FR')} FCFA</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#94a3b8' }}>Date d&apos;émission :</span>
                    <span style={{ fontWeight: 500, color: '#e2e8f0' }}>{new Date(ticket.purchasedAt).toLocaleDateString('fr-FR')}</span>
                  </div>
                </div>

                {/* ACTION BUTTON: DOWNLOAD QR IMAGE */}
                <a
                  href={qrCodeImageUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  download={`billet-${ticket.ticketCode}.png`}
                  style={{
                    display: 'block',
                    width: '100%',
                    marginTop: '20px',
                    padding: '14px',
                    borderRadius: '99px',
                    background: 'rgba(129, 140, 248, 0.18)',
                    border: '1.5px solid #818cf8',
                    color: '#818cf8',
                    fontWeight: 800,
                    fontSize: '0.9rem',
                    textDecoration: 'none',
                    textAlign: 'center',
                  }}
                >
                  📥 Télécharger l&apos;image du QR Code
                </a>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </>
  );
}

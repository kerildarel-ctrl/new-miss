'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { AdminSidebar } from '@/components/AdminSidebar';
import { AdminAuthGuard } from '@/components/AdminAuthGuard';
import { INITIAL_ISSUED_TICKETS, IssuedTicket } from '@/data/mockTickets';
import { Mail, Check, QrCode } from 'lucide-react';

export default function KerilTicketsPage() {
  const [tickets] = useState<IssuedTicket[]>(INITIAL_ISSUED_TICKETS);
  const [copied, setCopied] = useState(false);

  // Extract all unique buyer emails
  const allEmails = Array.from(new Set(tickets.map((t) => t.buyerEmail).filter(Boolean)));

  const handleCopyEmails = () => {
    const emailsText = allEmails.join(', ');
    if (navigator.clipboard) {
      navigator.clipboard.writeText(emailsText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <AdminAuthGuard>
      <div
        style={{
          minHeight: '100vh',
          background: 'var(--soft)',
          color: 'var(--ink)',
          display: 'flex',
          flexDirection: 'column',
          width: '100%',
        }}
      >
        <AdminSidebar />

        <main
          className="lg:ml-64"
          style={{
            flex: 1,
            minWidth: 0,
            padding: 'clamp(16px, 3vw, 36px)',
            display: 'flex',
            flexDirection: 'column',
            gap: '24px',
          }}
        >
          {/* TOP HEADER & ACTIONS */}
          <div
            style={{
              paddingBottom: '20px',
              borderBottom: '1px solid var(--line)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '16px',
            }}
          >
            <div>
              <p className="eb">Gestion de Billetterie Événements (/keril)</p>
              <h1 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.4rem)', marginTop: '4px' }}>
                Billets Vendus & <span style={{ color: 'var(--p)' }}>Emails Acheteurs</span>
              </h1>
            </div>

            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              {/* BUTTON TO OPEN LIVE QR SCANNER */}
              <Link
                href="/keril/scan"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '12px 20px',
                  borderRadius: '14px',
                  background: '#10b981',
                  color: '#ffffff',
                  fontWeight: 800,
                  fontSize: '0.92rem',
                  textDecoration: 'none',
                  boxShadow: '0 8px 20px rgba(16, 185, 129, 0.3)',
                }}
              >
                <QrCode className="w-4 h-4" />
                <span>Ouvrir le Scanner à l&apos;Entrée 📲</span>
              </Link>

              {/* BUTTON TO COPY ALL TICKET BUYER EMAILS */}
              <button
                type="button"
                onClick={handleCopyEmails}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '12px 20px',
                  borderRadius: '14px',
                  background: 'var(--p)',
                  color: '#ffffff',
                  fontWeight: 800,
                  fontSize: '0.92rem',
                  border: 'none',
                  cursor: 'pointer',
                  boxShadow: '0 8px 20px rgba(124, 58, 237, 0.3)',
                }}
              >
                {copied ? <Check className="w-4 h-4" /> : <Mail className="w-4 h-4" />}
                <span>{copied ? 'Emails copiés !' : 'Copier les Emails Acheteurs'}</span>
              </button>
            </div>
          </div>

          {/* TICKETS TABLE */}
          <div
            style={{
              background: 'var(--bg)',
              borderRadius: '20px',
              border: '1px solid var(--line)',
              boxShadow: 'var(--shadow)',
              overflow: 'hidden',
            }}
          >
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '780px' }}>
                <thead>
                  <tr
                    style={{
                      background: 'var(--soft)',
                      borderBottom: '1px solid var(--line)',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                      color: 'var(--mute)',
                    }}
                  >
                    <th style={{ padding: '16px 20px' }}>Code Billet</th>
                    <th style={{ padding: '16px 20px' }}>Événement</th>
                    <th style={{ padding: '16px 20px' }}>Pass</th>
                    <th style={{ padding: '16px 20px' }}>Nom Acheteur</th>
                    <th style={{ padding: '16px 20px' }}>Email Acheteur</th>
                    <th style={{ padding: '16px 20px' }}>Montant</th>
                    <th style={{ padding: '16px 20px', textAlign: 'right' }}>Statut Scan</th>
                  </tr>
                </thead>
                <tbody>
                  {tickets.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ padding: '32px', textAlign: 'center', color: 'var(--mute)' }}>
                        Aucun billet vendu pour le moment.
                      </td>
                    </tr>
                  ) : (
                    tickets.map((t) => (
                      <tr key={t.id} style={{ borderBottom: '1px solid var(--line)' }}>
                        <td style={{ padding: '16px 20px', fontFamily: 'monospace', fontWeight: 800, color: 'var(--p)' }}>
                          <Link href={`/billetterie/${t.ticketCode}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                            {t.ticketCode} 🔗
                          </Link>
                        </td>
                        <td style={{ padding: '16px 20px', fontWeight: 700, fontSize: '0.9rem' }}>
                          {t.eventTitle}
                        </td>
                        <td style={{ padding: '16px 20px', fontSize: '0.85rem', color: 'var(--mute)' }}>
                          {t.passName} ({t.quantity})
                        </td>
                        <td style={{ padding: '16px 20px', fontWeight: 700 }}>
                          {t.buyerName}
                        </td>
                        <td style={{ padding: '16px 20px', fontSize: '0.85rem', fontWeight: 600, color: 'var(--p)' }}>
                          ✉️ {t.buyerEmail}
                        </td>
                        <td style={{ padding: '16px 20px', fontFamily: 'monospace', fontWeight: 800, color: '#10b981' }}>
                          {t.totalPrice.toLocaleString('fr-FR')} FCFA
                        </td>
                        <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '4px 10px',
                              borderRadius: '99px',
                              fontSize: '0.75rem',
                              fontWeight: 800,
                              background: t.status === 'VALID' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                              color: t.status === 'VALID' ? '#10b981' : '#ef4444',
                            }}
                          >
                            {t.status === 'VALID' ? '🟢 VALIDE' : '🔴 SCANNÉ'}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </AdminAuthGuard>
  );
}

'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { AdminSidebar } from '@/components/AdminSidebar';
import { AdminAuthGuard } from '@/components/AdminAuthGuard';
import { IssuedTicket } from '@/data/mockTickets';
import { Mail, Check, QrCode, Search, Filter, RotateCcw, RefreshCw, CheckCircle2, XCircle } from 'lucide-react';

export default function KerilTicketsPage() {
  const [tickets, setTickets] = useState<IssuedTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'VALID' | 'USED'>('ALL');
  const [isResetting, setIsResetting] = useState<string | null>(null);
  const [confirmResetCode, setConfirmResetCode] = useState<string | null>(null);

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/tickets', { cache: 'no-store' });
      const data = await res.json();
      if (data.success && Array.isArray(data.tickets)) {
        setTickets(data.tickets);
      }
    } catch {
      // Ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  // Filtered tickets
  const filteredTickets = tickets.filter((t) => {
    const matchesFilter =
      statusFilter === 'ALL'
        ? true
        : statusFilter === 'VALID'
        ? t.status === 'VALID'
        : t.status === 'USED';

    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      t.ticketCode.toLowerCase().includes(q) ||
      (t.orderRef && t.orderRef.toLowerCase().includes(q)) ||
      t.buyerName.toLowerCase().includes(q) ||
      t.buyerEmail.toLowerCase().includes(q) ||
      t.eventTitle.toLowerCase().includes(q);

    return matchesFilter && matchesSearch;
  });

  // Unique buyer emails
  const allEmails = Array.from(new Set(tickets.map((t) => t.buyerEmail).filter(Boolean)));

  const handleCopyEmails = () => {
    const emailsText = allEmails.join(', ');
    if (navigator.clipboard) {
      navigator.clipboard.writeText(emailsText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  // Reset ticket handler (Admin only)
  const handleResetTicket = async (ticketCode: string) => {
    setIsResetting(ticketCode);
    setConfirmResetCode(null);
    try {
      const res = await fetch('/api/tickets/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticketCode }),
      });
      const data = await res.json();
      if (data.success) {
        await fetchTickets();
      } else {
        alert(data.error || 'Erreur lors de la réinitialisation');
      }
    } catch {
      alert('Erreur réseau');
    } finally {
      setIsResetting(null);
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
              <p className="eb">Contrôle de Billetterie & Entrées (/keril)</p>
              <h1 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.4rem)', marginTop: '4px' }}>
                Gestion des Billets & <span style={{ color: 'var(--p)' }}>Accès</span>
              </h1>
            </div>

            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
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
                <span>Ouvrir Scanner d&apos;Entrée 📲</span>
              </Link>

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
                <span>{copied ? 'Emails copiés !' : `Copier ${allEmails.length} Emails`}</span>
              </button>
            </div>
          </div>

          {/* SEARCH & FILTERS BAR */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '14px',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            {/* SEARCH */}
            <div style={{ position: 'relative', width: 'min(380px, 100%)' }}>
              <Search
                className="w-4 h-4 text-mute"
                style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }}
              />
              <input
                type="text"
                placeholder="Rechercher code, nom, email, réf..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  paddingLeft: '40px',
                  height: '44px',
                  borderRadius: '12px',
                  background: 'var(--bg)',
                  border: '1px solid var(--line)',
                  fontSize: '0.88rem',
                }}
              />
            </div>

            {/* STATUS FILTER PILLS */}
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                onClick={() => setStatusFilter('ALL')}
                style={{
                  padding: '8px 16px',
                  borderRadius: '99px',
                  fontSize: '0.82rem',
                  fontWeight: 800,
                  border: '1px solid var(--line)',
                  background: statusFilter === 'ALL' ? 'var(--ink)' : 'var(--bg)',
                  color: statusFilter === 'ALL' ? 'var(--bg)' : 'var(--ink)',
                  cursor: 'pointer',
                }}
              >
                Tous ({tickets.length})
              </button>

              <button
                type="button"
                onClick={() => setStatusFilter('VALID')}
                style={{
                  padding: '8px 16px',
                  borderRadius: '99px',
                  fontSize: '0.82rem',
                  fontWeight: 800,
                  border: '1px solid var(--line)',
                  background: statusFilter === 'VALID' ? '#10b981' : 'var(--bg)',
                  color: statusFilter === 'VALID' ? '#ffffff' : 'var(--ink)',
                  cursor: 'pointer',
                }}
              >
                🟢 Non Utilisés ({tickets.filter((t) => t.status === 'VALID').length})
              </button>

              <button
                type="button"
                onClick={() => setStatusFilter('USED')}
                style={{
                  padding: '8px 16px',
                  borderRadius: '99px',
                  fontSize: '0.82rem',
                  fontWeight: 800,
                  border: '1px solid var(--line)',
                  background: statusFilter === 'USED' ? '#ef4444' : 'var(--bg)',
                  color: statusFilter === 'USED' ? '#ffffff' : 'var(--ink)',
                  cursor: 'pointer',
                }}
              >
                🔴 Validés à l&apos;Entrée ({tickets.filter((t) => t.status === 'USED').length})
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
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '860px' }}>
                <thead>
                  <tr
                    style={{
                      background: 'var(--soft)',
                      borderBottom: '1px solid var(--line)',
                      fontSize: '0.74rem',
                      fontWeight: 800,
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                      color: 'var(--mute)',
                    }}
                  >
                    <th style={{ padding: '16px 20px' }}>Code Billet</th>
                    <th style={{ padding: '16px 20px' }}>Réf. Commande</th>
                    <th style={{ padding: '16px 20px' }}>Événement</th>
                    <th style={{ padding: '16px 20px' }}>Pass</th>
                    <th style={{ padding: '16px 20px' }}>Titulaire</th>
                    <th style={{ padding: '16px 20px' }}>Paiement</th>
                    <th style={{ padding: '16px 20px' }}>Statut Entrée</th>
                    <th style={{ padding: '16px 20px', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={8} style={{ padding: '36px', textAlign: 'center', color: 'var(--mute)' }}>
                        <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2" />
                        Chargement des billets...
                      </td>
                    </tr>
                  ) : filteredTickets.length === 0 ? (
                    <tr>
                      <td colSpan={8} style={{ padding: '36px', textAlign: 'center', color: 'var(--mute)' }}>
                        Aucun billet trouvé pour ces critères.
                      </td>
                    </tr>
                  ) : (
                    filteredTickets.map((t) => (
                      <tr key={t.id} style={{ borderBottom: '1px solid var(--line)' }}>
                        <td style={{ padding: '16px 20px', fontFamily: 'monospace', fontWeight: 800, color: 'var(--p)' }}>
                          <Link href={`/billetterie/${t.ticketCode}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                            {t.ticketCode} 🔗
                          </Link>
                        </td>
                        <td style={{ padding: '16px 20px', fontFamily: 'monospace', fontSize: '0.82rem', color: 'var(--mute)' }}>
                          {t.orderRef || `CMD-${t.id.slice(-6)}`}
                        </td>
                        <td style={{ padding: '16px 20px', fontWeight: 700, fontSize: '0.88rem' }}>
                          {t.eventTitle}
                        </td>
                        <td style={{ padding: '16px 20px', fontSize: '0.85rem', color: 'var(--mute)' }}>
                          {t.passName} ({t.quantity || 1})
                        </td>
                        <td style={{ padding: '16px 20px' }}>
                          <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{t.buyerName}</div>
                          <div style={{ fontSize: '0.78rem', color: 'var(--p)', marginTop: '2px' }}>
                            ✉️ {t.buyerEmail}
                          </div>
                        </td>
                        <td style={{ padding: '16px 20px' }}>
                          <span
                            style={{
                              padding: '3px 8px',
                              borderRadius: '99px',
                              fontSize: '0.74rem',
                              fontWeight: 800,
                              background:
                                (t.paymentStatus || 'PAID') === 'PAID'
                                  ? 'rgba(16, 185, 129, 0.12)'
                                  : 'rgba(245, 158, 11, 0.12)',
                              color:
                                (t.paymentStatus || 'PAID') === 'PAID' ? '#10b981' : '#f59e0b',
                            }}
                          >
                            {(t.paymentStatus || 'PAID') === 'PAID' ? 'CONFIRMÉ' : t.paymentStatus}
                          </span>
                        </td>
                        <td style={{ padding: '16px 20px' }}>
                          {t.status === 'VALID' ? (
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                padding: '4px 10px',
                                borderRadius: '99px',
                                fontSize: '0.76rem',
                                fontWeight: 800,
                                background: 'rgba(16, 185, 129, 0.12)',
                                color: '#10b981',
                              }}
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" /> NON UTILISÉ
                            </span>
                          ) : (
                            <div>
                              <span
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  padding: '4px 10px',
                                  borderRadius: '99px',
                                  fontSize: '0.76rem',
                                  fontWeight: 800,
                                  background: 'rgba(239, 68, 68, 0.12)',
                                  color: '#ef4444',
                                }}
                              >
                                <XCircle className="w-3.5 h-3.5" /> DÉJÀ UTILISÉ
                              </span>
                              {t.scannedAt && (
                                <div style={{ fontSize: '0.72rem', color: 'var(--mute)', marginTop: '3px' }}>
                                  {new Date(t.scannedAt).toLocaleDateString('fr-FR')} à{' '}
                                  {new Date(t.scannedAt).toLocaleTimeString('fr-FR', {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </div>
                              )}
                              {t.scannedByAgentName && (
                                <div style={{ fontSize: '0.7rem', color: '#818cf8' }}>
                                  Par {t.scannedByAgentName}
                                </div>
                              )}
                            </div>
                          )}
                        </td>
                        <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                          {t.status === 'USED' ? (
                            confirmResetCode === t.ticketCode ? (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'flex-end' }}>
                                <button
                                  type="button"
                                  onClick={() => handleResetTicket(t.ticketCode)}
                                  disabled={isResetting === t.ticketCode}
                                  style={{ padding: '5px 10px', borderRadius: '99px', background: 'rgba(245,158,11,0.9)', color: '#fff', border: 'none', cursor: 'pointer', fontSize: '0.72rem', fontWeight: 700 }}
                                >
                                  {isResetting === t.ticketCode ? '...' : 'Confirmer'}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setConfirmResetCode(null)}
                                  style={{ padding: '5px 8px', borderRadius: '99px', background: 'var(--soft)', color: 'var(--mute)', border: '1px solid var(--line)', cursor: 'pointer', fontSize: '0.72rem', fontWeight: 700 }}
                                >
                                  ✕
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setConfirmResetCode(t.ticketCode)}
                                style={{ padding: '6px 12px', borderRadius: '8px', border: '1px solid var(--line)', background: 'var(--soft)', color: 'var(--ink)', fontSize: '0.76rem', fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                              >
                                <RotateCcw className="w-3 h-3" />
                                <span>Réinitialiser</span>
                              </button>
                            )
                          ) : (
                            <Link
                              href={`/billetterie/${t.ticketCode}`}
                              style={{
                                padding: '6px 12px',
                                borderRadius: '8px',
                                background: '#10b981',
                                color: '#ffffff',
                                fontSize: '0.76rem',
                                fontWeight: 800,
                                textDecoration: 'none',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                              }}
                            >
                              Valider 🎟️
                            </Link>
                          )}
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

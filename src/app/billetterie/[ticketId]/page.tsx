'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import {
  Lock,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Ticket,
  User,
  Calendar,
  CreditCard,
  QrCode,
  ArrowLeft,
  KeyRound,
  ExternalLink,
} from 'lucide-react';

interface TicketFullData {
  id: string;
  ticketCode: string;
  buyerName?: string;
  buyerEmail?: string;
  buyerPhone?: string;
  eventTitle: string;
  eventId?: string;
  passName: string;
  quantity?: number;
  unitPrice?: number;
  totalPrice?: number;
  orderRef?: string;
  paymentStatus?: string;
  status: 'VALID' | 'USED';
  purchasedAt?: string;
  scannedAt?: string;
  scannedByAgentName?: string;
}

export default function SingleTicketPage() {
  const params = useParams();
  const rawCode = (params?.ticketId as string) || '';
  const cleanCode = rawCode.trim().toUpperCase();

  const [loading, setLoading] = useState(true);
  const [ticketExists, setTicketExists] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [ticket, setTicket] = useState<TicketFullData | null>(null);
  const [publicEventTitle, setPublicEventTitle] = useState('');
  const [publicMessage, setPublicMessage] = useState('');

  // Admin login popup / inline form
  const [showLoginForm, setShowLoginForm] = useState(false);
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Validation Action state
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<{
    code: 'VALIDATED' | 'ALREADY_USED' | 'UNPAID' | 'INVALID' | 'ERROR';
    message: string;
    scannedAt?: string;
    scannedByAgentName?: string;
  } | null>(null);

  // Reset state (admin only)
  const [isResetting, setIsResetting] = useState(false);

  // Determine current site domain dynamically
  const [siteOrigin, setSiteOrigin] = useState('');
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setSiteOrigin(window.location.origin);
    }
  }, []);

  // Fetch ticket details
  const fetchTicketDetails = async () => {
    if (!cleanCode) return;
    setLoading(true);

    try {
      const res = await fetch(`/api/tickets/${encodeURIComponent(cleanCode)}`, {
        cache: 'no-store',
      });
      const data = await res.json();

      if (!data.exists) {
        setTicketExists(false);
        setLoading(false);
        return;
      }

      setTicketExists(true);
      if (data.authorized && data.ticket) {
        setIsAuthorized(true);
        setTicket(data.ticket);
      } else {
        setIsAuthorized(false);
        setPublicEventTitle(data.eventTitle || '');
        setPublicMessage(data.message || '');
      }
    } catch {
      setTicketExists(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTicketDetails();
  }, [cleanCode]);

  // Handle Admin Quick Login on this page
  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setLoginError(null);

    try {
      const res = await fetch('/api/auth/agent-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: loginPassword }),
      });
      const data = await res.json();

      if (data.success) {
        // Store in sessionStorage to sync with /keril
        sessionStorage.setItem('keril_admin_auth', 'true');
        setShowLoginForm(false);
        setLoginPassword('');
        await fetchTicketDetails();
      } else {
        setLoginError(data.error || 'Mot de passe incorrect');
      }
    } catch {
      setLoginError('Erreur de connexion au serveur');
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Handle Entrance Validation (Action explicite de l'agent connecté)
  const handleValidateEntry = async () => {
    setIsValidating(true);
    setValidationResult(null);

    try {
      const res = await fetch('/api/tickets/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticketCode: cleanCode }),
      });
      const data = await res.json();

      setValidationResult({
        code: data.code || (data.success ? 'VALIDATED' : 'ERROR'),
        message: data.message,
        scannedAt: data.ticket?.scanned_at || data.scannedAt,
        scannedByAgentName: data.ticket?.scanned_by_agent_name || data.scannedByAgentName,
      });

      // Update local ticket view
      if (data.ticket) {
        setTicket((prev) =>
          prev
            ? {
                ...prev,
                status: 'USED',
                scannedAt: data.ticket.scanned_at || new Date().toISOString(),
                scannedByAgentName: data.ticket.scanned_by_agent_name || 'Admin /keril',
              }
            : null
        );
      }
    } catch {
      setValidationResult({
        code: 'ERROR',
        message: 'Erreur réseau lors de la validation.',
      });
    } finally {
      setIsValidating(false);
    }
  };

  // Handle Reset to VALID (Admin Principal only)
  const handleResetTicket = async () => {
    if (!confirm('Voulez-vous réinitialiser ce billet pour le marquer à nouveau comme VALIDE ?')) {
      return;
    }
    setIsResetting(true);
    try {
      const res = await fetch('/api/tickets/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticketCode: cleanCode }),
      });
      const data = await res.json();
      if (data.success) {
        alert('✅ Billet réinitialisé avec succès à l’état VALIDE.');
        setValidationResult(null);
        await fetchTicketDetails();
      } else {
        alert(`⚠️ ${data.error}`);
      }
    } catch {
      alert('Erreur lors de la réinitialisation');
    } finally {
      setIsResetting(false);
    }
  };

  // QR Code Public URL (pointing strictly to this domain and page)
  const publicTicketUrl = `${siteOrigin || 'https://miss-template.netlify.app'}/billetterie/${encodeURIComponent(cleanCode)}`;
  const qrCodeImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=280x280&data=${encodeURIComponent(publicTicketUrl)}`;

  return (
    <>
      <Header />

      <main style={{ minHeight: '80vh', padding: '40px 20px', background: 'var(--soft)' }}>
        <div style={{ maxWidth: '580px', margin: '0 auto' }}>
          {/* TOP BACK LINK */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
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
              }}
            >
              <ArrowLeft className="w-4 h-4" /> Billetterie
            </Link>

            {isAuthorized && (
              <Link
                href="/keril/scan"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  color: '#10b981',
                  fontWeight: 700,
                  fontSize: '0.86rem',
                  textDecoration: 'none',
                  background: 'rgba(16, 185, 129, 0.1)',
                  padding: '6px 12px',
                  borderRadius: '99px',
                }}
              >
                <QrCode className="w-3.5 h-3.5" /> Ouvrir Scanner Caméra
              </Link>
            )}
          </div>

          {loading ? (
            <div
              style={{
                textAlign: 'center',
                padding: '60px 20px',
                background: 'var(--bg)',
                borderRadius: '24px',
                border: '1.5px solid var(--line)',
              }}
            >
              <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>🎟️</div>
              <p style={{ fontWeight: 700, color: 'var(--ink)' }}>Vérification du Billet...</p>
            </div>
          ) : !ticketExists ? (
            <div
              style={{
                textAlign: 'center',
                padding: '48px 24px',
                background: 'var(--bg)',
                borderRadius: '24px',
                border: '1.5px solid #ef4444',
                boxShadow: '0 10px 25px rgba(239, 68, 68, 0.1)',
              }}
            >
              <div style={{ fontSize: '3rem', marginBottom: '8px' }}>⛔</div>
              <h2 style={{ fontSize: '1.5rem', color: '#ef4444', fontWeight: 900 }}>BILLET INVALIDE</h2>
              <p style={{ color: 'var(--mute)', marginTop: '8px', fontSize: '0.92rem' }}>
                Le code <b>{cleanCode}</b> ne correspond à aucun billet officiel enregistré.
              </p>
              <div
                style={{
                  marginTop: '16px',
                  padding: '10px 14px',
                  borderRadius: '12px',
                  background: 'rgba(239, 68, 68, 0.1)',
                  color: '#ef4444',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                }}
              >
                Entrée refusée — Billet inexistant ou falsifié.
              </div>
            </div>
          ) : !isAuthorized ? (
            /* =========================================================================
               VUE PUBLIQUE ANONYMISÉE (VISITEUR NON CONNECTÉ / SCAN PUBLIC)
               Message neutre officiel - Aucune fuite de données personnelles ou de statut
               ========================================================================= */
            <div
              style={{
                background: '#0f1526',
                color: '#ffffff',
                borderRadius: '28px',
                border: '1.5px solid rgba(255, 255, 255, 0.12)',
                boxShadow: '0 25px 60px rgba(0, 0, 0, 0.4), 0 0 30px rgba(129, 140, 248, 0.15)',
                overflow: 'hidden',
              }}
            >
              {/* HEADER */}
              <div
                style={{
                  background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)',
                  padding: '24px 20px',
                  textAlign: 'center',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                }}
              >
                <span
                  style={{
                    background: 'rgba(255, 255, 255, 0.15)',
                    color: '#c7d2fe',
                    padding: '3px 12px',
                    borderRadius: '99px',
                    fontSize: '0.76rem',
                    fontWeight: 800,
                    letterSpacing: '0.05em',
                  }}
                >
                  🔒 BILLET OFFICIEL SÉCURISÉ
                </span>
                <h1 style={{ fontSize: '1.4rem', fontWeight: 900, marginTop: '8px' }}>
                  {publicEventTitle || 'Événement Officiel'}
                </h1>
                <p style={{ fontSize: '0.84rem', color: '#94a3b8', marginTop: '4px', fontFamily: 'monospace' }}>
                  Identifiant : {cleanCode}
                </p>
              </div>

              {/* QR CODE CARD */}
              <div style={{ padding: '28px 24px', textAlign: 'center' }}>
                <div
                  style={{
                    padding: '16px',
                    background: '#ffffff',
                    borderRadius: '22px',
                    display: 'inline-block',
                    boxShadow: '0 12px 30px rgba(0, 0, 0, 0.4)',
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={qrCodeImageUrl}
                    alt={`QR Code ${cleanCode}`}
                    width={200}
                    height={200}
                    style={{ display: 'block', borderRadius: '8px' }}
                  />
                  <div
                    style={{
                      marginTop: '8px',
                      fontSize: '0.85rem',
                      fontWeight: 900,
                      color: '#0f172a',
                      letterSpacing: '0.05em',
                      fontFamily: 'monospace',
                    }}
                  >
                    {cleanCode}
                  </div>
                </div>

                {/* NEUTRAL PUBLIC NOTICE (EXIGENCE 2) */}
                <div
                  style={{
                    marginTop: '24px',
                    padding: '18px',
                    borderRadius: '16px',
                    background: 'rgba(129, 140, 248, 0.1)',
                    border: '1.5px solid rgba(129, 140, 248, 0.25)',
                    textAlign: 'left',
                    display: 'flex',
                    gap: '12px',
                    alignItems: 'flex-start',
                  }}
                >
                  <Lock className="w-5 h-5 text-indigo-400 flex-shrink-0" style={{ marginTop: '2px' }} />
                  <div>
                    <h3 style={{ fontSize: '0.92rem', fontWeight: 800, color: '#c7d2fe' }}>
                      Billet identifié
                    </h3>
                    <p style={{ fontSize: '0.84rem', color: '#cbd5e1', marginTop: '4px', lineHeight: 1.45 }}>
                      Connectez-vous avec un compte administrateur autorisé pour consulter les informations et
                      vérifier son statut.
                    </p>
                  </div>
                </div>

                {/* ADMIN LOGIN TOGGLE */}
                {!showLoginForm ? (
                  <button
                    type="button"
                    onClick={() => setShowLoginForm(true)}
                    style={{
                      width: '100%',
                      marginTop: '20px',
                      padding: '13px',
                      borderRadius: '99px',
                      background: 'rgba(255, 255, 255, 0.08)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      color: '#ffffff',
                      fontWeight: 700,
                      fontSize: '0.88rem',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                    }}
                  >
                    <KeyRound className="w-4 h-4 text-indigo-400" />
                    <span>Accès Contrôleur / Administrateur (/keril)</span>
                  </button>
                ) : (
                  <form
                    onSubmit={handleAdminLogin}
                    style={{
                      marginTop: '20px',
                      padding: '18px',
                      borderRadius: '16px',
                      background: '#161e33',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      textAlign: 'left',
                    }}
                  >
                    <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#cbd5e1', display: 'block' }}>
                      Mot de passe administrateur /keril :
                    </label>
                    <input
                      type="password"
                      required
                      placeholder="Mot de passe..."
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      style={{
                        width: '100%',
                        height: '42px',
                        background: '#0f1526',
                        border: '1.5px solid rgba(255, 255, 255, 0.2)',
                        borderRadius: '10px',
                        padding: '0 12px',
                        color: '#ffffff',
                        fontSize: '0.9rem',
                        marginTop: '6px',
                        outline: 'none',
                      }}
                    />

                    {loginError && (
                      <div style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '6px', fontWeight: 600 }}>
                        ⚠️ {loginError}
                      </div>
                    )}

                    <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                      <button
                        type="submit"
                        disabled={isLoggingIn}
                        style={{
                          flex: 1,
                          padding: '10px',
                          borderRadius: '10px',
                          background: '#818cf8',
                          color: '#0f172a',
                          fontWeight: 800,
                          fontSize: '0.85rem',
                          border: 'none',
                          cursor: 'pointer',
                        }}
                      >
                        {isLoggingIn ? 'Connexion...' : 'Se connecter'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowLoginForm(false)}
                        style={{
                          padding: '10px 14px',
                          borderRadius: '10px',
                          background: 'rgba(255, 255, 255, 0.1)',
                          color: '#ffffff',
                          fontWeight: 600,
                          fontSize: '0.85rem',
                          border: 'none',
                          cursor: 'pointer',
                        }}
                      >
                        Annuler
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          ) : ticket ? (
            /* =========================================================================
               VUE ADMINISTRATEUR / CONTRÔLEUR CONNECTÉ (/keril)
               Détails complets + Action explicite de validation d'entrée
               ========================================================================= */
            <div
              style={{
                background: '#0f1526',
                color: '#ffffff',
                borderRadius: '28px',
                border: '1.5px solid rgba(255, 255, 255, 0.15)',
                boxShadow: '0 25px 60px rgba(0, 0, 0, 0.5), 0 0 35px rgba(129, 140, 248, 0.15)',
                overflow: 'hidden',
              }}
            >
              {/* ADMIN BAR */}
              <div
                style={{
                  background: 'rgba(16, 185, 129, 0.15)',
                  borderBottom: '1px solid rgba(16, 185, 129, 0.3)',
                  padding: '8px 16px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '0.78rem',
                }}
              >
                <span style={{ color: '#10b981', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <ShieldCheck className="w-3.5 h-3.5" /> Session Administrateur /keril Active
                </span>
                <span style={{ color: '#94a3b8' }}>Mode Contrôleur d&apos;Entrée</span>
              </div>

              {/* TICKET HEADER */}
              <div
                style={{
                  background: 'linear-gradient(135deg, #3730a3 0%, #4f46e5 100%)',
                  padding: '24px 20px',
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
                  }}
                >
                  🎟️ {ticket.passName}
                </span>
                <h1 style={{ fontSize: '1.45rem', fontWeight: 900, marginTop: '8px' }}>
                  {ticket.eventTitle}
                </h1>
                <p style={{ fontSize: '0.88rem', color: '#c7d2fe', marginTop: '2px', fontFamily: 'monospace' }}>
                  N° {ticket.ticketCode}
                </p>
              </div>

              <div style={{ padding: '24px' }}>
                {/* STATUS BADGE */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    padding: '10px 16px',
                    borderRadius: '14px',
                    fontWeight: 900,
                    fontSize: '0.9rem',
                    background:
                      ticket.status === 'VALID' ? 'rgba(16, 185, 129, 0.18)' : 'rgba(239, 68, 68, 0.18)',
                    border:
                      ticket.status === 'VALID' ? '2px solid #10b981' : '2px solid #ef4444',
                    color: ticket.status === 'VALID' ? '#10b981' : '#f87171',
                    textAlign: 'center',
                  }}
                >
                  {ticket.status === 'VALID' ? (
                    <>
                      <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                      <span>BILLET NON ENCORE UTILISÉ — PRÊT POUR VALIDATION</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-5 h-5 flex-shrink-0" />
                      <span>
                        BILLET DÉJÀ UTILISÉ
                        {ticket.scannedAt &&
                          ` (${new Date(ticket.scannedAt).toLocaleTimeString('fr-FR', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })})`}
                      </span>
                    </>
                  )}
                </div>

                {/* VALIDATION ACTION RESULT BANNER */}
                {validationResult && (
                  <div
                    style={{
                      marginTop: '16px',
                      padding: '14px',
                      borderRadius: '14px',
                      textAlign: 'center',
                      background:
                        validationResult.code === 'VALIDATED'
                          ? 'rgba(16, 185, 129, 0.25)'
                          : 'rgba(239, 68, 68, 0.25)',
                      border:
                        validationResult.code === 'VALIDATED'
                          ? '2px solid #10b981'
                          : '2px solid #ef4444',
                      color:
                        validationResult.code === 'VALIDATED' ? '#10b981' : '#fca5a5',
                      fontWeight: 900,
                      fontSize: '0.95rem',
                      lineHeight: 1.4,
                    }}
                  >
                    {validationResult.code === 'VALIDATED'
                      ? '🟢 ENTRÉE VALIDÉE — Billet accepté.'
                      : validationResult.code === 'ALREADY_USED'
                      ? '🔴 BILLET DÉJÀ UTILISÉ — Entrée refusée.'
                      : validationResult.code === 'UNPAID'
                      ? '⚠️ PAIEMENT NON CONFIRMÉ — Entrée refusée.'
                      : '⛔ BILLET INVALIDE — Entrée refusée.'}
                    <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#e2e8f0', marginTop: '4px' }}>
                      {validationResult.message}
                    </div>
                  </div>
                )}

                {/* ACTION BUTTON: VALIDATE ENTRY (EXIGENCE 4 & 5) */}
                {ticket.status === 'VALID' ? (
                  <button
                    type="button"
                    onClick={handleValidateEntry}
                    disabled={isValidating}
                    style={{
                      width: '100%',
                      marginTop: '20px',
                      padding: '15px',
                      borderRadius: '99px',
                      background: '#10b981',
                      color: '#ffffff',
                      border: 'none',
                      fontWeight: 900,
                      fontSize: '1.05rem',
                      cursor: isValidating ? 'not-allowed' : 'pointer',
                      boxShadow: '0 10px 25px rgba(16, 185, 129, 0.4)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                    }}
                  >
                    <CheckCircle2 className="w-5 h-5" />
                    <span>{isValidating ? 'Validation en cours...' : 'VALIDER L’ENTRÉE ✅'}</span>
                  </button>
                ) : (
                  <div style={{ marginTop: '16px', display: 'flex', gap: '8px' }}>
                    <div
                      style={{
                        flex: 1,
                        padding: '12px',
                        borderRadius: '12px',
                        background: 'rgba(239, 68, 68, 0.15)',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                        textAlign: 'center',
                        fontSize: '0.85rem',
                        fontWeight: 700,
                        color: '#f87171',
                      }}
                    >
                      Entrée refusée — Billet déjà consommé
                    </div>

                    {/* ADMIN RESET BUTTON (EXIGENCE 7) */}
                    <button
                      type="button"
                      onClick={handleResetTicket}
                      disabled={isResetting}
                      title="Réinitialiser l'état du billet (Admin uniquement)"
                      style={{
                        padding: '12px 14px',
                        borderRadius: '12px',
                        background: 'rgba(255, 255, 255, 0.1)',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        color: '#ffffff',
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      <RotateCcw className="w-4 h-4" />
                      <span>{isResetting ? '...' : 'Réinitialiser'}</span>
                    </button>
                  </div>
                )}

                {/* DETAILED INFORMATION TABLE (EXIGENCE 3) */}
                <div
                  style={{
                    marginTop: '24px',
                    padding: '16px',
                    borderRadius: '18px',
                    background: '#161e33',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                    fontSize: '0.88rem',
                  }}
                >
                  <h4 style={{ fontSize: '0.8rem', fontWeight: 800, color: '#818cf8', textTransform: 'uppercase' }}>
                    Informations Détaillées du Billet :
                  </h4>

                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255, 255, 255, 0.06)', paddingBottom: '6px' }}>
                    <span style={{ color: '#94a3b8' }}>Numéro unique :</span>
                    <span style={{ fontFamily: 'monospace', fontWeight: 800, color: '#fbbf24' }}>
                      {ticket.ticketCode}
                    </span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255, 255, 255, 0.06)', paddingBottom: '6px' }}>
                    <span style={{ color: '#94a3b8' }}>Participant :</span>
                    <span style={{ fontWeight: 800, color: '#ffffff' }}>
                      {ticket.buyerName || 'Non renseigné'}
                    </span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255, 255, 255, 0.06)', paddingBottom: '6px' }}>
                    <span style={{ color: '#94a3b8' }}>Événement :</span>
                    <span style={{ fontWeight: 700, color: '#ffffff', textAlign: 'right', maxWidth: '60%' }}>
                      {ticket.eventTitle}
                    </span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255, 255, 255, 0.06)', paddingBottom: '6px' }}>
                    <span style={{ color: '#94a3b8' }}>Catégorie de Pass :</span>
                    <span style={{ fontWeight: 800, color: '#818cf8' }}>
                      {ticket.passName} ({ticket.quantity || 1})
                    </span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255, 255, 255, 0.06)', paddingBottom: '6px' }}>
                    <span style={{ color: '#94a3b8' }}>Réf. Commande :</span>
                    <span style={{ fontFamily: 'monospace', color: '#cbd5e1' }}>
                      {ticket.orderRef || `CMD-${ticket.id.slice(-6)}`}
                    </span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255, 255, 255, 0.06)', paddingBottom: '6px' }}>
                    <span style={{ color: '#94a3b8' }}>Statut Paiement :</span>
                    <span
                      style={{
                        fontWeight: 800,
                        color:
                          (ticket.paymentStatus || 'PAID') === 'PAID'
                            ? '#10b981'
                            : '#f59e0b',
                      }}
                    >
                      {(ticket.paymentStatus || 'PAID') === 'PAID'
                        ? 'CONFIRMÉ (Payé)'
                        : ticket.paymentStatus}
                    </span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255, 255, 255, 0.06)', paddingBottom: '6px' }}>
                    <span style={{ color: '#94a3b8' }}>Statut Validation :</span>
                    <span
                      style={{
                        fontWeight: 800,
                        color: ticket.status === 'VALID' ? '#10b981' : '#ef4444',
                      }}
                    >
                      {ticket.status === 'VALID' ? 'NON UTILISÉ' : 'UTILISÉ'}
                    </span>
                  </div>

                  {ticket.status === 'USED' && ticket.scannedAt && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255, 255, 255, 0.06)', paddingBottom: '6px' }}>
                      <span style={{ color: '#94a3b8' }}>Date & Heure validation :</span>
                      <span style={{ color: '#ffffff', fontWeight: 600 }}>
                        {new Date(ticket.scannedAt).toLocaleDateString('fr-FR')} à{' '}
                        {new Date(ticket.scannedAt).toLocaleTimeString('fr-FR')}
                      </span>
                    </div>
                  )}

                  {ticket.status === 'USED' && (
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#94a3b8' }}>Agent responsable :</span>
                      <span style={{ fontWeight: 700, color: '#818cf8' }}>
                        {ticket.scannedByAgentName || 'Admin /keril'}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </main>

      <Footer />
    </>
  );
}

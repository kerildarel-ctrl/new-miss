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
  RotateCcw,
  Ticket,
  ArrowLeft,
  KeyRound,
  Download,
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

  // Handle Entrance Validation
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

  // Handle Reset to VALID
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
        <div style={{ maxWidth: '560px', margin: '0 auto' }}>
          {/* BACK BREADCRUMB */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <Link
              href="/billetterie"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                color: 'var(--p)',
                fontWeight: 700,
                fontSize: '0.88rem',
                textDecoration: 'none',
              }}
            >
              <ArrowLeft className="w-4 h-4" /> Retour à la Billetterie
            </Link>

            {isAuthorized && (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  color: 'var(--p)',
                  fontWeight: 700,
                  fontSize: '0.82rem',
                  background: 'rgba(91, 61, 245, 0.1)',
                  padding: '4px 12px',
                  borderRadius: '99px',
                }}
              >
                <ShieldCheck className="w-3.5 h-3.5" /> Espace /keril
              </span>
            )}
          </div>

          {loading ? (
            <div
              className="db"
              style={{
                textAlign: 'center',
                padding: '60px 20px',
                background: 'var(--bg)',
                borderRadius: '24px',
                border: '1.5px solid var(--line)',
              }}
            >
              <p className="mute">Vérification du Billet...</p>
            </div>
          ) : !ticketExists ? (
            <div
              className="db"
              style={{
                textAlign: 'center',
                padding: '48px 24px',
                background: 'var(--bg)',
                borderRadius: '24px',
                border: '1.5px solid var(--a)',
              }}
            >
              <div style={{ fontSize: '2.5rem', marginBottom: '8px' }}>⛔</div>
              <h2 style={{ fontSize: '1.4rem', color: 'var(--a)', fontWeight: 800 }}>BILLET INVALIDE</h2>
              <p className="mute sm" style={{ marginTop: '8px' }}>
                Le code <b>{cleanCode}</b> ne correspond à aucun billet officiel enregistré.
              </p>
            </div>
          ) : !isAuthorized ? (
            /* =========================================================================
               VUE PUBLIQUE ANONYMISÉE — PALETTE HARMONISÉE SITE
               ========================================================================= */
            <div
              className="db"
              style={{
                background: 'var(--bg)',
                borderRadius: '24px',
                border: '1.5px solid var(--line)',
                boxShadow: 'var(--shadow)',
                overflow: 'hidden',
                padding: 0,
              }}
            >
              {/* HEADER WITH HERO PALETTE */}
              <div
                style={{
                  background: 'var(--hero)',
                  color: '#ffffff',
                  padding: '28px 20px',
                  textAlign: 'center',
                }}
              >
                <p className="eb" style={{ color: 'rgba(255, 255, 255, 0.85)', fontSize: '0.76rem' }}>
                  Billet Officiel Identifié
                </p>
                <h1 style={{ fontSize: '1.4rem', fontWeight: 800, marginTop: '6px' }}>
                  {publicEventTitle || 'Événement VoteMoi'}
                </h1>
                <p style={{ fontSize: '0.84rem', opacity: 0.85, marginTop: '4px', fontFamily: 'monospace' }}>
                  Code : {cleanCode}
                </p>
              </div>

              {/* QR CODE & NEUTRAL NOTICE */}
              <div style={{ padding: '28px 24px', textAlign: 'center' }}>
                <div
                  style={{
                    padding: '16px',
                    background: '#ffffff',
                    borderRadius: '20px',
                    display: 'inline-block',
                    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.08)',
                    border: '1px solid var(--line)',
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
                      fontWeight: 800,
                      color: 'var(--ink)',
                      letterSpacing: '0.05em',
                      fontFamily: 'monospace',
                    }}
                  >
                    {cleanCode}
                  </div>
                </div>

                {/* NEUTRAL NOTICE */}
                <div
                  style={{
                    marginTop: '24px',
                    padding: '16px',
                    borderRadius: '16px',
                    background: 'var(--soft)',
                    border: '1px solid var(--line)',
                    textAlign: 'left',
                    display: 'flex',
                    gap: '12px',
                    alignItems: 'flex-start',
                  }}
                >
                  <Lock className="w-5 h-5 flex-shrink-0" style={{ color: 'var(--p)', marginTop: '2px' }} />
                  <div>
                    <h3 style={{ fontSize: '0.92rem', fontWeight: 800, color: 'var(--ink)' }}>
                      Billet identifié
                    </h3>
                    <p className="mute sm" style={{ marginTop: '4px', lineHeight: 1.5 }}>
                      Connectez-vous avec un compte administrateur autorisé pour consulter les informations et
                      vérifier son statut.
                    </p>
                  </div>
                </div>

                {/* ADMIN LOGIN */}
                {!showLoginForm ? (
                  <button
                    type="button"
                    onClick={() => setShowLoginForm(true)}
                    style={{
                      width: '100%',
                      marginTop: '20px',
                      padding: '12px',
                      borderRadius: '12px',
                      background: 'var(--soft)',
                      border: '1px solid var(--line)',
                      color: 'var(--ink)',
                      fontWeight: 700,
                      fontSize: '0.88rem',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                    }}
                  >
                    <KeyRound className="w-4 h-4" style={{ color: 'var(--p)' }} />
                    <span>Accès Contrôleur / Administrateur (/keril)</span>
                  </button>
                ) : (
                  <form
                    onSubmit={handleAdminLogin}
                    style={{
                      marginTop: '20px',
                      padding: '18px',
                      borderRadius: '16px',
                      background: 'var(--soft)',
                      border: '1px solid var(--line)',
                      textAlign: 'left',
                    }}
                  >
                    <label style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--ink)', display: 'block' }}>
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
                        background: 'var(--bg)',
                        border: '1.5px solid var(--line)',
                        borderRadius: '10px',
                        padding: '0 12px',
                        color: 'var(--ink)',
                        fontSize: '0.9rem',
                        marginTop: '6px',
                        outline: 'none',
                      }}
                    />

                    {loginError && (
                      <div style={{ color: 'var(--err)', fontSize: '0.8rem', marginTop: '6px', fontWeight: 600 }}>
                        ⚠️ {loginError}
                      </div>
                    )}

                    <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                      <button
                        type="submit"
                        disabled={isLoggingIn}
                        className="btn"
                        style={{ flex: 1, height: '40px', fontSize: '0.85rem' }}
                      >
                        {isLoggingIn ? 'Connexion...' : 'Se connecter'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowLoginForm(false)}
                        style={{
                          padding: '0 14px',
                          borderRadius: '10px',
                          background: 'var(--bg)',
                          border: '1px solid var(--line)',
                          color: 'var(--ink)',
                          fontWeight: 600,
                          fontSize: '0.85rem',
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
               VUE ADMINISTRATEUR / CONTRÔLEUR CONNECTÉ — PALETTE HARMONISÉE
               ========================================================================= */
            <div
              className="db"
              style={{
                background: 'var(--bg)',
                borderRadius: '24px',
                border: '1.5px solid var(--line)',
                boxShadow: 'var(--shadow)',
                overflow: 'hidden',
                padding: 0,
              }}
            >
              {/* TOP SESSION NOTICE */}
              <div
                style={{
                  background: 'rgba(91, 61, 245, 0.08)',
                  borderBottom: '1px solid var(--line)',
                  padding: '10px 16px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '0.78rem',
                }}
              >
                <span style={{ color: 'var(--p)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <ShieldCheck className="w-3.5 h-3.5" /> Session Administrateur /keril
                </span>
                <span className="mute">Contrôle d&apos;Entrée</span>
              </div>

              {/* TICKET HEADER */}
              <div
                style={{
                  background: 'var(--hero)',
                  color: '#ffffff',
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
                    fontSize: '0.76rem',
                    fontWeight: 800,
                  }}
                >
                  🎟️ {ticket.passName}
                </span>
                <h1 style={{ fontSize: '1.4rem', fontWeight: 800, marginTop: '8px' }}>
                  {ticket.eventTitle}
                </h1>
                <p style={{ fontSize: '0.86rem', opacity: 0.9, marginTop: '2px', fontFamily: 'monospace' }}>
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
                    borderRadius: '12px',
                    fontWeight: 800,
                    fontSize: '0.88rem',
                    background:
                      ticket.status === 'VALID' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(255, 90, 126, 0.12)',
                    border:
                      ticket.status === 'VALID' ? '1.5px solid #10b981' : '1.5px solid var(--a)',
                    color: ticket.status === 'VALID' ? '#10b981' : 'var(--a)',
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
                      borderRadius: '12px',
                      textAlign: 'center',
                      background:
                        validationResult.code === 'VALIDATED'
                          ? 'rgba(16, 185, 129, 0.15)'
                          : 'rgba(255, 90, 126, 0.15)',
                      border:
                        validationResult.code === 'VALIDATED'
                          ? '1.5px solid #10b981'
                          : '1.5px solid var(--a)',
                      color: validationResult.code === 'VALIDATED' ? '#10b981' : 'var(--a)',
                      fontWeight: 800,
                      fontSize: '0.92rem',
                    }}
                  >
                    {validationResult.code === 'VALIDATED'
                      ? '🟢 ENTRÉE VALIDÉE — Billet accepté.'
                      : validationResult.code === 'ALREADY_USED'
                      ? '🔴 BILLET DÉJÀ UTILISÉ — Entrée refusée.'
                      : validationResult.code === 'UNPAID'
                      ? '⚠️ PAIEMENT NON CONFIRMÉ — Entrée refusée.'
                      : '⛔ BILLET INVALIDE — Entrée refusée.'}
                    <div style={{ fontSize: '0.8rem', color: 'var(--ink)', marginTop: '4px', fontWeight: 600 }}>
                      {validationResult.message}
                    </div>
                  </div>
                )}

                {/* ACTION BUTTON: VALIDATE ENTRY */}
                {ticket.status === 'VALID' ? (
                  <button
                    type="button"
                    onClick={handleValidateEntry}
                    disabled={isValidating}
                    className="btn full"
                    style={{
                      marginTop: '20px',
                      height: '48px',
                      fontSize: '1rem',
                      fontWeight: 800,
                      gap: '8px',
                      cursor: isValidating ? 'not-allowed' : 'pointer',
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
                        background: 'rgba(255, 90, 126, 0.1)',
                        border: '1px solid var(--a)',
                        textAlign: 'center',
                        fontSize: '0.84rem',
                        fontWeight: 700,
                        color: 'var(--a)',
                      }}
                    >
                      Entrée refusée — Billet déjà consommé
                    </div>

                    <button
                      type="button"
                      onClick={handleResetTicket}
                      disabled={isResetting}
                      style={{
                        padding: '0 14px',
                        borderRadius: '12px',
                        background: 'var(--soft)',
                        border: '1px solid var(--line)',
                        color: 'var(--ink)',
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

                {/* DETAILS TABLE */}
                <div
                  style={{
                    marginTop: '24px',
                    padding: '18px',
                    borderRadius: '16px',
                    background: 'var(--soft)',
                    border: '1px solid var(--line)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                    fontSize: '0.88rem',
                  }}
                >
                  <p className="eb" style={{ color: 'var(--p)', fontSize: '0.74rem' }}>
                    Détails du Billet :
                  </p>

                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--line)', paddingBottom: '6px' }}>
                    <span className="mute">Numéro unique :</span>
                    <span style={{ fontFamily: 'monospace', fontWeight: 800, color: 'var(--p)' }}>
                      {ticket.ticketCode}
                    </span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--line)', paddingBottom: '6px' }}>
                    <span className="mute">Participant :</span>
                    <span style={{ fontWeight: 700, color: 'var(--ink)' }}>
                      {ticket.buyerName || 'Non renseigné'}
                    </span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--line)', paddingBottom: '6px' }}>
                    <span className="mute">Événement :</span>
                    <span style={{ fontWeight: 600, color: 'var(--ink)', textAlign: 'right', maxWidth: '60%' }}>
                      {ticket.eventTitle}
                    </span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--line)', paddingBottom: '6px' }}>
                    <span className="mute">Catégorie :</span>
                    <span style={{ fontWeight: 700, color: 'var(--p)' }}>
                      {ticket.passName} ({ticket.quantity || 1})
                    </span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--line)', paddingBottom: '6px' }}>
                    <span className="mute">Réf. Commande :</span>
                    <span style={{ fontFamily: 'monospace', color: 'var(--ink)' }}>
                      {ticket.orderRef || `CMD-${ticket.id.slice(-6)}`}
                    </span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--line)', paddingBottom: '6px' }}>
                    <span className="mute">Paiement :</span>
                    <span style={{ fontWeight: 800, color: '#10b981' }}>
                      {(ticket.paymentStatus || 'PAID') === 'PAID' ? 'CONFIRMÉ' : ticket.paymentStatus}
                    </span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--line)', paddingBottom: '6px' }}>
                    <span className="mute">Statut Validation :</span>
                    <span style={{ fontWeight: 800, color: ticket.status === 'VALID' ? '#10b981' : 'var(--a)' }}>
                      {ticket.status === 'VALID' ? 'NON UTILISÉ' : 'UTILISÉ'}
                    </span>
                  </div>

                  {ticket.status === 'USED' && ticket.scannedAt && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--line)', paddingBottom: '6px' }}>
                      <span className="mute">Date & Heure :</span>
                      <span style={{ color: 'var(--ink)', fontWeight: 600 }}>
                        {new Date(ticket.scannedAt).toLocaleDateString('fr-FR')} à{' '}
                        {new Date(ticket.scannedAt).toLocaleTimeString('fr-FR')}
                      </span>
                    </div>
                  )}

                  {ticket.status === 'USED' && (
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span className="mute">Agent responsable :</span>
                      <span style={{ fontWeight: 700, color: 'var(--p)' }}>
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

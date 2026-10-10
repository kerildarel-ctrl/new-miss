'use client';

import React, { useState, useEffect } from 'react';
import { Candidate } from '@/data/mockData';
import { getCompetitions } from '@/services/dbService';
import { useLanguage } from '@/context/LanguageContext';

interface VoteModalProps {
  isOpen: boolean;
  candidate: Candidate | null;
  onClose: () => void;
  onConfirmVote: (candidateId: string, count: number) => void;
}

export const VoteModal: React.FC<VoteModalProps> = ({
  isOpen,
  candidate,
  onClose,
  onConfirmVote,
}) => {
  const { t } = useLanguage();
  const [voteCount, setVoteCount] = useState<number>(1);
  const [paymentMethod, setPaymentMethod] = useState<'orange' | 'mtn'>('orange');
  const [phoneNumber, setPhoneNumber] = useState('');

  // Payment Flow States
  const [step, setStep] = useState<'FORM' | 'WAITING_PAYMENT' | 'SUCCESS' | 'FAILED'>('FORM');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [transId, setTransId] = useState<string | null>(null);
  const [voteId, setVoteId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [unitVotePrice, setUnitVotePrice] = useState<number>(100);

  // Fetch custom votePrice per competition
  useEffect(() => {
    async function loadVotePrice() {
      if (candidate?.competitionSlug) {
        const comps = await getCompetitions();
        const comp = comps.find((c) => c.slug === candidate.competitionSlug);
        if (comp && comp.votePrice) {
          setUnitVotePrice(comp.votePrice);
        }
      }
    }
    if (isOpen && candidate) {
      loadVotePrice();
    }
  }, [isOpen, candidate]);

  // Automatic Polling to verify Mobile Money debit status
  useEffect(() => {
    let timer: NodeJS.Timeout;

    if (step === 'WAITING_PAYMENT' && transId) {
      timer = setInterval(async () => {
        try {
          const res = await fetch(`/api/pay/status?transId=${transId}&voteId=${voteId || ''}`, {
            cache: 'no-store',
          });
          const data = await res.json();

          if (data.isSuccess) {
            clearInterval(timer);
            setStep('SUCCESS');
            onConfirmVote(candidate?.id || '', voteCount);
          } else if (data.status === 'FAILED' || data.status === 'EXPIRED') {
            clearInterval(timer);
            setErrorMessage('Le paiement a été refusé ou a expiré. Aucun compte n’a été débité.');
            setStep('FAILED');
          }
        } catch {
          // Continue polling
        }
      }, 3000);
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [step, transId, voteId, candidate, voteCount, onConfirmVote]);

  if (!isOpen || !candidate) return null;

  const totalPrice = voteCount * unitVotePrice;

  // Initiate Payment & AUTOMATICALLY REDIRECT TO PAYMENT PORTAL
  const handleInitiatePayment = async () => {
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const response = await fetch('/api/pay/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          candidateId: candidate.id,
          candidateName: `${candidate.firstName} ${candidate.lastName}`,
          competitionSlug: candidate.competitionSlug,
          voteCount: voteCount,
          amount: totalPrice,
          paymentMethod: paymentMethod,
          phone: phoneNumber,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setTransId(data.transId);
        setVoteId(data.voteId);

        // Simulation Mode
        if (data.transId && data.transId.startsWith('sim_')) {
          setIsSubmitting(false);
          setStep('SUCCESS');
          onConfirmVote(candidate.id, voteCount);
          return;
        }

        // Automatic redirect to payment portal if link is provided
        if (data.link && typeof window !== 'undefined') {
          window.location.href = data.link;
        } else {
          setIsSubmitting(false);
          setStep('WAITING_PAYMENT');
        }
      } else {
        setIsSubmitting(false);
        setErrorMessage(data.error || 'Erreur lors de l’initialisation de la demande de paiement.');
        setStep('FAILED');
      }
    } catch {
      setIsSubmitting(false);
      setErrorMessage('Erreur réseau. Impossible d’initier le paiement.');
      setStep('FAILED');
    }
  };

  const handleCloseAll = () => {
    setStep('FORM');
    setVoteCount(1);
    setTransId(null);
    setVoteId(null);
    setErrorMessage(null);
    onClose();
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        display: 'grid',
        placeItems: 'center',
        background: 'rgba(11, 15, 25, 0.75)',
        backdropFilter: 'blur(10px)',
        padding: '16px',
        overflowY: 'auto',
      }}
      onClick={handleCloseAll}
    >
      <div
        style={{
          margin: 'auto',
          position: 'relative',
          width: '100%',
          maxWidth: '480px',
          background: 'var(--card, #111827)',
          color: 'var(--ink, #f9fafb)',
          borderRadius: '24px',
          padding: '24px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.5), 0 0 40px rgba(124, 58, 237, 0.15)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* CLOSE BUTTON */}
        <button
          type="button"
          onClick={handleCloseAll}
          aria-label="Fermer la fenêtre"
          style={{
            position: 'absolute',
            top: '18px',
            right: '18px',
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.08)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            color: 'var(--ink, #fff)',
            display: 'grid',
            placeItems: 'center',
            cursor: 'pointer',
            fontSize: '1rem',
            transition: 'all 0.2s',
          }}
        >
          ✕
        </button>

        {step === 'FORM' && (
          <>
            {/* BADGE */}
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(124, 58, 237, 0.15)', color: '#a78bfa', padding: '4px 10px', borderRadius: '999px', fontSize: '0.78rem', fontWeight: 600 }}>
              <span>🛡️</span>
              <span>{t('vote.badge', 'Vote officiel sécurisé')}</span>
            </div>

            <h2 style={{ marginTop: '8px', fontSize: '1.4rem', fontWeight: 700, lineHeight: 1.25 }}>
              {t('vote.title', 'Voter pour')} <span style={{ color: '#a78bfa' }}>{candidate.firstName} {candidate.lastName}</span>
            </h2>
            <p style={{ marginTop: '4px', fontSize: '0.82rem', color: '#9ca3af' }}>
              {t('vote.candidate', 'Candidat')} #{candidate.candidateNumber.replace('#', '')} · {unitVotePrice} FCFA / vote
            </p>

            {/* TOTAL PRICE HIGHLIGHT CARD */}
            <div
              style={{
                marginTop: '16px',
                padding: '14px 18px',
                borderRadius: '16px',
                background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.18) 0%, rgba(99, 102, 241, 0.1) 100%)',
                border: '1px solid rgba(124, 58, 237, 0.35)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div>
                <span style={{ fontSize: '0.88rem', color: '#e2e8f0', display: 'block', fontWeight: 500 }}>
                  {voteCount} vote{voteCount > 1 ? 's' : ''}
                </span>
                <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
                  ({unitVotePrice} FCFA / vote)
                </span>
              </div>
              <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#fbbf24', letterSpacing: '-0.02em' }}>
                {totalPrice.toLocaleString('fr-FR')} <span style={{ fontSize: '0.95rem', fontWeight: 600 }}>FCFA</span>
              </div>
            </div>

            {/* QUANTITY STEPPER */}
            <label
              htmlFor="inpQte"
              style={{ display: 'block', marginTop: '16px', fontSize: '0.84rem', fontWeight: 600, color: '#d1d5db' }}
            >
              {t('vote.countLabel', 'Nombre de votes (ou montant de votre choix)')}
            </label>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginTop: '6px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1.5px solid rgba(255, 255, 255, 0.12)',
                borderRadius: '14px',
                padding: '6px',
              }}
            >
              <button
                type="button"
                onClick={() => setVoteCount((prev) => Math.max(1, prev - 1))}
                aria-label="Diminuer"
                style={{
                  width: '44px',
                  height: '42px',
                  borderRadius: '10px',
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: 'none',
                  color: '#fff',
                  fontSize: '1.3rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'grid',
                  placeItems: 'center',
                }}
              >
                -
              </button>
              <input
                type="number"
                id="inpQte"
                min="1"
                max="5000"
                value={voteCount}
                onChange={(e) => setVoteCount(Math.max(1, parseInt(e.target.value) || 1))}
                style={{
                  flex: 1,
                  background: 'transparent',
                  border: 'none',
                  color: '#fff',
                  fontSize: '1.35rem',
                  fontWeight: 700,
                  textAlign: 'center',
                  outline: 'none',
                }}
              />
              <button
                type="button"
                onClick={() => setVoteCount((prev) => prev + 1)}
                aria-label="Augmenter"
                style={{
                  width: '44px',
                  height: '42px',
                  borderRadius: '10px',
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: 'none',
                  color: '#fff',
                  fontSize: '1.3rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'grid',
                  placeItems: 'center',
                }}
              >
                +
              </button>
            </div>

            {/* QUICK PACK PILLS */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '8px',
                marginTop: '12px',
              }}
              aria-label="Packs de votes rapides"
            >
              {[
                { qty: 1, label: '1 vote', price: '100 F' },
                { qty: 5, label: '5 votes', price: '500 F' },
                { qty: 10, label: '10 votes', price: '1 000 F' },
                { qty: 25, label: '25 votes', price: '2 500 F' },
                { qty: 50, label: '50 votes', price: '5 000 F' },
                { qty: 100, label: '100 votes', price: '10 000 F' },
              ].map(({ qty, label, price }) => {
                const isActive = voteCount === qty;
                return (
                  <button
                    key={qty}
                    type="button"
                    aria-pressed={isActive}
                    onClick={() => setVoteCount(qty)}
                    style={{
                      padding: '8px 4px',
                      borderRadius: '12px',
                      border: isActive
                        ? '1.5px solid #a78bfa'
                        : '1px solid rgba(255, 255, 255, 0.08)',
                      background: isActive
                        ? 'linear-gradient(135deg, rgba(124, 58, 237, 0.3) 0%, rgba(99, 102, 241, 0.2) 100%)'
                        : 'rgba(255, 255, 255, 0.04)',
                      color: isActive ? '#fff' : '#d1d5db',
                      cursor: 'pointer',
                      textAlign: 'center',
                      transition: 'all 0.15s',
                    }}
                  >
                    <div style={{ fontSize: '0.8rem', fontWeight: isActive ? 700 : 600 }}>{label}</div>
                    <div style={{ fontSize: '0.72rem', color: isActive ? '#fbbf24' : '#9ca3af' }}>{price}</div>
                  </button>
                );
              })}
            </div>

            {/* OPERATOR CARDS */}
            <label style={{ display: 'block', marginTop: '16px', fontSize: '0.84rem', fontWeight: 600, color: '#d1d5db' }}>
              {t('vote.paymentMethod', 'Moyen de paiement')}
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '6px' }}>
              {/* ORANGE MONEY */}
              <button
                type="button"
                onClick={() => setPaymentMethod('orange')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '12px 14px',
                  borderRadius: '14px',
                  border: paymentMethod === 'orange' ? '2px solid #ff7900' : '1px solid rgba(255, 255, 255, 0.1)',
                  background: paymentMethod === 'orange' ? 'rgba(255, 121, 0, 0.12)' : 'rgba(255, 255, 255, 0.03)',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <div style={{ width: '14px', height: '14px', borderRadius: '50%', background: '#ff7900', boxShadow: paymentMethod === 'orange' ? '0 0 8px #ff7900' : 'none' }} />
                <div>
                  <div style={{ fontSize: '0.88rem', fontWeight: 700, color: paymentMethod === 'orange' ? '#ff7900' : '#fff' }}>Orange Money</div>
                  <div style={{ fontSize: '0.7rem', color: '#9ca3af' }}>#150#</div>
                </div>
              </button>

              {/* MTN MOMO */}
              <button
                type="button"
                onClick={() => setPaymentMethod('mtn')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '12px 14px',
                  borderRadius: '14px',
                  border: paymentMethod === 'mtn' ? '2px solid #ffcc00' : '1px solid rgba(255, 255, 255, 0.1)',
                  background: paymentMethod === 'mtn' ? 'rgba(255, 204, 0, 0.12)' : 'rgba(255, 255, 255, 0.03)',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <div style={{ width: '14px', height: '14px', borderRadius: '50%', background: '#ffcc00', boxShadow: paymentMethod === 'mtn' ? '0 0 8px #ffcc00' : 'none' }} />
                <div>
                  <div style={{ fontSize: '0.88rem', fontWeight: 700, color: paymentMethod === 'mtn' ? '#ffcc00' : '#fff' }}>MTN MoMo</div>
                  <div style={{ fontSize: '0.7rem', color: '#9ca3af' }}>*126#</div>
                </div>
              </button>
            </div>

            {/* PHONE INPUT */}
            <label
              htmlFor="inpTel"
              style={{ display: 'block', marginTop: '16px', fontSize: '0.84rem', fontWeight: 600, color: '#d1d5db' }}
            >
              {t('vote.phone', 'Numéro de téléphone')}
            </label>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginTop: '6px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1.5px solid rgba(255, 255, 255, 0.12)',
                borderRadius: '14px',
                padding: '0 12px',
              }}
            >
              <span style={{ fontSize: '0.85rem', color: '#a78bfa', fontWeight: 600 }}>🇨🇲 +237</span>
              <input
                type="tel"
                id="inpTel"
                placeholder="6XX XXX XXX"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                style={{
                  flex: 1,
                  background: 'transparent',
                  border: 'none',
                  color: '#fff',
                  padding: '12px 0',
                  fontSize: '0.95rem',
                  outline: 'none',
                }}
              />
            </div>
            <span style={{ display: 'block', fontSize: '0.74rem', color: '#9ca3af', marginTop: '4px' }}>
              {t('vote.phoneTip', 'Numéro Orange Money ou MTN Mobile Money (+237).')}
            </span>

            {errorMessage && (
              <div
                style={{
                  background: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  color: '#f87171',
                  borderRadius: '12px',
                  padding: '10px 14px',
                  fontSize: '0.82rem',
                  marginTop: '12px',
                }}
              >
                {errorMessage}
              </div>
            )}

            {/* SUBMIT BUTTON */}
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleInitiatePayment}
              style={{
                width: '100%',
                marginTop: '20px',
                padding: '15px 20px',
                borderRadius: '16px',
                border: 'none',
                background: 'linear-gradient(135deg, #7c3aed 0%, #6366f1 100%)',
                color: '#fff',
                fontSize: '1rem',
                fontWeight: 700,
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                boxShadow: '0 10px 25px rgba(124, 58, 237, 0.35)',
                transition: 'all 0.2s',
                opacity: isSubmitting ? 0.7 : 1,
              }}
            >
              {isSubmitting
                ? 'Connexion sécurisée en cours...'
                : `${t('vote.payBtn', 'Payer')} ${totalPrice.toLocaleString('fr-FR')} FCFA & ${t('vote.title', 'voter')}`}
            </button>

            {/* SECURITY NOTICE */}
            <p
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                fontSize: '0.75rem',
                color: '#9ca3af',
                marginTop: '12px',
                textAlign: 'center',
              }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <rect x="3" y="11" width="18" height="11" rx="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              <span>{t('vote.secureNote', 'Paiement chiffré et sécurisé. Débit direct après validation USSD.')}</span>
            </p>
          </>
        )}

        {step === 'WAITING_PAYMENT' && (
          <div style={{ textAlign: 'center', padding: '24px 0' }}>
            <div style={{ fontSize: '2rem', marginBottom: '8px' }}>📲</div>
            <p style={{ color: '#a78bfa', fontSize: '0.85rem', fontWeight: 600 }}>En attente de confirmation</p>
            <h2 style={{ marginTop: '8px', fontSize: '1.3rem' }}>Validez sur votre téléphone</h2>
            <p style={{ marginTop: '8px', color: '#9ca3af', fontSize: '0.88rem', lineHeight: 1.5 }}>
              Une demande de débit de <b style={{ color: '#fbbf24' }}>{totalPrice.toLocaleString('fr-FR')} FCFA</b> a été envoyée sur votre
              numéro. Tapez votre code secret Mobile Money pour approuver.
            </p>
            <div style={{ marginTop: '24px' }}>
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  border: '3px solid #7c3aed',
                  borderTopColor: 'transparent',
                  animation: 'spin 1s linear infinite',
                  margin: '0 auto',
                }}
              />
            </div>
            <p style={{ fontSize: '0.8rem', color: '#9ca3af', marginTop: '16px' }}>
              Vérification automatique en cours...
            </p>
          </div>
        )}

        {step === 'SUCCESS' && (
          <div style={{ textAlign: 'center', padding: '24px 0' }}>
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: 'rgba(16, 185, 129, 0.15)',
                color: '#10b981',
                display: 'grid',
                placeItems: 'center',
                margin: '0 auto 16px',
                fontSize: '2rem',
                border: '1px solid rgba(16, 185, 129, 0.3)',
              }}
            >
              ✓
            </div>
            <p style={{ color: '#10b981', fontWeight: 700, fontSize: '0.9rem' }}>Paiement réussi</p>
            <h2 style={{ marginTop: '6px', fontSize: '1.35rem' }}>{t('vote.successTitle', 'Merci pour votre vote !')}</h2>
            <p style={{ color: '#9ca3af', marginTop: '8px', fontSize: '0.9rem' }}>
              Vos <b style={{ color: '#fff' }}>{voteCount} vote{voteCount > 1 ? 's' : ''}</b> pour{' '}
              <b style={{ color: '#a78bfa' }}>{candidate.firstName} {candidate.lastName}</b> ont bien été comptabilisés.
            </p>
            <button
              type="button"
              onClick={handleCloseAll}
              style={{
                width: '100%',
                marginTop: '24px',
                padding: '14px',
                borderRadius: '16px',
                border: 'none',
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                color: '#fff',
                fontSize: '0.95rem',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              {t('vote.close', 'Fermer')}
            </button>
          </div>
        )}

        {step === 'FAILED' && (
          <div style={{ textAlign: 'center', padding: '24px 0' }}>
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: 'rgba(239, 68, 68, 0.15)',
                color: '#ef4444',
                display: 'grid',
                placeItems: 'center',
                margin: '0 auto 16px',
                fontSize: '2rem',
                border: '1px solid rgba(239, 68, 68, 0.3)',
              }}
            >
              ✕
            </div>
            <p style={{ color: '#ef4444', fontWeight: 700, fontSize: '0.9rem' }}>Échec de la transaction</p>
            <h2 style={{ marginTop: '6px', fontSize: '1.35rem' }}>Le paiement n&apos;a pas abouti</h2>
            <p style={{ color: '#9ca3af', marginTop: '8px', fontSize: '0.88rem' }}>
              {errorMessage || 'Une erreur est survenue lors de la communication avec l’opérateur.'}
            </p>
            <div style={{ display: 'flex', gap: '10px', marginTop: '24px', justifyContent: 'center' }}>
              <button
                type="button"
                onClick={() => setStep('FORM')}
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: '14px',
                  border: 'none',
                  background: '#7c3aed',
                  color: '#fff',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Réessayer
              </button>
              <button
                type="button"
                onClick={handleCloseAll}
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: '14px',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  background: 'transparent',
                  color: '#fff',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Annuler
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

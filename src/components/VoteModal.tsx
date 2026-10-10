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

  // Automatic Polling for Mobile Money debit status
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

  // Initiate Payment
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

        if (data.transId && data.transId.startsWith('sim_')) {
          setIsSubmitting(false);
          setStep('SUCCESS');
          onConfirmVote(candidate.id, voteCount);
          return;
        }

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
        background: 'rgba(8, 12, 24, 0.85)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
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
          maxWidth: '460px',
          background: '#0f1526',
          color: '#ffffff',
          borderRadius: '24px',
          padding: '28px 24px',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.7), 0 0 40px rgba(129, 140, 248, 0.15)',
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
            top: '20px',
            right: '20px',
            width: '32px',
            height: '32px',
            background: 'none',
            border: 'none',
            color: '#94a3b8',
            display: 'grid',
            placeItems: 'center',
            cursor: 'pointer',
            fontSize: '1.2rem',
            fontWeight: 500,
            transition: 'color 0.2s',
          }}
        >
          ✕
        </button>

        {step === 'FORM' && (
          <>
            {/* BADGE */}
            <div style={{ color: '#818cf8', fontSize: '0.78rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              {t('vote.badge', 'VOTE OFFICIEL SÉCURISÉ')}
            </div>

            {/* TITLE & SUBTITLE */}
            <h2 style={{ marginTop: '6px', fontSize: '1.5rem', fontWeight: 800, color: '#ffffff', lineHeight: 1.25 }}>
              {t('vote.title', 'Voter pour')} {candidate.firstName} {candidate.lastName}
            </h2>
            <p style={{ marginTop: '4px', fontSize: '0.84rem', color: '#94a3b8', fontWeight: 400 }}>
              {t('vote.candidate', 'Candidat')} #{candidate.candidateNumber.replace('#', '')} · {unitVotePrice} FCFA par vote (Montant libre en multiples de {unitVotePrice} FCFA)
            </p>

            {/* TOTAL PRICE LINE CARD */}
            <div
              style={{
                marginTop: '16px',
                padding: '12px 16px',
                borderRadius: '14px',
                background: '#161e33',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div style={{ fontSize: '0.92rem', color: '#e2e8f0', fontWeight: 600 }}>
                {voteCount} vote{voteCount > 1 ? 's' : ''} ({unitVotePrice} FCFA / vote)
              </div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.01em' }}>
                {totalPrice.toLocaleString('fr-FR')} FCFA
              </div>
            </div>

            {/* STEPPER LABEL */}
            <label
              htmlFor="inpQte"
              style={{ display: 'block', marginTop: '18px', fontSize: '0.88rem', fontWeight: 700, color: '#ffffff' }}
            >
              {t('vote.countLabel', 'Nombre de votes (ou montant de votre choix)')}
            </label>

            {/* STEPPER ROW */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginTop: '8px',
              }}
            >
              <button
                type="button"
                onClick={() => setVoteCount((prev) => Math.max(1, prev - 1))}
                aria-label="Diminuer"
                style={{
                  width: '48px',
                  height: '46px',
                  borderRadius: '12px',
                  background: '#161e33',
                  border: '1.5px solid rgba(255, 255, 255, 0.15)',
                  color: '#ffffff',
                  fontSize: '1.3rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'grid',
                  placeItems: 'center',
                  transition: 'all 0.15s',
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
                  height: '46px',
                  background: '#161e33',
                  border: '1.5px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: '12px',
                  color: '#ffffff',
                  fontSize: '1.25rem',
                  fontWeight: 800,
                  textAlign: 'center',
                  outline: 'none',
                }}
              />
              <button
                type="button"
                onClick={() => setVoteCount((prev) => prev + 1)}
                aria-label="Augmenter"
                style={{
                  width: '48px',
                  height: '46px',
                  borderRadius: '12px',
                  background: '#161e33',
                  border: '1.5px solid rgba(255, 255, 255, 0.15)',
                  color: '#ffffff',
                  fontSize: '1.3rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'grid',
                  placeItems: 'center',
                  transition: 'all 0.15s',
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
                    onClick={() => setVoteCount(qty)}
                    style={{
                      padding: '8px 4px',
                      borderRadius: '10px',
                      border: isActive
                        ? '1.5px solid #818cf8'
                        : '1px solid rgba(255, 255, 255, 0.1)',
                      background: isActive
                        ? 'rgba(129, 140, 248, 0.2)'
                        : '#161e33',
                      color: isActive ? '#ffffff' : '#cbd5e1',
                      cursor: 'pointer',
                      textAlign: 'center',
                      fontSize: '0.82rem',
                      fontWeight: isActive ? 700 : 500,
                      transition: 'all 0.15s',
                    }}
                  >
                    {label} ({price})
                  </button>
                );
              })}
            </div>

            {/* PAYMENT METHOD SELECTION */}
            <label style={{ display: 'block', marginTop: '18px', fontSize: '0.88rem', fontWeight: 700, color: '#ffffff' }}>
              {t('vote.paymentMethod', 'Moyen de paiement')}
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
              {/* ORANGE MONEY RADIO */}
              <label
                onClick={() => setPaymentMethod('orange')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '12px 14px',
                  borderRadius: '12px',
                  background: '#161e33',
                  border: paymentMethod === 'orange' ? '1.5px solid #ff7900' : '1px solid rgba(255, 255, 255, 0.1)',
                  cursor: 'pointer',
                }}
              >
                <input
                  type="radio"
                  name="pm"
                  checked={paymentMethod === 'orange'}
                  onChange={() => setPaymentMethod('orange')}
                  style={{ accentColor: '#ff7900', width: '18px', height: '18px', cursor: 'pointer' }}
                />
                <span style={{ fontSize: '0.95rem', fontWeight: 700, color: paymentMethod === 'orange' ? '#ff7900' : '#ffffff' }}>
                  Orange Money
                </span>
                <span style={{ fontSize: '0.78rem', color: '#94a3b8', marginLeft: 'auto' }}>#150#</span>
              </label>

              {/* MTN MOMO RADIO */}
              <label
                onClick={() => setPaymentMethod('mtn')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '12px 14px',
                  borderRadius: '12px',
                  background: '#161e33',
                  border: paymentMethod === 'mtn' ? '1.5px solid #eab308' : '1px solid rgba(255, 255, 255, 0.1)',
                  cursor: 'pointer',
                }}
              >
                <input
                  type="radio"
                  name="pm"
                  checked={paymentMethod === 'mtn'}
                  onChange={() => setPaymentMethod('mtn')}
                  style={{ accentColor: '#eab308', width: '18px', height: '18px', cursor: 'pointer' }}
                />
                <span style={{ fontSize: '0.95rem', fontWeight: 700, color: paymentMethod === 'mtn' ? '#eab308' : '#ffffff' }}>
                  MTN MoMo
                </span>
                <span style={{ fontSize: '0.78rem', color: '#94a3b8', marginLeft: 'auto' }}>*126#</span>
              </label>
            </div>

            {/* PHONE INPUT */}
            <label
              htmlFor="inpTel"
              style={{ display: 'block', marginTop: '18px', fontSize: '0.88rem', fontWeight: 700, color: '#ffffff' }}
            >
              {t('vote.phone', 'Numéro de téléphone')}
            </label>
            <input
              type="tel"
              id="inpTel"
              placeholder="6XXXXXXXX"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              style={{
                width: '100%',
                marginTop: '8px',
                height: '48px',
                background: '#161e33',
                border: '1.5px solid rgba(255, 255, 255, 0.15)',
                borderRadius: '12px',
                padding: '0 16px',
                color: '#ffffff',
                fontSize: '0.95rem',
                fontWeight: 600,
                outline: 'none',
              }}
            />
            <span style={{ display: 'block', fontSize: '0.78rem', color: '#94a3b8', marginTop: '6px', fontWeight: 400 }}>
              {t('vote.phoneTip', 'Numéro Orange Money ou MTN Mobile Money (+237).')}
            </span>

            {errorMessage && (
              <div
                style={{
                  background: 'rgba(239, 68, 68, 0.2)',
                  border: '1px solid rgba(239, 68, 68, 0.4)',
                  color: '#fca5a5',
                  borderRadius: '12px',
                  padding: '12px 14px',
                  fontSize: '0.85rem',
                  marginTop: '14px',
                  fontWeight: 500,
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
                marginTop: '22px',
                padding: '15px 20px',
                borderRadius: '99px',
                border: 'none',
                background: '#818cf8',
                color: '#0f172a',
                fontSize: '1rem',
                fontWeight: 800,
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                boxShadow: '0 8px 24px rgba(129, 140, 248, 0.35)',
                transition: 'all 0.2s ease',
                opacity: isSubmitting ? 0.7 : 1,
              }}
            >
              {isSubmitting
                ? 'Connexion sécurisée en cours...'
                : `${t('vote.payBtn', 'Payer')} ${totalPrice.toLocaleString('fr-FR')} FCFA & ${t('vote.title', 'voter')}`}
            </button>

            {/* SECURITY FOOTER */}
            <p
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                fontSize: '0.78rem',
                color: '#94a3b8',
                marginTop: '14px',
                textAlign: 'center',
                fontWeight: 400,
              }}
            >
              <span>🔒</span>
              <span>{t('vote.secureNote', 'Paiement chiffré et sécurisé. Débit direct après validation USSD.')}</span>
            </p>
          </>
        )}

        {step === 'WAITING_PAYMENT' && (
          <div style={{ textAlign: 'center', padding: '24px 0' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>📲</div>
            <p style={{ color: '#818cf8', fontSize: '0.9rem', fontWeight: 700 }}>En attente de confirmation</p>
            <h2 style={{ marginTop: '8px', fontSize: '1.4rem', fontWeight: 800, color: '#ffffff' }}>Validez sur votre téléphone</h2>
            <p style={{ marginTop: '10px', color: '#cbd5e1', fontSize: '0.9rem', lineHeight: 1.5 }}>
              Une demande de débit de <b style={{ color: '#818cf8' }}>{totalPrice.toLocaleString('fr-FR')} FCFA</b> a été envoyée sur votre
              numéro. Tapez votre code secret Mobile Money pour approuver.
            </p>
            <div style={{ marginTop: '24px' }}>
              <div
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '50%',
                  border: '3px solid #818cf8',
                  borderTopColor: 'transparent',
                  animation: 'spin 1s linear infinite',
                  margin: '0 auto',
                }}
              />
            </div>
            <p style={{ fontSize: '0.82rem', color: '#94a3b8', marginTop: '16px', fontWeight: 500 }}>
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
                background: 'rgba(16, 185, 129, 0.2)',
                color: '#10b981',
                display: 'grid',
                placeItems: 'center',
                margin: '0 auto 16px',
                fontSize: '2.2rem',
                border: '1.5px solid rgba(16, 185, 129, 0.4)',
              }}
            >
              ✓
            </div>
            <p style={{ color: '#10b981', fontWeight: 800, fontSize: '0.95rem' }}>Paiement réussi</p>
            <h2 style={{ marginTop: '6px', fontSize: '1.4rem', fontWeight: 800, color: '#ffffff' }}>{t('vote.successTitle', 'Merci pour votre vote !')}</h2>
            <p style={{ color: '#cbd5e1', marginTop: '10px', fontSize: '0.92rem' }}>
              Vos <b style={{ color: '#ffffff' }}>{voteCount} vote{voteCount > 1 ? 's' : ''}</b> pour{' '}
              <b style={{ color: '#818cf8' }}>{candidate.firstName} {candidate.lastName}</b> ont bien été comptabilisés.
            </p>
            <button
              type="button"
              onClick={handleCloseAll}
              style={{
                width: '100%',
                marginTop: '24px',
                padding: '15px',
                borderRadius: '99px',
                border: 'none',
                background: '#10b981',
                color: '#ffffff',
                fontSize: '1rem',
                fontWeight: 800,
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
                background: 'rgba(239, 68, 68, 0.2)',
                color: '#ef4444',
                display: 'grid',
                placeItems: 'center',
                margin: '0 auto 16px',
                fontSize: '2.2rem',
                border: '1.5px solid rgba(239, 68, 68, 0.4)',
              }}
            >
              ✕
            </div>
            <p style={{ color: '#ef4444', fontWeight: 800, fontSize: '0.95rem' }}>Échec de la transaction</p>
            <h2 style={{ marginTop: '6px', fontSize: '1.4rem', fontWeight: 800, color: '#ffffff' }}>Le paiement n&apos;a pas abouti</h2>
            <p style={{ color: '#cbd5e1', marginTop: '10px', fontSize: '0.9rem' }}>
              {errorMessage || 'Une erreur est survenue lors de la communication avec l’opérateur.'}
            </p>
            <div style={{ display: 'flex', gap: '12px', marginTop: '24px', justifyContent: 'center' }}>
              <button
                type="button"
                onClick={() => setStep('FORM')}
                style={{
                  flex: 1,
                  padding: '14px',
                  borderRadius: '99px',
                  border: 'none',
                  background: '#818cf8',
                  color: '#0f172a',
                  fontWeight: 800,
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
                  padding: '14px',
                  borderRadius: '99px',
                  border: '1.5px solid rgba(255, 255, 255, 0.2)',
                  background: 'transparent',
                  color: '#ffffff',
                  fontWeight: 700,
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

'use client';

import React, { useState, useEffect } from 'react';
import { Candidate } from '@/data/mockData';
import { getCompetitions } from '@/services/dbService';

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
        background: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(8px)',
        padding: '16px',
        overflowY: 'auto',
      }}
      onClick={handleCloseAll}
    >
      <div
        className="db"
        style={{ margin: 'auto' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* CLOSE BUTTON */}
        <button
          type="button"
          className="cx"
          onClick={handleCloseAll}
          aria-label="Fermer la fenêtre"
        >
          ✕
        </button>

        {step === 'FORM' && (
          <>
            <p className="eb">Vote officiel sécurisé</p>
            <h2 style={{ marginTop: '4px' }}>
              Voter pour {candidate.firstName} {candidate.lastName}
            </h2>
            <p className="sm mute" style={{ marginTop: '4px' }}>
              Candidat #{candidate.candidateNumber} · 100 FCFA par vote (Montant libre en multiples de 100 FCFA)
            </p>

            {/* TOTAL PRICE BANNER */}
            <div className="phx">
              <span>
                {voteCount} vote{voteCount > 1 ? 's' : ''} (100 FCFA / vote)
              </span>
              <b>{totalPrice.toLocaleString('fr-FR')} FCFA</b>
            </div>

            {/* QUANTITY INPUT */}
            <label
              htmlFor="inpQte"
              style={{ display: 'block', marginTop: '16px', fontSize: '.85rem', fontWeight: 600 }}
            >
              Nombre de votes (ou montant de votre choix)
            </label>
            <div className="qte">
              <button
                type="button"
                onClick={() => setVoteCount((prev) => Math.max(1, prev - 1))}
                aria-label="Diminuer"
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
              />
              <button
                type="button"
                onClick={() => setVoteCount((prev) => prev + 1)}
                aria-label="Augmenter"
              >
                +
              </button>
            </div>

            {/* QUICK PILLS */}
            <div className="pk" aria-label="Packs de votes rapides">
              {[
                { qty: 1, label: '1 vote (100 F)' },
                { qty: 5, label: '5 votes (500 F)' },
                { qty: 10, label: '10 votes (1 000 F)' },
                { qty: 25, label: '25 votes (2 500 F)' },
                { qty: 50, label: '50 votes (5 000 F)' },
                { qty: 100, label: '100 votes (10 000 F)' },
              ].map(({ qty, label }) => (
                <button
                  key={qty}
                  type="button"
                  aria-pressed={voteCount === qty}
                  onClick={() => setVoteCount(qty)}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* OPERATOR RADIOS */}
            <label style={{ display: 'block', marginTop: '16px', fontSize: '.85rem', fontWeight: 600 }}>
              Moyen de paiement
            </label>
            <div className="ops" role="radiogroup">
              <label className="op">
                <input
                  type="radio"
                  name="payOp"
                  value="orange"
                  checked={paymentMethod === 'orange'}
                  onChange={() => setPaymentMethod('orange')}
                />
                <span className="om">Orange Money</span>
              </label>
              <label className="op">
                <input
                  type="radio"
                  name="payOp"
                  value="mtn"
                  checked={paymentMethod === 'mtn'}
                  onChange={() => setPaymentMethod('mtn')}
                />
                <span className="momo">MTN MoMo</span>
              </label>
            </div>

            {/* PHONE INPUT */}
            <label
              htmlFor="inpTel"
              style={{ display: 'block', marginTop: '14px', fontSize: '.85rem', fontWeight: 600 }}
            >
              Numéro de téléphone
            </label>
            <input
              type="tel"
              id="inpTel"
              placeholder="6XXXXXXXX"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
            />
            <span className="tip">Numéro Orange Money ou MTN Mobile Money (+237).</span>

            {errorMessage && (
              <div
                style={{
                  background: 'rgba(239, 68, 68, 0.1)',
                  color: '#ef4444',
                  borderRadius: '12px',
                  padding: '10px 14px',
                  fontSize: '0.85rem',
                  marginTop: '12px',
                }}
              >
                {errorMessage}
              </div>
            )}

            {/* SUBMIT BUTTON */}
            <button
              type="button"
              className="btn full"
              style={{ marginTop: '18px' }}
              disabled={isSubmitting}
              onClick={handleInitiatePayment}
            >
              {isSubmitting
                ? 'Connexion sécurisée en cours...'
                : `Payer ${totalPrice.toLocaleString('fr-FR')} FCFA & voter`}
            </button>

            {/* SECURITY NOTICE */}
            <p className="secu">
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <rect x="3" y="11" width="18" height="11" rx="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              Paiement chiffré et sécurisé. Débit direct après validation USSD.
            </p>
          </>
        )}

        {step === 'WAITING_PAYMENT' && (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <p className="eb">En attente de confirmation</p>
            <h2 style={{ marginTop: '8px' }}>Validez sur votre téléphone</h2>
            <p className="mute" style={{ marginTop: '8px', lineHeight: '1.5' }}>
              Une demande de débit de <b>{totalPrice.toLocaleString('fr-FR')} FCFA</b> a été envoyée sur votre
              numéro. Tapez votre code secret Mobile Money pour approuver.
            </p>
            <div style={{ marginTop: '24px' }}>
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  border: '3px solid var(--p)',
                  borderTopColor: 'transparent',
                  animation: 'spin 1s linear infinite',
                  margin: '0 auto',
                }}
              />
            </div>
            <p className="sm mute" style={{ marginTop: '16px' }}>
              Vérification automatique en cours...
            </p>
          </div>
        )}

        {step === 'SUCCESS' && (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
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
              }}
            >
              ✓
            </div>
            <p className="eb" style={{ color: '#10b981' }}>Paiement réussi</p>
            <h2 style={{ marginTop: '6px' }}>Merci pour votre vote !</h2>
            <p className="mute" style={{ marginTop: '8px' }}>
              Vos <b>{voteCount} vote{voteCount > 1 ? 's' : ''}</b> pour{' '}
              <b>{candidate.firstName} {candidate.lastName}</b> ont bien été comptabilisés.
            </p>
            <button
              type="button"
              className="btn full"
              style={{ marginTop: '24px' }}
              onClick={handleCloseAll}
            >
              Fermer
            </button>
          </div>
        )}

        {step === 'FAILED' && (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
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
              }}
            >
              ✕
            </div>
            <p className="eb" style={{ color: '#ef4444' }}>Échec de la transaction</p>
            <h2 style={{ marginTop: '6px' }}>Le paiement n&apos;a pas abouti</h2>
            <p className="mute" style={{ marginTop: '8px' }}>
              {errorMessage || 'Une erreur est survenue lors de la communication avec l’opérateur.'}
            </p>
            <div className="row" style={{ marginTop: '24px', justifyContent: 'center' }}>
              <button
                type="button"
                className="btn"
                onClick={() => setStep('FORM')}
              >
                Réessayer
              </button>
              <button
                type="button"
                className="btn line"
                onClick={handleCloseAll}
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

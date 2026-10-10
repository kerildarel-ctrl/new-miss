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
  const [email, setEmail] = useState('');

  // Payment Flow States
  const [step, setStep] = useState<'FORM' | 'SUCCESS' | 'FAILED'>('FORM');
  const [isSubmitting, setIsSubmitting] = useState(false);
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

  if (!isOpen || !candidate) return null;

  const totalPrice = voteCount * unitVotePrice;

  // Submit Vote with Email
  const handleVoteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !email.includes('@')) {
      setErrorMessage('Veuillez entrer une adresse email valide.');
      return;
    }

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
          email: email,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setIsSubmitting(false);
        setStep('SUCCESS');
        onConfirmVote(candidate.id, voteCount);
      } else {
        setIsSubmitting(false);
        setErrorMessage(data.error || 'Erreur lors de l’enregistrement de votre vote.');
        setStep('FAILED');
      }
    } catch {
      setIsSubmitting(false);
      setErrorMessage('Erreur réseau. Impossible d’enregistrer le vote.');
      setStep('FAILED');
    }
  };

  const handleCloseAll = () => {
    setStep('FORM');
    setVoteCount(1);
    setEmail('');
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
          <form onSubmit={handleVoteSubmit}>
            {/* BADGE */}
            <div style={{ color: '#818cf8', fontSize: '0.78rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              {t('vote.badge', 'VOTE OFFICIEL SÉCURISÉ')}
            </div>

            {/* TITLE & SUBTITLE */}
            <h2 style={{ marginTop: '6px', fontSize: '1.5rem', fontWeight: 800, color: '#ffffff', lineHeight: 1.25 }}>
              {t('vote.title', 'Voter pour')} {candidate.firstName} {candidate.lastName}
            </h2>
            <p style={{ marginTop: '4px', fontSize: '0.84rem', color: '#94a3b8', fontWeight: 400 }}>
              {t('vote.candidate', 'Candidat')} #{candidate.candidateNumber.replace('#', '')} · {unitVotePrice} FCFA par vote
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
              {t('vote.countLabel', 'Nombre de votes')}
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
                { qty: 1, label: '1 vote', price: `${unitVotePrice} F` },
                { qty: 5, label: '5 votes', price: `${unitVotePrice * 5} F` },
                { qty: 10, label: '10 votes', price: `${unitVotePrice * 10} F` },
                { qty: 25, label: '25 votes', price: `${unitVotePrice * 25} F` },
                { qty: 50, label: '50 votes', price: `${unitVotePrice * 50} F` },
                { qty: 100, label: '100 votes', price: `${unitVotePrice * 100} F` },
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

            {/* EMAIL INPUT FIELD */}
            <label
              htmlFor="inpEmail"
              style={{ display: 'block', marginTop: '20px', fontSize: '0.88rem', fontWeight: 700, color: '#ffffff' }}
            >
              ✉️ Votre adresse email
            </label>
            <input
              type="email"
              id="inpEmail"
              required
              placeholder="ex. votre.email@exemple.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
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
              Un récapitulatif de votre vote sera enregistré avec cette adresse.
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
              type="submit"
              disabled={isSubmitting}
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
                ? 'Validation du vote...'
                : `Valider mon vote (${totalPrice.toLocaleString('fr-FR')} FCFA)`}
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
              <span>Vote officiel instantané & confirmation par email.</span>
            </p>
          </form>
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
            <p style={{ color: '#10b981', fontWeight: 800, fontSize: '0.95rem' }}>Vote confirmé !</p>
            <h2 style={{ marginTop: '6px', fontSize: '1.4rem', fontWeight: 800, color: '#ffffff' }}>Merci pour votre soutien !</h2>
            <p style={{ color: '#cbd5e1', marginTop: '10px', fontSize: '0.92rem', lineHeight: 1.5 }}>
              Vos <b style={{ color: '#ffffff' }}>{voteCount} vote{voteCount > 1 ? 's' : ''}</b> pour{' '}
              <b style={{ color: '#818cf8' }}>{candidate.firstName} {candidate.lastName}</b> ont bien été comptabilisés.
            </p>
            <p style={{ color: '#94a3b8', marginTop: '8px', fontSize: '0.82rem' }}>
              Confirmé avec l&apos;adresse : <b style={{ color: '#818cf8' }}>{email}</b>
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
              Fermer
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
            <p style={{ color: '#ef4444', fontWeight: 800, fontSize: '0.95rem' }}>Échec de la validation</p>
            <h2 style={{ marginTop: '6px', fontSize: '1.4rem', fontWeight: 800, color: '#ffffff' }}>Une erreur est survenue</h2>
            <p style={{ color: '#cbd5e1', marginTop: '10px', fontSize: '0.9rem' }}>
              {errorMessage || 'Une erreur est survenue lors de l’enregistrement de votre vote.'}
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

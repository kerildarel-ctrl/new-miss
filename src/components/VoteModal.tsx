'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Candidate } from '@/data/mockData';
import { getCompetitions } from '@/services/dbService';
import {
  Lock,
  X,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  RefreshCw,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';

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
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  // États du flux de paiement :
  // FORM -> POLLING (attente du paiement effectif) -> SUCCESS / FAILED
  const [step, setStep] = useState<'FORM' | 'POLLING' | 'SUCCESS' | 'FAILED'>('FORM');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [unitVotePrice, setUnitVotePrice] = useState<number>(100);

  // Données de la transaction Fapshi
  const [activeTransId, setActiveTransId] = useState<string | null>(null);
  const [activeVoteId, setActiveVoteId] = useState<string | null>(null);
  const [paymentLink, setPaymentLink] = useState<string | null>(null);
  const [detectedOperator, setDetectedOperator] = useState<'ORANGE' | 'MTN'>('ORANGE');
  const [ussdPrompt, setUssdPrompt] = useState<string>('#150*50#');
  const [pollingSeconds, setPollingSeconds] = useState<number>(0);
  const pollTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Charger le prix unitaire du vote (défaut : 100 FCFA)
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

  // Nettoyer le timer en cas de fermeture ou démontage
  useEffect(() => {
    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    };
  }, []);

  // VÉRIFICATION EN DIRECT : TANT QUE L'ARGENT N'EST PAS REÇU SUR FAPSHI, LE VOTE N'EST PAS CONFIRMÉ
  useEffect(() => {
    if (step !== 'POLLING' || !activeTransId) return;

    let attempts = 0;
    const maxAttempts = 60; // ~150 secondes maximum d'attente

    const interval = setInterval(async () => {
      attempts++;
      setPollingSeconds((prev) => prev + 2);

      try {
        const res = await fetch(
          `/api/pay/status?transId=${encodeURIComponent(activeTransId)}&voteId=${encodeURIComponent(activeVoteId || '')}&candidateId=${encodeURIComponent(candidate?.id || '')}&voteCount=${voteCount}&email=${encodeURIComponent(email)}`,
          { cache: 'no-store' }
        );
        const data = await res.json();

        // 1. CONFIRMATION STRICTE : Uniquement quand Fapshi confirme que l'argent a été encaissé
        if (data.isSuccess) {
          clearInterval(interval);
          if (candidate) {
            onConfirmVote(candidate.id, voteCount);
          }
          setStep('SUCCESS');
          return;
        }

        // 2. Échec confirmé (après un délai minimal de 8s pour laisser l'opérateur transmettre la notification)
        if (attempts >= 3 && (data.status === 'FAILED' || data.status === 'EXPIRED')) {
          clearInterval(interval);
          setErrorMessage('Le paiement n’a pas pu aboutir sur votre téléphone (délai expiré ou solde insuffisant).');
          setStep('FAILED');
          return;
        }

        // 3. Délai dépassé
        if (attempts >= maxAttempts) {
          clearInterval(interval);
          setErrorMessage('Délai d’attente dépassé sans confirmation de votre opérateur. Veuillez réessayer.');
          setStep('FAILED');
        }
      } catch {
        // En cas de micro-coupure réseau temporaire, on continue de vérifier
      }
    }, 2500);

    pollTimerRef.current = interval;

    return () => clearInterval(interval);
  }, [step, activeTransId, activeVoteId, candidate, voteCount, email, onConfirmVote]);

  if (!isOpen || !candidate) return null;

  const totalPrice = Math.max(1, voteCount) * unitVotePrice;

  // SOUMISSION DU FORMULAIRE : DÉCLENCHE LE PAIEMENT MOBILE SANS QUITTER LA PAGE
  const handleVoteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const cleanEmail = email.trim();
    if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      setErrorMessage('Une adresse email valide est obligatoire pour générer votre reçu officiel.');
      return;
    }

    // Nettoyer le numéro camerounais
    let digits = phone.replace(/\D/g, '');
    if (digits.startsWith('00237')) digits = digits.slice(5);
    else if (digits.startsWith('237')) digits = digits.slice(3);
    if (digits.startsWith('0') && digits.length === 10) digits = digits.slice(1);
    if (digits.length >= 9) digits = digits.slice(-9);

    if (!digits || digits.length !== 9 || !digits.startsWith('6')) {
      setErrorMessage('Veuillez entrer un numéro Mobile Money valide à 9 chiffres (ex: 690123456 ou 670123456).');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const response = await fetch('/api/pay/direct', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          candidateId: candidate.id,
          candidateName: `${candidate.firstName} ${candidate.lastName}`,
          competitionSlug: candidate.competitionSlug,
          voteCount: voteCount,
          amount: totalPrice,
          email: cleanEmail,
          phone: digits,
        }),
      });

      const data = await response.json();
      setIsSubmitting(false);

      if (data.success && data.transId) {
        setActiveTransId(data.transId);
        setActiveVoteId(data.voteId || null);
        setPaymentLink(data.paymentLink || null);
        setDetectedOperator(data.operator || (digits.startsWith('69') ? 'ORANGE' : 'MTN'));
        setUssdPrompt(data.ussdPrompt || (digits.startsWith('69') ? '#150*50#' : '*126#'));
        setPollingSeconds(0);
        setStep('POLLING');
      } else {
        setErrorMessage(data.error || 'Erreur lors de l’initialisation de la demande de paiement.');
        setStep('FAILED');
      }
    } catch {
      setIsSubmitting(false);
      setErrorMessage('Erreur réseau. Impossible de contacter le serveur.');
      setStep('FAILED');
    }
  };

  // REDIRECTION VERS LE PROFIL DU CANDIDAT UNE FOIS L'ARGENT REÇU
  const handleGoToCandidateProfile = () => {
    if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    const candidateSlug = `${candidate.lastName}${candidate.firstName}`
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '');
    const compSlug = candidate.competitionSlug || 'miss-mister-copa-ahn';

    const targetUrl = `/competition/${compSlug}/${candidateSlug}?voteSuccess=true&transId=${encodeURIComponent(activeTransId || '')}&voteId=${encodeURIComponent(activeVoteId || '')}&candidateId=${encodeURIComponent(candidate.id)}&voteCount=${voteCount}&email=${encodeURIComponent(email)}`;

    window.location.href = targetUrl;
  };

  const handleClose = () => {
    if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    setStep('FORM');
    setVoteCount(1);
    setEmail('');
    setPhone('');
    setActiveTransId(null);
    setActiveVoteId(null);
    setPaymentLink(null);
    setPollingSeconds(0);
    setErrorMessage(null);
    onClose();
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        display: 'grid',
        placeItems: 'center',
        padding: '20px',
        background: 'var(--soft)',
        overflowY: 'auto',
        fontFamily: "var(--font-poppins), 'Poppins', sans-serif",
      }}
      onClick={handleClose}
    >
      {/* BOUTON FERMER DISCRET */}
      <button
        type="button"
        onClick={handleClose}
        style={{
          position: 'fixed',
          top: '24px',
          right: '24px',
          width: '40px',
          height: '40px',
          borderRadius: '50%',
          background: 'rgba(255, 255, 255, 0.06)',
          border: '1px solid var(--line)',
          color: 'var(--mute)',
          display: 'grid',
          placeItems: 'center',
          cursor: 'pointer',
          transition: 'all 0.2s',
        }}
        title="Fermer"
      >
        <X className="w-5 h-5" />
      </button>

      {/* CONTENEUR DIRECT SANS CADRE NI RECTANGLE BLANC/GRIS (STYLE AUTH ADMIN) */}
      <div
        style={{
          width: 'min(440px, 100%)',
          textAlign: 'center',
          color: 'var(--ink)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ======================================================== */}
        {/* ÉTAPE 1 : FORMULAIRE DE VOTE INITIAL                     */}
        {/* ======================================================== */}
        {step === 'FORM' && (
          <>
            {/* ICÔNE CIRCULAIRE VIOLETTE */}
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                background: 'rgba(91, 61, 245, 0.16)',
                color: 'var(--p)',
                display: 'grid',
                placeItems: 'center',
                margin: '0 auto 16px',
              }}
            >
              <Lock className="w-6 h-6" />
            </div>

            <p className="eb" style={{ margin: 0 }}>
              ESPACE SÉCURISÉ
            </p>
            <h2 style={{ fontSize: 'clamp(1.6rem, 5vw, 2.1rem)', fontWeight: 800, marginTop: '6px', lineHeight: 1.2 }}>
              Voter pour {candidate.firstName} {candidate.lastName}
            </h2>
            <p className="sm mute" style={{ marginTop: '6px', fontSize: '0.9rem', lineHeight: 1.5 }}>
              Entrez le nombre de votes et vos coordonnées pour valider votre soutien.
            </p>

            <form onSubmit={handleVoteSubmit} style={{ marginTop: '24px', textAlign: 'left' }}>
              {/* NOMBRE DE VOTES */}
              <div style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label
                    style={{
                      fontSize: '0.88rem',
                      fontWeight: 600,
                      color: 'var(--ink)',
                    }}
                  >
                    Nombre de votes
                  </label>
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--p)' }}>
                    {totalPrice.toLocaleString('fr-FR')} FCFA ({unitVotePrice} F / vote)
                  </span>
                </div>
                <input
                  type="number"
                  min="1"
                  max="5000"
                  required
                  placeholder="Ex: 1, 5, 10..."
                  value={voteCount}
                  onChange={(e) => setVoteCount(Math.max(1, parseInt(e.target.value) || 1))}
                  style={{
                    width: '100%',
                    height: '48px',
                    marginTop: 0,
                    padding: '0 16px',
                    borderRadius: '12px',
                    border: '1.5px solid var(--line)',
                    background: 'rgba(255, 255, 255, 0.04)',
                    color: 'var(--ink)',
                    fontSize: '0.95rem',
                    fontWeight: 600,
                    outline: 'none',
                  }}
                />
              </div>

              {/* ADRESSE EMAIL (OBLIGATOIRE POUR LE REÇU CÔTÉ ADMIN) */}
              <div style={{ marginBottom: '16px' }}>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.88rem',
                    fontWeight: 600,
                    marginBottom: '6px',
                    color: 'var(--ink)',
                  }}
                >
                  Adresse email (pour votre reçu officiel) <span style={{ color: 'var(--a)' }}>*</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="votre.email@exemple.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setErrorMessage(null);
                  }}
                  style={{
                    width: '100%',
                    height: '48px',
                    marginTop: 0,
                    padding: '0 16px',
                    borderRadius: '12px',
                    border: '1.5px solid var(--line)',
                    background: 'rgba(255, 255, 255, 0.04)',
                    color: 'var(--ink)',
                    fontSize: '0.95rem',
                    outline: 'none',
                  }}
                />
              </div>

              {/* NUMÉRO MOBILE MONEY */}
              <div style={{ marginBottom: '16px' }}>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.88rem',
                    fontWeight: 600,
                    marginBottom: '6px',
                    color: 'var(--ink)',
                  }}
                >
                  Numéro Mobile Money (Orange / MTN) <span style={{ color: 'var(--a)' }}>*</span>
                </label>
                <input
                  type="tel"
                  required
                  placeholder="690 12 34 56 ou 670 12 34 56"
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value);
                    setErrorMessage(null);
                  }}
                  style={{
                    width: '100%',
                    height: '48px',
                    marginTop: 0,
                    padding: '0 16px',
                    borderRadius: '12px',
                    border: '1.5px solid var(--line)',
                    background: 'rgba(255, 255, 255, 0.04)',
                    color: 'var(--ink)',
                    fontSize: '0.95rem',
                    outline: 'none',
                  }}
                />
              </div>

              {errorMessage && (
                <div
                  style={{
                    background: 'rgba(255, 90, 126, 0.12)',
                    color: 'var(--a)',
                    borderRadius: '12px',
                    padding: '10px 14px',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    marginTop: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <ShieldAlert className="w-4 h-4 flex-shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* BOUTON PILULE */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn full"
                style={{
                  marginTop: '22px',
                  height: '52px',
                  borderRadius: '99px',
                  fontSize: '1rem',
                  fontWeight: 700,
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  opacity: isSubmitting ? 0.7 : 1,
                }}
              >
                {isSubmitting
                  ? 'Initialisation du paiement...'
                  : `Confirmer le vote · ${totalPrice.toLocaleString('fr-FR')} FCFA`}
              </button>
            </form>

            <p
              className="sm mute"
              style={{
                marginTop: '16px',
                fontSize: '0.78rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
              }}
            >
              <ShieldCheck className="w-4 h-4" style={{ color: '#10b981' }} />
              <span>Paiement sécurisé par cryptage SSL</span>
            </p>
          </>
        )}

        {/* ======================================================== */}
        {/* ÉTAPE 2 : EN ATTENTE DU PAIEMENT EFFECTIF                */}
        {/* ======================================================== */}
        {step === 'POLLING' && (
          <div style={{ padding: '10px 0' }}>
            {/* SPINNER CIRCULAIRE VIOLET */}
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: 'rgba(91, 61, 245, 0.16)',
                color: 'var(--p)',
                display: 'grid',
                placeItems: 'center',
                margin: '0 auto 18px',
              }}
            >
              <RefreshCw className="w-7 h-7 animate-spin" />
            </div>

            <p className="eb" style={{ margin: 0, color: 'var(--p)' }}>
              VALIDATION EN COURS
            </p>
            <h2 style={{ fontSize: 'clamp(1.5rem, 5vw, 1.95rem)', fontWeight: 800, marginTop: '6px', lineHeight: 1.2 }}>
              Confirmez le débit sur votre mobile
            </h2>
            <p className="sm mute" style={{ marginTop: '8px', fontSize: '0.9rem', lineHeight: 1.5 }}>
              Une demande de débit de <b style={{ color: 'var(--ink)' }}>{totalPrice.toLocaleString('fr-FR')} FCFA</b> a été envoyée au <b style={{ color: 'var(--ink)' }}>+237 {phone}</b>.
            </p>

            {/* CONSIGNES OPÉRATEUR */}
            <div
              style={{
                marginTop: '22px',
                padding: '16px',
                borderRadius: '16px',
                border: '1.5px solid var(--line)',
                background: 'rgba(255, 255, 255, 0.03)',
                textAlign: 'left',
              }}
            >
              <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: 700, color: 'var(--ink)' }}>
                📲 Action requise ({detectedOperator === 'ORANGE' ? 'Orange Money' : 'MTN Mobile Money'}) :
              </p>
              <p style={{ margin: '6px 0 0', fontSize: '0.82rem', color: 'var(--mute)', lineHeight: 1.5 }}>
                {detectedOperator === 'ORANGE' ? (
                  <>
                    Validez le message sur votre écran avec votre <b>code secret Orange Money</b>.<br />
                    Si rien ne s’affiche sur votre téléphone, composez <b>#150*50#</b> ou <b>#150#</b> pour autoriser.
                  </>
                ) : (
                  <>
                    Validez la notification sur votre écran avec votre <b>code secret MTN MoMo</b>.<br />
                    Si rien ne s’affiche sur votre téléphone, composez <b>*126#</b> pour autoriser.
                  </>
                )}
              </p>
            </div>

            {/* BOUTON ALTERNATIF DE SECOURS VIA LIEN SÉCURISÉ */}
            {paymentLink && (
              <div style={{ marginTop: '16px' }}>
                <a
                  href={paymentLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: '12px',
                    background: 'rgba(91, 61, 245, 0.12)',
                    border: '1px solid rgba(91, 61, 245, 0.3)',
                    color: 'var(--ink)',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    textDecoration: 'none',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                >
                  <ExternalLink className="w-4 h-4" style={{ color: 'var(--p)' }} />
                  <span>Rien ne s’affiche ? Valider sur la page sécurisée</span>
                </a>
              </div>
            )}

            {/* COMPTEUR EN DIRECT */}
            <div
              style={{
                marginTop: '18px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                fontSize: '0.85rem',
                color: 'var(--mute)',
                fontWeight: 600,
              }}
            >
              <span
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: 'var(--p)',
                  display: 'inline-block',
                }}
              />
              <span>Vérification de la réception des fonds... ({pollingSeconds}s)</span>
            </div>

            {/* BOUTON ANNULER */}
            <button
              type="button"
              onClick={() => {
                if (pollTimerRef.current) clearInterval(pollTimerRef.current);
                setStep('FORM');
              }}
              style={{
                marginTop: '20px',
                background: 'none',
                border: 'none',
                color: 'var(--mute)',
                fontSize: '0.85rem',
                fontWeight: 600,
                cursor: 'pointer',
                textDecoration: 'underline',
              }}
            >
              Annuler ou changer de numéro
            </button>
          </div>
        )}

        {/* ======================================================== */}
        {/* ÉTAPE 3 : PAIEMENT REÇU AVEC SUCCÈS SUR FAPSHI           */}
        {/* ======================================================== */}
        {step === 'SUCCESS' && (
          <div style={{ padding: '10px 0' }}>
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: 'rgba(16, 185, 129, 0.16)',
                color: '#10b981',
                display: 'grid',
                placeItems: 'center',
                margin: '0 auto 18px',
              }}
            >
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <p className="eb" style={{ margin: 0, color: '#10b981' }}>
              PAIEMENT REÇU & CONFIRMÉ
            </p>
            <h2 style={{ fontSize: 'clamp(1.6rem, 5vw, 2.1rem)', fontWeight: 800, marginTop: '6px', lineHeight: 1.2 }}>
              Vote validé avec succès !
            </h2>
            <p className="sm mute" style={{ marginTop: '8px', fontSize: '0.9rem', lineHeight: 1.5 }}>
              Vos <b style={{ color: 'var(--ink)' }}>{voteCount} vote{voteCount > 1 ? 's' : ''}</b> pour <b style={{ color: 'var(--p)' }}>{candidate.firstName} {candidate.lastName}</b> ont bien été comptabilisés.
            </p>
            <p className="sm mute" style={{ marginTop: '4px', fontSize: '0.82rem' }}>
              Reçu officiel envoyé à : <b style={{ color: 'var(--ink)' }}>{email}</b>
            </p>

            <button
              type="button"
              onClick={handleGoToCandidateProfile}
              className="btn full"
              style={{
                marginTop: '24px',
                height: '52px',
                borderRadius: '99px',
                fontSize: '1rem',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              <span>Voir le profil du candidat</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* ======================================================== */}
        {/* ÉTAPE 4 : PAIEMENT REFUSÉ OU ÉCHOUÉ                      */}
        {/* ======================================================== */}
        {step === 'FAILED' && (
          <div style={{ padding: '10px 0' }}>
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: 'rgba(255, 90, 126, 0.16)',
                color: 'var(--a)',
                display: 'grid',
                placeItems: 'center',
                margin: '0 auto 18px',
              }}
            >
              <ShieldAlert className="w-8 h-8" />
            </div>

            <p className="eb" style={{ margin: 0, color: 'var(--a)' }}>
              PAIEMENT NON VALIDÉ
            </p>
            <h2 style={{ fontSize: 'clamp(1.5rem, 5vw, 1.95rem)', fontWeight: 800, marginTop: '6px', lineHeight: 1.2 }}>
              Le vote n’a pas été comptabilisé
            </h2>
            <p className="sm mute" style={{ marginTop: '8px', fontSize: '0.9rem', lineHeight: 1.5 }}>
              {errorMessage || 'Le paiement n’a pas pu être confirmé auprès de votre opérateur.'}
            </p>

            {paymentLink && (
              <a
                href={paymentLink}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  width: '100%',
                  height: '50px',
                  borderRadius: '99px',
                  background: 'var(--p)',
                  color: '#ffffff',
                  fontSize: '0.95rem',
                  fontWeight: 700,
                  textDecoration: 'none',
                  marginTop: '20px',
                  cursor: 'pointer',
                }}
              >
                <ExternalLink className="w-4 h-4" />
                <span>Valider via la passerelle sécurisée</span>
              </a>
            )}

            <button
              type="button"
              onClick={() => {
                setErrorMessage(null);
                setStep('FORM');
              }}
              className="btn full"
              style={{
                marginTop: paymentLink ? '12px' : '24px',
                height: '50px',
                borderRadius: '99px',
                background: paymentLink ? 'rgba(255, 255, 255, 0.08)' : undefined,
                border: paymentLink ? '1px solid var(--line)' : undefined,
                fontSize: '0.95rem',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Réessayer avec un autre numéro
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

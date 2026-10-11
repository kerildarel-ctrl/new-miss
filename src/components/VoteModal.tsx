'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Candidate } from '@/data/mockData';
import { getCompetitions } from '@/services/dbService';
import { useLanguage } from '@/context/LanguageContext';
import {
  Sparkles,
  X,
  Mail,
  Phone,
  ShieldCheck,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Plus,
  Minus,
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
  const { t } = useLanguage();
  const [voteCount, setVoteCount] = useState<number>(1);
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  // Payment Flow States
  const [step, setStep] = useState<'FORM' | 'REDIRECTING' | 'SUCCESS' | 'FAILED'>('FORM');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [unitVotePrice, setUnitVotePrice] = useState<number>(100);

  // Fetch custom votePrice per competition (défaut : 100 FCFA)
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

  const handleVoteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (email && !email.includes('@')) {
      setErrorMessage('Si vous indiquez une adresse email, veuillez entrer une adresse valide.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const returnUrl = typeof window !== 'undefined' ? window.location.href : undefined;

      const response = await fetch('/api/pay/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          candidateId: candidate.id,
          candidateName: `${candidate.firstName} ${candidate.lastName}`,
          competitionSlug: candidate.competitionSlug,
          voteCount: voteCount,
          amount: totalPrice,
          email: email || undefined,
          phone: phone || undefined,
          returnUrl: returnUrl,
        }),
      });

      const data = await response.json();

      if (data.success && data.link) {
        // REDIRECTION OFFICIELLE VERS LA PAGE DE PAIEMENT FAPSHI (OM & MOMO)
        setStep('REDIRECTING');
        window.location.href = data.link;
        return;
      } else if (data.success) {
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
    setPhone('');
    setErrorMessage(null);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md overflow-y-auto font-poppins"
      onClick={handleCloseAll}
    >
      <div
        className="w-full max-w-[480px] bg-white dark:bg-[#111827] rounded-[32px] p-6 sm:p-8 shadow-2xl shadow-indigo-500/10 border border-slate-100 dark:border-slate-800 relative transition-all my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* CLOSE BUTTON */}
        <button
          type="button"
          onClick={handleCloseAll}
          className="absolute top-5 right-5 w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title="Fermer"
        >
          <X className="w-5 h-5" />
        </button>

        {step === 'FORM' && (
          <form onSubmit={handleVoteSubmit}>
            {/* BADGE */}
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center p-2.5 border border-indigo-100 dark:border-indigo-900/40">
                <Sparkles className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <span className="text-[11px] sm:text-xs font-extrabold text-indigo-600 dark:text-indigo-400 tracking-wider uppercase">
                {t('vote.badge', 'ESPACE VOTANT')}
              </span>
            </div>

            {/* CANDIDATE HEADER */}
            <div className="flex items-center gap-3.5 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="relative w-14 h-14 rounded-2xl overflow-hidden border-2 border-indigo-500/20 shadow-sm flex-shrink-0 bg-slate-100">
                <Image
                  src={candidate.photoUrl || '/images/candidate_1.png'}
                  alt={`${candidate.firstName} ${candidate.lastName}`}
                  fill
                  className="object-cover object-top"
                />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
                  Voter pour {candidate.firstName} {candidate.lastName}
                </h2>
                <p className="mt-0.5 text-xs font-medium text-slate-500 dark:text-slate-400">
                  Candidat #{candidate.candidateNumber.replace('#', '')} · {unitVotePrice} FCFA par vote
                </p>
              </div>
            </div>

            {/* TOTAL PRICE SUMMARY LINE CARD */}
            <div className="mt-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/80 flex items-center justify-between">
              <span className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300">
                {voteCount} vote{voteCount > 1 ? 's' : ''} ({unitVotePrice} FCFA / vote)
              </span>
              <span className="text-lg sm:text-xl font-black text-indigo-600 dark:text-indigo-400">
                {totalPrice.toLocaleString('fr-FR')} FCFA
              </span>
            </div>

            {/* STEPPER LABEL */}
            <label className="block text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 mt-4 mb-2">
              {t('vote.countLabel', 'Nombre de votes')}
            </label>

            {/* STEPPER ROW */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setVoteCount((prev) => Math.max(1, prev - 1))}
                aria-label="Diminuer"
                className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-extrabold text-xl flex items-center justify-center cursor-pointer border border-slate-200 dark:border-slate-700 transition-all active:scale-95"
              >
                <Minus className="w-5 h-5" />
              </button>
              <input
                type="number"
                id="inpQte"
                min="1"
                max="5000"
                value={voteCount}
                onChange={(e) => setVoteCount(Math.max(1, parseInt(e.target.value) || 1))}
                className="flex-1 h-12 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-black text-lg text-center outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all"
              />
              <button
                type="button"
                onClick={() => setVoteCount((prev) => prev + 1)}
                aria-label="Augmenter"
                className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-extrabold text-xl flex items-center justify-center cursor-pointer border border-slate-200 dark:border-slate-700 transition-all active:scale-95"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>

            {/* QUICK PACK PILLS */}
            <div className="grid grid-cols-3 gap-2 mt-3">
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
                    className={`py-2 px-2.5 rounded-xl border text-xs transition-all text-center font-medium cursor-pointer ${
                      isActive
                        ? 'bg-indigo-50 dark:bg-indigo-950/80 border-2 border-indigo-600 dark:border-indigo-500 text-indigo-600 dark:text-indigo-400 font-bold shadow-sm'
                        : 'border-slate-200 dark:border-slate-700/80 bg-slate-50/50 dark:bg-slate-800/40 text-slate-700 dark:text-slate-300 hover:border-indigo-400'
                    }`}
                  >
                    <div>{label}</div>
                    <div className="text-[10px] opacity-75 font-mono">{price}</div>
                  </button>
                );
              })}
            </div>

            {/* EMAIL INPUT FIELD (OPTIONNEL) */}
            <div className="mt-4">
              <label htmlFor="inpEmail" className="block text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 mb-1.5">
                Adresse email (optionnel)
              </label>
              <div className="flex items-center rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40 focus-within:bg-white dark:focus-within:bg-slate-800 focus-within:border-indigo-500 focus-within:ring-4 focus-within:ring-indigo-500/10 transition-all overflow-hidden">
                <div className="pl-4 pr-1 text-slate-400 dark:text-slate-500 flex items-center justify-center flex-shrink-0">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  id="inpEmail"
                  placeholder="ex. votre.email@exemple.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full py-3.5 px-3 bg-transparent text-slate-900 dark:text-white text-xs sm:text-sm font-semibold outline-none placeholder:text-slate-400 dark:placeholder:text-slate-500 placeholder:font-normal"
                />
              </div>
              <span className="block text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-medium">
                Pour recevoir votre reçu officiel de vote si vous le souhaitez.
              </span>
            </div>

            {/* WHATSAPP / MOBILE MONEY PHONE INPUT (OPTIONAL) */}
            <div className="mt-3">
              <label htmlFor="inpPhone" className="block text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 mb-1.5">
                Numéro Orange Money ou MTN MoMo (optionnel)
              </label>
              <div className="flex items-center rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40 focus-within:bg-white dark:focus-within:bg-slate-800 focus-within:border-indigo-500 focus-within:ring-4 focus-within:ring-indigo-500/10 transition-all overflow-hidden">
                <div className="pl-4 pr-1 text-slate-400 dark:text-slate-500 flex items-center justify-center flex-shrink-0">
                  <Phone className="w-4 h-4 text-emerald-500" />
                </div>
                <input
                  type="tel"
                  id="inpPhone"
                  placeholder="6XX XXX XXX (préremplit Fapshi)"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full py-3.5 px-3 bg-transparent text-slate-900 dark:text-white text-xs sm:text-sm font-semibold outline-none placeholder:text-slate-400 dark:placeholder:text-slate-500 placeholder:font-normal"
                />
              </div>
            </div>

            {errorMessage && (
              <div className="mt-3 p-3 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* SUBMIT BUTTON : REDIRECTION FAPSHI (OM & MOMO) */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-5 py-4 px-6 rounded-2xl font-black text-sm sm:text-base text-white bg-gradient-to-r from-indigo-600 via-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2 transition-all active:scale-[0.99] cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <span>
                {isSubmitting
                  ? 'Connexion sécurisée à Fapshi...'
                  : `Payer ${totalPrice.toLocaleString('fr-FR')} FCFA via OM / MoMo →`}
              </span>
              {!isSubmitting && <ArrowRight className="w-4 h-4" />}
            </button>

            {/* BADGES OPÉRATEURS OFFICIELS FAPSHI */}
            <div className="mt-3 flex items-center justify-center gap-2">
              <span className="text-[10px] sm:text-[11px] font-extrabold px-2.5 py-1 rounded-lg bg-orange-50 dark:bg-orange-950/50 text-orange-600 dark:text-orange-400 border border-orange-200 dark:border-orange-900/40">
                Orange Money
              </span>
              <span className="text-[10px] sm:text-[11px] font-extrabold px-2.5 py-1 rounded-lg bg-yellow-50 dark:bg-yellow-950/50 text-yellow-700 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-900/40">
                MTN MoMo
              </span>
              <span className="text-[10px] sm:text-[11px] font-bold px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                Fapshi 100% Sécurisé
              </span>
            </div>

            {/* SECURITY FOOTER */}
            <div className="mt-3 flex items-center justify-center gap-1.5 text-[10px] sm:text-[11px] font-medium text-slate-400 text-center">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
              <span>Paiement chiffré SSL • Débit direct après validation USSD</span>
            </div>
          </form>
        )}

        {/* STEP REDIRECTING TO FAPSHI */}
        {step === 'REDIRECTING' && (
          <div className="text-center py-8">
            <div className="w-14 h-14 rounded-full border-4 border-indigo-600 border-t-transparent animate-spin mx-auto mb-4" />
            <span className="text-xs font-extrabold text-indigo-600 uppercase tracking-wider">
              REDIRECTION VERS FAPSHI
            </span>
            <h3 className="mt-1 text-xl font-black text-slate-900 dark:text-white">
              Ouverture de la passerelle de paiement...
            </h3>
            <p className="mt-2 text-xs sm:text-sm text-slate-600 dark:text-slate-300 max-w-sm mx-auto leading-relaxed">
              Vous êtes redirigé vers la page officielle sécurisée pour régler <b>{totalPrice.toLocaleString('fr-FR')} FCFA</b> par <b>Orange Money</b> ou <b>MTN Mobile Money</b>.
            </p>
            <div className="mt-5 flex items-center justify-center gap-2">
              <span className="text-xs font-bold px-3 py-1.5 rounded-xl bg-orange-50 text-orange-600 border border-orange-200">
                Orange Money
              </span>
              <span className="text-xs font-bold px-3 py-1.5 rounded-xl bg-yellow-50 text-yellow-700 border border-yellow-200">
                MTN Mobile Money
              </span>
            </div>
          </div>
        )}

        {step === 'SUCCESS' && (
          <div className="text-center py-6">
            <div className="w-16 h-16 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-500 flex items-center justify-center mx-auto mb-3 border border-emerald-200 dark:border-emerald-800">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Vote confirmé !</p>
            <h2 className="mt-1 text-2xl font-black text-slate-900 dark:text-white">Merci pour votre soutien !</h2>
            <p className="mt-3 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              Vos <b className="text-slate-900 dark:text-white">{voteCount} vote{voteCount > 1 ? 's' : ''}</b> pour{' '}
              <b className="text-indigo-600 dark:text-indigo-400">{candidate.firstName} {candidate.lastName}</b> ont bien été enregistrés.
            </p>
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
              Confirmation envoyée à : <b className="text-slate-800 dark:text-slate-200">{email}</b>
            </p>
            <button
              type="button"
              onClick={handleCloseAll}
              className="w-full mt-6 py-3.5 px-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm transition-all shadow-md shadow-indigo-500/20"
            >
              Fermer la fenêtre
            </button>
          </div>
        )}

        {step === 'FAILED' && (
          <div className="text-center py-6">
            <div className="w-16 h-16 rounded-full bg-red-50 dark:bg-red-950/50 text-red-500 flex items-center justify-center mx-auto mb-3 border border-red-200 dark:border-red-800">
              <AlertCircle className="w-8 h-8" />
            </div>
            <p className="text-xs font-bold text-red-600 uppercase tracking-wider">Erreur lors de la validation</p>
            <h2 className="mt-1 text-xl font-black text-slate-900 dark:text-white">Impossible de valider</h2>
            <p className="mt-2 text-xs sm:text-sm text-slate-600 dark:text-slate-300">
              {errorMessage || 'Une erreur est survenue lors de l’enregistrement de votre vote.'}
            </p>
            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={handleCloseAll}
                className="flex-1 py-3 px-4 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs transition-all"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={() => setStep('FORM')}
                className="flex-1 py-3 px-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition-all shadow-md shadow-indigo-500/20"
              >
                Réessayer
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

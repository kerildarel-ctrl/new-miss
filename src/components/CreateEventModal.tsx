'use client';

import React, { useState } from 'react';
import { saveEventRequest } from '@/services/dbService';
import { useLanguage } from '@/context/LanguageContext';
import {
  Star,
  Building2,
  MessageCircle,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  Mail,
  User,
  Users,
  FileText,
  CheckCircle2,
  X,
  Vote,
} from 'lucide-react';

interface CreateEventModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CreateEventModal: React.FC<CreateEventModalProps> = ({ isOpen, onClose }) => {
  const { t } = useLanguage();
  const [step, setStep] = useState<1 | 2>(1);
  const [formData, setFormData] = useState({
    eventName: '',
    organizerName: '',
    phone: '',
    email: '',
    votePrice: '100',
    candidateEstimate: '10',
    campus: '',
    startDate: '',
    endDate: '',
    description: '',
  });

  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step1Error, setStep1Error] = useState('');

  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.eventName.trim()) {
      setStep1Error("Veuillez renseigner le nom de l'élection.");
      return;
    }
    if (!formData.campus.trim()) {
      setStep1Error("Veuillez renseigner l'établissement ou la ville.");
      return;
    }
    if (!formData.phone.trim()) {
      setStep1Error("Veuillez renseigner le numéro WhatsApp.");
      return;
    }
    setStep1Error('');
    setStep(2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    await saveEventRequest(formData);

    const waText =
      `Bonjour VoteMoi, nouvelle demande de création d'élection :\n\n` +
      `🏆 Élection : ${formData.eventName}\n` +
      `🏛️ Établissement/Campus : ${formData.campus || 'Non spécifié'}\n` +
      `👤 Responsable : ${formData.organizerName || 'Organisateur'}\n` +
      `📞 WhatsApp : ${formData.phone}\n` +
      `✉️ Email : ${formData.email || 'Non spécifié'}\n` +
      `💵 Prix du vote : ${formData.votePrice || '100'} FCFA\n` +
      `👥 Candidats prévus : ${formData.candidateEstimate || '10'}` +
      (formData.description ? `\n📝 Précisions : ${formData.description}` : '');

    const waUrl = `https://wa.me/237692886326?text=${encodeURIComponent(waText)}`;

    if (typeof window !== 'undefined') {
      window.open(waUrl, '_blank');
    }

    setIsSubmitting(false);
    setIsSubmitted(true);
  };

  const handleReset = () => {
    setIsSubmitted(false);
    setStep(1);
    setFormData({
      eventName: '',
      organizerName: '',
      phone: '',
      email: '',
      votePrice: '100',
      candidateEstimate: '10',
      campus: '',
      startDate: '',
      endDate: '',
      description: '',
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md overflow-y-auto"
      onClick={handleReset}
    >
      <div
        className="w-full max-w-[480px] bg-white dark:bg-[#111827] rounded-[32px] p-6 sm:p-8 shadow-2xl shadow-indigo-500/10 border border-slate-100 dark:border-slate-800 relative transition-all my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* TOP HEADER: BADGE + CLOSE */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center p-2.5 border border-indigo-100 dark:border-indigo-900/40">
              <Vote className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <span className="text-[11px] sm:text-xs font-extrabold text-indigo-600 dark:text-indigo-400 tracking-wider uppercase">
              {t('create.badge', 'ESPACE ORGANISATEUR')}
            </span>
          </div>

          <button
            type="button"
            onClick={handleReset}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Fermer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {!isSubmitted ? (
          <>
            {/* TITLE & SUBTITLE */}
            <h2 className="text-2xl sm:text-[26px] font-black text-slate-900 dark:text-white tracking-tight leading-tight">
              {t('create.title', 'Créer une compétition')}
            </h2>
            <p className="mt-1 text-slate-500 dark:text-slate-400 text-xs sm:text-sm font-medium">
              {t('create.desc', 'Configurez votre vote en quelques étapes.')}
            </p>

            {/* PROGRESS BAR */}
            <div className="mt-5 mb-5">
              <div className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 mb-1.5">
                Étape {step} sur 2
              </div>
              <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 via-indigo-600 to-purple-600 rounded-full transition-all duration-300"
                  style={{ width: step === 1 ? '50%' : '100%' }}
                />
              </div>
            </div>

            {step1Error && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-xs font-semibold">
                {step1Error}
              </div>
            )}

            {/* STEP 1 */}
            {step === 1 && (
              <form onSubmit={handleNextStep} className="space-y-3.5">
                {/* NOM DE L'ÉLECTION */}
                <div>
                  <label className="block text-xs font-bold text-slate-900 dark:text-slate-100 mb-1.5">
                    {t('create.name', "Nom de l'élection")}
                  </label>
                  <div className="flex items-center rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40 focus-within:bg-white dark:focus-within:bg-slate-800 focus-within:border-indigo-500 focus-within:ring-4 focus-within:ring-indigo-500/10 transition-all overflow-hidden">
                    <div className="pl-3.5 pr-1 text-slate-400 dark:text-slate-500 flex items-center justify-center flex-shrink-0">
                      <Star className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      required
                      placeholder="Ex. Miss & Mister FMSB 2026"
                      value={formData.eventName}
                      onChange={(e) => setFormData({ ...formData, eventName: e.target.value })}
                      className="w-full py-3 px-3 bg-transparent text-slate-900 dark:text-white text-xs sm:text-sm font-semibold outline-none placeholder:text-slate-400 dark:placeholder:text-slate-500 placeholder:font-normal"
                    />
                  </div>
                </div>

                {/* ÉTABLISSEMENT / VILLE */}
                <div>
                  <label className="block text-xs font-bold text-slate-900 dark:text-slate-100 mb-1.5">
                    {t('create.campus', 'Établissement / Ville')}
                  </label>
                  <div className="flex items-center rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40 focus-within:bg-white dark:focus-within:bg-slate-800 focus-within:border-indigo-500 focus-within:ring-4 focus-within:ring-indigo-500/10 transition-all overflow-hidden">
                    <div className="pl-3.5 pr-1 text-slate-400 dark:text-slate-500 flex items-center justify-center flex-shrink-0">
                      <Building2 className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      required
                      placeholder="Ex. Université de Yaoundé I"
                      value={formData.campus}
                      onChange={(e) => setFormData({ ...formData, campus: e.target.value })}
                      className="w-full py-3 px-3 bg-transparent text-slate-900 dark:text-white text-xs sm:text-sm font-semibold outline-none placeholder:text-slate-400 dark:placeholder:text-slate-500 placeholder:font-normal"
                    />
                  </div>
                </div>

                {/* WHATSAPP */}
                <div>
                  <label className="block text-xs font-bold text-slate-900 dark:text-slate-100 mb-1.5">
                    {t('create.phone', "WhatsApp de l'organisateur")}
                  </label>
                  <div className="flex items-center rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40 focus-within:bg-white dark:focus-within:bg-slate-800 focus-within:border-indigo-500 focus-within:ring-4 focus-within:ring-indigo-500/10 transition-all overflow-hidden">
                    <div className="pl-3.5 pr-1 text-slate-400 dark:text-slate-500 flex items-center justify-center flex-shrink-0">
                      <MessageCircle className="w-4 h-4 text-emerald-500" />
                    </div>
                    <input
                      type="tel"
                      required
                      placeholder="+237 6XX XXX XXX"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full py-3 px-3 bg-transparent text-slate-900 dark:text-white text-xs sm:text-sm font-semibold outline-none placeholder:text-slate-400 dark:placeholder:text-slate-500 placeholder:font-normal"
                    />
                  </div>
                </div>

                {/* PRIX DU VOTE */}
                <div>
                  <label className="block text-xs font-bold text-slate-900 dark:text-slate-100 mb-1.5">
                    {t('create.price', 'Prix du vote')}
                  </label>
                  <div className="flex items-center rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40 focus-within:bg-white dark:focus-within:bg-slate-800 focus-within:border-indigo-500 focus-within:ring-4 focus-within:ring-indigo-500/10 transition-all overflow-hidden">
                    <input
                      type="number"
                      min="50"
                      step="50"
                      required
                      placeholder="100"
                      value={formData.votePrice}
                      onChange={(e) => setFormData({ ...formData, votePrice: e.target.value })}
                      className="w-full py-3 px-4 bg-transparent text-slate-900 dark:text-white text-sm font-extrabold outline-none"
                    />
                    <div className="bg-slate-100 dark:bg-slate-800 px-4 py-3 text-xs sm:text-sm font-bold text-slate-600 dark:text-slate-300 border-l border-slate-200 dark:border-slate-700 whitespace-nowrap">
                      FCFA / vote
                    </div>
                  </div>
                </div>

                {/* CONTINUER */}
                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full py-3.5 px-6 rounded-2xl font-bold text-sm text-white bg-gradient-to-r from-indigo-600 via-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2 transition-all active:scale-[0.99] cursor-pointer"
                  >
                    <span>Continuer</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </form>
            )}

            {/* STEP 2 */}
            {step === 2 && (
              <form onSubmit={handleSubmit} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-900 dark:text-slate-100 mb-1.5">
                    Nom du responsable
                  </label>
                  <div className="flex items-center rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40 focus-within:bg-white dark:focus-within:bg-slate-800 focus-within:border-indigo-500 focus-within:ring-4 focus-within:ring-indigo-500/10 transition-all overflow-hidden">
                    <div className="pl-3.5 pr-1 text-slate-400 dark:text-slate-500 flex items-center justify-center flex-shrink-0">
                      <User className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      placeholder="Ex. Jean-Paul Mbarga"
                      value={formData.organizerName}
                      onChange={(e) => setFormData({ ...formData, organizerName: e.target.value })}
                      className="w-full py-3 px-3 bg-transparent text-slate-900 dark:text-white text-xs sm:text-sm font-semibold outline-none placeholder:text-slate-400 dark:placeholder:text-slate-500 placeholder:font-normal"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-900 dark:text-slate-100 mb-1.5">
                    Adresse email (optionnel)
                  </label>
                  <div className="flex items-center rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40 focus-within:bg-white dark:focus-within:bg-slate-800 focus-within:border-indigo-500 focus-within:ring-4 focus-within:ring-indigo-500/10 transition-all overflow-hidden">
                    <div className="pl-3.5 pr-1 text-slate-400 dark:text-slate-500 flex items-center justify-center flex-shrink-0">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      type="email"
                      placeholder="Ex. contact@fmsb2026.cm"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full py-3 px-3 bg-transparent text-slate-900 dark:text-white text-xs sm:text-sm font-semibold outline-none placeholder:text-slate-400 dark:placeholder:text-slate-500 placeholder:font-normal"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-900 dark:text-slate-100 mb-1.5">
                    Nombre estimé de candidats
                  </label>
                  <div className="flex items-center rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40 focus-within:bg-white dark:focus-within:bg-slate-800 focus-within:border-indigo-500 focus-within:ring-4 focus-within:ring-indigo-500/10 transition-all overflow-hidden">
                    <div className="pl-3.5 pr-1 text-slate-400 dark:text-slate-500 flex items-center justify-center flex-shrink-0">
                      <Users className="w-4 h-4" />
                    </div>
                    <input
                      type="number"
                      min="2"
                      placeholder="Ex. 10"
                      value={formData.candidateEstimate}
                      onChange={(e) => setFormData({ ...formData, candidateEstimate: e.target.value })}
                      className="w-full py-3 px-3 bg-transparent text-slate-900 dark:text-white text-xs sm:text-sm font-semibold outline-none placeholder:text-slate-400 dark:placeholder:text-slate-500 placeholder:font-normal"
                    />
                  </div>
                </div>

                <div className="pt-2 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="py-3.5 px-4 rounded-2xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Retour</span>
                  </button>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 py-3.5 px-6 rounded-2xl font-bold text-xs sm:text-sm text-white bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 hover:from-emerald-700 hover:to-teal-700 shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 transition-all active:scale-[0.99] cursor-pointer"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>{isSubmitting ? 'Envoi...' : 'Envoyer la demande →'}</span>
                  </button>
                </div>
              </form>
            )}

            {/* TRUST BADGE */}
            <div className="mt-5 flex items-center justify-center gap-2 text-[11px] font-medium text-slate-500 dark:text-slate-400 text-center">
              <ShieldCheck className="w-4 h-4 text-indigo-500 flex-shrink-0" />
              <span>Activation sous 24 h ouvrées • Paiements Mobile Money</span>
            </div>
          </>
        ) : (
          /* SUCCESS STATE */
          <div className="text-center py-6">
            <div className="w-14 h-14 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-500 flex items-center justify-center mx-auto mb-3 border border-emerald-200 dark:border-emerald-800">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Demande enregistrée</p>
            <h2 className="mt-1 text-xl font-black text-slate-900 dark:text-white">Merci pour votre initiative !</h2>
            <p className="mt-2 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Votre demande pour <b className="text-slate-900 dark:text-white">&quot;{formData.eventName}&quot;</b> a été transmise. Un conseiller vous contactera sous 24h sur WhatsApp pour l&apos;ouverture officielle.
            </p>

            <button
              type="button"
              onClick={handleReset}
              className="w-full mt-5 py-3.5 px-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm transition-all shadow-md shadow-indigo-500/20"
            >
              Fermer la fenêtre
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

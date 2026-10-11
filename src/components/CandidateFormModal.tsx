'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Candidate, Competition } from '@/data/mockData';
import {
  X,
  UserPlus,
  Upload,
  Image as ImageIcon,
  User,
  Hash,
  Sparkles,
  FileText,
  ArrowRight,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface CandidateFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (candidateData: Partial<Candidate>) => void;
  competitions: Competition[];
  initialData?: Candidate | null;
}

export const CandidateFormModal: React.FC<CandidateFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  competitions,
  initialData,
}) => {
  const [formData, setFormData] = useState<Partial<Candidate>>({
    firstName: '',
    lastName: '',
    candidateNumber: '#01',
    photoUrl: '/images/candidate_1.png',
    bio: '',
    competitionSlug: competitions[0]?.slug || '',
    category: 'Miss',
    voteCount: 0,
    percentage: 0,
    rank: 1,
    status: 'ACTIF',
    socialInstagram: '',
  });

  const [previewImage, setPreviewImage] = useState<string>('/images/candidate_1.png');

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
      setPreviewImage(initialData.photoUrl || '/images/candidate_1.png');
    } else {
      setFormData({
        firstName: '',
        lastName: '',
        candidateNumber: `#${Math.floor(Math.random() * 90 + 10)}`,
        photoUrl: '/images/candidate_1.png',
        bio: '',
        competitionSlug: competitions[0]?.slug || '',
        category: 'Miss',
        voteCount: 0,
        percentage: 0,
        rank: 1,
        status: 'ACTIF',
        socialInstagram: '',
      });
      setPreviewImage('/images/candidate_1.png');
    }
  }, [initialData, isOpen, competitions]);

  if (!isOpen) return null;

  // Handle direct file upload from PC / Phone
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const resultStr = reader.result as string;
        setPreviewImage(resultStr);
        setFormData((prev) => ({ ...prev, photoUrl: resultStr }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md overflow-y-auto font-poppins">
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="relative w-full max-w-2xl bg-white dark:bg-[#111827] rounded-[32px] p-6 sm:p-8 border border-slate-100 dark:border-slate-800 shadow-2xl my-8 text-slate-900 dark:text-white"
        >
          {/* CLOSE BUTTON */}
          <button
            onClick={onClose}
            className="absolute top-5 right-5 w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {/* TOP BADGE */}
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center p-2.5 border border-indigo-100 dark:border-indigo-900/40">
              <UserPlus className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <span className="text-[11px] sm:text-xs font-extrabold text-indigo-600 dark:text-indigo-400 tracking-wider uppercase">
              ESPACE GESTION CANDIDATS
            </span>
          </div>

          <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            {initialData ? 'Modifier le Candidat' : 'Ajouter un Candidat'}
          </h2>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400 mb-5">
            Rattachez un participant à une élection et chargez sa photo officielle.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* SELECT COMPETITION DROPDOWN */}
            <div>
              <label className="block text-xs font-bold text-slate-900 dark:text-slate-100 mb-1.5">
                Choisir la Compétition Rattachée *
              </label>
              <select
                required
                value={formData.competitionSlug || ''}
                onChange={(e) => setFormData({ ...formData, competitionSlug: e.target.value })}
                className="w-full px-4 py-3 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 text-indigo-950 dark:text-indigo-200 font-extrabold text-xs sm:text-sm focus:outline-none focus:border-indigo-500"
              >
                {competitions.length === 0 ? (
                  <option value="">⚠️ Aucune compétition disponible. Créez-en une d&apos;abord !</option>
                ) : (
                  competitions.map((comp) => (
                    <option key={comp.id} value={comp.slug}>
                      🏆 {comp.title} (Slug: {comp.slug})
                    </option>
                  ))
                )}
              </select>
            </div>

            {/* PHOTO UPLOADER SECTION */}
            <div className="bg-slate-50/60 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
              <label className="block text-xs font-bold text-slate-900 dark:text-slate-100">
                Photo officielle du candidat (Depuis votre appareil PC / Téléphone)
              </label>

              <div className="flex flex-col sm:flex-row items-center gap-4">
                {/* Photo Preview */}
                <div className="relative w-24 h-28 rounded-2xl overflow-hidden border-2 border-slate-200 dark:border-slate-700 flex-shrink-0 bg-slate-200 dark:bg-slate-700 shadow-sm">
                  {previewImage ? (
                    <Image
                      src={previewImage}
                      alt="Aperçu photo"
                      fill
                      className="object-cover object-top"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-400">
                      <ImageIcon className="w-8 h-8" />
                    </div>
                  )}
                </div>

                {/* Upload Button */}
                <div className="flex-1 space-y-2 w-full">
                  <label className="flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs cursor-pointer shadow-md transition-colors">
                    <Upload className="w-4 h-4" />
                    <span>Choisir une photo sur mon téléphone / PC</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>

                  <p className="text-[11px] text-slate-400 text-center sm:text-left">
                    Ou collez un lien URL direct d&apos;image :
                  </p>

                  <input
                    type="text"
                    placeholder="https://domaine.com/photo.jpg"
                    value={formData.photoUrl || ''}
                    onChange={(e) => {
                      setFormData({ ...formData, photoUrl: e.target.value });
                      setPreviewImage(e.target.value);
                    }}
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
            </div>

            {/* PRÉNOM & NOM */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-900 dark:text-slate-100 mb-1.5">
                  Prénom *
                </label>
                <div className="flex items-center rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40 focus-within:bg-white dark:focus-within:bg-slate-800 focus-within:border-indigo-500 focus-within:ring-4 focus-within:ring-indigo-500/10 transition-all overflow-hidden">
                  <div className="pl-3.5 pr-1 text-slate-400 dark:text-slate-500 flex items-center justify-center flex-shrink-0">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Arielle"
                    value={formData.firstName || ''}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className="w-full py-3 px-3 bg-transparent text-slate-900 dark:text-white text-xs sm:text-sm font-semibold outline-none placeholder:text-slate-400 placeholder:font-normal"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-900 dark:text-slate-100 mb-1.5">
                  Nom de famille *
                </label>
                <div className="flex items-center rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40 focus-within:bg-white dark:focus-within:bg-slate-800 focus-within:border-indigo-500 focus-within:ring-4 focus-within:ring-indigo-500/10 transition-all overflow-hidden">
                  <div className="pl-3.5 pr-1 text-slate-400 dark:text-slate-500 flex items-center justify-center flex-shrink-0">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    placeholder="Ex: KOUSSO"
                    value={formData.lastName || ''}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className="w-full py-3 px-3 bg-transparent text-slate-900 dark:text-white text-xs sm:text-sm font-semibold outline-none placeholder:text-slate-400 placeholder:font-normal"
                  />
                </div>
              </div>
            </div>

            {/* NUMÉRO DE DOSSIER & CATÉGORIE */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-900 dark:text-slate-100 mb-1.5">
                  Numéro de Dossier *
                </label>
                <div className="flex items-center rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40 focus-within:bg-white dark:focus-within:bg-slate-800 focus-within:border-indigo-500 focus-within:ring-4 focus-within:ring-indigo-500/10 transition-all overflow-hidden">
                  <div className="pl-3.5 pr-1 text-slate-400 dark:text-slate-500 flex items-center justify-center flex-shrink-0">
                    <Hash className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    placeholder="#01"
                    value={formData.candidateNumber || ''}
                    onChange={(e) => setFormData({ ...formData, candidateNumber: e.target.value })}
                    className="w-full py-3 px-3 bg-transparent text-slate-900 dark:text-white text-xs sm:text-sm font-bold font-mono outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-900 dark:text-slate-100 mb-1.5">
                  Catégorie
                </label>
                <select
                  value={formData.category || 'Miss'}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                  className="w-full px-3.5 py-3 rounded-2xl bg-slate-50/50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold text-xs sm:text-sm focus:outline-none focus:border-indigo-500"
                >
                  <option value="Miss">Miss</option>
                  <option value="Mister">Mister</option>
                  <option value="Duo">Duo</option>
                </select>
              </div>
            </div>

            {/* BIOGRAPHIE */}
            <div>
              <label className="block text-xs font-bold text-slate-900 dark:text-slate-100 mb-1.5">
                Biographie / Présentation
              </label>
              <div className="flex items-start rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40 focus-within:bg-white dark:focus-within:bg-slate-800 focus-within:border-indigo-500 focus-within:ring-4 focus-within:ring-indigo-500/10 transition-all overflow-hidden p-3">
                <FileText className="w-4 h-4 text-slate-400 mt-1 mr-2 flex-shrink-0" />
                <textarea
                  rows={2}
                  placeholder="Quelques mots de présentation du candidat..."
                  value={formData.bio || ''}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  className="w-full bg-transparent text-slate-900 dark:text-white text-xs sm:text-sm font-medium outline-none placeholder:text-slate-400 placeholder:font-normal resize-none"
                />
              </div>
            </div>

            {/* BUTTONS */}
            <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={onClose}
                className="py-3 px-5 rounded-2xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="py-3 px-6 rounded-2xl font-bold text-xs sm:text-sm text-white bg-gradient-to-r from-indigo-600 via-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-lg shadow-indigo-500/25 flex items-center gap-2 transition-all cursor-pointer"
              >
                <span>{initialData ? 'Enregistrer les modifications' : 'Ajouter le candidat'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

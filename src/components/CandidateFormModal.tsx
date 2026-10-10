'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Candidate, Competition } from '@/data/mockData';
import { X, UserPlus, Upload, Image as ImageIcon, Sparkles } from 'lucide-react';
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
  initialData
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
    socialInstagram: ''
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
        socialInstagram: ''
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
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto font-poppins">
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="relative w-full max-w-2xl bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-2xl my-8 text-slate-900"
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-slate-700 bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-2xl bg-pink-50 text-pink-600 flex items-center justify-center flex-shrink-0 border border-pink-200">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-900">
                {initialData ? 'Modifier le Candidat' : 'Ajouter un Candidat'}
              </h3>
              <p className="text-xs text-slate-500">Rattachez le candidat à l&apos;une de vos compétitions créées</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* SELECT COMPETITION DROPDOWN */}
            <div>
              <label className="block text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">
                Choisir la Compétition Rattachée *
              </label>
              <select
                required
                value={formData.competitionSlug || ''}
                onChange={(e) => setFormData({ ...formData, competitionSlug: e.target.value })}
                className="w-full px-4 py-3 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 font-extrabold text-sm focus:outline-none focus:border-blue-500"
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
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Photo du Candidat (Depuis votre appareil)
              </label>

              <div className="flex flex-col sm:flex-row items-center gap-4">
                {/* Photo Preview */}
                <div className="relative w-24 h-28 rounded-2xl overflow-hidden border-2 border-slate-300 flex-shrink-0 bg-slate-200 shadow-sm">
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
                  <label className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs cursor-pointer shadow-md transition-colors">
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
                    Ou collez un lien URL d&apos;image :
                  </p>

                  <input
                    type="text"
                    placeholder="https://domaine.com/photo.jpg"
                    value={formData.photoUrl || ''}
                    onChange={(e) => {
                      setFormData({ ...formData, photoUrl: e.target.value });
                      setPreviewImage(e.target.value);
                    }}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-900 text-xs focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Prénom & Nom */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Prénom *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Arielle"
                  value={formData.firstName || ''}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-bold text-sm focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Nom de famille *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: KOUSSO"
                  value={formData.lastName || ''}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-bold text-sm focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Numéro de Candidat */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Numéro de Dossier (Ex: #01) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="#01"
                  value={formData.candidateNumber || ''}
                  onChange={(e) => setFormData({ ...formData, candidateNumber: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-mono font-bold text-xs focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Catégorie */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Catégorie
                </label>
                <select
                  value={formData.category || 'Miss'}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-bold text-xs focus:outline-none focus:border-blue-500"
                >
                  <option value="Miss">Miss</option>
                  <option value="Mister">Mister</option>
                  <option value="Duo">Duo</option>
                </select>
              </div>
            </div>

            {/* Biographie */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Biographie / Présentation
              </label>
              <textarea
                rows={3}
                placeholder="Quelques mots de présentation du candidat..."
                value={formData.bio || ''}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Buttons */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                className="py-2.5 px-4 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 font-bold text-xs"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="btn"
                style={{ gap: '8px' }}
              >
                <Sparkles className="w-4 h-4" />
                <span>{initialData ? 'Enregistrer les modifications' : 'Ajouter le candidat'}</span>
              </button>
            </div>

          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

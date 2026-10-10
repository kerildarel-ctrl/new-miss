'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Competition } from '@/data/mockData';
import { X, Trophy, Sparkles, Upload, Image as ImageIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface CompetitionFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (competitionData: Partial<Competition>) => void;
  initialData?: Competition | null;
}

export const CompetitionFormModal: React.FC<CompetitionFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData
}) => {
  const [formData, setFormData] = useState<Partial<Competition>>({
    title: '',
    description: '',
    logoImage: '/images/hero_bg.png',
    bannerImage: '/images/copa_ahn_banner.png',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    status: 'EN COURS',
    votePrice: 100,
    primaryColor: '#2563EB',
    gradientFrom: '#EC4899',
    gradientTo: '#2563EB',
    accentColor: '#3B82F6',
    rules: 'Votes ouverts à tous.'
  });

  const [logoPreview, setLogoPreview] = useState<string>('/images/hero_bg.png');
  const [bannerPreview, setBannerPreview] = useState<string>('/images/copa_ahn_banner.png');

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
      setLogoPreview(initialData.logoImage || '/images/hero_bg.png');
      setBannerPreview(initialData.bannerImage || '/images/copa_ahn_banner.png');
    } else {
      setFormData({
        title: '',
        description: '',
        logoImage: '/images/hero_bg.png',
        bannerImage: '/images/copa_ahn_banner.png',
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        status: 'EN COURS',
        votePrice: 100,
        primaryColor: '#2563EB',
        gradientFrom: '#EC4899',
        gradientTo: '#2563EB',
        accentColor: '#3B82F6',
        rules: 'Votes ouverts à tous.'
      });
      setLogoPreview('/images/hero_bg.png');
      setBannerPreview('/images/copa_ahn_banner.png');
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  // Handle Logo Upload from device
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const resultStr = reader.result as string;
        setLogoPreview(resultStr);
        setFormData((prev) => ({ ...prev, logoImage: resultStr }));
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle Banner Upload from device
  const handleBannerUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const resultStr = reader.result as string;
        setBannerPreview(resultStr);
        setFormData((prev) => ({ ...prev, bannerImage: resultStr }));
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
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0 border border-blue-200">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-900">
                {initialData ? 'Modifier la Compétition' : 'Nouvelle Compétition'}
              </h3>
              <p className="text-xs text-slate-500">Chargement d&apos;images depuis votre appareil PC / Téléphone</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Nom & Prix du Vote */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Nom de la compétition *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: MISS & MISTER CAMPUS 2026"
                  value={formData.title || ''}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-bold text-sm focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Prix du Vote FCFA */}
              <div>
                <label className="block text-xs font-bold text-pink-600 uppercase tracking-wider mb-1">
                  Prix du vote (FCFA) *
                </label>
                <input
                  type="number"
                  required
                  min={1}
                  placeholder="100"
                  value={formData.votePrice ?? 100}
                  onChange={(e) => setFormData({ ...formData, votePrice: Number(e.target.value) })}
                  className="w-full px-4 py-2.5 rounded-xl bg-pink-50 border border-pink-200 text-pink-600 font-mono font-black text-sm focus:outline-none focus:border-pink-500"
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Description *
              </label>
              <textarea
                required
                rows={3}
                placeholder="Présentez brièvement la compétition..."
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* LOGO & BANNER DEVICE UPLOADERS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* Logo Uploader */}
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-2">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Logo / Icône (Depuis l&apos;appareil)
                </label>
                <div className="flex items-center gap-3">
                  <div className="relative w-14 h-14 rounded-xl overflow-hidden border border-slate-300 flex-shrink-0 bg-slate-200">
                    {logoPreview ? (
                      <Image src={logoPreview} alt="Logo" fill className="object-cover" />
                    ) : (
                      <ImageIcon className="w-6 h-6 m-auto text-slate-400" />
                    )}
                  </div>
                  <label className="flex-1 py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs cursor-pointer shadow-sm text-center flex items-center justify-center gap-1.5">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Choisir fichier</span>
                    <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                  </label>
                </div>
              </div>

              {/* Banner Uploader */}
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-2">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Bannière d&apos;En-tête (Depuis l&apos;appareil)
                </label>
                <div className="flex items-center gap-3">
                  <div className="relative w-20 h-14 rounded-xl overflow-hidden border border-slate-300 flex-shrink-0 bg-slate-200">
                    {bannerPreview ? (
                      <Image src={bannerPreview} alt="Bannière" fill className="object-cover" />
                    ) : (
                      <ImageIcon className="w-6 h-6 m-auto text-slate-400" />
                    )}
                  </div>
                  <label className="flex-1 py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs cursor-pointer shadow-sm text-center flex items-center justify-center gap-1.5">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Choisir fichier</span>
                    <input type="file" accept="image/*" onChange={handleBannerUpload} className="hidden" />
                  </label>
                </div>
              </div>

            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Date Début */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Date de début
                </label>
                <input
                  type="date"
                  value={formData.startDate ? formData.startDate.split('T')[0] : ''}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Date Fin */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Date de fin
                </label>
                <input
                  type="date"
                  value={formData.endDate ? formData.endDate.split('T')[0] : ''}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Statut */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Statut
                </label>
                <select
                  value={formData.status || 'EN COURS'}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as Competition['status'] })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-bold text-xs focus:outline-none focus:border-blue-500"
                >
                  <option value="EN COURS">EN COURS</option>
                  <option value="A VENIR">À VENIR</option>
                  <option value="TERMINE">TERMINÉ</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Couleur principale */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Couleur d&apos;accentuation
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={formData.primaryColor || '#2563EB'}
                    onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                    className="w-10 h-10 rounded-lg cursor-pointer bg-transparent border-0"
                  />
                  <input
                    type="text"
                    value={formData.primaryColor || '#2563EB'}
                    onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                    className="flex-1 px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-mono"
                  />
                </div>
              </div>

              {/* Règlement */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Règlement simplifié
                </label>
                <input
                  type="text"
                  placeholder="Ex: Nul ne peut voter plus de 100 fois par jour"
                  value={formData.rules || ''}
                  onChange={(e) => setFormData({ ...formData, rules: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:outline-none focus:border-blue-500"
                />
              </div>
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
                <span>{initialData ? 'Enregistrer les modifications' : 'Créer la compétition'}</span>
              </button>
            </div>

          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

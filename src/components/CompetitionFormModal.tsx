'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Competition } from '@/data/mockData';
import {
  X,
  Trophy,
  Upload,
  Image as ImageIcon,
  Star,
  Coins,
  Calendar,
  FileText,
  Palette,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
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
  initialData,
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
    rules: 'Votes ouverts à tous.',
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
        rules: 'Votes ouverts à tous.',
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
              <Trophy className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <span className="text-[11px] sm:text-xs font-extrabold text-indigo-600 dark:text-indigo-400 tracking-wider uppercase">
              ESPACE GESTION COMPÉTITION
            </span>
          </div>

          <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            {initialData ? 'Modifier la Compétition' : 'Créer une Compétition'}
          </h2>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400 mb-5">
            Configurez les paramètres officiels, le prix du vote et les bannières.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* NOM & PRIX DU VOTE */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-900 dark:text-slate-100 mb-1.5">
                  Nom de l&apos;élection *
                </label>
                <div className="flex items-center rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40 focus-within:bg-white dark:focus-within:bg-slate-800 focus-within:border-indigo-500 focus-within:ring-4 focus-within:ring-indigo-500/10 transition-all overflow-hidden">
                  <div className="pl-3.5 pr-1 text-slate-400 dark:text-slate-500 flex items-center justify-center flex-shrink-0">
                    <Star className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Miss & Mister FMSB 2026"
                    value={formData.title || ''}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full py-3 px-3 bg-transparent text-slate-900 dark:text-white text-xs sm:text-sm font-semibold outline-none placeholder:text-slate-400 placeholder:font-normal"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-900 dark:text-slate-100 mb-1.5">
                  Prix du vote *
                </label>
                <div className="flex items-center rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40 focus-within:bg-white dark:focus-within:bg-slate-800 focus-within:border-indigo-500 focus-within:ring-4 focus-within:ring-indigo-500/10 transition-all overflow-hidden">
                  <input
                    type="number"
                    required
                    min={1}
                    placeholder="100"
                    value={formData.votePrice ?? 100}
                    onChange={(e) => setFormData({ ...formData, votePrice: Number(e.target.value) })}
                    className="w-full py-3 px-3 bg-transparent text-slate-900 dark:text-white text-xs sm:text-sm font-extrabold outline-none text-center"
                  />
                  <div className="bg-slate-100 dark:bg-slate-800 px-3 py-3 text-xs font-bold text-slate-600 dark:text-slate-300 border-l border-slate-200 dark:border-slate-700 whitespace-nowrap">
                    FCFA / vote
                  </div>
                </div>
              </div>
            </div>

            {/* DESCRIPTION */}
            <div>
              <label className="block text-xs font-bold text-slate-900 dark:text-slate-100 mb-1.5">
                Description de la compétition *
              </label>
              <div className="flex items-start rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40 focus-within:bg-white dark:focus-within:bg-slate-800 focus-within:border-indigo-500 focus-within:ring-4 focus-within:ring-indigo-500/10 transition-all overflow-hidden p-3">
                <FileText className="w-4 h-4 text-slate-400 mt-1 mr-2 flex-shrink-0" />
                <textarea
                  required
                  rows={2}
                  placeholder="Présentez brièvement la compétition, l'organisation et les récompenses..."
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-transparent text-slate-900 dark:text-white text-xs sm:text-sm font-medium outline-none placeholder:text-slate-400 placeholder:font-normal resize-none"
                />
              </div>
            </div>

            {/* LOGO & BANNER UPLOADERS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Logo */}
              <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40 space-y-2">
                <label className="block text-xs font-bold text-slate-900 dark:text-slate-100">
                  Logo / Icône de l&apos;élection
                </label>
                <div className="flex items-center gap-3">
                  <div className="relative w-14 h-14 rounded-2xl overflow-hidden border border-slate-300 dark:border-slate-600 flex-shrink-0 bg-slate-200 dark:bg-slate-700">
                    {logoPreview ? (
                      <Image src={logoPreview} alt="Logo" fill className="object-cover" />
                    ) : (
                      <ImageIcon className="w-6 h-6 m-auto text-slate-400" />
                    )}
                  </div>
                  <label className="flex-1 py-2.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs cursor-pointer shadow-md text-center flex items-center justify-center gap-1.5 transition-all">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Choisir fichier</span>
                    <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                  </label>
                </div>
              </div>

              {/* Banner */}
              <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40 space-y-2">
                <label className="block text-xs font-bold text-slate-900 dark:text-slate-100">
                  Bannière d&apos;en-tête
                </label>
                <div className="flex items-center gap-3">
                  <div className="relative w-20 h-14 rounded-2xl overflow-hidden border border-slate-300 dark:border-slate-600 flex-shrink-0 bg-slate-200 dark:bg-slate-700">
                    {bannerPreview ? (
                      <Image src={bannerPreview} alt="Bannière" fill className="object-cover" />
                    ) : (
                      <ImageIcon className="w-6 h-6 m-auto text-slate-400" />
                    )}
                  </div>
                  <label className="flex-1 py-2.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs cursor-pointer shadow-md text-center flex items-center justify-center gap-1.5 transition-all">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Choisir fichier</span>
                    <input type="file" accept="image/*" onChange={handleBannerUpload} className="hidden" />
                  </label>
                </div>
              </div>
            </div>

            {/* DATES & STATUT */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-900 dark:text-slate-100 mb-1.5">
                  Date de début
                </label>
                <input
                  type="date"
                  value={formData.startDate ? formData.startDate.split('T')[0] : ''}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-2xl bg-slate-50/50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-semibold focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-900 dark:text-slate-100 mb-1.5">
                  Date de fin
                </label>
                <input
                  type="date"
                  value={formData.endDate ? formData.endDate.split('T')[0] : ''}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-2xl bg-slate-50/50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-semibold focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-900 dark:text-slate-100 mb-1.5">
                  Statut
                </label>
                <select
                  value={formData.status || 'EN COURS'}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as Competition['status'] })}
                  className="w-full px-3 py-2.5 rounded-2xl bg-slate-50/50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold text-xs focus:outline-none focus:border-indigo-500"
                >
                  <option value="EN COURS">EN COURS</option>
                  <option value="A VENIR">À VENIR</option>
                  <option value="TERMINE">TERMINÉ</option>
                </select>
              </div>
            </div>

            {/* COULEUR & RÈGLEMENT */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-900 dark:text-slate-100 mb-1.5">
                  Couleur d&apos;accentuation
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={formData.primaryColor || '#2563EB'}
                    onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                    className="w-10 h-10 rounded-xl cursor-pointer bg-transparent border-0"
                  />
                  <input
                    type="text"
                    value={formData.primaryColor || '#2563EB'}
                    onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                    className="flex-1 px-3 py-2.5 rounded-2xl bg-slate-50/50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-mono font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-900 dark:text-slate-100 mb-1.5">
                  Règles simplifiées
                </label>
                <input
                  type="text"
                  placeholder="Ex: Votes illimités par numéro"
                  value={formData.rules || ''}
                  onChange={(e) => setFormData({ ...formData, rules: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50/50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-semibold focus:outline-none focus:border-indigo-500"
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
                <span>{initialData ? 'Enregistrer les modifications' : 'Créer la compétition'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

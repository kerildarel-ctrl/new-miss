'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { KeyRound, ArrowRight, ShieldCheck, Lock, Sparkles, AlertCircle } from 'lucide-react';

export default function OrganisateurIndexPage() {
  const [accessKey, setAccessKey] = useState('');
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleAccess = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const cleaned = accessKey.trim();
    if (!cleaned) {
      setError("Veuillez saisir votre clé secrète d'accès.");
      return;
    }

    // Extraction automatique si l'organisateur colle l'URL complète
    let token = cleaned;
    if (token.includes('/organisateur/')) {
      const parts = token.split('/organisateur/');
      token = parts[parts.length - 1].split('?')[0].split('#')[0].trim();
    }

    if (token.length < 8) {
      setError("Clé secrète invalide. La clé fournie est trop courte.");
      return;
    }

    router.push(`/organisateur/${token}`);
  };

  return (
    <>
      <Header />
      <main className="min-h-screen py-14 px-4 sm:px-6 flex items-center justify-center bg-slate-50/70 dark:bg-[#0b0f19] font-poppins">
        <div className="w-full max-w-[520px] bg-white dark:bg-[#111827] rounded-[32px] p-7 sm:p-9 shadow-2xl shadow-indigo-500/10 border border-slate-100 dark:border-slate-800 relative">
          
          {/* BADGE */}
          <div className="flex items-center gap-3 mb-5">
            <div className="w-11 h-11 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center p-2.5 border border-indigo-100 dark:border-indigo-900/40">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] sm:text-xs font-extrabold text-indigo-600 dark:text-indigo-400 tracking-wider uppercase block">
                PORTAIL ORGANISATEUR CONFIDENTIEL
              </span>
              <span className="text-[10px] text-slate-400">Accès sécurisé chiffré et indevinable</span>
            </div>
          </div>

          <h1 className="text-2xl sm:text-[28px] font-black text-slate-900 dark:text-white tracking-tight leading-tight">
            Accès à Vos Gains &amp; Votes
          </h1>
          <p className="mt-1.5 text-slate-500 dark:text-slate-400 text-xs sm:text-sm font-medium leading-relaxed">
            Pour garantir la stricte confidentialité de vos finances, chaque élection possède un lien unique et indevinable.
          </p>

          <form onSubmit={handleAccess} className="mt-6 space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-900 dark:text-slate-200 mb-2">
                Votre Clé Secrète ou Lien Privé Organisateur
              </label>
              <div className="flex items-center rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40 focus-within:bg-white dark:focus-within:bg-slate-800 focus-within:border-indigo-500 focus-within:ring-4 focus-within:ring-indigo-500/10 transition-all overflow-hidden p-1">
                <div className="pl-3 pr-2 text-indigo-500">
                  <KeyRound className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  placeholder="Collez votre lien ou votre clé (ex: org_sec_...)"
                  value={accessKey}
                  onChange={(e) => {
                    setAccessKey(e.target.value);
                    if (error) setError(null);
                  }}
                  className="w-full py-3 pr-3 bg-transparent text-slate-900 dark:text-white text-xs sm:text-sm font-mono font-bold outline-none"
                />
              </div>
              {error && (
                <div className="flex items-center gap-1.5 text-red-500 text-xs font-bold mt-2">
                  <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}
            </div>

            <button
              type="submit"
              className="w-full py-4 px-6 rounded-2xl font-bold text-sm sm:text-base text-white bg-gradient-to-r from-indigo-600 via-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2 transition-all active:scale-[0.99] cursor-pointer"
            >
              <span>Accéder à mon tableau de bord privé</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* PALIER TEASER */}
          <div className="mt-7 p-4 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/40">
            <div className="flex items-center gap-2 text-xs font-extrabold text-indigo-700 dark:text-indigo-300">
              <Sparkles className="w-4 h-4" />
              <span>Grille de commission par paliers incitatifs :</span>
            </div>
            <ul className="mt-2.5 space-y-1.5 text-[11px] text-slate-600 dark:text-slate-300 font-medium">
              <li className="flex justify-between">
                <span>🥉 <b>Palier 1</b> (1 à 2 000 votes)</span>
                <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">75 FCFA / vote</span>
              </li>
              <li className="flex justify-between">
                <span>🥈 <b>Palier 2</b> (2 001 à 10 000 votes)</span>
                <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">80 FCFA / vote</span>
              </li>
              <li className="flex justify-between">
                <span>💎 <b>Palier 3</b> (Au-delà de 10 000 votes)</span>
                <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">83 FCFA / vote</span>
              </li>
            </ul>
          </div>

          {/* FOOTER */}
          <div className="mt-6 flex items-center justify-center gap-2 text-[11px] font-medium text-slate-500 dark:text-slate-400 text-center">
            <ShieldCheck className="w-4 h-4 text-emerald-500 flex-shrink-0" />
            <span>Vous n&apos;avez pas reçu votre clé ? Contactez l&apos;administrateur VoteMoi.</span>
          </div>

        </div>
      </main>
      <Footer />
    </>
  );
}

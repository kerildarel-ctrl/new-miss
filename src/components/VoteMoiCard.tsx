'use client';

import React, { useState } from 'react';
import { Wifi, Eye, EyeOff, ArrowUpRight, Sparkles, ShieldCheck } from 'lucide-react';

export interface VoteMoiCardProps {
  competitionTitle?: string;
  organizerName?: string;
  balance: number; // Solde disponible en FCFA
  secondaryBalance?: number; // Gains cumulés en FCFA
  cardNumber?: string; // ex: 4829 •••• •••• 2026
  expirationDate?: string; // ex: 12/26
  tierName?: string; // ex: Palier Or
  tierRate?: number; // ex: 80
  variant?: 'gold' | 'black' | 'violet' | 'emerald';
  showWithdrawButton?: boolean;
  onWithdrawClick?: () => void;
  canWithdraw?: boolean;
  currency?: string;
  className?: string;
}

export function VoteMoiCard({
  competitionTitle = 'Compétition Officielle',
  organizerName = 'Organisateur VoteMoi',
  balance,
  secondaryBalance,
  cardNumber,
  expirationDate = '12/26',
  tierName,
  tierRate,
  variant = 'violet',
  showWithdrawButton = false,
  onWithdrawClick,
  canWithdraw = true,
  currency = 'FCFA',
  className = '',
}: VoteMoiCardProps) {
  const [isBalanceHidden, setIsBalanceHidden] = useState(false);

  // Génération d'un numéro de carte esthétique et cohérent
  const formattedCardNumber = React.useMemo(() => {
    if (cardNumber) return cardNumber;
    // Crée un numéro basé sur le titre de la compétition
    let hash = 0;
    for (let i = 0; i < competitionTitle.length; i++) {
      hash = (hash << 5) - hash + competitionTitle.charCodeAt(i);
      hash |= 0;
    }
    const absHash = Math.abs(hash);
    const part1 = '48' + String(absHash % 89 + 10);
    const part4 = String(absHash % 8999 + 1000);
    return `${part1}  ••••  ••••  ${part4}`;
  }, [cardNumber, competitionTitle]);

  // Thèmes et dégradés selon la variante
  const themeStyles = {
    violet: {
      bg: 'bg-gradient-to-br from-[#0c0926] via-[#1a1347] to-[#2c1d68]',
      border: 'border-indigo-500/30',
      glow: 'from-indigo-600/20 via-purple-600/10 to-transparent',
      accent: 'text-indigo-300',
      chipGlow: 'shadow-indigo-500/30',
      badge: 'bg-indigo-500/20 text-indigo-200 border-indigo-400/30',
      holo: 'from-indigo-400/30 via-pink-400/30 to-amber-300/30',
    },
    gold: {
      bg: 'bg-gradient-to-br from-[#1c1404] via-[#2c2008] to-[#120d03]',
      border: 'border-amber-500/40',
      glow: 'from-amber-500/20 via-yellow-500/10 to-transparent',
      accent: 'text-amber-300',
      chipGlow: 'shadow-amber-500/40',
      badge: 'bg-amber-500/20 text-amber-200 border-amber-400/30',
      holo: 'from-amber-400/40 via-yellow-300/30 to-orange-400/30',
    },
    black: {
      bg: 'bg-gradient-to-br from-[#0a0a0f] via-[#121218] to-[#1a1a24]',
      border: 'border-slate-700/50',
      glow: 'from-slate-500/15 via-slate-600/10 to-transparent',
      accent: 'text-slate-300',
      chipGlow: 'shadow-slate-500/20',
      badge: 'bg-slate-800 text-slate-200 border-slate-700',
      holo: 'from-cyan-400/30 via-purple-400/30 to-pink-400/30',
    },
    emerald: {
      bg: 'bg-gradient-to-br from-[#031c12] via-[#092c1e] to-[#04150e]',
      border: 'border-emerald-500/40',
      glow: 'from-emerald-500/20 via-teal-500/10 to-transparent',
      accent: 'text-emerald-300',
      chipGlow: 'shadow-emerald-500/30',
      badge: 'bg-emerald-500/20 text-emerald-200 border-emerald-400/30',
      holo: 'from-emerald-400/30 via-teal-300/30 to-cyan-400/30',
    },
  }[variant];

  return (
    <div className={`relative group w-full max-w-[500px] select-none ${className}`}>
      {/* Halo lumineux d'ambiance en arrière-plan */}
      <div
        className={`absolute -inset-1 rounded-[32px] bg-gradient-to-r ${themeStyles.glow} blur-xl opacity-60 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none`}
      />

      {/* CORPS DE LA CARTE BANCAIRE */}
      <div
        className={`relative aspect-[1.586/1] min-h-[250px] sm:min-h-[280px] w-full rounded-[26px] sm:rounded-[28px] ${themeStyles.bg} p-5 sm:p-7 flex flex-col justify-between text-white shadow-2xl border ${themeStyles.border} overflow-hidden transition-all duration-300 group-hover:shadow-indigo-500/20 group-hover:-translate-y-0.5`}
      >
        {/* Motifs de fond géométriques subtils & reflets */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white/10 via-transparent to-transparent pointer-events-none" />
        <div className="absolute -right-20 -bottom-20 w-64 h-64 rounded-full bg-gradient-to-br from-white/5 to-transparent blur-2xl pointer-events-none" />

        {/* Ligne d'effet métallique brossé */}
        <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/40 to-transparent opacity-50" />

        {/* ========================================================= */}
        {/* LIGNE 1 : HAUT (PUCE EMV + CONTACTLESS + LOGO VOTEMOI) */}
        {/* ========================================================= */}
        <div className="flex items-start justify-between relative z-10">
          {/* PUCE EMV & SANS CONTACT */}
          <div className="flex items-center gap-3">
            {/* Puce EMV dorée hyper-réaliste */}
            <div
              className={`w-11 h-8 sm:w-13 sm:h-9 rounded-lg bg-gradient-to-br from-amber-200 via-amber-400 to-amber-600 p-[1.5px] shadow-lg ${themeStyles.chipGlow} relative overflow-hidden flex-shrink-0`}
            >
              <div className="w-full h-full bg-gradient-to-br from-[#eec26f] via-[#d4a03e] to-[#b88226] rounded-[5px] relative flex flex-col justify-between p-0.5 border border-amber-700/40">
                {/* Lignes de circuit imprimé */}
                <div className="w-full h-[0.5px] bg-amber-950/40" />
                <div className="w-[0.5px] h-full bg-amber-950/40 absolute left-[35%] top-0" />
                <div className="w-[0.5px] h-full bg-amber-950/40 absolute right-[35%] top-0" />
                <div className="w-3 h-3 rounded-full border border-amber-950/30 absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-amber-400/20" />
                <div className="w-full h-[0.5px] bg-amber-950/40" />
              </div>
            </div>

            {/* Icône Contactless NFC */}
            <div className="text-white/60 flex items-center" title="Paiement sans contact actif">
              <Wifi className="w-4 h-4 sm:w-5 sm:h-5 rotate-90 opacity-80" />
            </div>
          </div>

          {/* LOGO VOTEMOI & TYPE DE CARTE */}
          <div className="flex flex-col items-end">
            <div className="flex items-center gap-1.5">
              <span className="text-lg sm:text-xl font-black tracking-tight text-white flex items-center">
                Vote<span className="text-indigo-400">Moi</span>
              </span>
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            </div>
            <div className="flex items-center gap-1 text-[9px] sm:text-[10px] font-extrabold uppercase tracking-widest text-white/50">
              <span>BUSINESS WALLET</span>
              <span className="text-white/30">•</span>
              <span className="text-emerald-400 flex items-center gap-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block animate-pulse" />
                LIVE
              </span>
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* LIGNE 2 : MILIEU (SOLDE DISPONIBLE + BOUTON OEIL) */}
        {/* ========================================================= */}
        <div className="my-auto py-2 relative z-10">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-white/60">
                Solde Disponible
              </span>
              <button
                type="button"
                onClick={() => setIsBalanceHidden(!isBalanceHidden)}
                className="text-white/40 hover:text-white transition-colors cursor-pointer p-0.5"
                title={isBalanceHidden ? 'Afficher le solde' : 'Masquer le solde'}
              >
                {isBalanceHidden ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>

            {/* Badge de palier s'il existe */}
            {tierName && (
              <span
                className={`text-[10px] sm:text-[11px] font-black px-2.5 py-0.5 rounded-full border ${themeStyles.badge}`}
              >
                {tierName} {tierRate ? `(${tierRate} F/vote)` : ''}
              </span>
            )}
          </div>

          <div className="flex items-baseline gap-2">
            <div className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight text-white drop-shadow-sm font-mono">
              {isBalanceHidden ? '••••••••' : balance.toLocaleString('fr-FR')}
            </div>
            <span className="text-sm sm:text-base font-extrabold text-white/70 tracking-wide">
              {currency}
            </span>
          </div>

          {secondaryBalance !== undefined && (
            <div className="text-[11px] text-white/50 mt-1 font-medium">
              Gains cumulés :{' '}
              <span className="text-white/80 font-bold">
                {isBalanceHidden ? '••••' : secondaryBalance.toLocaleString('fr-FR')} {currency}
              </span>
            </div>
          )}
        </div>

        {/* ========================================================= */}
        {/* LIGNE 3 : NUMÉRO DE CARTE (EFFET RELIEF EN 4 BLOCS) */}
        {/* ========================================================= */}
        <div className="relative z-10">
          <div className="font-mono text-xs sm:text-sm tracking-[0.25em] text-white/80 font-semibold drop-shadow-sm">
            {formattedCardNumber}
          </div>
        </div>

        {/* ========================================================= */}
        {/* LIGNE 4 : BAS (TITULAIRE CONCOURS + DATE + HOLOGRAMME) */}
        {/* ========================================================= */}
        <div className="flex items-end justify-between pt-2 border-t border-white/10 relative z-10">
          {/* TITULAIRE ET NOM DE LA COMPÉTITION */}
          <div className="max-w-[65%]">
            <div className="text-[8px] sm:text-[9px] uppercase font-bold tracking-wider text-white/40 leading-none mb-1">
              COMPÉTITION / TITULAIRE
            </div>
            <div
              className="text-xs sm:text-sm font-black text-white uppercase tracking-wider truncate drop-shadow-sm"
              title={competitionTitle}
            >
              {competitionTitle}
            </div>
            <div className="text-[10px] text-white/60 font-medium truncate">
              {organizerName}
            </div>
          </div>

          {/* DATE D'EXPIRATION ET PASTILLE HOLOGRAPHIQUE */}
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-[8px] sm:text-[9px] uppercase font-bold tracking-wider text-white/40 leading-none mb-1">
                EXPIRE
              </div>
              <div className="font-mono text-xs sm:text-sm font-bold text-white/90">
                {expirationDate}
              </div>
            </div>

            {/* Pastille holographique / Visa-Mastercard style */}
            <div
              className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-gradient-to-tr ${themeStyles.holo} border border-white/30 flex items-center justify-center shadow-inner relative overflow-hidden backdrop-blur-md`}
              title="Sceau d'authenticité VoteMoi"
            >
              <div className="absolute inset-0 bg-[radial-gradient(circle,_var(--tw-gradient-stops))] from-white/40 via-transparent to-transparent opacity-80" />
              <ShieldCheck className="w-4 h-4 text-white drop-shadow-md relative z-10" />
            </div>
          </div>
        </div>
      </div>

      {/* BOUTON D'ACTION IMMÉDIATE SOUS LA CARTE (SI DEMANDÉ) */}
      {showWithdrawButton && onWithdrawClick && (
        <div className="mt-3">
          <button
            type="button"
            onClick={onWithdrawClick}
            className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 hover:from-indigo-500 hover:to-purple-600 text-white font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/25 transition-all transform active:scale-[0.99] cursor-pointer"
          >
            <span>Demander un retrait Mobile Money</span>
            <ArrowUpRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}

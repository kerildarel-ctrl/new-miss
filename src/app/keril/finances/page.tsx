'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { AdminSidebar } from '@/components/AdminSidebar';
import { AdminAuthGuard } from '@/components/AdminAuthGuard';
import { getCompetitions, getCandidates } from '@/services/dbService';
import { Competition, Candidate } from '@/data/mockData';
import { calculateTierRevenue } from '@/utils/revenueTiers';
import { PayoutRequest } from '@/app/api/organizer/payouts/route';
import {
  DollarSign,
  Wallet,
  TrendingUp,
  CreditCard,
  CheckCircle2,
  Clock,
  ExternalLink,
  Copy,
  Check,
  ShieldCheck,
  RefreshCw,
  Search,
  Zap,
  X,
} from 'lucide-react';
import { VoteMoiCard } from '@/components/VoteMoiCard';

export default function KerilFinancesPage() {
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [payouts, setPayouts] = useState<PayoutRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);
  const [processingPayoutId, setProcessingPayoutId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [fapshiBalance, setFapshiBalance] = useState<number | null>(null);
  const [previewCompCard, setPreviewCompCard] = useState<{
    comp: Competition;
    votes: number;
    tierData: ReturnType<typeof calculateTierRevenue>;
    paidAmount: number;
    remainingToPay: number;
  } | null>(null);

  const loadAllFinancials = async () => {
    setIsLoading(true);
    try {
      const [comps, cands, payoutsRes, balRes] = await Promise.all([
        getCompetitions(),
        getCandidates(),
        fetch('/api/organizer/payouts?_t=' + Date.now()).then((r) => r.json()),
        fetch('/api/organizer/payouts?checkBalance=true&_t=' + Date.now())
          .then((r) => r.json())
          .catch(() => null),
      ]);

      setCompetitions(comps);
      setCandidates(cands);
      if (payoutsRes.success && Array.isArray(payoutsRes.data)) {
        setPayouts(payoutsRes.data);
      }
      if (balRes?.success && typeof balRes.balance === 'number') {
        setFapshiBalance(balRes.balance);
      }
    } catch {
      // Continue
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAllFinancials();
  }, []);

  // Calculs financiers agrégés
  let globalGross = 0;
  let globalApiFees = 0;
  let globalVoteMoiNet = 0;
  let globalOrganizerDue = 0;
  let globalTotalVotes = 0;

  const compBreakdowns = competitions.map((comp) => {
    const compCandidates = candidates.filter((c) => c.competitionSlug === comp.slug);
    const votes = compCandidates.reduce((sum, c) => sum + (c.voteCount || 0), 0);
    const price = comp.votePrice || 100;
    const tierData = calculateTierRevenue(votes, price);

    globalGross += tierData.totalGross;
    globalApiFees += tierData.apiFees;
    globalVoteMoiNet += tierData.voteMoiNetProfit;
    globalOrganizerDue += tierData.organizerEarnings;
    globalTotalVotes += votes;

    const compPayouts = payouts.filter((p) => p.competitionSlug === comp.slug);
    const paidAmount = compPayouts
      .filter((p) => p.status === 'PAID')
      .reduce((s, p) => s + p.amount, 0);

    return {
      comp,
      votes,
      tierData,
      paidAmount,
      remainingToPay: Math.max(0, tierData.organizerEarnings - paidAmount),
    };
  });

  const totalPaidOut = payouts
    .filter((p) => p.status === 'PAID')
    .reduce((s, p) => s + p.amount, 0);

  const pendingPayoutsTotal = payouts
    .filter((p) => p.status === 'PENDING')
    .reduce((s, p) => s + p.amount, 0);

  const [regeneratingSlug, setRegeneratingSlug] = useState<string | null>(null);

  const handleCopyLink = (tokenOrSlug: string, slugKey: string) => {
    const url = `${window.location.origin}/organisateur/${tokenOrSlug}`;
    navigator.clipboard.writeText(url);
    setCopiedSlug(slugKey);
    setTimeout(() => setCopiedSlug(null), 2500);
  };

  const handleRegenerateToken = async (slug: string) => {
    if (!confirm("Voulez-vous vraiment régénérer la clé secrète pour cette élection ? L'ancien lien partagé à l'organisateur deviendra immédiatement invalide.")) {
      return;
    }
    setRegeneratingSlug(slug);
    try {
      const res = await fetch('/api/competitions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug }),
      });
      const data = await res.json();
      if (data.success) {
        await loadAllFinancials();
        alert('Nouvelle clé secrète générée avec succès !');
      } else {
        alert(data.error || 'Erreur lors de la régénération');
      }
    } catch {
      alert('Erreur réseau');
    } finally {
      setRegeneratingSlug(null);
    }
  };

  const handleUpdatePayoutStatus = async (id: string, newStatus: 'PAID' | 'REJECTED') => {
    const promptRef = newStatus === 'PAID' ? prompt('Référence de transaction MoMo / Orange Money (optionnel) :') : null;
    setProcessingPayoutId(id);

    try {
      const res = await fetch('/api/organizer/payouts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          status: newStatus,
          transactionRef: promptRef || undefined,
        }),
      });
      const data = await res.json();
      if (data.success) {
        await loadAllFinancials();
      } else {
        alert(data.error || 'Erreur lors de la mise à jour');
      }
    } catch {
      alert('Erreur réseau');
    } finally {
      setProcessingPayoutId(null);
    }
  };

  const handlePayWithFapshi = async (payout: PayoutRequest) => {
    const confirmMsg = `Confirmez-vous le virement automatique de ${payout.amount.toLocaleString('fr-FR')} FCFA via l'API FAPSHI DISBURSE vers ${payout.organizerName} (${payout.organizerPhone}) ?`;
    if (!confirm(confirmMsg)) {
      return;
    }

    setProcessingPayoutId(payout.id);
    try {
      const res = await fetch('/api/organizer/payouts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: payout.id,
          useFapshiDisburse: true,
        }),
      });
      const data = await res.json();
      if (data.success) {
        alert(data.message || 'Reversement Fapshi Disburse envoyé avec succès !');
        await loadAllFinancials();
      } else {
        alert(data.error || 'Erreur lors du virement Fapshi Disburse');
      }
    } catch {
      alert('Erreur réseau lors de la communication avec Fapshi.');
    } finally {
      setProcessingPayoutId(null);
    }
  };

  const filteredComps = compBreakdowns.filter(
    (item) =>
      item.comp.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.comp.slug.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AdminAuthGuard>
      <div className="min-h-screen bg-[var(--soft)] text-[var(--ink)] flex flex-col w-full font-poppins">
        <AdminSidebar />

        <main className="lg:ml-64 flex-1 min-w-0 p-4 sm:p-8 flex flex-col gap-6">
          
          {/* HEADER */}
          <div className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-[var(--line)]">
            <div>
              <p className="eb">Espace Finances &amp; Rentabilité /keril</p>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-1">
                Gains Plateforme &amp; <span className="text-[var(--p)]">Paliers Organisateur</span>
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Modèle d&apos;Alternative 1 actif : 75% à 83% pour l&apos;organisateur · 13% à 21% net pour VoteMoi · 4% frais API
              </p>
            </div>

            <button
              type="button"
              onClick={loadAllFinancials}
              className="py-2.5 px-4 rounded-xl border border-[var(--line)] bg-[var(--bg)] hover:bg-slate-100 text-xs font-bold flex items-center gap-2 cursor-pointer transition-all shadow-sm"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Actualiser les chiffres</span>
            </button>
          </div>

          {/* SECTION HÉROS : CARTE BANCAIRE TRÉSORERIE & SYNTHÈSE GLOBALE */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            
            {/* CARTE BANCAIRE TRÉSORERIE VOTEMOI (BLACK EDITION) */}
            <div className="lg:col-span-5 flex flex-col justify-center items-center">
              <VoteMoiCard
                competitionTitle="TRÉSORERIE CENTRALE VOTEMOI"
                organizerName="COMPTE SUPER-ADMINISTRATEUR"
                balance={globalVoteMoiNet}
                secondaryBalance={globalGross}
                cardNumber="4580  ••••  ••••  2026"
                expirationDate="12/28"
                tierName={fapshiBalance !== null ? `Fapshi: ${fapshiBalance.toLocaleString('fr-FR')} F` : 'Compte Central'}
                variant="black"
                className="mx-auto shadow-2xl"
              />
            </div>

            {/* LES 3 AUTRES CARDS DE SYNTHÈSE GLOBALE */}
            <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-3 gap-4">
              
              {/* CARD 1: VOLUME BRUT COLLECTÉ (GMV) */}
              <div className="bg-[var(--bg)] rounded-[24px] p-6 border border-[var(--line)] shadow-[var(--shadow)] flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between text-slate-500 text-xs font-bold mb-3">
                    <span>VOLUME BRUT GMV</span>
                    <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                      <TrendingUp className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                    {globalGross.toLocaleString('fr-FR')} <span className="text-xs font-bold text-slate-400">FCFA</span>
                  </div>
                </div>
                <p className="text-[11px] text-slate-400 mt-3 pt-3 border-t border-[var(--line)] font-medium">
                  {globalTotalVotes.toLocaleString('fr-FR')} vote(s) validé(s)
                </p>
              </div>

              {/* CARD 2: REVERSEMENTS ORGANISATEURS */}
              <div className="bg-[var(--bg)] rounded-[24px] p-6 border border-[var(--line)] shadow-[var(--shadow)] flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between text-slate-500 text-xs font-bold mb-3">
                    <span>DÛ ORGANISATEURS</span>
                    <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                      <Wallet className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="text-xl sm:text-2xl font-black text-emerald-600">
                    {globalOrganizerDue.toLocaleString('fr-FR')} <span className="text-xs font-bold text-emerald-500">FCFA</span>
                  </div>
                </div>
                <p className="text-[11px] text-slate-400 mt-3 pt-3 border-t border-[var(--line)] font-medium">
                  Reste : {(globalOrganizerDue - totalPaidOut).toLocaleString('fr-FR')} F
                </p>
              </div>

              {/* CARD 3: FRAIS PASSERELLE API (4%) */}
              <div className="bg-[var(--bg)] rounded-[24px] p-6 border border-[var(--line)] shadow-[var(--shadow)] flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between text-slate-500 text-xs font-bold mb-3">
                    <span>FRAIS API 4%</span>
                    <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 flex items-center justify-center">
                      <CreditCard className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="text-xl sm:text-2xl font-black text-slate-700 dark:text-slate-300">
                    {globalApiFees.toLocaleString('fr-FR')} <span className="text-xs font-bold text-slate-400">FCFA</span>
                  </div>
                </div>
                <p className="text-[11px] text-slate-400 mt-3 pt-3 border-t border-[var(--line)] font-medium">
                  Frais de transaction
                </p>
              </div>

            </div>

          </div>


          {/* TABLEAU PAR COMPETITION AVEC LIENS CONFIDENTIELS */}
          <div className="bg-[var(--bg)] rounded-[24px] border border-[var(--line)] shadow-[var(--shadow)] overflow-hidden">
            <div className="p-5 sm:p-6 border-b border-[var(--line)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white">
                  Répartition Détaillée par Compétition
                </h3>
                <p className="text-xs text-slate-400">
                  Générez et transmettez le lien secret à chaque organisateur pour qu&apos;il consulte ses gains sans voir vos marges.
                </p>
              </div>

              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3.5" />
                <input
                  type="text"
                  placeholder="Filtrer une élection..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-[var(--line)] text-xs font-semibold outline-none"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse min-w-[700px]">
                <thead>
                  <tr className="bg-[var(--soft)] border-b border-[var(--line)] text-slate-400 uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-4">Compétition</th>
                    <th className="py-3 px-4">Votes &amp; Palier</th>
                    <th className="py-3 px-4">Brut Collecté</th>
                    <th className="py-3 px-4">Part Organisateur</th>
                    <th className="py-3 px-4 text-emerald-600 font-extrabold">Part VoteMoi (Net)</th>
                    <th className="py-3 px-4 text-right">Lien Secret Organisateur</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--line)]">
                  {filteredComps.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400">
                        Aucune compétition trouvée.
                      </td>
                    </tr>
                  ) : (
                    filteredComps.map(({ comp, votes, tierData, paidAmount, remainingToPay }) => (
                      <tr key={comp.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20">
                        <td className="py-4 px-4 font-bold">
                          <div className="text-slate-900 dark:text-white text-sm">{comp.title}</div>
                          <div className="text-[10px] text-slate-400 font-mono">/competition/{comp.slug}</div>
                        </td>
                        <td className="py-4 px-4 font-semibold">
                          <div className="font-extrabold text-sm">{votes.toLocaleString('fr-FR')} votes</div>
                          <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 dark:bg-indigo-950/50 px-2 py-0.5 rounded-md">
                            {tierData.currentTierName}
                          </span>
                        </td>
                        <td className="py-4 px-4 font-extrabold font-mono text-slate-700 dark:text-slate-200">
                          {tierData.totalGross.toLocaleString('fr-FR')} FCFA
                        </td>
                        <td className="py-4 px-4">
                          <div className="font-black text-slate-900 dark:text-white">
                            {tierData.organizerEarnings.toLocaleString('fr-FR')} FCFA
                          </div>
                          <div className="text-[10px] text-slate-400 font-medium mt-0.5">
                            Versé : {paidAmount.toLocaleString('fr-FR')} F · Reste : {remainingToPay.toLocaleString('fr-FR')} F
                          </div>
                        </td>
                        <td className="py-4 px-4 font-black font-mono text-indigo-600 dark:text-indigo-400 text-sm">
                          {tierData.voteMoiNetProfit.toLocaleString('fr-FR')} FCFA
                        </td>
                        <td className="py-4 px-4 text-right">
                          <div className="flex flex-col items-end gap-1.5">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleCopyLink(comp.organizerToken || comp.slug, comp.slug)}
                                className="py-1.5 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 text-slate-700 dark:text-slate-300 font-bold text-[11px] flex items-center gap-1.5 cursor-pointer shadow-sm"
                                title="Copier le lien secret indevinable pour l'organisateur"
                              >
                                {copiedSlug === comp.slug ? (
                                  <>
                                    <Check className="w-3 h-3 text-emerald-500" />
                                    <span className="text-emerald-600">Lien copié !</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy className="w-3 h-3" />
                                    <span>Copier lien secret</span>
                                  </>
                                )}
                              </button>

                              <button
                                type="button"
                                onClick={() => setPreviewCompCard({ comp, votes, tierData, paidAmount, remainingToPay })}
                                className="p-1.5 rounded-lg border border-indigo-200 dark:border-indigo-800 bg-indigo-50/60 dark:bg-indigo-950/40 hover:bg-indigo-100 text-indigo-600 transition-colors cursor-pointer"
                                title="Aperçu de la Carte Bancaire VoteMoi de cette élection"
                              >
                                <CreditCard className="w-3.5 h-3.5" />
                              </button>

                              <Link
                                href={`/organisateur/${comp.organizerToken || comp.slug}`}
                                target="_blank"
                                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 text-slate-600 transition-colors"
                                title="Ouvrir avec le lien secret"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </Link>

                              <button
                                type="button"
                                disabled={regeneratingSlug === comp.slug}
                                onClick={() => handleRegenerateToken(comp.slug)}
                                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                                title="Régénérer une nouvelle clé secrète indevinable"
                              >
                                <RefreshCw className={`w-3.5 h-3.5 ${regeneratingSlug === comp.slug ? 'animate-spin' : ''}`} />
                              </button>
                            </div>

                            <span className="text-[10px] font-mono text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                              {comp.organizerToken ? `${comp.organizerToken.slice(0, 14)}••••••••` : 'Clé auto-générée'}
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* GESTION DES DEMANDES DE REVERSEMENT (PAYOUTS) */}
          <div className="bg-[var(--bg)] rounded-[24px] border border-[var(--line)] shadow-[var(--shadow)] overflow-hidden">
            <div className="p-5 sm:p-6 border-b border-[var(--line)] flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <Wallet className="w-5 h-5 text-indigo-600" />
                  <span>Demandes de Reversements Mobile Money Organisateur</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Virement instantané via l&apos;API Fapshi Disburse ou validation manuelle de vos transferts.
                </p>
              </div>

              <div className="flex items-center gap-2.5 flex-wrap">
                {fapshiBalance !== null && (
                  <span className="text-xs font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 px-3 py-1 rounded-full flex items-center gap-1.5 shadow-sm">
                    <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                    <span>Solde Fapshi : <strong>{fapshiBalance.toLocaleString('fr-FR')} FCFA</strong></span>
                  </span>
                )}

                {pendingPayoutsTotal > 0 && (
                  <span className="text-xs font-black text-amber-600 bg-amber-50 border border-amber-200 px-3 py-1 rounded-full">
                    {pendingPayoutsTotal.toLocaleString('fr-FR')} FCFA en attente
                  </span>
                )}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse min-w-[700px]">
                <thead>
                  <tr className="bg-[var(--soft)] border-b border-[var(--line)] text-slate-400 uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Élection</th>
                    <th className="py-3 px-4">Bénéficiaire &amp; Contact</th>
                    <th className="py-3 px-4">Montant</th>
                    <th className="py-3 px-4">Statut</th>
                    <th className="py-3 px-4 text-right">Action Super-Admin</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--line)]">
                  {payouts.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400">
                        Aucune demande de reversement enregistrée pour l&apos;instant.
                      </td>
                    </tr>
                  ) : (
                    payouts.map((payout) => (
                      <tr key={payout.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20">
                        <td className="py-3.5 px-4 font-medium text-slate-500">
                          {new Date(payout.createdAt).toLocaleDateString('fr-FR', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </td>
                        <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                          {payout.competitionTitle}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-bold">{payout.organizerName}</div>
                          <div className="text-[11px] text-slate-400 font-mono">
                            {payout.operator === 'ORANGE_MONEY' ? 'Orange Money' : 'MTN MoMo'} · {payout.organizerPhone}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 font-black text-sm text-slate-900 dark:text-white">
                          {payout.amount.toLocaleString('fr-FR')} FCFA
                        </td>
                        <td className="py-3.5 px-4">
                          {payout.status === 'PAID' ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                              <CheckCircle2 className="w-3 h-3" /> Payé
                            </span>
                          ) : payout.status === 'PENDING' ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-600 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full">
                              <Clock className="w-3 h-3" /> En attente
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-red-600 bg-red-50 border border-red-200 px-2.5 py-0.5 rounded-full">
                              Rejeté
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          {payout.status === 'PENDING' ? (
                            <div className="flex items-center justify-end gap-1.5 flex-wrap">
                              {/* BOUTON FAPSHI DISBURSE (AUTOMATIQUE) */}
                              <button
                                type="button"
                                disabled={processingPayoutId === payout.id}
                                onClick={() => handlePayWithFapshi(payout)}
                                className="py-1 px-3 rounded-lg bg-gradient-to-r from-amber-500 to-indigo-600 hover:from-amber-600 hover:to-indigo-700 text-white font-black text-[11px] cursor-pointer shadow-sm transition-all flex items-center gap-1 active:scale-95"
                                title="Envoyer le virement instantanément via l'API Fapshi Disburse"
                              >
                                <Zap className="w-3 h-3 fill-white" />
                                <span>{processingPayoutId === payout.id ? 'Envoi...' : 'Fapshi Auto'}</span>
                              </button>

                              {/* BOUTON VALIDATION MANUELLE */}
                              <button
                                type="button"
                                disabled={processingPayoutId === payout.id}
                                onClick={() => handleUpdatePayoutStatus(payout.id, 'PAID')}
                                className="py-1 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 text-slate-700 dark:text-slate-300 font-bold text-[11px] cursor-pointer shadow-sm transition-all"
                                title="Marquer comme payé manuellement si vous avez transféré depuis votre téléphone"
                              >
                                <span>Manuel</span>
                              </button>

                              {/* BOUTON REJET */}
                              <button
                                type="button"
                                disabled={processingPayoutId === payout.id}
                                onClick={() => handleUpdatePayoutStatus(payout.id, 'REJECTED')}
                                className="py-1 px-2 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 font-bold text-[11px] cursor-pointer transition-all"
                                title="Rejeter et recréditer le solde de l'organisateur"
                              >
                                <span>Rejeter</span>
                              </button>
                            </div>
                          ) : (
                            <div className="flex flex-col items-end">
                              <span className="text-[11px] font-bold text-slate-700 dark:text-slate-200">
                                {payout.status === 'PAID' ? 'Virement effectué' : 'Demande rejetée'}
                              </span>
                              <span className="text-[10px] text-slate-400 font-mono">
                                {payout.transactionRef || 'Traité'}
                              </span>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* MODAL APERÇU CARTE BANCAIRE DE LA COMPÉTITION */}
          {previewCompCard && (
            <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-white dark:bg-[#111827] rounded-[32px] p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-slate-100 dark:border-slate-800 relative">
                <button
                  type="button"
                  onClick={() => setPreviewCompCard(null)}
                  className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>

                <div className="text-center mb-6">
                  <span className="text-[11px] font-extrabold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider bg-indigo-50 dark:bg-indigo-950/60 px-3 py-1 rounded-full border border-indigo-100 dark:border-indigo-900/40">
                    CARTE BANCAIRE VIRTUELLE ORGANISATEUR
                  </span>
                  <h3 className="text-xl font-black text-slate-900 dark:text-white mt-2">
                    {previewCompCard.comp.title}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Aperçu exact de la carte bancaire affichée sur l&apos;espace confidentiel de cet organisateur.
                  </p>
                </div>

                <div className="flex justify-center mb-6">
                  <VoteMoiCard
                    competitionTitle={previewCompCard.comp.title}
                    organizerName="ORGANISATEUR OFFICIEL"
                    balance={previewCompCard.remainingToPay}
                    secondaryBalance={previewCompCard.tierData.organizerEarnings}
                    tierName={previewCompCard.tierData.currentTierName}
                    tierRate={previewCompCard.tierData.currentRateFCFA}
                    variant={previewCompCard.tierData.currentTierNumber === 3 ? 'gold' : 'violet'}
                    showWithdrawButton={false}
                    className="shadow-2xl"
                  />
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      handleCopyLink(previewCompCard.comp.organizerToken || previewCompCard.comp.slug, previewCompCard.comp.slug);
                    }}
                    className="flex-1 py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-indigo-500/20"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copier lien secret</span>
                  </button>
                  <Link
                    href={`/organisateur/${previewCompCard.comp.organizerToken || previewCompCard.comp.slug}`}
                    target="_blank"
                    className="py-3 px-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center gap-1.5"
                  >
                    <span>Ouvrir l&apos;espace</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          )}

        </main>
      </div>
    </AdminAuthGuard>
  );
}

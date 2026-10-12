'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import {
  Trophy,
  Vote,
  DollarSign,
  Wallet,
  TrendingUp,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Clock,
  ExternalLink,
  RefreshCw,
  Phone,
  AlertCircle,
  X,
} from 'lucide-react';
import { VoteMoiCard } from '@/components/VoteMoiCard';

interface StatsData {
  competition: {
    id: string;
    title: string;
    slug: string;
    status: string;
    votePrice: number;
    bannerImage: string;
    startDate: string;
    endDate: string;
    candidatesCount: number;
    organizerToken?: string;
  };
  financials: {
    totalVotes: number;
    organizerEarnings: number;
    currentTierNumber: 1 | 2 | 3;
    currentTierName: string;
    currentRateFCFA: number;
    nextTierThreshold: number | null;
    votesNeededForNextTier: number;
    progressPercent: number;
    totalPaid: number;
    pendingPayout: number;
    availableBalance: number;
  };
  payoutsHistory: Array<{
    id: string;
    amount: number;
    operator: string;
    organizerPhone: string;
    status: 'PENDING' | 'PAID' | 'REJECTED';
    createdAt: string;
    paidAt?: string;
    transactionRef?: string;
  }>;
}

export default function OrganisateurDashboardPage() {
  const params = useParams();
  const slug = params?.slug as string;

  const [data, setData] = useState<StatsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Modal Payout
  const [isPayoutModalOpen, setIsPayoutModalOpen] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState('');
  const [payoutPhone, setPayoutPhone] = useState('');
  const [payoutOperator, setPayoutOperator] = useState<'ORANGE_MONEY' | 'MTN_MOMO'>('ORANGE_MONEY');
  const [payoutOwnerName, setPayoutOwnerName] = useState('');
  const [isSubmittingPayout, setIsSubmittingPayout] = useState(false);
  const [payoutSuccessMessage, setPayoutSuccessMessage] = useState<string | null>(null);

  const cardExpiration = React.useMemo(() => {
    if (!data?.competition?.endDate) return '12/26';
    try {
      const d = new Date(data.competition.endDate);
      if (isNaN(d.getTime())) return '12/26';
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = String(d.getFullYear()).slice(-2);
      return `${month}/${year}`;
    } catch {
      return '12/26';
    }
  }, [data?.competition?.endDate]);

  const fetchStats = async () => {
    try {
      setError(null);
      const res = await fetch(`/api/organizer/stats?token=${encodeURIComponent(slug)}&slug=${encodeURIComponent(slug)}&_t=${Date.now()}`);
      const json = await res.json();
      if (json.success && json.data) {
        setData(json.data);
      } else {
        setError(json.error || 'Erreur lors du chargement des statistiques.');
      }
    } catch {
      setError('Impossible de joindre le serveur.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (slug) {
      fetchStats();
    }
  }, [slug]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchStats();
  };

  const handlePayoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!data) return;

    const amountNum = Number(payoutAmount);
    if (isNaN(amountNum) || amountNum < 100) {
      alert('Le montant minimum de retrait est de 100 FCFA.');
      return;
    }
    if (amountNum > data.financials.availableBalance) {
      alert('Le montant demandé dépasse votre solde disponible.');
      return;
    }
    if (!payoutPhone.trim()) {
      alert('Veuillez renseigner votre numéro Mobile Money.');
      return;
    }

    setIsSubmittingPayout(true);
    try {
      const res = await fetch('/api/organizer/payouts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizerToken: data.competition.organizerToken || slug,
          competitionSlug: data.competition.slug,
          competitionTitle: data.competition.title,
          organizerName: payoutOwnerName || 'Organisateur',
          organizerPhone: payoutPhone,
          operator: payoutOperator,
          amount: amountNum,
        }),
      });
      const resJson = await res.json();

      if (resJson.success) {
        setPayoutSuccessMessage(`Demande de ${amountNum.toLocaleString('fr-FR')} FCFA envoyée avec succès !`);
        setPayoutAmount('');
        await fetchStats();
        setTimeout(() => {
          setIsPayoutModalOpen(false);
          setPayoutSuccessMessage(null);
        }, 2500);
      } else {
        alert(resJson.error || 'Erreur lors de la soumission.');
      }
    } catch {
      alert('Erreur réseau.');
    } finally {
      setIsSubmittingPayout(false);
    }
  };

  return (
    <>
      <Header />
      <main className="min-h-screen py-10 px-4 sm:px-6 bg-slate-50/70 dark:bg-[#0b0f19] font-poppins">
        <div className="max-w-6xl mx-auto space-y-6">

          {/* TOP BAR: HEADER & ACTIONS */}
          <div className="bg-white dark:bg-[#111827] rounded-[28px] p-6 sm:p-8 shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[11px] font-extrabold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider bg-indigo-50 dark:bg-indigo-950/60 px-3 py-1 rounded-full border border-indigo-100 dark:border-indigo-900/40">
                  ESPACE ORGANISATEUR EN DIRECT
                </span>
                <span className="text-xs text-emerald-600 font-bold flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Synchronisation temps réel
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
                {data ? data.competition.title : 'Chargement...'}
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                Suivi transparent de vos votes et de vos gains selon la grille de commission par paliers.
              </p>
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto">
              <button
                type="button"
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="py-3 px-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center gap-2 transition-all cursor-pointer"
                title="Actualiser les données"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
                <span>Actualiser</span>
              </button>

              <Link
                href={`/competition/${slug}`}
                target="_blank"
                className="py-3 px-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-md shadow-indigo-500/20"
              >
                <span>Voir la page publique</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {isLoading ? (
            <div className="text-center py-20 text-slate-400 font-medium">
              Chargement des finances de la compétition...
            </div>
          ) : error || !data ? (
            <div className="p-8 sm:p-10 text-center bg-red-50 dark:bg-red-950/30 rounded-[32px] border border-red-200 dark:border-red-900 text-red-600 max-w-lg mx-auto shadow-sm">
              <AlertCircle className="w-10 h-10 mx-auto mb-3" />
              <h2 className="text-base sm:text-lg font-black mb-1">Accès Sécurisé Non Autorisé</h2>
              <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                {error || 'Cette clé secrète est invalide ou introuvable. Ce lien d&apos;accès est confidentiel et indevinable.'}
              </p>
              <Link
                href="/organisateur"
                className="mt-5 inline-flex items-center gap-2 py-3 px-5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-all shadow-md shadow-red-500/20"
              >
                <span>Saisir une autre clé secrète</span>
              </Link>
            </div>
          ) : (
            <>
              {/* SECTION CARTE BANCAIRE VOTEMOI & SYNTHÈSE DES GAINS */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                
                {/* COLONNE GAUCHE : CARTE BANCAIRE VOTEMOI (DESIGN LUXE AVEC PUCE EMV ET INFOS CONCOURS) */}
                <div className="lg:col-span-5 flex flex-col justify-center items-center">
                  <VoteMoiCard
                    competitionTitle={data.competition.title}
                    organizerName="ORGANISATEUR OFFICIEL"
                    balance={data.financials.availableBalance}
                    secondaryBalance={data.financials.organizerEarnings}
                    tierName={data.financials.currentTierName}
                    tierRate={data.financials.currentRateFCFA}
                    expirationDate={cardExpiration}
                    variant={data.financials.currentTierNumber === 3 ? 'gold' : 'violet'}
                    showWithdrawButton={true}
                    canWithdraw={data.financials.availableBalance >= 100}
                    onWithdrawClick={() => setIsPayoutModalOpen(true)}
                    className="mx-auto shadow-xl"
                  />
                </div>

                {/* COLONNE DROITE : 4 CARTES MÉTRIQUES ORGANISATEUR */}
                <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* CARD 1: TOTAL VOTES */}
                  <div className="bg-white dark:bg-[#111827] rounded-[24px] p-5 sm:p-6 border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between text-slate-500 text-xs font-bold mb-3">
                        <span>Votes Enregistrés</span>
                        <div className="w-9 h-9 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center">
                          <Vote className="w-4 h-4" />
                        </div>
                      </div>
                      <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
                        {data.financials.totalVotes.toLocaleString('fr-FR')}
                      </div>
                    </div>
                    <p className="text-[11px] text-slate-400 font-medium mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/80">
                      {data.competition.candidatesCount} candidat(s) en compétition
                    </p>
                  </div>

                  {/* CARD 2: GAINS CUMULÉS ORGANISATEUR */}
                  <div className="bg-white dark:bg-[#111827] rounded-[24px] p-5 sm:p-6 border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between text-slate-500 text-xs font-bold mb-3">
                        <span>Gains Cumulés</span>
                        <div className="w-9 h-9 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 flex items-center justify-center">
                          <DollarSign className="w-4 h-4" />
                        </div>
                      </div>
                      <div className="text-2xl sm:text-3xl font-black text-indigo-600 dark:text-indigo-400">
                        {data.financials.organizerEarnings.toLocaleString('fr-FR')} <span className="text-base font-bold">F</span>
                      </div>
                    </div>
                    <p className="text-[11px] text-indigo-500 font-medium mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/80">
                      Part totale acquise selon la grille
                    </p>
                  </div>

                  {/* CARD 3: PALIER ACTUEL */}
                  <div className="bg-white dark:bg-[#111827] rounded-[24px] p-5 sm:p-6 border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between text-slate-500 text-xs font-bold mb-3">
                        <span>Palier de Commission</span>
                        <div className="w-9 h-9 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center">
                          <Sparkles className="w-4 h-4" />
                        </div>
                      </div>
                      <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                        {data.financials.currentRateFCFA} FCFA <span className="text-xs font-semibold text-slate-400">/ vote</span>
                      </div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/80">
                      <span className="text-[11px] font-bold text-amber-600 bg-amber-50 dark:bg-amber-950/50 px-2.5 py-1 rounded-lg border border-amber-200 dark:border-amber-900/40">
                        {data.financials.currentTierName}
                      </span>
                    </div>
                  </div>

                  {/* CARD 4: RETRAITS VERSÉS */}
                  <div className="bg-white dark:bg-[#111827] rounded-[24px] p-5 sm:p-6 border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between text-slate-500 text-xs font-bold mb-3">
                        <span>Total Déjà Versé</span>
                        <div className="w-9 h-9 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center">
                          <CheckCircle2 className="w-4 h-4" />
                        </div>
                      </div>
                      <div className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400">
                        {data.financials.totalPaid.toLocaleString('fr-FR')} <span className="text-base font-bold">F</span>
                      </div>
                    </div>
                    <p className="text-[11px] text-slate-400 font-medium mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/80">
                      {data.financials.pendingPayout > 0
                        ? `${data.financials.pendingPayout.toLocaleString('fr-FR')} F en cours de transfert`
                        : 'Aucun virement en attente'}
                    </p>
                  </div>
                </div>

              </div>


              {/* PROGRESSION PALIER SUPERIEUR (MOTIVATION SECTION) */}
              <div className="bg-white dark:bg-[#111827] rounded-[28px] p-6 sm:p-8 border border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 flex items-center justify-center">
                      <TrendingUp className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                        Progression vers le palier de commission supérieur
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Plus vous mobilisez votre audience, plus chaque vote vous rapporte d&apos;argent !
                      </p>
                    </div>
                  </div>

                  {data.financials.nextTierThreshold ? (
                    <span className="text-xs font-extrabold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-3 py-1.5 rounded-xl border border-indigo-100 dark:border-indigo-900/40">
                      Encore {data.financials.votesNeededForNextTier.toLocaleString('fr-FR')} vote(s) pour passer au niveau supérieur !
                    </span>
                  ) : (
                    <span className="text-xs font-extrabold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 px-3 py-1.5 rounded-xl border border-emerald-200">
                      🎉 Palier Diamant Maximum Atteint (83 FCFA/vote) !
                    </span>
                  )}
                </div>

                {/* PROGRESS BAR */}
                <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden p-0.5">
                  <div
                    className="h-full bg-gradient-to-r from-indigo-500 via-indigo-600 to-purple-600 rounded-full transition-all duration-500"
                    style={{ width: `${data.financials.progressPercent}%` }}
                  />
                </div>

                {/* 3 TIERS ROADMAP */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                  <div className={`p-3.5 rounded-2xl border text-xs ${data.financials.currentTierNumber >= 1 ? 'border-indigo-500/40 bg-indigo-50/40 dark:bg-indigo-950/20' : 'border-slate-200 dark:border-slate-800 opacity-60'}`}>
                    <div className="font-bold text-slate-900 dark:text-white">🥉 Palier 1 (1 - 2 000 votes)</div>
                    <div className="text-indigo-600 font-extrabold text-sm mt-0.5">75 FCFA / vote</div>
                    <div className="text-[10px] text-slate-500 mt-1">Démarrage officiel</div>
                  </div>

                  <div className={`p-3.5 rounded-2xl border text-xs ${data.financials.currentTierNumber >= 2 ? 'border-indigo-500/40 bg-indigo-50/40 dark:bg-indigo-950/20' : 'border-slate-200 dark:border-slate-800 opacity-60'}`}>
                    <div className="font-bold text-slate-900 dark:text-white">🥈 Palier 2 (2 001 - 10 000 votes)</div>
                    <div className="text-indigo-600 font-extrabold text-sm mt-0.5">80 FCFA / vote</div>
                    <div className="text-[10px] text-slate-500 mt-1">+5 FCFA de gain supplémentaire par vote</div>
                  </div>

                  <div className={`p-3.5 rounded-2xl border text-xs ${data.financials.currentTierNumber >= 3 ? 'border-indigo-500/40 bg-indigo-50/40 dark:bg-indigo-950/20' : 'border-slate-200 dark:border-slate-800 opacity-60'}`}>
                    <div className="font-bold text-slate-900 dark:text-white">💎 Palier 3 (10 001+ votes)</div>
                    <div className="text-indigo-600 font-extrabold text-sm mt-0.5">83 FCFA / vote</div>
                    <div className="text-[10px] text-slate-500 mt-1">Taux VIP Élite maximum</div>
                  </div>
                </div>
              </div>

              {/* RETRAITS & HISTORIQUE DES PAIEMENTS */}
              <div className="bg-white dark:bg-[#111827] rounded-[28px] p-6 sm:p-8 border border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                      Historique de vos Reversements Mobile Money
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Les virements demandés sont traités par notre équipe financière sous 24h ouvrées.
                    </p>
                  </div>

                  <div className="text-right">
                    <span className="text-xs font-semibold text-slate-400">Déjà versé : </span>
                    <span className="text-xs font-black text-emerald-600">
                      {data.financials.totalPaid.toLocaleString('fr-FR')} FCFA
                    </span>
                  </div>
                </div>

                {data.payoutsHistory.length === 0 ? (
                  <div className="text-center py-8 text-slate-400 text-xs">
                    Aucune demande de reversement effectuée pour le moment.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 uppercase tracking-wider text-[10px]">
                          <th className="py-3 px-3">Date</th>
                          <th className="py-3 px-3">Montant</th>
                          <th className="py-3 px-3">Opérateur & Numéro</th>
                          <th className="py-3 px-3">Statut</th>
                          <th className="py-3 px-3 text-right">Référence</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {data.payoutsHistory.map((payout) => (
                          <tr key={payout.id}>
                            <td className="py-3 px-3 font-medium text-slate-600 dark:text-slate-300">
                              {new Date(payout.createdAt).toLocaleDateString('fr-FR', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric',
                              })}
                            </td>
                            <td className="py-3 px-3 font-extrabold text-slate-900 dark:text-white">
                              {payout.amount.toLocaleString('fr-FR')} FCFA
                            </td>
                            <td className="py-3 px-3 font-medium">
                              <span className="font-bold">{payout.operator === 'ORANGE_MONEY' ? 'Orange Money' : 'MTN MoMo'}</span> · {payout.organizerPhone}
                            </td>
                            <td className="py-3 px-3">
                              {payout.status === 'PAID' ? (
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-md">
                                  <CheckCircle2 className="w-3 h-3" /> Payé
                                </span>
                              ) : payout.status === 'PENDING' ? (
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-600 bg-amber-50 dark:bg-amber-950/50 px-2 py-0.5 rounded-md">
                                  <Clock className="w-3 h-3" /> En cours de traitement
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-md">
                                  Rejeté
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-3 text-right font-mono text-[11px] text-slate-400">
                              {payout.transactionRef || payout.id}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}

        </div>
      </main>

      {/* MODAL DEMANDE DE RETRAIT MOBILE MONEY */}
      {isPayoutModalOpen && data && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md overflow-y-auto font-poppins">
          <div className="w-full max-w-md bg-white dark:bg-[#111827] rounded-[32px] p-6 sm:p-8 shadow-2xl border border-slate-100 dark:border-slate-800 relative my-auto">
            
            <button
              type="button"
              onClick={() => setIsPayoutModalOpen(false)}
              className="absolute top-5 right-5 w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center">
                <Wallet className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white">Demande de Virement</h3>
                <span className="text-xs text-slate-400">Reversement direct sur votre numéro</span>
              </div>
            </div>

            {payoutSuccessMessage ? (
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-center font-bold text-xs">
                {payoutSuccessMessage}
              </div>
            ) : (
              <form onSubmit={handlePayoutSubmit} className="space-y-4">
                
                {/* SOLDE DISPO BANNER */}
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex justify-between items-center text-xs">
                  <span className="text-slate-500">Solde disponible :</span>
                  <span className="font-black text-sm text-indigo-600 dark:text-indigo-400">
                    {data.financials.availableBalance.toLocaleString('fr-FR')} FCFA
                  </span>
                </div>

                {/* CHOIX OPÉRATEUR */}
                <div>
                  <label className="block text-xs font-bold text-slate-900 dark:text-slate-100 mb-1.5">
                    Opérateur Mobile Money 🇨🇲
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setPayoutOperator('ORANGE_MONEY')}
                      className={`py-3 px-3 rounded-2xl border text-xs font-extrabold flex items-center justify-center gap-2 cursor-pointer transition-all ${payoutOperator === 'ORANGE_MONEY' ? 'border-orange-500 bg-orange-50 text-orange-600 ring-2 ring-orange-500/20' : 'border-slate-200 dark:border-slate-700 text-slate-600'}`}
                    >
                      <span>Orange Money</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPayoutOperator('MTN_MOMO')}
                      className={`py-3 px-3 rounded-2xl border text-xs font-extrabold flex items-center justify-center gap-2 cursor-pointer transition-all ${payoutOperator === 'MTN_MOMO' ? 'border-yellow-500 bg-yellow-50 text-yellow-700 ring-2 ring-yellow-500/20' : 'border-slate-200 dark:border-slate-700 text-slate-600'}`}
                    >
                      <span>MTN MoMo</span>
                    </button>
                  </div>
                </div>

                {/* NUMÉRO DE TÉLÉPHONE */}
                <div>
                  <label className="block text-xs font-bold text-slate-900 dark:text-slate-100 mb-1.5">
                    Numéro de réception
                  </label>
                  <div className="flex items-center rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40 focus-within:bg-white focus-within:border-indigo-500 transition-all overflow-hidden">
                    <div className="pl-3.5 pr-1 text-slate-400">
                      <Phone className="w-4 h-4" />
                    </div>
                    <input
                      type="tel"
                      required
                      placeholder="6XX XXX XXX"
                      value={payoutPhone}
                      onChange={(e) => setPayoutPhone(e.target.value)}
                      className="w-full py-3 px-3 bg-transparent text-slate-900 dark:text-white text-xs sm:text-sm font-semibold outline-none"
                    />
                  </div>
                </div>

                {/* NOM DU TITULAIRE */}
                <div>
                  <label className="block text-xs font-bold text-slate-900 dark:text-slate-100 mb-1.5">
                    Nom du titulaire du compte MoMo
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Jean-Paul Mbarga"
                    value={payoutOwnerName}
                    onChange={(e) => setPayoutOwnerName(e.target.value)}
                    className="w-full py-3 px-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40 text-slate-900 dark:text-white text-xs sm:text-sm font-semibold outline-none focus:border-indigo-500"
                  />
                </div>

                {/* MONTANT À RETIRER */}
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="block text-xs font-bold text-slate-900 dark:text-slate-100">
                      Montant à retirer (FCFA)
                    </label>
                    <button
                      type="button"
                      onClick={() => setPayoutAmount(data.financials.availableBalance.toString())}
                      className="text-[11px] font-bold text-indigo-600 underline cursor-pointer"
                    >
                      Tout retirer
                    </button>
                  </div>
                  <input
                    type="number"
                    min="100"
                    max={data.financials.availableBalance}
                    required
                    placeholder="Min. 100 FCFA"
                    value={payoutAmount}
                    onChange={(e) => setPayoutAmount(e.target.value)}
                    className="w-full py-3 px-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40 text-slate-900 dark:text-white text-sm font-black outline-none focus:border-indigo-500"
                  />
                  <p className="text-[11px] text-slate-400 mt-1 font-medium">
                    Montant minimum de retrait : 100 FCFA
                  </p>
                </div>

                {/* SUBMIT BUTTON */}
                <button
                  type="submit"
                  disabled={isSubmittingPayout}
                  className="w-full py-3.5 px-6 rounded-2xl font-bold text-sm text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.99] disabled:opacity-60"
                >
                  <span>{isSubmittingPayout ? 'Traitement en cours...' : 'Confirmer la demande de virement →'}</span>
                </button>
              </form>
            )}

            <div className="mt-4 flex items-center justify-center gap-1.5 text-[10px] text-slate-400 text-center">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span>Opération sécurisée • Transfert manuel sous 24h ouvrées</span>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </>
  );
}

'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { CandidateCard } from '@/components/CandidateCard';
import { Countdown } from '@/components/Countdown';
import { VoteModal } from '@/components/VoteModal';
import { getCompetitions, getCandidates, submitVote } from '@/services/dbService';
import { Competition, Candidate } from '@/data/mockData';

export default function CompetitionDetailPage() {
  const params = useParams();
  const slug = params?.slug as string;

  const [competition, setCompetition] = useState<Competition | null>(null);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [isVoteModalOpen, setIsVoteModalOpen] = useState(false);

  const [categoryFilter, setCategoryFilter] = useState<'TOUT' | 'Miss' | 'Mister'>('TOUT');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Payment Status Banner State
  const [paymentNotice, setPaymentNotice] = useState<{
    type: 'success' | 'info' | 'error';
    title: string;
    message: string;
  } | null>(null);

  // Fetch live competition and candidates from DB
  useEffect(() => {
    async function loadLiveData() {
      setIsLoading(true);
      const comps = await getCompetitions();
      const targetComp = comps.find((c) => c.slug === slug) || comps[0] || null;
      setCompetition(targetComp);

      if (targetComp) {
        const cands = await getCandidates(targetComp.slug);
        setCandidates(cands);
      }
      setIsLoading(false);
    }
    loadLiveData();
  }, [slug]);

  // HANDLE POST-PAYMENT REDIRECT FROM FAPSHI GATEWAY
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const urlParams = new URLSearchParams(window.location.search);
    const voteSuccess = urlParams.get('voteSuccess');
    const voteId = urlParams.get('voteId');
    const transId = urlParams.get('transId');
    const candidateId = urlParams.get('candidateId');

    if (voteSuccess === 'true' || voteId || transId) {
      let attempts = 0;
      const maxAttempts = 5;

      const verifyPayment = async () => {
        try {
          const res = await fetch(
            `/api/pay/status?transId=${transId || ''}&voteId=${voteId || ''}&candidateId=${candidateId || ''}`,
            { cache: 'no-store' }
          );
          const data = await res.json();

          if (data.isSuccess) {
            const freshCands = await getCandidates(slug);
            if (freshCands && freshCands.length > 0) {
              setCandidates(freshCands);
            }

            setPaymentNotice({
              type: 'success',
              title: '🎉 Vote Confirmé & Comptabilisé !',
              message: `Votre paiement a été vérifié avec succès. ${data.voteCount || 1} vote(s) crédité(s) !`,
            });

            window.history.replaceState({}, document.title, window.location.pathname);
            return true;
          } else if (data.status === 'PENDING' && attempts < maxAttempts) {
            attempts++;
            setPaymentNotice({
              type: 'info',
              title: '⏳ Validation du Paiement en cours...',
              message: 'Confirmation du débit Mobile Money auprès de l’opérateur...',
            });
            return false;
          } else {
            setPaymentNotice({
              type: 'info',
              title: '📲 Validation Mobile Money',
              message: 'Si vous avez validé le code USSD, le vote sera comptabilisé automatiquement.',
            });
            window.history.replaceState({}, document.title, window.location.pathname);
            return true;
          }
        } catch {
          return true;
        }
      };

      const pollInterval = setInterval(async () => {
        const done = await verifyPayment();
        if (done || attempts >= maxAttempts) {
          clearInterval(pollInterval);
        }
      }, 3000);

      verifyPayment();
      return () => clearInterval(pollInterval);
    }
  }, [slug]);

  const handleVoteClick = (candidate: Candidate) => {
    setSelectedCandidate(candidate);
    setIsVoteModalOpen(true);
  };

  const handleConfirmVote = (candidateId: string, count: number = 1) => {
    // Le vote a DÉJÀ été enregistré de façon atomique par /api/pay/status.
    // On met à jour l'affichage local du nombre exact de votes payés (+count).
    setCandidates((prev) =>
      prev.map((c) =>
        c.id === candidateId
          ? {
              ...c,
              voteCount: (c.voteCount || 0) + count,
            }
          : c
      )
    );
  };

  const filteredCandidates = candidates.filter((cand) => {
    const matchesCategory = categoryFilter === 'TOUT' || cand.category === categoryFilter;
    const matchesSearch =
      cand.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cand.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cand.candidateNumber.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const totalVotes = candidates.reduce((sum, c) => sum + c.voteCount, 0);

  if (isLoading) {
    return (
      <>
        <Header />
        <main style={{ padding: '80px 0', textAlign: 'center', color: 'var(--mute)' }}>
          Chargement de la compétition...
        </main>
        <Footer />
      </>
    );
  }

  if (!competition) {
    return (
      <>
        <Header />
        <main className="wd" style={{ padding: '80px 0', textAlign: 'center' }}>
          <h2>Compétition introuvable</h2>
          <p className="mute" style={{ marginTop: '10px' }}>Cette compétition n&apos;est pas disponible actuellement.</p>
          <div style={{ marginTop: '20px' }}>
            <Link href="/competitions" className="btn">
              Retour aux compétitions
            </Link>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />

      <main className="flex-1">
        {/* PAYMENT NOTIFICATION BANNER */}
        {paymentNotice && (
          <div
            style={{
              background:
                paymentNotice.type === 'success'
                  ? 'rgba(16, 185, 129, 0.15)'
                  : 'rgba(91, 61, 245, 0.15)',
              borderBottom: '1px solid var(--line)',
              padding: '12px 24px',
              textAlign: 'center',
            }}
          >
            <div className="wd" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ textAlign: 'left' }}>
                <strong style={{ display: 'block', fontSize: '0.9rem' }}>{paymentNotice.title}</strong>
                <span className="sm mute">{paymentNotice.message}</span>
              </div>
              <button
                type="button"
                className="btn sm line"
                onClick={() => setPaymentNotice(null)}
              >
                Fermer
              </button>
            </div>
          </div>
        )}

        {/* COMPETITION HEADER */}
        <section className="pg">
          <div className="wd">
            <Link href="/competitions" className="crumb">
              ‹ Toutes les compétitions
            </Link>

            <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginTop: '16px', flexWrap: 'wrap' }}>
              {competition.logoImage && (
                <div
                  style={{
                    position: 'relative',
                    width: '68px',
                    height: '68px',
                    borderRadius: '16px',
                    overflow: 'hidden',
                    background: 'var(--soft)',
                    border: '2px solid var(--line)',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
                    flexShrink: 0,
                  }}
                >
                  <Image
                    src={competition.logoImage}
                    alt={`Logo ${competition.title}`}
                    fill
                    sizes="68px"
                    style={{ objectFit: 'cover' }}
                  />
                </div>
              )}
              <div>
                <p className="eb" style={{ margin: 0 }}>
                  {competition.status} · 1 VOTE = {competition.votePrice || 100} FCFA
                </p>
                <h1 className="pt" style={{ marginTop: '4px' }}>{competition.title}</h1>
              </div>
            </div>
            <p className="lead">{competition.description}</p>

            {/* COUNTDOWN & METRICS PILL */}
            <div className="cdp">
              <span>Fin des votes dans :</span>
              <Countdown targetDate={competition.endDate} />
              <span className="mute" style={{ marginLeft: '12px' }}>
                · {candidates.length > 0 ? candidates.length : (competition.totalCandidates || 1)} candidat{(candidates.length || competition.totalCandidates) > 1 ? 's' : ''} · {totalVotes.toLocaleString('fr-FR')} votes enregistrés
              </span>
            </div>

            {/* FILTERS & SEARCH ROW */}
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '14px',
                marginTop: '24px',
              }}
            >
              <div className="fl" role="tablist" style={{ marginTop: 0 }}>
                {[
                  { id: 'TOUT', label: 'Tous les candidats' },
                  { id: 'Miss', label: 'Miss' },
                  { id: 'Mister', label: 'Mister' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    role="tab"
                    aria-pressed={categoryFilter === tab.id}
                    onClick={() => setCategoryFilter(tab.id as any)}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div style={{ maxWidth: '280px', width: '100%' }}>
                <input
                  type="text"
                  placeholder="Rechercher un candidat..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ marginTop: 0, padding: '8px 14px', fontSize: '0.9rem' }}
                />
              </div>
            </div>

            {/* CANDIDATES GRID */}
            {filteredCandidates.length === 0 ? (
              <div
                style={{
                  background: 'var(--soft)',
                  borderRadius: '20px',
                  padding: '48px 24px',
                  textAlign: 'center',
                  marginTop: '28px',
                }}
              >
                <h3>Aucun candidat dans cette catégorie</h3>
                <p className="mute" style={{ marginTop: '8px' }}>
                  La liste des candidats sera mise à jour prochainement.
                </p>
              </div>
            ) : (
              <div className="pcs">
                {filteredCandidates.map((candidate, idx) => (
                  <CandidateCard
                    key={candidate.id}
                    candidate={candidate}
                    index={idx}
                    onVoteClick={handleVoteClick}
                  />
                ))}
              </div>
            )}
          </div>
        </section>
      </main>

      {/* VOTE MODAL */}
      <VoteModal
        isOpen={isVoteModalOpen}
        candidate={selectedCandidate}
        onClose={() => setIsVoteModalOpen(false)}
        onConfirmVote={handleConfirmVote}
      />

      <Footer />
    </>
  );
}

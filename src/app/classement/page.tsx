'use client';

import React, { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Podium } from '@/components/Podium';
import { RankingCard } from '@/components/RankingCard';
import { VoteModal } from '@/components/VoteModal';
import { getCompetitions, getCandidates, submitVote } from '@/services/dbService';
import { Competition, Candidate } from '@/data/mockData';

export default function ClassementPage() {
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [selectedSlug, setSelectedSlug] = useState<string>('');
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [isVoteModalOpen, setIsVoteModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Load competitions & candidates live from DB
  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      const comps = await getCompetitions();
      setCompetitions(comps);
      if (comps.length > 0) {
        const initialSlug = comps[0].slug;
        setSelectedSlug(initialSlug);
        const cands = await getCandidates(initialSlug);
        setCandidates(cands);
      }
      setIsLoading(false);
    }
    loadData();
  }, []);

  // GESTION DU RETOUR APRÈS PAIEMENT FAPSHI (OM & MOMO)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const urlParams = new URLSearchParams(window.location.search);
    const voteSuccess = urlParams.get('voteSuccess');
    const voteId = urlParams.get('voteId');
    const transId = urlParams.get('transId');
    const candidateId = urlParams.get('candidateId');

    if (voteSuccess === 'true' || voteId || transId) {
      const verifyPayment = async () => {
        try {
          const res = await fetch(
            `/api/pay/status?transId=${transId || ''}&voteId=${voteId || ''}&candidateId=${candidateId || ''}`,
            { cache: 'no-store' }
          );
          const data = await res.json();
          if (data.isSuccess) {
            const addedVotes = data.voteCount || 1;
            const targetId = data.candidateId || candidateId;
            if (targetId) {
              setCandidates((prev) =>
                prev.map((c) =>
                  c.id === targetId
                    ? { ...c, voteCount: (c.voteCount || 0) + (data.alreadyProcessed ? 0 : addedVotes) }
                    : c
                )
              );
            }
            window.history.replaceState({}, document.title, window.location.pathname);
          }
        } catch {}
      };
      verifyPayment();
    }
  }, []);

  // When competition tab changes
  const handleSelectComp = async (slug: string) => {
    setSelectedSlug(slug);
    const cands = await getCandidates(slug);
    setCandidates(cands);
  };

  const currentCompetition = competitions.find((c) => c.slug === selectedSlug) || competitions[0];

  const currentCandidates = candidates
    .sort((a, b) => b.voteCount - a.voteCount)
    .map((cand, idx) => ({ ...cand, rank: idx + 1 }));

  const handleVoteClick = (candidate: Candidate) => {
    setSelectedCandidate(candidate);
    setIsVoteModalOpen(true);
  };

  const handleConfirmVote = async (candidateId: string, count: number = 1) => {
    if (selectedCandidate && currentCompetition) {
      setCandidates((prev) =>
        prev.map((c) =>
          c.id === candidateId
            ? {
                ...c,
                voteCount: c.voteCount + count,
              }
            : c
        )
      );
      await submitVote(
        candidateId,
        `${selectedCandidate.firstName} ${selectedCandidate.lastName}`,
        currentCompetition.slug,
        count,
        currentCompetition.votePrice || 100
      );
    }
  };

  return (
    <>
      <Header />

      <main className="flex-1">
        <section className="pg">
          <div className="wd">
            {/* EYEBROW & TITLE */}
            <p className="eb">Classement en direct</p>
            <h1 className="pt">Leaderboard officiel</h1>
            <p className="lead">
              Mis à jour instantanément à chaque vote Mobile Money. Les 3 premiers sont actuellement en position de qualification.
            </p>

            {/* COMPETITION TABS */}
            {competitions.length > 0 && (
              <div className="fl" role="tablist" style={{ marginTop: '20px' }}>
                {competitions.map((comp) => (
                  <button
                    key={comp.id}
                    role="tab"
                    aria-pressed={selectedSlug === comp.slug}
                    onClick={() => handleSelectComp(comp.slug)}
                  >
                    {comp.title}
                  </button>
                ))}
              </div>
            )}

            {isLoading ? (
              <div style={{ padding: '60px 0', textAlign: 'center', color: 'var(--mute)' }}>
                Chargement du classement...
              </div>
            ) : currentCandidates.length === 0 ? (
              <div
                style={{
                  background: 'var(--soft)',
                  borderRadius: '20px',
                  padding: '48px 24px',
                  textAlign: 'center',
                  marginTop: '28px',
                }}
              >
                <h3>Aucun candidat dans cette compétition</h3>
                <p className="mute" style={{ marginTop: '8px' }}>
                  Les candidats seront affichés dès leur enregistrement.
                </p>
              </div>
            ) : (
              <>
                {/* 3D PODIUM FOR TOP 3 */}
                {currentCandidates.length >= 3 && (
                  <Podium
                    candidates={currentCandidates.slice(0, 3)}
                    onVoteClick={handleVoteClick}
                  />
                )}

                {/* FULL RANKINGS LIST */}
                <div style={{ marginTop: '36px' }}>
                  <h3 style={{ fontSize: '1.2rem', marginBottom: '8px' }}>
                    Classement Général ({currentCandidates.length} candidats)
                  </h3>

                  <div className="rkg">
                    {currentCandidates.map((cand) => (
                      <RankingCard
                        key={cand.id}
                        candidate={cand}
                        onVoteClick={handleVoteClick}
                      />
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </section>
      </main>

      {/* VOTE CONFIRMATION MODAL */}
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

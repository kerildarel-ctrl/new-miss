'use client';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { CandidateProfileView } from '@/components/CandidateProfileView';
import { getCandidates, getCompetitions, submitVote } from '@/services/dbService';
import { Candidate, Competition } from '@/data/mockData';

export default function CandidateDirectPage({
  params,
}: {
  params: Promise<{ candidateSlug: string }>;
}) {
  const resolvedParams = use(params);
  const rawCandSlug = resolvedParams?.candidateSlug || '';

  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [competition, setCompetition] = useState<Competition | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      const comps = await getCompetitions();
      const allCands = await getCandidates();

      const foundCand =
        allCands.find((c) => {
          const fullConcat = `${c.lastName}${c.firstName}`.toLowerCase().replace(/[^a-z0-9]+/g, '');
          const reverseConcat = `${c.firstName}${c.lastName}`.toLowerCase().replace(/[^a-z0-9]+/g, '');
          const hyphenated = `${c.firstName}-${c.lastName}`.toLowerCase().replace(/[^a-z0-9]+/g, '-');
          const numberOnly = c.candidateNumber.replace('#', '').toLowerCase();

          const target = rawCandSlug.toLowerCase();
          return (
            target === fullConcat ||
            target === reverseConcat ||
            target === hyphenated ||
            target === c.id.toLowerCase() ||
            target === numberOnly
          );
        }) || allCands[0] || null;

      if (foundCand) {
        setCandidate(foundCand);
        const comp = comps.find((c) => c.slug === foundCand.competitionSlug) || comps[0] || null;
        setCompetition(comp);
      }
      setIsLoading(false);
    }
    loadData();
  }, [rawCandSlug]);

  // Handle post-payment redirect from Fapshi
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
            setCandidate((prev) =>
              prev ? { ...prev, voteCount: (prev.voteCount || 0) + (data.alreadyProcessed ? 0 : addedVotes) } : null
            );
            window.history.replaceState({}, document.title, window.location.pathname);
          }
        } catch {}
      };
      verifyPayment();
    }
  }, []);

  const handleConfirmVote = async (candidateId: string, count: number = 1) => {
    if (candidate && competition) {
      setCandidate((prev) =>
        prev
          ? {
              ...prev,
              voteCount: prev.voteCount + count,
            }
          : null
      );
      await submitVote(
        candidateId,
        `${candidate.firstName} ${candidate.lastName}`,
        competition.slug,
        count,
        competition.votePrice || 100
      );
    }
  };

  const handleCandidateUpdate = (updatedCandidate: Candidate) => {
    setCandidate(updatedCandidate);
  };

  if (isLoading) {
    return (
      <>
        <Header />
        <main style={{ padding: '80px 0', textAlign: 'center', color: 'var(--mute)' }}>
          Chargement du profil du candidat...
        </main>
        <Footer />
      </>
    );
  }

  if (!candidate) {
    return (
      <>
        <Header />
        <main className="wd" style={{ padding: '80px 0', textAlign: 'center' }}>
          <h2>Candidat introuvable</h2>
          <p className="mute" style={{ marginTop: '10px' }}>
            Le profil demandé n&apos;existe pas.
          </p>
          <div style={{ marginTop: '20px' }}>
            <Link href="/competitions" className="btn">
              Voir toutes les compétitions
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

      <main className="flex-1 wd">
        <CandidateProfileView
          candidate={candidate}
          competition={competition}
          onConfirmVote={handleConfirmVote}
        />
      </main>

      <Footer />
    </>
  );
}


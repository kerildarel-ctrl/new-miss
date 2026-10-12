'use client';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { CandidateProfileView } from '@/components/CandidateProfileView';
import { getCompetitions, getCandidates, submitVote } from '@/services/dbService';
import { Candidate, Competition } from '@/data/mockData';

export default function CandidateDetailPage({
  params,
}: {
  params: Promise<{ slug: string; id: string }>;
}) {
  const resolvedParams = use(params);
  const slug = resolvedParams?.slug || '';
  const id = resolvedParams?.id || '';

  const [competition, setCompetition] = useState<Competition | null>(null);
  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      const comps = await getCompetitions();
      const comp = comps.find((c) => c.slug === slug) || comps[0] || null;
      setCompetition(comp);

      if (comp) {
        const cands = await getCandidates(comp.slug);
        const found =
          cands.find(
            (c) =>
              c.id === id ||
              c.id === `cand-${id}` ||
              c.candidateNumber === `#${id}` ||
              c.candidateNumber.replace('#', '') === id
          ) || cands[0] || null;
        setCandidate(found);
      }
      setIsLoading(false);
    }
    loadData();
  }, [slug, id]);

  const handleConfirmVote = (candidateId: string, count: number = 1) => {
    // Le vote a DÉJÀ été enregistré de façon atomique par /api/pay/status.
    setCandidate((prev) =>
      prev ? { ...prev, voteCount: (prev.voteCount || 0) + count } : null
    );
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

  if (!candidate || !competition) {
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



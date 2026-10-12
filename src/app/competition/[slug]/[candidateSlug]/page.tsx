'use client';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { CandidateProfileView } from '@/components/CandidateProfileView';
import { getCandidates, getCompetitions, submitVote } from '@/services/dbService';
import { Candidate, Competition } from '@/data/mockData';

export default function CandidateDetailPage({
  params,
}: {
  params: Promise<{ slug: string; candidateSlug: string }>;
}) {
  const resolvedParams = use(params);
  const compSlug = resolvedParams?.slug || '';
  const rawCandSlug = resolvedParams?.candidateSlug || '';

  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [competition, setCompetition] = useState<Competition | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Payment Status Banner State
  const [paymentNotice, setPaymentNotice] = useState<{
    type: 'success' | 'info' | 'error';
    title: string;
    message: string;
  } | null>(null);

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      const comps = await getCompetitions();
      const targetComp = comps.find((c) => c.slug === compSlug) || comps[0] || null;
      setCompetition(targetComp);

      const cands = await getCandidates(compSlug);

      const foundCand =
        cands.find((c) => {
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
        }) || cands[0] || null;

      setCandidate(foundCand);
      setIsLoading(false);
    }
    loadData();
  }, [compSlug, rawCandSlug]);

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
            const cands = await getCandidates(compSlug);
            const freshCand = cands.find((c) => c.id === candidateId || c.id === candidate?.id);
            if (freshCand) {
              setCandidate(freshCand);
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
              message: 'Si vous avez validé la transaction, le vote sera comptabilisé automatiquement.',
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
  }, [compSlug, candidate?.id]);

  const handleConfirmVote = (candidateId: string, count: number = 1) => {
    // Le vote est déjà enregistré de manière atomique par /api/pay/status.
    // On incrémente uniquement l'affichage local du nombre exact de votes payés (+count).
    setCandidate((prev) =>
      prev
        ? {
            ...prev,
            voteCount: (prev.voteCount || 0) + count,
          }
        : null
    );
  };

  const handleCandidateUpdate = (updated: Candidate) => {
    setCandidate(updated);
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
            Le profil demandé n&apos;existe pas dans cette compétition.
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
          paymentNotice={paymentNotice}
          onClosePaymentNotice={() => setPaymentNotice(null)}
        />
      </main>

      <Footer />
    </>
  );
}


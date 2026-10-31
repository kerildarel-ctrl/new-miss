'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { getCompetitions, getCandidates } from '@/services/dbService';
import { Competition, Candidate } from '@/data/mockData';

const POLL_INTERVAL_MS = 30_000; // 30 secondes

export default function ResultatsPage() {
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [selectedSlug, setSelectedSlug] = useState<string>('');
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const selectedSlugRef = useRef(selectedSlug);
  selectedSlugRef.current = selectedSlug;

  const refreshCandidates = useCallback(async (slug: string, silent = false) => {
    if (!slug) return;
    if (!silent) setIsRefreshing(true);
    try {
      const cands = await getCandidates(slug);
      setCandidates(cands);
      setLastUpdated(new Date());
    } finally {
      if (!silent) setIsRefreshing(false);
    }
  }, []);

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
        setLastUpdated(new Date());
      }
      setIsLoading(false);
    }
    loadData();
  }, []);

  // Auto-polling every 30s
  useEffect(() => {
    const interval = setInterval(() => {
      refreshCandidates(selectedSlugRef.current, true);
    }, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [refreshCandidates]);

  const handleSelectComp = async (slug: string) => {
    setSelectedSlug(slug);
    await refreshCandidates(slug);
  };

  const currentCompetition = competitions.find((c) => c.slug === selectedSlug) || competitions[0];
  const sortedCandidates = [...candidates].sort((a, b) => (b.voteCount ?? 0) - (a.voteCount ?? 0));
  const totalVotes = candidates.reduce((sum, c) => sum + (c.voteCount ?? 0), 0);
  const activeCandidates = candidates.filter(c => (c.voteCount ?? 0) > 0).length;

  // Colors for donut chart & legend
  const sliceColors = [
    'var(--p)',
    'var(--a)',
    'var(--hero)',
    '#3B82F6',
    '#10B981',
    '#F59E0B',
    '#8B5CF6',
    'var(--mute)',
  ];

  // Calculate SVG circumference for r = 38
  const radius = 38;
  const circumference = 2 * Math.PI * radius; // ~ 238.76

  let currentOffset = 0;
  const donutSlices = sortedCandidates.slice(0, 8).map((cand, idx) => {
    const pct = totalVotes > 0 ? cand.voteCount / totalVotes : 0;
    const dashLength = pct * circumference;
    const dashGap = circumference - dashLength;
    const offset = -currentOffset;
    currentOffset += dashLength;

    return {
      cand,
      color: sliceColors[idx % sliceColors.length],
      dashArray: `${dashLength.toFixed(1)} ${dashGap.toFixed(1)}`,
      offset: offset.toFixed(1),
      percentage: (pct * 100).toFixed(1),
    };
  });

  return (
    <>
      <Header />

      <main className="flex-1">
        <section className="pg">
          <div className="wd">
            {/* EYEBROW & TITLE */}
            <p className="eb">Analytiques &amp; transparence</p>
            <h1 className="pt">Résultats des votes</h1>
            <p className="lead">
              Répartition des voix en temps réel. Données certifiées et horodatées pour chaque candidat.
            </p>

            {/* LIVE INDICATOR */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '12px', flexWrap: 'wrap' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', fontWeight: 700, color: 'var(--p)' }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981', display: 'inline-block', animation: 'pulse 2s infinite' }} />
                Mise à jour automatique toutes les 30s
              </span>
              {lastUpdated && (
                <span style={{ fontSize: '0.75rem', color: 'var(--mute)', fontWeight: 500 }}>
                  · Dernière mise à jour : {lastUpdated.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </span>
              )}
              <button
                onClick={() => refreshCandidates(selectedSlug)}
                disabled={isRefreshing}
                style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--p)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', opacity: isRefreshing ? 0.5 : 1 }}
              >
                {isRefreshing ? 'Actualisation...' : '↻ Actualiser'}
              </button>
            </div>

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
                Chargement des résultats...
              </div>
            ) : sortedCandidates.length === 0 ? (
              <div
                style={{
                  background: 'var(--soft)',
                  borderRadius: '20px',
                  padding: '48px 24px',
                  textAlign: 'center',
                  marginTop: '28px',
                }}
              >
                <h3>Aucun résultat enregistré</h3>
                <p className="mute" style={{ marginTop: '8px' }}>
                  Les votes débuteront très prochainement dans cette compétition.
                </p>
              </div>
            ) : (
              <>
                {/* DONUT CHART & LEGEND */}
                <div className="don">
                  <svg viewBox="0 0 100 100" aria-label="Graphique circulaire des votes">
                    {/* Background ring */}
                    <circle
                      cx="50"
                      cy="50"
                      r={radius}
                      fill="none"
                      stroke="var(--soft)"
                      strokeWidth="14"
                    />

                    {/* Dynamic slices */}
                    {donutSlices.map((slice, i) => (
                      <circle
                        key={slice.cand.id || i}
                        cx="50"
                        cy="50"
                        r={radius}
                        fill="none"
                        stroke={slice.color}
                        strokeWidth="14"
                        strokeDasharray={slice.dashArray}
                        strokeDashoffset={slice.offset}
                        style={{
                          transform: 'rotate(-90deg)',
                          transformOrigin: '50% 50%',
                          transition: 'stroke-dasharray 0.8s ease',
                        }}
                      />
                    ))}
                  </svg>

                  {/* LEGEND LIST */}
                  <div>
                    {donutSlices.map((slice) => (
                      <div key={slice.cand.id} className="lg">
                        <i style={{ background: slice.color }} />
                        <span>
                          {slice.cand.firstName} {slice.cand.lastName}{' '}
                          <span className="mute">({slice.cand.candidateNumber})</span>
                        </span>
                        <b>{slice.percentage}%</b>
                        <span className="mute">{slice.cand.voteCount.toLocaleString('fr-FR')} v</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* KEY METRICS CARDS */}
                <div className="met">
                  <div>
                    <b>{totalVotes.toLocaleString('fr-FR')}</b>
                    Total des votes enregistrés
                  </div>
                  <div>
                    <b>{candidates.length}</b>
                    Candidats en compétition
                  </div>
                  <div>
                    <b>{activeCandidates}</b>
                    Candidats avec des votes
                  </div>
                </div>
              </>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}

'use client';

import React, { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { getCompetitions, getCandidates } from '@/services/dbService';
import { Competition, Candidate } from '@/data/mockData';

export default function ResultatsPage() {
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [selectedSlug, setSelectedSlug] = useState<string>('');
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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

  const handleSelectComp = async (slug: string) => {
    setSelectedSlug(slug);
    const cands = await getCandidates(slug);
    setCandidates(cands);
  };

  const currentCompetition = competitions.find((c) => c.slug === selectedSlug) || competitions[0];
  const sortedCandidates = [...candidates].sort((a, b) => b.voteCount - a.voteCount);
  const totalVotes = candidates.reduce((sum, c) => sum + c.voteCount, 0);
  const votePrice = currentCompetition?.votePrice || 100;
  const totalCollected = totalVotes * votePrice;

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
                    <b>{totalCollected.toLocaleString('fr-FR')} FCFA</b>
                    Volume collecté sécurisé
                  </div>
                  <div>
                    <b>99.9%</b>
                    Taux de réussite Mobile Money
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

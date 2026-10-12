'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Competition, Candidate } from '@/data/mockData';
import { Countdown } from '@/components/Countdown';
import { getCandidates } from '@/services/dbService';

interface CompetitionCardProps {
  competition: Competition;
  candidates?: Candidate[];
  index?: number;
}

export const CompetitionCard: React.FC<CompetitionCardProps> = ({ competition, candidates: initialCandidates }) => {
  const [candidatesList, setCandidatesList] = useState<Candidate[]>(initialCandidates || []);

  useEffect(() => {
    if (initialCandidates && initialCandidates.length > 0) {
      setCandidatesList(initialCandidates.filter((c) => c.competitionSlug === competition.slug));
    } else {
      async function loadCompCandidates() {
        const cands = await getCandidates(competition.slug);
        setCandidatesList(cands);
      }
      loadCompCandidates();
    }
  }, [competition.slug, initialCandidates]);

  const isEnCours = competition.status === 'EN COURS';
  const isAVenir = competition.status === 'A VENIR';

  // Take maximum 4 candidates
  const displayCandidates = candidatesList.slice(0, 4);
  const actualCandidateCount = candidatesList.length > 0 ? candidatesList.length : (competition.totalCandidates || 1);

  return (
    <Link href={`/competition/${competition.slug}`} className="tile">
      {/* TOP HEADER ROW WITH STATUS CHIP AND LOGO */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <span
          className={`chip ${
            isEnCours ? '' : isAVenir ? 'av' : 'te'
          }`}
          style={{ marginBottom: 0 }}
        >
          {isEnCours ? 'En cours' : isAVenir ? 'À venir' : 'Terminé'}
        </span>

        {competition.logoImage && (
          <div
            style={{
              position: 'relative',
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              overflow: 'hidden',
              background: 'var(--soft)',
              border: '1.5px solid var(--line)',
              boxShadow: '0 2px 6px rgba(0,0,0,0.12)',
              flexShrink: 0,
            }}
          >
            <Image
              src={competition.logoImage}
              alt={`Logo ${competition.title}`}
              fill
              sizes="42px"
              style={{ objectFit: 'cover' }}
            />
          </div>
        )}
      </div>

      {/* TITLE & DESCRIPTION */}
      <h3 style={{ fontSize: '1.3rem', fontWeight: 700 }}>{competition.title}</h3>
      <p className="lead" style={{ fontSize: '0.9rem', marginTop: '6px' }}>
        {competition.description}
      </p>

      {/* COUNTDOWN BADGE */}
      <div className="cdl" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '10px' }}>
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          style={{ flexShrink: 0, display: 'block' }}
        >
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
        <span style={{ display: 'inline-flex', alignItems: 'center' }}>
          <Countdown targetDate={competition.endDate} compact />
        </span>
      </div>

      {/* CANDIDATE PHOTOS AVATARS (MAX 4 REAL CANDIDATE PHOTOS) */}
      {displayCandidates.length > 0 && (
        <div className="faces" aria-label={`Photos des candidats (${displayCandidates.length})`}>
          {displayCandidates.map((cand, i) => (
            <span
              key={cand.id || i}
              className="pa"
              style={{
                position: 'relative',
                overflow: 'hidden',
                borderRadius: '50%',
                border: '2px solid var(--soft)',
                boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
              }}
            >
              {cand.photoUrl ? (
                <Image
                  src={cand.photoUrl}
                  alt={`${cand.firstName} ${cand.lastName}`}
                  fill
                  sizes="40px"
                  style={{ objectFit: 'cover', objectPosition: 'top' }}
                />
              ) : (
                <div
                  style={{
                    width: '100%',
                    height: '100%',
                    background: 'var(--p)',
                    color: '#ffffff',
                    display: 'grid',
                    placeItems: 'center',
                    fontWeight: 700,
                    fontSize: '0.8rem',
                  }}
                >
                  {cand.firstName?.charAt(0)}
                </div>
              )}
            </span>
          ))}
        </div>
      )}

      {/* GO FOOTER */}
      <div className="go">
        <span>
          {actualCandidateCount} candidat{actualCandidateCount !== 1 ? 's' : ''} ·{' '}
          {competition.totalVotes.toLocaleString('fr-FR')} votes
        </span>
        <span>Voir →</span>
      </div>
    </Link>
  );
};

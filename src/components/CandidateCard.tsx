'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Candidate } from '@/data/mockData';

interface CandidateCardProps {
  candidate: Candidate;
  onVoteClick?: (candidate: Candidate) => void;
  index?: number;
}

export const CandidateCard: React.FC<CandidateCardProps> = ({
  candidate,
  onVoteClick,
}) => {
  const candidateSlug = `${candidate.lastName}${candidate.firstName}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '');

  const candidateUrl = `/competition/${candidate.competitionSlug}/${candidateSlug}`;

  // Check if bio is meaningful (ignore RAS, empty, etc.)
  const hasValidBio =
    candidate.bio &&
    candidate.bio.trim() !== '' &&
    candidate.bio.trim().toUpperCase() !== 'RAS' &&
    candidate.bio.trim().toUpperCase() !== 'NONE';

  return (
    <article className="pc">
      {/* PHOTO WITH RANK BADGE ONLY (NO OVERLAY BUTTONS) */}
      <div className="ph">
        <Link href={candidateUrl} style={{ position: 'absolute', inset: 0, zIndex: 1, display: 'block' }}>
          {candidate.photoUrl ? (
            <Image
              src={candidate.photoUrl}
              alt={`${candidate.firstName} ${candidate.lastName}`}
              fill
              sizes="(max-width: 768px) 100vw, 300px"
              className="object-cover object-top"
            />
          ) : (
            <div
              style={{
                width: '100%',
                height: '100%',
                display: 'grid',
                placeItems: 'center',
                background: 'var(--line)',
                fontWeight: 800,
                fontSize: '1.5rem',
              }}
            >
              {candidate.firstName.charAt(0)}
              {candidate.lastName.charAt(0)}
            </div>
          )}
        </Link>

        {/* RANK BADGE ONLY */}
        <em className={candidate.rank === 1 ? 'one' : ''}>
          {candidate.rank === 1 ? '🥇 1ère place' : `${candidate.rank}e place`}
        </em>
      </div>

      {/* CANDIDATE INFO & LINK */}
      <Link href={candidateUrl} style={{ textDecoration: 'none', color: 'inherit' }}>
        <h3 style={{ marginTop: '12px', fontSize: '1.05rem', fontWeight: 700, lineHeight: 1.3 }}>
          {candidate.firstName} {candidate.lastName}{' '}
          <span className="mute" style={{ fontWeight: 500, fontSize: '0.85rem' }}>
            {candidate.candidateNumber} · {candidate.category}
          </span>
        </h3>

        {/* Render bio only if valid */}
        {hasValidBio && <p className="bio">{candidate.bio}</p>}
      </Link>

      {/* VOTES SCORE */}
      <div className="vt" style={{ marginTop: hasValidBio ? '8px' : '6px' }}>
        {candidate.voteCount.toLocaleString('fr-FR')} votes ({candidate.percentage}%)
      </div>

      {/* VOTE BUTTON */}
      <button
        type="button"
        className="btn full"
        onClick={() => onVoteClick && onVoteClick(candidate)}
      >
        Voter · 100 FCFA
      </button>
    </article>
  );
};

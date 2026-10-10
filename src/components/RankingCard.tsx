'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Candidate } from '@/data/mockData';

interface RankingCardProps {
  candidate: Candidate;
  onVoteClick?: (candidate: Candidate) => void;
}

export const RankingCard: React.FC<RankingCardProps> = ({ candidate, onVoteClick }) => {
  const candidateSlug = `${candidate.lastName}${candidate.firstName}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '');

  const candidateUrl = `/competition/${candidate.competitionSlug}/${candidateSlug}`;

  return (
    <div className="rk">
      {/* RANK NUMBER */}
      <div className="n">{candidate.rank}</div>

      {/* AVATAR */}
      <Link href={candidateUrl} className="pa" style={{ textDecoration: 'none', display: 'block' }}>
        {candidate.photoUrl ? (
          <Image
            src={candidate.photoUrl}
            alt={candidate.firstName}
            width={48}
            height={48}
            className="object-cover object-top"
          />
        ) : (
          <div
            style={{
              width: '100%',
              height: '100%',
              display: 'grid',
              placeItems: 'center',
              fontWeight: 700,
              fontSize: '0.9rem',
            }}
          >
            {candidate.firstName.charAt(0)}
          </div>
        )}
      </Link>

      {/* CANDIDATE INFO & GAUGE */}
      <div>
        <Link href={candidateUrl}>
          {candidate.firstName} {candidate.lastName}{' '}
          <span className="mute">{candidate.candidateNumber}</span>
        </Link>
        <div className="m">
          <i style={{ width: `${Math.min(candidate.percentage, 100)}%` }} />
        </div>
        <div className="sm mute">
          {candidate.voteCount.toLocaleString('fr-FR')} votes ({candidate.percentage}%)
        </div>
      </div>

      {/* VOTE BUTTON */}
      {onVoteClick && (
        <button
          type="button"
          className="btn sm"
          onClick={() => onVoteClick(candidate)}
        >
          Voter
        </button>
      )}
    </div>
  );
};

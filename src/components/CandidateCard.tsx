'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { TrendingUp } from 'lucide-react';
import { Candidate } from '@/data/mockData';

interface CandidateCardProps {
  candidate: Candidate;
  onVoteClick?: (candidate: Candidate) => void;
  rank: number;       // 1-based, sorted by voteCount desc
  maxVotes: number;   // top candidate's voteCount for evolution %
}

export const CandidateCard: React.FC<CandidateCardProps> = ({
  candidate,
  onVoteClick,
  rank,
  maxVotes,
}) => {
  const candidateSlug = `${candidate.lastName}${candidate.firstName}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '');

  const candidateUrl = `/competition/${candidate.competitionSlug}/${candidateSlug}`;

  // Evolution: % relative to the top candidate
  const evolution = maxVotes > 0 ? Math.round((candidate.voteCount / maxVotes) * 100) : 0;

  // Name display — truncated
  const displayName = `${candidate.firstName.toUpperCase()} ${candidate.lastName.toUpperCase()}`;
  const truncatedName = displayName.length > 14 ? displayName.slice(0, 13) + '…' : displayName;

  return (
    <article className="pc pcs-card">
      {/* ── PHOTO ZONE ── */}
      <div className="ph">
        <Link href={candidateUrl} style={{ position: 'absolute', inset: 0, zIndex: 1, display: 'block' }}>
          {candidate.photoUrl ? (
            <Image
              src={candidate.photoUrl}
              alt={`${candidate.firstName} ${candidate.lastName}`}
              fill
              sizes="(max-width: 640px) 50vw, 300px"
              className="object-cover object-top"
            />
          ) : (
            <div style={{
              width: '100%', height: '100%', display: 'grid', placeItems: 'center',
              background: 'var(--line)', fontWeight: 900, fontSize: '2rem', color: 'var(--p)',
            }}>
              {candidate.firstName.charAt(0)}{candidate.lastName.charAt(0)}
            </div>
          )}
        </Link>

        {/* N° rank — top left */}
        <em className={rank === 1 ? 'one' : ''} style={{ zIndex: 2 }}>
          N° {rank}
        </em>

        {/* Vote count — top right */}
        <div className="vote-badge" style={{ zIndex: 2 }}>
          <TrendingUp style={{ width: 11, height: 11 }} />
          {candidate.voteCount.toLocaleString('fr-FR')}
        </div>
      </div>

      {/* ── INFO ZONE ── */}
      <div style={{ padding: '10px 10px 12px', display: 'flex', flexDirection: 'column', gap: '7px' }}>

        {/* Name + group */}
        <Link href={candidateUrl} style={{ textDecoration: 'none', color: 'inherit' }}>
          <p style={{ margin: 0, fontWeight: 900, fontSize: '0.9rem', lineHeight: 1.2 }}>
            {truncatedName}
          </p>
        </Link>

        {/* Evolution bar */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
            <span style={{ fontSize: '0.62rem', fontWeight: 700, color: 'var(--mute)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
              Évolution
            </span>
            <span style={{ fontSize: '0.7rem', fontWeight: 900, color: 'var(--p)' }}>
              {evolution}%
            </span>
          </div>
          <div style={{ height: '4px', borderRadius: '99px', background: 'var(--line)', overflow: 'hidden' }}>
            <div style={{
              height: '100%',
              width: `${evolution}%`,
              borderRadius: '99px',
              background: 'var(--p)',
              transition: 'width 0.6s ease',
            }} />
          </div>
        </div>

        {/* VOTER button */}
        <button
          type="button"
          className="btn full"
          onClick={() => onVoteClick && onVoteClick(candidate)}
          style={{ marginTop: '2px', padding: '10px 0' }}
        >
          VOTER
        </button>
      </div>
    </article>
  );
};

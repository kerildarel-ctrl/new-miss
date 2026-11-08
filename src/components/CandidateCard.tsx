'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Zap, TrendingUp } from 'lucide-react';
import { Candidate } from '@/data/mockData';

interface CandidateCardProps {
  candidate: Candidate;
  onVoteClick?: (candidate: Candidate) => void;
  rank: number;           // 1-based rank (sorted by voteCount desc)
  maxVotes: number;       // top candidate's voteCount (for evolution %)
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

  // Rank badge colour: gold for #1, silver for #2, bronze for #3, grey for rest
  const rankColors: Record<number, { bg: string; border: string; text: string }> = {
    1: { bg: 'linear-gradient(135deg,#B8860B,#FFD700)', border: '#FFD700', text: '#1a0e00' },
    2: { bg: 'linear-gradient(135deg,#6b7280,#d1d5db)', border: '#d1d5db', text: '#111' },
    3: { bg: 'linear-gradient(135deg,#92400e,#d97706)', border: '#d97706', text: '#1a0e00' },
  };
  const rankStyle = rankColors[rank] ?? { bg: 'rgba(30,30,50,0.85)', border: 'rgba(255,255,255,0.15)', text: '#fff' };

  // Display name: LASTNAME truncated
  const displayName = `${candidate.firstName.toUpperCase()} ${candidate.lastName.toUpperCase()}`;
  const truncatedName = displayName.length > 14 ? displayName.slice(0, 14) + '…' : displayName;

  return (
    <article
      style={{
        background: '#111118',
        borderRadius: '18px',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        border: '1px solid rgba(255,255,255,0.08)',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        boxShadow: rank === 1 ? '0 0 0 2px #FFD700, 0 8px 32px rgba(255,215,0,0.15)' : '0 4px 20px rgba(0,0,0,0.4)',
      }}
      className="candidate-card-new"
    >
      {/* ── PHOTO ZONE ── */}
      <div style={{ position: 'relative', aspectRatio: '4/5', overflow: 'hidden', background: '#1a1a2e' }}>
        <Link href={candidateUrl} style={{ position: 'absolute', inset: 0, zIndex: 1, display: 'block' }}>
          {candidate.photoUrl ? (
            <Image
              src={candidate.photoUrl}
              alt={`${candidate.firstName} ${candidate.lastName}`}
              fill
              sizes="(max-width: 640px) 50vw, 300px"
              style={{ objectFit: 'cover', objectPosition: 'top' }}
            />
          ) : (
            <div style={{
              width: '100%', height: '100%', display: 'grid', placeItems: 'center',
              background: 'linear-gradient(135deg,#1e1b4b,#312e81)',
              color: '#c7d2fe', fontSize: '2.5rem', fontWeight: 900,
            }}>
              {candidate.firstName.charAt(0)}{candidate.lastName.charAt(0)}
            </div>
          )}
        </Link>

        {/* N° rank badge — top left */}
        <div style={{
          position: 'absolute', top: 10, left: 10, zIndex: 3,
          background: rankStyle.bg,
          border: `1.5px solid ${rankStyle.border}`,
          color: rankStyle.text,
          borderRadius: '8px',
          padding: '3px 9px',
          fontSize: '0.68rem',
          fontWeight: 900,
          letterSpacing: '0.03em',
          boxShadow: '0 2px 10px rgba(0,0,0,0.4)',
        }}>
          N° {rank}
        </div>

        {/* Vote count badge — top right */}
        <div style={{
          position: 'absolute', top: 10, right: 10, zIndex: 3,
          background: 'rgba(10,10,20,0.75)',
          backdropFilter: 'blur(8px)',
          border: '1px solid rgba(255,255,255,0.15)',
          color: '#fff',
          borderRadius: '8px',
          padding: '3px 9px',
          fontSize: '0.68rem',
          fontWeight: 800,
          display: 'flex',
          alignItems: 'center',
          gap: '3px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.4)',
        }}>
          <TrendingUp style={{ width: 11, height: 11, color: '#10b981' }} />
          {candidate.voteCount.toLocaleString('fr-FR')}
        </div>
      </div>

      {/* ── INFO ZONE ── */}
      <div style={{ padding: '12px 12px 14px', display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
        {/* Name */}
        <Link href={candidateUrl} style={{ textDecoration: 'none' }}>
          <p style={{
            margin: 0,
            fontWeight: 900,
            fontSize: '0.95rem',
            color: '#ffffff',
            letterSpacing: '0.02em',
            lineHeight: 1.2,
          }}>
            {truncatedName}
          </p>
          {/* Group / category */}
          <p style={{ margin: '3px 0 0', fontSize: '0.72rem', color: '#94a3b8', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
            {candidate.category}{candidate.candidateNumber ? ` · ${candidate.candidateNumber}` : ''}
          </p>
        </Link>

        {/* Evolution bar */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
            <span style={{ fontSize: '0.65rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Évolution
            </span>
            <span style={{ fontSize: '0.72rem', fontWeight: 900, color: '#FFD700' }}>
              {evolution}%
            </span>
          </div>
          <div style={{ height: '4px', borderRadius: '99px', background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
            <div style={{
              height: '100%',
              width: `${evolution}%`,
              borderRadius: '99px',
              background: rank === 1
                ? 'linear-gradient(90deg,#B8860B,#FFD700)'
                : rank === 2
                  ? 'linear-gradient(90deg,#6b7280,#d1d5db)'
                  : rank === 3
                    ? 'linear-gradient(90deg,#92400e,#d97706)'
                    : 'linear-gradient(90deg,#4B2CE0,#818cf8)',
              transition: 'width 0.6s ease',
            }} />
          </div>
        </div>

        {/* VOTER button */}
        <button
          type="button"
          onClick={() => onVoteClick && onVoteClick(candidate)}
          style={{
            marginTop: '2px',
            width: '100%',
            padding: '11px 0',
            borderRadius: '10px',
            border: 'none',
            background: 'linear-gradient(135deg,#B8860B,#FFD700)',
            color: '#1a0e00',
            fontWeight: 900,
            fontSize: '0.88rem',
            letterSpacing: '0.08em',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            boxShadow: '0 4px 16px rgba(255,215,0,0.25)',
            transition: 'transform 0.15s ease, box-shadow 0.15s ease',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-1px)';
            (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 6px 20px rgba(255,215,0,0.4)';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)';
            (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 4px 16px rgba(255,215,0,0.25)';
          }}
        >
          <Zap style={{ width: 15, height: 15, fill: '#1a0e00' }} />
          VOTER
        </button>
      </div>
    </article>
  );
};

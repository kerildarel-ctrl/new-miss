'use client';

import React, { useState } from 'react';
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
  const [copied, setCopied] = useState(false);

  const candidateSlug = `${candidate.lastName}${candidate.firstName}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '');

  const candidateUrl = `/competition/${candidate.competitionSlug}/${candidateSlug}`;

  const fallbackCopy = (text: string) => {
    try {
      const el = document.createElement('textarea');
      el.value = text;
      el.setAttribute('readonly', '');
      el.style.position = 'absolute';
      el.style.left = '-9999px';
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Ignore
    }
  };

  const handleShare = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (typeof window !== 'undefined') {
      const fullUrl = `${window.location.origin}${candidateUrl}`;
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(fullUrl)
          .then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          })
          .catch(() => fallbackCopy(fullUrl));
      } else {
        fallbackCopy(fullUrl);
      }
    }
  };

  // Check if bio is meaningful (ignore RAS, empty, etc.)
  const hasValidBio =
    candidate.bio &&
    candidate.bio.trim() !== '' &&
    candidate.bio.trim().toUpperCase() !== 'RAS' &&
    candidate.bio.trim().toUpperCase() !== 'NONE';

  return (
    <article className="pc">
      {/* PHOTO WITH SUBTLE GLASS BADGE & SHARE BUTTON */}
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

        {/* RANK BADGE - Sleek & Compact */}
        <em className={candidate.rank === 1 ? 'one' : ''}>
          {candidate.rank === 1 ? '🥇 1ère place' : `${candidate.rank}e place`}
        </em>

        {/* SHARE BUTTON - Subtle Glass Icon */}
        <button
          type="button"
          className="shr"
          onClick={handleShare}
          title={copied ? 'Lien copié !' : 'Partager le profil'}
          aria-label={`Partager le profil de ${candidate.firstName}`}
        >
          {copied ? (
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#10b981"
              strokeWidth="2.5"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          ) : (
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
            >
              <circle cx="18" cy="5" r="3" />
              <circle cx="6" cy="12" r="3" />
              <circle cx="18" cy="19" r="3" />
              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
              <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
            </svg>
          )}
        </button>
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

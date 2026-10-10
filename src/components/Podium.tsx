'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Candidate } from '@/data/mockData';

interface PodiumProps {
  candidates: Candidate[];
  onVoteClick?: (candidate: Candidate) => void;
}

export const Podium: React.FC<PodiumProps> = ({ candidates, onVoteClick }) => {
  const first = candidates.find((c) => c.rank === 1) || candidates[0];
  const second = candidates.find((c) => c.rank === 2) || candidates[1];
  const third = candidates.find((c) => c.rank === 3) || candidates[2];

  const getCandidateUrl = (cand: Candidate) => {
    const slug = `${cand.lastName}${cand.firstName}`.toLowerCase().replace(/[^a-z0-9]+/g, '');
    return `/competition/${cand.competitionSlug}/${slug}`;
  };

  if (!first) return null;

  return (
    <div style={{ margin: '28px 0 36px' }}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '12px',
          alignItems: 'end',
          maxWidth: '680px',
          margin: '0 auto',
        }}
      >
        {/* 2ND PLACE */}
        {second && (
          <div style={{ textAlign: 'center' }}>
            <Link href={getCandidateUrl(second)} style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
              <div
                className="pa"
                style={{
                  width: '72px',
                  height: '72px',
                  margin: '0 auto 8px',
                  border: '3px solid var(--p)',
                }}
              >
                {second.photoUrl && (
                  <Image
                    src={second.photoUrl}
                    alt={second.firstName}
                    width={72}
                    height={72}
                    className="object-cover object-top"
                  />
                )}
              </div>
              <div style={{ fontWeight: 700, fontSize: '0.92rem' }}>
                {second.firstName} {second.lastName}
              </div>
            </Link>
            <div className="sm mute">{second.voteCount.toLocaleString('fr-FR')} votes</div>
            <div
              style={{
                background: 'var(--soft)',
                borderTop: '3px solid var(--p)',
                borderRadius: '16px 16px 0 0',
                padding: '20px 8px 12px',
                marginTop: '10px',
              }}
            >
              <b style={{ fontSize: '1.8rem', color: 'var(--p)' }}>2</b>
              {onVoteClick && (
                <div style={{ marginTop: '8px' }}>
                  <button
                    type="button"
                    className="btn sm line"
                    style={{ padding: '4px 12px', fontSize: '0.8rem' }}
                    onClick={() => onVoteClick(second)}
                  >
                    Voter
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 1ST PLACE */}
        {first && (
          <div style={{ textAlign: 'center' }}>
            <Link href={getCandidateUrl(first)} style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
              <div
                className="pa"
                style={{
                  width: '92px',
                  height: '92px',
                  margin: '0 auto 8px',
                  border: '4px solid var(--a)',
                  boxShadow: '0 8px 24px rgba(255, 90, 126, 0.35)',
                }}
              >
                {first.photoUrl && (
                  <Image
                    src={first.photoUrl}
                    alt={first.firstName}
                    width={92}
                    height={92}
                    className="object-cover object-top"
                  />
                )}
              </div>
              <div style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--ink)' }}>
                👑 {first.firstName} {first.lastName}
              </div>
            </Link>
            <div
              className="sm"
              style={{ color: 'var(--a)', fontWeight: 700 }}
            >
              {first.voteCount.toLocaleString('fr-FR')} votes
            </div>
            <div
              style={{
                background: 'var(--soft)',
                borderTop: '4px solid var(--a)',
                borderRadius: '18px 18px 0 0',
                padding: '36px 8px 14px',
                marginTop: '10px',
              }}
            >
              <b style={{ fontSize: '2.4rem', color: 'var(--a)' }}>1</b>
              {onVoteClick && (
                <div style={{ marginTop: '10px' }}>
                  <button
                    type="button"
                    className="btn sm"
                    style={{ background: 'var(--a)', color: '#fff', padding: '6px 16px' }}
                    onClick={() => onVoteClick(first)}
                  >
                    Voter 1er
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 3RD PLACE */}
        {third && (
          <div style={{ textAlign: 'center' }}>
            <Link href={getCandidateUrl(third)} style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
              <div
                className="pa"
                style={{
                  width: '64px',
                  height: '64px',
                  margin: '0 auto 8px',
                  border: '3px solid var(--mute)',
                }}
              >
                {third.photoUrl && (
                  <Image
                    src={third.photoUrl}
                    alt={third.firstName}
                    width={64}
                    height={64}
                    className="object-cover object-top"
                  />
                )}
              </div>
              <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>
                {third.firstName} {third.lastName}
              </div>
            </Link>
            <div className="sm mute">{third.voteCount.toLocaleString('fr-FR')} votes</div>
            <div
              style={{
                background: 'var(--soft)',
                borderTop: '3px solid var(--mute)',
                borderRadius: '14px 14px 0 0',
                padding: '14px 8px 10px',
                marginTop: '10px',
              }}
            >
              <b style={{ fontSize: '1.5rem', color: 'var(--mute)' }}>3</b>
              {onVoteClick && (
                <div style={{ marginTop: '6px' }}>
                  <button
                    type="button"
                    className="btn sm line"
                    style={{ padding: '4px 12px', fontSize: '0.8rem' }}
                    onClick={() => onVoteClick(third)}
                  >
                    Voter
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

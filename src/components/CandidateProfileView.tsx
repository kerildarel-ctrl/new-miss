'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { VoteModal } from '@/components/VoteModal';
import { Candidate, Competition } from '@/data/mockData';

interface CandidateProfileViewProps {
  candidate: Candidate;
  competition: Competition | null;
  onConfirmVote: (candidateId: string, count?: number) => Promise<void> | void;
  paymentNotice?: {
    type: 'success' | 'info' | 'error';
    title: string;
    message: string;
  } | null;
  onClosePaymentNotice?: () => void;
}

export function CandidateProfileView({
  candidate,
  competition,
  onConfirmVote,
  paymentNotice,
  onClosePaymentNotice,
}: CandidateProfileViewProps) {
  const [isVoteModalOpen, setIsVoteModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [profileUrl, setProfileUrl] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setProfileUrl(window.location.href);
    }
  }, []);

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
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Ignore
    }
  };

  const handleCopyLink = () => {
    if (typeof window !== 'undefined' && profileUrl) {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(profileUrl)
          .then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2500);
          })
          .catch(() => fallbackCopy(profileUrl));
      } else {
        fallbackCopy(profileUrl);
      }
    }
  };

  // Clean bio logic so raw "RAS" or empty text never shows ugly
  const cleanBio =
    !candidate.bio || candidate.bio.trim().toUpperCase() === 'RAS' || candidate.bio.length < 4
      ? `Candidat(e) officiel(le) pour ${competition?.title || 'la compétition'}. Soutenez ${candidate.firstName} ${candidate.lastName} dès aujourd'hui en votant !`
      : candidate.bio;

  // QR Code generation URL
  const qrCodeImageUrl = profileUrl
    ? `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(
        profileUrl
      )}`
    : '';

  const candidateNumberClean = candidate.candidateNumber.replace('#', '');
  const rankLabel = candidate.rank === 1 ? '1er' : `${candidate.rank}e`;
  const votePercentage = Math.min(100, Math.max(5, candidate.percentage || 15));

  return (
    <div className="cp-profile-container">
      {/* PAYMENT NOTIFICATION BANNER */}
      {paymentNotice && (
        <div className="cp-payment-notice">
          <div>
            <strong>{paymentNotice.title}</strong>
            <span className="sm mute">{paymentNotice.message}</span>
          </div>
          {onClosePaymentNotice && (
            <button
              type="button"
              className="btn sm line"
              onClick={onClosePaymentNotice}
            >
              Fermer
            </button>
          )}
        </div>
      )}

      {/* BREADCRUMB */}
      {competition && (
        <div className="cp-breadcrumb-wrapper">
          <Link href={`/competition/${competition.slug}`} className="crumb">
            ‹ Retour à {competition.title}
          </Link>
        </div>
      )}

      {/* CARD CONTAINER ENCLOSING THE PROFILE */}
      <div className="cp-card-wrapper">
        <div className="cp-profile-grid">
          {/* LEFT COLUMN: PHOTO & QR CODE CARD */}
          <div className="cp-photo-col">
            <a
              href={profileUrl || '#'}
              title="Ouvrir le lien du profil"
              style={{ display: 'block', width: '100%', cursor: 'pointer' }}
            >
              <div className="cp-photo-wrapper">
                <Image
                  src={candidate.photoUrl}
                  alt={`${candidate.firstName} ${candidate.lastName}`}
                  fill
                  priority
                  sizes="(max-width: 768px) 100vw, 420px"
                  style={{ objectFit: 'cover', objectPosition: 'top' }}
                />
                <span className="cp-rank-badge">{rankLabel}</span>
              </div>
            </a>

            {/* QR CODE SIDE BOX UNDER PHOTO */}
            <div className="cp-qr-side-box">
              <span className="cp-section-label" style={{ fontSize: '0.92rem' }}>
                📱 QR code du profil
              </span>
              <div className="cp-qr-card">
                {qrCodeImageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={qrCodeImageUrl}
                    alt={`QR Code pour le profil de ${candidate.firstName} ${candidate.lastName}`}
                    width={150}
                    height={150}
                    style={{ display: 'block', borderRadius: '4px' }}
                  />
                ) : (
                  <div style={{ width: 150, height: 150, background: '#f0f0f0' }} />
                )}
              </div>
              <p className="cp-qr-instruction">
                Imprimez-le sur vos affiches : il ouvre directement ce profil.
              </p>
            </div>
          </div>

          {/* RIGHT COLUMN: DETAILS & VOTER ACTION */}
          <div className="cp-info-col">
            {/* NAME */}
            <h1 className="cp-name">
              {candidate.firstName} <span className="cp-name-highlight">{candidate.lastName}</span>
            </h1>

            {/* SUBTITLE & STATUS */}
            <div className="cp-subtitle">
              <span>Candidat n°{candidateNumberClean}</span>
              <span className="cp-dot-sep">•</span>
              <span>{competition?.title || 'Compétition'}</span>
              <span className="cp-dot-sep">•</span>
              <span className="cp-status-pill">
                <i className="cp-status-pulse" />
                En Cours
              </span>
            </div>

            {/* TIMER BADGE */}
            <div className="cp-timer-badge">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              <span>Se termine dans 20 j 00 h 06 min</span>
            </div>

            {/* BIO / DESCRIPTION */}
            <p className="cp-bio">{cleanBio}</p>

            {/* VOTE COUNT & PROGRESS BAR */}
            <div className="cp-vote-box">
              <div className="cp-vote-display">
                <span className="cp-vote-number">
                  {candidate.voteCount.toLocaleString('fr-FR')}
                </span>
                <span className="cp-vote-label">
                  votes enregistrés ({candidate.percentage || 0}% · Rang #{candidate.rank})
                </span>
              </div>
              <div className="cp-progress-track">
                <div
                  className="cp-progress-fill"
                  style={{ width: `${votePercentage}%` }}
                />
              </div>
            </div>

            {/* DIVIDER LINE */}
            <div className="cp-divider" />

            {/* LIEN DU PROFIL */}
            <div className="cp-section">
              <label className="cp-section-label">Lien du profil</label>
              <div className="cp-link-box">
                <input
                  type="text"
                  readOnly
                  value={profileUrl}
                  className="cp-link-input"
                />
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="cp-copy-btn"
                >
                  {copied ? '✓ Copié !' : 'Copier'}
                </button>
              </div>
            </div>

            {/* MAIN VOTE BUTTON */}
            <button
              type="button"
              className="cp-voter-btn"
              onClick={() => setIsVoteModalOpen(true)}
            >
              Voter pour ce candidat · 100 FCFA / vote
            </button>
          </div>
        </div>
      </div>

      {/* VOTE MODAL */}
      <VoteModal
        isOpen={isVoteModalOpen}
        candidate={candidate}
        onClose={() => setIsVoteModalOpen(false)}
        onConfirmVote={onConfirmVote}
      />
    </div>
  );
}

'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { VoteModal } from '@/components/VoteModal';
import { Candidate, Competition } from '@/data/mockData';
import { useLanguage } from '@/context/LanguageContext';

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
  const { t } = useLanguage();
  const [isVoteModalOpen, setIsVoteModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [profileUrl, setProfileUrl] = useState('');
  const [showQrCode, setShowQrCode] = useState(false);

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
    ? `https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodeURIComponent(
        profileUrl
      )}`
    : '';

  const candidateNumberClean = candidate.candidateNumber.replace('#', '');
  const rankLabel = candidate.rank === 1 ? '1er' : `${candidate.rank}e`;
  const votePercentage = Math.min(100, Math.max(5, candidate.percentage || 15));

  const shareWhatsApp = () => {
    if (typeof window !== 'undefined') {
      const text = `Soutenez et votez pour ${candidate.firstName} ${candidate.lastName} (#${candidateNumberClean}) dans ${competition?.title || 'la compétition'} ! 👉 ${profileUrl}`;
      window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
    }
  };

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
              {t('btn.close', 'Fermer')}
            </button>
          )}
        </div>
      )}

      {/* BREADCRUMB */}
      {competition && (
        <div className="cp-breadcrumb-wrapper">
          <Link href={`/competition/${competition.slug}`} className="crumb">
            {t('profile.back', '‹ Retour à')} {competition.title}
          </Link>
        </div>
      )}

      {/* CARD CONTAINER ENCLOSING THE PROFILE */}
      <div className="cp-card-wrapper">
        <div className="cp-profile-grid">
          {/* LEFT COLUMN: PHOTO SEULEMENT (CLEAN & PRESTIGIEUX) */}
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
          </div>

          {/* RIGHT COLUMN: DETAILS & VOTER ACTION */}
          <div className="cp-info-col">
            {/* NAME */}
            <h1 className="cp-name">
              {candidate.firstName} <span className="cp-name-highlight">{candidate.lastName}</span>
            </h1>

            {/* SUBTITLE & STATUS */}
            <div className="cp-subtitle">
              <span>{t('profile.category', 'Candidat')} n°{candidateNumberClean}</span>
              <span className="cp-dot-sep">•</span>
              <span>{competition?.title || 'Compétition'}</span>
              <span className="cp-dot-sep">•</span>
              <span className="cp-status-pill">
                <i className="cp-status-pulse" />
                En Cours
              </span>
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
                  {t('profile.votes', 'votes enregistrés')} ({candidate.percentage || 0}% · Rang #{candidate.rank})
                </span>
              </div>
              <div className="cp-progress-track">
                <div
                  className="cp-progress-fill"
                  style={{ width: `${votePercentage}%` }}
                />
              </div>
            </div>

            {/* MAIN VOTE BUTTON - PROMINENT & IMMEDIATE */}
            <button
              type="button"
              className="cp-voter-btn"
              onClick={() => setIsVoteModalOpen(true)}
            >
              <span>⭐</span>
              <span>{t('profile.voteBtn', 'Voter pour ce candidat')} · {competition?.votePrice || 100} FCFA</span>
            </button>

            {/* DIVIDER LINE */}
            <div className="cp-divider" />

            {/* SHARE & QR CODE SECTION */}
            <div style={{ marginTop: '8px' }}>
              <label className="cp-section-label" style={{ display: 'block', marginBottom: '8px' }}>
                🔗 {t('profile.share', 'Partager ce profil')}
              </label>

              {/* ACTION BUTTONS: COPY LINK & TOGGLE QR CODE */}
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={handleCopyLink}
                  style={{
                    flex: '1 1 180px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    padding: '12px 16px',
                    borderRadius: '12px',
                    background: 'var(--soft, rgba(255, 255, 255, 0.08))',
                    border: '1.5px solid var(--line, rgba(255, 255, 255, 0.15))',
                    color: 'var(--ink, #fff)',
                    fontSize: '0.88rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                >
                  <span>{copied ? '✓' : '📋'}</span>
                  <span>{copied ? t('profile.copied', 'Lien copié !') : t('profile.copyLink', 'Copier le lien')}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowQrCode((prev) => !prev)}
                  style={{
                    flex: '1 1 180px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    padding: '12px 16px',
                    borderRadius: '12px',
                    background: showQrCode ? 'rgba(124, 58, 237, 0.2)' : 'var(--soft, rgba(255, 255, 255, 0.08))',
                    border: showQrCode ? '1.5px solid #a78bfa' : '1.5px solid var(--line, rgba(255, 255, 255, 0.15))',
                    color: showQrCode ? '#a78bfa' : 'var(--ink, #fff)',
                    fontSize: '0.88rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                >
                  <span>📱</span>
                  <span>{showQrCode ? t('profile.qrHide', 'Masquer le QR code') : t('profile.qrShow', 'Afficher le QR code')}</span>
                </button>

                <button
                  type="button"
                  onClick={shareWhatsApp}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    padding: '12px 16px',
                    borderRadius: '12px',
                    background: 'rgba(37, 211, 102, 0.12)',
                    border: '1.5px solid rgba(37, 211, 102, 0.3)',
                    color: '#25D366',
                    fontSize: '0.88rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  <span>💬</span>
                  <span>WhatsApp</span>
                </button>
              </div>

              {/* ELEGANT EXPANDABLE QR CODE CARD */}
              {showQrCode && (
                <div
                  style={{
                    marginTop: '16px',
                    padding: '20px',
                    borderRadius: '20px',
                    background: 'var(--card, rgba(17, 24, 39, 0.95))',
                    border: '1.5px solid rgba(124, 58, 237, 0.3)',
                    boxShadow: '0 16px 36px rgba(0, 0, 0, 0.3)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    textAlign: 'center',
                    animation: 'fadeIn 0.25s ease-out',
                  }}
                >
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#a78bfa', fontSize: '0.82rem', fontWeight: 600, marginBottom: '8px' }}>
                    <span>📱</span>
                    <span>{t('profile.qrBadge', 'QR code officiel du profil')}</span>
                  </div>

                  <div
                    style={{
                      padding: '14px',
                      background: '#ffffff',
                      borderRadius: '16px',
                      boxShadow: '0 8px 24px rgba(0, 0, 0, 0.2)',
                      margin: '8px 0',
                    }}
                  >
                    {qrCodeImageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={qrCodeImageUrl}
                        alt={`QR Code ${candidate.firstName} ${candidate.lastName}`}
                        width={180}
                        height={180}
                        style={{ display: 'block', borderRadius: '4px' }}
                      />
                    ) : (
                      <div style={{ width: 180, height: 180, background: '#f3f4f6' }} />
                    )}
                  </div>

                  <p style={{ fontSize: '0.82rem', color: '#9ca3af', maxWidth: '300px', margin: '8px 0 14px', lineHeight: 1.4 }}>
                    {t('profile.qrDesc', 'Scannez avec un téléphone pour ouvrir directement ce profil et voter.')}
                  </p>

                  {qrCodeImageUrl && (
                    <a
                      href={qrCodeImageUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      download={`qrcode-${candidate.firstName}-${candidate.lastName}.png`}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '10px 18px',
                        borderRadius: '999px',
                        background: 'rgba(124, 58, 237, 0.15)',
                        border: '1px solid rgba(124, 58, 237, 0.35)',
                        color: '#a78bfa',
                        fontSize: '0.82rem',
                        fontWeight: 600,
                        textDecoration: 'none',
                      }}
                    >
                      <span>📥</span>
                      <span>{t('profile.qrDownload', 'Télécharger l’image QR')}</span>
                    </a>
                  )}
                </div>
              )}
            </div>
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

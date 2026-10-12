'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { VoteModal } from '@/components/VoteModal';
import { Candidate, Competition } from '@/data/mockData';
import { useLanguage } from '@/context/LanguageContext';
import { getAutoDomain } from '@/utils/domain';

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
      const base = getAutoDomain();
      setProfileUrl(`${base}${window.location.pathname}`);
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
    <div
      className="cp-profile-container"
      style={{
        fontFamily: "var(--font-poppins), 'Poppins', sans-serif",
      }}
    >
      {/* NOTIFICATION DE PAIEMENT ÉVENTUELLE */}
      {paymentNotice && (
        <div
          className="cp-payment-notice"
          style={{
            fontFamily: "var(--font-poppins), 'Poppins', sans-serif",
            borderRadius: '16px',
          }}
        >
          <div>
            <strong>{paymentNotice.title}</strong>
            <span className="sm mute" style={{ marginLeft: '8px' }}>{paymentNotice.message}</span>
          </div>
          {onClosePaymentNotice && (
            <button
              type="button"
              className="btn sm line"
              onClick={onClosePaymentNotice}
              style={{ fontFamily: "var(--font-poppins), 'Poppins', sans-serif" }}
            >
              {t('btn.close', 'Fermer')}
            </button>
          )}
        </div>
      )}

      {/* FIL D'ARIANE / RETOUR COMPÉTITION */}
      {competition && (
        <div className="cp-breadcrumb-wrapper" style={{ marginBottom: '20px' }}>
          <Link
            href={`/competition/${competition.slug}`}
            className="crumb"
            style={{
              fontFamily: "var(--font-poppins), 'Poppins', sans-serif",
              fontSize: '0.92rem',
              fontWeight: 500,
              color: 'var(--mute)',
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            ‹ Retour {competition.title}
          </Link>
        </div>
      )}

      {/* CONTENEUR DE PROFIL ÉPURÉ SANS RECTANGLE / SANS CADRE (STYLE AUTH ADMIN) */}
      <div
        className="cp-card-wrapper"
        style={{
          background: 'transparent',
          border: 'none',
          boxShadow: 'none',
          padding: '0',
          fontFamily: "var(--font-poppins), 'Poppins', sans-serif",
        }}
      >
        <div className="cp-profile-grid">
          {/* COLONNE GAUCHE: PHOTO DU CANDIDAT */}
          <div className="cp-photo-col">
            <a
              href={profileUrl || '#'}
              title="Ouvrir le lien du profil"
              style={{ display: 'block', width: '100%', cursor: 'pointer' }}
            >
              <div
                className="cp-photo-wrapper"
                style={{
                  borderRadius: '24px',
                  border: '1.5px solid var(--line)',
                  boxShadow: '0 16px 36px -12px rgba(0, 0, 0, 0.4)',
                }}
              >
                <Image
                  src={candidate.photoUrl}
                  alt={`${candidate.firstName} ${candidate.lastName}`}
                  fill
                  priority
                  sizes="(max-width: 768px) 100vw, 420px"
                  style={{ objectFit: 'cover', objectPosition: 'top' }}
                />
                <span
                  className="cp-rank-badge"
                  style={{
                    fontFamily: "var(--font-poppins), 'Poppins', sans-serif",
                    fontWeight: 800,
                  }}
                >
                  {rankLabel}
                </span>
              </div>
            </a>
          </div>

          {/* COLONNE DROITE: INFORMATIONS & ACTION DE VOTE */}
          <div className="cp-info-col" style={{ fontFamily: "var(--font-poppins), 'Poppins', sans-serif" }}>
            {/* NOM DU CANDIDAT */}
            <h1
              className="cp-name"
              style={{
                fontFamily: "var(--font-poppins), 'Poppins', sans-serif",
                fontSize: 'clamp(2.2rem, 5vw, 3.8rem)',
                fontWeight: 900,
                letterSpacing: '-0.02em',
                lineHeight: 1.1,
                marginBottom: '8px',
              }}
            >
              {candidate.firstName} <span style={{ color: 'var(--p)' }}>{candidate.lastName}</span>
            </h1>

            {/* SOUS-TITRE & STATUT */}
            <div
              className="cp-subtitle"
              style={{
                fontFamily: "var(--font-poppins), 'Poppins', sans-serif",
                fontSize: '0.92rem',
                color: 'var(--mute)',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                flexWrap: 'wrap',
              }}
            >
              <span>{t('profile.category', 'Catégorie')} n°{candidateNumberClean}</span>
              <span className="cp-dot-sep">•</span>
              <span>{competition?.title || 'Compétition'}</span>
              <span className="cp-dot-sep">•</span>
              <span
                className="cp-status-pill"
                style={{
                  fontFamily: "var(--font-poppins), 'Poppins', sans-serif",
                  fontWeight: 600,
                }}
              >
                <i className="cp-status-pulse" />
                En Cours
              </span>
            </div>

            {/* BIO DU CANDIDAT */}
            <p
              className="cp-bio"
              style={{
                fontFamily: "var(--font-poppins), 'Poppins', sans-serif",
                fontSize: '0.98rem',
                lineHeight: 1.6,
                color: 'var(--ink)',
                opacity: 0.9,
                marginBottom: '24px',
                maxWidth: '680px',
              }}
            >
              {cleanBio}
            </p>

            {/* COMPTEUR DE VOTES & JAUGE */}
            <div className="cp-vote-box" style={{ marginBottom: '22px' }}>
              <div
                className="cp-vote-display"
                style={{
                  fontFamily: "var(--font-poppins), 'Poppins', sans-serif",
                  display: 'flex',
                  alignItems: 'baseline',
                  gap: '10px',
                  marginBottom: '10px',
                }}
              >
                <span
                  className="cp-vote-number"
                  style={{
                    fontFamily: "var(--font-poppins), 'Poppins', sans-serif",
                    fontSize: 'clamp(2.6rem, 5vw, 3.8rem)',
                    fontWeight: 900,
                    lineHeight: 1,
                  }}
                >
                  {candidate.voteCount.toLocaleString('fr-FR')}
                </span>
                <span
                  className="cp-vote-label"
                  style={{
                    fontFamily: "var(--font-poppins), 'Poppins', sans-serif",
                    fontSize: '0.95rem',
                    color: 'var(--mute)',
                    fontWeight: 500,
                  }}
                >
                  votes comptabilisés ({candidate.percentage || 0}% · Rang #{candidate.rank})
                </span>
              </div>
              <div className="cp-progress-track" style={{ height: '6px', maxWidth: '680px' }}>
                <div
                  className="cp-progress-fill"
                  style={{ width: `${votePercentage}%` }}
                />
              </div>
            </div>

            {/* BOUTON VOTER : SANS ÉTOILE, JUSTE "Voter", POLICE POPPINS */}
            <button
              type="button"
              className="btn full cp-voter-btn"
              onClick={() => setIsVoteModalOpen(true)}
              style={{
                marginTop: '16px',
                height: '54px',
                maxWidth: '520px',
                borderRadius: '99px',
                background: 'var(--p)',
                color: '#ffffff',
                fontSize: '1.05rem',
                fontWeight: 700,
                fontFamily: "var(--font-poppins), 'Poppins', sans-serif",
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: 'none',
                boxShadow: '0 10px 28px rgba(91, 61, 245, 0.4)',
                transition: 'transform 0.2s, box-shadow 0.2s',
              }}
            >
              Voter
            </button>

            {/* SÉPARATEUR DISCRET */}
            <div className="cp-divider" style={{ maxWidth: '680px', margin: '24px 0' }} />

            {/* SECTION PARTAGE & QR CODE */}
            <div style={{ marginTop: '4px', maxWidth: '680px' }}>
              <label
                className="cp-section-label"
                style={{
                  display: 'block',
                  marginBottom: '10px',
                  fontFamily: "var(--font-poppins), 'Poppins', sans-serif",
                  fontWeight: 700,
                  fontSize: '0.95rem',
                  color: 'var(--ink)',
                }}
              >
                🔗 {t('profile.share', 'Partager ce profil')}
              </label>

              {/* BOUTONS D'ACTION */}
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
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1.5px solid var(--line)',
                    color: 'var(--ink)',
                    fontSize: '0.88rem',
                    fontWeight: 600,
                    fontFamily: "var(--font-poppins), 'Poppins', sans-serif",
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
                    background: showQrCode ? 'rgba(91, 61, 245, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                    border: showQrCode ? '1.5px solid var(--p)' : '1.5px solid var(--line)',
                    color: showQrCode ? 'var(--p)' : 'var(--ink)',
                    fontSize: '0.88rem',
                    fontWeight: 600,
                    fontFamily: "var(--font-poppins), 'Poppins', sans-serif",
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
                    fontFamily: "var(--font-poppins), 'Poppins', sans-serif",
                    cursor: 'pointer',
                  }}
                >
                  <span>💬</span>
                  <span>WhatsApp</span>
                </button>
              </div>

              {/* QR CODE SÉCURISÉ */}
              {showQrCode && (
                <div
                  style={{
                    marginTop: '16px',
                    padding: '20px',
                    borderRadius: '20px',
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1.5px solid var(--line)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    textAlign: 'center',
                    animation: 'fadeIn 0.25s ease-out',
                    fontFamily: "var(--font-poppins), 'Poppins', sans-serif",
                  }}
                >
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--p)', fontSize: '0.82rem', fontWeight: 600, marginBottom: '8px' }}>
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

                  <p style={{ fontSize: '0.82rem', color: 'var(--mute)', maxWidth: '300px', margin: '8px 0 14px', lineHeight: 1.4 }}>
                    {t('profile.qrDesc', 'Scannez avec un téléphone pour ouvrir directement ce profil et voter.')}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* MODALE DE VOTE */}
      <VoteModal
        isOpen={isVoteModalOpen}
        candidate={candidate}
        onClose={() => setIsVoteModalOpen(false)}
        onConfirmVote={onConfirmVote}
      />
    </div>
  );
}

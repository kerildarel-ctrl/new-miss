'use client';

import React, { useState } from 'react';
import { saveEventRequest } from '@/services/dbService';
import { useLanguage } from '@/context/LanguageContext';

interface CreateEventModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CreateEventModal: React.FC<CreateEventModalProps> = ({ isOpen, onClose }) => {
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    eventName: '',
    organizerName: '',
    phone: '',
    email: '',
    votePrice: '100',
    candidateEstimate: '10',
    campus: '',
    startDate: '',
    endDate: '',
    description: '',
  });

  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // 1. Save in storage
    await saveEventRequest(formData);

    // 2. Build WhatsApp Message
    const waText =
      `Bonjour MISS MISTER, nouvelle demande de création d'élection :\n\n` +
      `🏆 Élection : ${formData.eventName}\n` +
      `🏛️ Établissement/Campus : ${formData.campus || 'Non spécifié'}\n` +
      `👤 Responsable : ${formData.organizerName || 'Organisateur'}\n` +
      `📞 WhatsApp : ${formData.phone}\n` +
      `✉️ Email : ${formData.email || 'Non spécifié'}\n` +
      `💵 Prix du vote : ${formData.votePrice || '100'} FCFA\n` +
      `👥 Candidats prévus : ${formData.candidateEstimate || '10'}`;

    const waUrl = `https://wa.me/237692886326?text=${encodeURIComponent(waText)}`;

    // 3. Open WhatsApp in new window
    if (typeof window !== 'undefined') {
      window.open(waUrl, '_blank');
    }

    setIsSubmitting(false);
    setIsSubmitted(true);
  };

  const handleReset = () => {
    setIsSubmitted(false);
    setFormData({
      eventName: '',
      organizerName: '',
      phone: '',
      email: '',
      votePrice: '100',
      candidateEstimate: '10',
      campus: '',
      startDate: '',
      endDate: '',
      description: '',
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        display: 'grid',
        placeItems: 'center',
        background: 'rgba(11, 15, 25, 0.75)',
        backdropFilter: 'blur(10px)',
        padding: '16px',
        overflowY: 'auto',
      }}
      onClick={handleReset}
    >
      <div
        style={{
          margin: 'auto',
          position: 'relative',
          width: '100%',
          maxWidth: '480px',
          background: 'var(--card, #111827)',
          color: 'var(--ink, #f9fafb)',
          borderRadius: '24px',
          padding: '24px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.5), 0 0 40px rgba(124, 58, 237, 0.15)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* CLOSE BUTTON */}
        <button
          type="button"
          onClick={handleReset}
          aria-label="Fermer la fenêtre"
          style={{
            position: 'absolute',
            top: '18px',
            right: '18px',
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.08)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            color: 'var(--ink, #fff)',
            display: 'grid',
            placeItems: 'center',
            cursor: 'pointer',
            fontSize: '1rem',
            transition: 'all 0.2s',
          }}
        >
          ✕
        </button>

        {!isSubmitted ? (
          <>
            {/* BADGE */}
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(124, 58, 237, 0.15)', color: '#a78bfa', padding: '4px 10px', borderRadius: '999px', fontSize: '0.78rem', fontWeight: 600 }}>
              <span>🏆</span>
              <span>{t('create.badge', 'Organisateurs')}</span>
            </div>

            <h2 style={{ marginTop: '8px', fontSize: '1.4rem', fontWeight: 700, lineHeight: 1.25 }}>
              {t('create.title', 'Créer une compétition')}
            </h2>
            <p style={{ marginTop: '4px', fontSize: '0.82rem', color: '#9ca3af', lineHeight: 1.4 }}>
              {t('create.desc', 'Remplissez les informations de base. Notre équipe configure votre vote en 24h ouvrées.')}
            </p>

            <form onSubmit={handleSubmit} style={{ marginTop: '18px' }}>
              {/* ELECTION NAME */}
              <label
                htmlFor="ceNom"
                style={{ display: 'block', fontSize: '0.84rem', fontWeight: 600, color: '#d1d5db' }}
              >
                {t('create.name', 'Nom de l’élection')}
              </label>
              <input
                type="text"
                id="ceNom"
                required
                placeholder="ex. Miss & Mister FMSB 2026"
                value={formData.eventName}
                onChange={(e) => setFormData({ ...formData, eventName: e.target.value })}
                style={{
                  width: '100%',
                  marginTop: '6px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1.5px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: '14px',
                  padding: '12px 14px',
                  color: '#fff',
                  fontSize: '0.92rem',
                  outline: 'none',
                }}
              />

              {/* CAMPUS / VILLE */}
              <label
                htmlFor="ceCampus"
                style={{ display: 'block', marginTop: '14px', fontSize: '0.84rem', fontWeight: 600, color: '#d1d5db' }}
              >
                {t('create.campus', 'Établissement / Ville')}
              </label>
              <input
                type="text"
                id="ceCampus"
                required
                placeholder="ex. Université de Yaoundé I"
                value={formData.campus}
                onChange={(e) => setFormData({ ...formData, campus: e.target.value })}
                style={{
                  width: '100%',
                  marginTop: '6px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1.5px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: '14px',
                  padding: '12px 14px',
                  color: '#fff',
                  fontSize: '0.92rem',
                  outline: 'none',
                }}
              />

              {/* WHATSAPP NUMBER */}
              <label
                htmlFor="ceContact"
                style={{ display: 'block', marginTop: '14px', fontSize: '0.84rem', fontWeight: 600, color: '#d1d5db' }}
              >
                {t('create.phone', 'Numéro WhatsApp de l’organisateur')}
              </label>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginTop: '6px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1.5px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: '14px',
                  padding: '0 12px',
                }}
              >
                <span style={{ fontSize: '0.85rem', color: '#a78bfa', fontWeight: 600 }}>🇨🇲 +237</span>
                <input
                  type="tel"
                  id="ceContact"
                  required
                  placeholder="6XX XXX XXX"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  style={{
                    flex: 1,
                    background: 'transparent',
                    border: 'none',
                    color: '#fff',
                    padding: '12px 0',
                    fontSize: '0.92rem',
                    outline: 'none',
                  }}
                />
              </div>

              {/* PRICE */}
              <label
                htmlFor="cePrix"
                style={{ display: 'block', marginTop: '14px', fontSize: '0.84rem', fontWeight: 600, color: '#d1d5db' }}
              >
                {t('create.price', 'Prix unitaire du vote (FCFA)')}
              </label>
              <input
                type="number"
                id="cePrix"
                min="50"
                step="50"
                value={formData.votePrice}
                onChange={(e) => setFormData({ ...formData, votePrice: e.target.value })}
                style={{
                  width: '100%',
                  marginTop: '6px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1.5px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: '14px',
                  padding: '12px 14px',
                  color: '#fff',
                  fontSize: '0.92rem',
                  outline: 'none',
                }}
              />

              {/* SUBMIT BUTTON */}
              <button
                type="submit"
                disabled={isSubmitting}
                style={{
                  width: '100%',
                  marginTop: '22px',
                  padding: '15px 20px',
                  borderRadius: '16px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)',
                  color: '#fff',
                  fontSize: '1rem',
                  fontWeight: 700,
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 10px 25px rgba(37, 211, 102, 0.35)',
                  transition: 'all 0.2s',
                  opacity: isSubmitting ? 0.7 : 1,
                }}
              >
                <span>💬</span>
                <span>{isSubmitting ? 'Envoi en cours...' : t('create.submit', 'Envoyer la demande sur WhatsApp')}</span>
              </button>
            </form>

            <p style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '12px', textAlign: 'center', lineHeight: 1.4 }}>
              {t('create.footer', 'Activation rapide sans frais fixes. Reversement direct via Mobile Money.')}
            </p>
          </>
        ) : (
          <div style={{ textAlign: 'center', padding: '24px 0' }}>
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: 'rgba(16, 185, 129, 0.15)',
                color: '#10b981',
                display: 'grid',
                placeItems: 'center',
                margin: '0 auto 16px',
                fontSize: '2rem',
                border: '1px solid rgba(16, 185, 129, 0.3)',
              }}
            >
              ✓
            </div>
            <p style={{ color: '#10b981', fontWeight: 700, fontSize: '0.88rem' }}>Demande enregistrée</p>
            <h2 style={{ marginTop: '6px', fontSize: '1.35rem' }}>Merci pour votre initiative !</h2>
            <p style={{ color: '#9ca3af', marginTop: '8px', fontSize: '0.88rem', lineHeight: 1.5 }}>
              Votre demande pour <b style={{ color: '#fff' }}>&quot;{formData.eventName}&quot;</b> a été transmise. Un conseiller
              vous contactera sous 24h sur WhatsApp pour finaliser l&apos;ouverture.
            </p>
            <button
              type="button"
              onClick={handleReset}
              style={{
                width: '100%',
                marginTop: '24px',
                padding: '14px',
                borderRadius: '16px',
                border: 'none',
                background: 'linear-gradient(135deg, #7c3aed 0%, #6366f1 100%)',
                color: '#fff',
                fontSize: '0.95rem',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Fermer
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

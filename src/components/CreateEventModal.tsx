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
        background: 'rgba(10, 14, 26, 0.82)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
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
          maxWidth: '460px',
          background: '#161c2d',
          color: '#ffffff',
          borderRadius: '24px',
          padding: '24px 22px',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.6), 0 0 35px rgba(124, 58, 237, 0.2)',
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
            background: 'rgba(255, 255, 255, 0.1)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            color: '#ffffff',
            display: 'grid',
            placeItems: 'center',
            cursor: 'pointer',
            fontSize: '1.1rem',
            fontWeight: 700,
            transition: 'all 0.2s',
          }}
        >
          ✕
        </button>

        {!isSubmitted ? (
          <>
            {/* BADGE */}
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(139, 92, 246, 0.2)', color: '#c084fc', padding: '4px 12px', borderRadius: '999px', fontSize: '0.8rem', fontWeight: 600 }}>
              <span>🏆</span>
              <span>{t('create.badge', 'Organisateurs')}</span>
            </div>

            <h2 style={{ marginTop: '10px', fontSize: '1.4rem', fontWeight: 800, color: '#ffffff', lineHeight: 1.25 }}>
              {t('create.title', 'Créer une compétition')}
            </h2>
            <p style={{ marginTop: '4px', fontSize: '0.85rem', color: '#94a3b8', lineHeight: 1.45, fontWeight: 500 }}>
              {t('create.desc', 'Remplissez les informations de base. Notre équipe configure votre vote en 24h ouvrées.')}
            </p>

            <form onSubmit={handleSubmit} style={{ marginTop: '18px' }}>
              {/* ELECTION NAME */}
              <label
                htmlFor="ceNom"
                style={{ display: 'block', fontSize: '0.88rem', fontWeight: 700, color: '#f1f5f9' }}
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
                  marginTop: '8px',
                  background: 'rgba(15, 23, 42, 0.7)',
                  border: '1.5px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '14px',
                  padding: '14px 16px',
                  color: '#ffffff',
                  fontSize: '0.95rem',
                  fontWeight: 600,
                  outline: 'none',
                }}
              />

              {/* CAMPUS / VILLE */}
              <label
                htmlFor="ceCampus"
                style={{ display: 'block', marginTop: '16px', fontSize: '0.88rem', fontWeight: 700, color: '#f1f5f9' }}
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
                  marginTop: '8px',
                  background: 'rgba(15, 23, 42, 0.7)',
                  border: '1.5px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '14px',
                  padding: '14px 16px',
                  color: '#ffffff',
                  fontSize: '0.95rem',
                  fontWeight: 600,
                  outline: 'none',
                }}
              />

              {/* WHATSAPP NUMBER */}
              <label
                htmlFor="ceContact"
                style={{ display: 'block', marginTop: '16px', fontSize: '0.88rem', fontWeight: 700, color: '#f1f5f9' }}
              >
                {t('create.phone', 'Numéro WhatsApp de l’organisateur')}
              </label>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  marginTop: '8px',
                  background: 'rgba(15, 23, 42, 0.7)',
                  border: '1.5px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '14px',
                  padding: '0 14px',
                }}
              >
                <span style={{ fontSize: '0.9rem', color: '#c084fc', fontWeight: 700 }}>🇨🇲 +237</span>
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
                    color: '#ffffff',
                    padding: '14px 0',
                    fontSize: '0.95rem',
                    fontWeight: 600,
                    outline: 'none',
                  }}
                />
              </div>

              {/* PRICE */}
              <label
                htmlFor="cePrix"
                style={{ display: 'block', marginTop: '16px', fontSize: '0.88rem', fontWeight: 700, color: '#f1f5f9' }}
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
                  marginTop: '8px',
                  background: 'rgba(15, 23, 42, 0.7)',
                  border: '1.5px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '14px',
                  padding: '14px 16px',
                  color: '#ffffff',
                  fontSize: '0.95rem',
                  fontWeight: 600,
                  outline: 'none',
                }}
              />

              {/* SUBMIT BUTTON */}
              <button
                type="submit"
                disabled={isSubmitting}
                style={{
                  width: '100%',
                  marginTop: '24px',
                  padding: '16px 20px',
                  borderRadius: '16px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)',
                  color: '#ffffff',
                  fontSize: '1.05rem',
                  fontWeight: 800,
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px',
                  boxShadow: '0 10px 25px rgba(37, 211, 102, 0.35)',
                  transition: 'all 0.2s ease',
                  opacity: isSubmitting ? 0.7 : 1,
                }}
              >
                <span>💬</span>
                <span>{isSubmitting ? 'Envoi en cours...' : t('create.submit', 'Envoyer la demande sur WhatsApp')}</span>
              </button>
            </form>

            <p style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '14px', textAlign: 'center', lineHeight: 1.4, fontWeight: 500 }}>
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
                background: 'rgba(16, 185, 129, 0.2)',
                color: '#10b981',
                display: 'grid',
                placeItems: 'center',
                margin: '0 auto 16px',
                fontSize: '2.2rem',
                border: '1.5px solid rgba(16, 185, 129, 0.4)',
              }}
            >
              ✓
            </div>
            <p style={{ color: '#10b981', fontWeight: 800, fontSize: '0.92rem' }}>Demande enregistrée</p>
            <h2 style={{ marginTop: '6px', fontSize: '1.4rem', fontWeight: 800, color: '#ffffff' }}>Merci pour votre initiative !</h2>
            <p style={{ color: '#cbd5e1', marginTop: '10px', fontSize: '0.9rem', lineHeight: 1.5 }}>
              Votre demande pour <b style={{ color: '#ffffff' }}>&quot;{formData.eventName}&quot;</b> a été transmise. Un conseiller
              vous contactera sous 24h sur WhatsApp pour finaliser l&apos;ouverture.
            </p>
            <button
              type="button"
              onClick={handleReset}
              style={{
                width: '100%',
                marginTop: '24px',
                padding: '15px',
                borderRadius: '16px',
                border: 'none',
                background: 'linear-gradient(135deg, #7c3aed 0%, #6366f1 100%)',
                color: '#ffffff',
                fontSize: '1rem',
                fontWeight: 800,
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

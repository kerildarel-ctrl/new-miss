'use client';

import React, { useState } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { saveEventRequest } from '@/services/dbService';
import { useLanguage } from '@/context/LanguageContext';

export default function CreerEvenementPage() {
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

    await saveEventRequest(formData);

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

    if (typeof window !== 'undefined') {
      window.open(waUrl, '_blank');
    }

    setIsSubmitting(false);
    setIsSubmitted(true);
  };

  return (
    <>
      <Header />
      <main className="wd" style={{ padding: '40px 16px 80px', maxWidth: '640px', margin: '0 auto' }}>
        <div
          style={{
            background: 'var(--card, #111827)',
            borderRadius: '24px',
            padding: '32px 24px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.4)',
          }}
        >
          {!isSubmitted ? (
            <>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(124, 58, 237, 0.15)', color: '#a78bfa', padding: '4px 12px', borderRadius: '999px', fontSize: '0.82rem', fontWeight: 600 }}>
                <span>🏆</span>
                <span>{t('create.badge', 'Organisateurs')}</span>
              </div>

              <h1 style={{ marginTop: '12px', fontSize: '1.8rem', fontWeight: 800 }}>
                {t('create.title', 'Créer une compétition')}
              </h1>
              <p style={{ marginTop: '6px', color: '#9ca3af', fontSize: '0.9rem', lineHeight: 1.5 }}>
                {t('create.desc', 'Remplissez les informations de base. Notre équipe configure votre vote en 24h ouvrées.')}
              </p>

              <form onSubmit={handleSubmit} style={{ marginTop: '24px' }}>
                <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 600, color: '#d1d5db' }}>
                  {t('create.name', 'Nom de l’élection')}
                </label>
                <input
                  type="text"
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
                    fontSize: '0.95rem',
                    outline: 'none',
                  }}
                />

                <label style={{ display: 'block', marginTop: '16px', fontSize: '0.88rem', fontWeight: 600, color: '#d1d5db' }}>
                  {t('create.campus', 'Établissement / Ville')}
                </label>
                <input
                  type="text"
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
                    fontSize: '0.95rem',
                    outline: 'none',
                  }}
                />

                <label style={{ display: 'block', marginTop: '16px', fontSize: '0.88rem', fontWeight: 600, color: '#d1d5db' }}>
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
                      fontSize: '0.95rem',
                      outline: 'none',
                    }}
                  />
                </div>

                <label style={{ display: 'block', marginTop: '16px', fontSize: '0.88rem', fontWeight: 600, color: '#d1d5db' }}>
                  {t('create.price', 'Prix unitaire du vote (FCFA)')}
                </label>
                <input
                  type="number"
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
                    fontSize: '0.95rem',
                    outline: 'none',
                  }}
                />

                <button
                  type="submit"
                  disabled={isSubmitting}
                  style={{
                    width: '100%',
                    marginTop: '26px',
                    padding: '16px 20px',
                    borderRadius: '16px',
                    border: 'none',
                    background: 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)',
                    color: '#fff',
                    fontSize: '1.05rem',
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

              <p style={{ fontSize: '0.8rem', color: '#9ca3af', marginTop: '14px', textAlign: 'center', lineHeight: 1.4 }}>
                {t('create.footer', 'Activation rapide sans frais fixes. Reversement direct via Mobile Money.')}
              </p>
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: '32px 0' }}>
              <div
                style={{
                  width: '72px',
                  height: '72px',
                  borderRadius: '50%',
                  background: 'rgba(16, 185, 129, 0.15)',
                  color: '#10b981',
                  display: 'grid',
                  placeItems: 'center',
                  margin: '0 auto 16px',
                  fontSize: '2.4rem',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                }}
              >
                ✓
              </div>
              <p style={{ color: '#10b981', fontWeight: 700, fontSize: '0.95rem' }}>Demande enregistrée</p>
              <h2 style={{ marginTop: '8px', fontSize: '1.5rem' }}>Merci pour votre initiative !</h2>
              <p style={{ color: '#9ca3af', marginTop: '10px', fontSize: '0.92rem', lineHeight: 1.6 }}>
                Votre demande pour <b style={{ color: '#fff' }}>&quot;{formData.eventName}&quot;</b> a été transmise. Un conseiller
                vous contactera sous 24h sur WhatsApp pour finaliser l&apos;ouverture.
              </p>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}

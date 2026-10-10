'use client';

import React, { useState } from 'react';
import { saveEventRequest } from '@/services/dbService';

interface CreateEventModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CreateEventModal: React.FC<CreateEventModalProps> = ({ isOpen, onClose }) => {
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
        background: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(8px)',
        padding: '16px',
        overflowY: 'auto',
      }}
      onClick={handleReset}
    >
      <div
        className="db"
        style={{ margin: 'auto' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* CLOSE BUTTON */}
        <button
          type="button"
          className="cx"
          onClick={handleReset}
          aria-label="Fermer la fenêtre"
        >
          ✕
        </button>

        {!isSubmitted ? (
          <>
            <p className="eb">Organisateurs</p>
            <h2 style={{ marginTop: '4px' }}>Créer une compétition</h2>
            <p className="sm mute" style={{ marginTop: '4px' }}>
              Remplissez les informations de base. Notre équipe configure votre vote en 24h ouvrées.
            </p>

            <form onSubmit={handleSubmit} style={{ marginTop: '18px' }}>
              <label
                htmlFor="ceNom"
                style={{ display: 'block', fontSize: '.85rem', fontWeight: 600 }}
              >
                Nom de l&apos;élection
              </label>
              <input
                type="text"
                id="ceNom"
                required
                placeholder="ex. Miss & Mister FMSB 2026"
                value={formData.eventName}
                onChange={(e) => setFormData({ ...formData, eventName: e.target.value })}
              />

              <label
                htmlFor="ceCampus"
                style={{ display: 'block', marginTop: '12px', fontSize: '.85rem', fontWeight: 600 }}
              >
                Établissement / Ville
              </label>
              <input
                type="text"
                id="ceCampus"
                required
                placeholder="ex. Université de Yaoundé I"
                value={formData.campus}
                onChange={(e) => setFormData({ ...formData, campus: e.target.value })}
              />

              <label
                htmlFor="ceContact"
                style={{ display: 'block', marginTop: '12px', fontSize: '.85rem', fontWeight: 600 }}
              >
                Numéro WhatsApp de l&apos;organisateur
              </label>
              <input
                type="tel"
                id="ceContact"
                required
                placeholder="6XXXXXXXX"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />

              <label
                htmlFor="cePrix"
                style={{ display: 'block', marginTop: '12px', fontSize: '.85rem', fontWeight: 600 }}
              >
                Prix unitaire du vote (FCFA)
              </label>
              <input
                type="number"
                id="cePrix"
                min="50"
                step="50"
                value={formData.votePrice}
                onChange={(e) => setFormData({ ...formData, votePrice: e.target.value })}
              />

              <button
                type="submit"
                className="btn full"
                style={{ marginTop: '20px' }}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Envoi en cours...' : 'Envoyer la demande'}
              </button>
            </form>

            <p className="sm mute" style={{ marginTop: '12px', textAlign: 'center' }}>
              Activation rapide sans frais fixes. Reversement direct via Mobile Money.
            </p>
          </>
        ) : (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
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
              }}
            >
              ✓
            </div>
            <p className="eb" style={{ color: '#10b981' }}>Demande enregistrée</p>
            <h2 style={{ marginTop: '6px' }}>Merci pour votre initiative !</h2>
            <p className="mute" style={{ marginTop: '8px', lineHeight: '1.5' }}>
              Votre demande pour <b>&quot;{formData.eventName}&quot;</b> a été transmise. Un conseiller
              vous contactera sous 24h sur WhatsApp pour finaliser l&apos;ouverture.
            </p>
            <button
              type="button"
              className="btn full"
              style={{ marginTop: '24px' }}
              onClick={handleReset}
            >
              Fermer
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

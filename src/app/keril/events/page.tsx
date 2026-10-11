'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { AdminSidebar } from '@/components/AdminSidebar';
import { AdminAuthGuard } from '@/components/AdminAuthGuard';
import { TicketEvent, TicketPassCategory, TICKET_PASS_TEMPLATES } from '@/data/mockTickets';
import { Plus, Trash2, Calendar, MapPin, QrCode, ArrowLeft, Check } from 'lucide-react';

export default function KerilEventsPage() {
  const [events, setEvents] = useState<TicketEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [date, setDate] = useState('');
  const [venue, setVenue] = useState('');
  const [city, setCity] = useState('Yaoundé');
  const [bannerImage, setBannerImage] = useState('/images/hero_bg.png');

  // Selected Pass Categories with custom prices
  const [selectedPasses, setSelectedPasses] = useState<TicketPassCategory[]>([...TICKET_PASS_TEMPLATES]);
  const [customPassName, setCustomPassName] = useState('');
  const [customPassPrice, setCustomPassPrice] = useState('3000');
  const [customPassDesc, setCustomPassDesc] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Load events
  const loadEvents = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/tickets/events');
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setEvents(data.data);
      }
    } catch {
      // Ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();
  }, []);

  const handleTogglePassTemplate = (template: TicketPassCategory) => {
    const exists = selectedPasses.some((p) => p.name === template.name);
    if (exists) {
      setSelectedPasses(selectedPasses.filter((p) => p.name !== template.name));
    } else {
      setSelectedPasses([...selectedPasses, template]);
    }
  };

  const handleUpdatePassPrice = (passName: string, newPrice: number) => {
    setSelectedPasses(
      selectedPasses.map((p) => (p.name === passName ? { ...p, price: newPrice } : p))
    );
  };

  const handleAddCustomPass = () => {
    if (!customPassName) return;
    const newPass: TicketPassCategory = {
      id: `pass_custom_${Date.now()}`,
      name: customPassName,
      price: parseInt(customPassPrice, 10) || 3000,
      description: customPassDesc || 'Pass d’accès à l’événement.',
    };
    setSelectedPasses([...selectedPasses, newPass]);
    setCustomPassName('');
    setCustomPassPrice('3000');
    setCustomPassDesc('');
  };

  const handleCreateEventSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !date || !venue) {
      setErrorMessage('Titre, date et lieu sont requis.');
      return;
    }

    if (selectedPasses.length === 0) {
      setErrorMessage('Veuillez sélectionner au moins une catégorie de Pass/Billet.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/tickets/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          subtitle,
          date,
          venue,
          city,
          bannerImage,
          passes: selectedPasses,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setIsSubmitting(false);
        setIsModalOpen(false);
        setTitle('');
        setSubtitle('');
        setDate('');
        setVenue('');
        loadEvents();
      } else {
        setIsSubmitting(false);
        setErrorMessage(data.error || 'Erreur lors de la création.');
      }
    } catch {
      setIsSubmitting(false);
      setErrorMessage('Erreur réseau lors de la création.');
    }
  };

  const handleDeleteEvent = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet événement ?')) return;

    try {
      await fetch(`/api/tickets/events?id=${id}`, { method: 'DELETE' });
      loadEvents();
    } catch {
      // Ignore
    }
  };

  return (
    <AdminAuthGuard>
      <div
        style={{
          minHeight: '100vh',
          background: 'var(--soft)',
          color: 'var(--ink)',
          display: 'flex',
          flexDirection: 'column',
          width: '100%',
        }}
      >
        <AdminSidebar />

        <main
          className="lg:ml-64"
          style={{
            flex: 1,
            minWidth: 0,
            padding: 'clamp(16px, 3vw, 36px)',
            display: 'flex',
            flexDirection: 'column',
            gap: '24px',
          }}
        >
          {/* HEADER & ACTIONS */}
          <div
            style={{
              paddingBottom: '20px',
              borderBottom: '1px solid var(--line)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '16px',
            }}
          >
            <div>
              <p className="eb">Administration Billetterie (/keril/events)</p>
              <h1 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.4rem)', marginTop: '4px' }}>
                Gestion des <span style={{ color: 'var(--p)' }}>Événements</span>
              </h1>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <Link
                href="/keril/tickets"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '12px 18px',
                  borderRadius: '14px',
                  background: 'var(--bg)',
                  border: '1.5px solid var(--line)',
                  color: 'var(--ink)',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  textDecoration: 'none',
                }}
              >
                <ArrowLeft className="w-4 h-4" /> Voir les Ventes de Billets
              </Link>

              <button
                type="button"
                onClick={() => setIsModalOpen(true)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '12px 20px',
                  borderRadius: '14px',
                  background: 'var(--p)',
                  color: '#ffffff',
                  fontWeight: 800,
                  fontSize: '0.92rem',
                  border: 'none',
                  cursor: 'pointer',
                  boxShadow: '0 8px 20px rgba(124, 58, 237, 0.3)',
                }}
              >
                <Plus className="w-5 h-5" />
                <span>Ajouter un Événement 🎟️</span>
              </button>
            </div>
          </div>

          {/* EVENTS LIST SHOWCASE */}
          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--mute)' }}>
              Chargement des événements...
            </div>
          ) : events.length === 0 ? (
            <div
              style={{
                background: 'var(--bg)',
                borderRadius: '24px',
                padding: '48px 24px',
                textAlign: 'center',
                border: '1.5px solid var(--line)',
              }}
            >
              <div style={{ fontSize: '3rem', marginBottom: '12px' }}>🎟️</div>
              <h3 style={{ fontSize: '1.4rem', fontWeight: 800 }}>Aucun événement publié pour le moment</h3>
              <p style={{ color: 'var(--mute)', maxWidth: '460px', margin: '8px auto 20px', lineHeight: 1.5 }}>
                Cliquez sur le bouton ci-dessous pour créer votre premier événement (Gala, Concert, After-Party) avec vos catégories de pass.
              </p>
              <button
                type="button"
                onClick={() => setIsModalOpen(true)}
                style={{
                  padding: '14px 28px',
                  borderRadius: '99px',
                  background: 'var(--p)',
                  color: '#ffffff',
                  fontWeight: 800,
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  boxShadow: '0 10px 25px rgba(124, 58, 237, 0.35)',
                }}
              >
                + Créer mon premier Événement
              </button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
              {events.map((evt) => (
                <div
                  key={evt.id}
                  style={{
                    background: 'var(--bg)',
                    borderRadius: '20px',
                    border: '1.5px solid var(--line)',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                  }}
                >
                  <div style={{ position: 'relative', height: '160px', width: '100%' }}>
                    <Image src={evt.bannerImage || '/images/hero_bg.png'} alt={evt.title} fill style={{ objectFit: 'cover' }} />
                    <button
                      type="button"
                      onClick={() => handleDeleteEvent(evt.id)}
                      style={{
                        position: 'absolute',
                        top: '12px',
                        right: '12px',
                        background: 'rgba(239, 68, 68, 0.9)',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '50%',
                        width: '34px',
                        height: '34px',
                        display: 'grid',
                        placeItems: 'center',
                        cursor: 'pointer',
                      }}
                      title="Supprimer l'événement"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div style={{ padding: '20px' }}>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>{evt.title}</h3>
                    <p style={{ fontSize: '0.85rem', color: 'var(--mute)', marginTop: '4px' }}>
                      <Calendar className="w-3.5 h-3.5 inline mr-1" /> {evt.date}
                    </p>
                    <p style={{ fontSize: '0.85rem', color: 'var(--mute)', marginTop: '2px' }}>
                      <MapPin className="w-3.5 h-3.5 inline mr-1" /> {evt.venue}, {evt.city}
                    </p>

                    <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid var(--line)' }}>
                      <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--mute)', textTransform: 'uppercase' }}>
                        Pass Activés ({evt.passes.length}) :
                      </span>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '6px' }}>
                        {evt.passes.map((p) => (
                          <span
                            key={p.name}
                            style={{
                              background: 'var(--soft)',
                              border: '1px solid var(--line)',
                              padding: '3px 8px',
                              borderRadius: '8px',
                              fontSize: '0.78rem',
                              fontWeight: 700,
                            }}
                          >
                            {p.name} : <b style={{ color: 'var(--p)' }}>{p.price.toLocaleString('fr-FR')} FCFA</b>
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>

        {/* CREATE EVENT MODAL WITH PASS TEMPLATES */}
        {isModalOpen && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 100,
              display: 'grid',
              placeItems: 'center',
              background: 'rgba(8, 12, 24, 0.85)',
              backdropFilter: 'blur(12px)',
              padding: '16px',
              overflowY: 'auto',
            }}
            onClick={() => setIsModalOpen(false)}
          >
            <div
              style={{
                margin: 'auto',
                position: 'relative',
                width: '100%',
                maxWidth: '560px',
                background: '#0f1526',
                color: '#ffffff',
                borderRadius: '24px',
                padding: '28px 24px',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                boxShadow: '0 25px 60px rgba(0, 0, 0, 0.7)',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                style={{
                  position: 'absolute',
                  top: '20px',
                  right: '20px',
                  background: 'none',
                  border: 'none',
                  color: '#94a3b8',
                  fontSize: '1.2rem',
                  cursor: 'pointer',
                }}
              >
                ✕
              </button>

              <form onSubmit={handleCreateEventSubmit}>
                <div style={{ color: '#818cf8', fontSize: '0.78rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                  🏆 CRÉATION D&apos;ÉVÉNEMENT BILLETTERIE
                </div>
                <h2 style={{ marginTop: '4px', fontSize: '1.5rem', fontWeight: 800 }}>
                  Créer un Nouvel Événement
                </h2>

                {/* TITRE */}
                <label style={{ display: 'block', marginTop: '16px', fontSize: '0.88rem', fontWeight: 700 }}>
                  Nom de l&apos;Événement *
                </label>
                <input
                  type="text"
                  required
                  placeholder="ex. Grande Soirée de Gala Miss & Mister 2026"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  style={{
                    width: '100%',
                    marginTop: '6px',
                    height: '46px',
                    background: '#161e33',
                    border: '1.5px solid rgba(255, 255, 255, 0.15)',
                    borderRadius: '12px',
                    padding: '0 14px',
                    color: '#ffffff',
                    fontSize: '0.92rem',
                    fontWeight: 600,
                    outline: 'none',
                  }}
                />

                {/* SOUS-TITRE */}
                <label style={{ display: 'block', marginTop: '14px', fontSize: '0.88rem', fontWeight: 700 }}>
                  Sous-titre / Slogan
                </label>
                <input
                  type="text"
                  placeholder="ex. La plus grande nuit d'élégance de l'année"
                  value={subtitle}
                  onChange={(e) => setSubtitle(e.target.value)}
                  style={{
                    width: '100%',
                    marginTop: '6px',
                    height: '46px',
                    background: '#161e33',
                    border: '1.5px solid rgba(255, 255, 255, 0.15)',
                    borderRadius: '12px',
                    padding: '0 14px',
                    color: '#ffffff',
                    fontSize: '0.92rem',
                    fontWeight: 600,
                    outline: 'none',
                  }}
                />

                {/* DATE & HEURE */}
                <label style={{ display: 'block', marginTop: '14px', fontSize: '0.88rem', fontWeight: 700 }}>
                  Date & Heure *
                </label>
                <input
                  type="text"
                  required
                  placeholder="ex. Samedi 15 Novembre 2026 à 20h00"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  style={{
                    width: '100%',
                    marginTop: '6px',
                    height: '46px',
                    background: '#161e33',
                    border: '1.5px solid rgba(255, 255, 255, 0.15)',
                    borderRadius: '12px',
                    padding: '0 14px',
                    color: '#ffffff',
                    fontSize: '0.92rem',
                    fontWeight: 600,
                    outline: 'none',
                  }}
                />

                {/* LIEU & VILLE */}
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '10px', marginTop: '14px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 700 }}>Lieu / Salle *</label>
                    <input
                      type="text"
                      required
                      placeholder="ex. Palais des Sports"
                      value={venue}
                      onChange={(e) => setVenue(e.target.value)}
                      style={{
                        width: '100%',
                        marginTop: '6px',
                        height: '46px',
                        background: '#161e33',
                        border: '1.5px solid rgba(255, 255, 255, 0.15)',
                        borderRadius: '12px',
                        padding: '0 14px',
                        color: '#ffffff',
                        fontSize: '0.92rem',
                        fontWeight: 600,
                        outline: 'none',
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 700 }}>Ville</label>
                    <input
                      type="text"
                      placeholder="Yaoundé"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      style={{
                        width: '100%',
                        marginTop: '6px',
                        height: '46px',
                        background: '#161e33',
                        border: '1.5px solid rgba(255, 255, 255, 0.15)',
                        borderRadius: '12px',
                        padding: '0 14px',
                        color: '#ffffff',
                        fontSize: '0.92rem',
                        fontWeight: 600,
                        outline: 'none',
                      }}
                    />
                  </div>
                </div>

                {/* BANNER IMAGE URL */}
                <label style={{ display: 'block', marginTop: '14px', fontSize: '0.88rem', fontWeight: 700 }}>
                  Image de Couverture (URL)
                </label>
                <input
                  type="text"
                  placeholder="/images/hero_bg.png"
                  value={bannerImage}
                  onChange={(e) => setBannerImage(e.target.value)}
                  style={{
                    width: '100%',
                    marginTop: '6px',
                    height: '46px',
                    background: '#161e33',
                    border: '1.5px solid rgba(255, 255, 255, 0.15)',
                    borderRadius: '12px',
                    padding: '0 14px',
                    color: '#ffffff',
                    fontSize: '0.92rem',
                    fontWeight: 600,
                    outline: 'none',
                  }}
                />

                {/* PASS TEMPLATES & CUSTOM PRICES */}
                <div style={{ marginTop: '20px', paddingTop: '14px', borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
                  <label style={{ display: 'block', fontSize: '0.92rem', fontWeight: 800, color: '#818cf8' }}>
                    🎟️ Templates de Billets à Associer :
                  </label>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px' }}>
                    {TICKET_PASS_TEMPLATES.map((tmpl) => {
                      const isSelected = selectedPasses.some((p) => p.name === tmpl.name);
                      const currentPass = selectedPasses.find((p) => p.name === tmpl.name);
                      return (
                        <div
                          key={tmpl.id}
                          style={{
                            padding: '12px 14px',
                            borderRadius: '12px',
                            background: isSelected ? 'rgba(129, 140, 248, 0.15)' : '#161e33',
                            border: isSelected ? '1.5px solid #818cf8' : '1.5px solid rgba(255, 255, 255, 0.1)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: '12px',
                          }}
                        >
                          <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', flex: 1 }}>
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleTogglePassTemplate(tmpl)}
                              style={{ width: '18px', height: '18px', accentColor: '#818cf8' }}
                            />
                            <div>
                              <div style={{ fontSize: '0.92rem', fontWeight: 800, color: '#ffffff' }}>{tmpl.name}</div>
                              <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{tmpl.description}</div>
                            </div>
                          </label>

                          {isSelected && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <input
                                type="number"
                                value={currentPass?.price || tmpl.price}
                                onChange={(e) => handleUpdatePassPrice(tmpl.name, parseInt(e.target.value, 10) || 0)}
                                style={{
                                  width: '85px',
                                  height: '36px',
                                  background: '#0f1526',
                                  border: '1px solid #818cf8',
                                  borderRadius: '8px',
                                  color: '#ffffff',
                                  fontWeight: 800,
                                  fontSize: '0.88rem',
                                  textAlign: 'center',
                                }}
                              />
                              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#818cf8' }}>FCFA</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {errorMessage && (
                  <div style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#fca5a5', padding: '10px', borderRadius: '10px', fontSize: '0.82rem', marginTop: '14px' }}>
                    {errorMessage}
                  </div>
                )}

                {/* SUBMIT BUTTON */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  style={{
                    width: '100%',
                    marginTop: '22px',
                    padding: '15px',
                    borderRadius: '99px',
                    border: 'none',
                    background: '#818cf8',
                    color: '#0f172a',
                    fontSize: '1rem',
                    fontWeight: 800,
                    cursor: isSubmitting ? 'not-allowed' : 'pointer',
                    boxShadow: '0 8px 24px rgba(129, 140, 248, 0.35)',
                  }}
                >
                  {isSubmitting ? 'Publication...' : 'Publier l’Événement sur la Billetterie 🚀'}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </AdminAuthGuard>
  );
}

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
  const [deletingEventId, setDeletingEventId] = useState<string | null>(null);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [date, setDate] = useState('');
  const [venue, setVenue] = useState('');
  const [city, setCity] = useState('Yaoundé');
  const [bannerImage, setBannerImage] = useState('/images/hero_bg.png');

  // Organizer info
  const [organizerName, setOrganizerName] = useState('');
  const [organizerEmail, setOrganizerEmail] = useState('');
  const [organizerPhone, setOrganizerPhone] = useState('');

  // Selected Pass Categories with custom prices
  const [selectedPasses, setSelectedPasses] = useState<TicketPassCategory[]>([...TICKET_PASS_TEMPLATES]);
  const [customPassName, setCustomPassName] = useState('');
  const [customPassPrice, setCustomPassPrice] = useState('3000');
  const [customPassDesc, setCustomPassDesc] = useState('');
  const [customPassQty, setCustomPassQty] = useState('100');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [createdOrgLink, setCreatedOrgLink] = useState<string | null>(null);

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
      setSelectedPasses([...selectedPasses, { ...template }]);
    }
  };

  const handleUpdatePassPrice = (passName: string, newPrice: number) => {
    setSelectedPasses(
      selectedPasses.map((p) => (p.name === passName ? { ...p, price: newPrice } : p))
    );
  };

  const handleUpdatePassQty = (passName: string, newQty: number) => {
    setSelectedPasses(
      selectedPasses.map((p) => (p.name === passName ? { ...p, quantity: newQty } : p))
    );
  };

  const handleCopyOrgLink = (link: string, token: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(link).catch(() => {});
    }
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2500);
  };

  const getOrgLink = (token: string) => {
    if (typeof window !== 'undefined') {
      return `${window.location.origin}/organisateur/billetterie/${token}`;
    }
    return `/organisateur/billetterie/${token}`;
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
    setCreatedOrgLink(null);

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
          organizerName,
          organizerEmail,
          organizerPhone,
          passes: selectedPasses,
        }),
      });

      const data = await res.json();

      if (data.success) {
        const orgToken = data.data?.organizerToken || data.organizerToken || '';
        if (orgToken) {
          setCreatedOrgLink(getOrgLink(orgToken));
        }
        setTitle('');
        setSubtitle('');
        setDate('');
        setVenue('');
        setOrganizerName('');
        setOrganizerEmail('');
        setOrganizerPhone('');
        setSelectedPasses([...TICKET_PASS_TEMPLATES]);
        loadEvents();
      } else {
        setErrorMessage(data.error || 'Erreur lors de la création.');
      }
    } catch {
      setErrorMessage('Erreur réseau lors de la création.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteEvent = async (id: string) => {
    try {
      await fetch(`/api/tickets/events?id=${id}`, { method: 'DELETE' });
      setDeletingEventId(null);
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
                    {/* Delete inline confirmation */}
                    {deletingEventId === evt.id ? (
                      <div style={{ position: 'absolute', top: '10px', right: '10px', display: 'flex', gap: '6px' }}>
                        <button
                          type="button"
                          onClick={() => handleDeleteEvent(evt.id)}
                          style={{ padding: '6px 10px', borderRadius: '99px', background: 'rgba(239,68,68,0.95)', color: '#fff', border: 'none', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 700 }}
                        >
                          Confirmer
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeletingEventId(null)}
                          style={{ padding: '6px 10px', borderRadius: '99px', background: 'rgba(0,0,0,0.6)', color: '#fff', border: 'none', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 700 }}
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setDeletingEventId(evt.id)}
                        style={{
                          position: 'absolute', top: '12px', right: '12px',
                          background: 'rgba(239, 68, 68, 0.9)', color: '#ffffff', border: 'none',
                          borderRadius: '50%', width: '34px', height: '34px',
                          display: 'grid', placeItems: 'center', cursor: 'pointer',
                        }}
                        title="Supprimer l'événement"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <div style={{ padding: '20px' }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 800 }}>{evt.title}</h3>
                    <p style={{ fontSize: '0.85rem', color: 'var(--mute)', marginTop: '4px' }}>
                      <Calendar className="w-3.5 h-3.5 inline mr-1" /> {evt.date}
                    </p>
                    <p style={{ fontSize: '0.85rem', color: 'var(--mute)', marginTop: '2px' }}>
                      <MapPin className="w-3.5 h-3.5 inline mr-1" /> {evt.venue}, {evt.city}
                    </p>

                    <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid var(--line)' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--mute)', textTransform: 'uppercase' }}>
                        Pass ({evt.passes.length}) :
                      </span>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '6px' }}>
                        {evt.passes.map((p) => (
                          <span
                            key={p.name}
                            style={{
                              background: 'var(--soft)', border: '1px solid var(--line)',
                              padding: '3px 8px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 700,
                            }}
                          >
                            {p.name} : <b style={{ color: 'var(--p)' }}>{p.price.toLocaleString('fr-FR')} FCFA</b>
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Lien organisateur */}
                    {(evt as any).organizerToken && (
                      <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid var(--line)' }}>
                        <p style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--mute)', textTransform: 'uppercase', marginBottom: '6px' }}>
                          🔗 Lien Organisateur :
                        </p>
                        <button
                          type="button"
                          onClick={() => handleCopyOrgLink(getOrgLink((evt as any).organizerToken), (evt as any).organizerToken)}
                          style={{
                            width: '100%', padding: '8px 12px', borderRadius: '10px',
                            background: 'rgba(91,61,245,0.08)', border: '1px solid rgba(91,61,245,0.25)',
                            color: 'var(--p)', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer',
                            textAlign: 'left', display: 'flex', alignItems: 'center', gap: '6px',
                          }}
                        >
                          <QrCode className="w-3.5 h-3.5 flex-shrink-0" />
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                            {copiedToken === (evt as any).organizerToken ? '✅ Lien copié !' : `/organisateur/billetterie/${(evt as any).organizerToken}`}
                          </span>
                        </button>
                      </div>
                    )}
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

                {/* ORGANISATEUR */}
                <div style={{ marginTop: '16px', paddingTop: '14px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                  <label style={{ display: 'block', fontSize: '0.92rem', fontWeight: 800, color: '#818cf8' }}>
                    👤 Informations Organisateur
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '10px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '4px' }}>Nom organisateur</label>
                      <input
                        type="text"
                        placeholder="Jean DUPONT"
                        value={organizerName}
                        onChange={(e) => setOrganizerName(e.target.value)}
                        style={{ width: '100%', height: '42px', background: '#161e33', border: '1.5px solid rgba(255,255,255,0.15)', borderRadius: '10px', padding: '0 12px', color: '#fff', fontSize: '0.88rem' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '4px' }}>Téléphone MoMo *</label>
                      <input
                        type="tel"
                        placeholder="690123456"
                        value={organizerPhone}
                        onChange={(e) => setOrganizerPhone(e.target.value)}
                        style={{ width: '100%', height: '42px', background: '#161e33', border: '1.5px solid rgba(255,255,255,0.15)', borderRadius: '10px', padding: '0 12px', color: '#fff', fontSize: '0.88rem' }}
                      />
                    </div>
                  </div>
                  <div style={{ marginTop: '10px' }}>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '4px' }}>Email organisateur</label>
                    <input
                      type="email"
                      placeholder="organisateur@email.com"
                      value={organizerEmail}
                      onChange={(e) => setOrganizerEmail(e.target.value)}
                      style={{ width: '100%', height: '42px', background: '#161e33', border: '1.5px solid rgba(255,255,255,0.15)', borderRadius: '10px', padding: '0 12px', color: '#fff', fontSize: '0.88rem' }}
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
                            padding: '12px 14px', borderRadius: '12px',
                            background: isSelected ? 'rgba(129, 140, 248, 0.15)' : '#161e33',
                            border: isSelected ? '1.5px solid #818cf8' : '1.5px solid rgba(255,255,255,0.1)',
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px',
                            flexWrap: 'wrap',
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
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                <span style={{ fontSize: '0.65rem', color: '#818cf8', fontWeight: 700, marginBottom: '2px' }}>PRIX</span>
                                <input
                                  type="number"
                                  value={currentPass?.price ?? tmpl.price}
                                  onChange={(e) => handleUpdatePassPrice(tmpl.name, parseInt(e.target.value, 10) || 0)}
                                  style={{ width: '80px', height: '34px', background: '#0f1526', border: '1px solid #818cf8', borderRadius: '8px', color: '#fff', fontWeight: 800, fontSize: '0.85rem', textAlign: 'center' }}
                                />
                              </div>
                              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                <span style={{ fontSize: '0.65rem', color: '#10b981', fontWeight: 700, marginBottom: '2px' }}>QTÉ</span>
                                <input
                                  type="number"
                                  value={(currentPass as any)?.quantity ?? 100}
                                  onChange={(e) => handleUpdatePassQty(tmpl.name, parseInt(e.target.value, 10) || 0)}
                                  style={{ width: '70px', height: '34px', background: '#0f1526', border: '1px solid #10b981', borderRadius: '8px', color: '#fff', fontWeight: 800, fontSize: '0.85rem', textAlign: 'center' }}
                                />
                              </div>
                              <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#818cf8', marginTop: '14px' }}>FCFA</span>
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

                {createdOrgLink && (
                  <div style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid #10b981', padding: '14px', borderRadius: '12px', marginTop: '14px' }}>
                    <p style={{ color: '#10b981', fontSize: '0.82rem', fontWeight: 800, marginBottom: '8px' }}>✅ Événement créé ! Lien organisateur :</p>
                    <div style={{ background: '#0f1526', borderRadius: '8px', padding: '10px 12px', fontSize: '0.78rem', color: '#a78bfa', wordBreak: 'break-all', fontFamily: 'monospace' }}>
                      {createdOrgLink}
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        if (navigator.clipboard) navigator.clipboard.writeText(createdOrgLink).catch(() => {});
                        setCopiedToken('modal');
                        setTimeout(() => setCopiedToken(null), 2000);
                      }}
                      style={{ marginTop: '8px', padding: '8px 16px', borderRadius: '8px', background: '#818cf8', border: 'none', color: '#0f172a', fontWeight: 800, fontSize: '0.82rem', cursor: 'pointer' }}
                    >
                      {copiedToken === 'modal' ? '✅ Copié !' : '📋 Copier le lien'}
                    </button>
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

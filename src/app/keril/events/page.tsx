'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { AdminSidebar } from '@/components/AdminSidebar';
import { AdminAuthGuard } from '@/components/AdminAuthGuard';
import { TicketEvent, TicketPassCategory, TICKET_PASS_TEMPLATES } from '@/data/mockTickets';
import { Plus, Trash2, Calendar, MapPin, QrCode, ArrowLeft, Pencil, Upload, X, ImageIcon } from 'lucide-react';

const INPUT_STYLE: React.CSSProperties = {
  width: '100%', marginTop: '6px', height: '46px',
  background: '#161e33', border: '1.5px solid rgba(255,255,255,0.15)',
  borderRadius: '12px', padding: '0 14px', color: '#ffffff',
  fontSize: '0.92rem', fontWeight: 600, outline: 'none', boxSizing: 'border-box',
};
const SMALL_INPUT: React.CSSProperties = {
  width: '100%', height: '42px',
  background: '#161e33', border: '1.5px solid rgba(255,255,255,0.15)',
  borderRadius: '10px', padding: '0 12px', color: '#fff', fontSize: '0.88rem', outline: 'none', boxSizing: 'border-box',
};
const LABEL: React.CSSProperties = { display: 'block', fontSize: '0.88rem', fontWeight: 700, marginBottom: '4px' };

type EditingEvent = TicketEvent & { organizerToken?: string; organizerName?: string; organizerEmail?: string; organizerPhone?: string };

export default function KerilEventsPage() {
  const [events, setEvents] = useState<TicketEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalMode, setModalMode] = useState<'create' | 'edit' | null>(null);
  const [editingEvent, setEditingEvent] = useState<EditingEvent | null>(null);
  const [deletingEventId, setDeletingEventId] = useState<string | null>(null);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [date, setDate] = useState('');
  const [venue, setVenue] = useState('');
  const [city, setCity] = useState('Yaoundé');
  const [bannerImage, setBannerImage] = useState('');
  const [bannerPreview, setBannerPreview] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  // Organizer
  const [organizerName, setOrganizerName] = useState('');
  const [organizerEmail, setOrganizerEmail] = useState('');
  const [organizerPhone, setOrganizerPhone] = useState('');

  // Passes
  const [selectedPasses, setSelectedPasses] = useState<TicketPassCategory[]>([...TICKET_PASS_TEMPLATES]);
  const [customPassName, setCustomPassName] = useState('');
  const [customPassPrice, setCustomPassPrice] = useState('3000');
  const [customPassDesc, setCustomPassDesc] = useState('');
  const [customPassQty, setCustomPassQty] = useState('100');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [createdOrgLink, setCreatedOrgLink] = useState<string | null>(null);

  // ── Load ──────────────────────────────────────────────────────

  const loadEvents = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/tickets/events');
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) setEvents(data.data);
    } catch { /* noop */ }
    finally { setLoading(false); }
  };

  useEffect(() => { loadEvents(); }, []);

  // ── Photo upload (base64 via FileReader — no external service needed) ──

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 4 * 1024 * 1024) { setErrorMessage('Photo trop grande (max 4 Mo).'); return; }
    setUploadingPhoto(true);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      setBannerImage(dataUrl);
      setBannerPreview(dataUrl);
      setUploadingPhoto(false);
    };
    reader.readAsDataURL(file);
  };

  // ── Pass helpers ──────────────────────────────────────────────

  const handleTogglePassTemplate = (tmpl: TicketPassCategory) => {
    const exists = selectedPasses.some((p) => p.name === tmpl.name);
    setSelectedPasses(exists ? selectedPasses.filter((p) => p.name !== tmpl.name) : [...selectedPasses, { ...tmpl }]);
  };
  const handleUpdatePassPrice = (name: string, price: number) =>
    setSelectedPasses(selectedPasses.map((p) => (p.name === name ? { ...p, price } : p)));
  const handleUpdatePassQty = (name: string, quantity: number) =>
    setSelectedPasses(selectedPasses.map((p) => (p.name === name ? { ...p, quantity } : p)));
  const handleAddCustomPass = () => {
    if (!customPassName.trim()) return;
    setSelectedPasses([...selectedPasses, {
      id: `pass_custom_${Date.now()}`,
      name: customPassName.trim(),
      price: parseInt(customPassPrice, 10) || 3000,
      description: customPassDesc || "Pass d'accès à l'événement.",
      quantity: parseInt(customPassQty, 10) || 100,
    }]);
    setCustomPassName(''); setCustomPassPrice('3000'); setCustomPassDesc(''); setCustomPassQty('100');
  };
  const handleRemoveCustomPass = (name: string) =>
    setSelectedPasses(selectedPasses.filter((p) => p.name !== name));

  // ── Modal open helpers ────────────────────────────────────────

  const resetForm = () => {
    setTitle(''); setSubtitle(''); setDate(''); setVenue(''); setCity('Yaoundé');
    setBannerImage(''); setBannerPreview('');
    setOrganizerName(''); setOrganizerEmail(''); setOrganizerPhone('');
    setSelectedPasses([...TICKET_PASS_TEMPLATES]);
    setErrorMessage(null); setCreatedOrgLink(null);
  };

  const openCreate = () => { resetForm(); setEditingEvent(null); setModalMode('create'); };

  const openEdit = (evt: EditingEvent) => {
    setEditingEvent(evt);
    setTitle(evt.title || '');
    setSubtitle((evt as any).subtitle || '');
    setDate(evt.date || '');
    setVenue(evt.venue || '');
    setCity(evt.city || 'Yaoundé');
    setBannerImage(evt.bannerImage || '');
    setBannerPreview(evt.bannerImage || '');
    setOrganizerName((evt as any).organizerName || '');
    setOrganizerEmail((evt as any).organizerEmail || '');
    setOrganizerPhone((evt as any).organizerPhone || '');
    setSelectedPasses(evt.passes?.length ? evt.passes : [...TICKET_PASS_TEMPLATES]);
    setErrorMessage(null); setCreatedOrgLink(null);
    setModalMode('edit');
  };

  const getOrgLink = (token: string) =>
    typeof window !== 'undefined' ? `${window.location.origin}/organisateur/billetterie/${token}` : `/organisateur/billetterie/${token}`;

  const handleCopyOrgLink = (link: string, key: string) => {
    navigator.clipboard?.writeText(link).catch(() => {});
    setCopiedToken(key);
    setTimeout(() => setCopiedToken(null), 2500);
  };

  // ── Submit ────────────────────────────────────────────────────

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !date || !venue) { setErrorMessage('Titre, date et lieu sont requis.'); return; }
    if (!selectedPasses.length) { setErrorMessage('Sélectionnez au moins un type de billet.'); return; }
    setIsSubmitting(true); setErrorMessage(null); setCreatedOrgLink(null);

    try {
      const payload = { title, subtitle, date, venue, city, bannerImage, organizerName, organizerEmail, organizerPhone, passes: selectedPasses };

      let res: Response;
      if (modalMode === 'edit' && editingEvent) {
        res = await fetch(`/api/tickets/events?id=${editingEvent.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', 'x-admin-secret': process.env.NEXT_PUBLIC_ADMIN_SECRET || '' },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch('/api/tickets/events', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }

      const data = await res.json();
      if (data.success) {
        const orgToken = data.data?.organizerToken || data.organizerToken || (editingEvent as any)?.organizerToken || '';
        if (orgToken) setCreatedOrgLink(getOrgLink(orgToken));
        loadEvents();
        if (modalMode === 'create') resetForm();
      } else {
        setErrorMessage(data.error || 'Erreur.');
      }
    } catch { setErrorMessage('Erreur réseau.'); }
    finally { setIsSubmitting(false); }
  };

  const handleDeleteEvent = async (id: string) => {
    await fetch(`/api/tickets/events?id=${id}`, { method: 'DELETE', headers: { 'x-admin-secret': process.env.NEXT_PUBLIC_ADMIN_SECRET || '' } });
    setDeletingEventId(null);
    loadEvents();
  };

  // ── Render ────────────────────────────────────────────────────

  const isModalOpen = modalMode !== null;

  return (
    <AdminAuthGuard>
      <div style={{ minHeight: '100vh', background: 'var(--soft)', color: 'var(--ink)', display: 'flex', flexDirection: 'column', width: '100%' }}>
        <AdminSidebar />

        <main className="lg:ml-64" style={{ flex: 1, minWidth: 0, padding: 'clamp(16px,3vw,36px)', display: 'flex', flexDirection: 'column', gap: '24px' }}>

          {/* HEADER */}
          <div style={{ paddingBottom: '20px', borderBottom: '1px solid var(--line)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <p className="eb">Administration Billetterie</p>
              <h1 style={{ fontSize: 'clamp(1.8rem,4vw,2.4rem)', marginTop: '4px' }}>
                Gestion des <span style={{ color: 'var(--p)' }}>Événements</span>
              </h1>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <Link href="/keril/tickets" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '12px 18px', borderRadius: '14px', background: 'var(--bg)', border: '1.5px solid var(--line)', color: 'var(--ink)', fontWeight: 700, fontSize: '0.9rem', textDecoration: 'none' }}>
                <ArrowLeft className="w-4 h-4" /> Ventes
              </Link>
              <button type="button" onClick={openCreate} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '12px 20px', borderRadius: '14px', background: 'var(--p)', color: '#fff', fontWeight: 800, fontSize: '0.92rem', border: 'none', cursor: 'pointer', boxShadow: '0 8px 20px rgba(124,58,237,0.3)' }}>
                <Plus className="w-5 h-5" /> Ajouter un Événement
              </button>
            </div>
          </div>

          {/* EVENT GRID */}
          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--mute)' }}>Chargement…</div>
          ) : events.length === 0 ? (
            <div style={{ background: 'var(--bg)', borderRadius: '24px', padding: '48px 24px', textAlign: 'center', border: '1.5px solid var(--line)' }}>
              <div style={{ fontSize: '3rem', marginBottom: '12px' }}>🎟️</div>
              <h3 style={{ fontSize: '1.4rem', fontWeight: 800 }}>Aucun événement publié</h3>
              <button type="button" onClick={openCreate} style={{ marginTop: '16px', padding: '14px 28px', borderRadius: '99px', background: 'var(--p)', color: '#fff', fontWeight: 800, border: 'none', cursor: 'pointer', fontSize: '1rem', boxShadow: '0 10px 25px rgba(124,58,237,0.35)' }}>
                + Créer mon premier Événement
              </button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(320px,1fr))', gap: '20px' }}>
              {events.map((evt) => (
                <div key={evt.id} style={{ background: 'var(--bg)', borderRadius: '20px', border: '1.5px solid var(--line)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                  {/* Banner */}
                  <div style={{ position: 'relative', height: '160px', background: '#1a1a2e', overflow: 'hidden' }}>
                    {evt.bannerImage ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={evt.bannerImage} alt={evt.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg,#1B0E78,#4B2CE0)', display: 'grid', placeItems: 'center' }}>
                        <ImageIcon style={{ width: '40px', height: '40px', color: 'rgba(255,255,255,0.3)' }} />
                      </div>
                    )}
                    {/* Actions overlay */}
                    <div style={{ position: 'absolute', top: '10px', right: '10px', display: 'flex', gap: '6px' }}>
                      <button type="button" onClick={() => openEdit(evt as EditingEvent)} style={{ width: '34px', height: '34px', borderRadius: '50%', background: 'rgba(99,102,241,0.9)', color: '#fff', border: 'none', cursor: 'pointer', display: 'grid', placeItems: 'center' }} title="Modifier">
                        <Pencil style={{ width: '15px', height: '15px' }} />
                      </button>
                      {deletingEventId === evt.id ? (
                        <>
                          <button type="button" onClick={() => handleDeleteEvent(evt.id)} style={{ padding: '6px 10px', borderRadius: '99px', background: 'rgba(239,68,68,0.95)', color: '#fff', border: 'none', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 700 }}>Confirmer</button>
                          <button type="button" onClick={() => setDeletingEventId(null)} style={{ padding: '6px 10px', borderRadius: '99px', background: 'rgba(0,0,0,0.6)', color: '#fff', border: 'none', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 700 }}>✕</button>
                        </>
                      ) : (
                        <button type="button" onClick={() => setDeletingEventId(evt.id)} style={{ width: '34px', height: '34px', borderRadius: '50%', background: 'rgba(239,68,68,0.9)', color: '#fff', border: 'none', cursor: 'pointer', display: 'grid', placeItems: 'center' }} title="Supprimer">
                          <Trash2 style={{ width: '15px', height: '15px' }} />
                        </button>
                      )}
                    </div>
                  </div>

                  <div style={{ padding: '18px', flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0 }}>{evt.title}</h3>
                    <p style={{ fontSize: '0.82rem', color: 'var(--mute)', margin: 0 }}><Calendar className="w-3.5 h-3.5 inline mr-1" />{evt.date}</p>
                    <p style={{ fontSize: '0.82rem', color: 'var(--mute)', margin: 0 }}><MapPin className="w-3.5 h-3.5 inline mr-1" />{evt.venue}{evt.city ? `, ${evt.city}` : ''}</p>

                    <div style={{ paddingTop: '10px', borderTop: '1px solid var(--line)' }}>
                      <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--mute)', textTransform: 'uppercase' }}>Pass ({evt.passes.length}) :</span>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginTop: '5px' }}>
                        {evt.passes.map((p) => (
                          <span key={p.name} style={{ background: 'var(--soft)', border: '1px solid var(--line)', padding: '3px 8px', borderRadius: '8px', fontSize: '0.72rem', fontWeight: 700 }}>
                            {p.name} : <b style={{ color: 'var(--p)' }}>{p.price.toLocaleString('fr-FR')} F</b>
                          </span>
                        ))}
                      </div>
                    </div>

                    {(evt as any).organizerToken && (
                      <div style={{ paddingTop: '10px', borderTop: '1px solid var(--line)' }}>
                        <p style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--mute)', textTransform: 'uppercase', marginBottom: '5px' }}>🔗 Lien Organisateur</p>
                        <button type="button" onClick={() => handleCopyOrgLink(getOrgLink((evt as any).organizerToken), (evt as any).organizerToken)} style={{ width: '100%', padding: '8px 12px', borderRadius: '10px', background: 'rgba(91,61,245,0.08)', border: '1px solid rgba(91,61,245,0.25)', color: 'var(--p)', fontSize: '0.73rem', fontWeight: 700, cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <QrCode className="w-3.5 h-3.5 flex-shrink-0" />
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                            {copiedToken === (evt as any).organizerToken ? '✅ Copié !' : `/organisateur/billetterie/${(evt as any).organizerToken}`}
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

        {/* ═══ MODAL CREATE / EDIT ═══ */}
        {isModalOpen && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'grid', placeItems: 'center', background: 'rgba(8,12,24,0.88)', backdropFilter: 'blur(12px)', padding: '16px', overflowY: 'auto' }}
            onClick={() => setModalMode(null)}>
            <div style={{ margin: 'auto', position: 'relative', width: '100%', maxWidth: '580px', background: '#0f1526', color: '#fff', borderRadius: '24px', padding: '28px 24px', border: '1px solid rgba(255,255,255,0.12)', boxShadow: '0 25px 60px rgba(0,0,0,0.7)' }}
              onClick={(e) => e.stopPropagation()}>

              <button type="button" onClick={() => setModalMode(null)} style={{ position: 'absolute', top: '18px', right: '18px', background: 'none', border: 'none', color: '#94a3b8', fontSize: '1.2rem', cursor: 'pointer' }}>
                <X style={{ width: '20px', height: '20px' }} />
              </button>

              <div style={{ color: '#818cf8', fontSize: '0.78rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                {modalMode === 'edit' ? '✏️ MODIFICATION D\'ÉVÉNEMENT' : '🏆 CRÉATION D\'ÉVÉNEMENT'}
              </div>
              <h2 style={{ marginTop: '4px', fontSize: '1.45rem', fontWeight: 800 }}>
                {modalMode === 'edit' ? `Modifier : ${editingEvent?.title}` : 'Nouvel Événement'}
              </h2>

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>

                {/* ── INFOS DE BASE ── */}
                <div style={{ marginTop: '18px' }}>
                  <label style={LABEL}>Nom de l&apos;Événement *</label>
                  <input type="text" required placeholder="ex. Soirée de Gala Miss & Mister 2026" value={title} onChange={(e) => setTitle(e.target.value)} style={INPUT_STYLE} />
                </div>

                <div style={{ marginTop: '12px' }}>
                  <label style={LABEL}>Sous-titre / Slogan</label>
                  <input type="text" placeholder="ex. La plus grande nuit d'élégance" value={subtitle} onChange={(e) => setSubtitle(e.target.value)} style={INPUT_STYLE} />
                </div>

                <div style={{ marginTop: '12px' }}>
                  <label style={LABEL}>Date & Heure *</label>
                  <input type="text" required placeholder="ex. Samedi 15 Nov. 2026 à 20h00" value={date} onChange={(e) => setDate(e.target.value)} style={INPUT_STYLE} />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '10px', marginTop: '12px' }}>
                  <div>
                    <label style={LABEL}>Lieu / Salle *</label>
                    <input type="text" required placeholder="ex. Palais des Sports" value={venue} onChange={(e) => setVenue(e.target.value)} style={INPUT_STYLE} />
                  </div>
                  <div>
                    <label style={LABEL}>Ville</label>
                    <input type="text" placeholder="Yaoundé" value={city} onChange={(e) => setCity(e.target.value)} style={INPUT_STYLE} />
                  </div>
                </div>

                {/* ── PHOTO DE L'ÉVÉNEMENT ── */}
                <div style={{ marginTop: '18px', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                  <label style={{ ...LABEL, color: '#f59e0b', fontSize: '0.92rem' }}>📸 Photo de l&apos;événement</label>
                  <p style={{ fontSize: '0.76rem', color: '#94a3b8', marginBottom: '10px' }}>
                    Uploadez une image (JPG/PNG, max 4 Mo) ou collez une URL.
                  </p>

                  {/* Upload zone */}
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    style={{ cursor: 'pointer', borderRadius: '14px', border: '2px dashed rgba(245,158,11,0.4)', background: bannerPreview ? 'transparent' : '#161e33', overflow: 'hidden', position: 'relative', minHeight: '120px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    {bannerPreview ? (
                      <>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={bannerPreview} alt="preview" style={{ width: '100%', maxHeight: '180px', objectFit: 'cover', display: 'block' }} />
                        <div
                          style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'opacity 0.2s', opacity: 0 }}
                          onMouseEnter={(e) => ((e.currentTarget as HTMLDivElement).style.opacity = '1')}
                          onMouseLeave={(e) => ((e.currentTarget as HTMLDivElement).style.opacity = '0')}>
                          <div style={{ textAlign: 'center' }}>
                            <Upload style={{ width: '24px', height: '24px', color: '#f59e0b', margin: '0 auto 6px' }} />
                            <div style={{ fontSize: '0.8rem', color: '#fff', fontWeight: 700 }}>Changer la photo</div>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div style={{ textAlign: 'center', padding: '24px' }}>
                        {uploadingPhoto ? (
                          <div style={{ color: '#f59e0b', fontSize: '0.88rem' }}>Chargement…</div>
                        ) : (
                          <>
                            <Upload style={{ width: '28px', height: '28px', color: '#f59e0b', margin: '0 auto 8px' }} />
                            <div style={{ fontSize: '0.85rem', color: '#f59e0b', fontWeight: 700 }}>Cliquer pour uploader une photo</div>
                            <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '4px' }}>JPG, PNG · Max 4 Mo</div>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                  <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePhotoChange} style={{ display: 'none' }} />

                  {/* URL fallback */}
                  <div style={{ marginTop: '8px', display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.72rem', color: '#64748b', whiteSpace: 'nowrap' }}>Ou URL :</span>
                    <input
                      type="text"
                      placeholder="https://…/image.jpg"
                      value={bannerImage.startsWith('data:') ? '' : bannerImage}
                      onChange={(e) => { setBannerImage(e.target.value); setBannerPreview(e.target.value); }}
                      style={{ flex: 1, height: '36px', background: '#161e33', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '8px', padding: '0 10px', color: '#fff', fontSize: '0.82rem', outline: 'none' }}
                    />
                    {bannerPreview && (
                      <button type="button" onClick={() => { setBannerImage(''); setBannerPreview(''); }} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px' }}>
                        <X style={{ width: '14px', height: '14px' }} />
                      </button>
                    )}
                  </div>
                </div>

                {/* ── ORGANISATEUR ── */}
                <div style={{ marginTop: '18px', paddingTop: '14px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                  <label style={{ ...LABEL, color: '#818cf8', fontSize: '0.92rem' }}>👤 Informations Organisateur</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '10px' }}>
                    <div>
                      <label style={LABEL}>Nom</label>
                      <input type="text" placeholder="Keril Kousso" value={organizerName} onChange={(e) => setOrganizerName(e.target.value)} style={SMALL_INPUT} />
                    </div>
                    <div>
                      <label style={LABEL}>Téléphone MoMo</label>
                      <input type="tel" placeholder="690123456" value={organizerPhone} onChange={(e) => setOrganizerPhone(e.target.value)} style={SMALL_INPUT} />
                    </div>
                  </div>
                  <div style={{ marginTop: '10px' }}>
                    <label style={LABEL}>Email</label>
                    <input type="email" placeholder="organisateur@email.com" value={organizerEmail} onChange={(e) => setOrganizerEmail(e.target.value)} style={SMALL_INPUT} />
                  </div>
                </div>

                {/* ── PASSES ── */}
                <div style={{ marginTop: '18px', paddingTop: '14px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                  <label style={{ ...LABEL, color: '#818cf8', fontSize: '0.92rem' }}>🎟️ Types de billets</label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '10px' }}>
                    {TICKET_PASS_TEMPLATES.map((tmpl) => {
                      const isSelected = selectedPasses.some((p) => p.name === tmpl.name);
                      const cur = selectedPasses.find((p) => p.name === tmpl.name);
                      return (
                        <div key={tmpl.id} style={{ padding: '10px 12px', borderRadius: '12px', background: isSelected ? 'rgba(129,140,248,0.12)' : '#161e33', border: isSelected ? '1.5px solid #818cf8' : '1.5px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap' }}>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', flex: 1 }}>
                            <input type="checkbox" checked={isSelected} onChange={() => handleTogglePassTemplate(tmpl)} style={{ width: '17px', height: '17px', accentColor: '#818cf8' }} />
                            <div>
                              <div style={{ fontSize: '0.9rem', fontWeight: 800 }}>{tmpl.name}</div>
                              <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>{tmpl.description}</div>
                            </div>
                          </label>
                          {isSelected && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                <span style={{ fontSize: '0.6rem', color: '#818cf8', fontWeight: 700, marginBottom: '2px' }}>PRIX F</span>
                                <input type="number" value={cur?.price ?? tmpl.price} onChange={(e) => handleUpdatePassPrice(tmpl.name, parseInt(e.target.value) || 0)} style={{ width: '76px', height: '32px', background: '#0f1526', border: '1px solid #818cf8', borderRadius: '8px', color: '#fff', fontWeight: 800, fontSize: '0.82rem', textAlign: 'center' }} />
                              </div>
                              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                <span style={{ fontSize: '0.6rem', color: '#10b981', fontWeight: 700, marginBottom: '2px' }}>QTÉ</span>
                                <input type="number" value={(cur as any)?.quantity ?? 100} onChange={(e) => handleUpdatePassQty(tmpl.name, parseInt(e.target.value) || 0)} style={{ width: '64px', height: '32px', background: '#0f1526', border: '1px solid #10b981', borderRadius: '8px', color: '#fff', fontWeight: 800, fontSize: '0.82rem', textAlign: 'center' }} />
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {/* Custom passes added */}
                    {selectedPasses.filter((p) => !TICKET_PASS_TEMPLATES.some((t) => t.name === p.name)).map((p) => (
                      <div key={p.name} style={{ padding: '10px 12px', borderRadius: '12px', background: 'rgba(129,140,248,0.12)', border: '1.5px solid #818cf8', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: '0.9rem', fontWeight: 800 }}>{p.name}</div>
                          <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>{p.price.toLocaleString('fr-FR')} FCFA · {(p as any).quantity || '?'} places</div>
                        </div>
                        <button type="button" onClick={() => handleRemoveCustomPass(p.name)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}>
                          <X style={{ width: '16px', height: '16px' }} />
                        </button>
                      </div>
                    ))}

                    {/* Add custom pass */}
                    <div style={{ padding: '12px', borderRadius: '12px', background: '#161e33', border: '1.5px dashed rgba(255,255,255,0.1)' }}>
                      <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#64748b', marginBottom: '8px' }}>+ Ajouter un pass personnalisé</div>
                      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto', gap: '6px', alignItems: 'flex-end' }}>
                        <div>
                          <span style={{ fontSize: '0.65rem', color: '#94a3b8' }}>Nom</span>
                          <input type="text" placeholder="Diamond VIP…" value={customPassName} onChange={(e) => setCustomPassName(e.target.value)} style={{ ...SMALL_INPUT, marginTop: '2px', height: '36px', fontSize: '0.82rem' }} />
                        </div>
                        <div>
                          <span style={{ fontSize: '0.65rem', color: '#94a3b8' }}>Prix F</span>
                          <input type="number" value={customPassPrice} onChange={(e) => setCustomPassPrice(e.target.value)} style={{ ...SMALL_INPUT, marginTop: '2px', height: '36px', fontSize: '0.82rem' }} />
                        </div>
                        <div>
                          <span style={{ fontSize: '0.65rem', color: '#94a3b8' }}>Qté</span>
                          <input type="number" value={customPassQty} onChange={(e) => setCustomPassQty(e.target.value)} style={{ ...SMALL_INPUT, marginTop: '2px', height: '36px', fontSize: '0.82rem' }} />
                        </div>
                        <button type="button" onClick={handleAddCustomPass} disabled={!customPassName.trim()} style={{ height: '36px', paddingInline: '12px', borderRadius: '8px', background: '#818cf8', color: '#0f172a', border: 'none', fontWeight: 800, cursor: 'pointer', fontSize: '0.82rem', alignSelf: 'flex-end' }}>
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* ── ERROR / SUCCESS ── */}
                {errorMessage && (
                  <div style={{ background: 'rgba(239,68,68,0.15)', color: '#fca5a5', padding: '10px 14px', borderRadius: '10px', fontSize: '0.82rem', marginTop: '14px' }}>
                    {errorMessage}
                  </div>
                )}
                {createdOrgLink && (
                  <div style={{ background: 'rgba(16,185,129,0.12)', border: '1px solid #10b981', padding: '14px', borderRadius: '12px', marginTop: '14px' }}>
                    <p style={{ color: '#10b981', fontSize: '0.82rem', fontWeight: 800, marginBottom: '8px' }}>
                      {modalMode === 'edit' ? '✅ Événement modifié !' : '✅ Événement créé !'} Lien organisateur :
                    </p>
                    <div style={{ background: '#0f1526', borderRadius: '8px', padding: '10px 12px', fontSize: '0.78rem', color: '#a78bfa', wordBreak: 'break-all', fontFamily: 'monospace' }}>
                      {createdOrgLink}
                    </div>
                    <button type="button" onClick={() => { navigator.clipboard?.writeText(createdOrgLink).catch(() => {}); setCopiedToken('modal'); setTimeout(() => setCopiedToken(null), 2000); }} style={{ marginTop: '8px', padding: '8px 16px', borderRadius: '8px', background: '#818cf8', border: 'none', color: '#0f172a', fontWeight: 800, fontSize: '0.82rem', cursor: 'pointer' }}>
                      {copiedToken === 'modal' ? '✅ Copié !' : '📋 Copier le lien'}
                    </button>
                  </div>
                )}

                {/* ── SUBMIT ── */}
                <button type="submit" disabled={isSubmitting} style={{ width: '100%', marginTop: '22px', padding: '15px', borderRadius: '99px', border: 'none', background: '#818cf8', color: '#0f172a', fontSize: '1rem', fontWeight: 800, cursor: isSubmitting ? 'not-allowed' : 'pointer', boxShadow: '0 8px 24px rgba(129,140,248,0.35)', opacity: isSubmitting ? 0.7 : 1 }}>
                  {isSubmitting ? 'Enregistrement…' : modalMode === 'edit' ? '💾 Sauvegarder les modifications' : '🚀 Publier l\'Événement'}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </AdminAuthGuard>
  );
}

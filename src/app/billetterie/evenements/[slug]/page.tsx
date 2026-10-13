'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Calendar, MapPin, Users, Plus, Minus, ArrowLeft, Shield, Zap } from 'lucide-react';
import { useParams } from 'next/navigation';

interface TicketPass {
  id?: string;
  name: string;
  price: number;
  quantity?: number;
  description?: string;
}

interface Event {
  id: string;
  slug: string;
  title: string;
  subtitle?: string;
  date: string;
  venue: string;
  city?: string;
  bannerImage?: string;
  htmlContent?: string;
  passes: TicketPass[];
}

export default function EventDetailPage() {
  const params = useParams();
  const slug = params?.slug as string;

  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPass, setSelectedPass] = useState<TicketPass | null>(null);
  const [quantity, setQuantity] = useState(1);

  // Form
  const [buyerName, setBuyerName] = useState('');
  const [buyerEmail, setBuyerEmail] = useState('');
  const [buyerPhone, setBuyerPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;
    fetch(`/api/tickets/events?slug=${slug}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.success && d.data) setEvent(d.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [slug]);

  const total = selectedPass ? selectedPass.price * quantity : 0;

  const handleBuy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPass || !event) return;
    if (!buyerName.trim() || !buyerEmail.trim() || !buyerPhone.trim()) {
      setError('Veuillez remplir tous les champs.');
      return;
    }
    if (!buyerEmail.includes('@')) {
      setError('Adresse email invalide.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/pay/ticket', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId: event.id,
          eventTitle: event.title,
          eventSlug: event.slug,
          passId: selectedPass.id || selectedPass.name,
          passName: selectedPass.name,
          unitPrice: selectedPass.price,
          quantity,
          buyerName: buyerName.trim(),
          buyerEmail: buyerEmail.trim(),
          buyerPhone: buyerPhone.trim(),
        }),
      });

      const data = await res.json();

      if (data.success && data.paymentLink) {
        window.location.href = data.paymentLink;
      } else {
        setError(data.error || 'Erreur lors de la création du paiement.');
      }
    } catch {
      setError('Erreur réseau. Réessayez.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: 'var(--soft)' }}>
        <div style={{ textAlign: 'center', color: 'var(--mute)' }}>Chargement…</div>
      </div>
    );
  }

  if (!event) {
    return (
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: 'var(--soft)' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🔍</div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Événement introuvable</h2>
          <Link href="/billetterie/evenements" style={{ color: 'var(--p)', fontWeight: 700, marginTop: '12px', display: 'block' }}>
            ← Retour aux événements
          </Link>
        </div>
      </div>
    );
  }

  const hasHtml = Boolean(event.htmlContent && event.htmlContent.trim().length > 50);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--soft)', color: 'var(--ink)' }}>

      {/* BACK NAV */}
      <div style={{
        background: 'linear-gradient(135deg,#1B0E78,#27149F)',
        padding: 'clamp(14px,2.5vw,24px) clamp(16px,4vw,48px)',
        display: 'flex', alignItems: 'center', gap: '16px',
      }}>
        <Link href="/billetterie/evenements" style={{
          display: 'inline-flex', alignItems: 'center', gap: '6px',
          color: '#D9D4FA', fontWeight: 700, fontSize: '0.85rem', textDecoration: 'none',
        }}>
          <ArrowLeft style={{ width: '16px', height: '16px' }} /> Tous les événements
        </Link>
        <span style={{ color: 'rgba(255,255,255,0.3)' }}>·</span>
        <span style={{ color: '#fff', fontWeight: 700, fontSize: '0.9rem' }}>{event.title}</span>
      </div>

      {/* HTML TEMPLATE or BANNER IMAGE */}
      {hasHtml ? (
        <div style={{ width: '100%', background: '#000' }}>
          <iframe
            srcDoc={event.htmlContent}
            style={{ width: '100%', minHeight: 'clamp(400px, 60vw, 700px)', border: 'none', display: 'block' }}
            title={event.title}
            sandbox="allow-same-origin allow-scripts"
            loading="lazy"
          />
        </div>
      ) : (
        <div style={{ position: 'relative', height: 'clamp(220px, 35vw, 400px)' }}>
          <Image
            src={event.bannerImage || '/images/hero_bg.png'}
            alt={event.title}
            fill
            style={{ objectFit: 'cover' }}
          />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent 40%, rgba(15,10,50,0.8) 100%)' }} />
          <div style={{ position: 'absolute', bottom: '24px', left: 'clamp(16px,4vw,40px)', right: 'clamp(16px,4vw,40px)' }}>
            <h1 style={{ color: '#fff', fontSize: 'clamp(1.5rem,4vw,2.5rem)', fontWeight: 900, margin: '0 0 6px' }}>
              {event.title}
            </h1>
            {event.subtitle && <p style={{ color: '#D9D4FA', margin: 0 }}>{event.subtitle}</p>}
          </div>
        </div>
      )}

      {/* CONTENT */}
      <main style={{
        maxWidth: '1100px', margin: '0 auto',
        padding: 'clamp(20px,4vw,40px) clamp(16px,4vw,32px)',
        display: 'grid',
        gridTemplateColumns: 'minmax(0,1fr) minmax(280px,380px)',
        gap: '32px', alignItems: 'start',
      }}>
        {/* LEFT */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Title (shown below HTML if html is present) */}
          {hasHtml && (
            <div>
              <h1 style={{ margin: '0 0 6px', fontSize: 'clamp(1.4rem,3vw,2rem)', fontWeight: 900 }}>{event.title}</h1>
              {event.subtitle && <p style={{ margin: 0, color: 'var(--mute)' }}>{event.subtitle}</p>}
            </div>
          )}

          {/* Event info */}
          <div style={{ background: 'var(--bg)', borderRadius: '20px', padding: '24px', border: '1.5px solid var(--line)' }}>
            <h2 style={{ margin: '0 0 16px', fontSize: '1.05rem', fontWeight: 800 }}>📅 Informations</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'var(--soft)', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                  <Calendar style={{ width: '17px', height: '17px', color: 'var(--p)' }} />
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: '0.72rem', color: 'var(--mute)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Date</p>
                  <p style={{ margin: 0, fontWeight: 700 }}>{event.date}</p>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'var(--soft)', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                  <MapPin style={{ width: '17px', height: '17px', color: 'var(--p)' }} />
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: '0.72rem', color: 'var(--mute)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Lieu</p>
                  <p style={{ margin: 0, fontWeight: 700 }}>{event.venue}{event.city ? `, ${event.city}` : ''}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Pass selection */}
          <div style={{ background: 'var(--bg)', borderRadius: '20px', padding: '24px', border: '1.5px solid var(--line)' }}>
            <h2 style={{ margin: '0 0 16px', fontSize: '1.05rem', fontWeight: 800 }}>🎟️ Choisissez votre pass</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {event.passes.map((pass) => (
                <div
                  key={pass.name}
                  onClick={() => setSelectedPass(pass)}
                  style={{
                    padding: '16px 18px', borderRadius: '14px', cursor: 'pointer',
                    border: selectedPass?.name === pass.name ? '2px solid var(--p)' : '1.5px solid var(--line)',
                    background: selectedPass?.name === pass.name ? 'rgba(91,61,245,0.06)' : 'var(--soft)',
                    transition: 'all 0.18s',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      width: '14px', height: '14px', borderRadius: '50%', flexShrink: 0,
                      background: selectedPass?.name === pass.name ? 'var(--p)' : 'var(--line)',
                      boxShadow: selectedPass?.name === pass.name ? '0 0 0 4px rgba(91,61,245,0.2)' : 'none',
                    }} />
                    <div>
                      <p style={{ margin: 0, fontWeight: 800, fontSize: '0.95rem' }}>{pass.name}</p>
                      {pass.description && <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: 'var(--mute)' }}>{pass.description}</p>}
                      {pass.quantity !== undefined && (
                        <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: 'var(--mute)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Users style={{ width: '11px', height: '11px' }} /> {pass.quantity} places
                        </p>
                      )}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <p style={{ margin: 0, fontWeight: 900, fontSize: '1.15rem', color: 'var(--p)' }}>
                      {pass.price.toLocaleString('fr-FR')}
                    </p>
                    <p style={{ margin: 0, fontSize: '0.72rem', color: 'var(--mute)', fontWeight: 700 }}>FCFA</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Guarantees */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            {[
              { icon: <Shield style={{ width: '20px', height: '20px', color: '#10b981' }} />, title: 'Paiement sécurisé', desc: 'Orange Money & MTN MoMo' },
              { icon: <Zap style={{ width: '20px', height: '20px', color: '#f59e0b' }} />, title: 'E-billet instantané', desc: 'Reçu par email immédiatement' },
            ].map((g) => (
              <div key={g.title} style={{ background: 'var(--bg)', borderRadius: '14px', padding: '16px', border: '1.5px solid var(--line)', display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                {g.icon}
                <div>
                  <p style={{ margin: '0 0 2px', fontWeight: 800, fontSize: '0.85rem' }}>{g.title}</p>
                  <p style={{ margin: 0, fontSize: '0.76rem', color: 'var(--mute)' }}>{g.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT — Purchase form (sticky) */}
        <div style={{ position: 'sticky', top: '20px' }}>
          <div style={{ background: 'var(--bg)', borderRadius: '20px', padding: '24px', border: '1.5px solid var(--line)', boxShadow: '0 8px 32px rgba(39,20,159,0.1)' }}>
            <h2 style={{ margin: '0 0 20px', fontSize: '1.05rem', fontWeight: 800 }}>
              {selectedPass ? `Réserver — ${selectedPass.name}` : '👆 Sélectionnez un pass'}
            </h2>

            {selectedPass ? (
              <form onSubmit={handleBuy} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {/* Quantity */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '8px' }}>Nombre de places</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <button type="button" onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      style={{ width: '38px', height: '38px', borderRadius: '10px', border: '1.5px solid var(--line)', background: 'var(--soft)', cursor: 'pointer', display: 'grid', placeItems: 'center' }}>
                      <Minus style={{ width: '16px', height: '16px' }} />
                    </button>
                    <span style={{ fontWeight: 900, fontSize: '1.3rem', minWidth: '32px', textAlign: 'center' }}>{quantity}</span>
                    <button type="button" onClick={() => setQuantity(Math.min(10, quantity + 1))}
                      style={{ width: '38px', height: '38px', borderRadius: '10px', border: '1.5px solid var(--line)', background: 'var(--soft)', cursor: 'pointer', display: 'grid', placeItems: 'center' }}>
                      <Plus style={{ width: '16px', height: '16px' }} />
                    </button>
                    <span style={{ fontSize: '0.78rem', color: 'var(--mute)' }}>max 10</span>
                  </div>
                </div>

                {/* Name */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '6px' }}>Nom complet *</label>
                  <input type="text" required placeholder="Jean DUPONT" value={buyerName} onChange={(e) => setBuyerName(e.target.value)}
                    style={{ width: '100%', height: '44px', borderRadius: '12px', border: '1.5px solid var(--line)', background: 'var(--soft)', padding: '0 14px', fontSize: '0.9rem', boxSizing: 'border-box', color: 'var(--ink)' }} />
                </div>

                {/* Email */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '6px' }}>Email *</label>
                  <input type="email" required placeholder="votre@email.com" value={buyerEmail} onChange={(e) => setBuyerEmail(e.target.value)}
                    style={{ width: '100%', height: '44px', borderRadius: '12px', border: '1.5px solid var(--line)', background: 'var(--soft)', padding: '0 14px', fontSize: '0.9rem', boxSizing: 'border-box', color: 'var(--ink)' }} />
                </div>

                {/* Phone */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '6px' }}>Téléphone Mobile Money *</label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <div style={{ background: 'var(--soft)', border: '1.5px solid var(--line)', borderRadius: '12px', padding: '0 12px', height: '44px', display: 'flex', alignItems: 'center', fontSize: '0.85rem', fontWeight: 700, flexShrink: 0 }}>
                      🇨🇲 +237
                    </div>
                    <input type="tel" required placeholder="690 000 000" value={buyerPhone} onChange={(e) => setBuyerPhone(e.target.value)}
                      style={{ flex: 1, height: '44px', borderRadius: '12px', border: '1.5px solid var(--line)', background: 'var(--soft)', padding: '0 14px', fontSize: '0.9rem', boxSizing: 'border-box', color: 'var(--ink)' }} />
                  </div>
                </div>

                {error && (
                  <div style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', padding: '10px 14px', borderRadius: '10px', fontSize: '0.84rem', fontWeight: 600 }}>
                    {error}
                  </div>
                )}

                {/* Total */}
                <div style={{ background: 'var(--soft)', borderRadius: '12px', padding: '14px', border: '1.5px solid var(--line)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--mute)', marginBottom: '6px' }}>
                    <span>{selectedPass.name} × {quantity}</span>
                    <span>{(selectedPass.price * quantity).toLocaleString('fr-FR')} FCFA</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 900, fontSize: '1.1rem' }}>
                    <span>Total</span>
                    <span style={{ color: 'var(--p)' }}>{total.toLocaleString('fr-FR')} FCFA</span>
                  </div>
                </div>

                <button type="submit" disabled={submitting}
                  style={{
                    width: '100%', padding: '16px', borderRadius: '14px', border: 'none',
                    background: submitting ? '#9ca3af' : 'linear-gradient(135deg,#27149F,#4B2CE0)',
                    color: '#fff', fontWeight: 800, fontSize: '1rem', cursor: submitting ? 'not-allowed' : 'pointer',
                    boxShadow: submitting ? 'none' : '0 8px 24px rgba(39,20,159,0.35)',
                    transition: 'all 0.2s',
                  }}>
                  {submitting ? '⏳ Redirection…' : `🎟️ Payer ${total.toLocaleString('fr-FR')} FCFA`}
                </button>

                <p style={{ textAlign: 'center', fontSize: '0.76rem', color: 'var(--mute)', margin: 0 }}>
                  🔒 Paiement sécurisé · Orange Money & MTN MoMo
                </p>
              </form>
            ) : (
              <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--mute)' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>🎟️</div>
                <p style={{ fontSize: '0.9rem', lineHeight: 1.6 }}>
                  Sélectionnez un type de pass<br />dans la liste à gauche
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

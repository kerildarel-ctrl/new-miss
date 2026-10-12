'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Calendar, MapPin, Ticket, ArrowRight, Search } from 'lucide-react';

interface TicketPass {
  id: string;
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
  passes: TicketPass[];
  status?: string;
}

export default function EvenementsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetch('/api/tickets/events')
      .then((r) => r.json())
      .then((d) => {
        if (d.success && Array.isArray(d.data)) {
          setEvents(d.data.filter((e: Event) => e.status !== 'DRAFT'));
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = events.filter((e) =>
    !search || e.title.toLowerCase().includes(search.toLowerCase()) ||
    (e.city || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ minHeight: '100vh', background: 'var(--soft)', color: 'var(--ink)' }}>
      {/* HERO */}
      <div style={{
        background: 'linear-gradient(135deg,#1B0E78 0%,#27149F 55%,#4B2CE0 100%)',
        padding: 'clamp(48px,8vw,96px) clamp(16px,5vw,64px) clamp(40px,6vw,72px)',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 70% 30%, rgba(255,255,255,0.04) 0%, transparent 60%)', pointerEvents: 'none' }} />
        <p style={{ color: '#BDB6EE', fontSize: '0.8rem', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '12px' }}>
          🎟️ VoteMoi Billetterie
        </p>
        <h1 style={{ color: '#ffffff', fontSize: 'clamp(2rem,5vw,3.2rem)', fontWeight: 900, margin: '0 0 16px', lineHeight: 1.15 }}>
          Tous les événements
        </h1>
        <p style={{ color: '#D9D4FA', fontSize: 'clamp(0.95rem,2vw,1.1rem)', maxWidth: '540px', margin: '0 auto 32px', lineHeight: 1.6 }}>
          Achetez vos billets en ligne et recevez votre e-billet instantanément.
        </p>

        {/* Search */}
        <div style={{ position: 'relative', maxWidth: '440px', margin: '0 auto' }}>
          <Search style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#8b8fae', width: '18px', height: '18px' }} />
          <input
            type="text"
            placeholder="Rechercher un événement, une ville…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: '100%', paddingLeft: '48px', paddingRight: '20px',
              height: '52px', borderRadius: '14px',
              background: 'rgba(255,255,255,0.12)',
              border: '1.5px solid rgba(255,255,255,0.2)',
              color: '#ffffff', fontSize: '0.95rem',
              backdropFilter: 'blur(12px)',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>
      </div>

      {/* EVENTS GRID */}
      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: 'clamp(24px,4vw,48px) clamp(16px,4vw,32px)' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px', color: 'var(--mute)', fontSize: '1rem' }}>
            Chargement des événements…
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px' }}>
            <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🎭</div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '8px' }}>
              {search ? 'Aucun résultat' : 'Aucun événement disponible'}
            </h2>
            <p style={{ color: 'var(--mute)' }}>
              {search ? 'Essayez un autre terme de recherche.' : 'Revenez bientôt pour découvrir les prochains événements.'}
            </p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px' }}>
            {filtered.map((evt) => {
              const minPrice = evt.passes.length > 0 ? Math.min(...evt.passes.map((p) => p.price)) : 0;
              return (
                <Link
                  key={evt.id}
                  href={`/billetterie/evenements/${evt.slug}`}
                  style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}
                >
                  <div style={{
                    background: 'var(--bg)', borderRadius: '20px',
                    border: '1.5px solid var(--line)', overflow: 'hidden',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    cursor: 'pointer',
                  }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-4px)';
                      (e.currentTarget as HTMLDivElement).style.boxShadow = '0 12px 40px rgba(39,20,159,0.18)';
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)';
                      (e.currentTarget as HTMLDivElement).style.boxShadow = 'none';
                    }}
                  >
                    {/* Banner */}
                    <div style={{ position: 'relative', height: '190px' }}>
                      <Image
                        src={evt.bannerImage || '/images/hero_bg.png'}
                        alt={evt.title}
                        fill
                        style={{ objectFit: 'cover' }}
                      />
                      <div style={{
                        position: 'absolute', inset: 0,
                        background: 'linear-gradient(to top, rgba(15,10,50,0.7) 0%, transparent 50%)',
                      }} />
                      {minPrice > 0 && (
                        <div style={{
                          position: 'absolute', bottom: '12px', left: '14px',
                          background: 'rgba(39,20,159,0.9)', backdropFilter: 'blur(8px)',
                          color: '#fff', padding: '5px 12px', borderRadius: '99px',
                          fontSize: '0.82rem', fontWeight: 800,
                        }}>
                          À partir de {minPrice.toLocaleString('fr-FR')} FCFA
                        </div>
                      )}
                      <div style={{
                        position: 'absolute', top: '12px', right: '12px',
                        background: 'rgba(16,185,129,0.9)', color: '#fff',
                        padding: '4px 10px', borderRadius: '99px', fontSize: '0.72rem', fontWeight: 800,
                      }}>
                        🟢 Disponible
                      </div>
                    </div>

                    {/* Content */}
                    <div style={{ padding: '20px' }}>
                      <h2 style={{ margin: '0 0 8px', fontSize: '1.1rem', fontWeight: 800, lineHeight: 1.3 }}>
                        {evt.title}
                      </h2>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '16px' }}>
                        <p style={{ margin: 0, fontSize: '0.84rem', color: 'var(--mute)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Calendar style={{ width: '14px', height: '14px', flexShrink: 0 }} /> {evt.date}
                        </p>
                        <p style={{ margin: 0, fontSize: '0.84rem', color: 'var(--mute)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <MapPin style={{ width: '14px', height: '14px', flexShrink: 0 }} /> {evt.venue}{evt.city ? `, ${evt.city}` : ''}
                        </p>
                      </div>

                      {/* Pass badges */}
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '16px' }}>
                        {evt.passes.slice(0, 3).map((p) => (
                          <span key={p.name} style={{
                            background: 'var(--soft)', border: '1px solid var(--line)',
                            padding: '3px 8px', borderRadius: '8px', fontSize: '0.74rem', fontWeight: 700,
                          }}>
                            <Ticket style={{ width: '11px', height: '11px', display: 'inline', marginRight: '3px' }} />
                            {p.name}
                          </span>
                        ))}
                      </div>

                      <div style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        paddingTop: '12px', borderTop: '1px solid var(--line)',
                      }}>
                        <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--p)' }}>
                          {evt.passes.length} type{evt.passes.length > 1 ? 's' : ''} de billet
                        </span>
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: '4px',
                          color: 'var(--p)', fontWeight: 800, fontSize: '0.88rem',
                        }}>
                          Acheter <ArrowRight style={{ width: '14px', height: '14px' }} />
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}

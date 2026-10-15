'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Calendar, MapPin, Users, Plus, Minus, ArrowLeft, Shield, Zap, AlertTriangle } from 'lucide-react';
import { useParams } from 'next/navigation';

interface TicketPass {
  id?: string;
  name: string;
  price: number;
  quantity?: number;   // total capacity
  soldCount?: number;  // tickets sold (injected by API)
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

const inputStyle: React.CSSProperties = {
  width: '100%', height: '44px', borderRadius: '12px',
  border: '1.5px solid var(--line)', background: 'var(--soft)',
  padding: '0 14px', fontSize: '0.9rem', boxSizing: 'border-box', color: 'var(--ink)',
};

// ── Stock helper ──────────────────────────────────────────────────────────────
function getPassStock(pass: TicketPass): {
  capacity: number | null;
  remaining: number | null;
  soldOut: boolean;
  critical: boolean;   // ≤ 10% or ≤ 10 remaining
  warning: boolean;    // ≤ 30% remaining
} {
  if (pass.quantity === undefined || pass.quantity === null || pass.quantity <= 0) {
    return { capacity: null, remaining: null, soldOut: false, critical: false, warning: false };
  }
  const sold = pass.soldCount || 0;
  const remaining = Math.max(0, pass.quantity - sold);
  const pct = remaining / pass.quantity;
  const soldOut = remaining === 0;
  const critical = !soldOut && (remaining <= 10 || pct <= 0.1);
  const warning = !soldOut && !critical && (remaining <= 20 || pct <= 0.3);
  return { capacity: pass.quantity, remaining, soldOut, critical, warning };
}

export default function EventDetailPage() {
  const params = useParams();
  const slug = params?.slug as string;

  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPass, setSelectedPass] = useState<TicketPass | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [isMobile, setIsMobile] = useState(false);

  const [buyerName, setBuyerName] = useState('');
  const [buyerEmail, setBuyerEmail] = useState('');
  const [buyerPhone, setBuyerPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => {
    if (!slug) return;
    fetch(`/api/tickets/events?slug=${slug}`)
      .then((r) => r.json())
      .then((d) => { if (d.success && d.data) setEvent(d.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [slug]);

  // Compute selected pass stock
  const passStock = useMemo(() => selectedPass ? getPassStock(selectedPass) : null, [selectedPass]);

  // Max quantity: remaining stock or 10 (whichever smaller)
  const maxQty = passStock?.remaining !== null ? Math.min(10, passStock!.remaining!) : 10;

  const total = selectedPass ? selectedPass.price * quantity : 0;

  const handleBuy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPass || !event) return;
    if (!buyerName.trim() || !buyerEmail.trim() || !buyerPhone.trim()) {
      setError('Veuillez remplir tous les champs.'); return;
    }
    if (!buyerEmail.includes('@')) { setError('Adresse email invalide.'); return; }

    setSubmitting(true); setError(null);
    try {
      const res = await fetch('/api/pay/ticket', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId: event.id, eventTitle: event.title, eventSlug: event.slug,
          passId: selectedPass.id || selectedPass.name, passName: selectedPass.name,
          quantity,
          buyerName: buyerName.trim(), buyerEmail: buyerEmail.trim(), buyerPhone: buyerPhone.trim(),
        }),
      });
      const data = await res.json();
      if (data.success && data.paymentLink) window.location.href = data.paymentLink;
      else setError(data.error || 'Erreur lors de la création du paiement.');
    } catch {
      setError('Erreur réseau. Réessayez.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: 'var(--soft)' }}>
      <p style={{ color: 'var(--mute)' }}>Chargement…</p>
    </div>
  );

  if (!event) return (
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

  const hasHtml = Boolean(event.htmlContent && event.htmlContent.trim().length > 50);

  /* ── Pass stock badge ── */
  const StockBadge = ({ pass }: { pass: TicketPass }) => {
    const s = getPassStock(pass);
    if (s.capacity === null) return null;
    if (s.soldOut) return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'rgba(239,68,68,0.12)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.25)', borderRadius: '99px', padding: '2px 9px', fontSize: '0.7rem', fontWeight: 800, letterSpacing: '0.04em' }}>
        🔴 SOLD OUT
      </span>
    );
    if (s.critical) return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'rgba(245,158,11,0.12)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.3)', borderRadius: '99px', padding: '2px 9px', fontSize: '0.7rem', fontWeight: 800 }}>
        ⚠️ Plus que {s.remaining} place{s.remaining! > 1 ? 's' : ''} !
      </span>
    );
    if (s.warning) return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'rgba(234,179,8,0.1)', color: '#ca8a04', border: '1px solid rgba(234,179,8,0.25)', borderRadius: '99px', padding: '2px 9px', fontSize: '0.7rem', fontWeight: 700 }}>
        🟡 {s.remaining} places restantes
      </span>
    );
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: 'var(--mute)', fontSize: '0.72rem', fontWeight: 600 }}>
        <Users style={{ width: '11px', height: '11px' }} /> {s.remaining} / {s.capacity} dispo
      </span>
    );
  };

  /* ── Purchase form (reused in both mobile and desktop) ── */
  const purchaseForm = (
    <div style={{ background: 'var(--bg)', borderRadius: '20px', padding: '24px', border: '1.5px solid var(--line)', boxShadow: '0 8px 32px rgba(39,20,159,0.1)' }}>
      <h2 style={{ margin: '0 0 20px', fontSize: '1.05rem', fontWeight: 800 }}>
        {selectedPass ? `Réserver — ${selectedPass.name}` : '👆 Sélectionnez un pass'}
      </h2>

      {selectedPass ? (
        (() => {
          const stock = getPassStock(selectedPass);
          if (stock.soldOut) return (
            <div style={{ textAlign: 'center', padding: '28px 0' }}>
              <div style={{ fontSize: '2.8rem', marginBottom: '12px' }}>😔</div>
              <p style={{ fontWeight: 800, fontSize: '1.1rem', color: '#ef4444', marginBottom: '8px' }}>Pass épuisé</p>
              <p style={{ color: 'var(--mute)', fontSize: '0.85rem' }}>Ce pass est sold out. Choisissez un autre type de billet.</p>
            </div>
          );
          return (
            <form onSubmit={handleBuy} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

              {/* Stock warning banner */}
              {(stock.critical || stock.warning) && stock.remaining !== null && (
                <div style={{
                  background: stock.critical ? 'rgba(245,158,11,0.12)' : 'rgba(234,179,8,0.08)',
                  border: `1.5px solid ${stock.critical ? 'rgba(245,158,11,0.4)' : 'rgba(234,179,8,0.3)'}`,
                  borderRadius: '12px', padding: '10px 14px',
                  display: 'flex', alignItems: 'center', gap: '8px',
                  color: stock.critical ? '#b45309' : '#92400e',
                  fontSize: '0.82rem', fontWeight: 700,
                }}>
                  <AlertTriangle style={{ width: '15px', height: '15px', flexShrink: 0 }} />
                  {stock.critical
                    ? `⚠️ Attention ! Seulement ${stock.remaining} place${stock.remaining > 1 ? 's' : ''} disponible${stock.remaining > 1 ? 's' : ''} — réservez maintenant !`
                    : `🟡 Stock limité — ${stock.remaining} places restantes`}
                </div>
              )}

              {/* Quantity */}
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '8px' }}>Nombre de places</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <button type="button" onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    style={{ width: '38px', height: '38px', borderRadius: '10px', border: '1.5px solid var(--line)', background: 'var(--soft)', cursor: 'pointer', display: 'grid', placeItems: 'center' }}>
                    <Minus style={{ width: '16px', height: '16px' }} />
                  </button>
                  <span style={{ fontWeight: 900, fontSize: '1.3rem', minWidth: '32px', textAlign: 'center' }}>{quantity}</span>
                  <button type="button"
                    onClick={() => setQuantity(Math.min(maxQty, quantity + 1))}
                    disabled={quantity >= maxQty}
                    style={{ width: '38px', height: '38px', borderRadius: '10px', border: '1.5px solid var(--line)', background: quantity >= maxQty ? 'var(--line)' : 'var(--soft)', cursor: quantity >= maxQty ? 'not-allowed' : 'pointer', display: 'grid', placeItems: 'center', opacity: quantity >= maxQty ? 0.5 : 1 }}>
                    <Plus style={{ width: '16px', height: '16px' }} />
                  </button>
                  <span style={{ fontSize: '0.78rem', color: 'var(--mute)' }}>
                    {stock.remaining !== null ? `max ${maxQty}` : 'max 10'}
                  </span>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '6px' }}>Nom complet *</label>
                <input type="text" required placeholder="Jean DUPONT" value={buyerName} onChange={(e) => setBuyerName(e.target.value)} style={inputStyle} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '6px' }}>Email *</label>
                <input type="email" required placeholder="votre@email.com" value={buyerEmail} onChange={(e) => setBuyerEmail(e.target.value)} style={inputStyle} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '6px' }}>Téléphone Mobile Money *</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <div style={{ background: 'var(--soft)', border: '1.5px solid var(--line)', borderRadius: '12px', padding: '0 12px', height: '44px', display: 'flex', alignItems: 'center', fontSize: '0.85rem', fontWeight: 700, flexShrink: 0 }}>
                    🇨🇲 +237
                  </div>
                  <input type="tel" required placeholder="690 000 000" value={buyerPhone} onChange={(e) => setBuyerPhone(e.target.value)} style={{ ...inputStyle, flex: 1 }} />
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

              <button type="submit" disabled={submitting} style={{
                width: '100%', padding: '16px', borderRadius: '14px', border: 'none',
                background: submitting ? '#9ca3af' : 'linear-gradient(135deg,#27149F,#4B2CE0)',
                color: '#fff', fontWeight: 800, fontSize: '1rem',
                cursor: submitting ? 'not-allowed' : 'pointer',
                boxShadow: submitting ? 'none' : '0 8px 24px rgba(39,20,159,0.35)',
              }}>
                {submitting ? '⏳ Redirection…' : `🎟️ Payer ${total.toLocaleString('fr-FR')} FCFA`}
              </button>
              <p style={{ textAlign: 'center', fontSize: '0.76rem', color: 'var(--mute)', margin: 0 }}>
                🔒 Paiement sécurisé · Orange Money & MTN MoMo
              </p>
            </form>
          );
        })()
      ) : (
        <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--mute)' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>🎟️</div>
          <p style={{ fontSize: '0.9rem', lineHeight: 1.6 }}>Choisissez un type de pass<br />dans la liste ci-dessous</p>
        </div>
      )}
    </div>
  );

  /* ── Pass list (reused) ── */
  const passList = (
    <div style={{ background: 'var(--bg)', borderRadius: '20px', padding: '24px', border: '1.5px solid var(--line)' }}>
      <h2 style={{ margin: '0 0 16px', fontSize: '1.05rem', fontWeight: 800 }}>🎟️ Choisissez votre pass</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {event.passes.map((pass) => {
          const s = getPassStock(pass);
          const isSelected = selectedPass?.name === pass.name;
          return (
            <div
              key={pass.name}
              onClick={() => { if (!s.soldOut) { setSelectedPass(pass); setQuantity(1); } }}
              style={{
                padding: '16px 18px', borderRadius: '14px',
                cursor: s.soldOut ? 'not-allowed' : 'pointer',
                border: isSelected ? '2px solid var(--p)' : s.soldOut ? '1.5px solid rgba(239,68,68,0.3)' : '1.5px solid var(--line)',
                background: isSelected ? 'rgba(91,61,245,0.06)' : s.soldOut ? 'rgba(239,68,68,0.03)' : 'var(--soft)',
                opacity: s.soldOut ? 0.65 : 1,
                transition: 'all 0.18s',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0 }}>
                <div style={{
                  width: '14px', height: '14px', borderRadius: '50%', flexShrink: 0,
                  background: s.soldOut ? '#ef4444' : isSelected ? 'var(--p)' : 'var(--line)',
                  boxShadow: isSelected ? '0 0 0 4px rgba(91,61,245,0.2)' : 'none',
                }} />
                <div style={{ minWidth: 0 }}>
                  <p style={{ margin: 0, fontWeight: 800, fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    {pass.name}
                    {s.soldOut && <span style={{ fontSize: '0.68rem', fontWeight: 900, color: '#ef4444', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: '99px', padding: '1px 7px', letterSpacing: '0.04em' }}>SOLD OUT</span>}
                  </p>
                  {pass.description && <p style={{ margin: '2px 0 4px', fontSize: '0.8rem', color: 'var(--mute)' }}>{pass.description}</p>}
                  {/* Stock badge */}
                  <div style={{ marginTop: '4px' }}>
                    <StockBadge pass={pass} />
                  </div>
                </div>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: '8px' }}>
                <p style={{ margin: 0, fontWeight: 900, fontSize: '1.15rem', color: s.soldOut ? '#ef4444' : 'var(--p)', whiteSpace: 'nowrap', textDecoration: s.soldOut ? 'line-through' : 'none' }}>
                  {pass.price.toLocaleString('fr-FR')}
                </p>
                <p style={{ margin: 0, fontSize: '0.72rem', color: 'var(--mute)', fontWeight: 700 }}>FCFA</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: 'var(--soft)', color: 'var(--ink)' }}>
      {/* NAV BAR */}
      <div style={{ background: 'linear-gradient(135deg,#1B0E78,#27149F)', padding: '14px clamp(16px,4vw,48px)', display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
        <Link href="/billetterie/evenements" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#D9D4FA', fontWeight: 700, fontSize: '0.85rem', textDecoration: 'none', whiteSpace: 'nowrap' }}>
          <ArrowLeft style={{ width: '15px', height: '15px' }} /> Événements
        </Link>
        <span style={{ color: 'rgba(255,255,255,0.3)' }}>·</span>
        <span style={{ color: '#fff', fontWeight: 700, fontSize: '0.88rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{event.title}</span>
      </div>

      {/* HTML TEMPLATE or BANNER */}
      {hasHtml ? (
        <div style={{ width: '100%', background: '#000' }}>
          <iframe
            srcDoc={event.htmlContent}
            style={{ width: '100%', minHeight: isMobile ? '280px' : '500px', border: 'none', display: 'block' }}
            title={event.title}
            sandbox="allow-same-origin allow-scripts"
            loading="lazy"
          />
        </div>
      ) : (
        <div style={{ position: 'relative', height: isMobile ? '200px' : '340px', background: 'linear-gradient(135deg,#1B0E78,#4B2CE0)' }}>
          {event.bannerImage && event.bannerImage !== '/images/hero_bg.png' && (
            <Image src={event.bannerImage} alt={event.title} fill style={{ objectFit: 'cover' }} />
          )}
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent 30%, rgba(15,10,50,0.85) 100%)' }} />
          <div style={{ position: 'absolute', bottom: '20px', left: 'clamp(16px,4vw,40px)', right: 'clamp(16px,4vw,40px)' }}>
            <h1 style={{ color: '#fff', fontSize: 'clamp(1.4rem,4vw,2.4rem)', fontWeight: 900, margin: '0 0 6px', lineHeight: 1.2 }}>{event.title}</h1>
            {event.subtitle && <p style={{ color: '#D9D4FA', margin: 0, fontSize: '0.95rem' }}>{event.subtitle}</p>}
          </div>
        </div>
      )}

      {/* MAIN CONTENT */}
      <main style={{ maxWidth: '1100px', margin: '0 auto', padding: 'clamp(16px,3vw,36px) clamp(16px,4vw,32px)' }}>

        {/* MOBILE: single column stacked */}
        {isMobile ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {hasHtml && (
              <div>
                <h1 style={{ margin: '0 0 4px', fontSize: '1.4rem', fontWeight: 900 }}>{event.title}</h1>
                {event.subtitle && <p style={{ margin: 0, color: 'var(--mute)' }}>{event.subtitle}</p>}
              </div>
            )}

            {/* Info block */}
            <div style={{ background: 'var(--bg)', borderRadius: '16px', padding: '18px', border: '1.5px solid var(--line)', display: 'flex', gap: '20px' }}>
              <div>
                <p style={{ margin: 0, fontSize: '0.7rem', color: 'var(--mute)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Date</p>
                <p style={{ margin: '2px 0 0', fontWeight: 700, fontSize: '0.9rem' }}>{event.date}</p>
              </div>
              <div>
                <p style={{ margin: 0, fontSize: '0.7rem', color: 'var(--mute)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Lieu</p>
                <p style={{ margin: '2px 0 0', fontWeight: 700, fontSize: '0.9rem' }}>{event.venue}{event.city ? `, ${event.city}` : ''}</p>
              </div>
            </div>

            {/* Pass list */}
            {passList}

            {/* Purchase form */}
            {purchaseForm}
          </div>
        ) : (
          /* DESKTOP: 2-column grid */
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(300px,380px)', gap: '32px', alignItems: 'start' }}>
            {/* LEFT */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {hasHtml && (
                <div>
                  <h1 style={{ margin: '0 0 6px', fontSize: 'clamp(1.4rem,3vw,2rem)', fontWeight: 900 }}>{event.title}</h1>
                  {event.subtitle && <p style={{ margin: 0, color: 'var(--mute)' }}>{event.subtitle}</p>}
                </div>
              )}
              <div style={{ background: 'var(--bg)', borderRadius: '20px', padding: '24px', border: '1.5px solid var(--line)' }}>
                <h2 style={{ margin: '0 0 16px', fontSize: '1.05rem', fontWeight: 800 }}>📅 Informations</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {[
                    { Icon: Calendar, label: 'Date', val: event.date },
                    { Icon: MapPin, label: 'Lieu', val: `${event.venue}${event.city ? `, ${event.city}` : ''}` },
                  ].map(({ Icon, label, val }) => (
                    <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'var(--soft)', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                        <Icon style={{ width: '17px', height: '17px', color: 'var(--p)' }} />
                      </div>
                      <div>
                        <p style={{ margin: 0, fontSize: '0.72rem', color: 'var(--mute)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</p>
                        <p style={{ margin: 0, fontWeight: 700 }}>{val}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              {passList}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                {[
                  { icon: <Shield style={{ width: '20px', height: '20px', color: '#10b981' }} />, title: 'Paiement sécurisé', desc: 'Orange Money & MTN MoMo' },
                  { icon: <Zap style={{ width: '20px', height: '20px', color: '#f59e0b' }} />, title: 'E-billet instantané', desc: 'Reçu par email immédiatement' },
                ].map((g) => (
                  <div key={g.title} style={{ background: 'var(--bg)', borderRadius: '14px', padding: '16px', border: '1.5px solid var(--line)', display: 'flex', gap: '10px' }}>
                    {g.icon}
                    <div>
                      <p style={{ margin: '0 0 2px', fontWeight: 800, fontSize: '0.85rem' }}>{g.title}</p>
                      <p style={{ margin: 0, fontSize: '0.76rem', color: 'var(--mute)' }}>{g.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* RIGHT — sticky form */}
            <div style={{ position: 'sticky', top: '20px' }}>
              {purchaseForm}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

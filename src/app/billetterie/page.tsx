'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import {
  Ticket, Bell, CheckCircle2, QrCode, CreditCard,
  ArrowRight, Calendar, MapPin,
} from 'lucide-react';

interface EventSummary {
  id: string;
  slug: string;
  title: string;
  subtitle?: string;
  date: string;
  venue: string;
  city?: string;
  bannerImage?: string;
  passes: { name: string; price: number }[];
}

export default function BilletteriePage() {
  const [events, setEvents] = useState<EventSummary[]>([]);
  const [eventsLoaded, setEventsLoaded] = useState(false);

  // Waitlist form
  const [notifyEmail, setNotifyEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isNotified, setIsNotified] = useState(false);

  useEffect(() => {
    fetch('/api/tickets/events')
      .then((r) => r.json())
      .then((d) => {
        if (d.success && Array.isArray(d.data)) {
          setEvents(d.data.filter((e: any) => e.status !== 'DRAFT'));
        }
      })
      .catch(() => {})
      .finally(() => setEventsLoaded(true));
  }, []);

  const hasEvents = eventsLoaded && events.length > 0;

  const handleNotifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notifyEmail || !notifyEmail.includes('@')) return;
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/notify/billetterie', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: notifyEmail }),
      });
      const data = await res.json();
      if (data.success) setIsNotified(true);
      else alert(data.error || 'Erreur. Réessayez.');
    } catch {
      alert('Erreur réseau.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Header />

      <main className="flex-1" style={{ background: 'var(--soft)' }}>
        {/* ======= HERO ======= */}
        <section className="hero" id="billetterie-hero">
          <div className="wd">
            <div className="ht" style={{ maxWidth: '780px' }}>
              <p className="eb" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <Ticket className="w-4 h-4" />
                Billetterie Officielle VoteMoi
              </p>
              <h1>
                {hasEvents
                  ? 'Réservez vos billets dès maintenant'
                  : "Vos billets d'événements en ligne"}
              </h1>
              <p className="tg">Pass Standard, VIP et VVIP — achat rapide et sécurisé.</p>
              <p>
                Achetez vos billets en quelques secondes et recevez votre e-billet avec QR code directement dans votre boîte mail.
              </p>

              <div className="row" style={{ marginTop: '20px' }}>
                {hasEvents ? (
                  <Link href="/billetterie/evenements" className="btn wh">
                    🎟️ Voir tous les événements
                  </Link>
                ) : (
                  <Link href="/classement" className="btn wh">
                    Voir les classements
                  </Link>
                )}
                <Link href="/" className="btn ow">
                  Découvrir les compétitions
                </Link>
              </div>
            </div>
          </div>
        </section>

        <div className="wd" style={{ padding: '40px clamp(16px, 3vw, 32px) 80px' }}>

          {/* ======= EVENTS LIST (si événements disponibles) ======= */}
          {hasEvents ? (
            <div style={{ maxWidth: '960px', margin: '0 auto' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
                <h2 style={{ margin: 0, fontSize: 'clamp(1.2rem,3vw,1.6rem)', fontWeight: 900, color: 'var(--ink)' }}>
                  🎉 Événements disponibles ({events.length})
                </h2>
                <Link href="/billetterie/evenements" style={{ color: 'var(--p)', fontWeight: 700, textDecoration: 'none', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  Voir tout <ArrowRight style={{ width: '14px', height: '14px' }} />
                </Link>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
                {events.slice(0, 6).map((evt) => {
                  const minPrice = evt.passes.length > 0 ? Math.min(...evt.passes.map((p) => p.price)) : 0;
                  return (
                    <Link key={evt.id} href={`/billetterie/evenements/${evt.slug}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                      <div
                        className="db"
                        style={{
                          background: 'var(--bg)', borderRadius: '20px', border: '1.5px solid var(--line)',
                          overflow: 'hidden', cursor: 'pointer', transition: 'transform 0.2s, box-shadow 0.2s',
                        }}
                        onMouseEnter={(e) => {
                          (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-4px)';
                          (e.currentTarget as HTMLDivElement).style.boxShadow = '0 12px 36px rgba(39,20,159,0.16)';
                        }}
                        onMouseLeave={(e) => {
                          (e.currentTarget as HTMLDivElement).style.transform = '';
                          (e.currentTarget as HTMLDivElement).style.boxShadow = '';
                        }}
                      >
                        <div style={{ position: 'relative', height: '160px' }}>
                          <Image src={evt.bannerImage || '/images/hero_bg.png'} alt={evt.title} fill style={{ objectFit: 'cover' }} />
                          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(15,10,50,0.65) 0%, transparent 50%)' }} />
                          {minPrice > 0 && (
                            <div style={{ position: 'absolute', bottom: '10px', left: '12px', background: 'rgba(39,20,159,0.9)', color: '#fff', padding: '4px 10px', borderRadius: '99px', fontSize: '0.76rem', fontWeight: 800 }}>
                              Dès {minPrice.toLocaleString('fr-FR')} FCFA
                            </div>
                          )}
                        </div>
                        <div style={{ padding: '16px' }}>
                          <h3 style={{ margin: '0 0 6px', fontSize: '1rem', fontWeight: 800, lineHeight: 1.3 }}>{evt.title}</h3>
                          <p style={{ margin: '0 0 3px', fontSize: '0.8rem', color: 'var(--mute)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <Calendar style={{ width: '12px', height: '12px' }} /> {evt.date}
                          </p>
                          <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--mute)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <MapPin style={{ width: '12px', height: '12px' }} /> {evt.venue}
                          </p>
                          <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px solid var(--line)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.78rem', color: 'var(--mute)' }}>{evt.passes.length} type{evt.passes.length > 1 ? 's' : ''} de billet</span>
                            <span style={{ color: 'var(--p)', fontWeight: 800, fontSize: '0.84rem', display: 'flex', alignItems: 'center', gap: '3px' }}>
                              Acheter <ArrowRight style={{ width: '13px', height: '13px' }} />
                            </span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>

              {events.length > 6 && (
                <div style={{ textAlign: 'center', marginTop: '28px' }}>
                  <Link href="/billetterie/evenements" className="btn" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '12px 28px', borderRadius: '99px', fontWeight: 700 }}>
                    Voir tous les {events.length} événements <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              )}
            </div>

          ) : eventsLoaded ? (
            /* ======= PAS D'ÉVÉNEMENTS → WAITLIST ======= */
            <div className="db" style={{ maxWidth: '680px', margin: '0 auto', textAlign: 'center', padding: 'clamp(28px, 4vw, 44px)', background: 'var(--bg)', border: '1.5px solid var(--line)', borderRadius: '24px', boxShadow: 'var(--shadow)' }}>
              <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'rgba(91, 61, 245, 0.12)', color: 'var(--p)', display: 'grid', placeItems: 'center', margin: '0 auto 16px' }}>
                <Ticket className="w-7 h-7" />
              </div>
              <p className="eb" style={{ color: 'var(--p)', fontSize: '0.8rem', fontWeight: 700 }}>Accès Prioritaire</p>
              <h2 style={{ fontSize: 'clamp(1.3rem, 3vw, 1.6rem)', color: 'var(--ink)', marginTop: '4px', fontWeight: 800 }}>
                Soyez averti dès l&apos;ouverture des ventes
              </h2>
              <p className="mute sm" style={{ maxWidth: '460px', margin: '8px auto 0', lineHeight: 1.5 }}>
                Laissez votre adresse email pour recevoir votre notification prioritaire dès la mise en ligne des premiers billets.
              </p>

              {!isNotified ? (
                <form onSubmit={handleNotifySubmit} style={{ marginTop: '24px', display: 'flex', flexWrap: 'wrap', gap: '10px', justifyContent: 'center', maxWidth: '480px', margin: '24px auto 0' }}>
                  <input
                    type="email" required placeholder="Votre adresse email..."
                    value={notifyEmail} onChange={(e) => setNotifyEmail(e.target.value)}
                    style={{ flex: '1 1 240px', height: '46px', background: 'var(--soft)', border: '1.5px solid var(--line)', borderRadius: '12px', padding: '0 16px', fontSize: '0.92rem', color: 'var(--ink)', outline: 'none', marginTop: 0 }}
                  />
                  <button type="submit" disabled={isSubmitting} className="btn" style={{ height: '46px', padding: '0 24px', borderRadius: '12px', flexShrink: 0, display: 'inline-flex', alignItems: 'center', gap: '8px', fontWeight: 700, fontSize: '0.9rem', cursor: isSubmitting ? 'not-allowed' : 'pointer' }}>
                    <Bell className="w-4 h-4" />
                    <span>{isSubmitting ? 'Envoi...' : 'M\'avertir'}</span>
                  </button>
                </form>
              ) : (
                <div style={{ marginTop: '24px', padding: '14px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.12)', border: '1px solid #10b981', color: '#10b981', fontWeight: 700, fontSize: '0.92rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                  <span>Merci ! Vous serez le premier averti lors du lancement.</span>
                </div>
              )}
            </div>
          ) : (
            /* Chargement */
            <div style={{ textAlign: 'center', padding: '48px', color: 'var(--mute)' }}>Chargement…</div>
          )}

          {/* ======= FEATURES CARDS (toujours visibles) ======= */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px', marginTop: '48px', maxWidth: '960px', margin: '48px auto 0' }}>
            {[
              { icon: <Ticket className="w-5 h-5" />, title: 'Pass Standard & VIP', desc: "Des formules diversifiées : accès général, places premier rang et tables VVIP.", color: 'rgba(91,61,245,0.12)', textColor: 'var(--p)' },
              { icon: <QrCode className="w-5 h-5" />, title: 'E-Billet & QR Code Sécurisé', desc: "QR code unique scannable à l'entrée avec contrôle en temps réel.", color: 'rgba(91,61,245,0.12)', textColor: 'var(--p)' },
              { icon: <CreditCard className="w-5 h-5" />, title: 'Paiement Mobile 100% Sécurisé', desc: 'Achat immédiat via Orange Money et MTN Mobile Money.', color: 'rgba(255,90,126,0.12)', textColor: 'var(--a)' },
            ].map((card) => (
              <div key={card.title} className="db" style={{ background: 'var(--bg)', border: '1px solid var(--line)', borderRadius: '20px', padding: '24px', boxShadow: 'var(--shadow)' }}>
                <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: card.color, color: card.textColor, display: 'grid', placeItems: 'center', marginBottom: '14px' }}>
                  {card.icon}
                </div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--ink)' }}>{card.title}</h3>
                <p className="mute sm" style={{ marginTop: '6px', lineHeight: 1.5 }}>{card.desc}</p>
              </div>
            ))}
          </div>

        </div>
      </main>

      <Footer />
    </>
  );
}

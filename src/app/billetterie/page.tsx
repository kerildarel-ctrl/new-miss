'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { TicketEvent, TicketPassCategory, IssuedTicket } from '@/data/mockTickets';

export default function BilletteriePage() {
  const [events, setEvents] = useState<TicketEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<TicketEvent | null>(null);
  const [selectedPass, setSelectedPass] = useState<TicketPassCategory | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [buyerName, setBuyerName] = useState('');
  const [buyerEmail, setBuyerEmail] = useState('');
  const [buyerPhone, setBuyerPhone] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [purchasedTicket, setPurchasedTicket] = useState<IssuedTicket | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Load Admin Created Events
  useEffect(() => {
    async function fetchEvents() {
      try {
        const res = await fetch('/api/tickets/events');
        const data = await res.json();
        if (data.success && Array.isArray(data.data)) {
          setEvents(data.data);
        }
      } catch {
        // Fallback empty
      } finally {
        setLoading(false);
      }
    }

    fetchEvents();
  }, []);

  const handleOpenBuyModal = (event: TicketEvent, pass: TicketPassCategory) => {
    setSelectedEvent(event);
    setSelectedPass(pass);
    setQuantity(1);
    setBuyerName('');
    setBuyerEmail('');
    setBuyerPhone('');
    setErrorMessage(null);
    setPurchasedTicket(null);
  };

  const handleBuyTicketSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEvent || !selectedPass) return;
    if (!buyerEmail || !buyerEmail.includes('@')) {
      setErrorMessage('Veuillez saisir une adresse email valide.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/tickets/buy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId: selectedEvent.id,
          eventTitle: selectedEvent.title,
          passName: selectedPass.name,
          unitPrice: selectedPass.price,
          quantity: quantity,
          buyerName: buyerName || 'Acheteur',
          buyerEmail: buyerEmail,
          buyerPhone: buyerPhone,
        }),
      });

      const data = await res.json();

      if (data.success && data.ticket) {
        setIsSubmitting(false);
        setPurchasedTicket(data.ticket);
      } else {
        setIsSubmitting(false);
        setErrorMessage(data.error || 'Erreur lors de l’émission du billet.');
      }
    } catch {
      setIsSubmitting(false);
      setErrorMessage('Erreur réseau. Impossible de finaliser la réservation.');
    }
  };

  return (
    <>
      <Header />

      <main style={{ minHeight: '80vh', paddingBottom: '60px', background: 'var(--soft)' }}>
        {/* HERO BANNER */}
        <section
          style={{
            background: 'var(--hero)',
            color: '#ffffff',
            padding: '50px 20px',
            textAlign: 'center',
          }}
        >
          <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                background: 'rgba(255, 255, 255, 0.15)',
                color: '#ffffff',
                padding: '4px 14px',
                borderRadius: '99px',
                fontSize: '0.85rem',
                fontWeight: 700,
                letterSpacing: '0.05em',
              }}
            >
              🎟️ BILLETTERIE OFFICIELLE
            </span>
            <h1
              style={{
                fontSize: 'clamp(2rem, 5vw, 3rem)',
                fontWeight: 900,
                marginTop: '12px',
                lineHeight: 1.15,
              }}
            >
              Vos Billets d&apos;Événements & Soirées de Gala
            </h1>
            <p
              style={{
                fontSize: '1.05rem',
                opacity: 0.9,
                marginTop: '10px',
                maxWidth: '600px',
                margin: '10px auto 0',
              }}
            >
              Réservez votre Pass en ligne et recevez votre **QR Code d&apos;accès à usage unique** instantanément.
            </p>
          </div>
        </section>

        {/* EVENTS SHOWCASE LIST */}
        <section style={{ maxWidth: '1100px', margin: '40px auto 0', padding: '0 20px' }}>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--ink)' }}>
            Événements disponibles
          </h2>

          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--mute)' }}>
              Chargement des événements de billetterie...
            </div>
          ) : events.length === 0 ? (
            <div
              style={{
                background: 'var(--bg)',
                borderRadius: '24px',
                padding: '48px 24px',
                textAlign: 'center',
                marginTop: '20px',
                border: '1.5px solid var(--line)',
                boxShadow: '0 10px 25px rgba(0, 0, 0, 0.05)',
              }}
            >
              <div style={{ fontSize: '3rem', marginBottom: '12px' }}>🎟️</div>
              <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--ink)' }}>
                Aucun événement disponible pour le moment
              </h3>
              <p style={{ color: 'var(--mute)', maxWidth: '480px', margin: '8px auto 20px', lineHeight: 1.5 }}>
                La billetterie n&apos;a pas encore d&apos;événement publié par l&apos;organisateur. Revenez très bientôt pour réserver vos Pass !
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', marginTop: '20px' }}>
              {events.map((evt) => (
                <div
                  key={evt.id}
                  style={{
                    background: 'var(--bg)',
                    borderRadius: '24px',
                    border: '1.5px solid var(--line)',
                    boxShadow: '0 12px 30px rgba(0, 0, 0, 0.08)',
                    overflow: 'hidden',
                  }}
                >
                  {/* EVENT HEADER WITH BANNER */}
                  <div style={{ position: 'relative', height: '220px', width: '100%' }}>
                    <Image
                      src={evt.bannerImage || '/images/hero_bg.png'}
                      alt={evt.title}
                      fill
                      style={{ objectFit: 'cover' }}
                    />
                    <div
                      style={{
                        position: 'absolute',
                        inset: 0,
                        background: 'linear-gradient(to top, rgba(15, 23, 42, 0.9) 0%, rgba(15, 23, 42, 0.2) 100%)',
                        display: 'flex',
                        alignItems: 'flex-end',
                        padding: '24px',
                      }}
                    >
                      <div>
                        <span
                          style={{
                            background: '#818cf8',
                            color: '#0f172a',
                            padding: '3px 10px',
                            borderRadius: '99px',
                            fontSize: '0.78rem',
                            fontWeight: 800,
                          }}
                        >
                          📍 {evt.venue}, {evt.city}
                        </span>
                        <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#ffffff', marginTop: '6px' }}>
                          {evt.title}
                        </h3>
                        <p style={{ color: '#cbd5e1', fontSize: '0.9rem', marginTop: '2px' }}>
                          📅 {evt.date}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* PASS CATEGORIES */}
                  <div style={{ padding: '24px' }}>
                    <h4 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--mute)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Choix du Pass & Tarifs :
                    </h4>

                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                        gap: '16px',
                        marginTop: '14px',
                      }}
                    >
                      {evt.passes.map((pass) => (
                        <div
                          key={pass.name}
                          style={{
                            padding: '18px',
                            borderRadius: '16px',
                            border: '1.5px solid var(--line)',
                            background: 'var(--soft)',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                            position: 'relative',
                          }}
                        >
                          {pass.badge && (
                            <span
                              style={{
                                position: 'absolute',
                                top: '12px',
                                right: '12px',
                                background: 'rgba(129, 140, 248, 0.15)',
                                border: '1px solid #818cf8',
                                color: 'var(--p)',
                                fontSize: '0.72rem',
                                fontWeight: 700,
                                padding: '2px 8px',
                                borderRadius: '99px',
                              }}
                            >
                              {pass.badge}
                            </span>
                          )}

                          <div>
                            <h5 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--ink)' }}>
                              {pass.name}
                            </h5>
                            <p style={{ fontSize: '0.85rem', color: 'var(--mute)', marginTop: '4px', lineHeight: 1.4 }}>
                              {pass.description}
                            </p>
                          </div>

                          <div
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              marginTop: '18px',
                              paddingTop: '12px',
                              borderTop: '1px solid var(--line)',
                            }}
                          >
                            <div style={{ fontSize: '1.3rem', fontWeight: 900, color: 'var(--p)' }}>
                              {pass.price.toLocaleString('fr-FR')}{' '}
                              <span style={{ fontSize: '0.82rem', fontWeight: 700 }}>FCFA</span>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleOpenBuyModal(evt, pass)}
                              style={{
                                padding: '10px 18px',
                                borderRadius: '99px',
                                background: 'var(--p)',
                                color: '#ffffff',
                                border: 'none',
                                fontWeight: 800,
                                fontSize: '0.88rem',
                                cursor: 'pointer',
                                boxShadow: '0 4px 12px rgba(129, 140, 248, 0.3)',
                              }}
                            >
                              Réserver 🎟️
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* TICKET PURCHASE MODAL */}
      {selectedEvent && selectedPass && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 100,
            display: 'grid',
            placeItems: 'center',
            background: 'rgba(8, 12, 24, 0.85)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            padding: '16px',
            overflowY: 'auto',
          }}
          onClick={() => setSelectedEvent(null)}
        >
          <div
            style={{
              margin: 'auto',
              position: 'relative',
              width: '100%',
              maxWidth: '460px',
              background: '#0f1526',
              color: '#ffffff',
              borderRadius: '24px',
              padding: '28px 24px',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              boxShadow: '0 25px 60px rgba(0, 0, 0, 0.7), 0 0 40px rgba(129, 140, 248, 0.15)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* CLOSE BUTTON */}
            <button
              type="button"
              onClick={() => setSelectedEvent(null)}
              aria-label="Fermer"
              style={{
                position: 'absolute',
                top: '20px',
                right: '20px',
                width: '32px',
                height: '32px',
                background: 'none',
                border: 'none',
                color: '#94a3b8',
                display: 'grid',
                placeItems: 'center',
                cursor: 'pointer',
                fontSize: '1.2rem',
              }}
            >
              ✕
            </button>

            {!purchasedTicket ? (
              <form onSubmit={handleBuyTicketSubmit}>
                <div style={{ color: '#818cf8', fontSize: '0.78rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                  🎟️ RÉSERVATION DE BILLET
                </div>

                <h2 style={{ marginTop: '6px', fontSize: '1.4rem', fontWeight: 800, color: '#ffffff' }}>
                  {selectedPass.name}
                </h2>
                <p style={{ fontSize: '0.84rem', color: '#94a3b8', marginTop: '2px' }}>
                  {selectedEvent.title}
                </p>

                {/* PRICE HIGHLIGHT */}
                <div
                  style={{
                    marginTop: '16px',
                    padding: '12px 16px',
                    borderRadius: '14px',
                    background: '#161e33',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div style={{ fontSize: '0.9rem', color: '#e2e8f0', fontWeight: 600 }}>
                    {quantity} Billet{quantity > 1 ? 's' : ''} ({selectedPass.price.toLocaleString('fr-FR')} FCFA / unité)
                  </div>
                  <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#818cf8' }}>
                    {(selectedPass.price * quantity).toLocaleString('fr-FR')} FCFA
                  </div>
                </div>

                {/* QUANTITY STEPPER */}
                <label style={{ display: 'block', marginTop: '16px', fontSize: '0.88rem', fontWeight: 700, color: '#ffffff' }}>
                  Nombre de billets
                </label>
                <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                  <button
                    type="button"
                    onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
                    style={{
                      width: '46px',
                      height: '44px',
                      borderRadius: '12px',
                      background: '#161e33',
                      border: '1.5px solid rgba(255, 255, 255, 0.15)',
                      color: '#ffffff',
                      fontSize: '1.3rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    style={{
                      flex: 1,
                      height: '44px',
                      background: '#161e33',
                      border: '1.5px solid rgba(255, 255, 255, 0.15)',
                      borderRadius: '12px',
                      color: '#ffffff',
                      fontSize: '1.2rem',
                      fontWeight: 800,
                      textAlign: 'center',
                      outline: 'none',
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setQuantity((prev) => prev + 1)}
                    style={{
                      width: '46px',
                      height: '44px',
                      borderRadius: '12px',
                      background: '#161e33',
                      border: '1.5px solid rgba(255, 255, 255, 0.15)',
                      color: '#ffffff',
                      fontSize: '1.3rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    +
                  </button>
                </div>

                {/* BUYER NAME */}
                <label style={{ display: 'block', marginTop: '14px', fontSize: '0.88rem', fontWeight: 700, color: '#ffffff' }}>
                  Nom & Prénom du Titulaire
                </label>
                <input
                  type="text"
                  required
                  placeholder="ex. Keril KOUSSO"
                  value={buyerName}
                  onChange={(e) => setBuyerName(e.target.value)}
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

                {/* BUYER EMAIL */}
                <label style={{ display: 'block', marginTop: '14px', fontSize: '0.88rem', fontWeight: 700, color: '#ffffff' }}>
                  ✉️ Adresse Email de Réception
                </label>
                <input
                  type="email"
                  required
                  placeholder="ex. votre.email@exemple.com"
                  value={buyerEmail}
                  onChange={(e) => setBuyerEmail(e.target.value)}
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

                {errorMessage && (
                  <div style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#fca5a5', padding: '10px', borderRadius: '10px', fontSize: '0.82rem', marginTop: '12px' }}>
                    {errorMessage}
                  </div>
                )}

                {/* SUBMIT BUTTON */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  style={{
                    width: '100%',
                    marginTop: '20px',
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
                  {isSubmitting ? 'Émission en cours...' : `Générer mon Billet (${(selectedPass.price * quantity).toLocaleString('fr-FR')} FCFA)`}
                </button>
              </form>
            ) : (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '8px' }}>🎟️</div>
                <p style={{ color: '#10b981', fontWeight: 800, fontSize: '0.95rem' }}>Billet Émis avec Succès !</p>
                <h3 style={{ marginTop: '4px', fontSize: '1.3rem', fontWeight: 800, color: '#ffffff' }}>
                  {purchasedTicket.passName}
                </h3>
                <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginTop: '4px' }}>
                  Code Unique : <b style={{ color: '#818cf8' }}>{purchasedTicket.ticketCode}</b>
                </p>

                <Link
                  href={`/billetterie/${purchasedTicket.ticketCode}`}
                  style={{
                    display: 'block',
                    width: '100%',
                    marginTop: '20px',
                    padding: '14px',
                    borderRadius: '99px',
                    background: '#818cf8',
                    color: '#0f172a',
                    fontWeight: 800,
                    fontSize: '0.95rem',
                    textDecoration: 'none',
                    textAlign: 'center',
                  }}
                >
                  Voir mon Billet & QR Code 📲
                </Link>
              </div>
            )}
          </div>
        </div>
      )}

      <Footer />
    </>
  );
}

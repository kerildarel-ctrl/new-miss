'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import {
  Ticket,
  Clock,
  Bell,
  CheckCircle2,
  QrCode,
  ShieldCheck,
  CreditCard,
  ArrowRight,
} from 'lucide-react';

export default function BilletteriePage() {
  const [notifyEmail, setNotifyEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isNotified, setIsNotified] = useState(false);

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
      if (data.success) {
        setIsNotified(true);
      } else {
        alert(data.error || 'Erreur lors de l\'envoi. Réessayez.');
      }
    } catch {
      alert('Erreur réseau. Réessayez.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Header />

      <main className="flex-1" style={{ background: 'var(--soft)' }}>
        {/* ========================================================================= */}
        {/* HERO SECTION — EXACT HOME PAGE PALETTE (--hero, Poppins) */}
        {/* ========================================================================= */}
        <section className="hero" id="billetterie-hero">
          <div className="wd">
            <div className="ht" style={{ maxWidth: '780px' }}>
              <p className="eb" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <Clock className="w-4 h-4" />
                Coming Soon • Bientôt Disponible
              </p>
              <h1>Billetterie Officielle</h1>
              <p className="tg">Vos billets et Pass d&apos;événements en ligne.</p>
              <p>
                La billetterie pour les soirées de gala, élections et grands événements arrive très prochainement.
                Restez connectés pour réserver vos pass exclusifs.
              </p>

              <div className="row" style={{ marginTop: '20px' }}>
                <Link href="/" className="btn wh">
                  Explorer les compétitions
                </Link>
                <Link href="/classement" className="btn ow">
                  Voir les classements
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* MAIN BODY CONTENT — EXACT SITE DESIGN SYSTEM */}
        {/* ========================================================================= */}
        <div className="wd" style={{ padding: '40px clamp(16px, 3vw, 32px) 80px' }}>
          
          {/* PRE-REGISTRATION / ALERT CARD */}
          <div
            className="db"
            style={{
              maxWidth: '680px',
              margin: '0 auto',
              textAlign: 'center',
              padding: 'clamp(28px, 4vw, 44px)',
              background: 'var(--bg)',
              border: '1.5px solid var(--line)',
              borderRadius: '24px',
              boxShadow: 'var(--shadow)',
            }}
          >
            <div
              style={{
                width: '60px',
                height: '60px',
                borderRadius: '50%',
                background: 'rgba(91, 61, 245, 0.12)',
                color: 'var(--p)',
                display: 'grid',
                placeItems: 'center',
                margin: '0 auto 16px',
              }}
            >
              <Ticket className="w-7 h-7" />
            </div>

            <p className="eb" style={{ color: 'var(--p)', fontSize: '0.8rem', fontWeight: 700 }}>
              Accès Prioritaire
            </p>
            <h2 style={{ fontSize: 'clamp(1.3rem, 3vw, 1.6rem)', color: 'var(--ink)', marginTop: '4px', fontWeight: 800 }}>
              Soyez averti dès l&apos;ouverture des ventes
            </h2>
            <p className="mute sm" style={{ maxWidth: '460px', margin: '8px auto 0', lineHeight: 1.5 }}>
              Laissez votre adresse email pour recevoir votre notification prioritaire dès la mise en ligne des premiers billets d&apos;événements.
            </p>

            {!isNotified ? (
              <form
                onSubmit={handleNotifySubmit}
                style={{
                  marginTop: '24px',
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '10px',
                  justifyContent: 'center',
                  maxWidth: '480px',
                  margin: '24px auto 0',
                }}
              >
                <input
                  type="email"
                  required
                  placeholder="Votre adresse email..."
                  value={notifyEmail}
                  onChange={(e) => setNotifyEmail(e.target.value)}
                  style={{
                    flex: '1 1 240px',
                    height: '46px',
                    background: 'var(--soft)',
                    border: '1.5px solid var(--line)',
                    borderRadius: '12px',
                    padding: '0 16px',
                    fontSize: '0.92rem',
                    color: 'var(--ink)',
                    outline: 'none',
                    marginTop: 0,
                  }}
                />
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn"
                  style={{
                    height: '46px',
                    padding: '0 24px',
                    borderRadius: '12px',
                    flexShrink: 0,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontWeight: 700,
                    fontSize: '0.9rem',
                    cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  }}
                >
                  <Bell className="w-4 h-4" />
                  <span>{isSubmitting ? 'Envoi...' : 'M’avertir'}</span>
                </button>
              </form>
            ) : (
              <div
                style={{
                  marginTop: '24px',
                  padding: '14px',
                  borderRadius: '12px',
                  background: 'rgba(16, 185, 129, 0.12)',
                  border: '1px solid #10b981',
                  color: '#10b981',
                  fontWeight: 700,
                  fontSize: '0.92rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                }}
              >
                <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                <span>Merci ! Vous serez le premier averti lors du lancement.</span>
              </div>
            )}
          </div>

          {/* 3 PREVIEWS CARDS — SAME CARD STYLE AS HOMEPAGE */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
              gap: '20px',
              marginTop: '36px',
              maxWidth: '960px',
              margin: '36px auto 0',
            }}
          >
            <div
              className="db"
              style={{
                background: 'var(--bg)',
                border: '1px solid var(--line)',
                borderRadius: '20px',
                padding: '24px',
                boxShadow: 'var(--shadow)',
              }}
            >
              <div
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '12px',
                  background: 'rgba(91, 61, 245, 0.12)',
                  color: 'var(--p)',
                  display: 'grid',
                  placeItems: 'center',
                  marginBottom: '14px',
                }}
              >
                <Ticket className="w-5 h-5" />
              </div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--ink)' }}>
                Pass Standard & VIP
              </h3>
              <p className="mute sm" style={{ marginTop: '6px', lineHeight: 1.5 }}>
                Des formules diversifiées : accès général, places privilégiées premier rang et tables d&apos;honneur VVIP.
              </p>
            </div>

            <div
              className="db"
              style={{
                background: 'var(--bg)',
                border: '1px solid var(--line)',
                borderRadius: '20px',
                padding: '24px',
                boxShadow: 'var(--shadow)',
              }}
            >
              <div
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '12px',
                  background: 'rgba(91, 61, 245, 0.12)',
                  color: 'var(--p)',
                  display: 'grid',
                  placeItems: 'center',
                  marginBottom: '14px',
                }}
              >
                <QrCode className="w-5 h-5" />
              </div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--ink)' }}>
                E-Billet & QR Code Sécurisé
              </h3>
              <p className="mute sm" style={{ marginTop: '6px', lineHeight: 1.5 }}>
                QR code unique scannable à l&apos;entrée avec contrôle en temps réel par les agents autorisés.
              </p>
            </div>

            <div
              className="db"
              style={{
                background: 'var(--bg)',
                border: '1px solid var(--line)',
                borderRadius: '20px',
                padding: '24px',
                boxShadow: 'var(--shadow)',
              }}
            >
              <div
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '12px',
                  background: 'rgba(255, 90, 126, 0.12)',
                  color: 'var(--a)',
                  display: 'grid',
                  placeItems: 'center',
                  marginBottom: '14px',
                }}
              >
                <CreditCard className="w-5 h-5" />
              </div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--ink)' }}>
                Paiement Mobile 100% Sécurisé
              </h3>
              <p className="mute sm" style={{ marginTop: '6px', lineHeight: 1.5 }}>
                Achat immédiat via Orange Money et MTN Mobile Money avec confirmation instantanée.
              </p>
            </div>
          </div>

          {/* REDIRECT ACTION LINK */}
          <div style={{ textAlign: 'center', marginTop: '40px' }}>
            <Link
              href="/"
              className="btn"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 28px',
                borderRadius: '99px',
                fontWeight: 700,
                fontSize: '0.95rem',
              }}
            >
              <span>Découvrir les Compétitions en Cours</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}

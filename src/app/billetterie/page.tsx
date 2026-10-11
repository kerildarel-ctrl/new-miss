'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import {
  Ticket,
  Sparkles,
  Bell,
  Clock,
  ShieldCheck,
  QrCode,
  ArrowRight,
  CheckCircle2,
  Calendar,
  Lock,
} from 'lucide-react';

export default function BilletteriePage() {
  const [notifyEmail, setNotifyEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isNotified, setIsNotified] = useState(false);

  const handleNotifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notifyEmail || !notifyEmail.includes('@')) return;

    setIsSubmitting(true);
    // Simulate save or submit to database
    try {
      await new Promise((res) => setTimeout(res, 600));
      setIsNotified(true);
    } catch {
      // Ignore
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Header />

      <main
        style={{
          minHeight: '82vh',
          background: 'var(--soft)',
          position: 'relative',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '40px 20px 80px',
        }}
      >
        {/* BACKGROUND GLOW ACCENTS */}
        <div
          style={{
            position: 'absolute',
            top: '-10%',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '600px',
            height: '400px',
            background: 'radial-gradient(circle, rgba(129, 140, 248, 0.18) 0%, rgba(99, 102, 241, 0.04) 60%, transparent 100%)',
            filter: 'blur(70px)',
            pointerEvents: 'none',
          }}
        />

        <div style={{ maxWidth: '820px', width: '100%', margin: '0 auto', textAlign: 'center', position: 'relative', zIndex: 1 }}>
          
          {/* BADGE COMING SOON */}
          <div style={{ marginBottom: '20px' }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 20px',
                borderRadius: '99px',
                background: 'rgba(129, 140, 248, 0.15)',
                border: '1.5px solid rgba(129, 140, 248, 0.35)',
                color: 'var(--p)',
                fontWeight: 900,
                fontSize: '0.86rem',
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                boxShadow: '0 4px 20px rgba(129, 140, 248, 0.15)',
              }}
            >
              <Clock className="w-4 h-4 animate-pulse" />
              <span>Coming Soon • Bientôt Disponible</span>
            </span>
          </div>

          {/* MAIN HERO TITLE */}
          <h1
            style={{
              fontSize: 'clamp(2.4rem, 6vw, 3.8rem)',
              fontWeight: 900,
              lineHeight: 1.12,
              letterSpacing: '-0.02em',
              color: 'var(--ink)',
            }}
          >
            La Billetterie Officielle <br />
            <span
              style={{
                background: 'linear-gradient(135deg, #4f46e5 0%, #ec4899 50%, #f59e0b 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Arrive Très Prochainement !
            </span>
          </h1>

          <p
            style={{
              fontSize: 'clamp(1rem, 2.5vw, 1.2rem)',
              color: 'var(--mute)',
              maxWidth: '640px',
              margin: '18px auto 0',
              lineHeight: 1.6,
            }}
          >
            Le service de réservation et d&apos;émission de billets électroniques pour les soirées de gala,
            élections et concerts prestigieux est en cours de finalisation. Restez à l&apos;affût !
          </p>

          {/* COMING SOON CARD WITH PRE-REGISTRATION EMAIL */}
          <div
            style={{
              marginTop: '40px',
              background: 'var(--bg)',
              borderRadius: '28px',
              padding: 'clamp(24px, 4vw, 36px)',
              border: '1.5px solid var(--line)',
              boxShadow: '0 25px 60px rgba(0, 0, 0, 0.08), 0 0 40px rgba(129, 140, 248, 0.06)',
            }}
          >
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '20px',
                background: 'linear-gradient(135deg, rgba(129, 140, 248, 0.2) 0%, rgba(236, 72, 153, 0.2) 100%)',
                color: 'var(--p)',
                display: 'grid',
                placeItems: 'center',
                margin: '0 auto 16px',
              }}
            >
              <Ticket className="w-8 h-8" />
            </div>

            <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--ink)' }}>
              Soyez le premier informé de l&apos;ouverture des ventes 🎟️
            </h2>
            <p style={{ fontSize: '0.92rem', color: 'var(--mute)', marginTop: '6px', maxWidth: '480px', margin: '6px auto 0' }}>
              Laissez votre adresse email pour recevoir votre invitation prioritaire et réserver vos Pass dès le lancement officiel.
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
                  maxWidth: '500px',
                  margin: '24px auto 0',
                }}
              >
                <input
                  type="email"
                  required
                  placeholder="Entrez votre adresse email..."
                  value={notifyEmail}
                  onChange={(e) => setNotifyEmail(e.target.value)}
                  style={{
                    flex: '1 1 260px',
                    height: '48px',
                    background: 'var(--soft)',
                    border: '1.5px solid var(--line)',
                    borderRadius: '14px',
                    padding: '0 16px',
                    fontSize: '0.95rem',
                    color: 'var(--ink)',
                    outline: 'none',
                  }}
                />
                <button
                  type="submit"
                  disabled={isSubmitting}
                  style={{
                    height: '48px',
                    padding: '0 24px',
                    borderRadius: '14px',
                    background: 'var(--p)',
                    color: '#ffffff',
                    fontWeight: 800,
                    fontSize: '0.92rem',
                    border: 'none',
                    cursor: isSubmitting ? 'not-allowed' : 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    boxShadow: '0 8px 20px rgba(124, 58, 237, 0.35)',
                  }}
                >
                  <Bell className="w-4 h-4" />
                  <span>{isSubmitting ? 'Enregistrement...' : 'M’avertir'}</span>
                </button>
              </form>
            ) : (
              <div
                style={{
                  marginTop: '24px',
                  padding: '16px',
                  borderRadius: '16px',
                  background: 'rgba(16, 185, 129, 0.12)',
                  border: '1.5px solid #10b981',
                  color: '#10b981',
                  fontWeight: 700,
                  fontSize: '0.95rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                }}
              >
                <CheckCircle2 className="w-5 h-5" />
                <span>Merci ! Vous serez le premier averti dès l’ouverture de la billetterie.</span>
              </div>
            )}
          </div>

          {/* FEATURE PREVIEWS GRID */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: '16px',
              marginTop: '32px',
              textAlign: 'left',
            }}
          >
            <div
              style={{
                background: 'var(--bg)',
                padding: '20px',
                borderRadius: '20px',
                border: '1px solid var(--line)',
              }}
            >
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '12px',
                  background: 'rgba(129, 140, 248, 0.15)',
                  color: 'var(--p)',
                  display: 'grid',
                  placeItems: 'center',
                  marginBottom: '12px',
                }}
              >
                <Ticket className="w-5 h-5" />
              </div>
              <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--ink)' }}>
                Pass Standard & VIP
              </h3>
              <p style={{ fontSize: '0.84rem', color: 'var(--mute)', marginTop: '4px', lineHeight: 1.45 }}>
                Des formules adaptées pour chaque expérience : places numérotées, carrés VIP et loges exclusives.
              </p>
            </div>

            <div
              style={{
                background: 'var(--bg)',
                padding: '20px',
                borderRadius: '20px',
                border: '1px solid var(--line)',
              }}
            >
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '12px',
                  background: 'rgba(16, 185, 129, 0.15)',
                  color: '#10b981',
                  display: 'grid',
                  placeItems: 'center',
                  marginBottom: '12px',
                }}
              >
                <QrCode className="w-5 h-5" />
              </div>
              <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--ink)' }}>
                QR Code Sécurisé Unique
              </h3>
              <p style={{ fontSize: '0.84rem', color: 'var(--mute)', marginTop: '4px', lineHeight: 1.45 }}>
                Billet numérique haute sécurité validé à l’entrée avec contrôle d’accès strict à usage unique.
              </p>
            </div>

            <div
              style={{
                background: 'var(--bg)',
                padding: '20px',
                borderRadius: '20px',
                border: '1px solid var(--line)',
              }}
            >
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '12px',
                  background: 'rgba(245, 158, 11, 0.15)',
                  color: '#f59e0b',
                  display: 'grid',
                  placeItems: 'center',
                  marginBottom: '12px',
                }}
              >
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--ink)' }}>
                Paiement Mobile Sécurisé
              </h3>
              <p style={{ fontSize: '0.84rem', color: 'var(--mute)', marginTop: '4px', lineHeight: 1.45 }}>
                Règlement simple et instantané via Orange Money, MTN Mobile Money et cartes bancaires.
              </p>
            </div>
          </div>

          {/* ACTION BUTTON TO RETURN TO CURRENT ELECTIONS / HOME */}
          <div style={{ marginTop: '36px' }}>
            <Link
              href="/"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '14px 28px',
                borderRadius: '99px',
                background: 'var(--ink)',
                color: 'var(--bg)',
                fontWeight: 800,
                fontSize: '0.95rem',
                textDecoration: 'none',
                boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)',
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

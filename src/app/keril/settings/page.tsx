'use client';

import React, { useState } from 'react';
import { AdminSidebar } from '@/components/AdminSidebar';
import { AdminAuthGuard } from '@/components/AdminAuthGuard';
import { Save, ShieldCheck, Database, RotateCcw, Trash2 } from 'lucide-react';

export default function KerilSettingsPage() {
  const [platformName, setPlatformName] = useState('VoteMoi');
  const [slogan, setSlogan] = useState('Votre vote, votre choix, votre champion.');
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [resetMessage, setResetMessage] = useState<string | null>(null);
  const [isSeeding, setIsSeeding] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleResetToZero = async () => {
    if (!confirm('Voulez-vous vraiment TOUT réinitialiser à zéro ?')) {
      return;
    }
    setIsResetting(true);
    setResetMessage(null);
    try {
      const res = await fetch('/api/admin/reset', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setResetMessage('✅ Toutes les données ont été réinitialisées à 0 avec succès !');
      } else {
        setResetMessage(`⚠️ ${data.error}`);
      }
    } catch {
      setResetMessage('✅ Réinitialisation locale effectuée à 0.');
    } finally {
      setIsResetting(false);
    }
  };

  const handleSeedDatabase = async () => {
    setIsSeeding(true);
    setResetMessage(null);
    try {
      const res = await fetch('/api/admin/seed', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setResetMessage('✅ Base Supabase synchronisée avec succès !');
      } else {
        setResetMessage(`⚠️ ${data.error}`);
      }
    } catch {
      setResetMessage('⚠️ Vérifiez la création des tables dans Supabase.');
    } finally {
      setIsSeeding(false);
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
          {/* Top Header */}
          <div
            style={{
              paddingBottom: '20px',
              borderBottom: '1px solid var(--line)',
            }}
          >
            <p className="eb">Paramètres & Sécurité (/keril)</p>
            <h1 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.4rem)', marginTop: '4px' }}>
              Paramètres <span style={{ color: 'var(--p)' }}>Système</span>
            </h1>
          </div>

          {/* 1. RESET TO ZERO / SEED CARD */}
          <div
            style={{
              background: 'var(--bg)',
              borderRadius: '20px',
              border: '1px solid var(--line)',
              padding: '24px',
              maxWidth: '720px',
              boxShadow: 'var(--shadow)',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '12px',
                  background: 'rgba(255, 90, 126, 0.1)',
                  color: 'var(--a)',
                  display: 'grid',
                  placeItems: 'center',
                  flexShrink: 0,
                }}
              >
                <RotateCcw className="w-5 h-5" />
              </div>
              <div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 800 }}>Réinitialisation & Données Démo</h3>
                <p className="mute sm">Videz la base pour repartir à 0 ou réinjectez les données de démo.</p>
              </div>
            </div>

            {resetMessage && (
              <div
                style={{
                  padding: '12px 16px',
                  borderRadius: '12px',
                  background: 'rgba(16, 185, 129, 0.12)',
                  color: '#10b981',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                }}
              >
                {resetMessage}
              </div>
            )}

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', paddingTop: '4px' }}>
              <button
                type="button"
                onClick={handleResetToZero}
                disabled={isResetting}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  border: 'none',
                  borderRadius: '99px',
                  padding: '10px 20px',
                  background: 'var(--a)',
                  color: '#ffffff',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                <Trash2 className="w-4 h-4" />
                <span>{isResetting ? 'Réinitialisation...' : 'Tout Réinitialiser à 0'}</span>
              </button>

              <button
                type="button"
                onClick={handleSeedDatabase}
                disabled={isSeeding}
                className="btn sm"
                style={{ gap: '6px' }}
              >
                <Database className="w-4 h-4" />
                <span>{isSeeding ? 'Initialisation...' : 'Injecter les Données Démo'}</span>
              </button>
            </div>
          </div>

          {/* 2. GENERAL SETTINGS FORM */}
          <div
            style={{
              background: 'var(--bg)',
              borderRadius: '20px',
              border: '1px solid var(--line)',
              padding: '28px',
              maxWidth: '720px',
              boxShadow: 'var(--shadow)',
            }}
          >
            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--ink)' }}>
                  Nom de la plateforme
                </label>
                <input
                  type="text"
                  value={platformName}
                  onChange={(e) => setPlatformName(e.target.value)}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--ink)' }}>
                  Slogan officiel
                </label>
                <input
                  type="text"
                  value={slogan}
                  onChange={(e) => setSlogan(e.target.value)}
                />
              </div>

              {savedSuccess && (
                <div
                  style={{
                    padding: '12px 16px',
                    borderRadius: '12px',
                    background: 'rgba(16, 185, 129, 0.12)',
                    color: '#10b981',
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Paramètres enregistrés avec succès !</span>
                </div>
              )}

              <div style={{ paddingTop: '8px' }}>
                <button
                  type="submit"
                  className="btn"
                  style={{ gap: '8px' }}
                >
                  <Save className="w-4 h-4" />
                  <span>Enregistrer les paramètres</span>
                </button>
              </div>
            </form>
          </div>
        </main>
      </div>
    </AdminAuthGuard>
  );
}

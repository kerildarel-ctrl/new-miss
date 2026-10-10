'use client';

import React, { useState, useEffect } from 'react';
import { Lock, KeyRound, ShieldAlert, Sparkles } from 'lucide-react';

interface AdminAuthGuardProps {
  children: React.ReactNode;
}

export const AdminAuthGuard: React.FC<AdminAuthGuardProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const auth = sessionStorage.getItem('keril_admin_auth');
      setIsAuthenticated(auth === 'true');
    }
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'Arielle74#') {
      sessionStorage.setItem('keril_admin_auth', 'true');
      setIsAuthenticated(true);
      setError(false);
    } else {
      setError(true);
    }
  };

  if (isAuthenticated === null) {
    return null; // Loading state
  }

  if (!isAuthenticated) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'grid',
          placeItems: 'center',
          padding: '16px',
          background: 'var(--soft)',
        }}
      >
        <div className="db" style={{ width: 'min(440px, 100%)', textAlign: 'center' }}>
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              background: 'rgba(91, 61, 245, 0.12)',
              color: 'var(--p)',
              display: 'grid',
              placeItems: 'center',
              margin: '0 auto 16px',
            }}
          >
            <Lock className="w-6 h-6" />
          </div>

          <p className="eb">Espace Sécurisé</p>
          <h2 style={{ marginTop: '4px' }}>Administration</h2>
          <p className="sm mute" style={{ marginTop: '4px' }}>
            Entrez le mot de passe pour déverrouiller l&apos;espace de gestion.
          </p>

          <form onSubmit={handleLogin} style={{ marginTop: '20px', textAlign: 'left' }}>
            <label
              style={{
                display: 'block',
                fontSize: '0.85rem',
                fontWeight: 600,
                marginBottom: '6px',
              }}
            >
              Mot de passe administrateur
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="password"
                required
                placeholder="Mot de passe..."
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError(false);
                }}
                style={{
                  width: '100%',
                  marginTop: 0,
                  borderColor: error ? 'var(--a)' : undefined,
                }}
              />
            </div>

            {error && (
              <div
                style={{
                  background: 'rgba(255, 90, 126, 0.12)',
                  color: 'var(--a)',
                  borderRadius: '12px',
                  padding: '10px 14px',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  marginTop: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <ShieldAlert className="w-4 h-4 flex-shrink-0" />
                <span>Mot de passe incorrect. Réessayez.</span>
              </div>
            )}

            <button
              type="submit"
              className="btn full"
              style={{ marginTop: '20px' }}
            >
              Déverrouiller le panneau Admin
            </button>
          </form>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

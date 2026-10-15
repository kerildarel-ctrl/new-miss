'use client';

import React from 'react';

interface State { hasError: boolean; message: string }

export class ErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error?.message || 'Erreur inconnue' };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[ErrorBoundary]', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh', display: 'grid', placeItems: 'center',
          background: '#0f0820', color: '#fff', fontFamily: 'sans-serif',
          padding: '24px', textAlign: 'center',
        }}>
          <div>
            <div style={{ fontSize: '3rem', marginBottom: '16px' }}>⚠️</div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '12px' }}>
              Une erreur est survenue
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem', marginBottom: '24px' }}>
              {this.state.message}
            </p>
            <a href="/" style={{
              display: 'inline-block', padding: '12px 28px', borderRadius: '12px',
              background: 'linear-gradient(135deg,#27149F,#4B2CE0)',
              color: '#fff', fontWeight: 700, textDecoration: 'none',
            }}>
              ← Retour à l&apos;accueil
            </a>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

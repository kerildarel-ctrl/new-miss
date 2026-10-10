'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { AdminAuthGuard } from '@/components/AdminAuthGuard';
import { IssuedTicket } from '@/data/mockTickets';
import { QrCode, CheckCircle2, XCircle, ArrowLeft, RefreshCw } from 'lucide-react';

function ScannerContent() {
  const searchParams = useSearchParams();
  const initialCode = searchParams.get('code') || '';

  const [inputCode, setInputCode] = useState(initialCode);
  const [loading, setLoading] = useState(false);
  const [scanResult, setScanResult] = useState<{
    status: 'VALIDATED' | 'ALREADY_USED' | 'NOT_FOUND' | 'ERROR';
    message: string;
    ticket?: IssuedTicket;
  } | null>(null);

  const handleValidateCode = async (codeToValidate: string) => {
    const code = codeToValidate.trim().toUpperCase();
    if (!code) return;

    setLoading(true);
    setScanResult(null);

    try {
      const res = await fetch('/api/tickets/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticketCode: code }),
      });

      const data = await res.json();

      setScanResult({
        status: data.status,
        message: data.message,
        ticket: data.ticket,
      });
    } catch {
      setScanResult({
        status: 'ERROR',
        message: 'Erreur réseau lors de la validation du billet.',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialCode) {
      handleValidateCode(initialCode);
    }
  }, [initialCode]);

  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    handleValidateCode(inputCode);
  };

  return (
    <div style={{ width: '100%', maxWidth: '480px', margin: '0 auto' }}>
      {/* BACK BREADCRUMB */}
      <Link
        href="/keril/tickets"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          color: '#818cf8',
          fontSize: '0.88rem',
          fontWeight: 700,
          textDecoration: 'none',
          marginBottom: '20px',
        }}
      >
        <ArrowLeft className="w-4 h-4" /> Retour au Tableau de bord
      </Link>

      {/* SCANNER TITLE */}
      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <div
          style={{
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            background: 'rgba(129, 140, 248, 0.2)',
            border: '1.5px solid #818cf8',
            color: '#818cf8',
            display: 'grid',
            placeItems: 'center',
            margin: '0 auto 12px',
          }}
        >
          <QrCode className="w-8 h-8" />
        </div>
        <h1 style={{ fontSize: '1.6rem', fontWeight: 900 }}>Contrôle d&apos;Accès & Scan</h1>
        <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginTop: '4px' }}>
          Scannez le QR Code du billet ou saisissez le code pour valider l&apos;entrée.
        </p>
      </div>

      {/* INPUT FORM FOR MANUAL OR CAM SCAN */}
      <form
        onSubmit={handleSubmitForm}
        style={{
          background: '#12182b',
          padding: '20px',
          borderRadius: '20px',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          marginBottom: '24px',
        }}
      >
        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#e2e8f0', marginBottom: '8px' }}>
          Code du Billet (ex. TCK-89A2F-2026)
        </label>
        <div style={{ display: 'flex', gap: '8px' }}>
          <input
            type="text"
            placeholder="Scanner ou saisir le code..."
            value={inputCode}
            onChange={(e) => setInputCode(e.target.value)}
            style={{
              flex: 1,
              height: '48px',
              background: '#1a233b',
              border: '1.5px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '12px',
              padding: '0 14px',
              color: '#ffffff',
              fontSize: '1rem',
              fontWeight: 700,
              outline: 'none',
            }}
          />
          <button
            type="submit"
            disabled={loading}
            style={{
              padding: '0 20px',
              height: '48px',
              borderRadius: '12px',
              background: '#818cf8',
              color: '#0f172a',
              fontWeight: 900,
              border: 'none',
              cursor: 'pointer',
              fontSize: '0.92rem',
            }}
          >
            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'SCAN'}
          </button>
        </div>
      </form>

      {/* SCAN RESULT BANNER - SINGLE USE VALIDATION FEEDBACK */}
      {scanResult && (
        <div
          style={{
            borderRadius: '24px',
            padding: '28px 20px',
            textAlign: 'center',
            animation: 'fadeIn 0.25s ease-out',
            background:
              scanResult.status === 'VALIDATED'
                ? 'rgba(16, 185, 129, 0.15)'
                : 'rgba(239, 68, 68, 0.15)',
            border:
              scanResult.status === 'VALIDATED'
                ? '2px solid #10b981'
                : '2px solid #ef4444',
            boxShadow:
              scanResult.status === 'VALIDATED'
                ? '0 15px 40px rgba(16, 185, 129, 0.25)'
                : '0 15px 40px rgba(239, 68, 68, 0.25)',
          }}
        >
          {/* ICON */}
          <div style={{ marginBottom: '14px' }}>
            {scanResult.status === 'VALIDATED' ? (
              <CheckCircle2 className="w-16 h-16 text-emerald-400 mx-auto" />
            ) : (
              <XCircle className="w-16 h-16 text-red-400 mx-auto" />
            )}
          </div>

          {/* MAIN STATUS TEXT */}
          <h2
            style={{
              fontSize: '1.5rem',
              fontWeight: 900,
              color: scanResult.status === 'VALIDATED' ? '#10b981' : '#ef4444',
              lineHeight: 1.25,
            }}
          >
            {scanResult.status === 'VALIDATED'
              ? '🟢 BILLET VALIDE - ACCÈS AUTORISÉ !'
              : scanResult.status === 'ALREADY_USED'
              ? '🔴 BILLET DÉJÀ UTILISÉ ! ACCÈS REFUSÉ.'
              : '⛔ BILLET INVALIDE OU INCONNU'}
          </h2>

          <p style={{ color: '#cbd5e1', fontSize: '0.92rem', marginTop: '8px', lineHeight: 1.4 }}>
            {scanResult.message}
          </p>

          {/* TICKET BUYER DETAILS */}
          {scanResult.ticket && (
            <div
              style={{
                marginTop: '20px',
                padding: '16px',
                borderRadius: '16px',
                background: 'rgba(0, 0, 0, 0.4)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                textAlign: 'left',
                fontSize: '0.88rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#94a3b8' }}>Titulaire :</span>
                <span style={{ fontWeight: 800, color: '#ffffff' }}>{scanResult.ticket.buyerName}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#94a3b8' }}>Pass :</span>
                <span style={{ fontWeight: 800, color: '#818cf8' }}>{scanResult.ticket.passName} ({scanResult.ticket.quantity})</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#94a3b8' }}>Événement :</span>
                <span style={{ fontWeight: 600, color: '#ffffff' }}>{scanResult.ticket.eventTitle}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#94a3b8' }}>Code :</span>
                <span style={{ fontFamily: 'monospace', fontWeight: 800, color: '#fbbf24' }}>{scanResult.ticket.ticketCode}</span>
              </div>
            </div>
          )}

          {/* BUTTON TO RESET FOR NEXT SCAN */}
          <button
            type="button"
            onClick={() => {
              setScanResult(null);
              setInputCode('');
            }}
            style={{
              width: '100%',
              marginTop: '20px',
              padding: '14px',
              borderRadius: '99px',
              border: 'none',
              background: scanResult.status === 'VALIDATED' ? '#10b981' : '#818cf8',
              color: '#ffffff',
              fontWeight: 900,
              fontSize: '0.95rem',
              cursor: 'pointer',
            }}
          >
            Scanner le Billet Suivant 📲
          </button>
        </div>
      )}
    </div>
  );
}

export default function KerilScanPage() {
  return (
    <AdminAuthGuard>
      <div
        style={{
          minHeight: '100vh',
          background: '#0a0e1a',
          color: '#ffffff',
          padding: '20px 16px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Suspense fallback={<div style={{ padding: '40px', color: '#818cf8' }}>Chargement du Scanner...</div>}>
          <ScannerContent />
        </Suspense>
      </div>
    </AdminAuthGuard>
  );
}

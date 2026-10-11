'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { AdminAuthGuard } from '@/components/AdminAuthGuard';
import { IssuedTicket } from '@/data/mockTickets';
import { QrCode, CheckCircle2, XCircle, ArrowLeft, Camera, RefreshCw, Volume2, ShieldCheck } from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';

function extractTicketCode(rawText: string): string {
  try {
    if (rawText.includes('code=')) {
      const url = new URL(rawText);
      const code = url.searchParams.get('code');
      if (code) return code.trim().toUpperCase();
    }
  } catch {
    // Not a URL
  }
  const match = rawText.match(/TCK-[A-Z0-9]+-[0-9]+/i);
  if (match) return match[0].toUpperCase();
  return rawText.trim().toUpperCase();
}

function ScannerContent() {
  const searchParams = useSearchParams();
  const initialCode = searchParams.get('code') || '';

  const [inputCode, setInputCode] = useState(initialCode);
  const [loading, setLoading] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const [scanResult, setScanResult] = useState<{
    status: 'VALIDATED' | 'ALREADY_USED' | 'NOT_FOUND' | 'ERROR';
    message: string;
    ticket?: IssuedTicket;
  } | null>(null);

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const isScanningRef = useRef(false);

  // Play audio sound on scan
  const playAudioFeedback = (isSuccess: boolean) => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.type = isSuccess ? 'sine' : 'sawtooth';
      osc.frequency.setValueAtTime(isSuccess ? 880 : 220, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.25);
    } catch {
      // Audio not supported or blocked
    }
  };

  const handleValidateCode = async (rawCode: string) => {
    const code = extractTicketCode(rawCode);
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

      const isSuccess = data.status === 'VALIDATED';
      playAudioFeedback(isSuccess);

      setScanResult({
        status: data.status,
        message: data.message,
        ticket: data.ticket,
      });
    } catch {
      playAudioFeedback(false);
      setScanResult({
        status: 'ERROR',
        message: 'Erreur réseau lors de la validation du billet.',
      });
    } finally {
      setLoading(false);
    }
  };

  // Start Camera
  const startCamera = async () => {
    setCameraError(null);
    try {
      if (!scannerRef.current) {
        scannerRef.current = new Html5Qrcode('qr-reader-viewport');
      }

      await scannerRef.current.start(
        { facingMode: 'environment' }, // Smartphone rear camera
        {
          fps: 10,
          qrbox: { width: 260, height: 260 },
          aspectRatio: 1.0,
        },
        (decodedText) => {
          if (!isScanningRef.current) {
            isScanningRef.current = true;
            handleValidateCode(decodedText);

            // Cooldown before scanning another code
            setTimeout(() => {
              isScanningRef.current = false;
            }, 3000);
          }
        },
        () => {
          // Frame error (silently ignore)
        }
      );

      setCameraActive(true);
    } catch (err: any) {
      setCameraError(
        'Impossible d’activer la caméra. Assurez-vous d’autoriser l’accès à la caméra dans votre navigateur.'
      );
      setCameraActive(false);
    }
  };

  // Stop Camera
  const stopCamera = async () => {
    if (scannerRef.current && cameraActive) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
      } catch {
        // Ignore
      }
      setCameraActive(false);
    }
  };

  useEffect(() => {
    // If URL has code param, auto validate
    if (initialCode) {
      handleValidateCode(initialCode);
    } else {
      // Auto-start camera
      startCamera();
    }

    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {});
      }
    };
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
          marginBottom: '16px',
        }}
      >
        <ArrowLeft className="w-4 h-4" /> Retour aux Billets
      </Link>

      {/* SCANNER TITLE */}
      <div style={{ textAlign: 'center', marginBottom: '16px' }}>
        <h1 style={{ fontSize: '1.6rem', fontWeight: 900 }}>Scan QR Code Caméra</h1>
        <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginTop: '2px' }}>
          Pointez la caméra vers le QR Code du billet pour valider l&apos;entrée.
        </p>
      </div>

      {/* CAMERA SCANNER VIEWPORT */}
      <div
        style={{
          background: '#12182b',
          borderRadius: '24px',
          padding: '16px',
          border: '1.5px solid rgba(255, 255, 255, 0.15)',
          boxShadow: '0 15px 35px rgba(0, 0, 0, 0.4)',
          marginBottom: '20px',
        }}
      >
        <div
          id="qr-reader-viewport"
          style={{
            width: '100%',
            minHeight: '280px',
            borderRadius: '16px',
            overflow: 'hidden',
            background: '#0a0e1a',
            border: '2px dashed rgba(129, 140, 248, 0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        />

        {cameraError && (
          <div
            style={{
              marginTop: '12px',
              padding: '10px 14px',
              borderRadius: '12px',
              background: 'rgba(239, 68, 68, 0.2)',
              color: '#fca5a5',
              fontSize: '0.82rem',
              lineHeight: 1.4,
            }}
          >
            ⚠️ {cameraError}
          </div>
        )}

        {/* CAMERA CONTROLS */}
        <div style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
          {!cameraActive ? (
            <button
              type="button"
              onClick={startCamera}
              style={{
                flex: 1,
                padding: '12px',
                borderRadius: '12px',
                background: '#10b981',
                color: '#ffffff',
                fontWeight: 800,
                fontSize: '0.9rem',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
              }}
            >
              <Camera className="w-4 h-4" /> Activer la Caméra
            </button>
          ) : (
            <button
              type="button"
              onClick={stopCamera}
              style={{
                flex: 1,
                padding: '12px',
                borderRadius: '12px',
                background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                color: '#ffffff',
                fontWeight: 700,
                fontSize: '0.9rem',
                cursor: 'pointer',
              }}
            >
              Arrêter la Caméra
            </button>
          )}
        </div>
      </div>

      {/* SCAN RESULT BANNER (USAGE UNIQUE) */}
      {scanResult && (
        <div
          style={{
            borderRadius: '24px',
            padding: '24px 20px',
            textAlign: 'center',
            marginBottom: '20px',
            animation: 'fadeIn 0.25s ease-out',
            background:
              scanResult.status === 'VALIDATED'
                ? 'rgba(16, 185, 129, 0.18)'
                : 'rgba(239, 68, 68, 0.18)',
            border:
              scanResult.status === 'VALIDATED'
                ? '2.5px solid #10b981'
                : '2.5px solid #ef4444',
            boxShadow:
              scanResult.status === 'VALIDATED'
                ? '0 15px 40px rgba(16, 185, 129, 0.35)'
                : '0 15px 40px rgba(239, 68, 68, 0.35)',
          }}
        >
          <div style={{ marginBottom: '12px' }}>
            {scanResult.status === 'VALIDATED' ? (
              <CheckCircle2 className="w-16 h-16 text-emerald-400 mx-auto" />
            ) : (
              <XCircle className="w-16 h-16 text-red-400 mx-auto" />
            )}
          </div>

          <h2
            style={{
              fontSize: '1.45rem',
              fontWeight: 900,
              color: scanResult.status === 'VALIDATED' ? '#10b981' : '#ef4444',
              lineHeight: 1.25,
            }}
          >
            {scanResult.status === 'VALIDATED'
              ? '🟢 ACCÈS AUTORISÉ - BILLET VALIDE'
              : scanResult.status === 'ALREADY_USED'
              ? '🔴 ACCÈS REFUSÉ - BILLET DÉJÀ UTILISÉ !'
              : '⛔ BILLET INVALIDE OU INCONNU'}
          </h2>

          <p style={{ color: '#cbd5e1', fontSize: '0.9rem', marginTop: '6px' }}>
            {scanResult.message}
          </p>

          {scanResult.ticket && (
            <div
              style={{
                marginTop: '16px',
                padding: '14px',
                borderRadius: '16px',
                background: 'rgba(0, 0, 0, 0.5)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                textAlign: 'left',
                fontSize: '0.86rem',
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
                <span style={{ fontWeight: 800, color: '#818cf8' }}>
                  {scanResult.ticket.passName} ({scanResult.ticket.quantity})
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#94a3b8' }}>Événement :</span>
                <span style={{ fontWeight: 600, color: '#ffffff' }}>{scanResult.ticket.eventTitle}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#94a3b8' }}>Code :</span>
                <span style={{ fontFamily: 'monospace', fontWeight: 800, color: '#fbbf24' }}>
                  {scanResult.ticket.ticketCode}
                </span>
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={() => {
              setScanResult(null);
              setInputCode('');
            }}
            style={{
              width: '100%',
              marginTop: '16px',
              padding: '12px',
              borderRadius: '99px',
              border: 'none',
              background: scanResult.status === 'VALIDATED' ? '#10b981' : '#818cf8',
              color: '#ffffff',
              fontWeight: 900,
              fontSize: '0.92rem',
              cursor: 'pointer',
            }}
          >
            Scanner le Suivant 📲
          </button>
        </div>
      )}

      {/* MANUAL CODE ENTRY FALLBACK */}
      <form
        onSubmit={handleSubmitForm}
        style={{
          background: '#12182b',
          padding: '18px',
          borderRadius: '20px',
          border: '1px solid rgba(255, 255, 255, 0.12)',
        }}
      >
        <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 700, color: '#94a3b8', marginBottom: '6px' }}>
          Saisie Manuelle (Optionnel)
        </label>
        <div style={{ display: 'flex', gap: '8px' }}>
          <input
            type="text"
            placeholder="ex. TCK-89A2F-2026"
            value={inputCode}
            onChange={(e) => setInputCode(e.target.value)}
            style={{
              flex: 1,
              height: '44px',
              background: '#1a233b',
              border: '1.5px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '12px',
              padding: '0 14px',
              color: '#ffffff',
              fontSize: '0.95rem',
              fontWeight: 700,
              outline: 'none',
            }}
          />
          <button
            type="submit"
            disabled={loading}
            style={{
              padding: '0 18px',
              height: '44px',
              borderRadius: '12px',
              background: '#818cf8',
              color: '#0f172a',
              fontWeight: 800,
              border: 'none',
              cursor: 'pointer',
              fontSize: '0.9rem',
            }}
          >
            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Valider'}
          </button>
        </div>
      </form>
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
        <Suspense fallback={<div style={{ padding: '40px', color: '#818cf8' }}>Chargement du Scanner Caméra...</div>}>
          <ScannerContent />
        </Suspense>
      </div>
    </AdminAuthGuard>
  );
}

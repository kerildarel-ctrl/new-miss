'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { AdminAuthGuard } from '@/components/AdminAuthGuard';
import {
  QrCode,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ArrowLeft,
  Camera,
  RefreshCw,
  History,
  ShieldCheck,
} from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';

interface ScannedTicket {
  id: string;
  ticketCode: string;
  buyerName?: string;
  buyerEmail?: string;
  buyerPhone?: string;
  eventTitle: string;
  passName: string;
  quantity?: number;
  totalPrice?: number;
  orderRef?: string;
  paymentStatus?: string;
  status: 'VALID' | 'USED';
  purchasedAt?: string;
  scannedAt?: string;
  scannedByAgentName?: string;
}

interface ScanHistoryItem {
  ticketCode: string;
  buyerName?: string;
  status: 'VALIDATED' | 'ALREADY_USED' | 'UNPAID' | 'INVALID';
  message: string;
  time: string;
  agentName: string;
}

function extractTicketCode(rawText: string): string {
  try {
    if (rawText.includes('/billetterie/')) {
      const parts = rawText.split('/billetterie/');
      const lastPart = parts[parts.length - 1].split('?')[0].split('#')[0];
      if (lastPart) return lastPart.trim().toUpperCase();
    }
    if (rawText.includes('code=')) {
      const url = new URL(rawText);
      const code = url.searchParams.get('code');
      if (code) return code.trim().toUpperCase();
    }
  } catch {
    // Ignore URL parse error
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

  // Auto-validate toggle
  const [autoValidate, setAutoValidate] = useState(false);

  // Inspected ticket data
  const [inspectedTicket, setInspectedTicket] = useState<ScannedTicket | null>(null);
  const [inspectError, setInspectError] = useState<string | null>(null);

  // Validation Result
  const [validationResult, setValidationResult] = useState<{
    code: 'VALIDATED' | 'ALREADY_USED' | 'UNPAID' | 'INVALID' | 'ERROR';
    message: string;
  } | null>(null);
  const [isValidating, setIsValidating] = useState(false);

  // Live session history
  const [history, setHistory] = useState<ScanHistoryItem[]>([]);

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const isScanningCooldown = useRef(false);

  // Audio Feedback
  const playAudio = (isSuccess: boolean) => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.type = isSuccess ? 'sine' : 'sawtooth';
      osc.frequency.setValueAtTime(isSuccess ? 880 : 220, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
      osc.start();
      osc.stop(audioCtx.currentTime + (isSuccess ? 0.2 : 0.4));
    } catch {
      // Audio not permitted
    }
  };

  // Inspect ticket (Consultation only)
  const inspectCode = async (rawCode: string, andAutoValidate = false) => {
    const code = extractTicketCode(rawCode);
    if (!code) return;

    setLoading(true);
    setValidationResult(null);
    setInspectError(null);

    try {
      const res = await fetch(`/api/tickets/${encodeURIComponent(code)}`, {
        cache: 'no-store',
      });
      const data = await res.json();

      if (!data.exists) {
        setInspectedTicket(null);
        setInspectError('BILLET INVALIDE — Entrée refusée (Code introuvable).');
        playAudio(false);
        addToHistory(code, 'Inconnu', 'INVALID', 'BILLET INVALIDE — Entrée refusée.');
        return;
      }

      if (data.ticket) {
        setInspectedTicket(data.ticket);

        if (andAutoValidate) {
          await validateTicket(code, data.ticket.buyerName);
        }
      }
    } catch {
      setInspectError('Erreur de communication avec le serveur.');
    } finally {
      setLoading(false);
    }
  };

  // Explicit Validation Action
  const validateTicket = async (ticketCode: string, buyerName?: string) => {
    setIsValidating(true);

    try {
      const res = await fetch('/api/tickets/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticketCode }),
      });
      const data = await res.json();

      const isSuccess = data.code === 'VALIDATED';
      playAudio(isSuccess);

      setValidationResult({
        code: data.code || (isSuccess ? 'VALIDATED' : 'ERROR'),
        message: data.message,
      });

      addToHistory(ticketCode, buyerName || inspectedTicket?.buyerName, data.code, data.message);

      if (inspectedTicket) {
        setInspectedTicket({
          ...inspectedTicket,
          status: 'USED',
          scannedAt: new Date().toISOString(),
          scannedByAgentName: 'Admin /keril',
        });
      }
    } catch {
      playAudio(false);
      setValidationResult({
        code: 'ERROR',
        message: 'Erreur réseau lors de la validation.',
      });
    } finally {
      setIsValidating(false);
    }
  };

  const addToHistory = (
    ticketCode: string,
    buyerName: string | undefined,
    status: any,
    message: string
  ) => {
    const item: ScanHistoryItem = {
      ticketCode,
      buyerName,
      status: status || 'INVALID',
      message,
      time: new Date().toLocaleTimeString('fr-FR'),
      agentName: 'Admin /keril',
    };
    setHistory((prev) => [item, ...prev.slice(0, 19)]);
  };

  // Start Camera
  const startCamera = async () => {
    setCameraError(null);
    try {
      if (!scannerRef.current) {
        scannerRef.current = new Html5Qrcode('qr-reader-viewport');
      }

      await scannerRef.current.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
        },
        (decodedText) => {
          if (!isScanningCooldown.current) {
            isScanningCooldown.current = true;
            inspectCode(decodedText, autoValidate);
            setTimeout(() => {
              isScanningCooldown.current = false;
            }, 3000);
          }
        },
        () => {}
      );
      setCameraActive(true);
    } catch {
      setCameraError('Impossible d’activer la caméra. Vérifiez les autorisations du navigateur.');
      setCameraActive(false);
    }
  };

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
    if (initialCode) {
      inspectCode(initialCode, false);
    } else {
      startCamera();
    }
    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {});
      }
    };
  }, [initialCode]);

  const handleManualSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputCode.trim()) {
      inspectCode(inputCode.trim(), autoValidate);
    }
  };

  return (
    <div style={{ width: '100%', maxWidth: '520px', margin: '0 auto', color: 'var(--ink)' }}>
      {/* TOP BAR */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <Link
          href="/keril/tickets"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            color: 'var(--p)',
            fontSize: '0.88rem',
            fontWeight: 700,
            textDecoration: 'none',
          }}
        >
          <ArrowLeft className="w-4 h-4" /> Liste des Billets
        </Link>

        {/* AUTO VALIDATE TOGGLE */}
        <label
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '0.78rem',
            color: autoValidate ? '#10b981' : 'var(--mute)',
            cursor: 'pointer',
            fontWeight: 700,
          }}
        >
          <input
            type="checkbox"
            checked={autoValidate}
            onChange={(e) => setAutoValidate(e.target.checked)}
            style={{ accentColor: '#10b981' }}
          />
          Validation Directe
        </label>
      </div>

      <div style={{ textAlign: 'center', marginBottom: '18px' }}>
        <p className="eb" style={{ color: 'var(--p)', fontSize: '0.76rem' }}>
          Contrôle d&apos;Entrée Officiel
        </p>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, marginTop: '2px', color: 'var(--ink)' }}>
          Scanner Caméra Billetterie
        </h1>
        <p className="mute sm" style={{ marginTop: '2px' }}>
          Scannez le QR Code ou saisissez le code pour inspecter et valider l&apos;accès.
        </p>
      </div>

      {/* CAMERA VIEWPORT CARD */}
      <div
        className="db"
        style={{
          background: 'var(--bg)',
          borderRadius: '24px',
          padding: '16px',
          border: '1.5px solid var(--line)',
          boxShadow: 'var(--shadow)',
          marginBottom: '20px',
        }}
      >
        <div
          id="qr-reader-viewport"
          style={{
            width: '100%',
            minHeight: '260px',
            borderRadius: '16px',
            overflow: 'hidden',
            background: '#0a0a0a',
            border: '2px dashed var(--line)',
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
              background: 'rgba(255, 90, 126, 0.12)',
              color: 'var(--a)',
              fontSize: '0.82rem',
              fontWeight: 600,
            }}
          >
            ⚠️ {cameraError}
          </div>
        )}

        <div style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
          {!cameraActive ? (
            <button
              type="button"
              onClick={startCamera}
              className="btn full"
              style={{
                height: '42px',
                fontSize: '0.86rem',
                fontWeight: 700,
                background: '#10b981',
                borderRadius: '12px',
              }}
            >
              📷 Réactiver la Caméra
            </button>
          ) : (
            <button
              type="button"
              onClick={stopCamera}
              style={{
                flex: 1,
                height: '42px',
                borderRadius: '12px',
                background: 'var(--soft)',
                border: '1px solid var(--line)',
                color: 'var(--ink)',
                fontWeight: 700,
                fontSize: '0.86rem',
                cursor: 'pointer',
              }}
            >
              Mettre en Pause
            </button>
          )}
        </div>
      </div>

      {/* MANUAL SEARCH INPUT */}
      <form
        onSubmit={handleManualSearch}
        className="db"
        style={{
          background: 'var(--bg)',
          padding: '12px 14px',
          borderRadius: '16px',
          border: '1px solid var(--line)',
          marginBottom: '20px',
          boxShadow: 'var(--shadow)',
        }}
      >
        <div style={{ display: 'flex', gap: '8px' }}>
          <input
            type="text"
            placeholder="Rechercher code (ex. TCK-89A2F-2026)"
            value={inputCode}
            onChange={(e) => setInputCode(e.target.value)}
            style={{
              flex: 1,
              height: '42px',
              background: 'var(--soft)',
              border: '1.5px solid var(--line)',
              borderRadius: '12px',
              padding: '0 14px',
              color: 'var(--ink)',
              fontSize: '0.88rem',
              fontWeight: 700,
              outline: 'none',
              marginTop: 0,
            }}
          />
          <button
            type="submit"
            disabled={loading}
            className="btn"
            style={{
              padding: '0 18px',
              height: '42px',
              borderRadius: '12px',
              fontWeight: 700,
              fontSize: '0.86rem',
              flexShrink: 0,
            }}
          >
            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Inspecter'}
          </button>
        </div>
      </form>

      {/* INSPECTED TICKET CARD */}
      {inspectedTicket && (
        <div
          className="db"
          style={{
            background: 'var(--bg)',
            borderRadius: '20px',
            padding: '20px',
            border: '1.5px solid var(--line)',
            marginBottom: '20px',
            boxShadow: 'var(--shadow)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <span style={{ fontSize: '0.78rem', color: 'var(--p)', fontWeight: 800 }}>
                {inspectedTicket.passName}
              </span>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, marginTop: '2px', color: 'var(--ink)' }}>
                {inspectedTicket.buyerName || 'Participant'}
              </h2>
              <p className="mute sm">{inspectedTicket.eventTitle}</p>
            </div>
            <span
              style={{
                fontFamily: 'monospace',
                fontSize: '0.85rem',
                fontWeight: 800,
                color: 'var(--p)',
                background: 'rgba(91, 61, 245, 0.1)',
                padding: '4px 10px',
                borderRadius: '8px',
              }}
            >
              {inspectedTicket.ticketCode}
            </span>
          </div>

          {/* STATUS ROW */}
          <div
            style={{
              marginTop: '14px',
              padding: '10px 14px',
              borderRadius: '12px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontSize: '0.85rem',
              fontWeight: 800,
              background:
                inspectedTicket.status === 'VALID'
                  ? 'rgba(16, 185, 129, 0.12)'
                  : 'rgba(255, 90, 126, 0.12)',
              border:
                inspectedTicket.status === 'VALID'
                  ? '1px solid #10b981'
                  : '1px solid var(--a)',
              color: inspectedTicket.status === 'VALID' ? '#10b981' : 'var(--a)',
            }}
          >
            <span>
              {inspectedTicket.status === 'VALID'
                ? '🟢 Statut : NON UTILISÉ'
                : '🔴 Statut : DÉJÀ UTILISÉ'}
            </span>
            <span style={{ fontSize: '0.76rem', color: 'var(--mute)' }}>
              Paiement : {inspectedTicket.paymentStatus || 'CONFIRMÉ'}
            </span>
          </div>

          {/* VALIDATION RESULT BANNER */}
          {validationResult && (
            <div
              style={{
                marginTop: '14px',
                padding: '12px',
                borderRadius: '12px',
                textAlign: 'center',
                fontWeight: 800,
                fontSize: '0.9rem',
                background:
                  validationResult.code === 'VALIDATED'
                    ? 'rgba(16, 185, 129, 0.15)'
                    : 'rgba(255, 90, 126, 0.15)',
                border:
                  validationResult.code === 'VALIDATED'
                    ? '1.5px solid #10b981'
                    : '1.5px solid var(--a)',
                color:
                  validationResult.code === 'VALIDATED' ? '#10b981' : 'var(--a)',
              }}
            >
              {validationResult.code === 'VALIDATED'
                ? '🟢 ENTRÉE VALIDÉE — Billet accepté.'
                : validationResult.code === 'ALREADY_USED'
                ? '🔴 BILLET DÉJÀ UTILISÉ — Entrée refusée.'
                : validationResult.code === 'UNPAID'
                ? '⚠️ PAIEMENT NON CONFIRMÉ — Entrée refusée.'
                : '⛔ BILLET INVALIDE — Entrée refusée.'}
            </div>
          )}

          {/* ACTION BUTTON */}
          {inspectedTicket.status === 'VALID' ? (
            <button
              type="button"
              onClick={() => validateTicket(inspectedTicket.ticketCode, inspectedTicket.buyerName)}
              disabled={isValidating}
              className="btn full"
              style={{
                marginTop: '16px',
                height: '46px',
                fontSize: '0.95rem',
                fontWeight: 800,
                background: '#10b981',
                gap: '8px',
                cursor: isValidating ? 'not-allowed' : 'pointer',
              }}
            >
              <CheckCircle2 className="w-5 h-5" />
              <span>{isValidating ? 'Validation...' : 'Valider l’Entrée Maintenant ✅'}</span>
            </button>
          ) : (
            <div
              style={{
                marginTop: '14px',
                textAlign: 'center',
                color: 'var(--a)',
                fontSize: '0.84rem',
                fontWeight: 700,
              }}
            >
              ⛔ Ce billet a déjà été utilisé et ne peut plus être validé.
            </div>
          )}
        </div>
      )}

      {inspectError && (
        <div
          style={{
            background: 'rgba(255, 90, 126, 0.12)',
            border: '1.5px solid var(--a)',
            color: 'var(--a)',
            padding: '14px',
            borderRadius: '14px',
            textAlign: 'center',
            marginBottom: '20px',
            fontWeight: 700,
            fontSize: '0.9rem',
          }}
        >
          {inspectError}
        </div>
      )}

      {/* SESSION SCAN HISTORY */}
      {history.length > 0 && (
        <div
          className="db"
          style={{
            background: 'var(--bg)',
            borderRadius: '20px',
            padding: '18px',
            border: '1px solid var(--line)',
            boxShadow: 'var(--shadow)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <History className="w-4 h-4" style={{ color: 'var(--p)' }} />
            <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--ink)' }}>
              Historique de la Session
            </h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {history.map((item, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '8px 12px',
                  borderRadius: '10px',
                  background: 'var(--soft)',
                  fontSize: '0.82rem',
                }}
              >
                <div>
                  <b style={{ color: item.status === 'VALIDATED' ? '#10b981' : 'var(--a)' }}>
                    {item.status === 'VALIDATED' ? '🟢 Accepté' : '🔴 Refusé'}
                  </b>{' '}
                  — <span style={{ fontFamily: 'monospace' }}>{item.ticketCode}</span>
                  {item.buyerName && <span className="mute"> ({item.buyerName})</span>}
                </div>
                <div className="mute" style={{ fontSize: '0.76rem' }}>{item.time}</div>
              </div>
            ))}
          </div>
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
          background: 'var(--soft)',
          padding: '28px 16px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Suspense fallback={<div style={{ padding: '40px', color: 'var(--p)' }}>Chargement du Contrôleur...</div>}>
          <ScannerContent />
        </Suspense>
      </div>
    </AdminAuthGuard>
  );
}

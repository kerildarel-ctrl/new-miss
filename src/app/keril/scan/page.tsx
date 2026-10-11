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
  Search,
  History,
  ShieldCheck,
  Check,
  RotateCcw,
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

  // Auto-validate toggle (Instant vs Inspection + Validation)
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

  // Inspect ticket (Consultation only, does NOT consume the ticket)
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

      // Update inspected ticket status
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
    setHistory((prev) => [item, ...prev.slice(0, 19)]); // Keep last 20
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
    <div style={{ width: '100%', maxWidth: '520px', margin: '0 auto', color: '#ffffff' }}>
      {/* TOP BAR */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
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
            color: autoValidate ? '#10b981' : '#94a3b8',
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
          Validation Directe au Scan
        </label>
      </div>

      <div style={{ textAlign: 'center', marginBottom: '16px' }}>
        <h1 style={{ fontSize: '1.6rem', fontWeight: 900 }}>Poste de Contrôle des Entrées</h1>
        <p style={{ color: '#94a3b8', fontSize: '0.84rem', marginTop: '2px' }}>
          Scannez le QR Code ou saisissez le code pour inspecter et valider l&apos;accès.
        </p>
      </div>

      {/* CAMERA VIEWPORT */}
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
            minHeight: '260px',
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
              style={{
                flex: 1,
                padding: '11px',
                borderRadius: '12px',
                background: '#10b981',
                color: '#ffffff',
                fontWeight: 800,
                fontSize: '0.88rem',
                border: 'none',
                cursor: 'pointer',
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
                padding: '11px',
                borderRadius: '12px',
                background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                color: '#ffffff',
                fontWeight: 700,
                fontSize: '0.88rem',
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
        style={{
          background: '#12182b',
          padding: '14px',
          borderRadius: '18px',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          marginBottom: '20px',
        }}
      >
        <div style={{ display: 'flex', gap: '8px' }}>
          <input
            type="text"
            placeholder="Rechercher par code (ex. TCK-89A2F-2026)"
            value={inputCode}
            onChange={(e) => setInputCode(e.target.value)}
            style={{
              flex: 1,
              height: '42px',
              background: '#1a233b',
              border: '1.5px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '12px',
              padding: '0 14px',
              color: '#ffffff',
              fontSize: '0.9rem',
              fontWeight: 700,
              outline: 'none',
            }}
          />
          <button
            type="submit"
            disabled={loading}
            style={{
              padding: '0 16px',
              height: '42px',
              borderRadius: '12px',
              background: '#818cf8',
              color: '#0f172a',
              fontWeight: 800,
              border: 'none',
              cursor: 'pointer',
              fontSize: '0.88rem',
            }}
          >
            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Inspecter'}
          </button>
        </div>
      </form>

      {/* INSPECTED TICKET CARD */}
      {inspectedTicket && (
        <div
          style={{
            background: '#12182b',
            borderRadius: '24px',
            padding: '20px',
            border: '1.5px solid rgba(255, 255, 255, 0.15)',
            marginBottom: '20px',
            boxShadow: '0 15px 35px rgba(0, 0, 0, 0.4)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <span style={{ fontSize: '0.78rem', color: '#818cf8', fontWeight: 800 }}>
                {inspectedTicket.passName}
              </span>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 900, marginTop: '2px' }}>
                {inspectedTicket.buyerName || 'Participant'}
              </h2>
              <p style={{ color: '#94a3b8', fontSize: '0.84rem' }}>{inspectedTicket.eventTitle}</p>
            </div>
            <span
              style={{
                fontFamily: 'monospace',
                fontSize: '0.85rem',
                fontWeight: 800,
                color: '#fbbf24',
                background: 'rgba(251, 191, 36, 0.1)',
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
                  ? 'rgba(16, 185, 129, 0.15)'
                  : 'rgba(239, 68, 68, 0.15)',
              border:
                inspectedTicket.status === 'VALID'
                  ? '1px solid #10b981'
                  : '1px solid #ef4444',
              color: inspectedTicket.status === 'VALID' ? '#10b981' : '#f87171',
            }}
          >
            <span>
              {inspectedTicket.status === 'VALID'
                ? '🟢 Statut : NON UTILISÉ'
                : '🔴 Statut : DÉJÀ UTILISÉ'}
            </span>
            <span style={{ fontSize: '0.78rem', color: '#cbd5e1' }}>
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
                fontWeight: 900,
                fontSize: '0.92rem',
                background:
                  validationResult.code === 'VALIDATED'
                    ? 'rgba(16, 185, 129, 0.25)'
                    : 'rgba(239, 68, 68, 0.25)',
                border:
                  validationResult.code === 'VALIDATED'
                    ? '2px solid #10b981'
                    : '2px solid #ef4444',
                color:
                  validationResult.code === 'VALIDATED' ? '#10b981' : '#fca5a5',
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
              style={{
                width: '100%',
                marginTop: '16px',
                padding: '14px',
                borderRadius: '99px',
                background: '#10b981',
                color: '#ffffff',
                border: 'none',
                fontWeight: 900,
                fontSize: '0.98rem',
                cursor: isValidating ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: '0 8px 20px rgba(16, 185, 129, 0.35)',
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
                color: '#f87171',
                fontSize: '0.85rem',
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
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1.5px solid #ef4444',
            color: '#fca5a5',
            padding: '16px',
            borderRadius: '16px',
            textAlign: 'center',
            marginBottom: '20px',
            fontWeight: 800,
          }}
        >
          {inspectError}
        </div>
      )}

      {/* SESSION SCAN HISTORY */}
      {history.length > 0 && (
        <div
          style={{
            background: '#12182b',
            borderRadius: '20px',
            padding: '18px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <History className="w-4 h-4 text-indigo-400" />
            <h3 style={{ fontSize: '0.95rem', fontWeight: 800 }}>Historique de la Session</h3>
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
                  background: 'rgba(255, 255, 255, 0.04)',
                  fontSize: '0.82rem',
                }}
              >
                <div>
                  <b style={{ color: item.status === 'VALIDATED' ? '#10b981' : '#f87171' }}>
                    {item.status === 'VALIDATED' ? '🟢 Accepté' : '🔴 Refusé'}
                  </b>{' '}
                  — <span style={{ fontFamily: 'monospace' }}>{item.ticketCode}</span>
                  {item.buyerName && <span style={{ color: '#94a3b8' }}> ({item.buyerName})</span>}
                </div>
                <div style={{ color: '#94a3b8', fontSize: '0.78rem' }}>{item.time}</div>
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
          background: '#0a0e1a',
          padding: '24px 16px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Suspense fallback={<div style={{ padding: '40px', color: '#818cf8' }}>Chargement du Contrôleur...</div>}>
          <ScannerContent />
        </Suspense>
      </div>
    </AdminAuthGuard>
  );
}

'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import jsQR from 'jsqr';
import { useParams } from 'next/navigation';
import {
  TrendingUp, Users, DollarSign, Ticket, RefreshCw,
  CheckCircle2, Clock, Mail, Phone, Calendar, MapPin,
  Camera, CameraOff, QrCode, X, AlertCircle,
} from 'lucide-react';

interface TicketPass { name: string; price: number; quantity?: number; description?: string; }
interface EventData {
  id: string; title: string; date: string; venue: string;
  organizerPhone?: string; passes: TicketPass[];
}
interface SoldTicket {
  id: string; ticketCode: string; buyerName: string; buyerEmail: string;
  buyerPhone?: string; passName: string; unitPrice: number; quantity: number;
  totalPrice: number; status: string; paymentStatus: string;
  purchasedAt?: string;
}
type ScanResult = {
  type: 'success' | 'error' | 'warning';
  title: string;
  message: string;
  buyerName?: string;
  passName?: string;
} | null;

const TIERS = [
  { min: 0,       max: 50000,    pct: 75 },
  { min: 50000,   max: 200000,   pct: 78 },
  { min: 200000,  max: 500000,   pct: 80 },
  { min: 500000,  max: 1000000,  pct: 82 },
  { min: 1000000, max: Infinity, pct: 83 },
];
function getOrgPct(total: number) {
  return TIERS.find((t) => total >= t.min && total < t.max)?.pct ?? 83;
}

export default function OrganizerDashboardPage() {
  const params = useParams();
  const token = params?.token as string;

  const [event, setEvent] = useState<EventData | null>(null);
  const [tickets, setTickets] = useState<SoldTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // Scanner state
  const [scannerOpen, setScannerOpen] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResult>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);

  // Payout
  const [requestingPayout, setRequestingPayout] = useState(false);
  const [payoutMsg, setPayoutMsg] = useState<string | null>(null);

  // Camera refs
  const videoRef    = useRef<HTMLVideoElement>(null);
  const canvasRef   = useRef<HTMLCanvasElement>(null);
  const streamRef   = useRef<MediaStream | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lockedRef   = useRef(false);
  // Always up-to-date event ref — avoids stale closures in scanner callbacks
  const eventRef    = useRef<EventData | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const evtRes = await fetch(`/api/tickets/events?token=${token}`);
      const evtData = await evtRes.json();
      if (!evtData.success || !evtData.data) { setNotFound(true); return; }
      const evt: EventData = evtData.data;
      eventRef.current = evt; // keep ref in sync
      setEvent(evt);
      const tixRes = await fetch(`/api/organizer/tickets?token=${token}&eventId=${evt.id}`);
      const tixData = await tixRes.json();
      if (tixData.success) setTickets(tixData.tickets || []);
    } catch { setNotFound(true); }
    finally { setLoading(false); }
  }, [token]);

  useEffect(() => { loadData(); }, [loadData]);

  // ── Scanner logic ──────────────────────────────────────────────

  const stopCamera = useCallback(() => {
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
    if (streamRef.current) { streamRef.current.getTracks().forEach((t) => t.stop()); streamRef.current = null; }
    lockedRef.current = false;
  }, []);

  // submitScan is defined BEFORE handleDetected so the closure captures it correctly.
  // Uses eventRef (not event state) to always have the latest event, even in stale closures.
  const submitScan = useCallback(async (code: string) => {
    const currentEvent = eventRef.current;
    if (!currentEvent || !code.trim()) {
      console.warn('[scan] Aucun événement chargé ou code vide', { currentEvent, code });
      return;
    }
    setScanning(true);
    setScanResult(null);
    try {
      const res = await fetch('/api/organizer/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticketCode: code.trim().toUpperCase(),
          organizerToken: token,
          eventId: currentEvent.id,
          agentName: 'Organisateur',
        }),
      });
      const data = await res.json();
      if (data.success) {
        setScanResult({
          type: 'success',
          title: '✅ Entrée autorisée !',
          message: data.message,
          buyerName: data.ticket?.buyerName,
          passName: data.ticket?.passName,
        });
        loadData();
      } else {
        const type = data.scanResult === 'ALREADY_USED' ? 'warning' : 'error';
        setScanResult({
          type,
          title: type === 'warning' ? '⚠️ Déjà scanné' : '❌ Refusé',
          message: data.error,
          buyerName: data.ticket?.buyerName,
          passName: data.ticket?.passName,
        });
      }
    } catch {
      setScanResult({ type: 'error', title: '❌ Erreur réseau', message: 'Vérifiez votre connexion.' });
    } finally {
      setScanning(false);
      setManualCode('');
    }
  }, [token, loadData]);

  const handleDetected = useCallback((raw: string) => {
    if (lockedRef.current) return;
    lockedRef.current = true;
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
    stopCamera();
    const match = raw.match(/TKT-[A-Z0-9]{4}-[A-Z0-9]{4}/i);
    const code = match ? match[0].toUpperCase() : raw.trim().toUpperCase();
    console.log('[scan] QR détecté:', raw, '→ code:', code);
    submitScan(code);
  }, [stopCamera, submitScan]);

  const startCamera = useCallback(async () => {
    setCameraError(null);
    setScanResult(null);
    lockedRef.current = false;
    if (streamRef.current) { streamRef.current.getTracks().forEach((t) => t.stop()); streamRef.current = null; }
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      streamRef.current = stream;
      const video = videoRef.current;
      if (!video) return;
      video.srcObject = stream;
      await video.play();

      // ── Strategy 1: native BarcodeDetector (Chrome Android — no canvas, no blackout) ──
      if ('BarcodeDetector' in window) {
        const detector = new (window as any).BarcodeDetector({ formats: ['qr_code'] });
        intervalRef.current = setInterval(async () => {
          if (lockedRef.current) return;
          const vid = videoRef.current;
          if (!vid || vid.readyState < 2 || vid.videoWidth === 0) return;
          try {
            const results = await detector.detect(vid);
            if (results.length > 0) handleDetected(results[0].rawValue);
          } catch { /* frame error — ignore */ }
        }, 250);
        return;
      }

      // ── Strategy 2: jsQR on 640×480 canvas (iOS Safari / Firefox fallback) ──
      intervalRef.current = setInterval(() => {
        if (lockedRef.current) return;
        const vid = videoRef.current;
        const cvs = canvasRef.current;
        if (!vid || !cvs || vid.readyState < 2 || vid.videoWidth === 0) return;
        const W = 640; const H = 480;
        cvs.width = W; cvs.height = H;
        const ctx = cvs.getContext('2d', { willReadFrequently: true });
        if (!ctx) return;
        ctx.drawImage(vid, 0, 0, W, H);
        const img = ctx.getImageData(0, 0, W, H);
        // attemptBoth tries normal + inverted — works on printed AND screen QR codes
        const result = jsQR(img.data, W, H, { inversionAttempts: 'attemptBoth' });
        if (result?.data) handleDetected(result.data);
      }, 350);
    } catch (err: any) {
      setCameraError(`Caméra inaccessible : ${err.message || 'permission refusée'}`);
    }
  }, [stopCamera, handleDetected]);

  useEffect(() => {
    if (scannerOpen) startCamera();
    else stopCamera();
    return () => stopCamera();
  }, [scannerOpen, startCamera, stopCamera]);




  // ── Payout ────────────────────────────────────────────────────

  const paidTickets = tickets.filter((t) => t.paymentStatus === 'PAID');
  const totalRevenue = paidTickets.reduce((s, t) => s + (t.totalPrice || t.unitPrice * (t.quantity || 1)), 0);
  const orgPct = getOrgPct(totalRevenue);
  const orgRevenue = Math.floor(totalRevenue * orgPct / 100);
  const totalSeats = paidTickets.reduce((s, t) => s + (t.quantity || 1), 0);

  const byPass: Record<string, { count: number; revenue: number; passQty?: number }> = {};
  (event?.passes || []).forEach((p) => { byPass[p.name] = { count: 0, revenue: 0, passQty: p.quantity }; });
  paidTickets.forEach((t) => {
    if (!byPass[t.passName]) byPass[t.passName] = { count: 0, revenue: 0 };
    byPass[t.passName].count += t.quantity || 1;
    byPass[t.passName].revenue += t.totalPrice || 0;
  });

  const handleRequestPayout = async () => {
    if (!orgRevenue || orgRevenue < 100) { setPayoutMsg('Solde insuffisant (minimum 100 FCFA).'); return; }
    setRequestingPayout(true); setPayoutMsg(null);
    try {
      const res = await fetch('/api/organizer/payouts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ competitionId: event?.id, organizerPhone: event?.organizerPhone, amount: orgRevenue, note: `Reversement billetterie — ${event?.title}` }),
      });
      const data = await res.json();
      setPayoutMsg(data.message || (data.success ? 'Demande envoyée !' : data.error || 'Erreur'));
    } catch { setPayoutMsg('Erreur réseau.'); }
    finally { setRequestingPayout(false); }
  };

  // ── Render ────────────────────────────────────────────────────

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#0a0f1e', color: '#fff' }}>
      <div style={{ textAlign: 'center' }}>
        <RefreshCw style={{ width: '40px', height: '40px', color: '#818cf8', margin: '0 auto 16px', display: 'block', animation: 'spin 1s linear infinite' }} />
        <p>Chargement…</p>
      </div>
      <style>{`@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  if (notFound || !event) return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#0a0f1e', color: '#fff', padding: '20px' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🔒</div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Lien invalide ou expiré</h2>
      </div>
    </div>
  );

  const scanBgColor = scanResult?.type === 'success' ? 'rgba(16,185,129,0.15)' : scanResult?.type === 'warning' ? 'rgba(245,158,11,0.15)' : 'rgba(239,68,68,0.15)';
  const scanBorderColor = scanResult?.type === 'success' ? '#10b981' : scanResult?.type === 'warning' ? '#f59e0b' : '#ef4444';
  const scanTextColor = scanResult?.type === 'success' ? '#34d399' : scanResult?.type === 'warning' ? '#fbbf24' : '#f87171';

  return (
    <div style={{ minHeight: '100vh', background: '#0a0f1e', color: '#e2e8f0', fontFamily: 'var(--font-sans, Arial, sans-serif)' }}>
      <style>{`@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}} @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}`}</style>

      {/* HEADER */}
      <div style={{ background: 'linear-gradient(135deg,#1B0E78,#27149F,#4B2CE0)', padding: 'clamp(24px,4vw,40px) clamp(16px,4vw,40px)' }}>
        <p style={{ margin: '0 0 4px', fontSize: '0.75rem', color: '#BDB6EE', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
          Dashboard Organisateur 🎟️
        </p>
        <h1 style={{ margin: '0 0 8px', color: '#fff', fontSize: 'clamp(1.3rem,3.5vw,1.8rem)', fontWeight: 900 }}>{event.title}</h1>
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', fontSize: '0.85rem', color: '#D9D4FA' }}>
          <span><Calendar style={{ width: '13px', height: '13px', display: 'inline', marginRight: '4px' }} />{event.date}</span>
          <span><MapPin style={{ width: '13px', height: '13px', display: 'inline', marginRight: '4px' }} />{event.venue}</span>
        </div>
      </div>

      <main style={{ maxWidth: '1100px', margin: '0 auto', padding: 'clamp(20px,3vw,36px) clamp(16px,3vw,32px)', display: 'flex', flexDirection: 'column', gap: '24px' }}>

        {/* ═══ SCANNER SECTION ═══ */}
        <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '20px', overflow: 'hidden' }}>
          <div style={{ padding: '20px 24px', borderBottom: scannerOpen ? '1px solid rgba(255,255,255,0.08)' : 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#e2e8f0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <QrCode style={{ width: '18px', height: '18px', color: '#818cf8' }} /> Scanner les billets à l&apos;entrée
              </h2>
              <p style={{ margin: '4px 0 0', fontSize: '0.78rem', color: '#64748b' }}>Scannez le QR code ou entrez le code manuellement</p>
            </div>
            <button
              type="button"
              onClick={() => { setScannerOpen(!scannerOpen); setScanResult(null); }}
              style={{
                padding: '10px 20px', borderRadius: '10px', border: 'none',
                background: scannerOpen ? 'rgba(239,68,68,0.2)' : 'linear-gradient(135deg,#27149F,#4B2CE0)',
                color: scannerOpen ? '#f87171' : '#fff',
                fontWeight: 800, fontSize: '0.88rem', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: '8px',
              }}
            >
              {scannerOpen ? <><CameraOff style={{ width: '15px', height: '15px' }} /> Fermer le scanner</> : <><Camera style={{ width: '15px', height: '15px' }} /> Ouvrir le scanner</>}
            </button>
          </div>

          {scannerOpen && (
            <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

              {/* Camera viewfinder */}
              <div style={{ position: 'relative', width: '100%', maxWidth: '420px', margin: '0 auto', borderRadius: '16px', overflow: 'hidden', background: '#000', aspectRatio: '4/3' }}>
                <video ref={videoRef} muted playsInline autoPlay style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                {/* Canvas must NOT be display:none — use invisible positioning instead */}
                <canvas ref={canvasRef} style={{ position: 'absolute', top: 0, left: 0, width: '1px', height: '1px', opacity: 0, pointerEvents: 'none' }} />

                {/* Scan frame overlay */}
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
                  <div style={{ width: '220px', height: '220px', position: 'relative' }}>
                    {/* Corner brackets */}
                    {[
                      { top: 0, left: 0, borderWidth: '3px 0 0 3px' },
                      { top: 0, right: 0, borderWidth: '3px 3px 0 0' },
                      { bottom: 0, left: 0, borderWidth: '0 0 3px 3px' },
                      { bottom: 0, right: 0, borderWidth: '0 3px 3px 0' },
                    ].map((s, i) => (
                      <div key={i} style={{ position: 'absolute', width: '28px', height: '28px', borderColor: '#818cf8', borderStyle: 'solid', ...s }} />
                    ))}
                    {/* Scan line */}
                    <div style={{
                      position: 'absolute', left: '4px', right: '4px', height: '2px',
                      background: 'linear-gradient(90deg, transparent, #818cf8, transparent)',
                      animation: 'scanline 2s ease-in-out infinite',
                      top: '50%',
                    }} />
                  </div>
                </div>

                {cameraError && (
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.85)', padding: '20px', textAlign: 'center' }}>
                    <div>
                      <AlertCircle style={{ width: '32px', height: '32px', color: '#ef4444', margin: '0 auto 12px', display: 'block' }} />
                      <p style={{ color: '#f87171', fontSize: '0.85rem', margin: 0 }}>{cameraError}</p>
                      <button type="button" onClick={startCamera} style={{ marginTop: '12px', padding: '8px 16px', borderRadius: '8px', background: '#818cf8', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '0.82rem' }}>
                        Réessayer
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <style>{`
                @keyframes scanline {
                  0%,100% { top: 10%; opacity: 0.7; }
                  50% { top: 85%; opacity: 1; }
                }
              `}</style>

              {/* Scan result */}
              {scanResult && (
                <div style={{ background: scanBgColor, border: `1.5px solid ${scanBorderColor}`, borderRadius: '14px', padding: '16px 20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <p style={{ margin: '0 0 4px', fontWeight: 900, fontSize: '1rem', color: scanTextColor }}>{scanResult.title}</p>
                      <p style={{ margin: '0 0 8px', fontSize: '0.85rem', color: '#e2e8f0' }}>{scanResult.message}</p>
                      {scanResult.buyerName && <p style={{ margin: '0 0 2px', fontSize: '0.82rem', color: '#94a3b8' }}>👤 {scanResult.buyerName}</p>}
                      {scanResult.passName && <p style={{ margin: 0, fontSize: '0.82rem', color: '#94a3b8' }}>🎟️ {scanResult.passName}</p>}
                    </div>
                    <button type="button" onClick={() => { setScanResult(null); startCamera(); }}
                      style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: '4px' }}>
                      <X style={{ width: '16px', height: '16px' }} />
                    </button>
                  </div>
                  {scanResult.type !== 'warning' && (
                    <button type="button" onClick={() => { setScanResult(null); startCamera(); }}
                      style={{ marginTop: '12px', width: '100%', padding: '9px', borderRadius: '10px', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)', color: '#e2e8f0', fontWeight: 700, cursor: 'pointer', fontSize: '0.85rem' }}>
                      <Camera style={{ width: '14px', height: '14px', display: 'inline', marginRight: '6px' }} />
                      Scanner un autre billet
                    </button>
                  )}
                </div>
              )}

              {/* Manual entry */}
              <div>
                <p style={{ margin: '0 0 8px', fontSize: '0.8rem', fontWeight: 700, color: '#94a3b8' }}>OU ENTREZ LE CODE MANUELLEMENT</p>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    placeholder="TKT-XXXX-XXXX"
                    value={manualCode}
                    onChange={(e) => setManualCode(e.target.value.toUpperCase())}
                    onKeyDown={(e) => e.key === 'Enter' && manualCode.trim() && submitScan(manualCode)}
                    style={{
                      flex: 1, height: '44px', borderRadius: '10px',
                      background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)',
                      color: '#fff', padding: '0 14px', fontSize: '0.92rem', fontFamily: 'monospace', fontWeight: 700,
                      outline: 'none', letterSpacing: '0.05em',
                    }}
                  />
                  <button
                    type="button"
                    disabled={!manualCode.trim() || scanning}
                    onClick={() => submitScan(manualCode)}
                    style={{
                      padding: '0 20px', borderRadius: '10px', border: 'none',
                      background: scanning ? '#374151' : 'linear-gradient(135deg,#27149F,#4B2CE0)',
                      color: '#fff', fontWeight: 800, cursor: 'pointer', fontSize: '0.88rem', height: '44px',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {scanning ? '⏳' : 'Valider'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ═══ KPI CARDS ═══ */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px,1fr))', gap: '16px' }}>
          {[
            { icon: <Ticket style={{ width: '22px', height: '22px', color: '#818cf8' }} />, label: 'Places vendues', value: totalSeats.toString(), sub: 'billets confirmés' },
            { icon: <DollarSign style={{ width: '22px', height: '22px', color: '#34d399' }} />, label: 'Revenus bruts', value: `${totalRevenue.toLocaleString('fr-FR')} F`, sub: 'total collecté' },
            { icon: <TrendingUp style={{ width: '22px', height: '22px', color: '#f59e0b' }} />, label: 'Votre part', value: `${orgRevenue.toLocaleString('fr-FR')} F`, sub: `${orgPct}% des ventes` },
            { icon: <Users style={{ width: '22px', height: '22px', color: '#c084fc' }} />, label: 'Acheteurs', value: new Set(paidTickets.map((t) => t.buyerEmail)).size.toString(), sub: 'personnes uniques' },
            { icon: <CheckCircle2 style={{ width: '22px', height: '22px', color: '#34d399' }} />, label: 'Billets scannés', value: paidTickets.filter((t) => t.status === 'USED').length.toString(), sub: 'entrées validées' },
          ].map((card) => (
            <div key={card.label} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', padding: '18px' }}>
              <div style={{ marginBottom: '10px' }}>{card.icon}</div>
              <p style={{ margin: '0 0 4px', fontSize: '0.72rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{card.label}</p>
              <p style={{ margin: '0 0 2px', fontSize: 'clamp(1rem,2.5vw,1.4rem)', fontWeight: 900, color: '#fff' }}>{card.value}</p>
              <p style={{ margin: 0, fontSize: '0.72rem', color: '#64748b' }}>{card.sub}</p>
            </div>
          ))}
        </div>

        {/* ═══ PASS BREAKDOWN ═══ */}
        {Object.keys(byPass).length > 0 && (
          <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '20px', padding: '24px' }}>
            <h2 style={{ margin: '0 0 16px', fontSize: '1rem', fontWeight: 800 }}>Ventes par type de billet</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {Object.entries(byPass).map(([passName, info]) => {
                const pct = info.passQty ? Math.round((info.count / info.passQty) * 100) : 0;
                return (
                  <div key={passName}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.88rem', flexWrap: 'wrap', gap: '4px' }}>
                      <span style={{ fontWeight: 700 }}>{passName}</span>
                      <span style={{ color: '#94a3b8' }}>{info.count} vendu{info.count > 1 ? 's' : ''}{info.passQty ? ` / ${info.passQty}` : ''} — <b style={{ color: '#34d399' }}>{info.revenue.toLocaleString('fr-FR')} FCFA</b></span>
                    </div>
                    {info.passQty ? (
                      <div style={{ height: '6px', background: 'rgba(255,255,255,0.08)', borderRadius: '99px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${Math.min(pct, 100)}%`, background: 'linear-gradient(90deg,#818cf8,#4B2CE0)', borderRadius: '99px' }} />
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ═══ PAYOUT ═══ */}
        <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '20px', padding: '24px' }}>
          <h2 style={{ margin: '0 0 6px', fontSize: '1rem', fontWeight: 800 }}>Demander un reversement</h2>
          <p style={{ margin: '0 0 20px', fontSize: '0.84rem', color: '#64748b' }}>
            Part disponible : <strong style={{ color: '#34d399' }}>{orgRevenue.toLocaleString('fr-FR')} FCFA</strong> ({orgPct}% des ventes)
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
            <div style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '12px', padding: '12px 16px', flex: 1, minWidth: '180px' }}>
              <p style={{ margin: 0, fontSize: '0.72rem', color: '#94a3b8', marginBottom: '4px' }}>Mobile Money</p>
              <p style={{ margin: 0, fontWeight: 800 }}>{event.organizerPhone || 'Non renseigné'}</p>
            </div>
            <button type="button" onClick={handleRequestPayout} disabled={requestingPayout || orgRevenue < 100}
              style={{ padding: '13px 22px', borderRadius: '12px', border: 'none', background: requestingPayout ? '#374151' : 'linear-gradient(135deg,#27149F,#4B2CE0)', color: '#fff', fontWeight: 800, fontSize: '0.9rem', cursor: requestingPayout ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap' }}>
              {requestingPayout ? '⏳ Envoi…' : `💸 Demander ${orgRevenue.toLocaleString('fr-FR')} FCFA`}
            </button>
          </div>
          {payoutMsg && (
            <div style={{ background: 'rgba(16,185,129,0.12)', border: '1px solid #10b981', borderRadius: '10px', padding: '12px 16px', fontSize: '0.85rem', color: '#34d399', fontWeight: 600 }}>
              {payoutMsg}
            </div>
          )}
        </div>

        {/* ═══ BUYERS TABLE ═══ */}
        <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '20px', overflow: 'hidden' }}>
          <div style={{ padding: '18px 24px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
            <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 800 }}>Liste des acheteurs</h2>
            <button type="button" onClick={loadData} style={{ background: 'none', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '8px', color: '#94a3b8', padding: '6px 12px', cursor: 'pointer', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <RefreshCw style={{ width: '13px', height: '13px' }} /> Actualiser
            </button>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '560px' }}>
              <thead>
                <tr style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#64748b', background: 'rgba(255,255,255,0.03)' }}>
                  {['Acheteur', 'Pass', 'Places', 'Montant', 'Statut'].map((h) => (
                    <th key={h} style={{ padding: '12px 20px', textAlign: 'left' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paidTickets.length === 0 ? (
                  <tr><td colSpan={5} style={{ padding: '36px', textAlign: 'center', color: '#64748b' }}>Aucun billet vendu pour l&apos;instant.</td></tr>
                ) : paidTickets.map((t) => (
                  <tr key={t.id} style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                    <td style={{ padding: '14px 20px' }}>
                      <p style={{ margin: '0 0 2px', fontWeight: 700, color: '#e2e8f0', fontSize: '0.9rem' }}>{t.buyerName}</p>
                      <p style={{ margin: 0, fontSize: '0.75rem', color: '#818cf8' }}><Mail style={{ width: '11px', height: '11px', display: 'inline', marginRight: '3px' }} />{t.buyerEmail}</p>
                      {t.buyerPhone && <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: '#64748b' }}><Phone style={{ width: '11px', height: '11px', display: 'inline', marginRight: '3px' }} />{t.buyerPhone}</p>}
                    </td>
                    <td style={{ padding: '14px 20px', fontSize: '0.85rem', color: '#c4b5fd', fontWeight: 700 }}>{t.passName}</td>
                    <td style={{ padding: '14px 20px', fontWeight: 800, color: '#e2e8f0' }}>{t.quantity || 1}</td>
                    <td style={{ padding: '14px 20px', fontWeight: 800, color: '#34d399' }}>{(t.totalPrice || 0).toLocaleString('fr-FR')} F</td>
                    <td style={{ padding: '14px 20px' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '3px 10px', borderRadius: '99px', fontSize: '0.72rem', fontWeight: 800, background: t.status === 'USED' ? 'rgba(239,68,68,0.15)' : 'rgba(16,185,129,0.15)', color: t.status === 'USED' ? '#ef4444' : '#34d399' }}>
                        {t.status === 'USED' ? <CheckCircle2 style={{ width: '11px', height: '11px' }} /> : <Clock style={{ width: '11px', height: '11px' }} />}
                        {t.status === 'USED' ? 'Scanné' : 'Non scanné'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </main>
    </div>
  );
}

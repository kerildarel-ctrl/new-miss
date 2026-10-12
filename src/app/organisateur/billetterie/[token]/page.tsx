'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  TrendingUp, Users, DollarSign, Ticket, RefreshCw,
  CheckCircle2, Clock, Mail, Phone, Calendar, MapPin,
} from 'lucide-react';

interface TicketPass { name: string; price: number; quantity?: number; description?: string; }

interface EventData {
  id: string; title: string; subtitle?: string; date: string; venue: string;
  city?: string; bannerImage?: string; passes: TicketPass[];
  organizerName?: string; organizerEmail?: string; organizerPhone?: string;
}

interface SoldTicket {
  id: string; ticket_code: string; buyer_name: string; buyer_email: string;
  buyer_phone?: string; pass_name: string; unit_price: number; quantity: number;
  total_price: number; status: string; payment_status: string;
  purchased_at?: string; order_ref?: string;
}

const TIERS = [
  { min: 0,       max: 50000,    orgPct: 75 },
  { min: 50000,   max: 200000,   orgPct: 78 },
  { min: 200000,  max: 500000,   orgPct: 80 },
  { min: 500000,  max: 1000000,  orgPct: 82 },
  { min: 1000000, max: Infinity, orgPct: 83 },
];

function getOrgPct(total: number) {
  return TIERS.find((t) => total >= t.min && total < t.max)?.orgPct ?? 83;
}

export default function OrganizerDashboardPage() {
  const params = useParams();
  const token = params?.token as string;

  const [event, setEvent] = useState<EventData | null>(null);
  const [tickets, setTickets] = useState<SoldTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [requestingPayout, setRequestingPayout] = useState(false);
  const [payoutMsg, setPayoutMsg] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      // Get event by organizer token
      const evtRes = await fetch(`/api/tickets/events?token=${token}`);
      const evtData = await evtRes.json();
      if (!evtData.success || !evtData.data) { setNotFound(true); return; }
      const evt: EventData = evtData.data;
      setEvent(evt);

      // Get tickets via organizer-specific endpoint (validates token)
      const tixRes = await fetch(`/api/organizer/tickets?token=${token}&eventId=${evt.id}`);
      const tixData = await tixRes.json();
      if (tixData.success) setTickets(tixData.tickets || []);
    } catch { setNotFound(true); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadData(); }, [token]);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#0a0f1e', color: '#fff' }}>
        <div style={{ textAlign: 'center' }}>
          <RefreshCw style={{ width: '40px', height: '40px', color: '#818cf8', margin: '0 auto 16px', display: 'block', animation: 'spin 1s linear infinite' }} />
          <p>Chargement du dashboard…</p>
        </div>
        <style>{`@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  if (notFound || !event) {
    return (
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#0a0f1e', color: '#fff', padding: '20px' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🔒</div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '8px' }}>Lien invalide</h2>
          <p style={{ color: '#94a3b8' }}>Ce lien organisateur n'existe pas ou a expiré.</p>
        </div>
      </div>
    );
  }

  const paidTickets = tickets.filter((t) => t.payment_status === 'PAID');
  const totalRevenue = paidTickets.reduce((s, t) => s + (t.total_price || t.unit_price * t.quantity), 0);
  const orgPct = getOrgPct(totalRevenue);
  const orgRevenue = Math.floor(totalRevenue * orgPct / 100);
  const totalSeats = paidTickets.reduce((s, t) => s + (t.quantity || 1), 0);

  // Group by pass
  const byPass: Record<string, { count: number; revenue: number; passQty?: number }> = {};
  event.passes.forEach((p) => { byPass[p.name] = { count: 0, revenue: 0, passQty: p.quantity }; });
  paidTickets.forEach((t) => {
    if (!byPass[t.pass_name]) byPass[t.pass_name] = { count: 0, revenue: 0 };
    byPass[t.pass_name].count += t.quantity || 1;
    byPass[t.pass_name].revenue += t.total_price || 0;
  });

  const handleRequestPayout = async () => {
    if (!orgRevenue || orgRevenue < 100) {
      setPayoutMsg('Solde insuffisant (minimum 100 FCFA).');
      return;
    }
    setRequestingPayout(true);
    setPayoutMsg(null);
    try {
      const res = await fetch('/api/organizer/payouts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          competitionId: event.id,
          organizerPhone: event.organizerPhone,
          amount: orgRevenue,
          note: `Reversement billetterie — ${event.title}`,
        }),
      });
      const data = await res.json();
      setPayoutMsg(data.message || (data.success ? 'Demande envoyée !' : data.error || 'Erreur'));
    } catch {
      setPayoutMsg('Erreur réseau.');
    } finally {
      setRequestingPayout(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#0a0f1e', color: '#e2e8f0', fontFamily: 'var(--font-sans, Arial, sans-serif)' }}>
      {/* HEADER */}
      <div style={{ background: 'linear-gradient(135deg,#1B0E78,#27149F,#4B2CE0)', padding: 'clamp(24px,4vw,40px) clamp(16px,4vw,40px)' }}>
        <p style={{ margin: '0 0 4px', fontSize: '0.75rem', color: '#BDB6EE', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
          Dashboard Organisateur 🎟️
        </p>
        <h1 style={{ margin: '0 0 8px', color: '#fff', fontSize: 'clamp(1.4rem,3.5vw,2rem)', fontWeight: 900 }}>{event.title}</h1>
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', fontSize: '0.85rem', color: '#D9D4FA' }}>
          <span><Calendar style={{ width: '13px', height: '13px', display: 'inline', marginRight: '4px' }} />{event.date}</span>
          <span><MapPin style={{ width: '13px', height: '13px', display: 'inline', marginRight: '4px' }} />{event.venue}</span>
        </div>
      </div>

      <main style={{ maxWidth: '1100px', margin: '0 auto', padding: 'clamp(20px,3vw,36px) clamp(16px,3vw,32px)', display: 'flex', flexDirection: 'column', gap: '24px' }}>

        {/* KPI CARDS */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px,1fr))', gap: '16px' }}>
          {[
            { icon: <Ticket style={{ width: '22px', height: '22px', color: '#818cf8' }} />, label: 'Places vendues', value: totalSeats.toString(), sub: 'billets confirmés' },
            { icon: <DollarSign style={{ width: '22px', height: '22px', color: '#34d399' }} />, label: 'Revenus bruts', value: `${totalRevenue.toLocaleString('fr-FR')} FCFA`, sub: 'total collecté' },
            { icon: <TrendingUp style={{ width: '22px', height: '22px', color: '#f59e0b' }} />, label: 'Votre part', value: `${orgRevenue.toLocaleString('fr-FR')} FCFA`, sub: `${orgPct}% des ventes` },
            { icon: <Users style={{ width: '22px', height: '22px', color: '#c084fc' }} />, label: 'Acheteurs', value: new Set(paidTickets.map((t) => t.buyer_email)).size.toString(), sub: 'personnes uniques' },
          ].map((card) => (
            <div key={card.label} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', padding: '20px' }}>
              <div style={{ marginBottom: '12px' }}>{card.icon}</div>
              <p style={{ margin: '0 0 4px', fontSize: '0.75rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{card.label}</p>
              <p style={{ margin: '0 0 2px', fontSize: '1.4rem', fontWeight: 900, color: '#fff' }}>{card.value}</p>
              <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748b' }}>{card.sub}</p>
            </div>
          ))}
        </div>

        {/* PASS BREAKDOWN */}
        <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '20px', padding: '24px' }}>
          <h2 style={{ margin: '0 0 16px', fontSize: '1rem', fontWeight: 800, color: '#e2e8f0' }}>Ventes par type de billet</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {Object.entries(byPass).map(([passName, info]) => {
              const pct = info.passQty ? Math.round((info.count / info.passQty) * 100) : 0;
              return (
                <div key={passName}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.88rem' }}>
                    <span style={{ fontWeight: 700, color: '#e2e8f0' }}>{passName}</span>
                    <span style={{ color: '#94a3b8' }}>{info.count} vendu{info.count > 1 ? 's' : ''} / {info.passQty || '∞'} — <b style={{ color: '#34d399' }}>{info.revenue.toLocaleString('fr-FR')} FCFA</b></span>
                  </div>
                  {info.passQty && (
                    <div style={{ height: '6px', background: 'rgba(255,255,255,0.08)', borderRadius: '99px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${Math.min(pct, 100)}%`, background: 'linear-gradient(90deg,#818cf8,#4B2CE0)', borderRadius: '99px', transition: 'width 0.6s' }} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* PAYOUT */}
        <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '20px', padding: '24px' }}>
          <h2 style={{ margin: '0 0 6px', fontSize: '1rem', fontWeight: 800, color: '#e2e8f0' }}>Demander un reversement</h2>
          <p style={{ margin: '0 0 20px', fontSize: '0.84rem', color: '#64748b' }}>
            Part disponible : <strong style={{ color: '#34d399' }}>{orgRevenue.toLocaleString('fr-FR')} FCFA</strong> ({orgPct}% des ventes)
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
            <div style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '12px', padding: '12px 16px', flex: 1, minWidth: '200px' }}>
              <p style={{ margin: 0, fontSize: '0.75rem', color: '#94a3b8', marginBottom: '4px' }}>Numéro Mobile Money</p>
              <p style={{ margin: 0, fontWeight: 800, color: '#e2e8f0' }}>{event.organizerPhone || 'Non renseigné'}</p>
            </div>
            <button
              type="button"
              onClick={handleRequestPayout}
              disabled={requestingPayout || orgRevenue < 100}
              style={{
                padding: '14px 24px', borderRadius: '12px', border: 'none',
                background: requestingPayout ? '#374151' : 'linear-gradient(135deg,#27149F,#4B2CE0)',
                color: '#fff', fontWeight: 800, fontSize: '0.92rem', cursor: requestingPayout ? 'not-allowed' : 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              {requestingPayout ? '⏳ Envoi…' : `💸 Demander ${orgRevenue.toLocaleString('fr-FR')} FCFA`}
            </button>
          </div>
          {payoutMsg && (
            <div style={{ background: 'rgba(16,185,129,0.12)', border: '1px solid #10b981', borderRadius: '10px', padding: '12px 16px', fontSize: '0.85rem', color: '#34d399', fontWeight: 600 }}>
              {payoutMsg}
            </div>
          )}
        </div>

        {/* BUYERS TABLE */}
        <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '20px', overflow: 'hidden' }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#e2e8f0' }}>Liste des acheteurs</h2>
            <button type="button" onClick={loadData}
              style={{ background: 'none', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '8px', color: '#94a3b8', padding: '6px 12px', cursor: 'pointer', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <RefreshCw style={{ width: '13px', height: '13px' }} /> Actualiser
            </button>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '600px' }}>
              <thead>
                <tr style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#64748b', background: 'rgba(255,255,255,0.03)' }}>
                  <th style={{ padding: '12px 20px', textAlign: 'left' }}>Acheteur</th>
                  <th style={{ padding: '12px 20px', textAlign: 'left' }}>Pass</th>
                  <th style={{ padding: '12px 20px', textAlign: 'left' }}>Places</th>
                  <th style={{ padding: '12px 20px', textAlign: 'left' }}>Montant</th>
                  <th style={{ padding: '12px 20px', textAlign: 'left' }}>Statut</th>
                </tr>
              </thead>
              <tbody>
                {paidTickets.length === 0 ? (
                  <tr><td colSpan={5} style={{ padding: '36px', textAlign: 'center', color: '#64748b' }}>Aucun billet vendu pour l'instant.</td></tr>
                ) : (
                  paidTickets.map((t) => (
                    <tr key={t.id} style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                      <td style={{ padding: '14px 20px' }}>
                        <p style={{ margin: '0 0 2px', fontWeight: 700, color: '#e2e8f0', fontSize: '0.9rem' }}>{t.buyer_name}</p>
                        <p style={{ margin: 0, fontSize: '0.75rem', color: '#818cf8' }}>
                          <Mail style={{ width: '11px', height: '11px', display: 'inline', marginRight: '3px' }} />{t.buyer_email}
                        </p>
                        {t.buyer_phone && <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: '#64748b' }}>
                          <Phone style={{ width: '11px', height: '11px', display: 'inline', marginRight: '3px' }} />{t.buyer_phone}
                        </p>}
                      </td>
                      <td style={{ padding: '14px 20px', fontSize: '0.85rem', color: '#c4b5fd', fontWeight: 700 }}>{t.pass_name}</td>
                      <td style={{ padding: '14px 20px', fontSize: '0.9rem', fontWeight: 800, color: '#e2e8f0' }}>{t.quantity || 1}</td>
                      <td style={{ padding: '14px 20px', fontSize: '0.9rem', fontWeight: 800, color: '#34d399' }}>
                        {(t.total_price || t.unit_price * (t.quantity || 1)).toLocaleString('fr-FR')} F
                      </td>
                      <td style={{ padding: '14px 20px' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '3px 10px', borderRadius: '99px', fontSize: '0.72rem', fontWeight: 800, background: t.status === 'USED' ? 'rgba(239,68,68,0.15)' : 'rgba(16,185,129,0.15)', color: t.status === 'USED' ? '#ef4444' : '#34d399' }}>
                          {t.status === 'USED' ? <CheckCircle2 style={{ width: '11px', height: '11px' }} /> : <Clock style={{ width: '11px', height: '11px' }} />}
                          {t.status === 'USED' ? 'Entré' : 'Non utilisé'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </main>
    </div>
  );
}

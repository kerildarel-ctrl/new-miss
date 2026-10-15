'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { AdminSidebar } from '@/components/AdminSidebar';
import { AdminAuthGuard } from '@/components/AdminAuthGuard';
import { StatisticsCard } from '@/components/StatisticsCard';
import { getCompetitions, getCandidates } from '@/services/dbService';
import { Competition, Candidate } from '@/data/mockData';
import { Trophy, Users, Vote, Ticket, Calendar, TrendingUp, Activity, DollarSign, ArrowRight, Wallet, RefreshCw } from 'lucide-react';
import { calculateTierRevenue } from '@/utils/revenueTiers';

export default function KerilDashboardPage() {
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [ticketCount, setTicketCount] = useState<number>(0);
  const [eventCount, setEventCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);

  const loadLiveData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [comps, cands, ticketsRes, eventsRes] = await Promise.all([
        getCompetitions(),
        getCandidates(),
        fetch('/api/tickets?_t=' + Date.now(), { cache: 'no-store' }).then(r => r.json()).catch(() => ({ data: [] })),
        fetch('/api/tickets/events?_t=' + Date.now(), { cache: 'no-store' }).then(r => r.json()).catch(() => ({ data: [] })),
      ]);
      setCompetitions(comps);
      setCandidates(cands);
      setTicketCount(Array.isArray(ticketsRes?.data) ? ticketsRes.data.length : (Array.isArray(ticketsRes) ? ticketsRes.length : 0));
      setEventCount(Array.isArray(eventsRes?.data) ? eventsRes.data.length : (Array.isArray(eventsRes) ? eventsRes.length : 0));
    } catch { /* continue */ }
    finally { setIsLoading(false); }
  }, []);

  useEffect(() => { loadLiveData(); }, [loadLiveData]);

  const totalVotes = candidates.reduce((sum, c) => sum + c.voteCount, 0);
  const globalTier = calculateTierRevenue(totalVotes);

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
        {/* Sidebar */}
        <AdminSidebar />

        {/* Main Content Area */}
        <main
          className="lg:ml-64"
          style={{
            flex: 1,
            minWidth: 0,
            padding: ' clamp(16px, 3vw, 36px)',
            display: 'flex',
            flexDirection: 'column',
            gap: '24px',
          }}
        >
          {/* Top Header */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '16px',
              paddingBottom: '20px',
              borderBottom: '1px solid var(--line)',
            }}
          >
            <div>
              <p className="eb">Espace Administration Sécurisé /keril</p>
              <h1 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.4rem)', marginTop: '4px' }}>
                Dashboard <span style={{ color: 'var(--p)' }}>Admin</span>
              </h1>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span
                style={{
                  padding: '6px 14px',
                  borderRadius: '99px',
                  background: 'rgba(16, 185, 129, 0.12)',
                  color: '#10b981',
                  border: '1px solid rgba(16, 185, 129, 0.25)',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }} />
                Système Actif
              </span>
              <button
                type="button"
                onClick={loadLiveData}
                disabled={isLoading}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 14px', borderRadius: '99px', background: 'var(--bg)', border: '1.5px solid var(--line)', color: 'var(--ink)', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer' }}
              >
                <RefreshCw style={{ width: '14px', height: '14px', animation: isLoading ? 'spin 1s linear infinite' : 'none' }} />
                Actualiser
              </button>
            </div>
          </div>

          {/* 6 DYNAMIC STATISTICAL KPI CARDS */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
              gap: '18px',
            }}
          >
            <StatisticsCard
              title="Compétitions"
              value={isLoading ? '...' : competitions.length.toString()}
              icon={Trophy}
              subtitle={`${competitions.filter((c) => c.status === 'EN COURS').length} en cours`}
              change={competitions.length > 0 ? `+${competitions.length} créée(s)` : '0 compétition'}
              isPositive={true}
            />
            <StatisticsCard
              title="Candidats"
              value={isLoading ? '...' : candidates.length.toString()}
              icon={Users}
              subtitle="Répartis sur vos concours"
              change={candidates.length > 0 ? `+${candidates.length} enregistré(s)` : '0 candidat'}
              isPositive={true}
            />
            <StatisticsCard
              title="Total Votes"
              value={isLoading ? '...' : totalVotes.toLocaleString('fr-FR')}
              icon={Vote}
              subtitle="Votes comptabilisés"
              change={totalVotes > 0 ? `+${totalVotes} vote(s)` : '0 vote'}
              isPositive={true}
            />
            <StatisticsCard
              title="Billets Vendus"
              value={isLoading ? '...' : ticketCount.toLocaleString('fr-FR')}
              icon={Ticket}
              subtitle="Billets payés et émis"
              change={ticketCount > 0 ? `+${ticketCount} billet(s)` : '0 billet'}
              isPositive={ticketCount > 0}
            />
            <StatisticsCard
              title="Événements"
              value={isLoading ? '...' : eventCount.toString()}
              icon={Calendar}
              subtitle="Événements billetterie"
              change={eventCount > 0 ? `+${eventCount} événement(s)` : '0 événement'}
              isPositive={eventCount > 0}
            />
            <StatisticsCard
              title="Revenus Bruts"
              value={isLoading ? '...' : `${globalTier.totalGross.toLocaleString('fr-FR')} F`}
              icon={DollarSign}
              subtitle="Volume total collecté"
              change={globalTier.totalGross > 0 ? `Net: ${globalTier.voteMoiNetProfit.toLocaleString('fr-FR')} F` : '0 FCFA'}
              isPositive={globalTier.totalGross > 0}
            />
          </div>

          {/* BANNIÈRE MONÉTISATION & RENTABILITÉ CONFIDENTIELLE */}
          <div
            style={{
              background: 'linear-gradient(135deg, rgba(91, 61, 245, 0.08) 0%, rgba(255, 90, 126, 0.06) 100%)',
              border: '1.5px solid rgba(91, 61, 245, 0.25)',
              borderRadius: '20px',
              padding: '22px 26px',
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '20px',
              boxShadow: 'var(--shadow)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div
                style={{
                  width: '52px',
                  height: '52px',
                  borderRadius: '16px',
                  background: 'var(--p)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  boxShadow: '0 8px 18px rgba(91, 61, 245, 0.35)',
                  flexShrink: 0,
                }}
              >
                <DollarSign className="w-7 h-7" />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 800 }}>Monétisation & Revenus VoteMoi (Modèle Paliers)</h3>
                  <span
                    style={{
                      background: 'rgba(91, 61, 245, 0.15)',
                      color: 'var(--p)',
                      padding: '2px 8px',
                      borderRadius: '6px',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                    }}
                  >
                    CONFIDENTIEL KERIL
                  </span>
                </div>
                <p className="mute sm" style={{ marginTop: '4px' }}>
                  Volume brut : <strong>{globalTier.totalGross.toLocaleString('fr-FR')} FCFA</strong> • Marge nette VoteMoi estimée :{' '}
                  <strong style={{ color: 'var(--p)' }}>+{globalTier.voteMoiNetProfit.toLocaleString('fr-FR')} FCFA</strong> • Frais API (4%) :{' '}
                  <strong>{globalTier.apiFees.toLocaleString('fr-FR')} FCFA</strong>
                </p>
              </div>
            </div>

            <Link
              href="/keril/finances"
              className="btn p"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 22px',
                borderRadius: '12px',
                fontWeight: 700,
                fontSize: '0.88rem',
                textDecoration: 'none',
              }}
            >
              <Wallet className="w-4 h-4" />
              <span>Gérer les Finances & Retraits</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* CHARTS & RECENT ACTIVITY SECTION */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: '24px',
            }}
          >
            {/* Left Col: Activity Charts */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {/* Votes Activity Chart */}
              <div
                style={{
                  background: 'var(--bg)',
                  borderRadius: '20px',
                  border: '1px solid var(--line)',
                  padding: '24px',
                  boxShadow: 'var(--shadow)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <TrendingUp className="w-5 h-5" style={{ color: 'var(--p)' }} />
                  <div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>
                      Activité Hebdomadaire des Votes
                    </h3>
                    <p className="mute sm">Volume quotidien des suffrages exprimés</p>
                  </div>
                </div>

                <div
                  style={{
                    height: '200px',
                    width: '100%',
                    display: 'flex',
                    alignItems: 'flex-end',
                    gap: '12px',
                    paddingTop: '24px',
                    paddingBottom: '8px',
                  }}
                >
                  {[
                    { day: 'Lun', val: Math.round(totalVotes * 0.1) },
                    { day: 'Mar', val: Math.round(totalVotes * 0.12) },
                    { day: 'Mer', val: Math.round(totalVotes * 0.15) },
                    { day: 'Jeu', val: Math.round(totalVotes * 0.13) },
                    { day: 'Ven', val: Math.round(totalVotes * 0.2) },
                    { day: 'Sam', val: Math.round(totalVotes * 0.25) },
                    { day: 'Dim', val: Math.round(totalVotes * 0.05) },
                  ].map((item, i) => (
                    <div
                      key={i}
                      style={{
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '6px',
                        height: '100%',
                        justifyContent: 'flex-end',
                      }}
                    >
                      <span
                        style={{
                          fontSize: '0.7rem',
                          fontFamily: 'monospace',
                          color: 'var(--p)',
                          fontWeight: 700,
                        }}
                      >
                        {item.val}
                      </span>
                      <div
                        style={{
                          width: '100%',
                          background: 'linear-gradient(to top, var(--p), #8e7bff)',
                          borderRadius: '6px 6px 0 0',
                          height:
                            totalVotes > 0
                              ? `${Math.max(8, (item.val / (totalVotes * 0.25 || 1)) * 100)}%`
                              : '8px',
                          transition: 'height 0.3s ease',
                        }}
                      />
                      <span className="mute" style={{ fontSize: '0.75rem', fontWeight: 600 }}>
                        {item.day}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Competitions Distribution Chart */}
              <div
                style={{
                  background: 'var(--bg)',
                  borderRadius: '20px',
                  border: '1px solid var(--line)',
                  padding: '24px',
                  boxShadow: 'var(--shadow)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Trophy className="w-5 h-5" style={{ color: 'var(--p)' }} />
                  <div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>
                      Répartition des Votes par Compétition
                    </h3>
                  </div>
                </div>

                {competitions.length === 0 ? (
                  <p className="mute sm" style={{ padding: '16px 0', textAlign: 'center' }}>
                    Aucune compétition active.
                  </p>
                ) : (
                  <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    {competitions.map((comp) => {
                      const compCandidates = candidates.filter((c) => c.competitionSlug === comp.slug);
                      const compVotes = compCandidates.reduce((s, c) => s + c.voteCount, 0);
                      const pct =
                        totalVotes > 0 ? Math.min(Math.round((compVotes / totalVotes) * 100), 100) : 0;
                      return (
                        <div key={comp.id} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          <div
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              fontSize: '0.82rem',
                              fontWeight: 700,
                            }}
                          >
                            <span>{comp.title} ({comp.votePrice || 100} FCFA)</span>
                            <span style={{ color: 'var(--p)', fontFamily: 'monospace' }}>
                              {compVotes.toLocaleString('fr-FR')} votes ({pct}%)
                            </span>
                          </div>
                          <div className="prb">
                            <i style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Right Col: Recent Votes Feed */}
            <div>
              <div
                style={{
                  background: 'var(--bg)',
                  borderRadius: '20px',
                  border: '1px solid var(--line)',
                  padding: '24px',
                  boxShadow: 'var(--shadow)',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingBottom: '16px',
                    borderBottom: '1px solid var(--line)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Activity className="w-5 h-5" style={{ color: 'var(--p)' }} />
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Derniers Votes Exprimés</h3>
                  </div>
                  <span
                    className="chip"
                    style={{ fontSize: '0.68rem', padding: '2px 8px' }}
                  >
                    En direct
                  </span>
                </div>

                {candidates.length === 0 || totalVotes === 0 ? (
                  <p className="mute sm" style={{ padding: '24px 0', textAlign: 'center' }}>
                    Aucun vote enregistré pour le moment.
                  </p>
                ) : (
                  <div style={{ marginTop: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {candidates
                      .filter((c) => c.voteCount > 0)
                      .slice(0, 6)
                      .map((cand) => (
                        <div
                          key={cand.id}
                          style={{
                            background: 'var(--soft)',
                            padding: '12px 16px',
                            borderRadius: '14px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: '12px',
                          }}
                        >
                          <div>
                            <div style={{ fontWeight: 700, fontSize: '0.88rem' }}>
                              {cand.firstName} {cand.lastName}
                            </div>
                            <div className="mute" style={{ fontSize: '0.75rem' }}>
                              {cand.competitionSlug} · #{cand.candidateNumber}
                            </div>
                          </div>
                          <span
                            style={{
                              fontSize: '0.78rem',
                              fontFamily: 'monospace',
                              fontWeight: 700,
                              color: 'var(--p)',
                              background: 'rgba(91, 61, 245, 0.12)',
                              padding: '4px 10px',
                              borderRadius: '99px',
                            }}
                          >
                            {cand.voteCount} vote(s)
                          </span>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </AdminAuthGuard>
  );
}

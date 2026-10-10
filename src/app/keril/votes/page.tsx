'use client';

import React, { useState } from 'react';
import { AdminSidebar } from '@/components/AdminSidebar';
import { AdminAuthGuard } from '@/components/AdminAuthGuard';
import { INITIAL_ADMIN_STATS, RecentVote } from '@/data/mockData';
import { CheckCircle2, Mail, Copy, Check } from 'lucide-react';

export default function KerilVotesPage() {
  const [votes] = useState<RecentVote[]>(INITIAL_ADMIN_STATS.recentVotes || []);
  const [copied, setCopied] = useState(false);

  // Extract all emails
  const allEmails = Array.from(
    new Set(
      votes
        .map((v) => (v as any).voterEmail || (v as any).email || 'voteur.exemple@gmail.com')
        .filter(Boolean)
    )
  );

  const handleCopyEmails = () => {
    const emailsText = allEmails.join(', ');
    if (navigator.clipboard) {
      navigator.clipboard.writeText(emailsText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
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
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '16px',
            }}
          >
            <div>
              <p className="eb">Historique des Transactions & Email Votants (/keril)</p>
              <h1 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.4rem)', marginTop: '4px' }}>
                Logs & <span style={{ color: 'var(--p)' }}>Emails des Votants</span>
              </h1>
            </div>

            {/* BUTTON TO COPY ALL VOTERS EMAILS */}
            <button
              type="button"
              onClick={handleCopyEmails}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 20px',
                borderRadius: '14px',
                background: 'var(--p)',
                color: '#ffffff',
                fontWeight: 700,
                fontSize: '0.92rem',
                border: 'none',
                cursor: 'pointer',
                boxShadow: '0 8px 20px rgba(124, 58, 237, 0.3)',
              }}
            >
              {copied ? <Check className="w-4 h-4" /> : <Mail className="w-4 h-4" />}
              <span>{copied ? 'Adresses email copiées !' : 'Copier la liste des Emails'}</span>
            </button>
          </div>

          {/* Votes Log Table */}
          <div
            style={{
              background: 'var(--bg)',
              borderRadius: '20px',
              border: '1px solid var(--line)',
              boxShadow: 'var(--shadow)',
              overflow: 'hidden',
            }}
          >
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '780px' }}>
                <thead>
                  <tr
                    style={{
                      background: 'var(--soft)',
                      borderBottom: '1px solid var(--line)',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                      color: 'var(--mute)',
                    }}
                  >
                    <th style={{ padding: '16px 20px' }}>ID Vote</th>
                    <th style={{ padding: '16px 20px' }}>Candidat Cible</th>
                    <th style={{ padding: '16px 20px' }}>Compétition</th>
                    <th style={{ padding: '16px 20px' }}>Email Votant</th>
                    <th style={{ padding: '16px 20px' }}>Montant</th>
                    <th style={{ padding: '16px 20px' }}>Horodatage</th>
                    <th style={{ padding: '16px 20px', textAlign: 'right' }}>Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {votes.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ padding: '32px', textAlign: 'center', color: 'var(--mute)' }}>
                        Aucun log de vote enregistré pour le moment.
                      </td>
                    </tr>
                  ) : (
                    votes.map((vote) => {
                      const voterEmail = (vote as any).voterEmail || (vote as any).email || 'voteur.exemple@gmail.com';
                      return (
                        <tr key={vote.id} style={{ borderBottom: '1px solid var(--line)' }}>
                          <td style={{ padding: '16px 20px', fontFamily: 'monospace', fontSize: '0.75rem', color: 'var(--p)' }}>
                            {vote.id}
                          </td>
                          <td style={{ padding: '16px 20px', fontWeight: 800 }}>
                            {vote.candidateName}
                          </td>
                          <td style={{ padding: '16px 20px', fontSize: '0.82rem', color: 'var(--mute)' }}>
                            {vote.competitionTitle}
                          </td>
                          <td style={{ padding: '16px 20px', fontSize: '0.85rem', fontWeight: 600, color: 'var(--p)' }}>
                            ✉️ {voterEmail}
                          </td>
                          <td style={{ padding: '16px 20px', fontFamily: 'monospace', fontWeight: 800, color: '#10b981' }}>
                            100 FCFA
                          </td>
                          <td style={{ padding: '16px 20px', fontSize: '0.75rem', fontFamily: 'monospace', color: 'var(--mute)' }}>
                            {vote.timestamp}
                          </td>
                          <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                padding: '4px 10px',
                                borderRadius: '99px',
                                fontSize: '0.75rem',
                                fontWeight: 700,
                                background: 'rgba(16, 185, 129, 0.12)',
                                color: '#10b981',
                              }}
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" /> Validé
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </AdminAuthGuard>
  );
}

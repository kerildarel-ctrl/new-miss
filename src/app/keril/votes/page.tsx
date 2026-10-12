'use client';

import React, { useState, useEffect } from 'react';
import { AdminSidebar } from '@/components/AdminSidebar';
import { AdminAuthGuard } from '@/components/AdminAuthGuard';
import { CheckCircle2, Mail, Check, Clock } from 'lucide-react';

export default function KerilVotesPage() {
  const [votes, setVotes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function loadVotes() {
      setIsLoading(true);
      try {
        const adminKey = sessionStorage.getItem('keril_admin_key') || 'Arielle74#';
        const res = await fetch('/api/admin/votes', {
          headers: { 'x-admin-key': adminKey },
          cache: 'no-store',
        });
        const data = await res.json();
        if (data.success && Array.isArray(data.votes)) {
          setVotes(data.votes);
        }
      } catch (err) {
        console.warn('Erreur chargement votes admin:', err);
      }
      setIsLoading(false);
    }
    loadVotes();
  }, []);

  // Extract all emails
  const allEmails = Array.from(
    new Set(
      votes
        .map((v) => v.voter_email || v.voterEmail || v.email)
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
                  {isLoading ? (
                    <tr>
                      <td colSpan={7} style={{ padding: '32px', textAlign: 'center', color: 'var(--mute)' }}>
                        Chargement des reçus de votes...
                      </td>
                    </tr>
                  ) : votes.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ padding: '32px', textAlign: 'center', color: 'var(--mute)' }}>
                        Aucun vote enregistré pour le moment.
                      </td>
                    </tr>
                  ) : (
                    votes.map((vote) => {
                      const voterEmail = vote.voter_email || vote.voterEmail || 'Non renseigné';
                      const candidateDisplay = vote.candidate_name || vote.candidateName || 'Candidat';
                      const compDisplay = vote.competition_title || vote.competitionTitle || 'Compétition';
                      const amountDisplay = (vote.amount || (vote.vote_count ? vote.vote_count * 100 : 100)).toLocaleString('fr-FR');
                      const dateDisplay = vote.created_at ? new Date(vote.created_at).toLocaleString('fr-FR') : (vote.timestamp || '-');
                      const isValid = vote.payment_status === 'SUCCESSFUL' || vote.status === 'SUCCESSFUL' || vote.status === 'PAID';

                      return (
                        <tr key={vote.id} style={{ borderBottom: '1px solid var(--line)' }}>
                          <td style={{ padding: '16px 20px', fontFamily: 'monospace', fontSize: '0.75rem', color: 'var(--p)' }}>
                            {vote.id}
                          </td>
                          <td style={{ padding: '16px 20px', fontWeight: 800 }}>
                            {candidateDisplay}
                          </td>
                          <td style={{ padding: '16px 20px', fontSize: '0.82rem', color: 'var(--mute)' }}>
                            {compDisplay}
                          </td>
                          <td style={{ padding: '16px 20px', fontSize: '0.85rem', fontWeight: 600, color: 'var(--p)' }}>
                            ✉️ {voterEmail}
                          </td>
                          <td style={{ padding: '16px 20px', fontFamily: 'monospace', fontWeight: 800, color: '#10b981' }}>
                            {amountDisplay} FCFA {vote.vote_count ? `(${vote.vote_count} vote${vote.vote_count > 1 ? 's' : ''})` : ''}
                          </td>
                          <td style={{ padding: '16px 20px', fontSize: '0.75rem', fontFamily: 'monospace', color: 'var(--mute)' }}>
                            {dateDisplay}
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
                                background: isValid ? 'rgba(16, 185, 129, 0.12)' : 'rgba(245, 158, 11, 0.12)',
                                color: isValid ? '#10b981' : '#f59e0b',
                              }}
                            >
                              {isValid ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                              {isValid ? 'Validé' : 'En attente'}
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

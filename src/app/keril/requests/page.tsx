'use client';

import React, { useState, useEffect } from 'react';
import { AdminSidebar } from '@/components/AdminSidebar';
import { AdminAuthGuard } from '@/components/AdminAuthGuard';
import { getEventRequests, EventRequestData } from '@/services/dbService';
import { Inbox, Trophy, Phone, Mail, DollarSign, Users, Calendar, MessageSquare, Trash2, Search } from 'lucide-react';

export default function AdminRequestsPage() {
  const [requests, setRequests] = useState<EventRequestData[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadRequests() {
      setIsLoading(true);
      const data = await getEventRequests();
      setRequests(data);
      setIsLoading(false);
    }
    loadRequests();
  }, []);

  const handleDelete = (id?: string) => {
    if (!id) return;
    if (confirm('Voulez-vous supprimer cette demande d\'événement ?')) {
      const updated = requests.filter((r) => r.id !== id);
      setRequests(updated);
      if (typeof window !== 'undefined') {
        localStorage.setItem('miss_mister_event_requests', JSON.stringify(updated));
      }
    }
  };

  const filteredRequests = requests.filter(
    (r) =>
      r.eventName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.organizerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.phone.includes(searchQuery) ||
      r.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
          {/* Header */}
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
              <p className="eb">Espace /keril Admin</p>
              <h1 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.4rem)', marginTop: '4px' }}>
                Demandes d&apos;<span style={{ color: 'var(--p)' }}>Événements</span>
              </h1>
              <p className="mute sm" style={{ marginTop: '4px' }}>
                Consultez et gérez les demandes de création d&apos;élections en ligne.
              </p>
            </div>

            <div>
              <span className="chip">
                {requests.length} demande{requests.length > 1 ? 's' : ''} reçue{requests.length > 1 ? 's' : ''}
              </span>
            </div>
          </div>

          {/* Search Input */}
          <div style={{ position: 'relative', width: 'min(480px, 100%)' }}>
            <Search
              className="w-4 h-4"
              style={{
                position: 'absolute',
                left: '14px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--mute)',
              }}
            />
            <input
              type="text"
              placeholder="Rechercher par nom d'événement, organisateur, téléphone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ paddingLeft: '40px', marginTop: 0 }}
            />
          </div>

          {/* List of Requests */}
          {isLoading ? (
            <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--mute)' }}>
              Chargement des demandes...
            </div>
          ) : filteredRequests.length === 0 ? (
            <div
              style={{
                background: 'var(--bg)',
                borderRadius: '20px',
                padding: '48px 24px',
                textAlign: 'center',
                border: '1px solid var(--line)',
                boxShadow: 'var(--shadow)',
              }}
            >
              <Inbox className="w-12 h-12" style={{ color: 'var(--mute)', margin: '0 auto 12px' }} />
              <h3>Aucune demande d&apos;événement enregistrée</h3>
              <p className="mute sm" style={{ maxWidth: '400px', margin: '8px auto 0' }}>
                Les demandes soumises depuis le formulaire du site public apparaîtront ici.
              </p>
            </div>
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                gap: '20px',
              }}
            >
              {filteredRequests.map((req) => (
                <div
                  key={req.id}
                  style={{
                    background: 'var(--bg)',
                    borderRadius: '20px',
                    border: '1px solid var(--line)',
                    padding: '24px',
                    boxShadow: 'var(--shadow)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '16px',
                  }}
                >
                  {/* Card Title */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      paddingBottom: '12px',
                      borderBottom: '1px solid var(--line)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Trophy className="w-5 h-5" style={{ color: 'var(--p)' }} />
                      <h3 style={{ fontSize: '1.05rem', fontWeight: 800 }}>{req.eventName}</h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDelete(req.id)}
                      style={{
                        padding: '6px 8px',
                        borderRadius: '8px',
                        background: 'rgba(255, 90, 126, 0.1)',
                        color: 'var(--a)',
                        border: 'none',
                        cursor: 'pointer',
                      }}
                      title="Supprimer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Grid Info */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '0.82rem' }}>
                    <div>
                      <div className="mute" style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase' }}>
                        Organisateur
                      </div>
                      <div style={{ fontWeight: 800, marginTop: '2px' }}>{req.organizerName}</div>
                    </div>

                    <div>
                      <div className="mute" style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase' }}>
                        WhatsApp
                      </div>
                      <a
                        href={`https://wa.me/${req.phone.replace(/[^0-9]/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: '#10b981', fontWeight: 800, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}
                      >
                        <Phone className="w-3.5 h-3.5" /> {req.phone}
                      </a>
                    </div>

                    <div>
                      <div className="mute" style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase' }}>
                        E-mail
                      </div>
                      <div style={{ fontWeight: 700, color: 'var(--ink)', marginTop: '2px' }}>{req.email || 'N/A'}</div>
                    </div>

                    <div>
                      <div className="mute" style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase' }}>
                        Prix du vote
                      </div>
                      <div style={{ fontWeight: 800, color: 'var(--p)', fontFamily: 'monospace', marginTop: '2px' }}>
                        {req.votePrice || '100'} FCFA
                      </div>
                    </div>

                    <div>
                      <div className="mute" style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase' }}>
                        Candidats estim.
                      </div>
                      <div style={{ fontWeight: 800, marginTop: '2px' }}>{req.candidateEstimate || '10'}</div>
                    </div>

                    <div>
                      <div className="mute" style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase' }}>
                        Période
                      </div>
                      <div style={{ fontWeight: 600, fontSize: '0.75rem', marginTop: '2px' }}>
                        {req.startDate || 'N/A'} au {req.endDate || 'N/A'}
                      </div>
                    </div>
                  </div>

                  {req.description && (
                    <div
                      style={{
                        background: 'var(--soft)',
                        padding: '10px 14px',
                        borderRadius: '12px',
                        fontSize: '0.8rem',
                      }}
                    >
                      <div className="mute" style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase' }}>
                        Précisions
                      </div>
                      <div style={{ marginTop: '2px' }}>{req.description}</div>
                    </div>
                  )}

                  {/* WhatsApp Action */}
                  <a
                    href={`https://wa.me/237692886326?text=${encodeURIComponent(`Bonjour, concernant votre demande pour "${req.eventName}" sur Miss Mister :`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn full"
                    style={{
                      background: '#10b981',
                      gap: '8px',
                      fontSize: '0.85rem',
                      textDecoration: 'none',
                    }}
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>Répondre sur WhatsApp</span>
                  </a>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </AdminAuthGuard>
  );
}

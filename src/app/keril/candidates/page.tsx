'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { AdminSidebar } from '@/components/AdminSidebar';
import { AdminAuthGuard } from '@/components/AdminAuthGuard';
import { CandidateFormModal } from '@/components/CandidateFormModal';
import { INITIAL_CANDIDATES, INITIAL_COMPETITIONS, Candidate } from '@/data/mockData';
import { getCandidates, createCandidate, deleteCandidate } from '@/services/dbService';
import { UserPlus, Edit3, Trash2, Search } from 'lucide-react';

export default function KerilCandidatesPage() {
  const [candidates, setCandidates] = useState<Candidate[]>(INITIAL_CANDIDATES);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCandidate, setEditingCandidate] = useState<Candidate | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      const data = await getCandidates();
      setCandidates(data);
      setIsLoading(false);
    }
    loadData();
  }, []);

  const handleOpenAdd = () => {
    setEditingCandidate(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (cand: Candidate) => {
    setEditingCandidate(cand);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    setCandidates((prev) => prev.filter((c) => c.id !== id));
    setDeletingId(null);
    await deleteCandidate(id);
  };

  const handleSubmitForm = async (formData: Partial<Candidate>) => {
    if (editingCandidate) {
      setCandidates((prev) =>
        prev.map((c) => (c.id === editingCandidate.id ? ({ ...c, ...formData } as Candidate) : c))
      );
    } else {
      const newCandidate = await createCandidate(formData);
      setCandidates((prev) => [newCandidate, ...prev]);
    }
  };

  const filteredCandidates = candidates.filter((c) =>
    `${c.firstName} ${c.lastName} ${c.candidateNumber}`.toLowerCase().includes(searchQuery.toLowerCase())
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
              <p className="eb">Gestion des Candidats (/keril)</p>
              <h1 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.4rem)', marginTop: '4px' }}>
                Candidats <span style={{ color: 'var(--p)' }}>Admin</span>
              </h1>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '12px' }}>
              <div style={{ position: 'relative', width: '220px' }}>
                <Search
                  className="w-4 h-4"
                  style={{
                    position: 'absolute',
                    left: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--mute)',
                  }}
                />
                <input
                  type="text"
                  placeholder="Rechercher..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    paddingLeft: '36px',
                    paddingTop: '8px',
                    paddingBottom: '8px',
                    marginTop: 0,
                    fontSize: '0.85rem',
                  }}
                />
              </div>

              <button
                type="button"
                onClick={handleOpenAdd}
                className="btn"
                style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                <UserPlus className="w-5 h-5" />
                <span>Ajouter un candidat</span>
              </button>
            </div>
          </div>

          {/* Candidates Table */}
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
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '680px' }}>
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
                    <th style={{ padding: '16px 20px' }}>Candidat</th>
                    <th style={{ padding: '16px 20px' }}>Catégorie</th>
                    <th style={{ padding: '16px 20px' }}>Compétition</th>
                    <th style={{ padding: '16px 20px' }}>Score</th>
                    <th style={{ padding: '16px 20px', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td colSpan={5} style={{ padding: '32px', textAlign: 'center', color: 'var(--mute)' }}>
                        Chargement des candidats...
                      </td>
                    </tr>
                  ) : filteredCandidates.length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ padding: '32px', textAlign: 'center', color: 'var(--mute)' }}>
                        Aucun candidat enregistré.
                      </td>
                    </tr>
                  ) : (
                    filteredCandidates.map((cand) => (
                      <tr key={cand.id} style={{ borderBottom: '1px solid var(--line)' }}>
                        <td style={{ padding: '16px 20px', fontWeight: 700 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                            <div
                              style={{
                                position: 'relative',
                                width: '44px',
                                height: '44px',
                                borderRadius: '12px',
                                overflow: 'hidden',
                                flexShrink: 0,
                                background: 'var(--soft)',
                              }}
                            >
                              <Image
                                src={cand.photoUrl}
                                alt={cand.firstName}
                                fill
                                sizes="44px"
                                className="object-cover object-top"
                              />
                            </div>
                            <div>
                              <div style={{ fontSize: '0.95rem', color: 'var(--ink)' }}>
                                {cand.firstName} {cand.lastName}
                              </div>
                              <div className="mute" style={{ fontSize: '0.75rem', fontFamily: 'monospace' }}>
                                N° {cand.candidateNumber} · Rang #{cand.rank}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '16px 20px' }}>
                          <span className="chip" style={{ fontSize: '0.72rem' }}>
                            {cand.category}
                          </span>
                        </td>
                        <td style={{ padding: '16px 20px', fontSize: '0.8rem', fontFamily: 'monospace', color: 'var(--mute)' }}>
                          {cand.competitionSlug}
                        </td>
                        <td style={{ padding: '16px 20px', fontWeight: 800, color: 'var(--p)', fontFamily: 'monospace' }}>
                          {cand.voteCount.toLocaleString('fr-FR')} votes ({cand.percentage}%)
                        </td>
                        <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px' }}>
                            <button
                              type="button"
                              onClick={() => handleOpenEdit(cand)}
                              className="btn sm line"
                              style={{ padding: '8px 10px' }}
                              title="Modifier"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            {deletingId === cand.id ? (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <button
                                  type="button"
                                  onClick={() => handleDelete(cand.id)}
                                  style={{ padding: '6px 10px', borderRadius: '99px', background: 'rgba(255,90,126,0.9)', color: '#fff', border: 'none', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 700 }}
                                >
                                  Confirmer
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setDeletingId(null)}
                                  style={{ padding: '6px 8px', borderRadius: '99px', background: 'var(--soft)', color: 'var(--mute)', border: '1px solid var(--line)', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 700 }}
                                >
                                  ✕
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setDeletingId(cand.id)}
                                style={{ padding: '8px 10px', borderRadius: '99px', background: 'rgba(255, 90, 126, 0.12)', color: 'var(--a)', border: 'none', cursor: 'pointer' }}
                                title="Supprimer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>

        <CandidateFormModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSubmit={handleSubmitForm}
          competitions={INITIAL_COMPETITIONS}
          initialData={editingCandidate}
        />
      </div>
    </AdminAuthGuard>
  );
}

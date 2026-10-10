'use client';

import React, { useState, useEffect } from 'react';
import { AdminSidebar } from '@/components/AdminSidebar';
import { AdminAuthGuard } from '@/components/AdminAuthGuard';
import { CompetitionFormModal } from '@/components/CompetitionFormModal';
import { CandidateFormModal } from '@/components/CandidateFormModal';
import { INITIAL_COMPETITIONS, Competition, Candidate } from '@/data/mockData';
import { getCompetitions, createCompetition, deleteCompetition, createCandidate } from '@/services/dbService';
import { Plus, Edit3, Trash2, Power, Eye, UserPlus } from 'lucide-react';
import Link from 'next/link';

export default function KerilCompetitionsPage() {
  const [competitions, setCompetitions] = useState<Competition[]>(INITIAL_COMPETITIONS);
  const [isCompModalOpen, setIsCompModalOpen] = useState(false);
  const [isCandModalOpen, setIsCandModalOpen] = useState(false);
  const [editingCompetition, setEditingCompetition] = useState<Competition | null>(null);
  const [selectedCompForCand, setSelectedCompForCand] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      const data = await getCompetitions();
      setCompetitions(data);
      setIsLoading(false);
    }
    loadData();
  }, []);

  const handleOpenAddComp = () => {
    setEditingCompetition(null);
    setIsCompModalOpen(true);
  };

  const handleOpenEditComp = (comp: Competition) => {
    setEditingCompetition(comp);
    setIsCompModalOpen(true);
  };

  const handleOpenAddCandForComp = (compSlug: string) => {
    setSelectedCompForCand(compSlug);
    setIsCandModalOpen(true);
  };

  const handleDelete = async (id: string, slug?: string) => {
    if (confirm('Voulez-vous vraiment supprimer cette compétition ?')) {
      setCompetitions((prev) => prev.filter((c) => c.id !== id && c.slug !== slug));
      await deleteCompetition(id, slug);
    }
  };

  const handleToggleStatus = (id: string) => {
    setCompetitions((prev) =>
      prev.map((c) => {
        if (c.id === id) {
          const nextStatus = c.status === 'EN COURS' ? 'TERMINE' : 'EN COURS';
          return { ...c, status: nextStatus };
        }
        return c;
      })
    );
  };

  const handleSubmitCompForm = async (formData: Partial<Competition>) => {
    if (editingCompetition) {
      setCompetitions((prev) =>
        prev.map((c) => (c.id === editingCompetition.id ? ({ ...c, ...formData } as Competition) : c))
      );
    } else {
      const newComp = await createCompetition(formData);
      setCompetitions((prev) => [newComp, ...prev]);
    }
  };

  const handleSubmitCandForm = async (formData: Partial<Candidate>) => {
    await createCandidate({
      ...formData,
      competitionSlug: selectedCompForCand || formData.competitionSlug || competitions[0]?.slug || 'copa-ahn',
    });
    setCompetitions((prev) =>
      prev.map((c) =>
        c.slug === (selectedCompForCand || formData.competitionSlug)
          ? { ...c, totalCandidates: (c.totalCandidates || 0) + 1 }
          : c
      )
    );
    setIsCandModalOpen(false);
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
          {/* Top Bar */}
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
              <p className="eb">Gestion des Événements (/keril)</p>
              <h1 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.4rem)', marginTop: '4px' }}>
                Compétitions <span style={{ color: 'var(--p)' }}>Admin</span>
              </h1>
            </div>

            <button
              type="button"
              onClick={handleOpenAddComp}
              className="btn"
              style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <Plus className="w-5 h-5" />
              <span>Créer une compétition</span>
            </button>
          </div>

          {/* Competitions Table */}
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
                    <th style={{ padding: '16px 20px' }}>Compétition</th>
                    <th style={{ padding: '16px 20px' }}>Prix du Vote</th>
                    <th style={{ padding: '16px 20px' }}>Statut</th>
                    <th style={{ padding: '16px 20px' }}>Candidats</th>
                    <th style={{ padding: '16px 20px' }}>Ajout Candidat</th>
                    <th style={{ padding: '16px 20px', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td colSpan={6} style={{ padding: '32px', textAlign: 'center', color: 'var(--mute)' }}>
                        Chargement des compétitions...
                      </td>
                    </tr>
                  ) : competitions.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ padding: '32px', textAlign: 'center', color: 'var(--mute)' }}>
                        Aucune compétition créée. Cliquez sur Créer une compétition ci-dessus.
                      </td>
                    </tr>
                  ) : (
                    competitions.map((comp) => (
                      <tr
                        key={comp.id}
                        style={{ borderBottom: '1px solid var(--line)' }}
                      >
                        <td style={{ padding: '16px 20px', fontWeight: 700 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div
                              style={{
                                width: '12px',
                                height: '12px',
                                borderRadius: '50%',
                                backgroundColor: comp.primaryColor || 'var(--p)',
                              }}
                            />
                            <div>
                              <div style={{ fontSize: '0.95rem', color: 'var(--ink)' }}>{comp.title}</div>
                              <div className="mute" style={{ fontSize: '0.75rem', fontFamily: 'monospace' }}>
                                /competition/{comp.slug}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '16px 20px', fontFamily: 'monospace', fontWeight: 800, color: 'var(--p)' }}>
                          {comp.votePrice || 100} FCFA
                        </td>
                        <td style={{ padding: '16px 20px' }}>
                          <span
                            className={
                              comp.status === 'EN COURS'
                                ? 'chip'
                                : comp.status === 'A VENIR'
                                ? 'chip av'
                                : 'chip te'
                            }
                          >
                            {comp.status}
                          </span>
                        </td>
                        <td style={{ padding: '16px 20px', fontWeight: 800, fontFamily: 'monospace' }}>
                          {comp.totalCandidates}
                        </td>
                        <td style={{ padding: '16px 20px' }}>
                          <button
                            type="button"
                            onClick={() => handleOpenAddCandForComp(comp.slug)}
                            className="btn sm line"
                            style={{ gap: '6px' }}
                          >
                            <UserPlus className="w-4 h-4" />
                            <span>Ajouter</span>
                          </button>
                        </td>
                        <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px' }}>
                            <Link
                              href={`/competition/${comp.slug}`}
                              target="_blank"
                              className="btn sm line"
                              style={{ padding: '8px 10px' }}
                              title="Voir sur le site public"
                            >
                              <Eye className="w-4 h-4" />
                            </Link>
                            <button
                              type="button"
                              onClick={() => handleToggleStatus(comp.id)}
                              className="btn sm line"
                              style={{ padding: '8px 10px' }}
                              title="Activer / Terminer"
                            >
                              <Power className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleOpenEditComp(comp)}
                              className="btn sm line"
                              style={{ padding: '8px 10px' }}
                              title="Modifier"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(comp.id, comp.slug)}
                              style={{
                                padding: '8px 10px',
                                borderRadius: '99px',
                                background: 'rgba(255, 90, 126, 0.12)',
                                color: 'var(--a)',
                                border: 'none',
                                cursor: 'pointer',
                              }}
                              title="Supprimer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
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

        <CompetitionFormModal
          isOpen={isCompModalOpen}
          onClose={() => setIsCompModalOpen(false)}
          onSubmit={handleSubmitCompForm}
          initialData={editingCompetition}
        />

        <CandidateFormModal
          isOpen={isCandModalOpen}
          onClose={() => setIsCandModalOpen(false)}
          onSubmit={handleSubmitCandForm}
          competitions={competitions}
        />
      </div>
    </AdminAuthGuard>
  );
}

'use client';

import React, { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { CompetitionCard } from '@/components/CompetitionCard';
import { getCompetitions } from '@/services/dbService';
import { Competition } from '@/data/mockData';

export default function CompetitionsPage() {
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [filterStatus, setFilterStatus] = useState<'TOUTES' | 'EN COURS' | 'A VENIR' | 'TERMINE'>('TOUTES');
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

  const filteredCompetitions = competitions.filter((comp) => {
    if (filterStatus === 'TOUTES') return true;
    return comp.status === filterStatus;
  });

  const countByStatus = (status: 'TOUTES' | 'EN COURS' | 'A VENIR' | 'TERMINE') => {
    if (status === 'TOUTES') return competitions.length;
    return competitions.filter((c) => c.status === status).length;
  };

  return (
    <>
      <Header />

      <main className="flex-1">
        <section className="pg">
          <div className="wd">
            {/* EYEBROW & TITLE */}
            <p className="eb">Catalogue officiel</p>
            <h1 className="pt">Compétitions</h1>
            <p className="lead">
              Découvrez les élections en cours et à venir sur votre campus. Choisissez une compétition pour voir les candidats et voter.
            </p>

            {/* FILTER PILLS */}
            <div className="fl" role="tablist">
              {[
                { id: 'TOUTES', label: `Toutes (${countByStatus('TOUTES')})` },
                { id: 'EN COURS', label: `En cours (${countByStatus('EN COURS')})` },
                { id: 'A VENIR', label: `À venir (${countByStatus('A VENIR')})` },
                { id: 'TERMINE', label: `Terminées (${countByStatus('TERMINE')})` },
              ].map((tab) => (
                <button
                  key={tab.id}
                  role="tab"
                  aria-pressed={filterStatus === tab.id}
                  onClick={() => setFilterStatus(tab.id as any)}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* TILES GRID */}
            {isLoading ? (
              <div style={{ padding: '60px 0', textAlign: 'center', color: 'var(--mute)' }}>
                Chargement des compétitions...
              </div>
            ) : filteredCompetitions.length === 0 ? (
              <div
                style={{
                  background: 'var(--soft)',
                  borderRadius: '20px',
                  padding: '48px 24px',
                  textAlign: 'center',
                  marginTop: '28px',
                }}
              >
                <h3>Aucune compétition disponible</h3>
                <p className="mute" style={{ marginTop: '8px' }}>
                  Les prochaines élections seront bientôt ouvertes. Restez connectés !
                </p>
              </div>
            ) : (
              <div className="tiles">
                {filteredCompetitions.map((comp) => (
                  <CompetitionCard key={comp.id} competition={comp} />
                ))}
              </div>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}

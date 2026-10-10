'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { CreateEventModal } from '@/components/CreateEventModal';
import { getCompetitions, getCandidates } from '@/services/dbService';
import { Competition, Candidate } from '@/data/mockData';

export default function HomePage() {
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      const comps = await getCompetitions();
      const cands = await getCandidates();
      setCompetitions(comps);
      setCandidates(cands);
      setIsLoading(false);
    }
    loadData();
  }, []);

  const totalVotes = candidates.reduce((sum, c) => sum + c.voteCount, 0);

  return (
    <>
      <Header />

      <main className="flex-1">
        {/* ========================================================================= */}
        {/* HERO SECTION */}
        {/* ========================================================================= */}
        <section className="hero" id="accueil">
          <div className="wd">
            <div className="ht">
              <p className="eb">La plateforme officielle de vote en ligne</p>
              <h1>Miss Mister</h1>
              <p className="tg">Votre vote, votre choix, votre champion.</p>
              <p>
                Soutenez vos candidats favoris en quelques secondes. Simple, transparent et sécurisé par Mobile Money.
              </p>

              {/* SEARCH BAR */}
              <div style={{ maxWidth: '520px', margin: '20px 0 24px' }}>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (searchQuery.trim()) {
                      window.location.href = `/competitions?search=${encodeURIComponent(searchQuery)}`;
                    }
                  }}
                  style={{ display: 'flex', gap: '8px' }}
                >
                  <input
                    type="text"
                    placeholder="Rechercher une compétition ou un candidat..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{
                      background: 'rgba(255, 255, 255, 0.15)',
                      border: '1.5px solid rgba(255, 255, 255, 0.35)',
                      color: '#ffffff',
                      borderRadius: '99px',
                      padding: '12px 20px',
                      marginTop: 0,
                    }}
                  />
                  <button
                    type="submit"
                    className="btn wh"
                    style={{ flexShrink: 0 }}
                  >
                    Chercher
                  </button>
                </form>
              </div>

              <div className="row">
                <Link href="/competitions" className="btn wh">
                  Explorer
                </Link>
                <button
                  type="button"
                  onClick={() => setIsEventModalOpen(true)}
                  className="btn ow"
                >
                  Créer mon événement
                </button>
              </div>

              <div className="lk">
                <Link href="/classement">Voir le classement</Link>
                <Link href="/resultats">Résultats en direct</Link>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* STATS COUNTER BAR */}
        {/* ========================================================================= */}
        <div className="wd">
          <div className="stats" aria-label="Statistiques clés">
            <div>
              <b>{isLoading ? '-' : competitions.length}</b> Compétition{competitions.length > 1 ? 's' : ''}
            </div>
            <div>
              <b>{isLoading ? '-' : candidates.length}</b> Candidat{candidates.length > 1 ? 's' : ''}
            </div>
            <div>
              <b>{isLoading ? '-' : totalVotes.toLocaleString('fr-FR')}</b> Vote{totalVotes > 1 ? 's' : ''} enregistré{totalVotes > 1 ? 's' : ''}
            </div>
            <div>
              <b>100%</b> Mobile Money
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* HOW IT WORKS SECTION */}
        {/* ========================================================================= */}
        <section className="sec" style={{ background: 'var(--soft)' }}>
          <div className="wd">
            <p className="eb">Simple &amp; transparent</p>
            <h2 className="pt" style={{ fontSize: 'clamp(1.8rem, 5.5vw, 2.6rem)' }}>Comment ça marche ?</h2>
            <div className="steps">
              <div>
                <small>ÉTAPE 01</small>
                <h3>Choisissez</h3>
                <p>Parcourez les compétitions et trouvez votre candidat préféré.</p>
              </div>
              <div>
                <small>ÉTAPE 02</small>
                <h3>Définissez vos voix</h3>
                <p>Indiquez le nombre de votes que vous souhaitez attribuer (1 vote = 100 FCFA).</p>
              </div>
              <div>
                <small>ÉTAPE 03</small>
                <h3>Payez</h3>
                <p>Réglez instantanément avec Orange Money ou MTN Mobile Money.</p>
              </div>
              <div>
                <small>ÉTAPE 04</small>
                <h3>Suivez</h3>
                <p>Le classement et les statistiques se mettent à jour immédiatement.</p>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* CALL TO ACTION FOR ORGANIZERS */}
        {/* ========================================================================= */}
        <section className="cta" id="orga">
          <div className="wd">
            <p className="eb">Organisateurs</p>
            <h2>Vous organisez une élection sur votre campus ?</h2>
            <p>
              Créez votre événement en 5 minutes : tableau de bord en direct, reversement automatique des fonds, transparence garantie.
            </p>
            <ul>
              <li>Zéro frais d&apos;installation</li>
              <li>Orange Money &amp; MTN MoMo</li>
              <li>Dashboard temps réel</li>
              <li>Support dédié</li>
            </ul>
            <button
              type="button"
              className="btn wh"
              onClick={() => setIsEventModalOpen(true)}
            >
              Créer mon événement
            </button>
          </div>
        </section>
      </main>

      {/* EVENT CREATION FORM MODAL */}
      <CreateEventModal
        isOpen={isEventModalOpen}
        onClose={() => setIsEventModalOpen(false)}
      />

      <Footer />
    </>
  );
}

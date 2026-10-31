import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'VoteMoi — Votes & Billetterie Cameroun',
    short_name: 'VoteMoi',
    description: 'Plateforme de vote et billetterie pour concours, Miss & Mister, événements campus. 100 FCFA le vote.',
    start_url: '/',
    display: 'standalone',
    background_color: '#0F0A32',
    theme_color: '#27149F',
    orientation: 'portrait',
    lang: 'fr',
    categories: ['entertainment', 'social'],
    icons: [
      {
        src: '/images/logo.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/images/logo.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
    screenshots: [],
    shortcuts: [
      {
        name: 'Résultats en direct',
        short_name: 'Résultats',
        description: 'Voir les résultats des votes en temps réel',
        url: '/resultats',
        icons: [{ src: '/images/logo.png', sizes: '96x96' }],
      },
      {
        name: 'Billetterie',
        short_name: 'Billets',
        description: 'Acheter des billets pour les événements',
        url: '/billetterie',
        icons: [{ src: '/images/logo.png', sizes: '96x96' }],
      },
    ],
  };
}

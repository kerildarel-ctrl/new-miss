'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export type Language = 'FR' | 'EN';

interface LanguageContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  toggleLang: () => void;
  t: (key: string, fallback?: string) => string;
}

const translations: Record<Language, Record<string, string>> = {
  FR: {
    // Navigation
    'nav.home': 'Accueil',
    'nav.competitions': 'Compétitions',
    'nav.rankings': 'Classement',
    'nav.results': 'Résultats',
    'nav.createContest': 'Créer un concours',
    'nav.admin': 'Administration',

    // Modals - Vote
    'vote.badge': 'Vote officiel sécurisé',
    'vote.title': 'Voter pour',
    'vote.candidate': 'Candidat',
    'vote.unitPrice': '100 FCFA par vote (Montant libre en multiples de 100 FCFA)',
    'vote.countLabel': 'Nombre de votes (ou montant de votre choix)',
    'vote.quickPills': 'Packs de votes rapides',
    'vote.paymentMethod': 'Moyen de paiement',
    'vote.phone': 'Numéro de téléphone',
    'vote.phoneTip': 'Numéro Orange Money ou MTN Mobile Money (+237)',
    'vote.payBtn': 'Payer et voter',
    'vote.secureNote': 'Paiement chiffré et sécurisé. Débit direct après validation USSD.',
    'vote.successTitle': '🎉 Vote Confirmé & Comptabilisé !',
    'vote.successDesc': 'Votre vote a été validé et enregistré avec succès.',
    'vote.close': 'Fermer',

    // Modals - Create Competition
    'create.badge': 'Organisateurs',
    'create.title': 'Créer une compétition',
    'create.desc': 'Remplissez les informations de base. Notre équipe configure votre vote en 24h ouvrées.',
    'create.name': 'Nom de l’élection',
    'create.campus': 'Établissement / Ville',
    'create.phone': 'Numéro WhatsApp de l’organisateur',
    'create.price': 'Prix unitaire du vote (FCFA)',
    'create.submit': 'Envoyer la demande sur WhatsApp',
    'create.footer': 'Activation rapide sans frais fixes. Reversement direct via Mobile Money.',

    // Candidate Profile
    'profile.back': '‹ Retour',
    'profile.voteBtn': 'Voter pour',
    'profile.votes': 'votes comptabilisés',
    'profile.rank': 'Rang actuel',
    'profile.category': 'Catégorie',
    'profile.share': 'Partager ce profil',
    'profile.copyLink': 'Copier le lien',
    'profile.copied': 'Lien copié !',
    'profile.qrBadge': '📱 QR code du profil',
    'profile.qrShow': 'Afficher le QR code',
    'profile.qrHide': 'Masquer le QR code',
    'profile.qrDesc': 'Scannez avec un téléphone pour ouvrir directement ce profil et voter.',
    'profile.qrDownload': 'Télécharger l’image QR',
    'profile.bio': 'Biographie officielle',

    // General
    'btn.close': 'Fermer',
    'btn.cancel': 'Annuler',
    'btn.search': 'Rechercher un candidat...',
    'btn.filterAll': 'Tous',
  },

  EN: {
    // Navigation
    'nav.home': 'Home',
    'nav.competitions': 'Competitions',
    'nav.rankings': 'Leaderboard',
    'nav.results': 'Results',
    'nav.createContest': 'Create Contest',
    'nav.admin': 'Admin',

    // Modals - Vote
    'vote.badge': 'Official Secure Voting',
    'vote.title': 'Vote for',
    'vote.candidate': 'Candidate',
    'vote.unitPrice': '100 FCFA per vote (Custom amount in multiples of 100 FCFA)',
    'vote.countLabel': 'Number of votes (or amount of your choice)',
    'vote.quickPills': 'Quick vote packs',
    'vote.paymentMethod': 'Payment method',
    'vote.phone': 'Phone number',
    'vote.phoneTip': 'Orange Money or MTN Mobile Money number (+237)',
    'vote.payBtn': 'Pay & Vote',
    'vote.secureNote': 'Encrypted and secure payment. Direct debit after USSD confirmation.',
    'vote.successTitle': '🎉 Vote Confirmed & Counted!',
    'vote.successDesc': 'Your vote has been successfully validated and recorded.',
    'vote.close': 'Close',

    // Modals - Create Competition
    'create.badge': 'Organizers',
    'create.title': 'Create a Competition',
    'create.desc': 'Fill in the basic info. Our team sets up your voting portal in 24 business hours.',
    'create.name': 'Contest Name',
    'create.campus': 'Institution / City',
    'create.phone': 'Organizer WhatsApp Number',
    'create.price': 'Unit vote price (FCFA)',
    'create.submit': 'Send Request via WhatsApp',
    'create.footer': 'Fast setup without fixed fees. Direct payout via Mobile Money.',

    // Candidate Profile
    'profile.back': '‹ Back',
    'profile.voteBtn': 'Vote for',
    'profile.votes': 'counted votes',
    'profile.rank': 'Current Rank',
    'profile.category': 'Category',
    'profile.share': 'Share this profile',
    'profile.copyLink': 'Copy link',
    'profile.copied': 'Link copied!',
    'profile.qrBadge': '📱 Profile QR code',
    'profile.qrShow': 'Show QR Code',
    'profile.qrHide': 'Hide QR Code',
    'profile.qrDesc': 'Scan with any smartphone to open this candidate profile and vote.',
    'profile.qrDownload': 'Download QR Code',
    'profile.bio': 'Official Biography',

    // General
    'btn.close': 'Close',
    'btn.cancel': 'Cancel',
    'btn.search': 'Search candidate...',
    'btn.filterAll': 'All',
  },
};

const LanguageContext = createContext<LanguageContextType>({
  lang: 'FR',
  setLang: () => {},
  toggleLang: () => {},
  t: (key: string, fallback?: string) => fallback || key,
});

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLangState] = useState<Language>('FR');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('mm_lang') as Language;
      if (saved && (saved === 'FR' || saved === 'EN')) {
        setLangState(saved);
      }
    }
  }, []);

  const setLang = (newLang: Language) => {
    setLangState(newLang);
    if (typeof window !== 'undefined') {
      localStorage.setItem('mm_lang', newLang);
    }
  };

  const toggleLang = () => {
    const nextLang: Language = lang === 'FR' ? 'EN' : 'FR';
    setLang(nextLang);
  };

  const t = (key: string, fallback?: string): string => {
    const dict = translations[lang] || translations.FR;
    return dict[key] || fallback || key;
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, toggleLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);

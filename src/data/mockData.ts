export interface Competition {
  id: string;
  slug: string;
  title: string;
  description: string;
  bannerImage: string;
  logoImage: string;
  startDate: string;
  endDate: string;
  status: 'EN COURS' | 'A VENIR' | 'TERMINE';
  totalCandidates: number;
  totalVotes: number;
  votePrice: number;
  primaryColor: string;
  gradientFrom: string;
  gradientTo: string;
  accentColor: string;
  rules?: string;
  organizerToken?: string;
  organizerPercentage?: number; // Pourcentage convenu avec l'organisateur (50-95%)
}

export interface Candidate {
  id: string;
  competitionSlug: string;
  firstName: string;
  lastName: string;
  candidateNumber: string;
  photoUrl: string;
  bio: string;
  category: 'Miss' | 'Mister' | 'Duo';
  voteCount: number;
  percentage: number;
  rank: number;
  status: 'ACTIF' | 'ELIMINE' | 'DISQUALIFIE';
  socialInstagram?: string;
}

export interface RecentVote {
  id: string;
  candidateName: string;
  competitionTitle: string;
  location: string;
  timestamp: string;
}

// ALL ARRAYS ARE INITIALLY 0 / EMPTY FOR FRESH CUSTOM CREATION
export const INITIAL_COMPETITIONS: Competition[] = [];

export const INITIAL_CANDIDATES: Candidate[] = [];

export const INITIAL_ADMIN_STATS = {
  totalCompetitions: 0,
  activeCompetitions: 0,
  totalCandidates: 0,
  totalVotes: 0,
  uniqueVoters: 0,
  revenueFcfa: 0,
  recentVotes: []
};

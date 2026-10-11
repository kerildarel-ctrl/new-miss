/**
 * Modèle Financier & Calculateur de Paliers VoteMoi
 * 
 * Prix du vote de base : 100 FCFA
 * Passerelle Mobile Money (API) : 4% (4 FCFA)
 * 
 * - Palier 1 (1 à 2 000 votes)      : Organisateur 75% (75F) | VoteMoi 21% (21F) | API 4% (4F)
 * - Palier 2 (2 001 à 10 000 votes) : Organisateur 80% (80F) | VoteMoi 16% (16F) | API 4% (4F)
 * - Palier 3 (10 001+ votes)        : Organisateur 83% (83F) | VoteMoi 13% (13F) | API 4% (4F)
 */

export interface TierRevenueInfo {
  totalVotes: number;
  votePrice: number;
  totalGross: number;
  apiFees: number;
  organizerEarnings: number;
  voteMoiNetProfit: number;
  currentTierNumber: 1 | 2 | 3;
  currentTierName: string;
  currentRateFCFA: number;
  nextTierThreshold: number | null;
  votesNeededForNextTier: number;
  progressPercent: number;
}

export function calculateTierRevenue(totalVotes: number, unitVotePrice = 100): TierRevenueInfo {
  const votes = Math.max(0, totalVotes);
  const price = unitVotePrice || 100;
  const totalGross = votes * price;

  // Frais d'agrégation / API Mobile Money (4% fixe)
  const apiFees = Math.round(totalGross * 0.04);

  // Calcul progressif par tranche
  let organizerEarnings = 0;
  let voteMoiNetProfit = 0;

  // Tranche 1 (0 à 2000) : 75F org / 21F VoteMoi
  const tier1Votes = Math.min(votes, 2000);
  organizerEarnings += tier1Votes * (price * 0.75);
  voteMoiNetProfit += tier1Votes * (price * 0.21);

  // Tranche 2 (2001 à 10000) : 80F org / 16F VoteMoi
  if (votes > 2000) {
    const tier2Votes = Math.min(votes - 2000, 8000);
    organizerEarnings += tier2Votes * (price * 0.80);
    voteMoiNetProfit += tier2Votes * (price * 0.16);
  }

  // Tranche 3 (10001+) : 83F org / 13F VoteMoi
  if (votes > 10000) {
    const tier3Votes = votes - 10000;
    organizerEarnings += tier3Votes * (price * 0.83);
    voteMoiNetProfit += tier3Votes * (price * 0.13);
  }

  organizerEarnings = Math.round(organizerEarnings);
  voteMoiNetProfit = Math.round(voteMoiNetProfit);

  // Métadonnées du palier actuel
  let currentTierNumber: 1 | 2 | 3 = 1;
  let currentTierName = 'Palier Bronze (75%)';
  let currentRateFCFA = Math.round(price * 0.75);
  let nextTierThreshold: number | null = 2000;
  let votesNeededForNextTier = Math.max(0, 2000 - votes);
  let progressPercent = Math.min(100, Math.round((votes / 2000) * 100));

  if (votes > 10000) {
    currentTierNumber = 3;
    currentTierName = 'Palier Diamant Élite (83%)';
    currentRateFCFA = Math.round(price * 0.83);
    nextTierThreshold = null;
    votesNeededForNextTier = 0;
    progressPercent = 100;
  } else if (votes > 2000) {
    currentTierNumber = 2;
    currentTierName = 'Palier Argent Pro (80%)';
    currentRateFCFA = Math.round(price * 0.80);
    nextTierThreshold = 10000;
    votesNeededForNextTier = Math.max(0, 10000 - votes);
    progressPercent = Math.min(100, Math.round(((votes - 2000) / 8000) * 100));
  }

  return {
    totalVotes: votes,
    votePrice: price,
    totalGross,
    apiFees,
    organizerEarnings,
    voteMoiNetProfit,
    currentTierNumber,
    currentTierName,
    currentRateFCFA,
    nextTierThreshold,
    votesNeededForNextTier,
    progressPercent,
  };
}

/**
 * Génère un jeton secret cryptographique indevinable (128 bits d'entropie)
 * Exemple : org_sec_7a8b9c0d1e2f3a4b5c6d7e8f90123456
 */
export function generateOrganizerToken(): string {
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    const hex = Array.from(array, (b) => b.toString(16).padStart(2, '0')).join('');
    return `org_sec_${hex}`;
  }
  const chars = 'abcdef0123456789';
  let result = 'org_sec_';
  for (let i = 0; i < 32; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

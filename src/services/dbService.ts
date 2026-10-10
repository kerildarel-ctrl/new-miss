import { Competition, Candidate, INITIAL_COMPETITIONS, INITIAL_CANDIDATES } from '@/data/mockData';

export interface EventRequestData {
  id?: string;
  eventName: string;
  organizerName: string;
  phone: string;
  email: string;
  votePrice: string;
  candidateEstimate: string;
  startDate?: string;
  endDate?: string;
  description?: string;
  createdAt?: string;
}

// ----------------------------------------------------
// EVENT CREATION REQUESTS STORAGE & WA REDIRECTION
// ----------------------------------------------------

export async function saveEventRequest(reqData: EventRequestData): Promise<EventRequestData> {
  const newReq: EventRequestData = {
    ...reqData,
    id: `req_${Date.now()}`,
    createdAt: new Date().toISOString(),
  };

  try {
    if (typeof window !== 'undefined') {
      const existingStr = localStorage.getItem('miss_mister_event_requests') || '[]';
      const existing: EventRequestData[] = JSON.parse(existingStr);
      existing.unshift(newReq);
      localStorage.setItem('miss_mister_event_requests', JSON.stringify(existing));
    }
  } catch {
    // Continue
  }

  return newReq;
}

export async function getEventRequests(): Promise<EventRequestData[]> {
  try {
    if (typeof window !== 'undefined') {
      const existingStr = localStorage.getItem('miss_mister_event_requests') || '[]';
      return JSON.parse(existingStr);
    }
  } catch {
    // Fallback
  }
  return [];
}

// ----------------------------------------------------
// COMPETITIONS CRUD (MANDATORY SUPABASE + DISK JSON)
// ----------------------------------------------------

export async function getCompetitions(): Promise<Competition[]> {
  try {
    const res = await fetch(`/api/competitions?_t=${Date.now()}`, { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      if (data.success && Array.isArray(data.data) && data.data.length > 0) {
        return data.data;
      }
    }
  } catch {
    // Fallback
  }
  return INITIAL_COMPETITIONS;
}

export async function createCompetition(compData: Partial<Competition>): Promise<Competition> {
  const newComp: Competition = {
    id: compData.id || `comp_${Date.now()}`,
    slug: compData.title ? compData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-') : `comp-${Date.now()}`,
    title: compData.title || 'Nouvelle Compétition',
    description: compData.description || '',
    bannerImage: compData.bannerImage || '/images/copa_ahn_banner.png',
    logoImage: compData.logoImage || '/images/hero_bg.png',
    startDate: compData.startDate || new Date().toISOString(),
    endDate: compData.endDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    status: compData.status || 'EN COURS',
    totalCandidates: 0,
    totalVotes: 0,
    votePrice: compData.votePrice || 100,
    primaryColor: compData.primaryColor || '#2563EB',
    gradientFrom: compData.gradientFrom || '#EC4899',
    gradientTo: compData.gradientTo || '#2563EB',
    accentColor: compData.accentColor || '#3B82F6',
    rules: compData.rules || 'Votes ouverts à tous.'
  };

  const res = await fetch('/api/competitions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(newComp)
  });

  const data = await res.json();

  if (!res.ok || !data.success) {
    alert(data.error || 'Erreur lors de la sauvegarde dans Supabase. Veuillez exécuter le script SQL dans Supabase.');
    throw new Error(data.error || 'Sauvegarde Supabase échouée');
  }

  return data.data || newComp;
}

export async function deleteCompetition(id: string, slug?: string): Promise<boolean> {
  try {
    await fetch(`/api/competitions?id=${id || ''}&slug=${slug || ''}`, {
      method: 'DELETE'
    });
  } catch {
    // Continue
  }
  return true;
}

// ----------------------------------------------------
// CANDIDATES CRUD (MANDATORY SUPABASE + DISK JSON)
// ----------------------------------------------------

export async function getCandidates(competitionSlug?: string): Promise<Candidate[]> {
  try {
    const url = competitionSlug
      ? `/api/candidates?slug=${encodeURIComponent(competitionSlug)}&_t=${Date.now()}`
      : `/api/candidates?_t=${Date.now()}`;
    const res = await fetch(url, { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      if (data.success && Array.isArray(data.data) && data.data.length > 0) {
        return data.data;
      }
    }
  } catch {
    // Fallback
  }
  return INITIAL_CANDIDATES;
}

export async function createCandidate(candidateData: Partial<Candidate>): Promise<Candidate> {
  const newCandidate: Candidate = {
    id: candidateData.id || `cand_${Date.now()}`,
    competitionSlug: candidateData.competitionSlug || 'copa-ahn',
    firstName: candidateData.firstName || 'Prénom',
    lastName: candidateData.lastName || 'KOUSSO',
    candidateNumber: candidateData.candidateNumber || '#99',
    photoUrl: candidateData.photoUrl || '/images/candidate_1.png',
    bio: candidateData.bio || '',
    category: candidateData.category || 'Miss',
    voteCount: 0,
    percentage: 0,
    rank: 1,
    status: 'ACTIF'
  };

  const res = await fetch('/api/candidates', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(newCandidate)
  });

  const data = await res.json();

  if (!res.ok || !data.success) {
    alert(data.error || 'Erreur lors de la sauvegarde dans Supabase.');
    throw new Error(data.error || 'Sauvegarde Supabase échouée');
  }

  return data.data || newCandidate;
}

export async function deleteCandidate(id: string): Promise<boolean> {
  try {
    await fetch(`/api/candidates?id=${id}`, {
      method: 'DELETE'
    });
  } catch {
    // Continue
  }
  return true;
}

// ----------------------------------------------------
// VOTING & SCORE UPDATES
// ----------------------------------------------------

export async function submitVote(
  candidateId: string,
  candidateName: string,
  competitionSlug: string,
  count: number = 1,
  unitPrice: number = 100,
  paymentMethod: string = 'orange'
): Promise<boolean> {
  try {
    await fetch('/api/pay/initiate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        candidateId,
        candidateName,
        competitionSlug,
        voteCount: count,
        amount: count * unitPrice,
        paymentMethod
      })
    });
  } catch {
    // Continue
  }
  return true;
}

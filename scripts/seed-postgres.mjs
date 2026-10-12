import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const prisma = new PrismaClient();

async function main() {
  console.log('--- Initialisation et Seeding PostgreSQL (Neon) ---');

  const compsFilePath = path.join(rootDir, 'src', 'data', 'competitions.json');
  const candsFilePath = path.join(rootDir, 'src', 'data', 'candidates.json');

  let competitions = [];
  let candidates = [];

  if (fs.existsSync(compsFilePath)) {
    try {
      competitions = JSON.parse(fs.readFileSync(compsFilePath, 'utf8') || '[]');
    } catch (e) {
      console.warn('Erreur lecture competitions.json:', e);
    }
  }

  if (fs.existsSync(candsFilePath)) {
    try {
      candidates = JSON.parse(fs.readFileSync(candsFilePath, 'utf8') || '[]');
    } catch (e) {
      console.warn('Erreur lecture candidates.json:', e);
    }
  }

  console.log(`Trouvé ${competitions.length} compétition(s) et ${candidates.length} candidat(s).`);

  // 1. Compétitions
  for (const comp of competitions) {
    const slug = comp.slug || 'miss-mister-copa-ahn';
    const totalCands = candidates.filter(c => c.competitionSlug === slug).length;

    console.log(`Insertion / Mise à jour compétition: ${comp.title} (${slug})`);
    await prisma.competition.upsert({
      where: { slug },
      update: {
        title: comp.title,
        description: comp.description || '',
        bannerImage: comp.bannerImage || '/images/copa_ahn_banner.png',
        logoImage: comp.logoImage || '/images/hero_bg.png',
        status: comp.status || 'EN COURS',
        votePrice: comp.votePrice || 100,
        primaryColor: comp.primaryColor || '#2563EB',
        gradientFrom: comp.gradientFrom || '#EC4899',
        gradientTo: comp.gradientTo || '#2563EB',
        accentColor: comp.accentColor || '#3B82F6',
        rules: comp.rules || 'Votes ouverts à tous.',
        organizerToken: comp.organizerToken || `TOKEN_${slug.toUpperCase()}_SECURE`,
        totalVotes: 0, // Compteur réinitialisé
        totalCandidates: totalCands,
      },
      create: {
        id: comp.id || `comp_${Date.now()}`,
        slug,
        title: comp.title || 'Miss Mister Copa AHN',
        description: comp.description || '',
        bannerImage: comp.bannerImage || '/images/copa_ahn_banner.png',
        logoImage: comp.logoImage || '/images/hero_bg.png',
        status: comp.status || 'EN COURS',
        votePrice: comp.votePrice || 100,
        primaryColor: comp.primaryColor || '#2563EB',
        gradientFrom: comp.gradientFrom || '#EC4899',
        gradientTo: comp.gradientTo || '#2563EB',
        accentColor: comp.accentColor || '#3B82F6',
        rules: comp.rules || 'Votes ouverts à tous.',
        organizerToken: comp.organizerToken || `TOKEN_${slug.toUpperCase()}_SECURE`,
        totalVotes: 0, // Compteur réinitialisé
        totalCandidates: totalCands,
      },
    });
  }

  // 2. Candidats
  for (const cand of candidates) {
    const compSlug = cand.competitionSlug || 'miss-mister-copa-ahn';
    console.log(`Insertion candidat: ${cand.firstName} ${cand.lastName} (${cand.candidateNumber})`);

    await prisma.candidate.upsert({
      where: { id: cand.id },
      update: {
        competitionSlug: compSlug,
        firstName: cand.firstName,
        lastName: cand.lastName,
        candidateNumber: cand.candidateNumber,
        photoUrl: cand.photoUrl,
        bio: cand.bio || '',
        category: cand.category || 'Miss',
        voteCount: 0, // Compteur réinitialisé à 0
        percentage: 0,
        rank: 1,
        status: cand.status || 'ACTIF',
      },
      create: {
        id: cand.id,
        competitionSlug: compSlug,
        firstName: cand.firstName,
        lastName: cand.lastName,
        candidateNumber: cand.candidateNumber,
        photoUrl: cand.photoUrl,
        bio: cand.bio || '',
        category: cand.category || 'Miss',
        voteCount: 0, // Compteur réinitialisé à 0
        percentage: 0,
        rank: 1,
        status: cand.status || 'ACTIF',
      },
    });
  }

  // Réinitialisation des votes
  const deletedVotes = await prisma.vote.deleteMany({});
  console.log(`Votes réinitialisés (${deletedVotes.count} supprimés).`);

  console.log('✅ Seeding PostgreSQL terminé avec succès ! Tous les compteurs sont à 0.');
}

main()
  .catch((e) => {
    console.error('❌ Erreur seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

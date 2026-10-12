import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { queryDb } from '@/lib/pgDb';
import { Candidate } from '@/data/mockData';

const candsFilePath = path.join(process.cwd(), 'src', 'data', 'candidates.json');

function readDiskCandidates(): Candidate[] {
  try {
    if (fs.existsSync(candsFilePath)) {
      const fileData = fs.readFileSync(candsFilePath, 'utf8');
      return JSON.parse(fileData || '[]');
    }
  } catch {
    // Fallback
  }
  return [];
}

function writeDiskCandidates(cands: Candidate[]) {
  try {
    const dir = path.dirname(candsFilePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(candsFilePath, JSON.stringify(cands, null, 2), 'utf8');
  } catch {
    // Fallback
  }
}

let candCache: { [key: string]: { data: Candidate[]; timestamp: number } } = {};
const CAND_TTL_MS = 5000;

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const noCacheHeaders = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
  'Pragma': 'no-cache',
  'Expires': '0',
};

// GET candidates (PostgreSQL Neon first)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const competitionSlug = searchParams.get('slug');
    const cacheKey = competitionSlug || '__all__';

    if (candCache[cacheKey] && Date.now() - candCache[cacheKey].timestamp < CAND_TTL_MS) {
      return NextResponse.json({ success: true, data: candCache[cacheKey].data }, { headers: noCacheHeaders });
    }

    let sql = 'SELECT * FROM public.candidates';
    const params: any[] = [];

    if (competitionSlug) {
      sql += ' WHERE competition_slug = $1';
      params.push(competitionSlug);
    }
    sql += ' ORDER BY vote_count DESC, candidate_number ASC;';

    const rows = await queryDb<any>(sql, params);

    if (rows && rows.length > 0) {
      const mappedDb: Candidate[] = rows.map((item) => ({
        id: item.id || `cand-${item.candidate_number}`,
        competitionSlug: item.competition_slug,
        firstName: item.first_name,
        lastName: item.last_name,
        candidateNumber: item.candidate_number,
        photoUrl: item.photo_url || '/images/candidate_1.png',
        bio: item.bio || '',
        category: item.category || 'Miss',
        voteCount: item.vote_count || 0,
        percentage: Number(item.percentage) || 0,
        rank: item.rank || 1,
        status: item.status || 'ACTIF',
        socialInstagram: item.social_instagram || '',
      }));

      candCache[cacheKey] = { data: mappedDb, timestamp: Date.now() };
      if (!competitionSlug) {
        writeDiskCandidates(mappedDb);
      }
      return NextResponse.json({ success: true, data: mappedDb }, { headers: noCacheHeaders });
    }

    const diskData = readDiskCandidates();
    const filteredDisk = competitionSlug
      ? diskData.filter((c) => c.competitionSlug === competitionSlug)
      : diskData;

    return NextResponse.json({ success: true, data: filteredDisk }, { headers: noCacheHeaders });
  } catch (error) {
    console.warn('PostgreSQL fetch candidates fallback to disk:', error);
    const diskData = readDiskCandidates();
    return NextResponse.json({ success: true, data: diskData }, { headers: noCacheHeaders });
  }
}

// POST create candidate (Insertion dans PostgreSQL Neon)
export async function POST(request: Request) {
  try {
    const candidateData: Partial<Candidate> = await request.json();

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
      status: 'ACTIF',
    };

    // 1. Sauvegarde dans PostgreSQL Neon
    try {
      await queryDb(
        `INSERT INTO public.candidates (
          id, competition_slug, first_name, last_name, candidate_number,
          photo_url, bio, category, vote_count, percentage, rank, status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        ON CONFLICT (id) DO UPDATE SET
          first_name = EXCLUDED.first_name,
          last_name = EXCLUDED.last_name,
          candidate_number = EXCLUDED.candidate_number,
          photo_url = EXCLUDED.photo_url,
          bio = EXCLUDED.bio,
          category = EXCLUDED.category;`,
        [
          newCandidate.id,
          newCandidate.competitionSlug,
          newCandidate.firstName,
          newCandidate.lastName,
          newCandidate.candidateNumber,
          newCandidate.photoUrl,
          newCandidate.bio,
          newCandidate.category,
          0,
          0,
          1,
          'ACTIF',
        ]
      );
    } catch (dbErr: any) {
      console.error('Erreur insertion PostgreSQL candidate:', dbErr);
    }

    // 2. Synchroniser le fichier disque local
    const diskData = readDiskCandidates();
    const updatedDisk = [newCandidate, ...diskData.filter((c) => c.id !== newCandidate.id)];
    writeDiskCandidates(updatedDisk);
    candCache = {};

    return NextResponse.json({ success: true, data: newCandidate });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// DELETE candidate
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (id) {
      try {
        await queryDb('DELETE FROM public.candidates WHERE id = $1;', [id]);
      } catch (e) {
        console.warn('Erreur PostgreSQL delete candidate:', e);
      }
    }

    candCache = {};
    const diskData = readDiskCandidates();
    writeDiskCandidates(diskData.filter((c) => c.id !== id));

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

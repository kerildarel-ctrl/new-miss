import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { queryDb } from '@/lib/pgDb';
import { Competition } from '@/data/mockData';
import { generateOrganizerToken } from '@/utils/revenueTiers';

const compsFilePath = path.join(process.cwd(), 'src', 'data', 'competitions.json');

function readDiskCompetitions(): Competition[] {
  try {
    if (fs.existsSync(compsFilePath)) {
      const fileData = fs.readFileSync(compsFilePath, 'utf8');
      const parsed: Competition[] = JSON.parse(fileData || '[]');
      let updated = false;
      parsed.forEach((c) => {
        if (!c.organizerToken) {
          c.organizerToken = generateOrganizerToken();
          updated = true;
        }
      });
      if (updated) {
        writeDiskCompetitions(parsed);
      }
      return parsed;
    }
  } catch {
    // Fallback
  }
  return [];
}

function writeDiskCompetitions(comps: Competition[]) {
  try {
    const dir = path.dirname(compsFilePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(compsFilePath, JSON.stringify(comps, null, 2), 'utf8');
  } catch {
    // Fallback
  }
}

let memoryCache: { data: Competition[]; timestamp: number } | null = null;
const CACHE_TTL_MS = 5000;

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const noCacheHeaders = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
  'Pragma': 'no-cache',
  'Expires': '0',
};

// GET all competitions (PostgreSQL Neon first)
export async function GET() {
  try {
    if (memoryCache && Date.now() - memoryCache.timestamp < CACHE_TTL_MS) {
      return NextResponse.json({ success: true, data: memoryCache.data }, { headers: noCacheHeaders });
    }

    const sql = `
      SELECT c.*,
        (SELECT COUNT(*)::int FROM public.candidates cand WHERE cand.competition_slug = c.slug) as dynamic_candidate_count,
        COALESCE((SELECT SUM(vote_count)::int FROM public.candidates cand WHERE cand.competition_slug = c.slug), 0) as dynamic_vote_count
      FROM public.competitions c
      ORDER BY c.created_at DESC;
    `;
    const rows = await queryDb<any>(sql);

    if (rows && rows.length > 0) {
      const diskData = readDiskCompetitions();
      const mappedDb: Competition[] = rows.map((item) => {
        const diskComp = diskData.find((d) => d.slug === item.slug || d.id === item.id);
        const token =
          item.organizer_token ||
          item.organizerToken ||
          diskComp?.organizerToken ||
          generateOrganizerToken();

        return {
          id: item.id || `comp-${item.slug}`,
          slug: item.slug,
          title: item.title,
          description: item.description || '',
          bannerImage: item.banner_image || '/images/copa_ahn_banner.png',
          logoImage: item.logo_image || '/images/hero_bg.png',
          startDate: item.start_date ? new Date(item.start_date).toISOString() : new Date().toISOString(),
          endDate: item.end_date ? new Date(item.end_date).toISOString() : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          status: item.status || 'EN COURS',
          totalCandidates: Number(item.dynamic_candidate_count ?? item.total_candidates ?? 0),
          totalVotes: Number(item.dynamic_vote_count ?? item.total_votes ?? 0),
          votePrice: item.vote_price || 100,
          primaryColor: item.primary_color || '#2563EB',
          gradientFrom: item.gradient_from || '#EC4899',
          gradientTo: item.gradient_to || '#2563EB',
          accentColor: item.accent_color || '#3B82F6',
          rules: item.rules || '',
          organizerToken: token,
        };
      });

      memoryCache = { data: mappedDb, timestamp: Date.now() };
      // Synchroniser le fichier local avec PostgreSQL
      writeDiskCompetitions(mappedDb);
      return NextResponse.json({ success: true, data: mappedDb }, { headers: noCacheHeaders });
    }

    const diskData = readDiskCompetitions();
    return NextResponse.json({ success: true, data: diskData }, { headers: noCacheHeaders });
  } catch (error) {
    console.warn('PostgreSQL fetch competitions fallback to disk:', error);
    return NextResponse.json({ success: true, data: readDiskCompetitions() }, { headers: noCacheHeaders });
  }
}

// POST create competition (Insertion dans PostgreSQL Neon)
export async function POST(request: Request) {
  try {
    const compData: Partial<Competition> = await request.json();

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
      rules: compData.rules || 'Votes ouverts à tous.',
      organizerToken: compData.organizerToken || generateOrganizerToken(),
    };

    // 1. Sauvegarde dans PostgreSQL Neon
    try {
      await queryDb(
        `INSERT INTO public.competitions (
          id, slug, title, description, banner_image, logo_image, start_date, end_date,
          status, total_candidates, total_votes, vote_price, primary_color, rules, organizer_token
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
        ON CONFLICT (slug) DO UPDATE SET
          title = EXCLUDED.title,
          description = EXCLUDED.description,
          banner_image = EXCLUDED.banner_image,
          logo_image = EXCLUDED.logo_image,
          rules = EXCLUDED.rules,
          organizer_token = EXCLUDED.organizer_token;`,
        [
          newComp.id,
          newComp.slug,
          newComp.title,
          newComp.description,
          newComp.bannerImage,
          newComp.logoImage,
          newComp.startDate,
          newComp.endDate,
          newComp.status,
          0,
          0,
          newComp.votePrice,
          newComp.primaryColor,
          newComp.rules,
          newComp.organizerToken,
        ]
      );
    } catch (dbErr: any) {
      console.error('Erreur insertion PostgreSQL competition:', dbErr);
    }

    // 2. Synchroniser le fichier disque local
    const diskData = readDiskCompetitions();
    const updatedDisk = [newComp, ...diskData.filter((c) => c.id !== newComp.id)];
    writeDiskCompetitions(updatedDisk);
    memoryCache = null;
    return NextResponse.json({ success: true, data: newComp });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// PATCH regenerate organizer token
export async function PATCH(request: Request) {
  try {
    const { slug } = await request.json();
    if (!slug) return NextResponse.json({ success: false, error: 'Slug requis' }, { status: 400 });

    const newToken = generateOrganizerToken();

    try {
      await queryDb('UPDATE public.competitions SET organizer_token = $1 WHERE slug = $2;', [
        newToken,
        slug,
      ]);
    } catch (e) {
      console.warn('Erreur PostgreSQL update token:', e);
    }

    const diskData = readDiskCompetitions();
    const updated = diskData.map((c) => (c.slug === slug ? { ...c, organizerToken: newToken } : c));
    writeDiskCompetitions(updated);

    return NextResponse.json({ success: true, organizerToken: newToken });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// DELETE competition
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const slug = searchParams.get('slug');

    try {
      if (id) await queryDb('DELETE FROM public.competitions WHERE id = $1 OR slug = $1;', [id]);
      if (slug) await queryDb('DELETE FROM public.competitions WHERE slug = $1 OR id = $1;', [slug]);
    } catch (e) {
      console.warn('Erreur PostgreSQL delete competition:', e);
    }

    const diskData = readDiskCompetitions();
    const filtered = diskData.filter((c) => {
      if (id && (c.id === id || c.slug === id)) return false;
      if (slug && (c.slug === slug || c.id === slug)) return false;
      return true;
    });
    writeDiskCompetitions(filtered);

    return NextResponse.json({ success: true }, { headers: noCacheHeaders });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { getSupabaseAdmin, supabase } from '@/lib/supabaseClient';
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

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const noCacheHeaders = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
  'Pragma': 'no-cache',
  'Expires': '0',
};

// GET all competitions (Mandatory Supabase first)
export async function GET() {
  try {
    const diskData = readDiskCompetitions();
    const { data: dbData, error } = await supabase
      .from('competitions')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && dbData) {
      const mappedDb: Competition[] = dbData.map((item) => {
        const diskComp = diskData.find((d) => d.slug === item.slug || d.id === item.id);
        const token = item.organizer_token || item.organizerToken || diskComp?.organizerToken || generateOrganizerToken();
        return {
          id: item.id || `comp-${item.slug}`,
          slug: item.slug,
          title: item.title,
          description: item.description || '',
          bannerImage: item.banner_image || '/images/copa_ahn_banner.png',
          logoImage: item.logo_image || '/images/hero_bg.png',
          startDate: item.start_date || new Date().toISOString(),
          endDate: item.end_date || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          status: item.status || 'EN COURS',
          totalCandidates: item.total_candidates || 0,
          totalVotes: item.total_votes || 0,
          votePrice: item.vote_price || 100,
          primaryColor: item.primary_color || '#2563EB',
          gradientFrom: item.gradient_from || '#EC4899',
          gradientTo: item.gradient_to || '#2563EB',
          accentColor: item.accent_color || '#3B82F6',
          rules: item.rules || '',
          organizerToken: token,
        };
      });

      // Keep disk file updated with DB
      writeDiskCompetitions(mappedDb);
      return NextResponse.json({ success: true, data: mappedDb }, { headers: noCacheHeaders });
    }

    return NextResponse.json({ success: true, data: diskData }, { headers: noCacheHeaders });
  } catch {
    return NextResponse.json({ success: true, data: readDiskCompetitions() }, { headers: noCacheHeaders });
  }
}

// POST create competition (MANDATORY SUPABASE INSERTION)
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

    // 1. MANDATORY INSERTION INTO SUPABASE
    const supabaseAdmin = getSupabaseAdmin();
    const { error: dbError } = await supabaseAdmin.from('competitions').insert([
      {
        id: newComp.id,
        slug: newComp.slug,
        title: newComp.title,
        description: newComp.description,
        banner_image: newComp.bannerImage,
        logo_image: newComp.logoImage,
        start_date: newComp.startDate,
        end_date: newComp.endDate,
        status: newComp.status,
        total_candidates: 0,
        total_votes: 0,
        vote_price: newComp.votePrice,
        primary_color: newComp.primaryColor,
        rules: newComp.rules,
        organizer_token: newComp.organizerToken,
      }
    ]);

    if (dbError) {
      // In case organizer_token column does not exist yet in Supabase, retry without it
      const { error: fallbackError } = await supabaseAdmin.from('competitions').insert([
        {
          id: newComp.id,
          slug: newComp.slug,
          title: newComp.title,
          description: newComp.description,
          banner_image: newComp.bannerImage,
          logo_image: newComp.logoImage,
          start_date: newComp.startDate,
          end_date: newComp.endDate,
          status: newComp.status,
          total_candidates: 0,
          total_votes: 0,
          vote_price: newComp.votePrice,
          primary_color: newComp.primaryColor,
          rules: newComp.rules,
        }
      ]);

      if (fallbackError) {
        return NextResponse.json(
          {
            success: false,
            error: `Erreur Supabase: ${fallbackError.message}.`
          },
          { status: 400 }
        );
      }
    }

    // 2. Also write to local disk JSON file
    const diskData = readDiskCompetitions();
    const updatedDisk = [newComp, ...diskData.filter((c) => c.id !== newComp.id)];
    writeDiskCompetitions(updatedDisk);

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
    const diskData = readDiskCompetitions();
    const updated = diskData.map((c) => (c.slug === slug ? { ...c, organizerToken: newToken } : c));
    writeDiskCompetitions(updated);

    try {
      const supabaseAdmin = getSupabaseAdmin();
      await supabaseAdmin.from('competitions').update({ organizer_token: newToken }).eq('slug', slug);
    } catch {
      // Continue
    }

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

    const supabaseAdmin = getSupabaseAdmin();
    if (id) {
      await supabaseAdmin.from('competitions').delete().eq('id', id);
      await supabaseAdmin.from('competitions').delete().eq('slug', id);
    }
    if (slug) {
      await supabaseAdmin.from('competitions').delete().eq('slug', slug);
      await supabaseAdmin.from('competitions').delete().eq('id', slug);
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


import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { getSupabaseAdmin, supabase } from '@/lib/supabaseClient';
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

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const noCacheHeaders = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
  'Pragma': 'no-cache',
  'Expires': '0',
};

// GET candidates (Mandatory Supabase first)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const competitionSlug = searchParams.get('slug');

    let query = supabase.from('candidates').select('*');
    if (competitionSlug) {
      query = query.eq('competition_slug', competitionSlug);
    }

    const { data: dbData, error } = await query;

    if (!error && dbData) {
      const mappedDb: Candidate[] = dbData.map((item) => ({
        id: item.id || `cand-${item.candidate_number}`,
        competitionSlug: item.competition_slug,
        firstName: item.first_name,
        lastName: item.last_name,
        candidateNumber: item.candidate_number,
        photoUrl: item.photo_url || '/images/candidate_1.png',
        bio: item.bio || '',
        category: item.category || 'Miss',
        voteCount: item.vote_count || 0,
        percentage: item.percentage || 0,
        rank: item.rank || 1,
        status: item.status || 'ACTIF',
        socialInstagram: item.social_instagram || ''
      }));

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
  } catch {
    const diskData = readDiskCandidates();
    return NextResponse.json({ success: true, data: diskData }, { headers: noCacheHeaders });
  }
}


// POST create candidate (MANDATORY SUPABASE INSERTION)
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
      status: 'ACTIF'
    };

    // 1. MANDATORY INSERTION INTO SUPABASE
    const supabaseAdmin = getSupabaseAdmin();
    const { error: dbError } = await supabaseAdmin.from('candidates').insert([
      {
        id: newCandidate.id,
        competition_slug: newCandidate.competitionSlug,
        first_name: newCandidate.firstName,
        last_name: newCandidate.lastName,
        candidate_number: newCandidate.candidateNumber,
        photo_url: newCandidate.photoUrl,
        bio: newCandidate.bio,
        category: newCandidate.category,
        vote_count: 0,
        percentage: 0,
        rank: 1,
        status: 'ACTIF'
      }
    ]);

    if (dbError) {
      return NextResponse.json(
        {
          success: false,
          error: `Erreur Supabase: ${dbError.message}. Assurez-vous d'avoir exécuté le script SQL dans votre console Supabase.`
        },
        { status: 400 }
      );
    }

    // 2. Also write to local disk JSON file
    const diskData = readDiskCandidates();
    const updatedDisk = [newCandidate, ...diskData.filter((c) => c.id !== newCandidate.id)];
    writeDiskCandidates(updatedDisk);

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

    const supabaseAdmin = getSupabaseAdmin();
    if (id) await supabaseAdmin.from('candidates').delete().eq('id', id);

    const diskData = readDiskCandidates();
    writeDiskCandidates(diskData.filter((c) => c.id !== id));

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

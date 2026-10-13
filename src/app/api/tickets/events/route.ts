import { NextResponse } from 'next/server';
import { queryDb } from '@/lib/pgDb';

export const dynamic = 'force-dynamic';

/** Auto-create the events table in Neon if it doesn't exist, and migrate missing columns */
async function ensureEventsTable() {
  // Create table if it doesn't exist at all
  await queryDb(`
    CREATE TABLE IF NOT EXISTS public.events (
      id TEXT PRIMARY KEY,
      slug TEXT NOT NULL,
      title TEXT NOT NULL,
      subtitle TEXT DEFAULT '',
      date TEXT NOT NULL,
      venue TEXT NOT NULL,
      city TEXT DEFAULT 'Yaoundé',
      banner_image TEXT DEFAULT '/images/hero_bg.png',
      passes JSONB DEFAULT '[]',
      status TEXT DEFAULT 'ACTIVE',
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);

  // Migrate: add any columns that may be missing from an older version of the table
  const migrations = [
    `ALTER TABLE public.events ADD COLUMN IF NOT EXISTS html_content TEXT DEFAULT ''`,
    `ALTER TABLE public.events ADD COLUMN IF NOT EXISTS organizer_name TEXT DEFAULT ''`,
    `ALTER TABLE public.events ADD COLUMN IF NOT EXISTS organizer_email TEXT DEFAULT ''`,
    `ALTER TABLE public.events ADD COLUMN IF NOT EXISTS organizer_phone TEXT DEFAULT ''`,
    `ALTER TABLE public.events ADD COLUMN IF NOT EXISTS organizer_token TEXT`,
    `ALTER TABLE public.events ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'ACTIVE'`,
  ];
  for (const sql of migrations) {
    await queryDb(sql).catch(() => { /* ignore if already exists */ });
  }
}

function generateOrgToken(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  let token = '';
  for (let i = 0; i < 24; i++) token += chars[Math.floor(Math.random() * chars.length)];
  return token;
}

function mapRow(e: any) {
  return {
    id: e.id,
    slug: e.slug,
    title: e.title,
    subtitle: e.subtitle || '',
    date: e.date,
    venue: e.venue,
    city: e.city || 'Yaoundé',
    bannerImage: e.banner_image || '/images/hero_bg.png',
    htmlContent: e.html_content || '',
    passes: Array.isArray(e.passes) ? e.passes : (typeof e.passes === 'string' ? JSON.parse(e.passes || '[]') : []),
    organizerToken: e.organizer_token || '',
    organizerName: e.organizer_name || '',
    organizerEmail: e.organizer_email || '',
    organizerPhone: e.organizer_phone || '',
    status: e.status || 'ACTIVE',
  };
}

export async function GET(request: Request) {
  try {
    await ensureEventsTable();
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');
    const slug = searchParams.get('slug');

    let rows: any[];
    if (token) {
      rows = await queryDb('SELECT * FROM public.events WHERE organizer_token = $1 LIMIT 1', [token]);
    } else if (slug) {
      rows = await queryDb('SELECT * FROM public.events WHERE slug = $1 LIMIT 1', [slug]);
    } else {
      rows = await queryDb('SELECT * FROM public.events ORDER BY created_at DESC');
    }

    const events = rows.map(mapRow);

    // Return single object when querying by token or slug
    if ((token || slug) && events.length <= 1) {
      return NextResponse.json({ success: true, data: events[0] || null });
    }

    return NextResponse.json({ success: true, data: events });
  } catch (error: any) {
    console.error('GET /api/tickets/events error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await ensureEventsTable();

    const body = await request.json();
    const {
      title, subtitle = '', date, venue,
      city = 'Yaoundé',
      bannerImage = '/images/hero_bg.png',
      htmlContent = '',
      passes = [],
      organizerName = '',
      organizerEmail = '',
      organizerPhone = '',
    } = body;

    if (!title || !date || !venue) {
      return NextResponse.json(
        { success: false, error: 'Titre, date et lieu sont requis' },
        { status: 400 }
      );
    }

    const eventId = `evt_${Date.now()}`;
    const baseSlug = title
      .toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    const slug = `${baseSlug}-${eventId.slice(-6)}`;
    const organizerToken = generateOrgToken();

    await queryDb(
      `INSERT INTO public.events
        (id, slug, title, subtitle, date, venue, city, banner_image, html_content,
         passes, organizer_name, organizer_email, organizer_phone, organizer_token, status, created_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,'ACTIVE',NOW())`,
      [
        eventId, slug, title, subtitle, date, venue, city,
        bannerImage, htmlContent,
        JSON.stringify(Array.isArray(passes) ? passes : []),
        organizerName, organizerEmail, organizerPhone, organizerToken,
      ]
    );

    return NextResponse.json({
      success: true,
      data: {
        id: eventId, slug, title, subtitle, date, venue, city,
        bannerImage, htmlContent, passes, organizerToken,
        organizerName, organizerEmail, organizerPhone, status: 'ACTIVE',
      },
      organizerToken,
    });
  } catch (error: any) {
    console.error('POST /api/tickets/events error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    await ensureEventsTable();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ success: false, error: 'ID requis' }, { status: 400 });

    await queryDb('DELETE FROM public.events WHERE id = $1', [id]);
    return NextResponse.json({ success: true, message: 'Événement supprimé' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { getSupabaseAdmin } from '@/lib/supabaseClient';
import { TicketEvent } from '@/data/mockTickets';

const eventsFilePath = path.join(process.cwd(), 'src', 'data', 'events.json');

function getDiskEvents(): TicketEvent[] {
  try {
    if (fs.existsSync(eventsFilePath)) {
      const data = fs.readFileSync(eventsFilePath, 'utf8');
      return JSON.parse(data || '[]');
    }
  } catch { /* Ignore */ }
  return [];
}

function saveDiskEvents(events: TicketEvent[]) {
  try {
    const dir = path.dirname(eventsFilePath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(eventsFilePath, JSON.stringify(events, null, 2), 'utf8');
  } catch { /* Ignore */ }
}

function generateOrgToken(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  let token = '';
  for (let i = 0; i < 24; i++) token += chars[Math.floor(Math.random() * chars.length)];
  return token;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');
    const slug = searchParams.get('slug');

    let events: TicketEvent[] = [];

    // Try Supabase first
    try {
      const supabase = getSupabaseAdmin();
      let query = supabase.from('events').select('*').order('created_at', { ascending: false });
      if (token) query = (query as any).eq('organizer_token', token);
      if (slug)  query = (query as any).eq('slug', slug);

      const { data } = await query;
      if (data && data.length > 0) {
        events = data.map((e: any) => ({
          id: e.id,
          slug: e.slug,
          title: e.title,
          subtitle: e.subtitle || '',
          date: e.date,
          venue: e.venue,
          city: e.city || 'Yaoundé',
          bannerImage: e.banner_image || '/images/hero_bg.png',
          passes: typeof e.passes === 'string' ? JSON.parse(e.passes) : (e.passes || []),
          organizerToken: e.organizer_token || '',
          organizerName: e.organizer_name || '',
          organizerEmail: e.organizer_email || '',
          organizerPhone: e.organizer_phone || '',
          status: e.status || 'ACTIVE',
        }));
      }
    } catch { /* Supabase unavailable */ }

    // Fallback to disk
    if (events.length === 0) {
      let disk = getDiskEvents();
      if (token) disk = disk.filter((e: any) => e.organizerToken === token);
      if (slug)  disk = disk.filter((e: any) => e.slug === slug);
      events = disk;
    }

    // If fetching single event by slug/token, return single object
    if ((slug || token) && events.length === 1) {
      return NextResponse.json({ success: true, data: events[0] });
    }

    return NextResponse.json({ success: true, data: events });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      title, subtitle, date, venue, city, bannerImage, passes,
      organizerName = '', organizerEmail = '', organizerPhone = '',
    } = body;

    if (!title || !date || !venue) {
      return NextResponse.json({ success: false, error: 'Titre, date et lieu sont requis' }, { status: 400 });
    }

    const eventId = `evt_${Date.now()}`;
    const baseSlug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const slug = `${baseSlug}-${eventId.slice(-6)}`;
    const organizerToken = generateOrgToken();

    const newEvent: TicketEvent & {
      organizerToken: string; organizerName: string;
      organizerEmail: string; organizerPhone: string; status: string;
    } = {
      id: eventId,
      slug,
      title,
      subtitle: subtitle || '',
      date,
      venue,
      city: city || 'Yaoundé',
      bannerImage: bannerImage || '/images/hero_bg.png',
      passes: Array.isArray(passes) && passes.length > 0 ? passes : [],
      organizerToken,
      organizerName,
      organizerEmail,
      organizerPhone,
      status: 'ACTIVE',
    };

    // Save to Disk JSON
    const diskEvents = getDiskEvents();
    diskEvents.unshift(newEvent as any);
    saveDiskEvents(diskEvents);

    // Save to Supabase
    try {
      const supabase = getSupabaseAdmin();
      await supabase.from('events').insert([{
        id: eventId,
        slug,
        title,
        subtitle: subtitle || '',
        date,
        venue,
        city: city || 'Yaoundé',
        banner_image: bannerImage || '/images/hero_bg.png',
        passes: JSON.stringify(newEvent.passes),
        organizer_token: organizerToken,
        organizer_name: organizerName,
        organizer_email: organizerEmail,
        organizer_phone: organizerPhone,
        status: 'ACTIVE',
        created_at: new Date().toISOString(),
      }]);
    } catch { /* Disk JSON already saved */ }

    return NextResponse.json({ success: true, data: newEvent, organizerToken });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ success: false, error: 'ID requis' }, { status: 400 });

    const diskEvents = getDiskEvents().filter((e) => e.id !== id);
    saveDiskEvents(diskEvents);

    try {
      const supabase = getSupabaseAdmin();
      await supabase.from('events').delete().eq('id', id);
    } catch { /* Ignore */ }

    return NextResponse.json({ success: true, message: 'Événement supprimé' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

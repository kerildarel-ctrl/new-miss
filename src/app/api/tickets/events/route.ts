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
  } catch {
    // Ignore
  }
  return [];
}

function saveDiskEvents(events: TicketEvent[]) {
  try {
    const dir = path.dirname(eventsFilePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(eventsFilePath, JSON.stringify(events, null, 2), 'utf8');
  } catch {
    // Ignore
  }
}

export async function GET() {
  try {
    let events: TicketEvent[] = [];

    // 1. Try Supabase
    try {
      const supabase = getSupabaseAdmin();
      const { data } = await supabase.from('events').select('*').order('created_at', { ascending: false });
      if (data && data.length > 0) {
        events = data.map((e) => ({
          id: e.id,
          slug: e.slug,
          title: e.title,
          subtitle: e.subtitle || '',
          date: e.date,
          venue: e.venue,
          city: e.city || 'Yaoundé',
          bannerImage: e.banner_image || '/images/hero_bg.png',
          passes: typeof e.passes === 'string' ? JSON.parse(e.passes) : (e.passes || []),
        }));
      }
    } catch {
      // Supabase table not created yet
    }

    // 2. Fallback to Disk JSON
    if (events.length === 0) {
      events = getDiskEvents();
    }

    return NextResponse.json({ success: true, data: events });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Erreur lors du chargement des événements' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, subtitle, date, venue, city, bannerImage, passes } = body;

    if (!title || !date || !venue) {
      return NextResponse.json(
        { success: false, error: 'Titre, date et lieu sont requis' },
        { status: 400 }
      );
    }

    const eventId = `evt_${Date.now()}`;
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-');

    const newEvent: TicketEvent = {
      id: eventId,
      slug,
      title,
      subtitle: subtitle || '',
      date,
      venue,
      city: city || 'Yaoundé',
      bannerImage: bannerImage || '/images/hero_bg.png',
      passes: Array.isArray(passes) && passes.length > 0 ? passes : [],
    };

    // Save to Disk JSON
    const diskEvents = getDiskEvents();
    diskEvents.unshift(newEvent);
    saveDiskEvents(diskEvents);

    // Save to Supabase
    try {
      const supabase = getSupabaseAdmin();
      await supabase.from('events').insert([
        {
          id: eventId,
          slug,
          title,
          subtitle: subtitle || '',
          date,
          venue,
          city: city || 'Yaoundé',
          banner_image: bannerImage || '/images/hero_bg.png',
          passes: JSON.stringify(newEvent.passes),
          created_at: new Date().toISOString(),
        },
      ]);
    } catch {
      // Disk JSON already saved
    }

    return NextResponse.json({ success: true, data: newEvent });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Erreur lors de la création de l’événement' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID requis' }, { status: 400 });
    }

    // Delete from Disk
    const diskEvents = getDiskEvents().filter((e) => e.id !== id);
    saveDiskEvents(diskEvents);

    // Delete from Supabase
    try {
      const supabase = getSupabaseAdmin();
      await supabase.from('events').delete().eq('id', id);
    } catch {
      // Ignore
    }

    return NextResponse.json({ success: true, message: 'Événement supprimé' });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Erreur de suppression' },
      { status: 500 }
    );
  }
}

import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { getSupabaseAdmin } from '@/lib/supabaseClient';

const compsFilePath = path.join(process.cwd(), 'src', 'data', 'competitions.json');
const candsFilePath = path.join(process.cwd(), 'src', 'data', 'candidates.json');

export async function POST() {
  try {
    // 1. Reset disk JSON files to []
    try {
      fs.writeFileSync(compsFilePath, '[]', 'utf8');
      fs.writeFileSync(candsFilePath, '[]', 'utf8');
    } catch {
      // Continue
    }

    // 2. Reset Supabase tables
    try {
      const supabaseAdmin = getSupabaseAdmin();
      await supabaseAdmin.from('votes').delete().neq('id', '0');
      await supabaseAdmin.from('candidates').delete().neq('id', '0');
      await supabaseAdmin.from('competitions').delete().neq('id', '0');
    } catch {
      // Continue
    }

    return NextResponse.json({
      success: true,
      message: 'Toutes les données ont été réinitialisées à zéro sur disque et Supabase !'
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Erreur lors de la réinitialisation' },
      { status: 500 }
    );
  }
}

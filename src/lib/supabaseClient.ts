import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://zepgojcefwrctvorolby.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InplcGdvamNlZndyY3R2b3JvbGJ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE2NTcyNTEsImV4cCI6MjEwNzIzMzI1MX0.CaNUOA5SFwXdq9wzeXZvIIOVEENPY3KH3KVuMjO4KaA';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Server-side admin client using Service Role key
export const getSupabaseAdmin = () => {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InplcGdvamNlZndyY3R2b3JvbGJ5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MTY1NzI1MSwiZXhwIjoyMTA3MjMzMjUxfQ.81zp43hORPnKSoGf9RMXHNm-4bIdpmvmrtKdPoCcxzY';
  return createClient(supabaseUrl, serviceRoleKey);
};


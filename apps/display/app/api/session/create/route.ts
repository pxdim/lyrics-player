import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export async function POST(request: Request) {
  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.json({ error: 'Database configuration error' }, { status: 500 });
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  // Get code from request body
  let code = '';
  try {
    const body = await request.json();
    code = body.code || '';
  } catch {
    // No body or invalid JSON
  }

  // If no code provided or invalid, generate one
  if (!code || typeof code !== 'string' || code.length !== 6) {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
  }

  const { data, error } = await supabase
    .from('sessions')
    .insert({ id: crypto.randomUUID(), code })
    .select('id, code')
    .single();

  if (error) {
    console.error('Supabase error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ sessionId: data.id, code: data.code });
}

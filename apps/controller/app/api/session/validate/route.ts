import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseClient } from 'shared';
import { getSessionByCode } from 'shared';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');

    if (!code) {
      return NextResponse.json({ error: 'Code is required' }, { status: 400 });
    }

    if (code.length !== 6) {
      return NextResponse.json({ error: 'Invalid code format' }, { status: 400 });
    }

    const supabase = createSupabaseClient();
    const { data, error } = await getSessionByCode(supabase, code);

    if (error || !data) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    return NextResponse.json({ session: data });
  } catch (error) {
    console.error('Error validating session:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

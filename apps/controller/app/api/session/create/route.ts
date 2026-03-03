import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseClient, createSession, generateSessionCode } from 'shared';

export async function POST(request: NextRequest) {
  try {
    const supabase = createSupabaseClient();

    // Generate a unique code
    let code: string;
    let attempts = 0;
    const maxAttempts = 10;

    do {
      code = generateSessionCode();
      const { data: existing } = await supabase
        .from('sessions')
        .select('code')
        .eq('code', code)
        .single();

      if (!existing) {
        break;
      }

      attempts++;
      if (attempts >= maxAttempts) {
        throw new Error('Failed to generate unique code');
      }
    } while (true);

    const session = await createSession(supabase, code);

    return NextResponse.json({
      sessionId: session.id,
      code: session.code,
    });
  } catch (error) {
    console.error('Error creating session:', error);
    return NextResponse.json(
      { error: 'Failed to create session' },
      { status: 500 }
    );
  }
}

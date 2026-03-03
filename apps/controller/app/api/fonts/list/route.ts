import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseClient } from 'shared/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = createSupabaseClient();

    // List all files in the fonts bucket
    const { data: files, error } = await supabase.storage
      .from('fonts')
      .list();

    if (error) {
      console.error('Supabase list error:', error);
      return NextResponse.json(
        { error: 'Failed to list fonts' },
        { status: 500 }
      );
    }

    // Map files to include public URLs
    const fonts = (files || [])
      .filter(file => file.name !== '.emptyFolderPlaceholder') // Filter out placeholder
      .map(file => {
        const { data: urlData } = supabase.storage
          .from('fonts')
          .getPublicUrl(file.name);

        return {
          name: file.name,
          url: urlData.publicUrl,
          path: file.name,
          size: file.metadata?.size || 0,
          createdAt: file.created_at,
        };
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return NextResponse.json({ fonts });
  } catch (error) {
    console.error('Error listing fonts:', error);
    return NextResponse.json(
      { error: 'Failed to list fonts' },
      { status: 500 }
    );
  }
}

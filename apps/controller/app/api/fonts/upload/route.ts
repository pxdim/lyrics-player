import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseClient } from 'shared/server';

const ALLOWED_EXTENSIONS = ['.ttf', '.otf', '.woff2', '.woff'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('font') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'Font file is required' },
        { status: 400 }
      );
    }

    // Validate file extension
    const fileName = file.name.toLowerCase();
    const hasValidExtension = ALLOWED_EXTENSIONS.some(ext => fileName.endsWith(ext));

    if (!hasValidExtension) {
      return NextResponse.json(
        { error: `Invalid file type. Allowed types: ${ALLOWED_EXTENSIONS.join(', ')}` },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File size exceeds ${MAX_FILE_SIZE / 1024 / 1024}MB limit` },
        { status: 400 }
      );
    }

    // Create unique filename
    const fileExt = fileName.slice(fileName.lastIndexOf('.'));
    const fileNameWithoutExt = fileName.slice(0, fileName.lastIndexOf('.'));
    const uniqueFileName = `${fileNameWithoutExt}-${Date.now()}${fileExt}`;

    // Upload to Supabase Storage
    const supabase = createSupabaseClient();
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('fonts')
      .upload(uniqueFileName, file, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error('Supabase upload error:', uploadError);
      return NextResponse.json(
        { error: 'Failed to upload font file' },
        { status: 500 }
      );
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('fonts')
      .getPublicUrl(uniqueFileName);

    return NextResponse.json({
      success: true,
      font: {
        name: file.name,
        url: urlData.publicUrl,
        path: uniqueFileName,
      },
    });
  } catch (error) {
    console.error('Error uploading font:', error);
    return NextResponse.json(
      { error: 'Failed to upload font' },
      { status: 500 }
    );
  }
}

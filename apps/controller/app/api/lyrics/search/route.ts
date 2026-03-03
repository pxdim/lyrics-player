import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

interface SearchRequest {
  songName: string;
  artist: string;
}

interface LyricLine {
  text: string;
  notes?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: SearchRequest = await request.json();
    const { songName, artist } = body;

    if (!songName || !artist) {
      return NextResponse.json(
        { error: 'songName and artist are required' },
        { status: 400 }
      );
    }

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: 'GEMINI_API_KEY is not configured' },
        { status: 500 }
      );
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    const prompt = `Please provide the lyrics for "${songName}" by ${artist}.
Return ONLY the lyrics in a JSON array format, where each object has:
- "text": the lyric line
- "notes": (optional) any section info like [Verse], [Chorus], [Bridge]

Format: [{"text": "line1", "notes": "section"}, ...]

Only return the JSON array, no other text.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Parse the response - handle potential markdown code blocks
    let cleanedText = text.trim();

    // Remove markdown code blocks if present
    if (cleanedText.startsWith('```')) {
      cleanedText = cleanedText.replace(/^```(?:json)?\n?/i, '');
      cleanedText = cleanedText.replace(/```$/i, '');
    }

    cleanedText = cleanedText.trim();

    let lyrics: LyricLine[];

    try {
      lyrics = JSON.parse(cleanedText);
    } catch (parseError) {
      // If JSON parsing fails, try to parse the raw text into lines
      const lines = text
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0 && !line.startsWith('```'))
        .map(line => {
          // Check if line is a section marker
          if (line.match(/^\[(verse|chorus|bridge|intro|outro|pre-chorus|hook)\]/i)) {
            return { text: '', notes: line.replace(/[\[\]]/g, '') };
          }
          return { text: line, notes: undefined };
        })
        .filter(item => item.text.length > 0);

      lyrics = lines;
    }

    // Validate the parsed lyrics
    if (!Array.isArray(lyrics) || lyrics.length === 0) {
      return NextResponse.json(
        { error: 'No lyrics found or unable to parse response' },
        { status: 404 }
      );
    }

    // Ensure each item has at least text property
    const validLyrics = lyrics
      .filter(item => item && typeof item.text === 'string' && item.text.trim().length > 0)
      .map(item => ({
        text: item.text.trim(),
        notes: item.notes?.trim() || undefined,
      }));

    return NextResponse.json({ lyrics: validLyrics });
  } catch (error) {
    console.error('Error searching lyrics:', error);

    if (error instanceof Error) {
      // Handle GoogleGenerativeAI specific errors
      if (error.message.includes('API key')) {
        return NextResponse.json(
          { error: 'Invalid API key' },
          { status: 401 }
        );
      }
      if (error.message.includes('quota') || error.message.includes('limit')) {
        return NextResponse.json(
          { error: 'API quota exceeded' },
          { status: 429 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Failed to search lyrics' },
      { status: 500 }
    );
  }
}

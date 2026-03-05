import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

interface SearchRequest {
  query: string;
}

interface SongOption {
  songName: string;
  artist: string;
}

interface LyricLine {
  text: string;
  notes?: string;
}

interface SearchRequest {
  query: string;
  mode?: 'search' | 'lyrics';
  songName?: string;
  artist?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: SearchRequest = await request.json();
    const { query, mode = 'search', songName, artist } = body;

    if (!query && (!songName || !artist)) {
      return NextResponse.json(
        { error: 'query is required' },
        { status: 400 }
      );
    }

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: 'Service unavailable' },
        { status: 500 }
      );
    }

    // Validate and sanitize input
    const sanitizedQuery = query ? query.trim().slice(0, 200) : '';
    const sanitizedSongName = songName ? songName.trim().slice(0, 200) : '';
    const sanitizedArtist = artist ? artist.trim().slice(0, 200) : '';

    if ((sanitizedQuery && sanitizedQuery.length === 0) ||
        (sanitizedSongName && sanitizedSongName.length === 0) ||
        (sanitizedArtist && sanitizedArtist.length === 0)) {
      return NextResponse.json(
        { error: 'Invalid input' },
        { status: 400 }
      );
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    // Mode 1: Search for song options
    if (mode === 'search' || !sanitizedSongName || !sanitizedArtist) {
      const searchPrompt = `User is looking for a song with this query: "${sanitizedQuery}"

This could be:
- A song name (e.g., "小情歌")
- An artist name (e.g., "周杰倫")
- Both (e.g., "小情歌 蘇打綠")

Return a JSON array of 5-10 matching songs with BOTH song name and artist.
Only include well-known, real songs. Don't make up songs.

Format: [{"songName": "歌名", "artist": "歌手"}, ...]

Return ONLY the JSON array, no other text. Use Traditional Chinese for song names.`;

      const result = await model.generateContent(searchPrompt);
      const response = await result.response;
      const text = response.text();

      let cleanedText = text.trim();
      if (cleanedText.startsWith('```')) {
        cleanedText = cleanedText.replace(/^```(?:json)?\n?/i, '');
        cleanedText = cleanedText.replace(/```$/i, '');
      }
      cleanedText = cleanedText.trim();

      let options: SongOption[];
      try {
        options = JSON.parse(cleanedText);
      } catch {
        // Fallback: try to extract from text
        options = [];
      }

      if (!Array.isArray(options) || options.length === 0) {
        // Return a generic fallback option
        return NextResponse.json({
          options: [
            { songName: sanitizedQuery, artist: '未知歌手' },
            { songName: sanitizedQuery, artist: '請確認歌名' }
          ]
        });
      }

      return NextResponse.json({ options });
    }

    // Mode 2: Get lyrics for specific song/artist
    const lyricsPrompt = `Please provide the complete lyrics for "${sanitizedSongName}" by ${sanitizedArtist}.
Return ONLY the lyrics in a JSON array format, where each object has:
- "text": the lyric line
- "notes": (optional) any section info like [Verse], [Chorus], [Bridge]

Format: [{"text": "line1", "notes": "section"}, ...]

Only return the JSON array, no other text. Use Traditional Chinese.`;

    const lyricsResult = await model.generateContent(lyricsPrompt);
    const lyricsResponse = await lyricsResult.response;
    const lyricsText = lyricsResponse.text();

    let cleanedLyrics = lyricsText.trim();
    if (cleanedLyrics.startsWith('```')) {
      cleanedLyrics = cleanedLyrics.replace(/^```(?:json)?\n?/i, '');
      cleanedLyrics = cleanedLyrics.replace(/```$/i, '');
    }
    cleanedLyrics = cleanedLyrics.trim();

    let lyrics: LyricLine[];
    try {
      lyrics = JSON.parse(cleanedLyrics);
    } catch {
      // Parse as plain text lines
      const lines = lyricsText
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0 && !line.startsWith('```'))
        .map(line => {
          if (line.match(/^\[(verse|chorus|bridge|intro|outro)\]/i)) {
            return { text: '', notes: line.replace(/[\[\]]/g, '') };
          }
          return { text: line, notes: undefined };
        })
        .filter(item => item.text.length > 0);
      lyrics = lines;
    }

    if (!Array.isArray(lyrics) || lyrics.length === 0) {
      return NextResponse.json({ error: 'No lyrics found' }, { status: 404 });
    }

    const validLyrics = lyrics
      .filter(item => item && typeof item.text === 'string' && item.text.trim().length > 0)
      .map(item => ({
        text: item.text.trim(),
        notes: item.notes?.trim() || undefined,
      }));

    return NextResponse.json({ lyrics: validLyrics });

  } catch (error) {
    console.error('Error searching lyrics:', error);
    return NextResponse.json({ error: 'Failed to search lyrics' }, { status: 500 });
  }
}

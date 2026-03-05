import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize genAI at runtime to support environment variable changes
const getGenAI = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not set');
  }
  return new GoogleGenerativeAI(apiKey);
};

interface SearchRequest {
  query: string;
}

interface SongOption {
  songName: string;
  artist: string;
  confidence?: number; // 0-1, confidence level
}

interface LyricLine {
  text: string;
  notes?: string;
}

interface SearchRequest {
  query: string;
  mode?: 'search' | 'lyrics' | 'preview';
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

    const genAI = getGenAI();
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    // Mode 1: Search for song options (improved prompt)
    if (mode === 'search' || !sanitizedSongName || !sanitizedArtist) {
      const searchPrompt = `You are a music database assistant. User is searching for: "${sanitizedQuery}"

IMPORTANT RULES:
1. ONLY return songs that are REAL, well-known, and verifiable
2. If you're unsure about a song's existence, DO NOT include it
3. Prioritize exact matches for song name or artist
4. Include popular Taiwanese/Chinese songs first if the query is in Chinese
5. Assign a confidence score (0.5-1.0):
   - 1.0: Exact match, very famous song
   - 0.8: High confidence, well-known song
   - 0.6: Moderate confidence, less certain
   - 0.5: Low confidence, best guess

Return JSON array with format:
[{"songName": "歌名", "artist": "歌手", "confidence": 0.9}, ...]

Limit to 5-8 results. Return ONLY the JSON array, no other text.
Use Traditional Chinese for Chinese song names.`;

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
        // Return a generic fallback option with low confidence
        return NextResponse.json({
          options: [
            { songName: sanitizedQuery, artist: '請確認歌名', confidence: 0.3 }
          ],
          warning: '無法找到精確匹配，請確認歌詞正確性'
        });
      }

      // Sort by confidence and add warning for low confidence results
      const sortedOptions = options
        .filter(opt => opt.songName && opt.artist)
        .sort((a, b) => (b.confidence || 0.5) - (a.confidence || 0.5))
        .slice(0, 8);

      const hasLowConfidence = sortedOptions.some(opt => (opt.confidence || 0) < 0.7);

      return NextResponse.json({
        options: sortedOptions,
        warning: hasLowConfidence ? '部分結果信心較低，建議預覽歌詞後確認' : undefined
      });
    }

    // Mode 2 & 3: Get lyrics with preview support
    const lyricsPrompt = `You are providing lyrics for: "${sanitizedSongName}" by ${sanitizedArtist}

CRITICAL RULES:
1. ONLY provide lyrics if you are reasonably certain this is a REAL song
2. If you're unsure, return {"error": "unsure", "message": "無法確認此歌曲，請提供更多資訊"}
3. DO NOT make up or hallucinate lyrics
4. Include the complete song structure (verse, chorus, bridge)
5. Use Traditional Chinese for Chinese lyrics

Return JSON with format:
{
  "lyrics": [
    {"text": "歌詞行", "notes": "Verse/Chorus/Bridge (optional)"},
    ...
  ],
  "confidence": 0.9,
  "sourceNote": "AI generated, please verify"
}

Return ONLY the JSON object, no other text.`;

    const lyricsResult = await model.generateContent(lyricsPrompt);
    const lyricsResponse = await lyricsResult.response;
    const lyricsText = lyricsResponse.text();

    let cleanedLyrics = lyricsText.trim();
    if (cleanedLyrics.startsWith('```')) {
      cleanedLyrics = cleanedLyrics.replace(/^```(?:json)?\n?/i, '');
      cleanedLyrics = cleanedLyrics.replace(/```$/i, '');
    }
    cleanedLyrics = cleanedLyrics.trim();

    let parsedResult: any;
    try {
      parsedResult = JSON.parse(cleanedLyrics);
    } catch {
      // Try to parse as plain text lines (fallback)
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

      parsedResult = { lyrics: lines, confidence: 0.5 };
    }

    // Check if AI returned an error/unsure response
    if (parsedResult.error === 'unsure') {
      return NextResponse.json({
        error: 'unsure',
        message: parsedResult.message || '無法確認此歌曲，請提供更多資訊或手動輸入歌詞'
      }, { status: 200 });
    }

    const lyrics = parsedResult.lyrics;
    if (!Array.isArray(lyrics) || lyrics.length === 0) {
      return NextResponse.json({ error: 'No lyrics found' }, { status: 404 });
    }

    const validLyrics = lyrics
      .filter(item => item && typeof item.text === 'string' && item.text.trim().length > 0)
      .map(item => ({
        text: item.text.trim(),
        notes: item.notes?.trim() || undefined,
      }));

    const confidence = parsedResult.confidence || 0.5;
    const warning = confidence < 0.7
      ? '歌詞信心較低，強烈建議預覽確認'
      : 'AI 生成的歌詞，建議預覽確認正確性';

    return NextResponse.json({
      lyrics: validLyrics,
      confidence,
      sourceNote: parsedResult.sourceNote || 'AI generated, please verify',
      warning
    });

  } catch (error) {
    console.error('Error searching lyrics:', error);
    return NextResponse.json({ error: 'Failed to search lyrics' }, { status: 500 });
  }
}

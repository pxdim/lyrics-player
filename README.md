# Lyrics Player (歌詞播放器)

A real-time lyrics display system with controller and display applications, perfect for live performances, karaoke, or worship services.

## Features

- **Real-time Synchronization**: Controller app syncs instantly with display app using Supabase Realtime
- **AI-Powered Lyrics Search**: Search and import lyrics using Google Gemini API
- **Custom Font Support**: Upload and use custom fonts via Supabase Storage
- **Rich Style Controls**: Customize font size, color, alignment, background, and effects
- **Keyboard Shortcuts**: Quick control for seamless operation
- **Emergency Clear**: Instantly clear the display with a single keypress
- **Fade Effects**: Smooth fade in/out transitions
- **Lyric Management**: Add, edit, delete, and reorder lyrics

## Tech Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Database**: Supabase (PostgreSQL + Realtime + Storage)
- **AI**: Google Generative AI (Gemini Pro)
- **Styling**: Tailwind CSS
- **Monorepo**: Turborepo

## Project Structure

```
lyrics-player/
├── apps/
│   ├── controller/    # Control app for managing lyrics and display
│   └── display/       # Display app for showing lyrics on big screen
├── packages/
│   ├── shared/        # Shared types and utilities
│   └── ui/            # Shared UI components
├── supabase/
│   └── migrations/    # Database migrations
└── docs/              # Project documentation
```

## Local Development Setup

### Prerequisites

- Node.js 18+ and npm
- Supabase account (free tier works)
- Google Gemini API key

### 1. Clone and Install

```bash
git clone <your-repo-url>
cd lyrics-player
npm install
```

### 2. Set Up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to Project Settings > API to get your credentials
3. Create a storage bucket named `fonts` with public access
4. Run the migrations from `supabase/migrations/001_initial_schema.sql`

### 3. Configure Environment Variables

Copy the example environment file:

```bash
cp .env.local.example .env.local
```

Edit `.env.local` with your values:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
GEMINI_API_KEY=your-gemini-api-key
```

### 4. Run Development Servers

```bash
# Start both apps in development mode
npm run dev

# Or start individually
cd apps/controller && npm run dev
cd apps/display && npm run dev
```

- Controller app: http://localhost:3000
- Display app: http://localhost:3001

## Railway Deployment

### Deploy Controller App

1. Create a new project on [Railway](https://railway.app)
2. Connect your GitHub repository
3. Set root directory to `apps/controller`
4. Add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `GEMINI_API_KEY`
5. Deploy

### Deploy Display App

1. Create another Railway project
2. Connect the same repository
3. Set root directory to `apps/display`
4. Add environment variables (same as above)
5. Deploy

## Usage

### Creating a Session

1. Open the controller app
2. Click "建立新 Session" (Create New Session)
3. Share the 6-digit code with the display app

### Connecting Display

1. Open the display app
2. Enter the 6-digit session code
3. Click "加入" (Join)

### Controlling Lyrics

- **Manual Entry**: Type lyrics manually and add them one by one
- **AI Search**: Click "搜尋歌詞" to search and import lyrics using AI

## Keyboard Shortcuts

| Key | Action | Description |
|-----|--------|-------------|
| `←` / `→` | Previous/Next | Navigate through lyrics |
| `Space` | Toggle Visibility | Show/hide current lyric |
| `f` | Fade In | Fade in the current lyric |
| `F` (Shift+f) | Fade Out | Fade out the current lyric |
| `Esc` | Emergency Clear | Immediately clear the display |
| `0-9` | Jump to Lyric | Jump to specific lyric line |

## Building for Production

```bash
npm run build
```

This builds both apps with optimized production bundles.

## Database Schema

### Sessions Table
- `id`: UUID (primary key)
- `code`: 6-character session code
- `created_at`, `updated_at`: Timestamps

### Lyrics Table
- `id`: UUID (primary key)
- `session_id`: Foreign key to sessions
- `text`: Lyric text content
- `notes`: Optional notes/section markers
- `order_index`: Display order
- `created_at`: Timestamp

## License

MIT License - feel free to use this project for your own purposes.

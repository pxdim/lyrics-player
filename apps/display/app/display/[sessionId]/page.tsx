import { LyricDisplay } from '@/components/LyricDisplay';

export default async function DisplayPage({
  params,
  searchParams,
}: {
  params: Promise<{ sessionId: string }>;
  searchParams: Promise<{ mode?: string }>;
}) {
  const { sessionId } = await params;
  const { mode } = await searchParams;
  return <LyricDisplay sessionId={sessionId} mode={mode === 'audience' ? 'audience' : 'stage'} />;
}

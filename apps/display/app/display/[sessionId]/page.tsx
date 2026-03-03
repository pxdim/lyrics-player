import { LyricDisplay } from '@/components/LyricDisplay';

export default function DisplayPage({ params }: { params: { sessionId: string } }) {
  return <LyricDisplay sessionId={params.sessionId} />;
}

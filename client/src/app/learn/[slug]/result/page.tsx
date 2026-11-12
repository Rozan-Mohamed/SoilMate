import { redirect } from 'next/navigation';
import { GameResultPage } from '@/features/learn/components/GameResultPage';
import { isGameSlug } from '@/features/learn/gameConfig';

export const metadata = { title: 'Your score' };

export default async function ResultPage({
  params,
  searchParams,
}: PageProps<'/learn/[slug]/result'>) {
  const [{ slug }, query] = await Promise.all([params, searchParams]);
  if (!isGameSlug(slug)) redirect('/learn');
  const attempt = typeof query.attempt === 'string' ? query.attempt : undefined;
  return <GameResultPage slug={slug} attemptId={attempt} />;
}

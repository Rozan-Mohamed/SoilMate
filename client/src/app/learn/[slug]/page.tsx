import { redirect } from 'next/navigation';
import { GamePlayPage } from '@/features/learn/components/GamePlayPage';
import { GAME_BY_SLUG, isGameSlug } from '@/features/learn/gameConfig';

export async function generateMetadata({ params }: PageProps<'/learn/[slug]'>) {
  const { slug } = await params;
  return { title: isGameSlug(slug) ? GAME_BY_SLUG[slug].title : 'Learn & Play' };
}

export default async function PlayPage({ params }: PageProps<'/learn/[slug]'>) {
  const { slug } = await params;
  if (!isGameSlug(slug)) redirect('/learn');
  return <GamePlayPage slug={slug} />;
}

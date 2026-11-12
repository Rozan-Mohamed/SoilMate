import { GamesPipeline } from '@/features/learn/components/GamesPipeline';

// Everything under /learn shares the slim 5-circle pipeline under the navbar.
export default function LearnLayout({ children }: LayoutProps<'/learn'>) {
  return (
    <>
      <GamesPipeline />
      {children}
    </>
  );
}

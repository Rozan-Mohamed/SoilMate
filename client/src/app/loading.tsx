import { Spinner } from '@/components/ui/Spinner';
import { en } from '@/strings/en';

export default function Loading() {
  return (
    <section className="mx-auto max-w-md px-4 py-16">
      <Spinner label={en.game.loading} />
    </section>
  );
}

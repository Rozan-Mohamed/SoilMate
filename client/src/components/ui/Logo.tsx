import { Leaf } from 'lucide-react';

export function Logo({ className = '' }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <span
        aria-hidden="true"
        className="grid size-9 place-items-center rounded-full bg-deep text-bright"
      >
        <Leaf className="size-5" strokeWidth={2.4} />
      </span>
      <span className="text-lg font-extrabold tracking-tight text-deep">SoilMate</span>
    </span>
  );
}

import { Cloud, Crown, Search, Sparkles, Stethoscope, Zap } from 'lucide-react';

// One consistent medal for every badge: gold ring, soft inner fill, one glyph.
const GLYPHS = {
  'badge-word-wizard': Sparkles,
  'badge-data-detective': Search,
  'badge-crop-hero': Zap,
  'badge-field-doctor': Stethoscope,
  'badge-weather-watcher': Cloud,
  'badge-soil-expert': Crown,
} as const;

export type BadgeKey = keyof typeof GLYPHS;

export function makeBadge(key: BadgeKey) {
  const Glyph = GLYPHS[key];
  function Badge({ className = '' }: { className?: string }) {
    return (
      <span
        className={`grid place-items-center rounded-full bg-gold-soft text-deep ring-2 ring-gold ${className}`}
      >
        <Glyph className="size-[58%]" strokeWidth={2.4} aria-hidden="true" />
      </span>
    );
  }
  Badge.displayName = key;
  return Badge;
}

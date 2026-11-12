// Game 4 collection tiles. Each tile reuses the artwork of the fix that earned it, on a soft coloured square.
import type { ComponentType } from 'react';

type IconComponent = ComponentType<{ className?: string }>;

export const TILE_SOURCES: Record<string, string> = {
  'tile-alive-soil': 'fix-compost',
  'tile-animal-feed': 'fix-forage-crop',
  'tile-ask-an-expert': 'fix-ask-expert',
  'tile-check-the-ground': 'fix-walk-field',
  'tile-compare-wisely': 'fix-compare',
  'tile-cool-soil': 'fix-mulch',
  'tile-cool-water': 'fix-cool-watering',
  'tile-cover-crop': 'fix-cover-crop',
  'tile-deep-roots': 'fix-deep-roots',
  'tile-drain-well': 'fix-drainage',
  'tile-extra-income': 'fix-rotate-crops',
  'tile-fill-the-gap': 'fix-cover-crop',
  'tile-frost-safe': 'fix-timing',
  'tile-grass-strip': 'fix-grass-strip',
  'tile-held-soil': 'fix-ground-cover',
  'tile-helpful-bugs': 'fix-flowers',
  'tile-hold-nutrients': 'fix-organic-matter',
  'tile-less-salt': 'fix-drainage',
  'tile-loose-again': 'fix-less-traffic',
  'tile-low-water': 'fix-drought-crop',
  'tile-nitrogen': 'fix-legumes',
  'tile-no-cracks': 'fix-organic-matter',
  'tile-no-gaps': 'fix-ground-cover',
  'tile-rich-soil': 'fix-organic-matter',
  'tile-rotation': 'fix-rotate-crops',
  'tile-save-money': 'fix-legumes',
  'tile-save-water': 'fix-drought-crop',
  'tile-soak-it-in': 'fix-organic-matter',
  'tile-soft-cover': 'fix-mulch',
  'tile-windbreak': 'fix-windbreak',
};

const BACKGROUNDS = ['#e4f8ec', '#fff4cc', '#ffe7d2', '#e3eefb', '#f1e8fb', '#eaf6f1'];

export function buildTiles(source: Record<string, IconComponent>): Record<string, IconComponent> {
  return Object.fromEntries(
    Object.entries(TILE_SOURCES).map(([tile, fixKey], i) => {
      const Art = source[fixKey];
      const Tile = ({ className = '' }: { className?: string }) => (
        <span
          className={`grid place-items-center rounded-lg ${className}`}
          style={{ background: BACKGROUNDS[i % BACKGROUNDS.length] }}
        >
          {Art && <Art className="size-[74%]" />}
        </span>
      );
      Tile.displayName = tile;
      return [tile, Tile];
    }),
  );
}

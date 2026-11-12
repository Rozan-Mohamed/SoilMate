import { Mascot } from '@/components/game/Mascot';
import type { MascotMood, MascotOutfit } from '@/api/types';

const BANDS = ['#f7a8c4', '#ffd166', '#90f4c0', '#7cc6ee'];

// The Game 5 score art: the raincoat mascot under a soft rainbow.
export function RainbowHero({ outfit, mood }: { outfit: MascotOutfit; mood: MascotMood }) {
  return (
    <div className="relative grid size-40 place-items-end justify-items-center" aria-hidden="true">
      <svg viewBox="0 0 160 90" className="absolute inset-x-0 top-0 w-full">
        {BANDS.map((color, i) => (
          <path
            key={color}
            d={`M${8 + i * 9} 88a${72 - i * 9} ${72 - i * 9} 0 0 1 ${144 - i * 18} 0`}
            fill="none"
            stroke={color}
            strokeWidth="8"
            strokeLinecap="round"
            opacity="0.85"
          />
        ))}
      </svg>
      <Mascot outfit={outfit} mood={mood} className="relative size-32" decorative />
    </div>
  );
}

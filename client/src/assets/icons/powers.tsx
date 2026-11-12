// Game 3 power icons (48x48): the 8 powers and the small "superhero leaf" used on the Next Game button.
import type { ReactNode, SVGProps } from 'react';

const D = '#184030';
const G1 = '#48b080';
const G2 = '#2f8f5b';
const BRIGHT = '#90f4c0';
const SOIL = '#c58b5b';
const WATER = '#5bb6e8';
const GOLD = '#f5b50a';

type P = SVGProps<SVGSVGElement>;
const Svg = ({ children, ...p }: P & { children: ReactNode }) => (
  <svg viewBox="0 0 48 48" fill="none" {...p}>
    <g stroke={D} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      {children}
    </g>
  </svg>
);

const Soil = ({ y = 34 }: { y?: number }) => (
  <path d={`M3 ${y}h42v10a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3Z`} fill={SOIL} />
);
const Sparkle = ({ x, y, s = 1 }: { x: number; y: number; s?: number }) => (
  <path
    transform={`translate(${x} ${y}) scale(${s})`}
    d="M0-5 1.500-1.500 5 0 1.500 1.500 0 5-1.500 1.500-5 0-1.500-1.500Z"
    fill={GOLD}
    stroke="none"
  />
);
const Sprout = ({ x = 24, y = 34, s = 1 }: { x?: number; y?: number; s?: number }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <path d="M0 0V-12" />
    <path d="M0-8C-9-8-12-14-12-19-5-19 0-14 0-8Z" fill={G1} />
    <path d="M0-12c8 0 11-6 11-11-7 0-11 5-11 11Z" fill={G2} />
  </g>
);

export const PowerNitrogen = (p: P) => (
  <Svg {...p}>
    <Soil y={33} />
    <Sprout y={33} />
    <Sparkle x={9} y={12} />
    <Sparkle x={39} y={10} s={0.8} />
    <path d="M24 36v6M21 40l3 3 3-3" stroke="#fff" strokeWidth="2" />
  </Svg>
);

export const PowerProtector = (p: P) => (
  <Svg {...p}>
    <path d="M3 40c4-8 10-11 21-11s17 3 21 11Z" fill={SOIL} />
    <path d="M24 5 11 10v10c0 9 6 14 13 17 7-3 13-8 13-17V10Z" fill={BRIGHT} />
    <path d="M18 21l5 5 8-9" stroke={G2} strokeWidth="3" />
  </Svg>
);

export const PowerDeepRoots = (p: P) => (
  <Svg {...p}>
    <path d="M3 18h42v26a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3Z" fill={SOIL} />
    <path d="M3 18h42" />
    <Sprout y={18} s={0.9} />
    <path d="M24 18v24M24 26l-8 7M24 31l8 6M24 37l-5 5" stroke="#f6e6c2" strokeWidth="2.200" />
  </Svg>
);

export const PowerLowWater = (p: P) => (
  <Svg {...p}>
    <path d="M10 44h22" />
    <rect x="17" y="12" width="9" height="30" rx="4.500" fill={G1} />
    <path d="M17 24h-5a3 3 0 0 1-3-3v-6a3 3 0 0 1 6 0v3h2" fill={G1} />
    <path d="M26 20h5a3 3 0 0 0 3-3v-4a3 3 0 0 0-6 0v2h-2" fill={G1} />
    <path
      d="M38 6c3 4 5.500 6.500 5.500 9.500a5.500 5.500 0 0 1-11 0C32.500 12.500 35 10 38 6Z"
      fill={WATER}
    />
  </Svg>
);

export const PowerPestBreaker = (p: P) => (
  <Svg {...p}>
    <ellipse cx="24" cy="26" rx="8" ry="10" fill="#c2693a" />
    <circle cx="24" cy="14" r="5" fill="#8a4a24" />
    <path d="M16 20l-6-3M16 27h-7M17 33l-6 4M32 20l6-3M32 27h7M31 33l6 4M21 9l-3-4M27 9l3-4" />
    <circle cx="24" cy="24" r="19" stroke="#e07a1f" strokeWidth="3.200" />
    <path d="M11 37 37 11" stroke="#e07a1f" strokeWidth="3.200" />
  </Svg>
);

export const PowerSoilBooster = (p: P) => (
  <Svg {...p}>
    <path d="M5 8c0 9 6 14 14 14 0-9-6-14-14-14Z" fill={G1} />
    <path d="M24 10l7 4-7 4" />
    <path d="M30 4c0 9 6 14 14 14 0-9-6-14-14-14Z" fill={G2} />
    <path d="M4 43c3-9 9-13 20-13s17 4 20 13Z" fill="#8a5a3c" />
    <Sparkle x={14} y={36} s={0.8} />
    <Sparkle x={34} y={38} s={0.7} />
  </Svg>
);

export const PowerAnimalFeed = (p: P) => (
  <Svg {...p}>
    <path d="M4 44h40" />
    {[8, 13, 18].map((x, i) => (
      <path
        key={x}
        d={`M${x} 44Q${x - 3} ${34 - i * 2} ${x + 2} ${26 - i * 2}`}
        stroke={G2}
        strokeWidth="2.200"
      />
    ))}
    <ellipse cx="32" cy="32" rx="11" ry="8" fill="#faf6ee" />
    <circle cx="40" cy="28" r="5.500" fill="#e8dcc6" />
    <circle cx="42" cy="27" r="0.900" fill={D} stroke="none" />
    <path d="M27 38v6M35 38v6" />
  </Svg>
);

export const PowerExtraIncome = (p: P) => (
  <Svg {...p}>
    <Soil y={36} />
    <Sprout x={17} y={36} s={1.1} />
    <circle cx="33" cy="22" r="10" fill={GOLD} />
    <circle cx="33" cy="22" r="6.500" stroke="#c98f00" strokeWidth="1.400" />
    <path
      d="M33 17v10M30.500 19.500q2.500-2 5 0M30.500 24.500q2.500 2 5 0"
      stroke="#7a5200"
      strokeWidth="1.500"
    />
  </Svg>
);

export const PowerSuperheroLeaf = (p: P) => (
  <Svg {...p}>
    <path d="M10 18 4 40q20 8 40 0L38 18Z" fill="#f08a6e" />
    <path d="M24 44C12 40 8 28 12 14 24 12 36 18 36 30c0 8-6 13-12 14Z" fill={G1} />
    <path d="M14 24Q24 20 34 26l-1 6Q24 28 15 31Z" fill={D} />
    <circle cx="20" cy="27.500" r="1.800" fill="#fff" stroke="none" />
    <circle cx="28" cy="29" r="1.800" fill="#fff" stroke="none" />
  </Svg>
);

// Game 1 term icons (48x48, flat, palette-matched).
import type { SVGProps } from 'react';

const D = '#184030';
const B = '#90f4c0';
const L = '#48b080';
const W = '#5bb6e8';
const SOIL = '#c58b5b';

type P = SVGProps<SVGSVGElement>;
const base = (p: P) => ({ viewBox: '0 0 48 48', fill: 'none', ...p });
const stroke = {
  stroke: D,
  strokeWidth: 2.5,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
} as const;

export const TermNdvi = (p: P) => (
  <svg {...base(p)}>
    <path d="M9 39C6 20 19 7 41 8c1 22-11 33-32 31Z" fill={B} {...stroke} />
    <path d="M11 37 33 15" stroke={L} strokeWidth={3} strokeLinecap="round" />
    <path d="M19 29l-1-8M25 23l-1-8M28 27l8-1" stroke={L} strokeWidth={2.5} strokeLinecap="round" />
  </svg>
);

export const TermEvapotranspiration = (p: P) => (
  <svg {...base(p)}>
    <path
      d="M13 26a6 6 0 0 1 .8-11.9A9 9 0 0 1 31 12.5 6.5 6.5 0 0 1 34 26Z"
      fill="#eaf6f1"
      {...stroke}
    />
    <g stroke={W} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 41V32M13.5 35.5 17 32l3.5 3.5" />
      <path d="M29 41V32M25.5 35.5 29 32l3.5 3.5" />
    </g>
    <path d="M6 44h36" stroke={SOIL} strokeWidth={3} strokeLinecap="round" />
  </svg>
);

export const TermSoilMoistureAnomaly = (p: P) => (
  <svg {...base(p)}>
    <path d="M5 42c4-12 12-17 19-17s15 5 19 17Z" fill={SOIL} {...stroke} />
    <circle cx="17" cy="38" r="1.6" fill={D} />
    <circle cx="30" cy="35" r="1.6" fill={D} />
    <path
      d="M24 5c4 6 7.5 9.5 7.5 13.5a7.5 7.5 0 0 1-15 0C16.5 14.500 20 11 24 5Z"
      fill={W}
      {...stroke}
    />
  </svg>
);

export const TermFrostRisk = (p: P) => (
  <svg {...base(p)}>
    <g stroke={W} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
      <path d="M24 5v38M7.5 14.500l33 19M7.500 33.500l33-19" />
      <path d="M19.500 8.500 24 12l4.500-3.500M19.500 39.500 24 36l4.500 3.500" />
      <path d="M8 21l5.500-1-1.500-5.500M40 27l-5.500 1 1.500 5.500" />
      <path d="M40 21l-5.500-1 1.500-5.500M8 27l5.500 1-1.500 5.500" />
    </g>
    <circle cx="24" cy="24" r="3.500" fill="#fff" stroke={D} strokeWidth={2.5} />
  </svg>
);

export const TermWaterBalance = (p: P) => (
  <svg {...base(p)}>
    <path d="M24 10v30M15 41h18" {...stroke} />
    <path d="M7 14h34" {...stroke} />
    <circle cx="24" cy="10" r="3" fill={B} {...stroke} />
    <path
      d="M10 14 4.500 27M10 14l5.500 13M38 14l-5.500 13M38 14l5.500 13"
      stroke={D}
      strokeWidth={2}
      strokeLinecap="round"
    />
    <path
      d="M3 27h14a7 7 0 0 1-14 0ZM31 27h14a7 7 0 0 1-14 0Z"
      fill="#eaf6f1"
      {...stroke}
      strokeWidth={2.2}
    />
    <path
      d="M10 28.500c1.500 2 2.500 3 2.500 4.500a2.500 2.500 0 0 1-5 0c0-1.500 1-2.500 2.500-4.500Z"
      fill={W}
    />
  </svg>
);

export const TermErosion = (p: P) => (
  <svg {...base(p)}>
    <path d="M5 15h22l14 15v10H5Z" fill={SOIL} {...stroke} />
    <path d="M5 15h22l5.500 6H5Z" fill={L} {...stroke} />
    <circle cx="33" cy="33" r="1.800" fill={D} />
    <circle cx="25" cy="31" r="1.500" fill={D} />
    <circle cx="15" cy="32" r="1.500" fill={D} />
    <path
      d="M38 41c2 3 3 4.500 3 6.500a3 3 0 0 1-6 0c0-2 1-3.500 3-6.500Z"
      fill={W}
      stroke={D}
      strokeWidth={2}
    />
    <path
      d="M10 7c1.500-2 3-2 4.500 0M18 5c1.500-2 3-2 4.500 0"
      stroke={D}
      strokeWidth={2}
      strokeLinecap="round"
    />
  </svg>
);

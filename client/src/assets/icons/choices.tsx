// Game 2 answer icons (48x48).
import type { SVGProps } from 'react';
import { Farmer, SatelliteBot } from './characters';

const D = '#184030';
type P = SVGProps<SVGSVGElement>;
const base = (p: P) => ({ viewBox: '0 0 48 48', fill: 'none', ...p });

export const ChoiceSatellite = (p: P) => (
  <svg {...base(p)}>
    <ellipse
      cx="22"
      cy="28"
      rx="20"
      ry="8"
      transform="rotate(-24 22 28)"
      stroke={D}
      strokeWidth="1.800"
      strokeDasharray="3 3"
    />
    <circle cx="20" cy="30" r="12" fill="#7cc6ee" stroke={D} strokeWidth="2.500" />
    <path d="M12 28c3-4 7-3 8-6 3 1 5 4 3 7-3 1-4 4-7 4-3-1-5-3-4-5Z" fill="#79d39a" />
    <g transform="translate(25 2) scale(0.62) rotate(30 12 12)">
      <SatelliteBot smile={false} />
    </g>
  </svg>
);

export const ChoiceBothTogether = (p: P) => (
  <svg {...base(p)}>
    <g transform="translate(1 3) scale(0.55)">
      <SatelliteBot />
    </g>
    <g transform="translate(28 10) scale(0.62)">
      <Farmer />
    </g>
    <path
      d="M20 14q8 6 8 12"
      stroke={D}
      strokeWidth="2"
      strokeDasharray="2 3"
      strokeLinecap="round"
    />
    <path
      d="M24 36c-5-3-8-6-8-9a4 4 0 0 1 8-1 4 4 0 0 1 8 1c0 3-3 6-8 9Z"
      fill="#f5a34a"
      stroke={D}
      strokeWidth="1.800"
      strokeLinejoin="round"
      transform="translate(-2 4) scale(0.8) translate(5 0)"
    />
  </svg>
);

export const ChoiceOnTheGround = (p: P) => (
  <svg {...base(p)}>
    <path d="M2 38h44v8H2Z" fill="#c79b6d" stroke={D} strokeWidth="2.200" strokeLinejoin="round" />
    <path d="M2 38h44v3H2Z" fill="#79d39a" />
    <g transform="translate(12 3) scale(1.05)">
      <Farmer />
    </g>
    <g stroke="#2f8f5b" strokeWidth="2" strokeLinecap="round">
      <path d="M6 38v-5M40 38v-6M44 38v-4" />
    </g>
  </svg>
);

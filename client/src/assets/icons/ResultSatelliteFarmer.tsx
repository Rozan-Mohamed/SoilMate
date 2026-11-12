// Game 2 score art: a smiling satellite and a smiling farmer high-fiving over a small field.
import type { SVGProps } from 'react';
import { Farmer, SatelliteBot } from './characters';

const D = '#184030';

export function ResultSatelliteFarmer(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 200 120" fill="none" {...props}>
      <ellipse cx="100" cy="108" rx="84" ry="9" fill="#cfebd6" />
      <path d="M26 108h148" stroke="#79d39a" strokeWidth="6" strokeLinecap="round" />
      {/* sparkles */}
      <g fill="#f5b50a">
        <path d="M100 16l2.500 6 6 2.500-6 2.500L100 33l-2.500-6-6-2.500 6-2.500Z" />
        <circle cx="64" cy="22" r="2.500" />
        <circle cx="140" cy="30" r="2" />
      </g>
      <g transform="translate(20 28) scale(2.4)">
        <Farmer />
      </g>
      <g transform="translate(112 12) scale(2.4)">
        <SatelliteBot />
      </g>
      {/* the high five */}
      <path d="M78 58q14-12 30-12" stroke={D} strokeWidth="3" strokeLinecap="round" />
      <circle cx="93" cy="50" r="7" fill="#90f4c0" stroke={D} strokeWidth="2.500" />
      <path
        d="M93 54c-3-2-4-3-4-4.500a2 2 0 0 1 4-.500 2 2 0 0 1 4 .5c0 1.500-1 2.500-4 4.500Z"
        fill="#f5a34a"
      />
    </svg>
  );
}

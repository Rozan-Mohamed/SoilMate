// Game 4 icons (48x48): the 40 fix choices plus the two "next game" button icons.
// Small flat compositions built from the shared bits below.
import type { ReactNode, SVGProps } from 'react';

export const D = '#184030';
export const G1 = '#48b080';
export const G2 = '#2f8f5b';
export const SOIL = '#c58b5b';
export const DARK = '#8a5a3c';
export const WATER = '#5bb6e8';
export const GOLD = '#f5b50a';
export const PEACH = '#f5a34a';

export type P = SVGProps<SVGSVGElement>;
export const Svg = ({ children, ...p }: P & { children: ReactNode }) => (
  <svg viewBox="0 0 48 48" fill="none" {...p}>
    <g stroke={D} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      {children}
    </g>
  </svg>
);

// ------------------------------------------------------------------ shared bits
export const Soil = ({ y = 34, fill = SOIL }: { y?: number; fill?: string }) => (
  <path d={`M3 ${y}h42v${45 - y}a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3Z`} fill={fill} />
);
export const Sprout = ({
  x = 24,
  y = 34,
  s = 1,
  a = G1,
  b = G2,
}: {
  x?: number;
  y?: number;
  s?: number;
  a?: string;
  b?: string;
}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <path d="M0 0V-12" />
    <path d="M0-8C-9-8-12-14-12-19-5-19 0-14 0-8Z" fill={a} />
    <path d="M0-12c8 0 11-6 11-11-7 0-11 5-11 11Z" fill={b} />
  </g>
);
export const Drop = ({
  x,
  y,
  s = 1,
  fill = WATER,
}: {
  x: number;
  y: number;
  s?: number;
  fill?: string;
}) => (
  <path
    transform={`translate(${x} ${y}) scale(${s})`}
    d="M0-9C3-4 6-1.500 6 2a6 6 0 0 1-12 0C-6-1.500-3-4 0-9Z"
    fill={fill}
  />
);
export const Sun = ({ x, y, r = 6 }: { x: number; y: number; r?: number }) => (
  <g>
    <circle cx={x} cy={y} r={r} fill={GOLD} />
    <g strokeWidth="1.600">
      {Array.from({ length: 8 }, (_, i) => (
        <path key={i} d={`M${x} ${y - r - 2}v-3`} transform={`rotate(${i * 45} ${x} ${y})`} />
      ))}
    </g>
  </g>
);
export const Cloud = ({
  x,
  y,
  s = 1,
  fill = '#fff',
}: {
  x: number;
  y: number;
  s?: number;
  fill?: string;
}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`} fill={fill}>
    <ellipse cx="0" cy="5" rx="12" ry="6" />
    <ellipse cx="-6" cy="1" rx="6.500" ry="5.500" />
    <ellipse cx="3" cy="-1" rx="8" ry="7" />
    <ellipse cx="11" cy="4" rx="6" ry="4.500" />
  </g>
);
export const Scissors = ({ x, y, s = 1 }: { x: number; y: number; s?: number }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <path d="M-7-9 7 9M7-9-7 9" strokeWidth="2.200" />
    <circle cx="-8" cy="11" r="3.200" fill="#fff" />
    <circle cx="8" cy="11" r="3.200" fill="#fff" />
  </g>
);
export const Tractor = ({ x = 0, y = 0, s = 1 }: { x?: number; y?: number; s?: number }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <rect x="6" y="20" width="30" height="12" rx="3" fill={PEACH} />
    <rect x="22" y="9" width="14" height="13" rx="2.500" fill="#ffe7d2" />
    <circle cx="14" cy="34" r="8" fill={D} />
    <circle cx="14" cy="34" r="3" fill="#90f4c0" />
    <circle cx="36" cy="36" r="5.500" fill={D} />
  </g>
);
export const Sheep = ({ x = 0, y = 0, s = 1 }: { x?: number; y?: number; s?: number }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <ellipse cx="22" cy="24" rx="14" ry="10" fill="#faf6ee" />
    <circle cx="9" cy="20" r="6" fill="#e8dcc6" />
    <path d="M14 33v8M30 33v8" />
  </g>
);
export const Coin = ({ x, y, r = 8 }: { x: number; y: number; r?: number }) => (
  <g>
    <circle cx={x} cy={y} r={r} fill={GOLD} />
    <path
      d={`M${x} ${y - r * 0.5}v${r}M${x - r * 0.35} ${y - r * 0.2}q${r * 0.35}-${r * 0.3} ${r * 0.7} 0M${x - r * 0.35} ${y + r * 0.2}q${r * 0.35} ${r * 0.3} ${r * 0.7} 0`}
      stroke="#7a5200"
      strokeWidth="1.300"
    />
  </g>
);
export const Can = ({ x = 0, y = 0, s = 1 }: { x?: number; y?: number; s?: number }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <rect x="6" y="16" width="20" height="16" rx="3" fill="#7aa6e8" />
    <path d="M26 20 38 12M26 24 40 18" />
    <path d="M10 16c0-6 12-6 12 0" />
  </g>
);
export const Tree = ({ x, y, s = 1 }: { x: number; y: number; s?: number }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <rect x="-2" y="0" width="4" height="10" fill={DARK} />
    <circle cy="-6" r="9" fill={G2} />
    <circle cx="-3" cy="-9" r="3" fill={G1} stroke="none" />
  </g>
);
export const Q = ({ x, y }: { x: number; y: number }) => (
  <text
    x={x}
    y={y}
    fontSize="14"
    fontWeight="800"
    fill={D}
    stroke="none"
    textAnchor="middle"
    fontFamily="sans-serif"
  >
    ?
  </text>
);

// ----------------------------------------------------------------------- the 40
export const FixAddWater = (p: P) => (
  <Svg {...p}>
    <Drop x={22} y={26} s={2.1} />
    <path d="M38 8v12M32 14h12" stroke="#2f8f5b" strokeWidth="3.500" />
  </Svg>
);
export const FixAskExpert = (p: P) => (
  <Svg {...p}>
    <circle cx="17" cy="19" r="7" fill="#f6d2b0" />
    <path d="M5 44c0-10 5-14 12-14s12 4 12 14Z" fill={G1} />
    <rect x="26" y="4" width="18" height="14" rx="5" fill="#fff" />
    <path d="M31 18l-2 5 6-5" fill="#fff" />
    <Q x={35} y={15} />
  </Svg>
);
export const FixAssume = (p: P) => (
  <Svg {...p}>
    <Cloud x={24} y={20} s={1.7} fill="#eef5f8" />
    <circle cx="13" cy="38" r="3" fill="#eef5f8" />
    <circle cx="8" cy="44" r="1.800" fill="#eef5f8" />
    <Q x={24} y={26} />
  </Svg>
);
export const FixBareSoil = (p: P) => (
  <Svg {...p}>
    <Soil y={26} />
    <path d="M10 32h8M26 36h12M16 41h10" stroke="#b1865a" strokeWidth="2.500" />
    <path d="M30 28l4 5-3 4" stroke={DARK} />
  </Svg>
);
export const FixBurn = (p: P) => (
  <Svg {...p}>
    <Soil y={36} fill="#6f523a" />
    <path
      d="M24 6c2 7 10 10 10 20a10 10 0 0 1-20 0c0-5 3-7 4-11 2 2 3 4 3 6 2-4 3-9 3-15Z"
      fill={PEACH}
    />
    <path d="M24 20c1 4 5 5 5 10a5 5 0 0 1-10 0c0-3 3-4 5-10Z" fill="#ffd166" />
  </Svg>
);
export const FixCompare = (p: P) => (
  <Svg {...p}>
    <Soil y={34} />
    <Sprout x={13} y={34} s={0.9} />
    <Sprout x={35} y={34} s={1.2} />
    <path d="M19 12h10M25 8l4 4-4 4M23 8l-4 4 4 4" strokeWidth="1.800" />
  </Svg>
);
export const FixCompost = (p: P) => (
  <Svg {...p}>
    <path d="M4 42c3-14 9-18 20-18s17 4 20 18Z" fill={DARK} />
    <path d="M14 30l6-8c4 0 6 3 6 3-1 5-5 7-12 5Z" fill={G1} />
    <circle cx="32" cy="34" r="2" fill="#c9a24a" stroke="none" />
    <path
      d="M36 10l1.500 3.500 3.500 1.500-3.500 1.500L36 20l-1.500-3.500L31 15l3.500-1.500Z"
      fill={GOLD}
      stroke="none"
    />
  </Svg>
);
export const FixCoolWatering = (p: P) => (
  <Svg {...p}>
    <path d="M3 24h22a8 8 0 0 0-22 0Z" fill={GOLD} transform="translate(26 -8) scale(0.9)" />
    <Can x={0} y={4} s={1} />
    <Drop x={40} y={36} s={0.7} />
    <Drop x={34} y={42} s={0.6} />
  </Svg>
);
export const FixCopy = (p: P) => (
  <Svg {...p}>
    <rect x="9" y="6" width="22" height="28" rx="4" fill="#eef5f8" />
    <rect x="17" y="14" width="22" height="28" rx="4" fill="#fff" />
    <path d="M23 24h10M23 30h10M23 36h6" />
  </Svg>
);
export const FixCoverCrop = (p: P) => (
  <Svg {...p}>
    <Soil y={34} />
    <Sprout x={11} y={34} s={0.8} />
    <Sprout x={24} y={34} s={0.9} />
    <Sprout x={37} y={34} s={0.8} />
    <path d="M3 34h42" stroke="#79d39a" strokeWidth="3" />
  </Svg>
);
export const FixCutFlowers = (p: P) => (
  <Svg {...p}>
    <path d="M20 44V24" />
    <circle cx="20" cy="17" r="6" fill="#f7a8c4" />
    <circle cx="20" cy="17" r="2.500" fill={GOLD} stroke="none" />
    <Scissors x={33} y={26} s={0.9} />
  </Svg>
);
export const FixCutGrass = (p: P) => (
  <Svg {...p}>
    {[12, 18, 24].map((x) => (
      <path key={x} d={`M${x} 44Q${x - 2} 32 ${x + 2} 22`} stroke={G2} strokeWidth="3" />
    ))}
    <Scissors x={34} y={26} s={0.9} />
  </Svg>
);
export const FixCutLeaves = (p: P) => (
  <Svg {...p}>
    <path d="M8 38C6 22 16 10 30 10c0 14-8 26-22 28Z" fill={G1} />
    <path d="M10 36 24 18" stroke="#e6f6b8" />
    <Scissors x={36} y={32} s={0.8} />
  </Svg>
);
export const FixDeepRoots = (p: P) => (
  <Svg {...p}>
    <Soil y={14} />
    <Sprout y={14} s={0.8} />
    <path d="M24 14v30M24 22l-9 8M24 28l9 7M24 36l-6 6" stroke="#f6e6c2" strokeWidth="2.200" />
  </Svg>
);
export const FixDoNothing = (p: P) => (
  <Svg {...p}>
    <circle cx="24" cy="24" r="18" fill="#eef5f8" />
    <rect x="16" y="14" width="5.500" height="20" rx="2" fill={G2} />
    <rect x="26.500" y="14" width="5.500" height="20" rx="2" fill={G2} />
  </Svg>
);
export const FixDrainage = (p: P) => (
  <Svg {...p}>
    <Soil y={20} />
    <rect x="3" y="26" width="42" height="9" rx="4.500" fill="#b8c7cf" />
    <path d="M10 31h4M20 31h4M30 31h4" />
    <Drop x={12} y={42} s={0.7} />
    <Drop x={26} y={42} s={0.7} />
    <Drop x={38} y={42} s={0.7} />
  </Svg>
);
export const FixDroughtCrop = (p: P) => (
  <Svg {...p}>
    <Sun x={37} y={11} r={5} />
    <Soil y={36} />
    <path d="M17 36V16a4 4 0 0 1 8 0v20Z" fill={G1} />
    <path d="M17 26h-5v-7a3 3 0 0 1 5-2M25 22h5v-5a3 3 0 0 0-5-2" fill={G1} />
  </Svg>
);
export const FixFertilizer = (p: P) => (
  <Svg {...p}>
    <path d="M10 14h28l3 28H7Z" fill="#e8dcc6" />
    <path d="M14 14c0-5 20-5 20 0" />
    <rect x="15" y="22" width="18" height="12" rx="3" fill={G1} />
    <path d="M20 30v-5l8 5v-5" stroke="#fff" strokeWidth="2" />
  </Svg>
);
export const FixFlowers = (p: P) => (
  <Svg {...p}>
    <path d="M16 44V24" />
    <Sprout x={16} y={44} s={0.6} />
    <circle cx="16" cy="18" r="6" fill="#ffd166" />
    <circle cx="16" cy="18" r="2.500" fill={DARK} stroke="none" />
    <ellipse cx="34" cy="14" rx="6" ry="4.500" fill={GOLD} />
    <path d="M31 10v8M35 10v8" />
    <ellipse cx="30" cy="9" rx="3" ry="2" fill="#fff" />
  </Svg>
);
export const FixForageCrop = (p: P) => (
  <Svg {...p}>
    <circle cx="30" cy="26" r="13" fill="#e8c35a" />
    <circle cx="30" cy="26" r="8" />
    <circle cx="30" cy="26" r="3" />
    {[8, 13].map((x) => (
      <path key={x} d={`M${x} 44Q${x - 3} 34 ${x + 2} 26`} stroke={G2} strokeWidth="3" />
    ))}
  </Svg>
);
export const FixGrassStrip = (p: P) => (
  <Svg {...p}>
    <rect x="3" y="24" width="42" height="8" rx="3" fill="#79d39a" />
    {[8, 16, 24, 32, 40].map((x) => (
      <path key={x} d={`M${x} 24l1.500-6 1.500 6`} fill={G1} />
    ))}
    <path d="M3 38q10-4 20 0t22 0" stroke={WATER} strokeWidth="3" />
  </Svg>
);
export const FixGroundCover = (p: P) => (
  <Svg {...p}>
    <Soil y={30} />
    {[8, 17, 26, 35].map((x, i) => (
      <Sprout key={x} x={x + 2} y={34} s={0.6 + (i % 2) * 0.1} />
    ))}
    <path d="M3 31h42" stroke="#79d39a" strokeWidth="3.500" />
  </Svg>
);
export const FixHeavyMachinery = (p: P) => (
  <Svg {...p}>
    <Tractor x={2} y={2} s={1} />
    <path d="M4 44h40" />
  </Svg>
);
export const FixLegumes = (p: P) => (
  <Svg {...p}>
    <Soil y={38} />
    <Sprout x={14} y={38} s={0.9} />
    <path d="M22 32C24 18 34 10 44 11c-1 12-9 21-22 21Z" fill="#5cc48f" />
    <circle cx="29" cy="24" r="2.800" fill="#e6f6b8" />
    <circle cx="36" cy="18" r="2.800" fill="#e6f6b8" />
  </Svg>
);
export const FixLessTraffic = (p: P) => (
  <Svg {...p}>
    <Tractor x={0} y={0} s={0.85} />
    <circle cx="36" cy="14" r="9" fill="#fff" stroke={PEACH} strokeWidth="2.500" />
    <path d="M30 14h12" stroke={PEACH} strokeWidth="3" />
  </Svg>
);
export const FixMulch = (p: P) => (
  <Svg {...p}>
    <Soil y={32} />
    <Sprout x={24} y={32} s={0.8} />
    {[
      [6, 33, 22, 30],
      [14, 37, 34, 33],
      [26, 31, 42, 34],
      [8, 41, 26, 38],
    ].map(([a, b, c, d]) => (
      <path key={`${a}${b}`} d={`M${a} ${b}L${c} ${d}`} stroke="#e2b955" strokeWidth="3.200" />
    ))}
  </Svg>
);
export const FixNoonWatering = (p: P) => (
  <Svg {...p}>
    <Sun x={24} y={11} r={7} />
    <Can x={4} y={8} s={1} />
    <Drop x={40} y={36} s={0.7} />
    <Drop x={34} y={43} s={0.6} />
  </Svg>
);
export const FixOrganicMatter = (p: P) => (
  <Svg {...p}>
    <Soil y={28} fill={DARK} />
    <path d="M8 24C7 14 14 8 24 8c0 9-6 15-16 16Z" fill={G1} />
    <path d="M10 38q4-5 8 0t8 0" stroke="#f5a3b8" strokeWidth="3" />
  </Svg>
);
export const FixPackSoil = (p: P) => (
  <Svg {...p}>
    <rect x="8" y="20" width="32" height="12" rx="3" fill={SOIL} />
    <path d="M24 4v10M20 10l4 4 4-4M24 44V34M20 38l4-4 4 4" strokeWidth="2.500" />
  </Svg>
);
export const FixPlantEarly = (p: P) => (
  <Svg {...p}>
    <rect x="6" y="8" width="28" height="30" rx="4" fill="#fff" />
    <path d="M6 16h28" />
    <path d="M13 6v6M27 6v6" />
    <Sprout x={20} y={34} s={0.9} />
    <path d="M32 30l10 6-10 6" strokeWidth="2.500" />
  </Svg>
);
export const FixPlow = (p: P) => (
  <Svg {...p}>
    <path d="M4 40q10-4 20 0t20 0" stroke={DARK} strokeWidth="3.500" />
    <path d="M10 12l12 10v12l-12-6Z" fill="#b8c7cf" />
    <path d="M22 22 38 8" stroke={DARK} strokeWidth="3" />
    <path d="M36 6h8" strokeWidth="3" />
  </Svg>
);
export const FixRotateCrops = (p: P) => (
  <Svg {...p}>
    <Sprout x={14} y={28} s={0.9} />
    <path d="M26 28q5-2 7-12" fill="none" />
    <ellipse cx="35" cy="22" rx="5" ry="7" fill={GOLD} />
    <path
      d="M10 38q14 10 28-4M34 30l4 4-6 2M38 12q-14-10-28 4M14 20l-4-4 6-2"
      strokeWidth="2.200"
    />
  </Svg>
);
export const FixSaltyWater = (p: P) => (
  <Svg {...p}>
    <Drop x={24} y={26} s={2.3} fill="#9ec9e0" />
    {[
      [18, 28],
      [26, 33],
      [27, 24],
    ].map(([x, y]) => (
      <rect key={`${x}${y}`} x={x - 2.5} y={y - 2.5} width="5" height="5" rx="1" fill="#fff" />
    ))}
  </Svg>
);
export const FixSameCrop = (p: P) => (
  <Svg {...p}>
    <Soil y={34} />
    {[10, 24, 38].map((x) => (
      <Sprout key={x} x={x} y={34} s={0.9} />
    ))}
    <path d="M8 12h10M26 12h10M12 8l-4 4 4 4M32 8l4 4-4 4" strokeWidth="2" />
  </Svg>
);
export const FixSellAnimals = (p: P) => (
  <Svg {...p}>
    <Sheep x={0} y={2} s={0.85} />
    <Coin x={37} y={13} r={9} />
  </Svg>
);
export const FixSteepDitch = (p: P) => (
  <Svg {...p}>
    <path d="M3 40 36 10 45 20V44H3Z" fill={SOIL} />
    <path d="M3 40 36 10" stroke="#79d39a" strokeWidth="4" />
    <path d="M14 42 40 24" stroke={WATER} strokeWidth="3.500" />
  </Svg>
);
export const FixThirstyCrop = (p: P) => (
  <Svg {...p}>
    <Soil y={36} />
    <path d="M24 36V22" />
    <path d="M24 24q-10-1-12 7M24 24q10-1 12 7" fill="#d9c070" stroke="#8f7a3a" />
    <Drop x={37} y={11} s={0.9} />
    <Drop x={11} y={13} s={0.7} />
  </Svg>
);
export const FixTiming = (p: P) => (
  <Svg {...p}>
    <circle cx="22" cy="26" r="16" fill="#fff" />
    <path d="M22 16v10l7 4" />
    <Sun x={38} y={10} r={4.5} />
  </Svg>
);
export const FixWalkField = (p: P) => (
  <Svg {...p}>
    <Soil y={20} />
    {[
      [14, 30],
      [30, 26],
      [14, 41],
      [30, 38],
    ].map(([x, y], i) => (
      <g key={`${x}${y}`}>
        <ellipse
          cx={x}
          cy={y}
          rx="4"
          ry="6"
          fill="#6f523a"
          transform={`rotate(${i % 2 ? 12 : -12} ${x} ${y})`}
        />
        <circle cx={x - 3} cy={y - 8} r="1.300" fill="#6f523a" stroke="none" />
        <circle cx={x + 1} cy={y - 9} r="1.300" fill="#6f523a" stroke="none" />
        <circle cx={x + 4} cy={y - 8} r="1.300" fill="#6f523a" stroke="none" />
      </g>
    ))}
  </Svg>
);
export const FixWindbreak = (p: P) => (
  <Svg {...p}>
    <Tree x={30} y={22} s={1} />
    <Tree x={40} y={26} s={0.85} />
    <path d="M4 18h16c4 0 4-5 0-5M4 26h22c5 0 5-6 0-6" strokeWidth="2.200" stroke="#7cc6ee" />
    <path d="M3 42h42" />
  </Svg>
);

// ---------------------------------------------------- "next game" button icons
export const MagnifierField = (p: P) => (
  <Svg {...p}>
    <Soil y={30} />
    <Sprout x={14} y={36} s={0.8} />
    <circle cx="28" cy="20" r="11" fill="#eaf6f1" fillOpacity="0.85" />
    <path d="M36 28l9 9" strokeWidth="4" />
  </Svg>
);
export const CloudSunDrop = (p: P) => (
  <Svg {...p}>
    <Sun x={32} y={13} r={6.5} />
    <Cloud x={20} y={26} s={1.5} fill="#eaf6f1" />
    <Drop x={14} y={42} s={0.8} />
    <Drop x={26} y={44} s={0.7} />
  </Svg>
);

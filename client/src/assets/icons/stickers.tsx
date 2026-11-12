// Game 5 weather stickers (30): a soft round sticker with one weather picture each.
import type { ComponentType, ReactNode } from 'react';
import type { P } from './fixes';
import {
  Arrow,
  Bug,
  Cloud,
  Cracks,
  D,
  DARK,
  Drop,
  G1,
  G2,
  GOLD,
  ICE,
  Leaf,
  Moon,
  PEACH,
  Plant,
  Snowflake,
  SOIL,
  Star,
  Sun,
  WATER,
  WindLines,
} from './weather';

function StickerSvg({ bg, children, ...p }: P & { bg: string; children: ReactNode }) {
  return (
    <svg viewBox="0 0 48 48" fill="none" {...p}>
      <circle cx="24" cy="24" r="22" fill={bg} stroke={D} strokeWidth="1.800" />
      <g
        transform="translate(7.200 7.200) scale(0.7)"
        stroke={D}
        strokeWidth="1.800"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {children}
      </g>
    </svg>
  );
}

const Rain = ({ xs, y = 34 }: { xs: number[]; y?: number }) => (
  <g>
    {xs.map((x, i) => (
      <path key={x} d={`M${x} ${y + (i % 2) * 5}l-2.500 6`} stroke={WATER} strokeWidth="2.600" />
    ))}
  </g>
);
const Lightning = ({ x, y }: { x: number; y: number }) => (
  <path transform={`translate(${x} ${y})`} d="M4 0 -4 12h6l-3 10 10-14H3Z" fill={GOLD} />
);
const Ground = ({ y, fill = SOIL }: { y: number; fill?: string }) => (
  <path d={`M2 ${y}h44v${46 - y}H2Z`} fill={fill} />
);

const DEFS: Record<string, [string, ReactNode]> = {
  'sticker-hot-sun': ['#fff4cc', <Sun key="a" x={24} y={24} r={10} />],
  'sticker-dry-spell': [
    '#ffe7d2',
    <g key="a">
      <Sun x={34} y={13} r={6} />
      <Ground y={28} fill="#e6c98f" />
      <Cracks x={4} y={28} />
    </g>,
  ],
  'sticker-heavy-rain': [
    '#dcecf7',
    <g key="a">
      <Cloud x={24} y={16} s={1.8} fill="#9db2c2" />
      <Rain xs={[10, 18, 26, 34, 42]} y={30} />
    </g>,
  ],
  'sticker-frost': ['#e8f6fb', <Snowflake key="a" x={24} y={24} s={1.7} />],
  'sticker-wind': ['#eaf6f1', <WindLines key="a" x={3} y={5} s={1.1} />],
  'sticker-mild-days': [
    '#e4f8ec',
    <g key="a">
      <Sun x={32} y={14} r={6} />
      <Cloud x={20} y={26} s={1.5} />
      <Drop x={14} y={40} s={0.7} />
      <Drop x={26} y={42} s={0.6} />
    </g>,
  ],
  'sticker-heat-wave': [
    '#ffe7d2',
    <g key="a">
      <Sun x={24} y={14} r={7} />
      <path
        d="M6 30q4-5 8 0t8 0 8 0 8 0M6 40q4-5 8 0t8 0 8 0 8 0"
        fill="none"
        stroke={PEACH}
        strokeWidth="3"
      />
    </g>,
  ],
  'sticker-cloudy-days': [
    '#eef5f8',
    <g key="a">
      <Cloud x={18} y={20} s={1.6} fill="#cfdde6" />
      <Cloud x={30} y={32} s={1.6} />
    </g>,
  ],
  'sticker-flash-rain': [
    '#dcecf7',
    <g key="a">
      <Cloud x={24} y={14} s={1.8} fill="#8fa5b7" />
      <Lightning x={24} y={24} />
      <Rain xs={[8, 40]} y={30} />
    </g>,
  ],
  'sticker-wash-away': [
    '#f3e6d6',
    <g key="a">
      <path d="M4 24h24l-4 8 5 4-3 6H4Z" fill={SOIL} />
      <path d="M26 28c6 2 10 6 16 6M28 38c5 1 9 3 14 3" stroke={WATER} strokeWidth="3.500" />
      <Drop x={12} y={13} s={0.8} />
    </g>,
  ],
  'sticker-damp-days': [
    '#e3eefb',
    <g key="a">
      <Cloud x={24} y={18} s={1.7} fill="#cfdde6" />
      <Drop x={14} y={38} s={0.8} />
      <Drop x={26} y={42} s={0.8} />
      <Drop x={36} y={36} s={0.8} />
    </g>,
  ],
  'sticker-cool-nights': [
    '#e3e8fb',
    <g key="a">
      <Moon x={22} y={26} r={13} />
      <Star x={38} y={12} s={1.3} />
      <Star x={36} y={34} s={1} />
    </g>,
  ],
  'sticker-soggy-soil': [
    '#e8dcc6',
    <g key="a">
      <Ground y={26} fill={DARK} />
      <path d="M6 32q6-4 12 0t12 0 12 0" stroke={WATER} strokeWidth="4" />
      <Drop x={16} y={12} s={0.9} />
      <Drop x={32} y={14} s={0.9} />
    </g>,
  ],
  'sticker-hail': [
    '#e8eff5',
    <g key="a">
      <Cloud x={24} y={16} s={1.8} fill="#8ea2b2" />
      {[10, 20, 30, 40, 16, 34].map((x, i) => (
        <circle key={x} cx={x} cy={32 + (i % 3) * 6} r="3" fill="#fff" />
      ))}
    </g>,
  ],
  'sticker-low-water': [
    '#e3eefb',
    <g key="a">
      <path
        d="M24 6c5 8 11 13 11 20a11 11 0 0 1-22 0c0-7 6-12 11-20Z"
        fill="none"
        strokeDasharray="4 3"
      />
      <path d="M16 30h16" strokeWidth="3.500" stroke={PEACH} />
    </g>,
  ],
  'sticker-water-balance': [
    '#e4f8ec',
    <g key="a">
      <path d="M24 8v28M14 38h20M5 14h38" />
      <path d="M10 14 5 26M10 14l5 12M38 14l-5 12M38 14l5 12" strokeWidth="1.600" />
      <path d="M3 26h14a7 7 0 0 1-14 0ZM31 26h14a7 7 0 0 1-14 0Z" fill="#eaf6f1" />
    </g>,
  ],
  'sticker-welcome-rain': [
    '#e4f8ec',
    <g key="a">
      <Cloud x={22} y={12} s={1.5} />
      <Rain xs={[12, 22, 32]} y={22} />
      <Plant x={24} y={44} s={1.3} />
    </g>,
  ],
  'sticker-strong-wind': [
    '#eaf6f1',
    <g key="a">
      <WindLines x={2} y={2} s={0.9} />
      <Plant x={30} y={44} s={1.7} lean={34} />
    </g>,
  ],
  'sticker-cool-autumn': [
    '#ffe7d2',
    <g key="a">
      <Leaf x={22} y={34} r={-25} s={1.6} fill={PEACH} />
      <Leaf x={36} y={22} r={40} s={0.9} fill="#e8b84a" />
      <path d="M22 34 16 18" strokeWidth="1.500" />
    </g>,
  ],
  'sticker-warm-winter': [
    '#fff4cc',
    <g key="a">
      <Sun x={14} y={14} r={6} />
      <Snowflake x={31} y={31} s={1.2} />
    </g>,
  ],
  'sticker-cold-snap': [
    '#e8f6fb',
    <g key="a">
      <Snowflake x={20} y={22} s={1.3} />
      <Arrow x={38} y={26} dir="down" color={WATER} len={22} />
    </g>,
  ],
  'sticker-sun-after-rain': [
    '#fff4cc',
    <g key="a">
      <path d="M4 40a20 20 0 0 1 40 0" fill="none" stroke="#f7a8c4" strokeWidth="3.500" />
      <path d="M10 40a14 14 0 0 1 28 0" fill="none" stroke="#ffd166" strokeWidth="3.500" />
      <path d="M16 40a8 8 0 0 1 16 0" fill="none" stroke="#79d39a" strokeWidth="3.500" />
      <Sun x={38} y={10} r={5} />
    </g>,
  ],
  'sticker-dust-wind': [
    '#f3e6d6',
    <g key="a">
      <WindLines x={3} y={5} s={1.1} color="#c9a24a" />
      <circle cx="38" cy="14" r="2" fill={SOIL} />
      <circle cx="42" cy="22" r="1.600" fill={SOIL} />
      <circle cx="14" cy="42" r="1.800" fill={SOIL} />
    </g>,
  ],
  'sticker-rainy-harvest': [
    '#e3eefb',
    <g key="a">
      <path d="M24 44V16" />
      {[18, 25, 32].map((y) => (
        <g key={y}>
          <ellipse cx="19" cy={y} rx="3" ry="5" fill="#e8c35a" transform={`rotate(-28 19 ${y})`} />
          <ellipse cx="29" cy={y} rx="3" ry="5" fill="#e8c35a" transform={`rotate(28 29 ${y})`} />
        </g>
      ))}
      <Rain xs={[6, 40, 44]} y={8} />
    </g>,
  ],
  'sticker-covered-soil': [
    '#e4f8ec',
    <g key="a">
      <Ground y={30} />
      <path d="M6 34l12-3M14 40l16-3M28 35l14-3" stroke="#e2b955" strokeWidth="3.200" />
      <Plant x={24} y={30} s={1.2} />
      <Drop x={10} y={12} s={0.8} />
      <Drop x={38} y={10} s={0.8} />
    </g>,
  ],
  'sticker-dry-winter': [
    '#eef5f8',
    <g key="a">
      <Snowflake x={24} y={14} s={1} />
      <Ground y={28} fill="#e6c98f" />
      <Cracks x={4} y={28} />
    </g>,
  ],
  'sticker-foggy-days': [
    '#eef2f2',
    <g key="a">
      <Cloud x={24} y={14} s={1.5} fill="#dfe6e6" />
      <rect x="6" y="26" width="36" height="6" rx="3" fill="#fff" />
      <rect x="12" y="35" width="30" height="6" rx="3" fill="#fff" />
      <rect x="4" y="44" width="26" height="4" rx="2" fill="#fff" />
    </g>,
  ],
  'sticker-sunny-growth': [
    '#fff4cc',
    <g key="a">
      <Sun x={14} y={14} r={6} />
      <Ground y={40} />
      <Plant x={30} y={40} s={1.7} />
    </g>,
  ],
  'sticker-humid-nights': [
    '#e3e8fb',
    <g key="a">
      <Moon x={20} y={20} r={11} />
      <Drop x={30} y={40} s={0.9} />
      <Drop x={18} y={42} s={0.7} />
      <Drop x={40} y={30} s={0.7} />
      <Star x={38} y={12} s={1.1} />
    </g>,
  ],
  'sticker-cold-spell': [
    '#e8f6fb',
    <g key="a">
      <rect x="19" y="6" width="10" height="26" rx="5" fill="#fff" />
      <circle cx="24" cy="36" r="7" fill={ICE} />
      <path d="M24 22v14" stroke={WATER} strokeWidth="3.500" />
      <Snowflake x={38} y={14} s={0.8} />
    </g>,
  ],
};

export const STICKER_ICONS: Record<
  string,
  ComponentType<{ className?: string }>
> = Object.fromEntries(
  Object.entries(DEFS).map(([key, [bg, glyph]]) => {
    const Sticker = ({ className }: { className?: string }) => (
      <StickerSvg bg={bg} className={className}>
        {glyph}
      </StickerSvg>
    );
    Sticker.displayName = key;
    return [key, Sticker];
  }),
);

export { Bug, G1, G2 };

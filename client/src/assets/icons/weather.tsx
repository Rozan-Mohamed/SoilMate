// Weather drawing bits shared by the Game 5 result icons and the weather stickers (48x48 boxes).
import { D, G1, G2, SOIL, DARK, WATER, GOLD, PEACH, Cloud, Drop, Sun } from './fixes';

export const ICE = '#9fd3ea';

export const Snowflake = ({
  x,
  y,
  s = 1,
  color = ICE,
}: {
  x: number;
  y: number;
  s?: number;
  color?: string;
}) => (
  <g
    transform={`translate(${x} ${y}) scale(${s})`}
    stroke={color === ICE ? D : color}
    strokeWidth="1.800"
  >
    <path d="M0-11v22M-9.500-5.500l19 11M-9.500 5.500l19-11" stroke={color} strokeWidth="3" />
    <path d="M-3-9 0-6 3-9M-3 9 0 6 3 9" stroke={color} strokeWidth="2" />
    <circle r="2.500" fill="#fff" />
  </g>
);

export const WindLines = ({
  x = 0,
  y = 0,
  s = 1,
  color = '#7cc6ee',
}: {
  x?: number;
  y?: number;
  s?: number;
  color?: string;
}) => (
  <g
    transform={`translate(${x} ${y}) scale(${s})`}
    fill="none"
    stroke={color}
    strokeWidth="2.800"
    strokeLinecap="round"
  >
    <path d="M4 12h26c6 0 6-7 0-7" />
    <path d="M8 22h32c6 0 6 7 0 7" />
    <path d="M4 32h18c5 0 5-6 0-6" />
  </g>
);

export const Moon = ({ x, y, r = 9 }: { x: number; y: number; r?: number }) => (
  <path
    transform={`translate(${x} ${y})`}
    d={`M${r * 0.4} ${-r}A${r} ${r} 0 1 0 ${r} ${r * 0.5}A${r * 0.8} ${r * 0.8} 0 0 1 ${r * 0.4} ${-r}Z`}
    fill="#ffe08a"
  />
);

export const Star = ({ x, y, s = 1 }: { x: number; y: number; s?: number }) => (
  <path
    transform={`translate(${x} ${y}) scale(${s})`}
    d="M0-4 1.200-1.200 4 0 1.200 1.200 0 4-1.200 1.200-4 0-1.200-1.200Z"
    fill={GOLD}
    stroke="none"
  />
);

export const Bug = ({ x, y, s = 1 }: { x: number; y: number; s?: number }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <ellipse cx="0" cy="3" rx="7" ry="9" fill="#c2693a" />
    <circle cx="0" cy="-8" r="4.500" fill="#8a4a24" />
    <path d="M-7 0l-6-3M-7 6h-7M7 0l6-3M7 6h7M-2-12l-3-4M2-12l3-4" />
  </g>
);

export const Plant = ({
  x,
  y,
  s = 1,
  lean = 0,
  color = G1,
  wilt = false,
}: {
  x: number;
  y: number;
  s?: number;
  lean?: number;
  color?: string;
  wilt?: boolean;
}) => (
  <g transform={`translate(${x} ${y}) scale(${s}) rotate(${lean})`}>
    {wilt ? (
      <>
        <path d="M0 0V-9q0-7 7-9" />
        <path d="M7-18q7 0 8 8" fill="#d9c070" stroke="#8f7a3a" />
        <path d="M0-9q-7-1-9 6" fill="#d9c070" stroke="#8f7a3a" />
      </>
    ) : (
      <>
        <path d="M0 0V-14" />
        <path d="M0-9C-9-9-12-15-12-20-5-20 0-15 0-9Z" fill={color} />
        <path d="M0-14c8 0 11-6 11-11-7 0-11 5-11 11Z" fill={G2} />
      </>
    )}
  </g>
);

export const Arrow = ({
  x,
  y,
  dir = 'up',
  len = 12,
  color = D,
}: {
  x: number;
  y: number;
  dir?: 'up' | 'down' | 'left' | 'right';
  len?: number;
  color?: string;
}) => {
  const rot = { up: 0, right: 90, down: 180, left: 270 }[dir];
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot})`} stroke={color} strokeWidth="2.600">
      <path d={`M0 ${len / 2}V${-len / 2}M-4 ${-len / 2 + 4}l4-4 4 4`} />
    </g>
  );
};

export const Cracks = ({
  x = 0,
  y = 0,
  color = DARK,
}: {
  x?: number;
  y?: number;
  color?: string;
}) => (
  <g transform={`translate(${x} ${y})`} stroke={color} strokeWidth="1.800" fill="none">
    <path d="M6 0 11 8 7 14 14 22" />
    <path d="M24 2 20 10 27 16 22 24" />
    <path d="M36 0l4 8-3 6" />
  </g>
);

export const Leaf = ({
  x,
  y,
  r = 0,
  s = 1,
  fill = G1,
}: {
  x: number;
  y: number;
  r?: number;
  s?: number;
  fill?: string;
}) => (
  <path
    transform={`translate(${x} ${y}) rotate(${r}) scale(${s})`}
    d="M0 0C8-3 8-15 0-20-8-15-8-3 0 0Z"
    fill={fill}
  />
);

export { D, G1, G2, SOIL, DARK, WATER, GOLD, PEACH, Cloud, Drop, Sun };

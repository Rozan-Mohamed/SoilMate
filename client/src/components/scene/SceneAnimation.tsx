'use client';

import type { ReactNode } from 'react';
import { motion, useReducedMotion } from 'framer-motion';

// Game 5: the short animation that plays on top of the scene after a correct answer.
// resultAnimationKey from the API picks one of these. Purely decorative (aria-hidden).
// With reduced motion only a still colour wash is shown.

const W = 320;
const H = 150;
const xs = (n: number, from = 36, to = 284) =>
  Array.from({ length: n }, (_, i) => from + ((to - from) / Math.max(1, n - 1)) * i);

function Overlay({ children }: { children: ReactNode }) {
  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="xMidYMid slice"
      className="pointer-events-none absolute inset-0 size-full"
      aria-hidden="true"
      focusable="false"
    >
      {children}
    </svg>
  );
}

const Tint = ({ color, opacity, y = 0 }: { color: string; opacity: number; y?: number }) => (
  <motion.rect
    x="0"
    y={y}
    width={W}
    height={H - y}
    fill={color}
    initial={{ opacity: 0 }}
    animate={{ opacity }}
    transition={{ duration: 1.2 }}
  />
);

const Drops = ({
  color,
  from,
  to,
  count = 6,
  delay = 0,
  r = 3,
}: {
  color: string;
  from: number;
  to: number;
  count?: number;
  delay?: number;
  r?: number;
}) => (
  <>
    {xs(count).map((x, i) => (
      <motion.circle
        key={x}
        cx={x + (i % 2) * 8}
        r={r}
        fill={color}
        initial={{ cy: from, opacity: 0 }}
        animate={{ cy: to, opacity: [0, 1, 0] }}
        transition={{ duration: 1.8, repeat: Infinity, delay: delay + i * 0.28, ease: 'easeIn' }}
      />
    ))}
  </>
);

type Preset = { tint: [string, number, number?]; render: () => ReactNode };

const PRESETS: Record<string, Preset> = {
  // plants droop, water drops rise
  'heat-wilt': {
    tint: ['#ff9a3c', 0.16],
    render: () => <Drops color="#7cc6ee" from={112} to={40} count={7} />,
  },
  // soil lightens and cracks, a small cloud drifts away
  'dry-soil': {
    tint: ['#ffffff', 0.26, 92],
    render: () => (
      <>
        <g stroke="#8f6b3a" strokeWidth="2.500" fill="none" strokeLinecap="round">
          {[
            'M70 100 82 114 72 126 90 140',
            'M170 96 160 112 176 122 166 140',
            'M250 100 262 116 252 130',
          ].map((d, i) => (
            <motion.path
              key={d}
              d={d}
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 1, delay: i * 0.4 }}
            />
          ))}
        </g>
        <motion.g
          initial={{ x: 90, opacity: 1 }}
          animate={{ x: 340, opacity: [1, 1, 0] }}
          transition={{ duration: 3.6, repeat: Infinity }}
          fill="#fff"
        >
          <ellipse cx="0" cy="40" rx="20" ry="9" />
          <ellipse cx="-9" cy="35" rx="10" ry="8" />
          <ellipse cx="6" cy="33" rx="12" ry="10" />
        </motion.g>
      </>
    ),
  },
  // rain on bare soil, soil streams downhill
  'wash-away': {
    tint: ['#7f9fb5', 0.12],
    render: () => (
      <>
        {[0, 1, 2, 3].map((i) => (
          <motion.path
            key={i}
            d={`M-20 ${96 + i * 14} Q80 ${104 + i * 14} 160 ${114 + i * 12} T340 ${134 + i * 8}`}
            stroke="#a9744a"
            strokeWidth="5"
            strokeLinecap="round"
            strokeDasharray="16 14"
            fill="none"
            opacity="0.75"
            animate={{ strokeDashoffset: [0, -60] }}
            transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
          />
        ))}
        <Drops color="#5fa8d6" from={20} to={90} count={9} r={2.2} />
      </>
    ),
  },
  // frost spreads on young plants
  'frost-damage': {
    tint: ['#dff3fb', 0.18],
    render: () => (
      <>
        <motion.circle
          cx="160"
          cy="112"
          fill="#eaf8ff"
          initial={{ r: 6, opacity: 0.7 }}
          animate={{ r: 210, opacity: 0.45 }}
          transition={{ duration: 2.4, ease: 'easeOut' }}
        />
        {xs(6, 30, 290).map((x, i) => (
          <motion.path
            key={x}
            d="M0-6v12M-5-3l10 6M-5 3l10-6"
            stroke="#fff"
            strokeWidth="2"
            strokeLinecap="round"
            transform={`translate(${x} ${60 + (i % 3) * 22})`}
            animate={{ opacity: [0.2, 1, 0.2] }}
            transition={{ duration: 1.8, repeat: Infinity, delay: i * 0.3 }}
          />
        ))}
      </>
    ),
  },
  // arrows rise from bare soil
  evaporate: {
    tint: ['#ffe9b0', 0.14],
    render: () => (
      <>
        {xs(5, 50, 270).map((x, i) => (
          <motion.path
            key={x}
            d="M-7 6 0 0 7 6M0 0V20"
            stroke="#fff"
            strokeWidth="3.500"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ x, y: 112, opacity: 0 }}
            animate={{ y: 40, opacity: [0, 1, 0] }}
            transition={{ duration: 2, repeat: Infinity, delay: i * 0.35 }}
          />
        ))}
      </>
    ),
  },
  // plants grow greener under mild sun and rain
  'healthy-growth': {
    tint: ['#79d39a', 0.12],
    render: () => (
      <>
        {xs(5, 50, 270).map((x, i) => (
          <motion.g
            key={x}
            style={{ transformOrigin: `${x}px ${104}px` }}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 160, damping: 12, delay: 0.2 + i * 0.18 }}
          >
            <path d={`M${x} 104V82`} stroke="#2f8f5b" strokeWidth="3" strokeLinecap="round" />
            <ellipse
              cx={x - 8}
              cy="84"
              rx="9"
              ry="5"
              fill="#43b574"
              transform={`rotate(-25 ${x - 8} 84)`}
            />
            <ellipse
              cx={x + 8}
              cy="78"
              rx="9"
              ry="5"
              fill="#5cc48f"
              transform={`rotate(25 ${x + 8} 78)`}
            />
          </motion.g>
        ))}
        {xs(4, 70, 250).map((x, i) => (
          <motion.path
            key={x}
            d="M0-5 1.500-1.500 5 0 1.500 1.500 0 5-1.500 1.500-5 0-1.500-1.500Z"
            fill="#f5b50a"
            transform={`translate(${x} ${50 + (i % 2) * 20})`}
            animate={{ scale: [0.4, 1.2, 0.4], opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 1.6, repeat: Infinity, delay: i * 0.4 }}
          />
        ))}
      </>
    ),
  },
  // soil moisture comes back
  recover: {
    tint: ['#5bb6e8', 0.12, 94],
    render: () => <Drops color="#5bb6e8" from={34} to={108} count={7} />,
  },
  // growth is slow: a clock ticks quietly
  'slow-growth': {
    tint: ['#9db2c2', 0.14],
    render: () => (
      <g transform="translate(262 40)">
        <circle r="17" fill="#fff" stroke="#184030" strokeWidth="2.500" />
        <motion.path
          d="M0 0V-11"
          stroke="#184030"
          strokeWidth="3"
          strokeLinecap="round"
          animate={{ rotate: 360 }}
          transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
        />
        <circle r="2.500" fill="#184030" />
      </g>
    ),
  },
  // spots appear and spread
  'disease-spread': {
    tint: ['#c9b060', 0.1],
    render: () => (
      <>
        {xs(9, 38, 282).map((x, i) => (
          <motion.circle
            key={x}
            cx={x + ((i * 7) % 12)}
            cy={96 + ((i * 11) % 22)}
            fill="#8a5a2c"
            opacity="0.85"
            initial={{ r: 0 }}
            animate={{ r: 5 + (i % 3) }}
            transition={{ delay: 0.3 + i * 0.28, duration: 0.5 }}
          />
        ))}
      </>
    ),
  },
  // water rises over the low spots
  flood: {
    tint: ['#5fa8d6', 0.1],
    render: () => (
      <motion.g
        initial={{ y: 70 }}
        animate={{ y: 0 }}
        transition={{ duration: 2.4, ease: 'easeOut' }}
      >
        <path
          d="M0 104q20-9 40 0t40 0 40 0 40 0 40 0 40 0 40 0 40 0V170H0Z"
          fill="#5bb6e8"
          opacity="0.6"
        />
        <path
          d="M0 104q20-9 40 0t40 0 40 0 40 0 40 0 40 0 40 0 40 0"
          stroke="#fff"
          strokeWidth="2.500"
          fill="none"
          opacity="0.8"
        />
      </motion.g>
    ),
  },
  // grain or fruit goes bad
  spoil: {
    tint: ['#8a7a5a', 0.2],
    render: () => (
      <>
        {xs(8, 40, 280).map((x, i) => (
          <motion.circle
            key={x}
            cx={x + ((i * 5) % 10)}
            cy={92 + ((i * 9) % 26)}
            fill="#6b4a24"
            initial={{ r: 0 }}
            animate={{ r: 5 }}
            transition={{ delay: 0.3 + i * 0.25, duration: 0.5 }}
          />
        ))}
        <Drops color="#7cc6ee" from={40} to={100} count={5} r={2.5} />
      </>
    ),
  },
  // strong wind tears leaves and bends plants
  'wind-damage': {
    tint: ['#cfe3ee', 0.1],
    render: () => (
      <>
        {[50, 78, 106].map((y, i) => (
          <motion.path
            key={y}
            d="M0 0h70"
            stroke="#fff"
            strokeWidth="4"
            strokeLinecap="round"
            opacity="0.85"
            initial={{ x: -90, y }}
            animate={{ x: 340 }}
            transition={{ duration: 1.4, repeat: Infinity, delay: i * 0.35, ease: 'easeIn' }}
          />
        ))}
        {[0, 1, 2, 3].map((i) => (
          <motion.ellipse
            key={i}
            rx="5"
            ry="2.800"
            fill="#43b574"
            initial={{ x: -20, y: 70 + i * 14 }}
            animate={{ x: 340, y: 60 + i * 22, rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, delay: i * 0.4, ease: 'easeIn' }}
          />
        ))}
      </>
    ),
  },
};

const FALLBACK: Preset = { tint: ['#79d39a', 0.12], render: () => null };

export function SceneAnimation({ presetKey }: { presetKey: string }) {
  const reduce = useReducedMotion();
  const preset = PRESETS[presetKey] ?? FALLBACK;
  const [color, opacity, y] = preset.tint;

  if (reduce) {
    return (
      <Overlay>
        <rect x="0" y={y ?? 0} width={W} height={H} fill={color} opacity={opacity} />
      </Overlay>
    );
  }
  return (
    <Overlay>
      <Tint color={color} opacity={opacity} y={y} />
      {preset.render()}
    </Overlay>
  );
}

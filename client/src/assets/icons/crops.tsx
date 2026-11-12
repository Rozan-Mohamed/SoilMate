// Game 3 crop icons (48x48). Built from a few templates (ear, pod, flower, tuft, ...) so all 30
// share one flat style and need no outside artwork or licence.
import { createContext, useContext, type ComponentType, type ReactNode } from 'react';

const D = '#184030';
const G1 = '#48b080';
const G2 = '#2f8f5b';
const GOLD = '#e8b84a';
const SOIL = '#c58b5b';

// The size class given to the icon reaches the <svg> through this context, so every template stays simple.
const ClassContext = createContext<string | undefined>(undefined);

function Svg({ children }: { children: ReactNode }) {
  const className = useContext(ClassContext);
  return (
    <svg viewBox="0 0 48 48" fill="none" className={className}>
      <g stroke={D} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        {children}
      </g>
    </svg>
  );
}

const leafPath = (len: number, w: number) =>
  `M0 0C${w} ${-len * 0.3} ${w} ${-len * 0.7} 0 ${-len}C${-w} ${-len * 0.7} ${-w} ${-len * 0.3} 0 0Z`;

function Leaf({
  x,
  y,
  r = 0,
  len = 14,
  w = 6,
  fill = G1,
}: {
  x: number;
  y: number;
  r?: number;
  len?: number;
  w?: number;
  fill?: string;
}) {
  return <path transform={`translate(${x} ${y}) rotate(${r})`} d={leafPath(len, w)} fill={fill} />;
}

const Ground = ({ y = 41, color = SOIL }: { y?: number; color?: string }) => (
  <path d={`M4 ${y}h40v${48 - y - 3}a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3Z`} fill={color} />
);

// ------------------------------------------------------------------- templates
function Ear({
  fill = GOLD,
  awns = false,
  lean = 0,
  grains = 5,
}: {
  fill?: string;
  awns?: boolean;
  lean?: number;
  grains?: number;
}) {
  return (
    <Svg>
      <g transform={`rotate(${lean} 24 44)`}>
        <path d="M24 44V14" />
        {Array.from({ length: grains }, (_, i) => {
          const y = 16 + i * 5.2;
          return (
            <g key={i}>
              <ellipse
                cx="19.500"
                cy={y}
                rx="3"
                ry="5"
                fill={fill}
                transform={`rotate(-28 19.500 ${y})`}
              />
              <ellipse
                cx="28.500"
                cy={y}
                rx="3"
                ry="5"
                fill={fill}
                transform={`rotate(28 28.500 ${y})`}
              />
              {awns && <path d={`M17 ${y - 3}l-5-8M31 ${y - 3}l5-8`} strokeWidth="1.2" />}
            </g>
          );
        })}
        <ellipse cx="24" cy="9" rx="3" ry="5.500" fill={fill} />
        {awns && <path d="M24 5V-1" strokeWidth="1.2" />}
      </g>
      <Leaf x={24} y={44} r={-55} len={14} w={3.5} />
    </Svg>
  );
}

function Pod({
  pod = G1,
  seed = '#d9f0a8',
  seeds = 4,
  bend = 1,
}: {
  pod?: string;
  seed?: string;
  seeds?: number;
  bend?: number;
}) {
  return (
    <Svg>
      <path
        d="M8 37C10 18 26 8 41 9c-1 17-12 31-31 31Z"
        fill={pod}
        transform={bend < 0 ? 'scale(-1 1) translate(-48 0)' : undefined}
      />
      {Array.from({ length: seeds }, (_, i) => {
        const x = 15 + i * (14 / Math.max(1, seeds - 1)) * 1.6;
        const y = 32 - i * (16 / Math.max(1, seeds - 1)) * 1.1;
        return <circle key={i} cx={bend < 0 ? 48 - x : x} cy={y} r="3.600" fill={seed} />;
      })}
      <path d="M9 38 5 43" />
    </Svg>
  );
}

function Flower({
  petal,
  center,
  count = 10,
  r = 10,
  stem = true,
}: {
  petal: string;
  center: string;
  count?: number;
  r?: number;
  stem?: boolean;
}) {
  return (
    <Svg>
      {stem && <path d="M24 28v16" />}
      {stem && <Leaf x={24} y={40} r={50} len={11} w={4} />}
      {Array.from({ length: count }, (_, i) => (
        <ellipse
          key={i}
          cx="24"
          cy={18 - r * 0.45}
          rx="3.200"
          ry={r * 0.55}
          fill={petal}
          transform={`rotate(${(360 / count) * i} 24 18)`}
        />
      ))}
      <circle cx="24" cy="18" r="6" fill={center} />
    </Svg>
  );
}

function Tuft({
  blades = 5,
  h = 28,
  color = G1,
  strip = false,
}: {
  blades?: number;
  h?: number;
  color?: string;
  strip?: boolean;
}) {
  return (
    <Svg>
      {strip && <Ground y={38} color="#79d39a" />}
      {Array.from({ length: blades }, (_, i) => {
        const t = i / (blades - 1) - 0.5;
        return (
          <path
            key={i}
            d={`M${24 + t * 10} 40Q${24 + t * 22} ${40 - h * 0.6} ${24 + t * 30} ${40 - h}Q${24 + t * 14} ${40 - h * 0.5} ${24 + t * 10 + 3} 40Z`}
            fill={color}
          />
        );
      })}
    </Svg>
  );
}

// --------------------------------------------------------------------- the 30
const CROPS: Record<string, () => ReactNode> = {
  'crop-beans': () => <Pod pod="#5cc48f" seed="#e6f6b8" seeds={4} />,
  'crop-peas': () => <Pod pod="#7ed56f" seed="#d8f7a8" seeds={5} bend={-1} />,
  'crop-lentils': () => <Pod pod="#e0a15a" seed="#f6d089" seeds={2} />,
  'crop-clover': () => (
    <Svg>
      <path d="M24 44V28" />
      {[
        [-10, 0],
        [10, 0],
        [0, -9],
      ].map(([dx, dy]) => (
        <circle key={`${dx}${dy}`} cx={24 + dx} cy={22 + dy} r="8" fill="#5cc48f" />
      ))}
      <path d="M18 24l6-5 6 5M24 14v9" stroke="#e6f6b8" strokeWidth="1.600" />
    </Svg>
  ),
  'crop-alfalfa': () => (
    <Svg>
      <path d="M24 44V14" />
      {[34, 26, 18].map((y) => (
        <g key={y}>
          <Leaf x={24} y={y} r={-60} len={10} w={3.5} />
          <Leaf x={24} y={y} r={60} len={10} w={3.5} />
        </g>
      ))}
      <circle cx="24" cy="9" r="4.500" fill="#a98ad8" />
      <circle cx="19" cy="12" r="3" fill="#c0a6e6" />
      <circle cx="29" cy="12" r="3" fill="#c0a6e6" />
    </Svg>
  ),
  'crop-green-manure': () => (
    <Svg>
      <Ground y={36} />
      <path d="M24 36V20" />
      <Leaf x={24} y={30} r={-50} len={14} w={5} />
      <Leaf x={24} y={30} r={50} len={14} w={5} />
      <Leaf x={24} y={22} r={-20} len={12} w={4.5} fill="#5cc48f" />
      <path d="M12 41h24" stroke="#79d39a" strokeWidth="3" />
    </Svg>
  ),
  'crop-wheat': () => <Ear fill={GOLD} />,
  'crop-winter-rye': () => <Ear fill="#d9c27a" awns lean={-6} />,
  'crop-barley': () => <Ear fill="#e3bd5a" awns grains={6} />,
  'crop-oat-hay': () => (
    <Svg>
      <path d="M24 44V12" />
      {[14, 20, 26].map((y, i) => (
        <g key={y}>
          <path d={`M24 ${y}q-8 0-10 ${6 + i}`} />
          <path d={`M24 ${y}q8 0 10 ${6 + i}`} />
          <ellipse cx={13} cy={y + 8 + i} rx="2.500" ry="4" fill="#e8d28a" />
          <ellipse cx={35} cy={y + 8 + i} rx="2.500" ry="4" fill="#e8d28a" />
        </g>
      ))}
    </Svg>
  ),
  'crop-millet': () => (
    <Svg>
      <path d="M24 44V20q0-12 12-10" />
      <path d="M36 10q4 6 0 14-4 6-8 4-3-8 0-14 3-6 8-4Z" fill="#e8c35a" />
      <path d="M31 14l3 10M35 12l2 9" strokeWidth="1.200" />
      <Leaf x={24} y={40} r={-50} len={14} w={4} />
    </Svg>
  ),
  'crop-sorghum': () => (
    <Svg>
      <path d="M24 44V24" />
      <ellipse cx="24" cy="15" rx="9" ry="11" fill="#b5653a" />
      {[
        [20, 11],
        [27, 12],
        [22, 18],
        [28, 19],
        [24, 14],
      ].map(([x, y]) => (
        <circle key={`${x}${y}`} cx={x} cy={y} r="2" fill="#d98a58" stroke="none" />
      ))}
      <Leaf x={24} y={40} r={-55} len={15} w={4} />
      <Leaf x={24} y={36} r={55} len={14} w={4} />
    </Svg>
  ),
  'crop-ryegrass': () => <Tuft blades={5} h={26} color="#6bcf8d" />,
  'crop-forage-grass': () => <Tuft blades={7} h={32} color={G1} />,
  'crop-grass-strips': () => <Tuft blades={5} h={22} color="#43b574" strip />,
  'crop-maize': () => (
    <Svg>
      <path d="M24 6c8 4 10 18 4 30-2 4-8 4-8 0-6-12-4-26 4-30Z" fill="#f2cc4f" />
      <path d="M20 12l8 1M19 18l10 1M19 24l10 1M20 30l8 1" stroke="#c8a030" strokeWidth="1.300" />
      <path d="M24 44C12 40 10 22 16 14c0 10 4 22 8 30Z" fill={G1} />
      <path d="M24 44c12-4 14-22 8-30 0 10-4 22-8 30Z" fill={G2} />
    </Svg>
  ),
  'crop-fodder-maize': () => (
    <Svg>
      <path d="M24 44V8" />
      <Leaf x={24} y={38} r={-60} len={18} w={5} />
      <Leaf x={24} y={30} r={60} len={18} w={5} />
      <Leaf x={24} y={22} r={-55} len={14} w={4} fill="#5cc48f" />
      <ellipse cx="30" cy="26" rx="3.500" ry="6" fill="#f2cc4f" />
      <path d="M22 8l2-3 2 3" />
    </Svg>
  ),
  'crop-sunflower': () => <Flower petal="#ffd23f" center="#8a5a2c" count={12} r={11} />,
  'crop-marigold': () => <Flower petal="#f5a34a" center="#e07a1f" count={14} r={9} />,
  'crop-chicory': () => <Flower petal="#7aa6e8" center="#f2e6a0" count={9} r={10} />,
  'crop-buckwheat': () => (
    <Svg>
      <path d="M24 44V18" />
      <Leaf x={24} y={38} r={-50} len={13} w={5} />
      {[
        [18, 14],
        [26, 11],
        [31, 17],
        [22, 19],
        [28, 22],
        [17, 22],
      ].map(([x, y]) => (
        <circle key={`${x}${y}`} cx={x} cy={y} r="3.400" fill="#fbe6ee" />
      ))}
    </Svg>
  ),
  'crop-mustard': () => (
    <Svg>
      <path d="M24 44V14M24 24l-8-7M24 30l9-8" />
      {[
        [24, 11],
        [15, 14],
        [34, 18],
        [18, 20],
      ].map(([x, y]) => (
        <g key={`${x}${y}`}>
          <circle cx={x - 3} cy={y} r="2.800" fill="#ffd23f" />
          <circle cx={x + 3} cy={y} r="2.800" fill="#ffd23f" />
          <circle cx={x} cy={y - 3} r="2.800" fill="#ffd23f" />
          <circle cx={x} cy={y + 3} r="2.800" fill="#ffd23f" />
        </g>
      ))}
    </Svg>
  ),
  'crop-sesame': () => (
    <Svg>
      <path d="M24 44V12" />
      {[34, 26, 18].map((y, i) => (
        <g key={y}>
          <ellipse
            cx={i % 2 ? 31 : 17}
            cy={y}
            rx="3.500"
            ry="5"
            fill="#d9c27a"
            transform={`rotate(${i % 2 ? 20 : -20} ${i % 2 ? 31 : 17} ${y})`}
          />
        </g>
      ))}
      <Leaf x={24} y={42} r={-55} len={13} w={4} />
      <circle cx="24" cy="9" r="3.500" fill="#fff" />
    </Svg>
  ),
  'crop-tillage-radish': () => (
    <Svg>
      <Ground y={22} />
      <path d="M14 23c0 10 6 21 10 22 4-1 10-12 10-22Z" fill="#fbf5ea" />
      <Leaf x={24} y={22} r={-30} len={16} w={5} />
      <Leaf x={24} y={22} r={0} len={18} w={5} fill="#5cc48f" />
      <Leaf x={24} y={22} r={30} len={16} w={5} />
    </Svg>
  ),
  'crop-roots-left-in-the-ground': () => (
    <Svg>
      <Ground y={22} />
      <path d="M24 22V10" />
      <Leaf x={24} y={14} r={-45} len={10} w={4} />
      <Leaf x={24} y={14} r={45} len={10} w={4} />
      <path
        d="M24 22v20M24 28l-9 8M24 28l9 8M24 34l-5 8M24 34l6 8"
        stroke="#f0d9a8"
        strokeWidth="2"
      />
    </Svg>
  ),
  'crop-straw-mulch': () => (
    <Svg>
      <Ground y={36} />
      {[
        [8, 34, 30, 28],
        [12, 38, 36, 30],
        [10, 30, 34, 34],
        [14, 28, 40, 26],
        [6, 36, 28, 36],
      ].map(([x1, y1, x2, y2]) => (
        <path key={`${x1}${y1}`} d={`M${x1} ${y1}L${x2} ${y2}`} stroke="#e2b955" strokeWidth="3" />
      ))}
      <path
        d="M8 34L30 28M12 38L36 30M10 30L34 34M14 28L40 26M6 36L28 36"
        stroke={D}
        strokeWidth="0.8"
        opacity="0.4"
      />
    </Svg>
  ),
  'crop-crop-leftovers': () => (
    <Svg>
      <Ground y={36} />
      {[10, 18, 26, 34].map((x, i) => (
        <path key={x} d={`M${x} 36V${24 + (i % 2) * 4}`} stroke="#b99a4a" strokeWidth="3" />
      ))}
      <path d="M38 34q4-6 0-10-6 2-4 8Z" fill="#c9a24a" />
    </Svg>
  ),
  'crop-herbs': () => (
    <Svg>
      <path d="M24 44V20M24 32l-9-8M24 28l9-8" />
      {[
        [24, 14, 0],
        [14, 22, -40],
        [34, 18, 40],
        [18, 30, -30],
        [30, 30, 30],
      ].map(([x, y, r]) => (
        <ellipse
          key={`${x}${y}`}
          cx={x}
          cy={y}
          rx="5"
          ry="7"
          fill="#6bcf8d"
          transform={`rotate(${r} ${x} ${y})`}
        />
      ))}
    </Svg>
  ),
  'crop-garlic': () => (
    <Svg>
      <path d="M24 6c1 6 1 8-1 10" />
      <path d="M24 12c8 6 14 12 14 20 0 6-6 10-14 10S10 38 10 32c0-8 6-14 14-20Z" fill="#faf6ee" />
      <path d="M24 14v28M17 20q-4 10 0 20M31 20q4 10 0 20" strokeWidth="1.200" />
      <path d="M20 44l-2 3M24 44v3M28 44l2 3" strokeWidth="1.400" />
    </Svg>
  ),
  'crop-peppers': () => (
    <Svg>
      <path d="M24 8c0-3 3-4 5-3" />
      <path d="M14 14c4-3 14-3 18 0 4 6 2 22-6 28-2 1-3 1-4-2 0-6-10-12-8-26Z" fill="#f5a34a" />
      <path d="M20 16c-1 8 1 14 4 20" strokeWidth="1.300" stroke="#e07a1f" />
    </Svg>
  ),
};

export const CROP_ICONS: Record<string, ComponentType<{ className?: string }>> = Object.fromEntries(
  Object.entries(CROPS).map(([key, render]) => {
    const CropIcon = ({ className }: { className?: string }) => (
      <ClassContext value={className}>{render()}</ClassContext>
    );
    CropIcon.displayName = key;
    return [key, CropIcon];
  }),
);

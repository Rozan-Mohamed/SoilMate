import { useId } from 'react';
import { getScene, type Overlay, type Slope, type Soil, type Sky, type SceneProps } from './scenes';
import { en } from '@/strings/en';

// One layered SVG scene: sky, ground (with slope) and overlays. Flat illustration style, never
// photo-like. Used by Games 2, 4 and 5. The scene is decoration: the question text carries the meaning.

const W = 320;
const H = 150;

const SOIL: Record<Soil, { fill: string; line: string }> = {
  bare: { fill: '#c79b6d', line: '#b1865a' },
  green: { fill: '#79d39a', line: '#5fbf84' },
  dry: { fill: '#e6c98f', line: '#d2af6f' },
  cracked: { fill: '#d9b778', line: '#8f6b3a' },
  wet: { fill: '#8c6a4e', line: '#6f523a' },
  salty: { fill: '#c9a47a', line: '#b38d63' },
  packed: { fill: '#a9937f', line: '#8d7864' },
  pale: { fill: '#e9ddba', line: '#d8caa0' },
  crusted: { fill: '#c08f63', line: '#9c7248' },
};

const SKY: Record<Sky, [string, string]> = {
  sun: ['#bfe9ff', '#f3fbff'],
  clear: ['#c9ecff', '#f3fbff'],
  cloud: ['#cfe3ee', '#eef5f8'],
  rain: ['#b5cadb', '#dde8ef'],
  storm: ['#8ea3b5', '#c6d3dd'],
  frost: ['#ddf1fa', '#f4fbfe'],
  wind: ['#d5eef7', '#f3fbff'],
  hail: ['#a9bdcc', '#d7e2ea'],
  fog: ['#e4eaea', '#f4f6f5'],
};

const SLOPE_Y: Record<Slope, [number, number, number]> = {
  none: [92, 92, 92],
  gentle: [100, 96, 84],
  steep: [112, 98, 70],
};

const groundY = (x: number, slope: Slope) => {
  const [l, m, r] = SLOPE_Y[slope];
  const t = x / W;
  return (1 - t) * (1 - t) * l + 2 * (1 - t) * t * m + t * t * r;
};

// ----------------------------------------------------------------- small drawings
function CloudShape({
  x,
  y,
  scale = 1,
  fill = '#fff',
}: {
  x: number;
  y: number;
  scale?: number;
  fill?: string;
}) {
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`} fill={fill}>
      <ellipse cx="0" cy="8" rx="22" ry="10" />
      <ellipse cx="-12" cy="3" rx="12" ry="9" />
      <ellipse cx="6" cy="-2" rx="15" ry="12" />
      <ellipse cx="20" cy="6" rx="12" ry="8" />
    </g>
  );
}

function SkyLayer({ sky }: { sky: Sky }) {
  return (
    <g>
      {sky === 'sun' && (
        <g>
          <circle cx="268" cy="30" r="26" fill="#ffd166" opacity="0.3" />
          <circle cx="268" cy="30" r="15" fill="#ffd166" />
        </g>
      )}
      {(sky === 'cloud' || sky === 'sun') && (
        <CloudShape x={70} y={30} scale={sky === 'sun' ? 0.7 : 1} />
      )}
      {sky === 'cloud' && <CloudShape x={210} y={22} scale={0.8} />}
      {sky === 'rain' && (
        <g>
          <CloudShape x={90} y={26} scale={1.2} fill="#8fa5b7" />
          <CloudShape x={220} y={20} scale={1} fill="#9db2c2" />
          <g stroke="#5fa8d6" strokeWidth="2" strokeLinecap="round">
            {Array.from({ length: 14 }, (_, i) => (
              <path key={i} d={`M${50 + i * 17} ${48 + (i % 3) * 9} l-3 9`} />
            ))}
          </g>
        </g>
      )}
      {sky === 'storm' && (
        <g>
          <CloudShape x={110} y={26} scale={1.3} fill="#5e7385" />
          <CloudShape x={230} y={22} scale={1} fill="#6d8294" />
          <path d="M150 46 130 74h14l-8 20 24-30h-14l8-18Z" fill="#ffd166" />
        </g>
      )}
      {sky === 'frost' && (
        <g fill="#fff" stroke="#9fd3ea" strokeWidth="1.5">
          {[
            [50, 24],
            [120, 40],
            [200, 20],
            [270, 44],
            [160, 14],
          ].map(([x, y]) => (
            <g key={`${x}-${y}`} transform={`translate(${x} ${y})`}>
              <path d="M0-7v14M-6-3.5l12 7M-6 3.5l12-7" strokeLinecap="round" fill="none" />
            </g>
          ))}
        </g>
      )}
      {sky === 'wind' && (
        <g fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round">
          <path d="M30 30h90c14 0 14-14 2-14" />
          <path d="M120 52h120c16 0 16-16 2-16" stroke="#c4e3ee" />
          <path d="M60 70h70c10 0 10-10 0-10" />
        </g>
      )}
      {sky === 'hail' && (
        <g>
          <CloudShape x={100} y={26} scale={1.2} fill="#7f94a5" />
          <CloudShape x={220} y={22} scale={1} fill="#8ea2b2" />
          <g fill="#fff" stroke="#9db2c2" strokeWidth="1">
            {Array.from({ length: 12 }, (_, i) => (
              <circle key={i} cx={60 + i * 19} cy={52 + (i % 4) * 10} r="3" />
            ))}
          </g>
        </g>
      )}
      {sky === 'fog' && (
        <g fill="#fff" opacity="0.7">
          <rect x="0" y="30" width="320" height="14" rx="7" />
          <rect x="30" y="54" width="260" height="14" rx="7" />
          <rect x="0" y="78" width="320" height="12" rx="6" />
        </g>
      )}
    </g>
  );
}

// ------------------------------------------------------------------------ overlays
const PLANT_XS = [38, 88, 138, 188, 238, 288];

function Plant({ x, y, wilted }: { x: number; y: number; wilted?: boolean }) {
  if (wilted) {
    return (
      <g
        transform={`translate(${x} ${y})`}
        stroke="#8f7a3a"
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
      >
        <path d="M0 0v-8q0-6 6-8" />
        <path d="M6-16q6 0 7 7" fill="#d9c070" stroke="#b9a050" />
        <path d="M0-8q-6-2-8 5" fill="#d9c070" stroke="#b9a050" />
      </g>
    );
  }
  return (
    <g transform={`translate(${x} ${y})`}>
      <path d="M0 0v-15" stroke="#2f8f5b" strokeWidth="2.5" strokeLinecap="round" />
      <ellipse cx="-6" cy="-12" rx="6" ry="3.5" fill="#43b574" transform="rotate(-25 -6 -12)" />
      <ellipse cx="6" cy="-16" rx="6" ry="3.5" fill="#56c785" transform="rotate(25 6 -16)" />
    </g>
  );
}

function OverlayLayer({ overlay, slope, soil }: { overlay: Overlay; slope: Slope; soil: Soil }) {
  const row = (x: number, dy = 16) => groundY(x, slope) + dy;
  switch (overlay) {
    case 'healthyPlants':
      return (
        <g>
          {PLANT_XS.map((x) => (
            <Plant key={x} x={x} y={row(x)} />
          ))}
        </g>
      );
    case 'wiltedPlants':
      return (
        <g>
          {PLANT_XS.map((x) => (
            <Plant key={x} x={x} y={row(x)} wilted />
          ))}
        </g>
      );
    case 'pests':
      return (
        <g>
          {PLANT_XS.map((x) => (
            <Plant key={x} x={x} y={row(x)} />
          ))}
          {[105, 160, 215].map((x) => (
            <g key={x} transform={`translate(${x} ${row(x) - 20})`}>
              <ellipse rx="5" ry="3.5" fill="#c2693a" />
              <path
                d="M-5-2l-4-3M5-2l4-3M-5 2l-4 3M5 2l4 3"
                stroke="#7a3e08"
                strokeWidth="1.2"
                strokeLinecap="round"
              />
              <circle cx="-5" cy="0" r="1.5" fill="#184030" />
            </g>
          ))}
        </g>
      );
    case 'weeds':
      return (
        <g fill="#2f8f5b">
          {PLANT_XS.map((x) => (
            <Plant key={x} x={x} y={row(x)} />
          ))}
          {[63, 113, 163, 213, 263].map((x) => (
            <path
              key={x}
              transform={`translate(${x} ${row(x, 18)})`}
              d="M-6 0 -3-12 0-3 3-14 6-3 9-10 10 0Z"
              fill="#256f48"
            />
          ))}
        </g>
      );
    case 'machine':
      return (
        <g transform={`translate(215 ${row(215, 10) - 24})`}>
          <rect
            x="0"
            y="8"
            width="48"
            height="16"
            rx="4"
            fill="#f5a34a"
            stroke="#7a3e08"
            strokeWidth="1.5"
          />
          <rect
            x="28"
            y="-4"
            width="18"
            height="16"
            rx="3"
            fill="#ffe7d2"
            stroke="#7a3e08"
            strokeWidth="1.5"
          />
          <circle cx="12" cy="26" r="9" fill="#184030" />
          <circle cx="12" cy="26" r="3.5" fill="#90f4c0" />
          <circle cx="40" cy="28" r="6" fill="#184030" />
        </g>
      );
    case 'ditch':
      return (
        <g>
          <rect x="70" y={groundY(160, slope) + 20} width="190" height="12" rx="6" fill="#6b4f38" />
          <rect x="76" y={groundY(160, slope) + 23} width="178" height="6" rx="3" fill="#7cc6ee" />
        </g>
      );
    case 'flowers':
      return (
        <g>
          {[28, 74, 120, 176, 226, 280].map((x, i) => (
            <g key={x} transform={`translate(${x} ${row(x, 12 + (i % 2) * 14)})`}>
              <path d="M0 0v-9" stroke="#2f8f5b" strokeWidth="2" />
              <circle cy="-11" r="3.6" fill={['#f5a34a', '#ffd166', '#f7a8c4'][i % 3]} />
            </g>
          ))}
        </g>
      );
    case 'mulch':
      return (
        <g stroke="#e2c06a" strokeWidth="2" strokeLinecap="round">
          {Array.from({ length: 26 }, (_, i) => {
            const x = 12 + i * 12;
            return <path key={i} d={`M${x} ${row(x, 10 + (i % 4) * 11)} l8 -2`} />;
          })}
        </g>
      );
    case 'grassStrip':
      return (
        <g>
          <rect x="0" y={H - 16} width={W} height="16" fill="#5fbf84" />
          {Array.from({ length: 24 }, (_, i) => (
            <path key={i} d={`M${6 + i * 13} ${H - 16} l2-7 2 7`} fill="#43b574" />
          ))}
        </g>
      );
    case 'windbreak':
      return (
        <g>
          {[18, 40, 62].map((x) => (
            <g key={x} transform={`translate(${x} ${groundY(x, slope) + 6})`}>
              <rect x="-2" y="-8" width="4" height="12" fill="#7a5a3a" />
              <circle cy="-18" r="12" fill="#2f8f5b" />
              <circle cx="-4" cy="-21" r="4" fill="#43b574" />
            </g>
          ))}
        </g>
      );
    case 'puddle':
      return (
        <g fill="#7cc6ee" stroke="#4fa6d6" strokeWidth="1.5">
          <ellipse cx="90" cy={row(90, 24)} rx="26" ry="6" />
          <ellipse cx="220" cy={row(220, 28)} rx="20" ry="5" />
        </g>
      );
    case 'worriedCloud':
      return (
        <g transform="translate(196 30)">
          <CloudShape x={0} y={0} scale={1.1} />
          <circle cx="-5" cy="6" r="2" fill="#184030" />
          <circle cx="9" cy="6" r="2" fill="#184030" />
          <path
            d="M-8 3l6-2M12 3l-6-2M-3 14q3-3 6 0"
            stroke="#184030"
            strokeWidth="1.6"
            strokeLinecap="round"
            fill="none"
          />
          <path d="M22-2q2 3 2 5a2 2 0 0 1-4 0q0-2 2-5Z" fill="#7cc6ee" />
        </g>
      );
    case 'spade':
      return (
        <g
          transform={`translate(172 ${groundY(172, slope) + 6})`}
          stroke="#184030"
          strokeWidth="1.6"
          strokeLinejoin="round"
          strokeLinecap="round"
        >
          <path d="M0 6V-34" stroke="#a9744a" strokeWidth="4" />
          <path d="M-7-36h14" stroke="#a9744a" strokeWidth="4" />
          <path d="M-8 6h16l-2 14q-6 5-12 0Z" fill="#b8c7cf" />
        </g>
      );
    case 'hand':
      return (
        <g
          transform={`translate(160 ${groundY(160, slope) - 4})`}
          stroke="#184030"
          strokeWidth="1.6"
          strokeLinejoin="round"
          strokeLinecap="round"
          fill="#f6d2b0"
        >
          <ellipse cx="0" cy="2" rx="13" ry="8" />
          <rect x="-13" y="-12" width="5" height="12" rx="2.500" />
          <rect x="-7" y="-15" width="5" height="14" rx="2.500" />
          <rect x="-1" y="-15" width="5" height="14" rx="2.500" />
          <rect x="5" y="-13" width="5" height="12" rx="2.500" />
          <path d="M-14 4q-8 0-8-6" fill="none" />
          <g fill="#6f523a" stroke="none">
            <circle cx="-4" cy="14" r="2.200" />
            <circle cx="6" cy="16" r="1.800" />
            <circle cx="14" cy="13" r="1.500" />
          </g>
        </g>
      );
    case 'dustWind':
      return (
        <g
          fill="none"
          stroke={SOIL[soil].fill}
          strokeWidth="3"
          strokeLinecap="round"
          opacity="0.85"
        >
          <path d="M20 70q40-14 80 0t80 0" />
          <path d="M120 86q40-12 80 0t60 0" />
          <circle cx="250" cy="66" r="2" fill={SOIL[soil].fill} />
          <circle cx="270" cy="78" r="1.6" fill={SOIL[soil].fill} />
        </g>
      );
  }
}

// -------------------------------------------------------------------------- ground
function GroundLayer({ soil, slope }: { soil: Soil; slope: Slope }) {
  const [l, m, r] = SLOPE_Y[slope];
  const c = SOIL[soil];
  const top = `M0 ${l} Q${W / 2} ${2 * m - (l + r) / 2} ${W} ${r}`;
  return (
    <g>
      {slope !== 'steep' && (
        <path
          d={`M0 ${r + 6} Q90 ${r - 12} 180 ${r + 2} T${W} ${r - 2} V${r + 14} H0Z`}
          fill="#cfebd6"
        />
      )}
      <path d={`${top} V${H} H0Z`} fill={c.fill} />
      {[1, 2, 3].map((i) => (
        <path
          key={i}
          d={`M0 ${l + i * 16} Q${W / 2} ${2 * m - (l + r) / 2 + i * 14} ${W} ${r + i * 12}`}
          stroke={c.line}
          strokeWidth="2"
          fill="none"
          opacity="0.75"
        />
      ))}
      {soil === 'cracked' && (
        <g stroke={c.line} strokeWidth="2" fill="none" strokeLinecap="round">
          <path d="M40 112 58 126 50 138 70 148" />
          <path d="M150 108 140 124 158 134 148 148" />
          <path d="M250 114 266 128 254 140" />
          <path d="M96 122 112 118 120 132" />
        </g>
      )}
      {soil === 'wet' && (
        <g stroke="#b89b7f" strokeWidth="2" strokeLinecap="round" opacity="0.8">
          <path d="M30 116h22M150 122h26M250 112h20M90 138h24M210 140h24" />
        </g>
      )}
      {soil === 'salty' && (
        <g fill="#fff" opacity="0.9">
          {[
            [40, 112],
            [90, 126],
            [140, 114],
            [200, 132],
            [260, 120],
            [300, 138],
            [60, 142],
          ].map(([x, y]) => (
            <circle key={`${x}${y}`} cx={x} cy={y} r="2.6" />
          ))}
        </g>
      )}
      {soil === 'packed' && (
        <g stroke={c.line} strokeWidth="2.5" strokeLinecap="round">
          <path d="M20 110h40M110 108h50M210 112h46M60 126h60M180 130h56M20 142h40M130 144h60" />
        </g>
      )}
      {soil === 'crusted' && (
        <g stroke={c.line} strokeWidth="2" fill="none" strokeLinejoin="round">
          <path d="M30 108 70 104 84 120 52 128Z M120 112 168 108 180 126 134 132Z M220 108 270 106 282 124 232 128Z" />
        </g>
      )}
      {soil === 'pale' && (
        <g stroke="#fff" strokeWidth="3" strokeLinecap="round" opacity="0.7">
          <path d="M30 112h30M140 118h40M240 110h30" />
        </g>
      )}
      {soil === 'green' && (
        <g fill="#43b574">
          {Array.from({ length: 14 }, (_, i) => {
            const x = 14 + i * 23;
            return <path key={i} d={`M${x} ${groundY(x, slope) + 3} l2-6 2 6Z`} />;
          })}
        </g>
      )}
    </g>
  );
}

// ---------------------------------------------------------------- regional (from above)
const PATCHES: Record<string, string[]> = {
  green: ['#7ed6a3', '#5fbf84', '#a5e3a0', '#8fd6b0', '#c7eba0'],
  dry: ['#e6c98f', '#d9b778', '#ebd7a5', '#cfa96b', '#c9d68f'],
  wet: ['#5fbf84', '#4fae8e', '#6fc7b8', '#79d39a', '#8fd6d6'],
  bare: ['#c79b6d', '#d2aa7c', '#b88f61', '#ddbb8f', '#c9a27a'],
};

function RegionalLayer({ props }: { props: SceneProps }) {
  const palette =
    PATCHES[props.soil === 'cracked' || props.soil === 'pale' ? 'dry' : props.soil] ??
    PATCHES.green;
  const cols = 8;
  const rows = 5;
  const cw = W / cols;
  const ch = H / rows;
  return (
    <g>
      <rect width={W} height={H} fill={palette[0]} />
      {Array.from({ length: rows }, (_, j) =>
        Array.from({ length: cols }, (_, i) => (
          <rect
            key={`${i}-${j}`}
            x={i * cw + 1.5}
            y={j * ch + 1.5}
            width={cw - 3}
            height={ch - 3}
            rx="5"
            fill={palette[(i * 3 + j * 5 + ((i * j) % 2)) % palette.length]}
          />
        )),
      )}
      <path
        d="M-5 108C60 80 110 130 170 100S270 70 330 96"
        stroke="#7cc6ee"
        strokeWidth="9"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M0 40C80 62 150 30 230 54S300 40 320 36"
        stroke="#f0e2bd"
        strokeWidth="5"
        fill="none"
        strokeLinecap="round"
        opacity="0.9"
      />
      {props.slope !== 'none' && (
        <g fill="none" stroke="#2f6f4b" strokeWidth="2" opacity="0.45">
          {[0, 1, 2, 3].map((i) => (
            <ellipse
              key={i}
              cx={props.slope === 'steep' ? 120 : 200}
              cy="78"
              rx={80 - i * 18}
              ry={44 - i * 10}
            />
          ))}
        </g>
      )}
      {props.overlays?.includes('flowers') && (
        <g>
          {[
            [30, 30],
            [110, 70],
            [190, 36],
            [260, 100],
            [60, 120],
            [150, 124],
            [280, 40],
          ].map(([x, y], i) => (
            <circle
              key={`${x}${y}`}
              cx={x}
              cy={y}
              r="4"
              fill={['#f5a34a', '#ffd166', '#f7a8c4'][i % 3]}
            />
          ))}
        </g>
      )}
      {/* weather seen from above */}
      {props.sky === 'sun' && <circle cx="274" cy="26" r="22" fill="#ffd166" opacity="0.5" />}
      {(props.sky === 'cloud' || props.sky === 'rain') && (
        <g opacity="0.95">
          <CloudShape x={150} y={30} scale={1.3} fill={props.sky === 'rain' ? '#9db2c2' : '#fff'} />
          {props.sky === 'rain' && (
            <g stroke="#5fa8d6" strokeWidth="2" strokeLinecap="round">
              {[58, 74, 90, 106, 122].map((x) => (
                <path key={x} d={`M${x} 54 l-3 9`} />
              ))}
            </g>
          )}
        </g>
      )}
    </g>
  );
}

// ------------------------------------------------------------------------ the scene
const VIEW_LABEL = {
  regional: en.scene.regional,
  field: en.scene.field,
  closeup: en.scene.closeup,
} as const;

type Props = {
  /** The illustrationKey sent by the API. */
  sceneKey?: string;
  /** Or pass props directly (used when a scene is built by code). */
  scene?: SceneProps;
  /** Small pill in the corner that says what kind of view this is. */
  showLabel?: boolean;
  /** Shows the green "Field healed!" pill instead of the view label (Game 4, after a correct fix). */
  healed?: boolean;
  className?: string;
};

export function FieldScene({
  sceneKey,
  scene,
  showLabel = true,
  healed = false,
  className = '',
}: Props) {
  const uid = useId().replace(/:/g, '');
  const props = scene ?? getScene(sceneKey);
  const view = props.view ?? 'field';
  const [top, bottom] = SKY[props.sky];
  const overlays = props.overlays ?? [];
  const zoom = view === 'closeup' ? 1.7 : 1;
  const anchorY = view === 'closeup' ? H * 0.86 : H * 0.75;

  return (
    <div className={`relative aspect-[13/5] overflow-hidden rounded-2xl ${className}`}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="block size-full"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden="true"
        focusable="false"
      >
        <defs>
          <linearGradient id={`sky-${uid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={top} />
            <stop offset="1" stopColor={bottom} />
          </linearGradient>
        </defs>

        {view === 'regional' ? (
          <RegionalLayer props={props} />
        ) : (
          <g
            transform={`translate(${W / 2} ${anchorY}) scale(${zoom}) translate(${-W / 2} ${-anchorY})`}
          >
            <rect x={-W} y={-H} width={W * 3} height={H * 3} fill={`url(#sky-${uid})`} />
            <SkyLayer sky={props.sky} />
            <GroundLayer soil={props.soil} slope={props.slope} />
            {overlays.map((o) => (
              <OverlayLayer key={o} overlay={o} slope={props.slope} soil={props.soil} />
            ))}
          </g>
        )}
      </svg>
      {showLabel && (
        <span
          className={`absolute left-2.5 top-2.5 rounded-full px-2.5 py-1 text-[11px] font-extrabold shadow-press-soft ${
            healed ? 'bg-bright text-deep' : 'bg-white/90 text-deep'
          }`}
        >
          {healed ? en.scene.healed : VIEW_LABEL[view]}
        </span>
      )}
    </div>
  );
}

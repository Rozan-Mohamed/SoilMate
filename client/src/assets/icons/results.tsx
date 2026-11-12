// Game 5 answer icons (48x48): the 34 "what will happen" results.
import { Svg, type P } from './fixes';
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
  PEACH,
  Plant,
  Snowflake,
  SOIL,
  Sun,
  WATER,
  WindLines,
} from './weather';

const Ground = ({ y = 34, fill = SOIL }: { y?: number; fill?: string }) => (
  <path d={`M3 ${y}h42v${45 - y}a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3Z`} fill={fill} />
);

export const ResultBendingPlants = (p: P) => (
  <Svg {...p}>
    <Ground y={38} />
    <Plant x={14} y={38} lean={38} />
    <Plant x={28} y={38} lean={42} s={1.1} />
    <path d="M4 12h18c4 0 4-5 0-5M10 22h14" stroke="#7cc6ee" strokeWidth="2.400" />
  </Svg>
);
export const ResultBiggerHarvest = (p: P) => (
  <Svg {...p}>
    <path d="M6 26h36l-4 16H10Z" fill="#c9a24a" />
    <path d="M6 26h36M12 34h24" />
    <circle cx="15" cy="21" r="6" fill={PEACH} />
    <circle cx="26" cy="19" r="6.500" fill="#f2cc4f" />
    <circle cx="36" cy="21" r="6" fill="#79d39a" />
    <Arrow x={40} y={8} color={G2} len={12} />
  </Svg>
);
export const ResultColdPlants = (p: P) => (
  <Svg {...p}>
    <Ground y={38} fill="#a9b9c4" />
    <Plant x={20} y={38} color="#8fc6d8" />
    <Snowflake x={36} y={14} s={0.8} />
  </Svg>
);
export const ResultCoolRest = (p: P) => (
  <Svg {...p}>
    <Ground y={38} />
    <Plant x={18} y={38} wilt />
    <path d="M36 8a8 8 0 1 0 6 12 7 7 0 0 1-6-12Z" fill="#ffe08a" />
    <path d="M30 24h6l-6 6h6" strokeWidth="1.800" />
  </Svg>
);
export const ResultDisease = (p: P) => (
  <Svg {...p}>
    <path d="M8 40C4 22 14 8 38 8c0 20-10 32-30 32Z" fill="#7ed56f" />
    <circle cx="20" cy="22" r="3.500" fill="#8a5a2c" />
    <circle cx="28" cy="16" r="2.800" fill="#8a5a2c" />
    <circle cx="26" cy="28" r="3.200" fill="#8a5a2c" />
    <circle cx="15" cy="31" r="2.400" fill="#8a5a2c" />
  </Svg>
);
export const ResultDrySoil = (p: P) => (
  <Svg {...p}>
    <path d="M3 22h42v20a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3Z" fill="#e6c98f" />
    <Cracks x={4} y={24} />
    <Sun x={38} y={10} r={5} />
  </Svg>
);
export const ResultEvaporation = (p: P) => (
  <Svg {...p}>
    <Ground y={36} />
    <path
      d="M12 30q-3-6 0-12t0-10M24 30q-3-6 0-12t0-10M36 30q-3-6 0-12t0-10"
      fill="none"
      stroke={WATER}
      strokeWidth="3"
    />
    <path d="M9 11l3-4 3 4M21 11l3-4 3 4M33 11l3-4 3 4" stroke={WATER} strokeWidth="2.200" />
  </Svg>
);
export const ResultFewerFruits = (p: P) => (
  <Svg {...p}>
    <path d="M24 44V22" />
    <circle cx="24" cy="15" r="12" fill="#5cc48f" />
    <circle cx="24" cy="20" r="3.500" fill={PEACH} />
    <Arrow x={40} y={34} dir="down" color={PEACH} len={12} />
  </Svg>
);
export const ResultFewerPests = (p: P) => (
  <Svg {...p}>
    <Bug x={20} y={24} s={0.9} />
    <Arrow x={40} y={34} dir="down" color={G2} len={12} />
  </Svg>
);
export const ResultFlood = (p: P) => (
  <Svg {...p}>
    <Plant x={14} y={30} s={0.8} />
    <Plant x={34} y={30} s={0.8} />
    <path d="M3 26q7-5 14 0t14 0 14 0v17a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3Z" fill={WATER} />
    <path d="M10 34q4-3 8 0M26 38q4-3 8 0" stroke="#fff" strokeWidth="2" />
  </Svg>
);
export const ResultFrostDamage = (p: P) => (
  <Svg {...p}>
    <Ground y={38} />
    <Plant x={22} y={38} wilt />
    <Snowflake x={10} y={14} s={0.7} />
    <Snowflake x={38} y={20} s={0.6} />
  </Svg>
);
export const ResultFrozenSoil = (p: P) => (
  <Svg {...p}>
    <Ground y={26} fill="#8c7a6a" />
    <path d="M3 26h42l-3 5-5-4-5 5-5-5-5 5-5-5-5 5-5-4-4 4Z" fill="#e8f6fb" />
    <Snowflake x={24} y={11} s={0.7} />
  </Svg>
);
export const ResultGreenerPlants = (p: P) => (
  <Svg {...p}>
    <Ground y={38} />
    <Plant x={12} y={38} />
    <Plant x={26} y={38} s={1.2} color="#5cc48f" />
    <Plant x={39} y={38} s={0.9} />
    <path
      d="M38 10l1.500 3.500 3.500 1.500-3.500 1.500L38 20l-1.500-3.500L33 15l3.500-1.500Z"
      fill={GOLD}
      stroke="none"
    />
  </Svg>
);
export const ResultLessSunlight = (p: P) => (
  <Svg {...p}>
    <Sun x={18} y={16} r={8} />
    <Cloud x={28} y={26} s={1.7} fill="#cfdde6" />
    <Arrow x={40} y={8} dir="down" color={PEACH} len={10} />
  </Svg>
);
export const ResultLowWaterSupply = (p: P) => (
  <Svg {...p}>
    <path d="M5 14v22a8 8 0 0 0 8 8h22a8 8 0 0 0 8-8V14" fill="#e8dcc6" />
    <path d="M5 34h38v2a8 8 0 0 1-8 8H13a8 8 0 0 1-8-8Z" fill={WATER} />
    <Drop x={24} y={22} s={0.9} />
    <Arrow x={38} y={12} dir="down" color={PEACH} len={10} />
  </Svg>
);
export const ResultMoistureRecover = (p: P) => (
  <Svg {...p}>
    <Ground y={26} fill="#8c6a4e" />
    <Drop x={14} y={14} s={0.8} />
    <Drop x={28} y={10} s={0.8} />
    <Arrow x={14} y={36} dir="up" color="#c9e8f5" len={10} />
    <Arrow x={34} y={36} dir="up" color="#c9e8f5" len={10} />
  </Svg>
);
export const ResultPests = (p: P) => (
  <Svg {...p}>
    <Bug x={24} y={24} s={1.6} />
  </Svg>
);
export const ResultPlantsGrowFaster = (p: P) => (
  <Svg {...p}>
    <Ground y={40} />
    <path d="M16 40V12" />
    <path
      d="M16 30c-9 0-12-6-12-12 6 0 12 5 12 12ZM16 22c9 0 12-6 12-12-6 0-12 5-12 12Z"
      fill={G1}
    />
    <Arrow x={36} y={22} color={G2} len={22} />
  </Svg>
);
export const ResultPlantsLoseWater = (p: P) => (
  <Svg {...p}>
    <Ground y={38} />
    <Plant x={16} y={38} wilt />
    <Drop x={32} y={26} s={0.7} />
    <Drop x={38} y={16} s={0.6} />
    <Arrow x={34} y={36} color={WATER} len={8} />
  </Svg>
);
export const ResultRichSoil = (p: P) => (
  <Svg {...p}>
    <Ground y={28} fill={DARK} />
    <Plant x={24} y={28} s={0.9} />
    <path
      d="M10 38l1.500 3 3 1.500-3 1.500L10 47l-1.500-3-3-1.500 3-1.500Z"
      fill={GOLD}
      stroke="none"
    />
    <circle cx="36" cy="38" r="1.800" fill="#c9a24a" stroke="none" />
    <circle cx="28" cy="42" r="1.800" fill="#c9a24a" stroke="none" />
  </Svg>
);
export const ResultRunoff = (p: P) => (
  <Svg {...p}>
    <path d="M3 14 40 34v10H3Z" fill={SOIL} />
    <path d="M10 14c8 4 18 10 28 16M12 20c8 4 16 8 24 12" stroke={WATER} strokeWidth="3.200" />
    <Drop x={12} y={8} s={0.7} />
    <Drop x={26} y={6} s={0.7} />
  </Svg>
);
export const ResultSeedsWashed = (p: P) => (
  <Svg {...p}>
    <path d="M3 30q7-5 14 0t14 0 14 0v10q-7 5-14 0t-14 0-14 0Z" fill={WATER} />
    <ellipse cx="14" cy="26" rx="3" ry="4.500" fill="#e8c35a" transform="rotate(30 14 26)" />
    <ellipse cx="26" cy="22" rx="3" ry="4.500" fill="#e8c35a" transform="rotate(30 26 22)" />
    <ellipse cx="37" cy="27" rx="3" ry="4.500" fill="#e8c35a" transform="rotate(30 37 27)" />
    <Arrow x={24} y={42} dir="right" color="#fff" len={16} />
  </Svg>
);
export const ResultSlowGrowth = (p: P) => (
  <Svg {...p}>
    <Ground y={40} />
    <path d="M10 40c0-7 5-10 12-10 8 0 14 4 14 10Z" fill="#e8c78a" />
    <path d="M16 38c0-4 4-6 8-5" fill="none" />
    <path d="M36 40c4 0 8-2 8-6l-3 2-3-2" fill="#d9c27a" />
    <path d="M42 33l2-5M45 34l3-4" />
    <Plant x={12} y={20} s={0.6} />
  </Svg>
);
export const ResultSoaksIn = (p: P) => (
  <Svg {...p}>
    <Ground y={24} fill="#8c6a4e" />
    <Drop x={12} y={10} s={0.8} />
    <Drop x={24} y={8} s={0.8} />
    <Drop x={36} y={10} s={0.8} />
    <Arrow x={12} y={34} dir="down" color="#c9e8f5" len={10} />
    <Arrow x={24} y={36} dir="down" color="#c9e8f5" len={10} />
    <Arrow x={36} y={34} dir="down" color="#c9e8f5" len={10} />
  </Svg>
);
export const ResultSoilWashesAway = (p: P) => (
  <Svg {...p}>
    <path d="M3 18h26l-5 9 6 4-4 7H3Z" fill={SOIL} />
    <path d="M26 22c6 2 12 8 18 8M28 30c6 2 10 6 16 6" stroke={WATER} strokeWidth="3.500" />
    <circle cx="36" cy="38" r="2.500" fill={SOIL} />
    <circle cx="42" cy="34" r="2" fill={SOIL} />
  </Svg>
);
export const ResultSpoiledHarvest = (p: P) => (
  <Svg {...p}>
    <path d="M24 10c0-3 3-5 6-5" />
    <path d="M10 22c0-8 8-10 14-7 6-3 14-1 14 7 0 12-8 22-14 22S10 34 10 22Z" fill="#e8a05a" />
    <path d="M20 26c4-2 8 1 7 5s-6 5-9 2-1-6 2-7Z" fill="#7a4a24" />
    <circle cx="40" cy="12" r="2" fill={D} />
    <circle cx="35" cy="8" r="1.500" fill={D} />
  </Svg>
);
export const ResultStrongerPlants = (p: P) => (
  <Svg {...p}>
    <Ground y={40} />
    <path d="M24 40V14" strokeWidth="3.500" />
    <path
      d="M24 30C12 30 8 22 8 16c8 0 16 6 16 14ZM24 22c12 0 16-8 16-14-8 0-16 6-16 14Z"
      fill="#5cc48f"
    />
    <path
      d="M10 6l1.500 3.500 3.500 1.500-3.500 1.500L10 16l-1.500-3.500L5 11l3.500-1.500Z"
      fill={GOLD}
      stroke="none"
    />
  </Svg>
);
export const ResultTornLeaves = (p: P) => (
  <Svg {...p}>
    <path d="M8 38C4 22 14 8 36 8c0 6-1 10-4 14l5 3-6 3 3 5c-6 4-14 6-26 5Z" fill="#7ed56f" />
    <circle cx="20" cy="22" r="3" fill="#eaf6f1" />
    <circle cx="35" cy="6" r="2.500" fill="#fff" />
    <circle cx="42" cy="14" r="2.500" fill="#fff" />
  </Svg>
);
export const ResultWaterIn = (p: P) => (
  <Svg {...p}>
    <path d="M14 18h20l-3 24H17Z" fill="#e8dcc6" />
    <path d="M15 26h18l-1.500 16h-15Z" fill={WATER} />
    <Drop x={24} y={6} s={0.9} />
    <Arrow x={24} y={14} dir="down" len={8} color={WATER} />
  </Svg>
);
export const ResultWaterOut = (p: P) => (
  <Svg {...p}>
    <path d="M4 18h20l-3 24H7Z" fill="#e8dcc6" />
    <path d="M5 26h18l-1.500 16h-15Z" fill={WATER} />
    <Arrow x={34} y={26} dir="right" color={WATER} len={16} />
    <Drop x={40} y={34} s={0.7} />
  </Svg>
);
export const ResultWaterlogged = (p: P) => (
  <Svg {...p}>
    <Plant x={24} y={26} wilt />
    <path d="M3 26q7-4 14 0t14 0 14 0v17a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3Z" fill={WATER} />
    <circle cx="14" cy="36" r="2.500" fill="#fff" />
    <circle cx="32" cy="34" r="2" fill="#fff" />
    <circle cx="38" cy="40" r="2.500" fill="#fff" />
  </Svg>
);
export const ResultWetSoil = (p: P) => (
  <Svg {...p}>
    <Ground y={22} fill="#6f523a" />
    <path d="M10 30h10M26 34h12M14 40h12" stroke="#b89b7f" strokeWidth="2.500" />
    <Drop x={14} y={12} s={0.8} />
    <Drop x={32} y={10} s={0.7} />
  </Svg>
);
export const ResultWilting = (p: P) => (
  <Svg {...p}>
    <Ground y={38} />
    <Plant x={24} y={38} s={1.5} wilt />
  </Svg>
);
export const ResultWindErosion = (p: P) => (
  <Svg {...p}>
    <path d="M3 38q8-14 20-14t18 14Z" fill={SOIL} />
    <path
      d="M26 22h10c5 0 5-6 0-6M30 30h12c5 0 5 6 0 6"
      fill="none"
      stroke="#7cc6ee"
      strokeWidth="2.600"
      strokeLinecap="round"
    />
    <circle cx="38" cy="24" r="2" fill={SOIL} />
    <circle cx="43" cy="28" r="1.600" fill={SOIL} />
  </Svg>
);

export { G1, ICE, Leaf, WindLines };

// Maps every scene illustration key from the API to a small set of FieldScene props.
// One data file instead of 120 separate drawings. Games 4 and 5 get their entries in later stages.

export type Soil =
  'bare' | 'green' | 'dry' | 'cracked' | 'wet' | 'salty' | 'packed' | 'pale' | 'crusted';
export type Sky = 'sun' | 'cloud' | 'rain' | 'storm' | 'frost' | 'wind' | 'hail' | 'fog' | 'clear';
export type Slope = 'none' | 'gentle' | 'steep';
export type Overlay =
  | 'pests'
  | 'weeds'
  | 'machine'
  | 'ditch'
  | 'flowers'
  | 'mulch'
  | 'grassStrip'
  | 'windbreak'
  | 'puddle'
  | 'wiltedPlants'
  | 'healthyPlants'
  | 'worriedCloud'
  | 'dustWind'
  | 'spade'
  | 'hand';
/** field = side view of a field. regional = a map-like view from above. closeup = a zoomed-in field. */
export type SceneView = 'field' | 'regional' | 'closeup';

export type SceneProps = {
  soil: Soil;
  sky: Sky;
  slope: Slope;
  overlays?: Overlay[];
  view?: SceneView;
};

const s = (
  view: SceneView,
  soil: Soil,
  sky: Sky,
  overlays: Overlay[] = [],
  slope: Slope = 'none',
): SceneProps => ({ view, soil, sky, slope, overlays });

export const SCENES: Record<string, SceneProps> = {
  // ---- Game 2: Satellite or Ground? (30) ----
  'scene-g2-bare-season': s('regional', 'bare', 'sun'),
  'scene-g2-crop-change': s('regional', 'green', 'sun', ['flowers']),
  'scene-g2-crops-record': s('field', 'green', 'sun', ['healthyPlants']),
  'scene-g2-drought-field': s('field', 'cracked', 'sun', ['wiltedPlants']),
  'scene-g2-dry-corner': s('field', 'dry', 'clear', ['wiltedPlants']),
  'scene-g2-dry-valley': s('regional', 'dry', 'sun', [], 'gentle'),
  'scene-g2-fertilizer': s('field', 'green', 'sun', ['machine']),
  'scene-g2-frost-plants': s('field', 'green', 'frost', ['healthyPlants']),
  'scene-g2-green-drop': s('regional', 'green', 'cloud'),
  'scene-g2-green-region': s('regional', 'green', 'sun'),
  'scene-g2-greenness-history': s('regional', 'green', 'clear', ['flowers']),
  'scene-g2-groundwater': s('field', 'wet', 'clear', ['ditch']),
  'scene-g2-heat-crop': s('field', 'dry', 'sun', ['wiltedPlants']),
  'scene-g2-hills-map': s('regional', 'green', 'clear', [], 'steep'),
  'scene-g2-hot-regions': s('regional', 'dry', 'sun'),
  'scene-g2-irrigation-water': s('field', 'wet', 'sun', ['ditch', 'healthyPlants']),
  'scene-g2-land-heat': s('regional', 'dry', 'sun', [], 'gentle'),
  'scene-g2-market-price': s('field', 'green', 'sun', ['machine', 'healthyPlants']),
  'scene-g2-neighbor-field': s('field', 'green', 'clear', ['healthyPlants', 'windbreak']),
  'scene-g2-pest-leaf': s('closeup', 'green', 'sun', ['pests']),
  'scene-g2-rain-wide-area': s('regional', 'wet', 'rain'),
  'scene-g2-roots-dig': s('closeup', 'bare', 'clear', ['healthyPlants', 'spade']),
  'scene-g2-soil-touch': s('closeup', 'wet', 'clear', ['hand']),
  'scene-g2-spade-soil': s('closeup', 'packed', 'clear', ['spade']),
  'scene-g2-sunlight': s('regional', 'green', 'sun'),
  'scene-g2-washed-slope': s('field', 'bare', 'rain', ['puddle'], 'steep'),
  'scene-g2-water-first': s('field', 'wet', 'rain', ['puddle']),
  'scene-g2-weeds': s('field', 'green', 'sun', ['weeds']),
  'scene-g2-well-depth': s('field', 'dry', 'clear', ['ditch']),
  'scene-g2-wet-dry-area': s('regional', 'wet', 'cloud'),
};

// ---- Game 4: Fix the Field. Each problem has a "problem" scene (with a worried cloud) and a "fixed" scene
// (lush green, sunny). The two are built from the same table so they always match.
type Row = {
  problem: { soil: Soil; sky: Sky; overlays?: Overlay[]; slope?: Slope; view?: SceneView };
  fixed: { overlays: Overlay[]; slope?: Slope; view?: SceneView };
};

const G4: Record<string, Row> = {
  'cover-crop': { problem: { soil: 'bare', sky: 'clear' }, fixed: { overlays: ['healthyPlants'] } },
  'held-soil': {
    problem: { soil: 'bare', sky: 'rain', overlays: ['puddle'], slope: 'steep' },
    fixed: { overlays: ['healthyPlants'], slope: 'steep' },
  },
  nitrogen: {
    problem: { soil: 'pale', sky: 'sun', overlays: ['wiltedPlants'] },
    fixed: { overlays: ['healthyPlants', 'flowers'] },
  },
  rotation: {
    problem: { soil: 'green', sky: 'sun', overlays: ['pests'] },
    fixed: { overlays: ['healthyPlants', 'flowers'] },
  },
  'low-water': {
    problem: { soil: 'dry', sky: 'sun', overlays: ['wiltedPlants'] },
    fixed: { overlays: ['healthyPlants'] },
  },
  'deep-roots': {
    problem: { soil: 'packed', sky: 'clear' },
    fixed: { overlays: ['healthyPlants'] },
  },
  'soak-it-in': {
    problem: { soil: 'crusted', sky: 'rain', overlays: ['puddle'], slope: 'gentle' },
    fixed: { overlays: ['mulch', 'healthyPlants'], slope: 'gentle' },
  },
  'no-gaps': {
    problem: { soil: 'green', sky: 'sun', overlays: ['weeds'] },
    fixed: { overlays: ['healthyPlants'] },
  },
  'rich-soil': {
    problem: { soil: 'pale', sky: 'sun', overlays: ['wiltedPlants'] },
    fixed: { overlays: ['healthyPlants', 'mulch'] },
  },
  windbreak: {
    problem: { soil: 'dry', sky: 'wind', overlays: ['dustWind'] },
    fixed: { overlays: ['windbreak', 'healthyPlants'] },
  },
  'drain-well': {
    problem: { soil: 'wet', sky: 'rain', overlays: ['puddle', 'wiltedPlants'] },
    fixed: { overlays: ['ditch', 'healthyPlants'] },
  },
  'frost-safe': {
    problem: { soil: 'green', sky: 'frost', overlays: ['wiltedPlants'] },
    fixed: { overlays: ['healthyPlants'] },
  },
  'cool-water': {
    problem: { soil: 'dry', sky: 'sun', overlays: ['wiltedPlants'] },
    fixed: { overlays: ['healthyPlants'] },
  },
  'fill-the-gap': {
    problem: { soil: 'bare', sky: 'clear' },
    fixed: { overlays: ['healthyPlants'] },
  },
  'save-money': {
    problem: { soil: 'green', sky: 'cloud', overlays: ['machine', 'wiltedPlants'] },
    fixed: { overlays: ['healthyPlants', 'flowers'] },
  },
  'save-water': {
    problem: { soil: 'dry', sky: 'sun', overlays: ['wiltedPlants'] },
    fixed: { overlays: ['healthyPlants'] },
  },
  'soft-cover': {
    problem: { soil: 'crusted', sky: 'rain' },
    fixed: { overlays: ['mulch', 'healthyPlants'] },
  },
  'less-salt': {
    problem: { soil: 'salty', sky: 'sun', overlays: ['wiltedPlants'] },
    fixed: { overlays: ['ditch', 'healthyPlants'] },
  },
  'grass-strip': {
    problem: { soil: 'bare', sky: 'rain', overlays: ['ditch', 'puddle'], slope: 'gentle' },
    fixed: { overlays: ['grassStrip', 'ditch'], slope: 'gentle' },
  },
  'alive-soil': {
    problem: { soil: 'packed', sky: 'sun', overlays: ['wiltedPlants'] },
    fixed: { overlays: ['healthyPlants', 'flowers'] },
  },
  'cool-soil': {
    problem: { soil: 'cracked', sky: 'sun' },
    fixed: { overlays: ['mulch', 'healthyPlants'] },
  },
  'loose-again': {
    problem: { soil: 'packed', sky: 'cloud', overlays: ['machine'] },
    fixed: { overlays: ['healthyPlants'] },
  },
  'extra-income': {
    problem: { soil: 'green', sky: 'cloud', overlays: ['wiltedPlants'] },
    fixed: { overlays: ['healthyPlants', 'flowers', 'machine'] },
  },
  'animal-feed': {
    problem: { soil: 'dry', sky: 'sun', overlays: ['wiltedPlants'] },
    fixed: { overlays: ['healthyPlants'] },
  },
  'hold-nutrients': {
    problem: { soil: 'pale', sky: 'rain', overlays: ['puddle'] },
    fixed: { overlays: ['healthyPlants'] },
  },
  'no-cracks': {
    problem: { soil: 'cracked', sky: 'sun' },
    fixed: { overlays: ['mulch', 'healthyPlants'] },
  },
  'ask-an-expert': {
    problem: { soil: 'green', sky: 'cloud', overlays: ['pests', 'wiltedPlants'] },
    fixed: { overlays: ['healthyPlants'] },
  },
  'check-the-ground': {
    problem: { soil: 'dry', sky: 'sun', view: 'regional' },
    fixed: { overlays: [], view: 'regional' },
  },
  'helpful-bugs': {
    problem: { soil: 'green', sky: 'cloud' },
    fixed: { overlays: ['flowers', 'healthyPlants'] },
  },
  'compare-wisely': {
    problem: { soil: 'green', sky: 'cloud', overlays: ['wiltedPlants'] },
    fixed: { overlays: ['healthyPlants', 'windbreak'] },
  },
};

for (const [name, row] of Object.entries(G4)) {
  const p = row.problem;
  SCENES[`scene-g4-${name}-problem`] = s(
    p.view ?? 'field',
    p.soil,
    p.sky,
    [...(p.overlays ?? []), 'worriedCloud'],
    p.slope ?? 'none',
  );
  const f = row.fixed;
  SCENES[`scene-g4-${name}-fixed`] = s(
    f.view ?? 'field',
    'green',
    'sun',
    f.overlays,
    f.slope ?? 'none',
  );
}

// ---- Game 5: Weather and Crops. One weather event per scene (sky + soil + a few overlays).
// The result animation (resultAnimationKey) is played on top of it by SceneAnimation.
const G5: Record<string, SceneProps> = {
  'hot-sun': s('field', 'dry', 'sun', ['wiltedPlants']),
  'dry-spell': s('field', 'cracked', 'sun'),
  'heavy-rain': s('field', 'bare', 'rain', ['puddle'], 'gentle'),
  frost: s('field', 'green', 'frost', ['healthyPlants']),
  wind: s('field', 'bare', 'wind', ['dustWind']),
  'mild-days': s('field', 'green', 'rain', ['healthyPlants']),
  'heat-wave': s('field', 'green', 'sun', ['flowers', 'wiltedPlants']),
  'cloudy-days': s('field', 'green', 'cloud', ['healthyPlants']),
  'flash-rain': s('field', 'bare', 'storm', ['puddle'], 'steep'),
  'wash-away': s('field', 'bare', 'rain', ['puddle']),
  'damp-days': s('field', 'wet', 'fog', ['healthyPlants']),
  'cool-nights': s('field', 'green', 'clear', ['healthyPlants']),
  'soggy-soil': s('field', 'wet', 'rain', ['puddle', 'wiltedPlants']),
  hail: s('field', 'green', 'hail', ['healthyPlants']),
  'low-water': s('field', 'cracked', 'sun', ['ditch']),
  'water-balance': s('field', 'dry', 'sun', ['ditch']),
  'welcome-rain': s('field', 'dry', 'rain', ['healthyPlants']),
  'strong-wind': s('field', 'green', 'storm', ['healthyPlants']),
  'cool-autumn': s('field', 'green', 'cloud', ['healthyPlants']),
  'warm-winter': s('field', 'bare', 'sun', ['pests']),
  'cold-snap': s('field', 'green', 'frost', ['wiltedPlants']),
  'sun-after-rain': s('field', 'wet', 'sun', ['puddle']),
  'dust-wind': s('field', 'dry', 'wind', ['dustWind']),
  'rainy-harvest': s('field', 'green', 'rain', ['machine', 'puddle']),
  'covered-soil': s('field', 'green', 'rain', ['healthyPlants', 'mulch']),
  'dry-winter': s('field', 'cracked', 'clear'),
  'foggy-days': s('field', 'green', 'fog', ['healthyPlants']),
  'sunny-growth': s('field', 'green', 'sun', ['healthyPlants', 'flowers']),
  'humid-nights': s('field', 'wet', 'cloud', ['pests']),
  'cold-spell': s('field', 'pale', 'frost'),
};
for (const [name, props] of Object.entries(G5)) SCENES[`scene-g5-${name}`] = props;

export const DEFAULT_SCENE: SceneProps = s('regional', 'green', 'sun');

const warned = new Set<string>();
export function getScene(key: string | undefined): SceneProps {
  if (key && SCENES[key]) return SCENES[key];
  if (key && process.env.NODE_ENV !== 'production' && !warned.has(key)) {
    warned.add(key);
    console.warn(`[FieldScene] no scene preset for "${key}", using the default`);
  }
  return DEFAULT_SCENE;
}

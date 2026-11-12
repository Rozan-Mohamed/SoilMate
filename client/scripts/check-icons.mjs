// Lists which API icon keys still have no art.   npm run check:icons
// A key counts as covered when it appears in the icon map, in the crop icons or in the scene presets.
import { readFileSync } from 'node:fs';

const keys = JSON.parse(readFileSync('src/shared/icon-keys.json', 'utf8')).keys;
const sources = [
  'src/assets/icon-map.tsx',
  'src/assets/icons/crops.tsx',
  'src/assets/icons/tiles.tsx',
  'src/assets/icons/stickers.tsx',
  'src/components/scene/scenes.ts',
].map((f) => readFileSync(f, 'utf8'));

const have = new Set();
for (const text of sources) for (const m of text.matchAll(/^\s*'?([a-z0-9-]+)'?:/gm)) have.add(m[1]);

// Game 4 scenes are generated from a table: each row 'name': { problem ... } makes two scene keys.
for (const m of sources.join('\n').matchAll(/'?([a-z-]+)'?: \{\s*problem/g)) {
  have.add(`scene-g4-${m[1]}-problem`);
  have.add(`scene-g4-${m[1]}-fixed`);
}

// Game 5 scenes are generated from a table: each line 'name': s('field' ... makes one scene key.
const g5 = sources.join('\n');
const g5Block = g5.slice(g5.indexOf('const G5'), g5.indexOf('Object.entries(G5)'));
for (const m of g5Block.matchAll(/^\s*'?([a-z-]+)'?: s\(/gm)) have.add(`scene-g5-${m[1]}`);

const missing = keys.filter((k) => !have.has(k));
const groups = {};
for (const k of missing) (groups[k.split('-')[0]] ??= []).push(k);

console.log(`${keys.length - missing.length} / ${keys.length} icon keys have art (icons + scenes).`);
for (const [group, list] of Object.entries(groups)) console.log(`  missing ${group}-* : ${list.length}`);

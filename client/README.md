# SoilMate client (Next.js 16)

The frontend of the SoilMate website. The **Learn & Play** section is complete: a hub page and five games
(Match the Word, Satellite or Ground?, Crop Superpowers, Fix the Field, Weather and Crops) with a finale.
The rest of the website (Home, Explore Land, My Farm, Rotation Lab, Future Farm, Dashboard) is placeholder pages
inside the same shell (navbar, design tokens, background, sound).

Stack: Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4, TanStack Query, Zustand, Framer Motion.

## Run it
```bash
npm install
cp .env.example .env.local     # points at http://localhost:4000/api
npm run dev                    # http://localhost:3000
```
The games need the API. Pick one:

- **Real backend** (`server/`): create a free MongoDB Atlas cluster, then in `server/`
  `cp .env.example .env`, set `MONGO_URI` and `CLIENT_ORIGIN=http://localhost:3000`, then
  `npm install && npm run seed && npm run dev`. Check http://localhost:4000/api/health.
- **Mock API** (no database): `npm run mock` serves the same routes from memory on port 4000.
  Use only one of the two at a time (same port).

## Scripts
| Command | What it does |
|---|---|
| `npm run dev` / `build` / `start` | Next.js development / production build / serve the build |
| `npm run mock` | in-memory copy of the API (development tool) |
| `npm test` | unit tests (Vitest): game store, API client, attempt loader, art coverage |
| `npm run typecheck` / `lint` / `format` | TypeScript, ESLint, Prettier |
| `npm run check:icons` | how many API icon keys have art (should be 331 / 331) |
| `python3 e2e/<name>.py` | browser tests, see `e2e/README.md` |

Developer-only pages (they answer 404 in production): `/dev/scenes`, `/dev/icons`, `/dev/animations`.

## Structure
```
src/app/             routes (App Router); every site page is a folder
src/config/site.ts   navbar items and links for the WHOLE website
src/components/      layout/ (NavBar, PageBackground), ui/ (Button, Modal, Icon ...), game/, result/, hub/, scene/
src/api/             types (the contract), fetch client with X-Player-Id, one file per resource, queries
src/audio/           synthesized music + sound effects (Web Audio, no audio files), store, provider
src/features/learn/  game config, play page, result page, hub page, the flow hook
src/store/           gameStore (zustand): hearts, streak and points ONLY come from API responses
src/assets/          icons (331 keys) drawn as SVG components
src/strings/en.ts    every user-facing text
src/app/globals.css  design tokens (colours, radius, shadows)
docs/                (at the repo root) contract JSON, HANDOFF.md, BACKEND_CHANGES.md
```

## Rules to keep
- `docs/soilmate-learn-play-contract.json` is the source of truth for the API.
- No question, choice, answer or explanation text is written in the client. It all comes from the API.
- Hearts, streak and points are never calculated in the client.
- Wrong answers are soft orange. No pure red anywhere.
- Use the tokens (`bg-mint`, `text-deep`, `rounded-card` ...), never raw hex values.
- Run `npm run typecheck && npm run lint && npm test` before delivering.

## Good to know
- The browser console shows a `404` for `GET /games/:slug/attempts/current` when a game starts fresh.
  That is the contract's normal "no round in progress" answer, not an error.
- Music starts after the first tap (browsers block sound before a user gesture). The navbar speaker is the master mute;
  the Hub has separate Music / Sound effects switches. The choice is saved in `localStorage`.
- Accessibility: axe reports 0 violations on the hub, all five games (question, wrong, correct), the score screen
  and the finale; keyboard-only play works; motion is reduced for `prefers-reduced-motion`.

## Before going live
- Backend `CLIENT_ORIGIN` must be the real site URL (only one origin is allowed).
- Add `app.set('trust proxy', 1)` in `server/src/app.js` when the API runs behind a host's proxy
  (otherwise every visitor shares one rate-limit bucket). See `docs/BACKEND_CHANGES.md`.
- Set `NEXT_PUBLIC_API_URL` to the deployed API URL (it is read at build time).

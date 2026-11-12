# HANDOFF: SoilMate Learn & Play frontend  (FINAL: all 7 stages done)

To continue in a new chat/account: paste THIS file + `soilmate-learn-play-contract.json` + `frontend-steps.txt`
(+ `Game_Ui.pdf` for the screens) and say "continue with the next stage".
RULE FROM THE USER: every stage must be delivered as a zip together with an updated HANDOFF.md.

## HOW TO RESUME IN A NEW ACCOUNT (read this first)
Attach to the new chat: this file, `soilmate-learn-play-contract.json` (in docs/), `frontend-steps.txt`, `Game_Ui.pdf`,
and the latest `soilmate-stageN.zip` (client/ + docs/). Optionally the backend zip `soilMate-main.zip`.
Then send this message: "Continue the SoilMate Learn & Play frontend from HANDOFF.md. Unzip the latest stage zip, check it
builds (`npm install && npm run build`), then start the NEXT stage. Reply in Egyptian Arabic. When the stage is done,
deliver a new zip with an updated HANDOFF.md."
Working style the user wants: one stage at a time, every stage ends with a zip + updated HANDOFF.md, verify in a real
browser (Playwright + `npm run mock`) before delivering, tell her honestly what was NOT tested (the real backend).

## Who / what
User is the FRONTEND developer (female, Egyptian Arabic; reply in Egyptian Arabic, code and UI text in English).
Backend (Express + MongoDB, folder `server/`) is finished and was read from the code. It has NOT changed
between the two zips she uploaded. Site: SoilMate (NASA Space Apps "Field Rotation"). Only Learn & Play is built
now; the rest of the website comes later, so the shell (navbar, tokens, layout, sound) is shared.

## Decisions (override frontend-steps.txt where they differ)
- Game 1 question shows NO icon (user request, stage 3.1): the API's illustrationKey is the term's own icon, which is also the
  icon of the correct answer button, so showing it gives the answer away. Do not add it back. The answer buttons keep their icons.
- Next.js 16.4.5 App Router, TypeScript, Tailwind v4, React 19. `cacheComponents` OFF on purpose.
- Contract v1.1.0 wins over the steps file. 5 games, pipeline of 5 circles, Game 1 is "n of 5" (PDF shows 6: outdated).
- Hearts are warm coral `--color-heart`, NOT pure red (contract: "Never red, anywhere"). Wrong = soft orange.
- Sound is synthesized (Web Audio, no files). Music default ON, starts after first tap, master mute in navbar,
  saved in localStorage `soilmate.audio`. Sfx: tap nav toggle correct wrong heartLost star complete fail powerUp.
- Tokens sampled from the PDF are in `src/app/globals.css`. Font: Plus Jakarta Sans via @fontsource.
- Navbar: 7 items from `src/config/site.ts` + Start + sound toggle.

## Backend facts
- Answer response also returns `illustrationFixedKey` (G4) and `resultAnimationKey` (G5) when correct.
- Resume response lacks `firstTryCorrect` and collection item data, so the collection row is empty after a refresh
  (client already supports the optional field; backend change is in docs/BACKEND_CHANGES.md, not applied yet).
- CORS: one origin (`CLIENT_ORIGIN=http://localhost:3000`). Rate limit 100/min/IP, needs `trust proxy` when deployed.
- 331 icon keys (`src/shared/icon-keys.json`); 120 are `scene-*`: FieldScene must map keys to props from ONE data file.
- `npm run mock` = in-memory API with the same shapes (works without MongoDB). `npm run check:icons` = assets missing.

## DONE
Stage 0: setup, tokens, strings, site config, routes, NavBar, GamesPipeline, PageBackground, API layer, audio.
Stage 1 (this zip):
- Shared game UI (`src/components/game`): Mascot (outfits none/cape/doctorCap/raincoat; moods neutral/happy/cheer/oops/
  flying/holdingTrophy), GameTopBar, ProgressBar, Hearts, StarCounter, StreakChip, PointsPop, SpeechBubble,
  QuestionCard (illustration slot + Listen button for G1), AnswerButton/AnswerGrid (row layout G1, tile layout G2-5,
  API order never reshuffled), ActionBar, FeedbackBanner (correct/wrong/skipped), CollectionRow, ExitConfirmModal,
  OutOfHeartsModal. UI primitives: Modal (native dialog), Spinner, ErrorState, OfflineBanner, Icon (fallback icon).
- Result UI (`src/components/result`): ResultShell (confetti + sound), StarsRow, ScoreRing, CollectionGrid,
  RewardChips, RecapChips, ResultButtons.
- State: `src/store/gameStore.ts` (zustand; hearts/streak/points ONLY from server responses).
- Flow: `src/features/learn/hooks/useGameFlow.ts` (load/resume, select, check, skip, try again, continue, finish,
  play again, exit, keyboard 1/2/3 + Enter), `attemptLoader.ts` (de-duplicates start under StrictMode: IMPORTANT).
- Exit guard `src/hooks/useExitGuard.ts`: Next has no router blocker, so beforeunload + history marker (Back) +
  capture-phase link click interception. Leave = abandon attempt then go to the wanted href.
- Pages: `/learn/[slug]` = GamePlayPage (works for all 5 slugs generically), `/learn/[slug]/result?attempt=ID` =
  GameResultPage (in-memory result, else re-calls idempotent complete() so refresh works; redirects to the game if none).
- Game 1 is complete end to end: 6 term icons, badge medals (all 6), Listen (speechSynthesis), score screen.
- Verified with Playwright against the mock API (production build AND `next dev`): load, correct, wrong (heart lost,
  choice disabled, answer hidden), try again, skip, refresh resume, finish, result + refresh, play again, exit modal
  (close, Escape, browser Back, navbar link), out of hearts, offline, single start under StrictMode. All passed.
  NOT tested against the real backend/MongoDB (not runnable in the sandbox).

Stage 2 (this zip): FieldScene + Game 2.
- `src/components/scene/FieldScene.tsx`: one layered SVG (sky + ground/slope + overlays), flat illustration style.
  Props soil(9) sky(9) slope(3) overlays(15 incl. spade, hand) + view: field | regional (map from above) | closeup (zoomed).
  Drawn in a 320x150 box, shown with aspect 13/5 and `slice`. A small pill labels the view ("Regional view" ...).
- `scenes.ts`: maps scene keys to props. All 30 `scene-g2-*` keys are done. Unknown keys fall back to a default + dev warning.
  Games 4 and 5 (`scene-g4-*`, `scene-g5-*`, 90 keys) are NOT mapped yet: add them in stages 4/5 (same file).
- Dev gallery: `/dev/scenes` (development only) shows every preset. Use it to review new scene mappings.
- Icons: choice-satellite, choice-both-together, choice-on-the-ground, result-satellite-and-farmer (+ `characters.tsx`
  Farmer and SatelliteBot), and all 19 `ui-*` keys (lucide). 36 / 331 keys now have assets.
- Game 2 screens: scene card via QuestionCard `illustrationVariant="scene"`, answer tiles are stacked on phones and 3 columns
  from sm up (AnswerButton `layout="tile"` is responsive), result screen uses `resultHeroIconKey` (satellite + farmer art),
  "Together, we can do better", RecapChips from the API, Data Detective badge, no collection grid.
- Generic play page already uses a scene for slugs satellite-or-ground, fix-the-field, weather-and-crops (`usesScene`).
- Tested (Playwright, mock API, production build): 58 checks across Game 1, hearts/offline and Game 2, desktop and 390px.
  The browser console shows a 404 for `GET .../attempts/current` on a fresh start: that is the designed "no active round" probe.

Stage 3 (this zip): CropHero + Game 3 (Crop Superpowers).
- `src/components/game/CropHero.tsx`: round hero with cape + mask, crop icon on its belly, glowing aura, twinkling sparkles;
  `powered` (right after a correct answer) = power pose + bigger aura. Decorative (aria-hidden). Motion off for reduced-motion.
- QuestionCard has a third variant `illustrationVariant="hero"` (centered, big). GamePlayPage uses it for crop-superpowers.
- 30 `crop-*` icons: `assets/icons/crops.tsx`, built from templates (Ear, Pod, Flower, Tuft + a few one-offs) so they share
  one style and have no licence/attribution. Size class reaches the <svg> through a React context (`CROP_ICONS`).
  Weakest drawings (could be redrawn later): crop-fodder-maize, crop-millet.
- 9 `power-*` icons: `assets/icons/powers.tsx` (incl. `power-superhero-leaf`, the Next Game button icon of Game 2's result).
- Game 3 flow: `powerUp` sound after `correct`; CollectionRow shows earned power badges; result screen = flying mascot with cape,
  "Superpowers unlocked!", "Collected powers" grid (missed power gets a lock), Crop Hero badge, leaf+star confetti
  (`confetti: 'leaves'` in gameConfig). New per-game `collectionTitle` in gameConfig.
- PointsPop now floats from the middle of the card (it used to cover the hearts on phones).
- Dev tools: `/dev/icons` (every asset + the keys still missing) and `/dev/scenes` (both 404 in production).
- Tested (Playwright, mock API, production build): 72 checks (Games 1, 2, 3, hearts/offline), 430px and 1100px wide.
  Keys with art now: 105 of 331 (`npm run check:icons`).

Stage 4 (this zip): Game 4 (Fix the Field).
- Scenes: all 60 `scene-g4-*` keys are generated in `components/scene/scenes.ts` from ONE table (`G4`, 30 rows). Each row makes
  `scene-g4-<name>-problem` (field/regional + a worried cloud, `worriedCloud` overlay) and `-fixed` (lush green + sun + positive
  overlays). Add or change a problem = edit one row. `check-the-ground` uses the regional (map) view.
- `components/scene/FieldSceneFade.tsx`: problem scene with the fixed scene fading in on top (1 s; instant with reduced motion),
  shown only while `phase === 'feedbackCorrect'` and `lastFeedback.illustrationFixedKey` exists. A skip keeps the problem scene.
  The pill switches to "Field healed!" (`FieldScene healed`).
- Icons: 40 `fix-*` + `magnifier-field` + `cloud-sun-drop` in `assets/icons/fixes.tsx` (shared bits: Soil, Sprout, Drop, Sun,
  Cloud, Scissors, Tractor, Sheep, Coin, Can, Tree). 30 `tile-*` in `assets/icons/tiles.tsx`: each tile reuses the art of the
  fix that earns it (TILE_SOURCES map generated from the seed) on a coloured square.
- Mascot has a `bag` prop (medical bag), used on the Game 4 score screen (ResultShell passes it for the doctorCap outfit).
- Worried cloud now has worried (not angry) eyebrows and sits at x=196 so it never overlaps the view label.
- `scripts/check-icons.mjs` understands tiles and the Game 4 table. Now 237 / 331 keys have art.
- Tested (Playwright, mock API, production build): 88 checks over Games 1 to 4 + hearts/offline at 430px and 1100px.
  Game 4 specifics: single scene before answering, crossfade to 2 layers with opacity 1, "Field healed!", tile earned, skip keeps
  the problem scene, score screen ("Fields fixed!", "Field treatments" 6 tiles with soft-dot for missed, Field Doctor badge).

Stage 5 (this zip): Game 5 (Weather and Crops) + the Learn & Play finale. ALL 331 icon keys now have art.
- Scenes: all 30 `scene-g5-*` in `scenes.ts` (table `G5`). Icons: 34 `result-*` (`assets/icons/results.tsx`), 30 `sticker-*`
  (`assets/icons/stickers.tsx`, round sticker + one weather picture), drawing bits in `assets/icons/weather.tsx`
  (Snowflake, WindLines, Moon, Star, Bug, Plant, Arrow, Cracks, Leaf). `fixes.tsx` now exports its shared bits (Svg, Soil, Sprout,
  Drop, Sun, Cloud ...). `npm run check:icons` reports 331 / 331.
- Result animations: `components/scene/SceneAnimation.tsx` has 12 presets (heat-wilt, dry-soil, wash-away, frost-damage, evaporate,
  healthy-growth, recover, slow-growth, disease-spread, flood, spoil, wind-damage) picked by `resultAnimationKey`; unknown key = soft
  green tint. Reduced motion = a still colour wash. `FieldSceneEffect` = scene + animation overlay, shown while
  `phase === 'feedbackCorrect'`. Preview them at `/dev/animations` (dev only).
- Game 5 score screen: raincoat mascot under a rainbow (`RainbowHero`, `resultRainbow` in gameConfig), "Weather sticker collection".
- Finale: `components/result/FinaleSection.tsx` renders `result.finale` (5 badge medals in one row, locked ones greyed with a lock).
  allGamesDone true: "You finished Learn & Play!", chips "+N total points", "5 games done", "Badge: Soil Expert", buttons Back to Home,
  Start Exploring My Land (/explore), Play Again. allGamesDone false: "Keep going!", link "Next: <first unfinished game>" (from
  GET /games), Play Again, Back to Games. Game 5 result shows the finale INSTEAD of ResultButtons.
- ResultShell `big` = a larger two-sided confetti burst + extra sound for the finale (only when allGamesDone).
- Tested (Playwright, mock API, production build): 109 checks, 6 suites: Games 1 to 5, hearts/offline, finale in both states
  (fresh player with only Game 5 done, then all 5 done), 430px and 1100px wide. Two throw-away scripts were used; not in the repo.

Stage 6 (this zip): the real Hub page `/learn`.
- `features/learn/components/LearnHubPage.tsx` + `components/hub/` (GameCard, GameCardSkeleton, MasterBadgeCard, SoundSwitches).
  Header (mascot, "Learn & Play", subtitle, total points chip from GET /players/me/progress, "New questions every time"), separate
  Music / Sound effects switches (role="switch", saved in localStorage; the navbar button stays the master mute), Soil Expert card
  (locked until all 5 badges: "N of 5 badges · N of 5 games done"), 5 cards sorted by position (icon, title, status Not started /
  In progress / 1-3 stars, chip "6 terms · 5 per round" for Game 1 and "30 questions · 6 per round" for the rest, chip "Seen x/y",
  badge locked/earned, button Play or Play again), 5 skeleton cards while loading, ErrorState + Retry when the API fails, and the
  "Start over" link: confirm modal -> POST /players/me/reset -> clears gameStore and cached results, refetches, shows
  "Progress cleared. Fresh start!".
- "In progress" = never completed but `questionsSeen > 0` (the API has no "active attempt" flag).
- Hub queries use `useGamesQuery({ fresh: true })`: refetch on every open. (Found by the tests: after leaving a game unfinished the hub
  showed stale Seen/In progress for up to 30 s.)
- `ResultShell` removes leftover confetti (`confetti.reset()`) when you leave the score screen.
- `gameConfig.hubIconKey` per game (term-ndvi, satellite, power-superhero-leaf, magnifier-field, cloud-sun-drop).
- Hub has no Stitch design: it follows the game's tokens/components. A designer may want to restyle it.
- Tested (Playwright, mock API, production build): 134 checks over 7 suites (new: 25 for the hub: skeletons, order, chips, switches,
  earned card after Game 1, In progress, start-over keep/confirm, error + retry, desktop).

Stage 7 (this zip): polish and quality. THE PLAN'S LAST STAGE IS DONE.
- Accessibility: axe-core reports 0 violations on 20 screens/states (hub, hub with progress, start-over dialog, each game's question /
  wrong / correct state, score screen, finale). Fixes made: `--color-ink-soft` darkened to #4d6b5d (>= 4.7:1 on every surface),
  progress bar has a name, pipeline links use their visible text as the name (completed ones read "Title (Complete)"), confetti
  draws on our own aria-hidden canvas inside <main>.
- Keyboard: skip link is the first Tab stop (the pipeline used scrollIntoView, which moved the Tab start point: now it scrolls the
  row manually); Tab -> answer -> Space -> Check -> Enter, focus jumps to Continue / Try again; 1/2/3 select enabled answers;
  `RouteFocus` puts focus on `<main id="main" tabIndex={-1}>` after client-side navigation (not on first load).
- Reduced motion: background animation off, no confetti drawn, framer animations instant, score screen unchanged.
- `app/error.tsx` (friendly crash screen with Retry) and `app/loading.tsx`.
- Unit tests (Vitest, `npm test`, 31 tests): gameStore, API client (X-Player-Id, error mapping, blocked localStorage), attemptLoader
  (single request under Strict Mode), art coverage (every icon key has art, scene presets are real keys, game config chain).
- Browser tests are now in the project: `client/e2e/*.py` (see e2e/README.md): 149 checks + axe, all passing against the mock API.
- Removed unused `msw`; `@types/node` is 22 (vitest needs it). `npm audit --omit=dev`: 0 vulnerabilities (8 moderate findings are
  only in dev tooling: eslint's minimatch).
- Full README rewritten.

## NOT done / what to do next (outside the 7 stages)
1. **Run everything against the REAL backend** (never done: MongoDB is not available in the sandbox). Start `server/` with Atlas,
   `npm run seed`, set `CLIENT_ORIGIN=http://localhost:3000`, run the client and play all 5 games. Compare with the mock; fix any
   difference in response shape (the mock was written from reading the backend code, so it should match).
2. Apply `docs/BACKEND_CHANGES.md` (firstTryCorrect on resume, `trust proxy`). Then the collection row can be restored after a refresh
   (needs the collection item data too, or a lookup by question key).
3. Deployment: `NEXT_PUBLIC_API_URL` at build time, backend CORS origin, trust proxy.
4. The rest of the website (Home, Explore Land, My Farm, Rotation Lab, Future Farm, Dashboard) reuses `src/config/site.ts`, the tokens,
   NavBar, PageBackground, Button/Modal/Icon and the audio provider.
5. Optional polish: redraw crop-fodder-maize, crop-millet, result-slow-growth; the Hub has no Stitch design (it follows the games' style);
   `/learn/<slug>/result` shows nothing without `?attempt=` (it redirects to the game, by design).
6. Small known UX note: on tall cards the sticky footer can cover the answer tiles while the banner is open (scroll to see them).
7. There is no volume slider (music and effects are on/off only). Art is complete (331 / 331).

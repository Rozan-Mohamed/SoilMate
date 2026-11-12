# Browser tests (Playwright for Python)

These scripts drive a real Chromium against the running app and the mock API. They were used to check every stage.

## One-time setup
```bash
pip install playwright && playwright install chromium
```

## Run
Open three terminals in `client/`:
```bash
npm run mock                         # 1. the mock API on :4000
npm run build && npx next start -p 3111   # 2. the production build on :3111
python3 e2e/hub.py                   # 3. any script below (each prints PASS / FAIL lines)
```
Scripts: `game1-flow`, `hearts-offline`, `game2-flow`, `game3-flow`, `game4-flow`, `game5-and-finale`, `hub`,
`keyboard-focus-motion`, `axe-accessibility` (needs `npm install` first for axe-core).

Screenshots go to `/tmp/soilmate-e2e/` (change with `SHOTS=/some/folder`).
The mock keeps data in memory per player, so start a fresh `npm run mock` if a script reports unexpected progress.
The expected `404` from `GET .../attempts/current` is ignored: it is the normal "no round in progress" answer.

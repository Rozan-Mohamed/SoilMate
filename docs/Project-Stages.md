# SoilMate Website — Staged Build Plan (Next.js · Vercel-safe)

## HOW TO USE THIS FILE (for the developer)

Every stage below is **independent**: run each one in its **own chat / its own Claude account**, in any order or in parallel.

For each stage, open a fresh chat and attach:
1. this file (`SOILMATE_WEBSITE_STAGES.md`)
2. `api-contract.md`
3. `updated-fronted-notes.md`
4. `website_ui.pdf`
5. the current frontend project (zip) that already contains the game

Then send exactly this message (change the stage name):

> Read SOILMATE_WEBSITE_STAGES.md fully. Do **STAGE 3 only**. Follow GLOBAL RULES and the shared-kit interface exactly. Do not touch any file outside that stage's "OWNS" list. Return the complete files.

Copy the returned files into the repo. Because each stage owns different paths, merging is a plain copy with no overwrites.

Order if you want zero surprises: **0A + 0B first (or in parallel with the others), then everything else, then STAGE 9 last.** All stages can be built before 0A/0B exist, because the shared-kit interface is fixed below; the project only builds once 0A and 0B are in.

| Stage | What | Owns |
|---|---|---|
| 0A | Data layer: API client, guest id, token, auth + journey providers, deps, env, next.config | `lib/soilmate/**`, `providers/**`, `package.json`, `next.config.*`, `.env.example` |
| 0B | UI kit, design tokens, Navbar, root layout wiring | `components/ui/**`, `components/layout/**`, root layout, global styles |
| 1 | Sign Up + Log In | `app/signup`, `app/login`, `components/auth/**`, `lib/auth/**` |
| 2 | Home | `app/page.tsx`, `components/home/**` |
| 3 | Profile | `app/profile`, `components/profile/**`, `lib/profile/**` |
| 4A | Explore Land (map + cards) | `app/explore`, `components/explore/**` (not `detail/`), `lib/explore/**` |
| 4B | Explore Land pop-ups (4 layer details) | `components/explore/detail/**`, `lib/explore-detail/**` |
| 5 | My Farm form | `app/farm`, `components/farm/**`, `lib/farm/**` |
| 6 | Rotation Lab (+ first pop-up form) | `app/lab`, `components/lab/**`, `lib/lab/**` |
| 7 | Compare Plans | `app/compare`, `components/compare/**`, `lib/compare/**` |
| 8 | Dashboard + Report | `app/dashboard`, `components/dashboard/**`, `lib/dashboard/**` |
| 9 | Integration + Vercel check | only small fixes anywhere; produces the checklist report |

---

# GLOBAL RULES (apply to every stage)

## G1. Sources of truth
1. `api-contract.md` = exact request/response shapes, enums, error codes. Never invent a field.
2. `updated-fronted-notes.md` = which mockup labels to keep (✅), replace (🔁) or remove (❌). Follow it per screen.
3. `website_ui.pdf` = **visual look only** (layout, spacing, colors, radii, component style). Its text and numbers are demo content. Never hard-code Alex Henderson, Cedar Valley, Field #12, NPK, yield, $ figures, plot counts, etc.
4. English UI only. All option labels, crop names, goal labels, metric titles come from the API.

## G2. Stack and existing project
- Next.js, App Router (`app/`). **Before writing anything, inspect the project**: router type, `src/` or not, TypeScript or JS, styling approach (Tailwind / CSS Modules / plain CSS), existing fonts, existing routes (the game), existing Navbar, existing `package.json` dependencies. Match all of it. If the project does not use the App Router, stop and report before writing code.
- Use the `@/` import alias if the project has it. In this file, `<src>/` means `src/` if it exists, otherwise the project root.
- Never modify, move or delete game files (routes, components, services, styles). The game keeps working exactly as before.
- No new dependencies in stages 1–9. Everything needed is installed by Stage 0A (see 0A). Charts are hand-written responsive SVG. If you believe something is missing, do not install it: write it under "Requests for Stage 0/9" in your report.

## G3. No-conflict ownership (the most important rule)
- Create and edit **only** the paths in your stage's OWNS list.
- Shared files are owned by 0A/0B only: `package.json`, lockfile, `next.config.*`, `tsconfig`, Tailwind config, root `layout`, global CSS, `.env*`, Navbar.
- Never create a second `page` file for a URL that already exists. Check the existing route list first.
- Do not add global CSS. Use the project's existing styling approach, scoped to your components. If you must name classes, prefix them with your stage's folder name (`lab-`, `farm-`, …).
- File names: exact case, consistent. Vercel runs on Linux, which is case-sensitive: `Navbar.tsx` and `navbar.tsx` are different files, and a wrong-case import builds locally on Windows/macOS but fails on Vercel.
- Do not duplicate shared helpers inside your folder (API client, guest id, token). Import them from the shared kit. Feature-specific helpers (for example a crop picker inside the Lab) live inside your own folder; duplicating UI between stages is intentional and fine.

## G4. Shared-kit interface (fixed; implemented by 0A and 0B, imported by everyone)

Paths are relative to `<src>/`. Import with `@/…`.

### 0A — `lib/soilmate/*` and `providers/*`
```ts
// lib/soilmate/config.ts
export const API_BASE: string;                 // process.env.NEXT_PUBLIC_API_BASE, no trailing slash
export const USE_MOCK_PLANNED: boolean;        // NEXT_PUBLIC_MOCK_PLANNED === "true"
export function apiUrl(path: string): string;  // `${API_BASE}/api${path}`

// lib/soilmate/storage.ts  (SSR-safe: never throws, returns null on server)
export function safeGet(key: string, area?: "local" | "session"): string | null;
export function safeSet(key: string, value: string, area?: "local" | "session"): void;
export function safeRemove(key: string, area?: "local" | "session"): void;

// lib/soilmate/guest.ts  (client only)
export function getOrCreateGuestId(): string | null;   // crypto.randomUUID(), kept in localStorage, never regenerated while it exists
export function clearGuestId(): void;
export function resetGuestId(): string | null;         // new id (used after logout)

// lib/soilmate/token.ts
export function getToken(): string | null;
export function setToken(token: string, remember: boolean): void; // remember → localStorage, else sessionStorage
export function clearToken(): void;

// lib/soilmate/errors.ts
export class ApiError extends Error {
  status: number; code: string; details?: unknown;
  issues: { path: string; message: string }[];    // from details.issues, [] if none
}
export function fieldErrors(err: unknown): Record<string, string>; // strips leading "body."/"query."/"params."
export function friendlyMessage(err: unknown): string;             // never shows raw codes; handles RATE_LIMITED, UNAUTHENTICATED, INTERNAL, network errors

// lib/soilmate/api.ts
export type AuthMode = "none" | "identity";
//  "none"     → public endpoints, no identity header (also use for the game: the game keeps its own X-Player-Id helper)
//  "identity" → token exists ? `Authorization: Bearer <token>` : `X-Guest-Id: <guestId>` (never both)
export function apiFetch<T = unknown>(path: string, opts?: {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  auth?: AuthMode;               // default "identity"
  headers?: Record<string, string>;   // extra headers, e.g. X-Guest-Id on signup/login (see AuthProvider)
  signal?: AbortSignal;
}): Promise<T>;                  // 204 → undefined. Throws ApiError. identity calls use cache:"no-store". 401 with a token → clearToken() + window event "soilmate:unauthorized".

// lib/soilmate/types.ts — shared types only (from contract sections 0, 1, 2, 3, 4, 5, 10)
export type CenterId = "desouk" | "sidi_salem" | "baltim";
export type Slot = "fall_winter" | "spring" | "summer_fall";
export type Me; export type Farm; export type Crop; export type MetaOptions; export type JourneyStep; export type Journey;
// Feature-specific response types (rotation, plans, dashboard, explore layers…) live in each stage's own folder.

// providers/AuthProvider.tsx
export function AuthProvider(props: { children: React.ReactNode }): JSX.Element;
export function useAuth(): {
  status: "loading" | "guest" | "account";
  user: Me | null;
  // Stage 1 calls this after a successful POST /auth/signup or /auth/login. It stores the token (remember flag),
  // stores user, deletes guestId ONLY when response.guestData is present, then refreshes journey. Returns guestData.
  applyAuthResponse(resp: { token: string; user: Me; guestData?: "adopted" | "discarded" | "none" }, remember: boolean): "adopted" | "discarded" | "none" | undefined;
  logout(): Promise<void>;              // POST /auth/logout (ignore failure) → clearToken → resetGuestId → user=null → refresh journey
  refreshUser(): Promise<void>;         // GET /me (account only)
  setUser(u: Me): void;                 // used by Profile after PATCH /me
};

// providers/JourneyProvider.tsx
export function JourneyProvider(props: { children: React.ReactNode }): JSX.Element;
export function useJourney(): {
  steps: JourneyStep[]; nextRoute: string; loading: boolean;
  refresh(): Promise<void>;
};
// GET /journey is [PLANNED]. Fallback when it returns 404/502 or USE_MOCK_PLANNED is true: derive the same shape from GET /farm
// (explore done when centerId is set; farm done when setupStatus==="complete"; lab+compare unlocked when farm is complete; dashboard locked).
```

### 0B — `components/ui/*` and `components/layout/*`
```ts
// components/ui/index.ts re-exports all of these. All are client-safe, accessible, keyboard friendly.
Button({ variant: "primary" | "secondary" | "ghost" | "danger", size?, loading?, iconRight?, iconLeft?, ...buttonProps })
TextField({ label, error?, hint?, iconLeft?, type?, ...inputProps })        // password type has a show/hide eye toggle; error text under the field
Card({ children, className? })
Chip({ selected?, disabled?, onRemove?, children })
Badge({ tone: "neutral" | "good" | "warn" | "orange" | "info", children })
Modal({ open, onClose, title, children, footer?, size?: "sm" | "md" | "lg" })  // focus trap, Esc, backdrop click, scroll lock, role="dialog"
Skeleton({ className? })  Spinner({ size? })
ProgressBar({ value, tone?, label? })
Banner({ tone: "error" | "info" | "success" | "warn", children })             // inline banner
SampleBadge()                                                                  // "Sample scores" pill, shown while status === "placeholder"
DottedTerm({ term, children })                                                 // glossary underline; tap shows `short` + "Play to learn more"

// components/explore/detail/index.ts  (STUB created by 0B, REPLACED by Stage 4B; Stage 4A imports it)
export type DetailLayer = "crop-health" | "soil-moisture" | "heat-stress" | "land-risk";
export function LayerDetailModal(props: { open: boolean; centerId: CenterId; layer: DetailLayer; onClose(): void }): JSX.Element | null;
```

### Route table (fixed)
`/` Home · `/signup` · `/login` · `/profile` · `/explore` · `/farm` · `/lab` · `/compare` · `/dashboard` · `/dashboard/report`. The game keeps its current routes.

## G5. Vercel-safety rules
1. **Client-only APIs** (`window`, `localStorage`, `sessionStorage`, `crypto.randomUUID`, `navigator`) are used only inside `"use client"` components, inside `useEffect` or event handlers, or through the SSR-safe helpers. Never at module top level.
2. `useSearchParams()` / `usePathname()` consumers that render on the server must sit inside `<Suspense>`.
3. Leaflet: load with `next/dynamic(() => import(...), { ssr: false })`. Import Leaflet CSS from inside the client map component. Draw areas as rectangles (`bbox`); no marker images, so no icon-path bugs.
4. Images: crop images are absolute API URLs. Use the project's approach set in 0A's `next.config` (`images.remotePatterns` built from `NEXT_PUBLIC_API_BASE`) or a plain `<img>` with `alt` from the API and a neutral fallback on error. Never import images from outside `/public`.
5. No hard-coded `localhost` anywhere. Only `NEXT_PUBLIC_API_BASE`.
6. User data is never cached on the server: no `fetch` caching, no module-level variables holding user data, no `generateStaticParams` for user pages. User pages are client-rendered (`"use client"` page or a client component that fetches in an effect). This is what lets many accounts/guests use the same deployment safely.
7. Pages must not use Next middleware for auth (guests are allowed everywhere except Profile, which is gated in the client).
8. The code must pass `next build` and `next lint` with zero errors (no unused imports/vars, no `any` leaks that fail strict TS, no missing hook deps that error). Run both before delivering and say so in the report.
9. Dynamic-route and file-system rules: no `[param]` routes in this plan; no duplicate pages for the same URL; no route handlers (`route.ts`) are added (the Express backend is the API).
10. Environment: `NEXT_PUBLIC_API_BASE` (required), `NEXT_PUBLIC_MOCK_PLANNED` (optional, `"true"` uses stage-local mocks for [PLANNED] endpoints). Both are defined in 0A's `.env.example`.

## G6. Product rules (from the notes — never skip)
- Every 👤 call uses `apiFetch(..., { auth: "identity" })`. Public calls use `auth: "none"`.
- Guests can use the whole journey. Only Profile needs an account. No "log in to continue" gates.
- Show `areaWarning` on land-data blocks, "Latest reading: <month year>" from `dataThrough`, and "Sample scores" while `status === "placeholder"`.
- Never display yield, profit, $, % fertilizer saved, NPK, pH, plot counts, live weather. Never describe scores as predictions.
- Every screen has: loading skeletons, empty state, error banner (via `friendlyMessage`), and works at 375 px width up to desktop.
- Color is never the only signal: always show the word too.
- Buttons that call the API are disabled while loading; double submit is impossible.
- Mocks (Stages 6, 7, 8 only): put them in `lib/<stage>/mock.ts`, return `status: "placeholder"`, use them only when the real endpoint answers 404 or `USE_MOCK_PLANNED` is true. They must never ship as hard-coded UI content.

## G7. Report format (end of every stage)
Reply with: (1) the file tree you created, (2) the complete code of every file, (3) the exact `.env` keys used, (4) what you verified (build, lint, the manual test list below), (5) "Requests for Stage 0/9" (anything you needed from shared files), (6) assumptions you made. Keep prose short.

Manual test list for pages that touch the API: (a) fresh browser as guest, (b) after sign up/log in, (c) a second browser with another guest id at the same time shows different data, (d) API down → error banner, no crash, (e) 375 px width.

---

# STAGE 0A — Data layer (run first, or in parallel)

**Goal:** implement the shared kit in G4 "0A" so every other stage can import it.

**OWNS:** `lib/soilmate/**`, `providers/AuthProvider.tsx`, `providers/JourneyProvider.tsx`, `package.json` + lockfile, `next.config.*`, `.env.example`.
**Does NOT touch:** pages, components, layout, styles, game code.

**Build**
1. Implement every export in G4 "0A" with exactly those names and signatures.
2. `api.ts`: error parsing per contract 0.1 (`{ error: { code, message, details } }`); if the body is not JSON, throw `ApiError` with code `INTERNAL`; network failure → `ApiError` with code `NETWORK`. 429 → `friendlyMessage` says "Too many requests, please wait a moment". Header rules from notes section 0: token → `Authorization` only; otherwise `X-Guest-Id`; never both; never add either to the game's calls. Allow `opts.headers` so Stage 1 can send `X-Guest-Id` on `/auth/signup` and `/auth/login` (when a guest id exists) even though no token is sent.
3. `AuthProvider`: on mount, if a token exists → `GET /me`; on 401 clear token and become guest. No token → `status:"guest"` and make sure a guest id exists. Listen to `"soilmate:unauthorized"`. `applyAuthResponse` implements notes 0A step 5; `logout` implements step 6. Token storage per notes: `rememberMe` true → localStorage, false → sessionStorage.
4. `JourneyProvider`: call `GET /journey` once on load, and again after login/signup/logout (re-fetch when the auth identity changes). Fallback as described in G4. Never cache across identities.
5. `package.json`: add the **only** extra dependencies the whole plan needs: `leaflet` and `@types/leaflet` (if TS). No chart library. No state library. Do not upgrade existing packages.
6. `next.config.*`: keep existing settings. Add `images.remotePatterns` derived from `NEXT_PUBLIC_API_BASE` (protocol + hostname + `pathname: "/static/**"`), guarded so the build does not fail when the variable is missing.
7. `.env.example`: `NEXT_PUBLIC_API_BASE=http://localhost:5000` (local example only) and `NEXT_PUBLIC_MOCK_PLANNED=false`, with a comment about Vercel.

**Done when:** `next build` passes with the kit alone; `apiFetch` unit-style check shows the right header for guest vs token; two browsers get two different guest ids.

---

# STAGE 0B — UI kit, Navbar, layout (run first, or in parallel)

**Goal:** implement the shared UI kit in G4 "0B", update the existing Navbar, wire providers into the root layout.

**OWNS:** `components/ui/**`, `components/layout/**` (Navbar and its parts), the root `layout`, the global stylesheet / Tailwind theme, `components/explore/detail/index.ts` (stub only).
**Does NOT touch:** pages, `lib/**`, `providers/**` (import them), game files except the shared Navbar.

**Design tokens (from the mockups; check the project's existing tokens and font first and reuse them)**
- Page background: very light mint (about `#EEF9EA`). Cards: white, large radius (24 px), soft shadow. Primary dark green (about `#173D26`) for buttons and headings. Bright accent green (about `#62F08B`) for highlight words on dark photos. Tone pills: green (good), amber (moderate), orange (needs checking), grey (neutral). The typeface looks like Plus Jakarta Sans: use whatever font the project already loads, and only add it through the project's existing font setup if the game does not already use it.
- Inputs: pill-shaped, light green fill, icon on the left, label above. Buttons: pill-shaped.

**Root layout**
- Mount `<AuthProvider><JourneyProvider>…</JourneyProvider></AuthProvider>` around the existing content, keeping every existing provider and the game's own providers/wrappers in place. Do not remove anything the game needs.
- Render the Navbar once, in the same place the existing one is rendered. There must be exactly **one** Navbar in the whole site.
- The Navbar is hidden on `/login` and `/signup` (those pages are full-bleed split screens).

**Navbar (modify the existing one; do not rebuild it from scratch)**
- Keep: logo "SoilMate", pill container style, active underline, the "Learn & Play" dark pill, the mute/unmute control and its behaviour, and every link that already works.
- Links, in order, mapped to routes: Home `/`, Explore Land `/explore`, My Farm `/farm`, Rotation Lab `/lab`, Compare Plans `/compare`, Dashboard `/dashboard`, then Learn & Play (existing route, unchanged). If the existing bar already has an item that is clearly the same page under another name (for example "Future Farm"), keep that label and point it to the matching route, and do not add a duplicate. If it is unclear what an existing item is, keep it as it is and list it in "assumptions" in your report.
- `useJourney()`: steps with `status: "locked"` are shown disabled (not clickable, with a tooltip "Complete the previous step"). Done/current steps are normal links. Never hide steps for guests.
- **Remove the "Start" button.** In its place (right side, after the mute control):
  - `status === "loading"`: a small skeleton (no flash of the wrong state).
  - `"guest"`: a "Log in" ghost button → `/login` and a "Sign up" primary pill → `/signup`.
  - `"account"`: a round avatar button (image from `user.avatarUrl`, otherwise initials from `user.fullName`) opening a small menu: "My Profile" → `/profile`, "Log out" (calls `useAuth().logout()` then goes to `/`). Close on Esc and outside click.
- Mobile: a hamburger menu with the same items and the same right-side actions. Active link is based on `usePathname()` (nested routes like `/dashboard/report` keep Dashboard active).

**Stub:** create `components/explore/detail/index.ts(x)` exporting `LayerDetailModal` that renders a simple `Modal` saying "Details coming soon". Stage 4B replaces this file.

**Done when:** all UI kit components render in a throwaway test page you do **not** commit; `next build` passes; Navbar shows the 3 states correctly; the game pages still render with the same Navbar.

---

# STAGE 1 — Sign Up and Log In

**OWNS:** `app/signup/page.tsx`, `app/login/page.tsx`, `components/auth/**`, `lib/auth/**`, plus the image file `public/images/auth/*` (only if you add one).
**Reads:** contract section 1; notes section 1 and 0A; mockups "Sign up" (screen 1) — **the Log in page must copy the Sign up layout, not the glass-card login mockup (screen 2).**

**Layout (both pages, one shared component `AuthShell`)**
- Full screen split. Left half: farm landscape photo with a dark gradient, SoilMate pill logo top-left, headline "Understand Your Land." in white and "Grow a Better Future." in bright green. Right half: light mint background with the title, a one-line subtitle, a white rounded card with the form, and a link line under the card.
- On mobile: the photo becomes a short banner at the top (or is dropped) and the form fills the screen.
- Image: use `/images/auth/hero.jpg` if it exists in `public/`; otherwise a dark green CSS gradient fallback so the build never breaks on a missing file. Say in the report which file the developer should drop in.

**Sign Up** (`/signup`) — title "Let's Grow Together", subtitle "Create your account to explore your land and plan your crops with science-backed rotation."
- Fields: Full Name, Email Address, Password (eye toggle; show the hint "8–72 characters, at least 1 letter and 1 number"), Confirm Password (eye toggle), Terms checkbox.
- Terms text: "I agree to SoilMate's Terms of Service and Privacy Policy regarding how your account and farm data are stored." (the mockup's "satellite crop telemetry" is replaced). The links may be `#` placeholders if no pages exist; say so in the report.
- Button "Create Account →" disabled until the checkbox is checked and the form is not loading.
- Request: `POST /auth/signup` with `fullName, email, password, confirmPassword, acceptedTerms: true`, plus header `X-Guest-Id` when a guest id exists (via `opts.headers`). Placeholder email is placeholder styling only, never a value.
- Link line: "Already have an active SoilMate account? **Log in here**" → `/login`.

**Log In** (`/login`) — title "Welcome Back", subtitle "Your farm journey continues here."
- Fields: Email Address (email only; no "username"), Password (eye toggle), "Remember me" checkbox, "Forgot password?" link.
- Button "Log In →". Request: `POST /auth/login { email, password, rememberMe }` plus `X-Guest-Id` header when a guest id exists.
- Link line: "New to SoilMate? **Create an Account**" → `/signup`.
- "Forgot password?" opens a `Modal` with an email field → `POST /auth/forgot-password`, then always shows: "If this email is registered, you will receive reset instructions."

**Both pages**
- A visible "Continue as guest" link → `/explore`, with the line "No account needed to start. Create one later to keep your farm on any device."
- After success: `const gd = useAuth().applyAuthResponse(resp, rememberMe)`; if `gd === "discarded"` show a one-time notice "We kept the farm saved on your account." (a short banner/toast shown on the next page is acceptable; keep it simple, for example through `sessionStorage` key `soilmate:notice`, read and cleared by Stage 1's own small component only). Then `GET /journey` via `useJourney().refresh()` and `router.push(journey.nextRoute)`; if it fails, go to `/explore`.
- If already logged in, visiting `/login` or `/signup` redirects to `/profile`.
- Errors: 400 → per-field messages with `fieldErrors`; 409 `EMAIL_ALREADY_REGISTERED` → under email with a "Log in instead" link; 401 `INVALID_CREDENTIALS` → one banner "Email or password is incorrect."; 429 → "Too many tries. Please wait a few minutes." A failed login must not touch the guest id.
- Client-side checks before the call: required, valid email, password rule, confirm match. Server messages still win.

**Done when:** sign up as a guest with a saved farm moves the farm (`guestData: "adopted"`) and the guest id is removed only in that case; login with an account that already has a farm shows the "kept" notice; Navbar flips to the avatar immediately.

---

# STAGE 2 — Home

**OWNS:** `app/page.tsx`, `components/home/**`.
**Reads:** notes section 3; mockups "HOME" (hero, "From Satellite Pixels to Seasonal Harvest", "Why Farmers Trust NASA Data", CTA band, footer). No API calls.

- **First check:** if `app/page.tsx` already exists and belongs to the game, do not overwrite it. Stop and tell the developer, with the list of existing routes. If it is only a placeholder, replace it.
- Sections: hero (photo background with rounded corners, pill tag, headline, supporting text, "Get Started Free →"), 5 step cards (Explore, Understand, Experiment, Compare, Plan; the last card is dark), "Why Farmers Trust NASA Data" (3 cards), CTA band with the address field, footer.
- **Text changes (mandatory, from the notes):**
  - Hero text: "SoilMate turns NASA satellite data into simple, everyday decisions for your fields. No complex graphs, just clear guidance for healthier soil and better-informed decisions." Side line: "NASA satellite data, made simple."
  - Card 1 "Look Beneath the Surface" → "See how wet or dry your area has been, without leaving home."
  - Card 2 "Spot Issues 2 Weeks Early" and "+14 Days Headstart" are removed. Replace with "See Changes Over Time": monthly vegetation and soil moisture trends since 2015.
  - Card 3: "Compare rotation options that include nitrogen-fixing crops." Remove "up to 35%" and "+42 kg/ha".
  - Remove "Continuously verified by NASA Harvest Program" and any decorative numbers (24.8%, 92% yield).
  - CTA band: the address input is not supported by the API. Replace with a button "Explore Your Area →" (→ `/explore`) and a line "Desouk, Sidi Salem and Baltim, Kafr El-Sheikh."
  - Footer: "© 2026 SoilMate. Powered by NASA MODIS, SMAP and POWER data." Footer links only to pages that exist; remove "Soil Regeneration API".
  - Add: "No account needed to start. Create one later to keep your farm on any device." and "A decision-support tool. It does not replace your own knowledge or local experts."
- "Get Started Free" and the CTA go to `useJourney().nextRoute` when it is ready, otherwise `/explore`. Works for guests and accounts.
- Hero image: `public/images/home/hero.jpg` if present, else gradient fallback.

**Done when:** no unsupported claim from the notes remains; page is fully static-renderable except the button target.

---

# STAGE 3 — Profile

**OWNS:** `app/profile/page.tsx`, `components/profile/**`, `lib/profile/**`.
**Reads:** contract sections 2, 3, 4, 5; notes section 2; mockup "My Profile".

- **Guests:** do not call `/me`. Show a centered card "Create an account to keep your farm and edit your profile" with Sign up / Log in buttons. Account only after `useAuth().status === "account"`.
- **On load (account):** `GET /farm`, `GET /meta/options`, `GET /crops?use=current` (and `useAuth().user` for `/me`; call `refreshUser()` if stale).
- **Header card:** avatar (initials when `avatarUrl` is null), name, email, "Verified" badge only when `emailVerified` is true. Avatar upload and "Edit Profile"/share buttons that have no backend are hidden or disabled. The top "Preferences" button is hidden.
- **Personal Information:** Full Name (editable), Email (read-only), Phone (optional, `+` and 7–15 digits; empty sends `null`) → `PATCH /me`.
- **Account Settings:** "Password — Last updated N months ago" computed from `passwordChangedAt`; **Change Password** modal (current, new, confirm) → `POST /me/password`; on 204 clear the token and go to `/login` with "Password updated. Please log in again." **Log Out** → `useAuth().logout()` then `/`. **Danger Zone — Delete Account**: modal where the user types their email → `DELETE /me { confirmEmail }`; on 204 clear everything and go to `/`.
- **My Farm Preferences:** Farm Name, Farm Location (free text; show read-only "Data area: Desouk" from `centerId`), Total Land Area + Acres/Hectares toggle (send `value` and `unit` together; both empty → no area), Main Crops chips from `currentCropsDetail` with "+ Add Crop" opening a picker (max 8; label "N selected" instead of "4 active in Rotation Lab"), Primary Water Source (5 fixed options from `options.waterSource`; if `other` show an optional text box max 60 → `waterSourceOther`), Farming Priorities chips from `options.priority[].profileLabel` (max 3; the 4th is disabled).
- **Buttons:** "Save All Changes" / "Save Changes" → `PATCH /me` and `PATCH /farm` in `Promise.all`, report which part failed and keep the other saved. "Reset Defaults" reloads the saved values from the API (frontend only). Remove the line "Local preferences stored with continuous sync".
- Validation messages from `details.issues` under each field (strip `body.`).

**Done when:** a guest never triggers a `/me` call; saving updates the Navbar name/initials through `setUser`.

---

# STAGE 4A — Explore Land (map + cards)

**OWNS:** `app/explore/page.tsx`, `components/explore/**` **except** `components/explore/detail/**`, `lib/explore/**`.
**Reads:** contract section 6; notes section 4 (the most important screen) and section 9; mockup "Farm" (first two screens). The four pop-ups are Stage 4B; import them from `@/components/explore/detail` (`LayerDetailModal`, see G4).

- **Header:** tag "Geospatial Explorer", "Let's Explore Your Land", "Step 1 of 5 · Explore Your Land". Search box placeholder "Search Desouk, Sidi Salem or Baltim" (`GET /centers?q=` debounced ~250 ms; empty result shows `coverageNote`). Under it, the 3 areas as selectable cards/tabs. No lat/lon text from the mockup.
- **Calls on load (public, `auth:"none"`):** `GET /centers`, `GET /map/layers`, `GET /map/layers/:layerId` (default `crop_health`), `GET /glossary`. On area pick: `GET /centers/:centerId/overview` and `PUT /farm/center { centerId }` (identity). Layer switch: `GET /map/layers/:layerId`. Skip layer 5 (`available:false`): show it greyed with `unavailableReason`; never call its endpoint.
- **Map:** Leaflet through `next/dynamic` `ssr:false`; each area is a rectangle from `bbox = [west, south, east, north]` → bounds `[[south, west],[north, east]]`; fill from `fillHex`, or shade by rank when `fillHex` is null (heat); NDVI layer also draws a small face (`face`), the name and `valueLabel`. Legend built from the layer's `legend`. Layers panel (1–5) as in the mockup. Selected area highlighted. Always show the word with the color.
- **Selected-area floating card:** name, soil-moisture word from `overview.soilMoisture.satellite.label`, greenness tile (`display` + `chip.label`), hot days. Remove area/hectares, cover, soil type, yield, ground temp.
- **Top tiles:** greenness, green months (last 12), soil moisture word, hot days (≥35 °C).
- **Lower cards:** "Typical heat" (`avgHighC`, `avgLowC`, `hottestDay`), "Last 4 months" (`lastMonths[]` short + ndvi + `fillHex`), **Soil moisture card** (two needles from `satellite` and `model`, `texts.satelliteLine/modelLine/last12Line`, `texts.disagreeNote` when the states differ, `confidenceLabels`), **Land risk card** (score out of 3, `level`, `levelHex`, 4 `indicators`, `notice`). Remove Soil Health & Nutrients (N/P/K/pH), Farm Performance ring, the Field 4/Field 2 photo panel, "Clear Sky", "Recalibrated".
- **Detail pop-ups:** tiles/cards have an "Open details" action → `<LayerDetailModal open centerId layer onClose />`. Do not build the pop-up content.
- **Always visible:** `areaWarning`, "Latest reading: <month year>" from `dataThrough`, `disclaimer`, `footer`, heat caveat text next to heat numbers, and the info line "Different methods, different results" where NDVI and land risk appear together.
- **Glossary:** underline glossary terms in API text via `DottedTerm`.
- **Bottom CTA band:** "Tell us about your farm" → `/farm`; "Open in Rotation Lab" enabled only when the journey `lab` step is not locked, otherwise disabled with "Complete My Farm first". Text: "Tell us about your farm to compare crop rotation options for this area."
- Rate limit 429 → wait `RateLimit-Reset` seconds then retry once. Responses are cached by the browser (ETag); do not add your own cache.

**Done when:** choosing an area writes `PUT /farm/center` once, the journey updates, the map renders without an SSR error on Vercel.

---

# STAGE 4B — Explore Land pop-ups

**OWNS:** `components/explore/detail/**` (replaces the stub's content, keeping the same export), `lib/explore-detail/**`.
**Reads:** contract section 6 "Layer detail endpoints"; notes section 4 "Detail pop-ups". Charts are hand-written responsive SVG. No chart library.

Export `LayerDetailModal({ open, centerId, layer, onClose })` from `components/explore/detail/index.ts(x)` (same path and name as the stub). Data is fetched only when `open` is true (public, `auth:"none"`):
- **crop-health** → `GET /centers/:centerId/layers/crop-health` — 5 steps with Back / Next / Restart and dots: 1 summary; 2 line chart "When is it green?"; 3 bar chart "Bare months"; 4 line chart "Greener or not?"; 5 six insight lines. Charts include all 3 areas, selected one thick, others faded. Show NDVI with 2 decimals everywhere (never `-0.00`). Print `insights[].text` as is. `?include=monthly` only if the contract needs it; handle its special `details.include` error.
- **soil-moisture** → calendar with a year slider (SMAP row + POWER row, grey = no data), typical year, years strip (2015 and 2025 drawn as partial years), agreement (always show the level word with the `numbers` sentence), root zone, one summary (observed / may mean / to verify). Never call SMAP a "measurement".
- **heat-stress** → summary values at fixed settings (35 °C, no sliders), with the data caveats from notes near every number.
- **land-risk** → the 4 signs and the report.
- Each pop-up: loading skeleton, error banner, `areaWarning` + "Latest reading", accessible (uses `Modal`), scrolls inside on mobile.

**Done when:** all four layers open for all three areas and the charts do not overflow at 375 px.

---

# STAGE 5 — My Farm ("Tell Us About Your Farm")

**OWNS:** `app/farm/page.tsx`, `components/farm/**`, `lib/farm/**`.
**Reads:** contract sections 3, 4, 5; notes section 5; mockups "Your farm" (3 screens).

- **Calls on load:** `GET /meta/options`, `GET /crops?use=current`, `GET /farm` (prefill). **On submit:** `PUT /farm`.
- Header "Step 2 of 5 · Understand Your Land", title "Tell Us About Your Farm".
- Sections, all rendered from the API (never hard-coded): Current Crops (image cards, multi-select 1–8, `image.thumbUrl`, `alt`), Water Sources (single, `waterSource`; `other` shows an optional text box max 60 → `waterSourceOther`), Water availability (radio cards), Soil Type (single; `not_sure` uses `options.soilType[not_sure].hint`, no "NASA" badge, no USDA text), Equipment & Machinery (multi, may be empty; selected = "Available", unselected = "Optional"; intro line: "We use this to check how well each plan fits your equipment."), Growing Seasons Per Year (1/2/3; the "Recommended" badge comes from the API and does **not** preselect), Farmer Priorities (1–3, the 4th disabled, "(N selected)").
- Nothing preselected unless `GET /farm` returned it. The mockup's selected cards are demo only.
- "Build My Crop Plans →" disabled until every required section has a value. `PUT /farm` must not contain `centerId` or unknown keys. `waterSourceOther` only when `waterSource` is `other`.
- If `farm.centerId` is null: show "Pick your area first" with a link to `/explore`. Works for guests and accounts.
- On success (`setupStatus: "complete"`): `useJourney().refresh()` then go to `/lab`.
- Errors: 400 `details.issues[]` under the matching section; 422 `UNKNOWN_CROP` → refresh crops, drop `details.unknownIds`, nothing was saved, tell the user; 409 `FARM_SETUP_INCOMPLETE` → the "Pick your area first" state.

**Done when:** a guest can fill and save the form, reload and see the same answers.

---

# STAGE 6 — Rotation Lab (+ first pop-up form)

**OWNS:** `app/lab/page.tsx`, `components/lab/**`, `lib/lab/**` (including `lib/lab/mock.ts`).
**Reads:** contract section 7 **[PLANNED]**, section 4 (crops), section 12 (images); notes section 6; mockup "Rotation Lab" ("Try a Crop Rotation").

**Special requirement (from the developer): a pop-up form first, then the rest of the screen.**
1. On entering `/lab`: `GET /rotation/draft` and `GET /crops?use=rotation&slot=<slot>` for the three slots.
2. If `draft.source === "default"` (the user has never saved a rotation), open a **"Choose your crops" modal before showing results**: three steps or three rows, one per season (Season 1 · Fall / Winter, Season 2 · Spring, Season 3 · Summer / Fall), each showing the crop cards for that slot (image, name, short description) with the draft's crop preselected as a suggestion. Button "Show my rotation →". The page behind it is dimmed and not interactive. Closing the modal without confirming keeps the default draft and shows the page anyway.
3. If `draft.source === "saved"`, skip the modal and show the screen; a "Change crops" action reopens the same modal.
4. On confirm: `POST /rotation/score` with exactly 3 items in order `fall_winter`, `spring`, `summer_fall`, then render the screen.

**The screen**
- Title "Try a Crop Rotation", subtitle "Choose crops for the next 3 seasons and see how they may help your farm.", goals chips from `draft.goals[].label` with "Edit" → `/farm`.
- "Your 3-Season Plan" with `draft.cycleLabel` (keep as returned): three season cards (`slotLabel`, crop name, short line, `image.thumbUrl`) joined by arrows, each with "Change crop" opening a picker from `GET /crops?use=rotation&slot=…`; after picking → `POST /rotation/score` again.
- "Your Field": rectangle from `draft.field.bbox` on a Leaflet map (`ssr:false`), title `draft.field.name` + `draft.field.areaLabel` (hide area if null), plan chip built from the three crop names, toggle Water / Soil / Ground Cover using `metrics[water|soil|erosion].value` as overlay intensity. No extra API call.
- "Rotation Assessments": the 5 cards in the returned order: `title`, `value`, `levelLabel`, italic `question`, bar (green high, amber moderate, orange low), `text`, footer `basis`. Only API text; remove "~$46/acre fertilizer offset", "4% slope" and every dollar/yield figure. "Updated live as crops change": spinner while a call runs and the previous numbers stay dimmed.
- Also: `SampleBadge` while `status === "placeholder"`, expander "What we are unsure about" (`dataConfidence.note` + `gaps[]`), `notices[]` as a one-line note.
- Buttons: "← Back to My Farm" → `/farm`; "Compare My Plans →" → `/compare` (the sequence is already saved by `/rotation/score`; if you also pass it, use `sessionStorage` key `soilmate:labSequence`, written by this stage only).
- Errors: 409 `FARM_SETUP_INCOMPLETE` → redirect to `/farm`; 422 `CROP_NOT_ALLOWED_IN_SLOT` → refresh the picker and revert the change; 502 → "We could not calculate this right now. Your last result is still shown."
- **Planned endpoints:** implement all calls in `lib/lab/api.ts` only (so shape changes touch one file). When the endpoint answers 404 or `USE_MOCK_PLANNED` is true, use `lib/lab/mock.ts` (status `placeholder`).

**Done when:** modal → score → change a crop → scores update with the previous values dimmed during the call; works with mocks and with the real endpoint.

---

# STAGE 7 — Compare Plans

**OWNS:** `app/compare/page.tsx`, `components/compare/**`, `lib/compare/**` (including `lib/compare/mock.ts`).
**Reads:** contract section 8 **[PLANNED]**; notes section 7; mockup "Compare plans".

- **On load:** `POST /plans/compare` with `{ labSequence }` read from `sessionStorage` key `soilmate:labSequence` if present (omit otherwise). Skeleton for up to 5 seconds. **Choose:** `POST /plans/choose { planSetId, planKey }` → `useJourney().refresh()` → `/dashboard`. 404 on choose means the comparison expired → re-run compare.
- Header "Choose the Best Plan for Your Farm", "Compare three ways to grow crops over the next three seasons.", "Step 5 of 5 · Compare & Decide", goals bar from `goals[].label` ("Edit" → `/farm`).
- Three cards **in the returned order**; highlight by `recommended: true` (label from `recommendedLabel`), never by position. Per card: `badge.label` colored by `badge.tone`, `PLAN n — title`, "Main benefit" / "Watch out for", 3-season rows (`seasonNumber`, `slotLabel`, `crop.name`, `roleTag` chip), "How this plan fits your farm" rows from `fit[]` with `label`, `value`, `fitLabel` as a pill (green Good Fit, amber Moderate Fit, orange Needs Checking) and `note`. Use pills everywhere (not the mockup's mixed plain percentages).
- **Required:** a "Why this plan?" expander per card with `evidence[]`, `infoGaps[]`, `risksToReview[]` and `dataConfidence.note`.
- `matchScore`, if shown, is labelled "Goal match" and never called a prediction. `SampleBadge` while `status === "placeholder"`. Show `notices[]` under the cards.
- Remove all demo content (Daikon, Peas, Sorghum, "check local elevator prices"): everything comes from the API.
- Disable all "Choose This Plan" buttons while the call runs. The user can go back to the lab; the lab keeps its draft.
- Planned endpoint handling as in Stage 6 (`lib/compare/api.ts` + `mock.ts`).

**Done when:** the recommended card is highlighted by flag, choosing a plan lands on the dashboard, an expired comparison recovers by itself.

---

# STAGE 8 — Dashboard + Report

**OWNS:** `app/dashboard/page.tsx`, `app/dashboard/report/page.tsx`, `components/dashboard/**`, `lib/dashboard/**` (including `lib/dashboard/mock.ts`).
**Reads:** contract section 9 **[PLANNED]** and the Report endpoint; notes section 8; mockups "My Farm dashboard" and "My Crop Plan".

- **On load:** `GET /dashboard` (single call). "View Full Plan" → `/dashboard/report` which calls `GET /reports/summary`.
- **Empty states:** `hasActivePlan:false` → "Choose a plan to unlock your dashboard" + link to `/compare` (still render land blocks if `land` is not null). `land:null` → "Pick your area" + link to `/explore`.
- **Blocks (replace the mockup per notes section 8):** header from `header.farmName` + `header.locationLabel`; Season Progress from `seasonProgress` ("Estimated" when `isEstimate`; no "Ahead of Fall Frost schedule"); tile "Green months (last 12)" from `land.tiles` in place of Plot Schedule; **Soil moisture card** from `land.soilMoisture` in place of the NPK card (remove "Telemetry 99.4%" and the Agronomist Tip); map of the selected area (`bbox`) colored by NDVI with caption "Monthly satellite data, latest reading <month year>" (no field markers, no "LIVE SYNC", source is NASA MODIS not Landsat); tiles from `land.tiles` (no cover-crop area); Erosion Protection from `protection.seasons[]` (`value` shown as "% cover", chip from `protection.overall.fitLabel`; remove "+0.3% YoY"); Water Needs by Season from `waterBySeason.seasons[]` (remove "Optimal Topsoil 31.4%"); **My Crop Plan** cards from `plan.sequence[]` (`seasonLabel`, `roleTag`, crop name/description/image, `calendar.plantingLabel`, harvest line only from `calendar.harvestLabel`, hidden when null; state chip: `upcoming_next` "Upcoming Next", `scheduled` "Scheduled", `in_progress` "In Progress", `done` "Done"). No yield target.
- **Add (challenge requirements):** Land risk card from `land.landRisk` with its `notice`; "Plan confidence" strip (`plan.dataConfidence.note`, `plan.infoGaps[]`, `plan.risksToReview[]`); date line from `land.dataThrough` + `land.areaWarning`; `SampleBadge` while `plan.status === "placeholder"`.
- **Report page:** three plain sections, text as returned: "What we observed" (`landStory.soilMoisture.observed`, `landStory.landRisk.observed[]`), "What it might mean" (`mayMean`, `meaning[]`), "What to check on your land" (`toVerify`, `verify[]`, plus `limits[]` and `disclaimer`). A print button (`window.print()`) with a print-friendly layout scoped to this page (no global CSS).
- Planned endpoint handling as in Stage 6 (`lib/dashboard/api.ts` + `mock.ts`). The Leaflet map is `ssr:false`.

**Done when:** all empty states render, the report prints cleanly, nothing from section 9 of the notes' ❌ list appears.

---

# STAGE 9 — Integration and Vercel check (run last)

**Goal:** after all stage outputs are copied into the repo, make the project build and deploy cleanly. Edit existing files only to fix real problems, keep each change minimal, and list every change you make.

1. **Inventory:** list all routes (`app/**/page.*`), flag duplicates and any collision with game routes. Search for wrong-case imports, missing files, circular imports, and two Navbars.
2. **Build:** run `npm install`, `npm run lint`, `npm run build`. Fix errors with the smallest change. Note each fix and which stage caused it.
3. **SSR safety scan:** grep for top-level use of `window`, `localStorage`, `sessionStorage`, `document`, `crypto.randomUUID`; `useSearchParams` without Suspense; Leaflet imported without `ssr:false`.
4. **Identity scan:** every SoilMate 👤 call goes through `apiFetch`; no call sends both `Authorization` and `X-Guest-Id`; the game's calls still use only `X-Player-Id`; no hard-coded `localhost`.
5. **Content scan:** search the UI strings for forbidden demo/claims: `NPK`, `pH`, `yield`, `bu/ac`, `$`, `Landsat`, `USDA`, `SSURGO`, `Cedar Valley`, `Alex Henderson`, `Field #12`, `LIVE SYNC`, `Harvest Program`, `35%`, `Spot Issues`. Report each hit.
6. **Vercel checklist (output as a ticked list for the developer):**
   - Framework preset Next.js; Root Directory points to the folder that holds `package.json`; Node version matches local.
   - Env vars set in Vercel for Production **and** Preview: `NEXT_PUBLIC_API_BASE` (the public URL of the Express API, https, no trailing slash); `NEXT_PUBLIC_MOCK_PLANNED` only if the planned endpoints are not ready.
   - Backend: `CLIENT_ORIGIN` must include the exact Vercel production URL (and the preview URL while testing); CORS allows headers `Content-Type`, `Authorization`, `X-Guest-Id` (and `X-Player-Id` for the game); `PUBLIC_BASE_URL` is the public API URL so crop image URLs are absolute and https (mixed content is blocked on https pages).
   - `next.config` image `remotePatterns` match the API host.
   - Redeploy after changing any `NEXT_PUBLIC_*` variable (they are baked in at build time).
7. **Final smoke test script** (steps for the developer): guest → pick area → fill farm → lab (modal) → compare → choose → dashboard; then sign up with the same browser and confirm the farm moved; log out → a new empty guest; log in again → the farm is back; open a second browser as another guest and confirm it is empty; open `/profile` as a guest and confirm the "Create an account" card; check the game still works.
8. Output: the list of changes made, any remaining risks, and the Vercel checklist.

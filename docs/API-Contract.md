# SoilMate — Frontend ⇄ Backend API Contract (v0.2)

Stack: React (frontend) · Node.js/Express (backend) · MongoDB Atlas · Python scoring service (MOCK for now, Node-only).
The frontend talks ONLY to Node. It never calls Python.

Companion files: `soilmate-backend-build-guide.txt` (how to build it) and `soilmate-frontend-notes.md` (how to use it from React).
Tags: **[A#]** = assumption to confirm (listed in section 14). **[PLACEHOLDER]** = value comes from mock data and must be labeled "sample" in the UI.
**Build status tags:** **[BUILT]** = implemented and tested on the backend. **[PLANNED]** = not built yet; shapes below may still change slightly.

## What changed since v0.1 (2026-11-12)

| # | Change | Where |
|---|---|---|
| 1 | **Guest access.** The whole app (Explore Land → Farm → Rotation Lab → Compare Plans → Dashboard → Reports → Journey) works without an account. Guests send `X-Guest-Id`. Only profile/account endpoints need a login. | 0.2, 5, 7–10, 13 |
| 2 | Signup/login accept `X-Guest-Id` and move the guest's farm into the account. The response then has an extra `guestData` field. | 1 |
| 3 | **Error format is the existing game format** (decision A1): validation `details` = `{ "issues": [{ "path", "message" }] }`; rate-limit code is `RATE_LIMITED`; server error code is `INTERNAL`. | 0, 14 |
| 4 | New error codes `INVALID_GUEST_ID`, `LAYER_NOT_AVAILABLE`; `UNKNOWN_CROP` now carries `details.unknownIds`. | 0 |
| 5 | Explore Land (section 6) now describes exactly what the backend returns, including all 4 layer-detail endpoints and the glossary. | 6 |
| 6 | Farm (section 5): `landArea` is `null` when empty, PATCH clearing rules, setupStatus rule written out. | 5 |
| 7 | Public explore endpoints are cached for 1 hour (ETag) and rate-limited to 300 requests/minute per IP. | 0.4 |

---
## 0. Conventions

| Topic | Rule |
|---|---|
| Base URL | `{API_BASE}/api` (the same prefix as the existing game routes) |
| Format | JSON, UTF-8, `camelCase` keys (layer-detail endpoints keep the data team's `snake_case` keys inside the data, see section 6) |
| Auth | 🌐 public · 🔒 account only (`Authorization: Bearer <jwt>`) · 👤 account **or guest** (send `Authorization: Bearer <jwt>` **or** `X-Guest-Id: <uuid>`). See 0.2. |
| Success | HTTP 200/201 with the JSON object directly (no `{data: …}` wrapper); 204 = empty |
| Error | `{ "error": { "code": "STRING_CODE", "message": "Human readable", "details": { … } } }`. `details` may be absent. See 0.1. |
| Dates | ISO 8601 (`2026-11-06T10:00:00.000Z`); month values `YYYY-MM` |
| Percent | Integers 0–100 unless noted |
| Language | All user-facing text is English |
| CORS | Allowed request headers: `Content-Type`, `Authorization`, `X-Guest-Id` (and `X-Player-Id`, used only by the game). Only the origin set in the backend `CLIENT_ORIGIN` is allowed. |

### Shared enums (exact strings)

| Name | Values |
|---|---|
| `centerId` | `desouk`, `sidi_salem`, `baltim` |
| `slot` | `fall_winter`, `spring`, `summer_fall` (always in this order; labels: "Fall / Winter", "Spring", "Summer / Fall") |
| `metricId` | `water`, `soil`, `erosion`, `practicality`, `economy` |
| `level` | `high` (≥75), `moderate` (60–74), `low` (<60) **[A6]** |
| `planKey` | `keep_routine` (Plan 1), `improve_soil` (Plan 2), `save_water` (Plan 3) |
| `waterSource` | `rain`, `river_canal`, `groundwater`, `mixed`, `other` |
| `waterAvailability` | `often_limited`, `sometimes_limited`, `usually_enough` |
| `soilType` | `mostly_sandy`, `mostly_clay`, `loamy`, `not_sure` |
| `equipment` | `standard_tractor`, `seed_drill_planter`, `no_till_drill`, `combine_harvester`, `drip_pivot_irrigation`, `hand_tiller_tools` |
| `seasonsPerYear` | `1`, `2`, `3` (number) |
| `priority` | `save_water`, `improve_soil`, `protect_land`, `manage_costs`, `earn_more` |
| `areaUnit` | `acres`, `hectares` |
| `smState` | `dry`, `normal`, `wet`, `no_data` |
| `layerId` | `overview`, `soil_moisture`, `crop_health`, `heat_stress`, `erosion_risk` |

Level → label mapping (frontend uses the label; backend also returns it):

| level | Rotation Lab label | Compare page label |
|---|---|---|
| high | HIGH | Good Fit |
| moderate | MODERATE | Moderate Fit |
| low | LOW | Needs Checking |

### Standard error codes

| HTTP | code | When |
|---|---|---|
| 400 | `VALIDATION_ERROR` | body/query/params invalid. `details.issues` = list of `{ path, message }` (see 0.1) |
| 400 | `INVALID_GUEST_ID` | `X-Guest-Id` is not a UUID v4 |
| 401 | `UNAUTHENTICATED` | no token and no guest id, or token missing/expired/invalid (a bad token is never replaced by the guest id) |
| 401 | `INVALID_CREDENTIALS` | wrong email or password (never says which) |
| 403 | `FORBIDDEN` | not owner |
| 404 | `NOT_FOUND` | unknown id/route (`Unknown center.`, `Unknown layer.`) |
| 404 | `LAYER_NOT_AVAILABLE` | map layer exists but has no data yet (`erosion_risk`) |
| 409 | `EMAIL_ALREADY_REGISTERED` | signup duplicate |
| 409 | `FARM_SETUP_INCOMPLETE` | `PUT /farm` before an area is chosen; rotation/plans before the farm form is complete |
| 422 | `UNKNOWN_CROP` | a crop id is not in the catalog or cannot be used here. `details.unknownIds` = the bad ids |
| 422 | `CROP_NOT_ALLOWED_IN_SLOT` | crop used in a slot it does not belong to **[PLANNED]** |
| 429 | `RATE_LIMITED` | rate limit. Response also has the standard `RateLimit-*` headers |
| 502 | `SCORING_UNAVAILABLE` / `SCORING_INVALID_RESPONSE` | Python down/slow/bad shape **[PLANNED]** |
| 500 | `INTERNAL` | anything else (no stack traces to client) |

### 0.1 Error body details

Validation error (400):
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request",
    "details": {
      "issues": [
        { "path": "body.soilType", "message": "Invalid option: expected one of …" },
        { "path": "body.priorities", "message": "Pick at least 1 priority" }
      ]
    }
  }
}
```
`path` starts with where the problem is (`body.`, `query.` or `params.`), then the field name. Show `message` next to the field. One exception: `?include=` on the crop-health layer returns `details: { "include": "Must be \"monthly\" or omitted." }` (see section 6).

Other business errors may carry their own `details`, e.g. `UNKNOWN_CROP` → `{ "unknownIds": ["banana"] }`.

### 0.2 Guests (use the app without an account)

1. On the first visit the frontend creates a random id with `crypto.randomUUID()` (a UUID v4) and keeps it in `localStorage`.
2. It sends it as the header `X-Guest-Id: <uuid>` on **every** 👤 request while the user is not logged in. The first request creates the guest on the server; nothing else to call.
3. Rules the backend applies:
   - A request with `Authorization` uses the **account** and ignores `X-Guest-Id`. If that token is invalid the answer is 401; the backend never falls back to the guest.
   - No `Authorization` and no `X-Guest-Id` → 401 `UNAUTHENTICATED`. A malformed id → 400 `INVALID_GUEST_ID`.
   - A guest has the same farm, plans and dashboard as an account. A guest **cannot** use `/me` (401) or `/auth/logout`.
   - Nobody can log in as a guest. Guests that are not used for **90 days** are deleted together with their data (scheduled cleanup job).
4. **Moving into an account:** send the same `X-Guest-Id` header on `POST /auth/signup` or `POST /auth/login`. See section 1 for the `guestData` result. After a response that contains `guestData`, delete the guest id from `localStorage`.
5. The guest id is the only key to the guest's data: treat it like a password (never put it in a URL, never log it).

### 0.3 Rate limits (per IP)

| Endpoints | Limit |
|---|---|
| Explore Land (`/centers…`, `/map/…`, `/glossary`) | 300 / minute |
| `POST /auth/signup` | 10 / hour |
| `POST /auth/login` | 10 / 15 minutes |
| `POST /auth/forgot-password` | 5 / hour |
| `POST /me/password` | 10 / 15 minutes |
| Everything else | the backend default (100 / minute) |

On 429 show "Too many requests, please wait a moment" and retry after the time in the `RateLimit-Reset` header.

### 0.4 Caching

Explore Land responses (`/centers…`, `/map/…`, `/glossary`) send `Cache-Control: public, max-age=3600` and an `ETag`; the browser sends `If-None-Match` by itself and gets 304 when nothing changed. Error responses send `no-store`. Account/guest data (farm, plans, dashboard…) must not be cached by the frontend beyond normal in-memory state.

---

## 1. Auth (pages: Sign Up, Log In)

### POST `/auth/signup` 🌐
Request
```json
{
  "fullName": "Alex Henderson",
  "email": "alex@example.com",
  "password": "Str0ngPass1",
  "confirmPassword": "Str0ngPass1",
  "acceptedTerms": true
}
```
Rules: `fullName` 2–80 chars · `email` valid, stored lowercase · `password` 8–72 chars with ≥1 letter and ≥1 number · `confirmPassword` must equal · `acceptedTerms` must be `true`.

201 Response
```json
{
  "token": "<jwt>",
  "expiresAt": "2026-11-13T10:00:00.000Z",
  "user": {
    "id": "665f…", "fullName": "Alex Henderson", "email": "alex@example.com",
    "phone": null, "avatarUrl": null, "emailVerified": false,
    "createdAt": "2026-11-06T10:00:00.000Z"
  }
}
```
**Guest merge.** If the request also has the header `X-Guest-Id: <uuid>`, the guest's farm is moved into the new account and the 201 response has one extra field:
```json
{ "token": "…", "expiresAt": "…", "user": { "…": "…" }, "guestData": "adopted" }
```
`guestData` values: `adopted` (the account had no farm, so it now owns the guest's farm, plans and active plan) · `discarded` (the account already has a farm; it is kept and the guest's data is deleted. For signup this cannot happen) · `none` (the guest id is unknown or had no farm). The field is **absent** when no valid `X-Guest-Id` was sent. A problem while moving the data never makes signup fail.
Errors: 400 `VALIDATION_ERROR`, 409 `EMAIL_ALREADY_REGISTERED`, 429 `RATE_LIMITED`.

### POST `/auth/login` 🌐
Request: `{ "email": "alex@example.com", "password": "…", "rememberMe": true }`
Response: same shape as signup (200). `rememberMe=true` → token valid 30 days, else 1 day.
Optional header `X-Guest-Id`: same merge rules as signup, with the same `guestData` field. **Logging in is where `discarded` happens:** an account that already has a farm keeps it and the guest's data is deleted. A failed login never touches the guest's data.
Errors: 400, 401 `INVALID_CREDENTIALS`, 429 `RATE_LIMITED`.
UI note: the login form uses **email only** (no username) **[A2]**.

### POST `/auth/logout` 🔒
Account only. Response 204. Stateless: the frontend deletes its token and then creates a **new** guest id (the old guest data was already moved into the account, or the account owns it now).

### POST `/auth/forgot-password` 🌐 (stub) **[A3]**
Request `{ "email": "…" }` → always 200 `{ "message": "If this email is registered, you will receive reset instructions." }`. No email is sent until an email provider is chosen.

---

## 2. Profile (page: My Profile)

**Account only.** A guest gets 401 on every `/me` endpoint. The frontend should send guests to Sign Up / Log In when they open Profile.

### GET `/me` 🔒
```json
{
  "id": "665f…", "fullName": "Alex Henderson", "email": "alex@example.com",
  "emailVerified": false, "phone": "+15553829104", "avatarUrl": null,
  "passwordChangedAt": "2026-08-01T00:00:00.000Z", "createdAt": "…"
}
```
UI: show the "Verified" badge only when `emailVerified` is true. "Last updated 3 months ago" is computed by the frontend from `passwordChangedAt`.

### PATCH `/me` 🔒
Request (any subset): `{ "fullName": "…", "phone": "+15553829104" }`
Rules: `phone` optional, 7–15 digits, optional leading `+`, stored normalized; `null` clears it. **Email is read-only** **[A4]**.
Response: same as GET `/me`.

### POST `/me/password` 🔒
Request
```json
{ "currentPassword": "…", "newPassword": "…", "confirmNewPassword": "…" }
```
Response 204. Errors: 400, 401 `INVALID_CREDENTIALS` (wrong current password). Old tokens stop working afterwards; the response also sets nothing, so the frontend must log in again.

### DELETE `/me` 🔒 (Danger zone)
Request `{ "confirmEmail": "alex@example.com" }` — must match the account email.
Response 204. Deletes the user, farm, plan sets and plans permanently.

### Farm preferences on the profile page
Use the Farm endpoints below. "Save All Changes" = frontend calls `PATCH /me` and `PATCH /farm` together. "Reset Defaults" is frontend-only (reloads the saved values).

---

## 3. Options (render all form cards from here so labels never drift)

### GET `/meta/options` 🌐
```json
{
  "waterSource": [
    { "id": "rain", "label": "Rain", "hint": "Rainfed pure" },
    { "id": "river_canal", "label": "River / Canal", "hint": "Surface diverted" },
    { "id": "groundwater", "label": "Groundwater", "hint": "Deep tube well" },
    { "id": "mixed", "label": "Mixed Sources", "hint": "Rain + Supplemental" },
    { "id": "other", "label": "Other", "hint": "Retention pond" }
  ],
  "waterAvailability": [
    { "id": "often_limited", "label": "Often Limited", "hint": "Rain-dependent risk" },
    { "id": "sometimes_limited", "label": "Sometimes Limited", "hint": "Seasonal dry spells" },
    { "id": "usually_enough", "label": "Usually Enough", "hint": "Consistent security" }
  ],
  "soilType": [
    { "id": "mostly_sandy", "label": "Mostly Sandy", "hint": "Fast drainage, light density, warms up rapidly in early spring." },
    { "id": "mostly_clay", "label": "Mostly Clay", "hint": "High nutrient retention, holds moisture, slower springtime warm-up." },
    { "id": "loamy", "label": "Loamy", "hint": "Rich & crumbly, balanced water holding, optimal for multi-rotations." },
    { "id": "not_sure", "label": "Not Sure", "hint": "We will treat it as unknown and flag it as missing information." }
  ],
  "equipment": [
    { "id": "standard_tractor", "label": "Standard Tractor" },
    { "id": "seed_drill_planter", "label": "Seed Drill / Planter" },
    { "id": "no_till_drill", "label": "No-Till Drill" },
    { "id": "combine_harvester", "label": "Combine Harvester" },
    { "id": "drip_pivot_irrigation", "label": "Drip / Pivot Irrigation" },
    { "id": "hand_tiller_tools", "label": "Hand / Tiller Tools" }
  ],
  "seasonsPerYear": [
    { "id": 1, "label": "1 Season / Year", "hint": "Single cash crop per calendar year with dormant fallow winter periods." },
    { "id": 2, "label": "2 Seasons / Year", "hint": "Main cash crop followed by a winter cover or secondary legume sequence.", "recommended": true },
    { "id": 3, "label": "3 Seasons / Year", "hint": "Intensive multi-crop relay rotation with rapid turnover cycles." }
  ],
  "priority": [
    { "id": "save_water", "label": "Save Water", "profileLabel": "Save Water", "hint": "Maximize soil moisture retention and drought resistance." },
    { "id": "improve_soil", "label": "Improve Soil", "profileLabel": "Improve Soil", "hint": "Boost organic biomass, root biology, and microbial life." },
    { "id": "protect_land", "label": "Protect Land", "profileLabel": "Protect My Land", "hint": "Prevent wind and water erosion, build canopy cover." },
    { "id": "manage_costs", "label": "Manage Costs", "profileLabel": "Reduce Costs", "hint": "Lower synthetic fertilizer, seed expense, and fuel trips." },
    { "id": "earn_more", "label": "Earn More", "profileLabel": "Increase Earnings", "hint": "Target premium food grades and specialty grain markets." }
  ],
  "slots": [
    { "id": "fall_winter", "label": "Fall / Winter", "order": 1 },
    { "id": "spring", "label": "Spring", "order": 2 },
    { "id": "summer_fall", "label": "Summer / Fall", "order": 3 }
  ],
  "areaUnit": ["acres", "hectares"],
  "limits": { "maxPriorities": 3 }
}
```
Note: "Not Sure" originally promised "USDA SSURGO" data. That dataset covers the US only, so the text above was changed **[A5]**.

---

## 4. Crops (Try a Crop Rotation, Tell Us About Your Farm, Dashboard cards)

### GET `/crops` 🌐
Query: `use=current|rotation` (optional) · `slot=fall_winter|spring|summer_fall` (optional).
- `use=current` → crops with `selectableAsCurrent=true` (the six cards on the farm form).
- `use=rotation&slot=spring` → crops allowed in that slot (the "Change crop" picker).

```json
{
  "crops": [
    {
      "id": "crimson-clover",
      "name": "Crimson Clover",
      "subtitle": "Nitrogen fixer",
      "category": "cover_crop",
      "roleTag": "Nitrogen Fixer",
      "benefitTag": "Builds Soil Nutrients",
      "description": "Adds natural nitrogen to the soil",
      "slots": ["spring"],
      "selectableAsCurrent": false,
      "image": {
        "url": "https://api.example.com/static/crops/crimson-clover.webp",
        "thumbUrl": "https://api.example.com/static/crops/thumb/crimson-clover.webp",
        "alt": "Field of crimson clover in bloom"
      },
      "calendar": { "plantingLabel": "Mar – Apr", "harvestLabel": "May – Jun" }
    }
  ]
}
```
Current catalog (11 crops, all **[PLACEHOLDER]** values; copied from the US mockup, see A17). `selectableAsCurrent=true` (the farm-form cards): `alfalfa-hay`, `cotton`, `field-corn`, `grain-sorghum`, `soybeans`, `winter-wheat`. Default per slot: `fall_winter` → `winter-rye`, `spring` → `crimson-clover`, `summer_fall` → `field-corn`. `subtitle` may be `""` and `benefitTag` may be `null`: hide them when empty.
`category` ∈ `cash_crop`, `cover_crop`, `forage`, `legume`, `fallow`. Every crop **always has an image** (the seed fails otherwise). Scoring attributes (water need, legume, cost…) are NOT exposed here.
`calendar` values are **[PLACEHOLDER]** until agronomy review.

---

## 5. Farm (pages: My Farm form, Profile → My Farm Preferences, Explore Land selection) **[BUILT]**

One farm per owner (account **or guest**). Created automatically on first call. All farm endpoints are 👤: send `Authorization` **or** `X-Guest-Id`.

### Farm object (returned by all farm endpoints)
```json
{
  "id": "666a…",
  "setupStatus": "complete",
  "centerId": "desouk",
  "farmName": "Cedar Valley Family Farm",
  "farmLocationText": "Desouk, Kafr El-Sheikh",
  "landArea": { "value": 42.5, "unit": "acres" },
  "currentCrops": ["field-corn", "soybeans"],
  "currentCropsDetail": [
    { "id": "field-corn", "name": "Field Corn", "image": { "thumbUrl": "http://…/static/crops/thumb/field-corn.webp", "alt": "Rows of field corn ready for harvest" } }
  ],
  "waterSource": "mixed",
  "waterSourceOther": null,
  "waterAvailability": "sometimes_limited",
  "soilType": "loamy",
  "equipment": ["standard_tractor", "seed_drill_planter", "combine_harvester"],
  "seasonsPerYear": 2,
  "priorities": ["save_water", "improve_soil"],
  "updatedAt": "2026-11-06T10:00:00.000Z"
}
```
Empty fields are `null` (arrays `[]`). That includes `landArea`: it is `null` until the user enters an area, so read `farm.landArea?.value`. `currentCropsDetail` has the same order as `currentCrops`; a crop that was removed from the catalog is skipped there but stays in `currentCrops`. Nothing else leaves the server (no internal ids, no rotation draft).

**`setupStatus` rule** (recomputed after every write):
- `none`: no `centerId`.
- `complete`: `centerId` **and** at least 1 `currentCrops` **and** `waterSource` **and** `waterAvailability` **and** `soilType` **and** `seasonsPerYear` **and** at least 1 `priorities`. (`equipment` may be empty.)
- `center_selected`: anything else.

### GET `/farm` 👤 → Farm object (never 404; returns the empty farm).

### PUT `/farm/center` 👤
Request `{ "centerId": "desouk" }` → Farm object (status `center_selected`, or still `complete` if the form was already complete). Called when the user picks one of the 3 areas on Explore Land. Can be called again to change the area. Errors: 400 (unknown area or extra keys).

### PUT `/farm` 👤 (button "Build My Crop Plans")
Full form submit. All fields required (except `waterSourceOther`, which may be left out).
```json
{
  "currentCrops": ["field-corn", "soybeans"],
  "waterSource": "mixed",
  "waterSourceOther": null,
  "waterAvailability": "sometimes_limited",
  "soilType": "loamy",
  "equipment": ["standard_tractor", "seed_drill_planter", "combine_harvester"],
  "seasonsPerYear": 2,
  "priorities": ["save_water", "improve_soil"]
}
```
Rules: `currentCrops` 1–8 unique ids with `selectableAsCurrent=true` · `equipment` 0–6 unique · `priorities` 1–3 unique · `seasonsPerYear` is the number 1, 2 or 3 · `waterSourceOther` max 60 chars and **only stored when `waterSource` is `other`** (otherwise it is saved as `null`, even if sent; empty text also saves `null`) · unknown keys are rejected (400), so do **not** send `centerId` here.
Response: Farm object with `setupStatus: "complete"`. Saving never resets the saved Rotation Lab draft.
Errors: 400 `VALIDATION_ERROR` · **409 `FARM_SETUP_INCOMPLETE`** when no area has been chosen yet (send the user to Explore Land) · **422 `UNKNOWN_CROP`** with `details.unknownIds` (a crop that does not exist or is not selectable as a current crop). A rejected save changes nothing.

### PATCH `/farm` 👤 (profile page edits)
Any subset (at least one key) of: `farmName` (≤80), `farmLocationText` (≤120), `landArea {value>0, unit}` (value ≤100000, both keys required), `currentCrops`, `waterSource`, `waterSourceOther`, `waterAvailability`, `soilType`, `equipment`, `seasonsPerYear`, `priorities`, `centerId`. Same limits as PUT. Unknown keys (such as `setupStatus`) → 400.
- `farmName` and `farmLocationText`: `null` or `""` clears them.
- Changing `waterSource` to anything but `other` clears `waterSourceOther`; `waterSourceOther` is ignored while `waterSource` is not `other`.
- `setupStatus` is recomputed, so filling the form field by field becomes `complete` only when the last required field is set.
Returns the Farm object. Errors: 400, 422 `UNKNOWN_CROP`.

---

## 6. Explore Land (data layers, 3 areas) **[BUILT]**

The 3 areas are the only selectable lands: **Desouk, Sidi Salem, Baltim** (Kafr El-Sheikh). All numbers come from the data team's files and are never recalculated by Node. All endpoints here are 🌐 public, GET only, cached for 1 hour with ETag (see 0.4), 300 requests/minute per IP.
Two small display roundings are the only changes to the data (both marked **[A19]**): the NDVI value is shown with 2 decimals (0.562 → 0.56) in the overview tile, `lastMonths` and the `crop_health` map layer; the layer-detail endpoint keeps the raw 0.562. `mapCenter` is rounded to 4 decimals (it only removes floating-point noise).

### GET `/centers?q=des`
```json
{
  "centers": [
    {
      "id": "desouk", "name": "Desouk", "nameAr": "دسوق", "governorate": "Kafr El-Sheikh",
      "bbox": [30.55, 31.05, 30.75, 31.25],
      "mapCenter": { "lat": 31.15, "lon": 30.65 }
    }
  ],
  "coverageNote": "We currently cover Desouk, Sidi Salem and Baltim."
}
```
`q` matches name, Arabic name or governorate, case-insensitive, "contains". Empty or missing `q` returns all 3. No match → `centers: []` (not an error); the UI shows `coverageNote`. `q` is cut at 100 characters; a repeated parameter (`?q=a&q=b`) means "no filter". `bbox` = `[west, south, east, north]` and is the map box. **[A7: coordinates differ between layers]**

### GET `/map/layers`
```json
{
  "layers": [
    { "id": "overview", "label": "Field Overview", "order": 1, "available": true },
    { "id": "soil_moisture", "label": "Soil Moisture", "order": 2, "available": true },
    { "id": "crop_health", "label": "Crop Health (NDVI)", "order": 3, "available": true },
    { "id": "heat_stress", "label": "Heat Stress", "order": 4, "available": true },
    { "id": "erosion_risk", "label": "Erosion Risk", "order": 5, "available": false,
      "unavailableReason": "Not available yet" }
  ]
}
```
Erosion risk has no data yet; show it greyed with the reason. **[A8]**

### GET `/map/layers/:layerId`
Colors the three boxes for one layer. `centers` is always in the order desouk, sidi_salem, baltim.
```json
{
  "layerId": "crop_health",
  "label": "Crop Health (NDVI)",
  "dataThrough": "2025-06",
  "legend": { "type": "gradient", "unit": "NDVI", "stops": [[0.2,"#C4553B"],[0.4,"#E0A93F"],[0.6,"#8FB85A"],[0.9,"#1F6B45"]],
              "items": [ {"id":"low","label":"Nearly bare"}, {"id":"mid","label":"Moderate green"}, {"id":"good","label":"Healthy green"} ] },
  "centers": [
    { "centerId": "desouk", "name": "Desouk", "bbox": [30.55,31.05,30.75,31.25],
      "value": 0.56, "valueLabel": "0.56", "levelId": "mid", "levelLabel": "Moderate green",
      "fillHex": "#9eb555", "face": "neutral" }
  ]
}
```
Per layer, the item fields are:

| layerId | value | levelId / levelLabel | fillHex | extra | dataThrough |
|---|---|---|---|---|---|
| `crop_health` | NDVI (2 decimals) | `low/mid/good` + label | from the data file (unchanged) | `face`: sad / neutral / happy | `2025-06` |
| `soil_moisture` | SMAP needle 0–100 | `dry/normal/wet/no_data` + label ("Drier than usual", "About usual", "Wetter than usual") | constants: dry `#D9B26F`, normal `#A8D5A2`, wet `#8EC5E8`, no_data `#CFCFCF` **[A9]** | `modelState`, `modelNeedle` | `2025-06` |
| `heat_stress` | hot days per year (≥35 °C) | `null` / `null` | `null`: the frontend shades by rank of the 3 values **[A10]** | — | `2025-12` |
| `overview` | risk score 1–3 | `low/medium/high` + `Low/Medium/High` | from the atlas colors | — | `2025-12` |

`legend` per layer: `crop_health` as shown above (`gradient`); `soil_moisture` and `overview` are `categories` (one entry per state or level with its color); `heat_stress` is `rank` with the unit "Hot days per year (35 °C+)". **[VERIFY]** the exact key names inside the non-NDVI legends against one real response before styling them.
Errors: 404 `NOT_FOUND` ("Unknown layer.") · **404 `LAYER_NOT_AVAILABLE`** for `erosion_risk`.

### GET `/centers/:centerId/overview`
Everything the Explore Land page shows after a land is picked. Only blocks that real data supports are included.
```json
{
  "center": {
    "id": "desouk", "name": "Desouk", "nameAr": "دسوق", "governorate": "Kafr El-Sheikh",
    "bbox": [30.55,31.05,30.75,31.25], "mapCenter": {"lat":31.15,"lon":30.65},
    "site": { "lat": 31.1326, "lon": 30.6478, "elevationM": 11, "slopeDeg": 2.17, "coastDistanceKm": 51 }
  },
  "dataThrough": { "cropHealth": "2025-06", "soilMoisture": "2025-06", "heatWeather": "2025-12", "heatSatellite": "2025-06" },
  "areaWarning": "These numbers describe the whole area, not your field.",
  "tiles": [
    { "id": "crop_greenness", "label": "Crop greenness (NDVI)", "value": 0.56, "display": "0.56", "chip": { "id": "mid", "label": "Moderate green" } },
    { "id": "green_months",   "label": "Green months (last 12)", "value": 92, "display": "92%", "chip": null },
    { "id": "soil_moisture",  "label": "Soil moisture (SMAP)", "value": "dry", "display": "Drier than usual", "chip": null },
    { "id": "hot_days",       "label": "Hot days per year (35 °C+)", "value": 119.5, "display": "119.5", "chip": null }
  ],
  "heat": {
    "title": "Typical heat",
    "avgHighC": 29.7, "avgLowC": 16.5,
    "hottestDay": { "date": "2024-06-14", "tmaxC": 46.54 },
    "heatDaysPerYear": 119.5, "longestHotSpell": { "days": 76, "from": "2021-06-19" },
    "trendPerDecadeC": 1.0,
    "source": "NASA POWER (daily weather)"
  },
  "lastMonths": [
    { "short": "Mar", "ndvi": 0.79, "fillHex": "#49884d" }
  ],
  "soilMoisture": {
    "satellite": { "state": "dry",  "label": "Drier than usual", "needle": 9 },
    "model":     { "state": "wet",  "label": "Wetter than usual", "needle": 91 },
    "rootZone":  { "state": "wet",  "label": "Wetter than usual", "needle": 82 },
    "dryMonthsLast12": { "satellite": 11, "model": 9 },
    "texts": {
      "satelliteLine": "SMAP shows the soil is drier than usual",
      "modelLine": "The POWER model shows the soil is wetter than usual",
      "last12Line": "In the last 12 months, SMAP showed 11 months drier than usual, and the POWER model showed 9.",
      "disagreeNote": "The two sources disagree this month. Please check your own soil.",
      "needleNote": "The needle shows where this month ranks among the same month in past years."
    },
    "confidenceLabels": { "satellite": "Model that uses satellite data (SMAP L4)", "model": "Model estimate (POWER)" }
  },
  "landRisk": {
    "title": "Land risk (desertification screening)",
    "score": 1.75, "scaleMin": 1, "scaleMax": 3, "level": "Medium", "levelHex": "#d9a23b",
    "indicators": [
      { "id": "vegetation", "label": "Vegetation", "status": "Watch", "score": 2, "text": "…" },
      { "id": "soil_moisture", "label": "Soil moisture", "status": "Alarming", "score": 3, "text": "…" },
      { "id": "heat", "label": "Heat", "status": "Stable", "score": 1, "text": "…" },
      { "id": "salinity", "label": "Coast exposure (distance only)", "status": "Stable", "score": 1, "text": "…" }
    ],
    "notice": "A screening result, not a diagnosis. Salinity is not measured, only distance from the coast."
  },
  "disclaimer": "A helper indicator — it does not replace the farmer’s knowledge.",
  "footer": "This tool helps you see the picture. Your own decisions, your knowledge of your land, and local agricultural expertise come first."
}
```
Notes: `confidenceLabels` may also contain `no_data` ("Not enough data"). `levelHex` and the `fillHex` values come from the data files (lower-case hex). Check values: Baltim → NDVI 0.52 "Moderate green", green months 100%, soil moisture "About usual" (needle 36, model wet 100, root wet 100), 6.2 hot days, risk 1.75 Medium with coast exposure "Alarming". Desouk → NDVI 0.56, SMAP "Drier than usual" needle 9, 119.5 hot days.
**Heat caveat [A22]:** Desouk's 119.5 hot days/year conflicts with satellite temperature and Baltim and Sidi Salem return identical heat numbers (same weather grid cell). The values are returned as given; keep the area/limits text visible next to heat numbers.
Errors: 404 `NOT_FOUND` ("Unknown center.").

Replaced UI blocks (no data behind them): Total Plots, Crop Diversity, Total Area, Health Index "Prime", Microclimate (live weather), 4-day forecast circles → `lastMonths`, Soil Health & Nutrients (N, P, K, pH), Farm Performance Score → `landRisk`. **Never display NPK, pH, yield %, or "performance".**

### Layer detail endpoints (pop-up cards / charts)
All return the data team's content for ONE center. Only the wrapper keys below are named by this contract; the keys **inside** the data stay exactly as the data team wrote them (`snake_case`, e.g. `sm_state`, `map_fill_hex`, `agree_months`). Always filtered by `centerId`; centers are never mixed in one block (the NDVI charts are shared by design). 404 `NOT_FOUND` for an unknown center.

| Endpoint | Returns |
|---|---|
| `GET /centers/:centerId/layers/crop-health` | `{ center: { id, name, chartKey, color, bbox, latest, summaryCard, insights[6], monthlySeries? }, charts: { A, B, E }, ui, meta: { sources, disclaimer, limits, thresholds }, dataThrough }`. `monthlySeries` (123 months) only with `?include=monthly`. `charts` keep **all 3 centers** so the selected one can be highlighted; their `series` are keyed by `center.chartKey` (`"Desouk"`, `"Sidi_Salem"`, `"Baltim"`). `latest.ndvi` is the raw value (0.562). Any `include` value other than `monthly` → 400 `VALIDATION_ERROR` with `details: { "include": "Must be \"monthly\" or omitted." }`. |
| `GET /centers/:centerId/layers/soil-moisture` | `{ card, calendar[123], typicalYear[36], yearsStrip[11], agreement, texts: { card, insight1_calendar, insight2_typical_year, insight3_years, insight4_satellite_vs_model, insight5_root, report }, labels: { states, agreementLevels, confidence }, sources, limits, footer, dataThrough }` — only the selected center's rows. |
| `GET /centers/:centerId/layers/heat-stress` | `{ summary, comparison: { agreement, typicalYear }, texts, defaults: { thresholdC, sigma }, labels: { agreementLevels }, limits, sources, dataThrough: { weather: "2025-12", satellite: "2025-06" } }` — fixed defaults (35 °C, 2 SD), **no daily arrays**, text templates with `{placeholders}` are not sent **[A11]**. |
| `GET /centers/:centerId/layers/land-risk` | `{ point, chartCatalog, statusColors, method }` — `point` is the whole atlas point of that center (without the internal `key`); `chartCatalog` lists the 11 charts and the blocks of `point` that feed each one. The salinity sign and chart are labelled "Coast exposure (distance only)". |

### GET `/glossary`
```json
{ "terms": [ { "term": "Soil moisture", "short": "The amount of water held in the soil.", "gameSection": "soil_moisture" } ] }
```
Merged from the soil-moisture and heat-stress glossaries (currently 15 terms); duplicates removed by lowercase `term` (the soil-moisture entry wins).

---

## 7. Rotation Lab (page: Try a Crop Rotation) **[PLANNED]**

All endpoints are 👤: they work for accounts **and** guests (`Authorization` or `X-Guest-Id`).

The farmer must have a complete farm (`setupStatus = complete`), otherwise 409 `FARM_SETUP_INCOMPLETE`.

### GET `/rotation/draft` 👤
Returns the saved draft, or a default.
```json
{
  "source": "saved",
  "goals": [ { "id": "save_water", "label": "Save Water" }, { "id": "improve_soil", "label": "Improve Soil" } ],
  "cycleLabel": "18-Month Cycle",
  "field": { "centerId": "desouk", "name": "Desouk", "bbox": [30.55,31.05,30.75,31.25], "areaLabel": "42.5 Acres" },
  "sequence": [
    { "slot": "fall_winter", "slotLabel": "Season 1 · Fall / Winter",
      "crop": { "id": "winter-rye", "name": "Winter Rye", "description": "Protects topsoil & holds moisture", "image": { "thumbUrl": "…", "alt": "…" } } },
    { "slot": "spring", "slotLabel": "Season 2 · Spring", "crop": { "id": "crimson-clover", "name": "Crimson Clover", "description": "Adds natural nitrogen to the soil", "image": { "thumbUrl": "…", "alt": "…" } } },
    { "slot": "summer_fall", "slotLabel": "Season 3 · Summer / Fall", "crop": { "id": "field-corn", "name": "Field Corn", "description": "Main cash crop harvest", "image": { "thumbUrl": "…", "alt": "…" } } }
  ]
}
```
`source` ∈ `saved`, `default`. "Edit" next to the goals opens the My Farm form.
"18-Month Cycle" is the UI text; keep it until the agronomy owner confirms **[A12]**.

### POST `/rotation/score` 👤
Called on load and on every "Change crop". Also saves the sequence as the farmer's draft.

Request (always exactly 3 items, one per slot, in order)
```json
{
  "sequence": [
    { "slot": "fall_winter", "cropId": "winter-rye" },
    { "slot": "spring", "cropId": "crimson-clover" },
    { "slot": "summer_fall", "cropId": "field-corn" }
  ]
}
```
Do NOT send farm answers; the backend reads them from the saved farm.

200 Response
```json
{
  "status": "placeholder",
  "modelVersion": "mock-0.1",
  "generatedAt": "2026-11-06T10:00:00.000Z",
  "sequence": [ { "slot": "fall_winter", "cropId": "winter-rye" }, … ],
  "metrics": [
    {
      "id": "water", "title": "Water Suitability",
      "question": "Do the selected crops’ water requirements fit the water available on this farm?",
      "value": 68, "level": "moderate", "levelLabel": "MODERATE", "fitLabel": "Moderate Fit",
      "text": "Field Corn needs more water than this farm usually has in summer.",
      "basis": "Based on soil type, water availability and crop water needs.",
      "reasons": ["corn_high_water", "availability_sometimes_limited"]
    },
    { "id": "soil", "title": "Soil Health", "question": "Could this crop rotation support soil fertility and soil health?", "value": 86, "level": "high", "levelLabel": "HIGH", "fitLabel": "Good Fit", "text": "…", "basis": "…", "reasons": [] },
    { "id": "erosion", "title": "Erosion & Ground Protection", "question": "Does this rotation help reduce exposed-soil periods and potential erosion risk?", "value": 79, "level": "high", "levelLabel": "HIGH", "fitLabel": "Good Fit", "text": "…", "basis": "…", "reasons": [] },
    { "id": "practicality", "title": "Practicality", "question": "Does this rotation fit the farmer’s equipment, planting windows, and available resources?", "value": 90, "level": "high", "levelLabel": "HIGH", "fitLabel": "Good Fit", "text": "…", "basis": "…", "reasons": [] },
    { "id": "economy", "title": "Economy & Input Costs", "question": "Is there enough information to evaluate costs, potential returns, and market suitability?", "value": 70, "level": "moderate", "levelLabel": "MODERATE", "fitLabel": "Moderate Fit", "text": "…", "basis": "…", "reasons": [] }
  ],
  "seasonDetails": [
    { "slot": "fall_winter", "cropId": "winter-rye",
      "groundCover": { "value": 92, "label": "Rye Cover Canopy", "note": "Dense living rye blanket against wind loss and heavy rain." },
      "waterDemand": { "value": 25, "label": "Low evaporative demand", "note": "…" } }
  ],
  "dataConfidence": { "level": "low", "note": "Sample scoring. Not yet based on real crop and land data." },
  "gaps": ["Soil type was marked 'not sure'.", "No local market prices available."],
  "notices": ["Scores show how well this fits, not what your yield or profit will be."]
}
```
Rules: `value` integer 0–100 · exactly 5 metrics in the order above · `status` is `placeholder` while mock or `final` once the real service is live. When `placeholder`, the UI shows a visible "Sample scores" badge.
The footer on every card (`basis`) is shown as-is. **Never show yield, profit or $/acre numbers.** **[A13]**

The three "Your Field" toggles (Water / Soil / Ground Cover) use values already in this response: Water → `metrics[water].value`, Soil → `metrics[soil].value`, Ground Cover → `metrics[erosion].value`. No extra call.

Errors: 400, 409 `FARM_SETUP_INCOMPLETE`, 422 `UNKNOWN_CROP`, 422 `CROP_NOT_ALLOWED_IN_SLOT`, 502.

---

## 8. Compare Plans (page: Choose the Best Plan for Your Farm) **[PLANNED]**

All endpoints are 👤 (account or guest).

### POST `/plans/compare` 👤
Request
```json
{ "labSequence": [ { "slot": "fall_winter", "cropId": "winter-rye" }, { "slot": "spring", "cropId": "crimson-clover" }, { "slot": "summer_fall", "cropId": "field-corn" } ] }
```
`labSequence` is optional. If present, it becomes Plan 2's sequence **[A14]**.

200 Response
```json
{
  "planSetId": "667b…",
  "status": "placeholder",
  "generatedAt": "2026-11-06T10:00:00.000Z",
  "goals": [ { "id": "save_water", "label": "Save Water" }, { "id": "improve_soil", "label": "Improve Soil" } ],
  "plans": [
    {
      "planKey": "keep_routine", "number": 1,
      "badge": { "label": "Baseline Example", "tone": "neutral" },
      "title": "Keep My Current Routine",
      "mainBenefit": "Uses the equipment, seeds, and planting schedule you already have.",
      "watchOut": "Leaves the ground bare in late winter and requires more store-bought fertilizer.",
      "sequence": [
        { "slot": "fall_winter", "slotLabel": "Fall / Winter", "seasonNumber": "S1",
          "crop": { "id": "fallow", "name": "Fallow", "image": { "thumbUrl": "…", "alt": "…" } }, "roleTag": "Bare Ground" },
        { "slot": "spring", "slotLabel": "Spring", "seasonNumber": "S2",
          "crop": { "id": "field-corn", "name": "Field Corn", "image": { "thumbUrl": "…", "alt": "…" } }, "roleTag": "Cash Crop" },
        { "slot": "summer_fall", "slotLabel": "Summer / Fall", "seasonNumber": "S3",
          "crop": { "id": "soybeans", "name": "Soybeans", "image": { "thumbUrl": "…", "alt": "…" } }, "roleTag": "Legume Grain" }
      ],
      "fit": [
        { "metricId": "water",        "label": "Water Needs",     "value": 65, "level": "moderate", "fitLabel": "Moderate Fit", "note": "Standard watering needed during hot summer months." },
        { "metricId": "soil",         "label": "Soil Health",     "value": 48, "level": "low", "fitLabel": "Needs Checking", "note": "…" },
        { "metricId": "erosion",      "label": "Soil Protection", "value": 42, "level": "low", "fitLabel": "Needs Checking", "note": "…" },
        { "metricId": "practicality", "label": "Fits Your Farm",  "value": 95, "level": "high", "fitLabel": "Good Fit", "note": "…" },
        { "metricId": "economy",      "label": "Costs & Earnings","value": 70, "level": "moderate", "fitLabel": "Moderate Fit", "note": "…" }
      ],
      "matchScore": 64,
      "rank": 3,
      "recommended": false,
      "recommendedLabel": null,
      "evidence": ["Soil moisture was drier than usual in 11 of the last 12 months (SMAP, area level)."],
      "infoGaps": ["No local soil test.", "No market prices."],
      "risksToReview": ["Check irrigation timing with a local agricultural officer."],
      "dataConfidence": { "level": "low", "note": "Sample scoring." }
    }
  ],
  "notices": ["Scores show how well a plan fits, not what your yield or profit will be."]
}
```
Plans are always returned in order 1, 2, 3 (`keep_routine`, `improve_soil`, `save_water`). The UI highlights the plan with `recommended: true`.
`matchScore` and `rank` are computed by Node from the farmer's priorities (weights in the build guide, section 9.8). `recommendedLabel` example: "Recommended for Soil Goals".
`evidence`, `infoGaps`, `risksToReview` are shown under a "Why this plan?" expander (challenge requirement).

Errors: 400, 409 `FARM_SETUP_INCOMPLETE`, 422, 502.

### POST `/plans/choose` 👤 (button "Choose This Plan")
Request `{ "planSetId": "667b…", "planKey": "improve_soil", "startDate": "2026-11-15" }` (`startDate` optional, default today) **[A15]**
Response 201: **ActivePlan** object (section 9). Any previous active plan is archived.
Errors: 404 (planSetId not owned or unknown), 400, 409.

---

## 9. Dashboard (page: My Farm Dashboard) **[PLANNED]**

All endpoints are 👤 (account or guest). Nothing on the dashboard or reports needs the user's name.

### ActivePlan object
```json
{
  "id": "668c…",
  "planKey": "improve_soil",
  "title": "Improve My Soil",
  "chosenAt": "2026-11-06T10:00:00.000Z",
  "startDate": "2026-11-15",
  "status": "placeholder",
  "sequence": [
    { "slot": "fall_winter", "seasonLabel": "Season 1 · Fall / Winter", "roleTag": "Cover Crop",
      "crop": { "id": "winter-rye", "name": "Winter Rye", "description": "Protects topsoil & holds moisture",
                "image": { "url": "…", "thumbUrl": "…", "alt": "…" } },
      "calendar": { "plantingLabel": "Late Sep – Oct", "harvestLabel": null },
      "state": "upcoming_next" }
  ],
  "fit": [ { "metricId": "water", "label": "Water Needs", "value": 82, "level": "high", "fitLabel": "Good Fit", "note": "…" } ],
  "seasonDetails": [ { "slot": "fall_winter", "cropId": "winter-rye", "groundCover": { "value": 92, "label": "Rye Cover Canopy", "note": "…" }, "waterDemand": { "value": 25, "label": "Low evaporative demand", "note": "…" } } ],
  "evidence": [], "infoGaps": [], "risksToReview": [],
  "dataConfidence": { "level": "low", "note": "Sample scoring." }
}
```
`state` ∈ `upcoming_next`, `scheduled`, `in_progress`, `done` (computed from `startDate` and today).

### GET `/plans/active` 👤
`{ "activePlan": <ActivePlan> }` or `{ "activePlan": null }`.

### GET `/dashboard` 👤
```json
{
  "header": { "farmName": "Cedar Valley Family Farm", "centerId": "desouk", "centerName": "Desouk", "locationLabel": "Desouk · Kafr El-Sheikh" },
  "hasActivePlan": true,
  "seasonProgress": {
    "currentSlot": "fall_winter", "currentCropName": "Winter Rye",
    "dayOfSeason": 42, "totalDays": 150, "percent": 28, "state": "in_progress",
    "isEstimate": true
  },
  "land": {
    "dataThrough": { "cropHealth": "2025-06", "soilMoisture": "2025-06", "heatWeather": "2025-12", "heatSatellite": "2025-06" },
    "tiles": [ "…same shape as /centers/:id/overview → tiles" ],
    "soilMoisture": { "…same as overview → soilMoisture" },
    "landRisk": { "…same as overview → landRisk" },
    "areaWarning": "These numbers describe the whole area, not your field."
  },
  "protection": {
    "title": "Soil & Ground Cover Resilience",
    "seasons": [ { "slot": "fall_winter", "seasonLabel": "S1 · Fall / Winter", "label": "Rye Cover Canopy", "value": 92, "note": "…" } ],
    "overall": { "level": "high", "fitLabel": "Good Fit" }
  },
  "waterBySeason": {
    "title": "Water Needs by Season",
    "seasons": [ { "slot": "fall_winter", "seasonLabel": "S1: Winter Rye (Fall / Winter)", "value": 25, "label": "Low evaporative demand" } ]
  },
  "plan": "<ActivePlan, same as /plans/active>",
  "reportsAvailable": true
}
```
If there is no active plan: `hasActivePlan: false`, `seasonProgress`, `protection`, `waterBySeason` and `plan` are `null`, and `land` is still returned (when a center is selected). The UI shows "Choose a plan to unlock your dashboard" with a link to Compare Plans.
If no center is selected: `land: null`.

Removed from the mockup (no data): Plot Schedule "11 of 12 plots", Live Soil Chemistry NPK, "Ahead of Fall Frost schedule", "+0.3% YoY organic matter", "195 bu/ac target", "Cover Crop Area 2.3 ha", "Optimal Topsoil 31.4%".

### GET `/reports/summary` 👤
The "simple summary report" (also used by "View Full Plan").
```json
{
  "generatedAt": "2026-11-06T10:00:00.000Z",
  "center": { "id": "desouk", "name": "Desouk" },
  "dataThrough": { "…": "…" },
  "landStory": {
    "soilMoisture": { "observed": "…", "mayMean": "…", "toVerify": "…" },
    "landRisk": { "observed": ["…"], "meaning": ["…"], "verify": ["…"], "confidence": "Medium — the record is only 11 years long" }
  },
  "farm": { "…Farm object…" },
  "plan": "<ActivePlan or null>",
  "limits": ["…"],
  "disclaimer": "This tool helps you see the picture. Your own decisions, your knowledge of your land, and local agricultural expertise come first."
}
```
Text blocks are copied exactly from the data files. A downloadable PDF is optional (later phase).

---

## 10. Journey (navbar state) **[PLANNED]**

👤 (account or guest).

### GET `/journey` 👤
```json
{
  "steps": [
    { "id": "explore", "label": "Explore Land", "route": "/explore", "status": "done" },
    { "id": "farm", "label": "My Farm", "route": "/farm", "status": "current" },
    { "id": "lab", "label": "Rotation Lab", "route": "/lab", "status": "locked" },
    { "id": "compare", "label": "Compare Plans", "route": "/compare", "status": "locked" },
    { "id": "dashboard", "label": "My Dashboard", "route": "/dashboard", "status": "locked" }
  ],
  "nextRoute": "/farm"
}
```
Status rules: `explore` done when `centerId` set · `farm` done when `setupStatus=complete` · `lab` and `compare` unlock when farm is complete · `dashboard` done when an active plan exists. Routes are suggestions; the frontend may map them to its own paths.
The navbar (Home, Explore Land, My Farm, Rotation Lab, Compare Plans, My Dashboard) uses this to disable locked steps. The avatar/profile entry is shown only to logged-in accounts; guests see Log in / Sign up instead.

---

## 11. Python scoring service contract (MOCK now; Node only)

Node calls it; the browser never does. Switch with env `SCORING_MODE=mock|python`. In `mock` mode, Node produces the same shapes locally and sets `status: "placeholder"`.
Timeout 5 s, no retries, header `X-Request-Id`. Python never calls Node.

### POST `{PYTHON_URL}/v1/score`
Request (sent by Node)
```json
{
  "requestId": "uuid",
  "centerId": "desouk",
  "farm": {
    "waterSource": "mixed", "waterAvailability": "sometimes_limited", "soilType": "loamy",
    "equipment": ["standard_tractor","seed_drill_planter","combine_harvester"],
    "seasonsPerYear": 2, "priorities": ["save_water","improve_soil"],
    "landArea": { "value": 42.5, "unit": "acres" }
  },
  "sequence": [
    { "slot": "fall_winter", "crop": { "id": "winter-rye", "family": "grass", "isLegume": false, "waterNeed": "low", "groundCover": "high", "costLevel": "low", "equipment": ["seed_drill_planter"], "typicalDays": 150 } },
    { "slot": "spring", "crop": { "id": "crimson-clover", "family": "legume", "isLegume": true, "waterNeed": "low", "groundCover": "high", "costLevel": "low", "equipment": ["seed_drill_planter"], "typicalDays": 90 } },
    { "slot": "summer_fall", "crop": { "id": "field-corn", "family": "grass", "isLegume": false, "waterNeed": "high", "groundCover": "medium", "costLevel": "high", "equipment": ["standard_tractor","seed_drill_planter","combine_harvester"], "typicalDays": 120 } }
  ]
}
```
Crop attributes come from the MongoDB crop catalog (single source of truth); Python looks up the land data itself from `centerId`.

Response (Python → Node)
```json
{
  "status": "final",
  "modelVersion": "1.0.0",
  "metrics": {
    "water":        { "value": 68, "level": "moderate", "text": "…", "basis": "…", "reasons": ["corn_high_water"] },
    "soil":         { "value": 86, "level": "high", "text": "…", "basis": "…", "reasons": [] },
    "erosion":      { "value": 79, "level": "high", "text": "…", "basis": "…", "reasons": [] },
    "practicality": { "value": 90, "level": "high", "text": "…", "basis": "…", "reasons": [] },
    "economy":      { "value": 70, "level": "moderate", "text": "…", "basis": "…", "reasons": [] }
  },
  "seasonDetails": [
    { "slot": "fall_winter", "cropId": "winter-rye",
      "groundCover": { "value": 92, "label": "Rye Cover Canopy", "note": "…" },
      "waterDemand": { "value": 25, "label": "Low evaporative demand", "note": "…" } }
  ],
  "dataConfidence": { "level": "medium", "note": "…" },
  "gaps": ["…"],
  "notices": ["…"]
}
```
Rules for Node: validate the shape, add `id/title/question/levelLabel/fitLabel`, never change `value`, `text`, `basis`, `note`.

### POST `{PYTHON_URL}/v1/plans`
Request (sent by Node)
```json
{
  "requestId": "uuid", "centerId": "desouk",
  "farm": { "…same as /v1/score…", "currentCrops": [ { "id": "field-corn", "family": "grass", "isLegume": false, "waterNeed": "high", "groundCover": "medium", "costLevel": "high", "equipment": ["…"], "typicalDays": 120 } ] },
  "labSequence": [ { "slot": "fall_winter", "crop": { "…": "…" } } ],
  "candidateCrops": [ { "id": "winter-rye", "slots": ["fall_winter"], "…": "…" } ]
}
```
`labSequence` may be `null`.

Response
```json
{
  "status": "final",
  "modelVersion": "1.0.0",
  "plans": [
    {
      "planKey": "keep_routine",
      "badge": { "label": "Baseline Example", "tone": "neutral" },
      "title": "Keep My Current Routine",
      "mainBenefit": "…", "watchOut": "…",
      "sequence": [ { "slot": "fall_winter", "cropId": "fallow", "roleTag": "Bare Ground" }, { "slot": "spring", "cropId": "field-corn", "roleTag": "Cash Crop" }, { "slot": "summer_fall", "cropId": "soybeans", "roleTag": "Legume Grain" } ],
      "metrics": {
        "water": { "value": 65, "level": "moderate", "note": "…" },
        "soil": { "value": 48, "level": "low", "note": "…" },
        "erosion": { "value": 42, "level": "low", "note": "…" },
        "practicality": { "value": 95, "level": "high", "note": "…" },
        "economy": { "value": 70, "level": "moderate", "note": "…" }
      },
      "seasonDetails": [ { "slot": "fall_winter", "cropId": "fallow", "groundCover": { "value": 10, "label": "Bare ground", "note": "…" }, "waterDemand": { "value": 5, "label": "Very low demand", "note": "…" } } ],
      "evidence": ["…"], "infoGaps": ["…"], "risksToReview": ["…"],
      "dataConfidence": { "level": "medium", "note": "…" }
    }
  ]
}
```
Exactly 3 plans with keys `keep_routine`, `improve_soil`, `save_water`. Python does NOT rank. Node ranks.

### GET `{PYTHON_URL}/v1/health` → `{ "ok": true, "modelVersion": "…" }`

---

## 12. Images

- Served by Node (public, no login, cross-origin allowed) from `/static/crops/<cropId>.webp` (full, ≈800×600) and `/static/crops/thumb/<cropId>.webp` (≈240×240).
- API always returns absolute URLs (built from `PUBLIC_BASE_URL`).
- Every crop in the catalog has `image.url`, `image.thumbUrl`, `image.alt`. The seed script fails if a file is missing.
- Crop images needed (11): `winter-rye`, `crimson-clover`, `field-corn`, `soybeans`, `winter-wheat`, `alfalfa-hay`, `grain-sorghum`, `cotton`, `daikon`, `field-peas`, `fallow`.
- The 11 images currently in the project are labelled **PLACEHOLDER** pictures; real photos replace them later under the same file names with no API change.
- Hero/landing images and the avatar placeholder are frontend assets.

---

## 13. Endpoint index

| # | Method | Path | Auth | Page | Status |
|---|---|---|---|---|---|
| 1 | POST | /auth/signup | 🌐 | Sign Up | BUILT |
| 2 | POST | /auth/login | 🌐 | Log In | BUILT |
| 3 | POST | /auth/logout | 🔒 | any (account) | BUILT |
| 4 | POST | /auth/forgot-password | 🌐 | Log In | BUILT (stub) |
| 5 | GET | /me | 🔒 | Profile | BUILT |
| 6 | PATCH | /me | 🔒 | Profile | BUILT |
| 7 | POST | /me/password | 🔒 | Profile | BUILT |
| 8 | DELETE | /me | 🔒 | Profile | BUILT |
| 9 | GET | /meta/options | 🌐 | My Farm, Profile | BUILT |
| 10 | GET | /crops | 🌐 | My Farm, Rotation Lab | BUILT |
| 11 | GET | /farm | 👤 | Profile, My Farm | BUILT |
| 12 | PUT | /farm/center | 👤 | Explore Land | BUILT |
| 13 | PUT | /farm | 👤 | My Farm | BUILT |
| 14 | PATCH | /farm | 👤 | Profile / My Farm | BUILT |
| 15 | GET | /centers | 🌐 | Explore Land | BUILT |
| 16 | GET | /map/layers | 🌐 | Explore Land | BUILT |
| 17 | GET | /map/layers/:layerId | 🌐 | Explore Land | BUILT |
| 18 | GET | /centers/:centerId/overview | 🌐 | Explore Land | BUILT |
| 19 | GET | /centers/:centerId/layers/crop-health | 🌐 | Explore Land | BUILT |
| 20 | GET | /centers/:centerId/layers/soil-moisture | 🌐 | Explore Land | BUILT |
| 21 | GET | /centers/:centerId/layers/heat-stress | 🌐 | Explore Land | BUILT |
| 22 | GET | /centers/:centerId/layers/land-risk | 🌐 | Explore Land | BUILT |
| 23 | GET | /glossary | 🌐 | everywhere | BUILT |
| 24 | GET | /rotation/draft | 👤 | Rotation Lab | PLANNED |
| 25 | POST | /rotation/score | 👤 | Rotation Lab | PLANNED |
| 26 | POST | /plans/compare | 👤 | Compare Plans | PLANNED |
| 27 | POST | /plans/choose | 👤 | Compare Plans | PLANNED |
| 28 | GET | /plans/active | 👤 | Dashboard | PLANNED |
| 29 | GET | /dashboard | 👤 | Dashboard | PLANNED |
| 30 | GET | /reports/summary | 👤 | Dashboard | PLANNED |
| 31 | GET | /journey | 👤 | Navbar | PLANNED |
| — | GET | /static/crops/... | 🌐 | images | BUILT |

Legend: 🌐 public · 🔒 account only · 👤 account **or guest** (`Authorization` or `X-Guest-Id`).

The Home page needs no API (static content). Remove unsupported claims from it ("Spot issues 2 weeks early", "up to 35% less fertilizer", "+14 days headstart") unless the team can source them.

---

## 14. Assumptions to confirm (flagged with [A#] above)

| # | Assumption |
|---|---|
| A1 | **Resolved.** The response envelope, error shape and `/api` prefix match the existing game code (`errorResponse.js`, `routes/index.js`). Differences from v0.1 text: validation `details` is `{ issues: [{ path, message }] }`, the rate-limit code is `RATE_LIMITED`, the server error code is `INTERNAL`. |
| A2 | Login is by email only. |
| A3 | Forgot-password is a stub until an email service exists. |
| A4 | Email cannot be edited in the profile. |
| A5 | "Not Sure" soil text changed because USDA SSURGO is US-only. |
| A6 | Level bands 75/60 are proposed. The mockup is inconsistent (81% "MODERATE", 80% "Good Fit"). The data team should confirm. |
| A7 | Site coordinates differ between layers (e.g. Sidi Salem lon 30.78 atlas vs 30.98 heat vs box 30.85–31.10). The map box uses the NDVI `bbox`. |
| A8 | Erosion Risk has no data and is shown as unavailable. The atlas is a desertification screening, not erosion. |
| A9 | Soil-moisture map colors are proposed constants. |
| A10 | Heat-stress has no level thresholds from the data team, so no fixed color bins yet. |
| A11 | Heat stress uses fixed defaults (35 °C, 2 SD) from `summary_default`; no live sliders. |
| A12 | "18-Month Cycle" with 3 seasons needs agronomy review. |
| A13 | No yield/profit/dollar figures anywhere (challenge rule). |
| A14 | Lab selection replaces Plan 2 on the Compare page. |
| A15 | `startDate` defaults to today; the UI has no date picker yet. |
| A16 | The existing game identifies players through `middleware/player.js` and `X-Player-Id`. SoilMate accounts and guests are separate (`Authorization` / `X-Guest-Id`) and the game stays untouched. Linking a game Player to a User is a later decision. |
| A17 | The crop list is copied from the US-style mockup (corn, soybeans, rye, clover…). The study area is the Nile Delta, so the agronomy owner should replace the catalog; the API does not change. |
| A18 | **Guests.** The whole SoilMate journey works without an account via `X-Guest-Id` (UUID v4 made by the frontend). A guest is stored like a user (farm, plans), cannot log in, and is deleted after 90 days without use. |
| A19 | NDVI is shown with 2 decimals in the overview tile, `lastMonths` and the `crop_health` map layer (matches the 0.56 example). Layer-detail endpoints keep the raw value. Confirm with the data owner. |
| A20 | `landArea` is `null` when empty (not an object with null parts). `farmName` / `farmLocationText` can be cleared with `null` or `""`. |
| A21 | **Guest → account policy.** On signup/login the guest's farm and plans move to the account only if the account has no farm yet. If the account already has a farm, that farm is kept and the guest's data is deleted. |
| A22 | Heat data issues to report to the data team: Desouk shows 119.5 hot days/year and a 46.54 °C hottest day, which conflicts with satellite temperature; Baltim and Sidi Salem have identical heat summaries (same weather grid cell). Returned unchanged. |
| A23 | Sidi Salem's longitude is 30.78 in the atlas and 30.98 in the heat file (extends A7). The NDVI file has no label text for the "low" level; "Nearly bare" comes from this contract. |
| A24 | Email verification and password-reset e-mails are not built: `emailVerified` stays `false` and forgot-password is a stub (A3). |

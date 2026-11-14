# SoilMate — Frontend Notes per Screen (v0.2)

Read with `soilmate-api-contract.md` **v0.2** (exact request/response shapes). v0.2 adds **guest access** (the whole app works without an account), the game's error format, and the final Explore Land shapes. This file says, for each screen: which calls to make, where each visible label comes from, and which mockup labels must change because the data does not support them.

Legend: ✅ keep · 🔁 replace (use the API field shown) · ❌ remove (no data behind it)
Endpoint tags in the contract: 🌐 public · 🔒 account only · 👤 account **or guest**.

---

## 0A. Guests (read first)

The whole journey works **without an account**: Home → Explore Land → My Farm → Rotation Lab → Compare Plans → Dashboard → Reports. Only **Profile** (and Log out) needs an account.

1. First visit: `localStorage.guestId = crypto.randomUUID()`. Create once; never regenerate while it exists.
2. While logged out, send `X-Guest-Id: <guestId>` on every 👤 request (farm, rotation, plans, dashboard, reports, journey).
3. While logged in, send **only** `Authorization: Bearer <token>`. Never both.
4. A bad or expired token is always a 401; the server never falls back to the guest id. Clear the token and show "Please log in again".
5. **Sign Up / Log In:** also send `X-Guest-Id`. Read `response.guestData`:
   - `adopted` → the guest's farm and plans now belong to the account.
   - `discarded` → the account already had a farm; it is kept and the guest data is deleted. Show "We kept the farm saved on your account."
   - `none` or absent → nothing moved.
   Then save the token, and **delete `guestId` from localStorage only when `guestData` is present**. Re-fetch `/farm` and `/journey` (do not reuse cached guest state).
6. Log out: delete the token, then create a new guest id.
7. Guests calling `/me*` or `/auth/logout` get 401. Never call them for guests; hide the avatar and show Log in / Sign up.
8. Errors: 401 `UNAUTHENTICATED` (no identity) · 400 `INVALID_GUEST_ID` (create a new id, retry once).
9. Never put the guest id in URLs, logs or analytics. Clearing browser data loses a guest's farm; suggest signing up to keep it. Unused guests are deleted after 90 days.

---

## 0. Rules for every screen

| Rule | Detail |
|---|---|
| Auth helper | One fetch helper adds the identity header to every SoilMate call except the 🌐 public ones: `Authorization: Bearer <token>` if a token exists, otherwise `X-Guest-Id: <guestId>` (see 0A). Do not add either to the game's calls (the game uses `X-Player-Id`). |
| Token storage | `rememberMe` true → `localStorage`, false → `sessionStorage`. Delete it on logout and on any 401. |
| 401 | Clear the token. If the call was account-only (`/me*`, logout) or the user had a token, redirect to Log In. A guest never gets a 401 on 👤 calls unless the id is missing. |
| Errors | Shape is `{ error: { code, message, details } }`. Branch on `code`. For `VALIDATION_ERROR` loop `details.issues[]` = `{ path, message }`; strip the leading `body.` / `query.` from `path` to find the input and show `message` under it. Otherwise show `message` as a banner. Never show raw codes to the farmer. Exception: `?include=` on crop-health returns `details: { include }`. |
| Sample badge | If any response has `status: "placeholder"`, show a small visible "Sample scores" badge on that block. Hide it when `status` is `"final"`. |
| Data date | Whenever data from the layers is shown, show "Latest reading: <month year>" from `dataThrough`. All layers end in mid/late 2025. |
| Area warning | Show `areaWarning` ("These numbers describe the whole area, not your field.") on every land-data block. |
| No invented numbers | Never display yield, profit, dollars per acre, % fertilizer saved, NPK, pH, plot counts, or live weather. The API never sends them. |
| Labels from the API | Option cards, goals, metric titles and level labels come from the API. Do not hard-code them. |
| Images | URLs are absolute (`{API_BASE}/static/crops/...`); use them as given. `image.thumbUrl` for cards, `image.url` for large views, `alt` from the API, a neutral fallback if loading fails. The 11 images are **placeholders** for now; real photos will keep the same URLs. |
| Rate limit | 429 `RATE_LIMITED`: wait the seconds in the `RateLimit-Reset` header. Explore Land allows 300 requests/minute per IP and is cached for 1 hour (the browser handles 304 by itself). |
| CORS | Allowed request headers: `Content-Type`, `Authorization`, `X-Guest-Id`. The preflight request is expected. |
| Navbar | Call `GET /journey` once on load (guest or account) and again after signup/login. Disable steps with `status: "locked"`. Items: Home, Explore Land, My Farm, Rotation Lab, Compare Plans, My Dashboard. **Avatar only for logged-in accounts**; guests see Log in / Sign up. |
| Loading | Show skeletons. For scoring calls keep the previous values visible (dimmed) while the new ones load. |
| Language | English only. Numbers stay left-to-right. |
| Glossary | Call `GET /glossary` once. Underline (dotted) any glossary `term` in API text, first appearance per paragraph. Tap shows `short` and a "Play to learn more" button that opens the game at `gameSection`. |

---

## 1. Sign Up and Log In

**Calls**
- `POST /auth/signup` · `POST /auth/login` · after success `GET /journey` to choose the redirect (`nextRoute`).
- Send `X-Guest-Id` (if a guest id exists) on both so the guest's farm moves into the account. Handle `guestData` as in 0A.
- Forgot password: `POST /auth/forgot-password`.

**Sign Up fields → request**

| UI | Request field | Notes |
|---|---|---|
| Full Name | `fullName` | 2–80 characters |
| Email Address | `email` | |
| Password | `password` | 8–72 chars, at least 1 letter and 1 number. Show this hint under the field. |
| Confirm Password | `confirmPassword` | must match |
| Terms checkbox | `acceptedTerms: true` | button stays disabled until checked |

**Log In fields → request:** Email Address → `email`, Password → `password`, Remember me → `rememberMe`.

**What comes back:** `{ token, expiresAt, user }` plus `guestData` (`adopted` / `discarded` / `none`) only when a valid `X-Guest-Id` was sent. Store the token and `user`, then follow 0A step 5.

**Errors to handle**
- 400 `VALIDATION_ERROR`: show each `details.issues[]` message under its field (`path` such as `body.email`).
- 409 `EMAIL_ALREADY_REGISTERED`: under the email field, with a "Log in instead" link.
- 401 `INVALID_CREDENTIALS`: one banner, "Email or password is incorrect." The API never says which.
- 429 `RATE_LIMITED`: "Too many tries. Please wait a few minutes." (signup 10/hour, login 10/15 min per IP).
- A failed login never touches the guest's data; the guest keeps working.
- Add a visible link on Log In and Sign Up: "Continue as guest" → Explore Land.

**Label changes**
- 🔁 The glass card on the login mockup says "Email or Username". Use **Email** only (no usernames exist).
- 🔁 Forgot password: always show the generic message "If this email is registered, you will receive reset instructions." No email is actually sent yet.
- ✅ Terms line: keep, but "satellite crop telemetry data storage" is not accurate. Suggested: "regarding how your account and farm data are stored."
- 🔁 The sign-up placeholder email (`alex@cedarvalleyfarms.com`) is fake sample text; show it as placeholder style, not as a value.

---

## 2. Profile

**Account only.** A guest who opens Profile sees "Create an account to keep your farm and edit your profile" with Sign Up / Log In buttons; do not call `/me` for guests. (The farm form lives on the My Farm screen for everyone.)

**Calls on load:** `GET /me`, `GET /farm`, `GET /meta/options`, `GET /crops?use=current`.
**Calls on action:** `PATCH /me`, `PATCH /farm`, `POST /me/password`, `DELETE /me`.

| UI | Source | Notes |
|---|---|---|
| Name / email in header | `me.fullName`, `me.email` | |
| Avatar | `me.avatarUrl` | If `null`, show initials. Uploading is not available yet, so hide or disable "Edit Profile" avatar change. |
| Verified badge | `me.emailVerified` | Show only when `true`. It is `false` for now, so usually hidden. |
| Full Name | `me.fullName` | editable → `PATCH /me` |
| Email Address | `me.email` | **read-only** |
| Phone Number | `me.phone` | editable → `PATCH /me`. Allowed: optional "+", 7–15 digits. Empty → send `null`. |
| Password "Last updated 3 months ago" | `me.passwordChangedAt` | compute the "x months ago" text in the frontend |
| Farm Name | `farm.farmName` | |
| Farm Location | `farm.farmLocationText` (`null` or `""` clears it) | free text. The farm's data area is the selected center (shown below it as read-only "Data area: Desouk" from `farm.centerId`). |
| Total Land Area + Acres/Hectares | `farm.landArea?.value`, `farm.landArea?.unit` | `landArea` is `null` until entered. Send both `value` (>0, ≤100000) and `unit` together. |
| Main Crops chips | `farm.currentCropsDetail` | "+ Add Crop" opens a picker from `GET /crops?use=current`. Max 8. |
| Primary Water Source | `farm.waterSource` | options from `options.waterSource` |
| Farming Priorities chips | `farm.priorities` | labels from `options.priority[].profileLabel`. Max 3. The 4th chip is disabled. |

**Buttons**
- **Save All Changes / Save Changes:** send `PATCH /me` and `PATCH /farm` together (`Promise.all`). If one fails, show which part failed; keep the other saved.
- **Reset Defaults:** frontend only. Reload the last saved values from the API.
- **Change Password:** modal with current / new / confirm → `POST /me/password`. On 204 the old token stops working: clear it and send the farmer to Log In with "Password updated. Please log in again."
- **Log Out:** `POST /auth/logout` (optional) then clear the token and create a new guest id.
- **Delete Account:** modal where the farmer types their email → `DELETE /me { confirmEmail }`. On 204 clear everything and go Home.

**Label changes**
- ❌ "4 active in Rotation Lab" → replace with "N selected" (count of `currentCrops`). No such backend count exists.
- ❌ "Local preferences stored with continuous sync" → there is no auto-sync. Remove; saving happens on the buttons.
- 🔁 Water source dropdown text "Rainfed + Surface Pond" → use the 5 fixed options (Rain, River / Canal, Groundwater, Mixed Sources, Other). If `other`, show an optional text box (max 60) → `waterSourceOther`.
- ❓ The top "Preferences" button has no defined backend action. Hide it until its purpose is decided.
- 🔁 Footer: "Powered by NASA Earth Science Applied Sciences & Landsat Telemetry" → the data is NASA MODIS, SMAP and POWER (no Landsat). Suggested: "Powered by NASA MODIS, SMAP and POWER data." Remove "Soil Regeneration API" (does not exist).
- 🔁 Mockup values (Alex Henderson, Cedar Valley, IA, Field Corn…) are demo only. Use API values and empty states.

---

## 3. Home

**Calls:** none. Static page. Only the navbar uses `GET /me` (avatar, accounts only) and `GET /journey` (everyone).

- "Get Started Free" → **Explore Land for everyone** (guests included); use `nextRoute` from `/journey` to resume where they stopped.
- Logged out: **keep all step links visible** (guests can use them), and show Log In / Sign Up instead of the avatar. Add a short line: "No account needed to start. Create one later to keep your farm on any device."

**Claims to change or remove (no data supports them)**

| Mockup text | Action |
|---|---|
| "reduced fertilizer costs, and higher harvest yield" | ❌ remove yield. Suggested: "healthier soil and better-informed decisions". |
| "Spot Issues 2 Weeks Early" and "+14 Days Headstart" | ❌ remove. Not measured. Suggested card: "See Changes Over Time", about monthly vegetation and soil moisture trends since 2015. |
| "Reduce chemical synthetic fertilizer inputs by up to 35%" | ❌ remove. Suggested: "Compare rotation options that include nitrogen-fixing crops." |
| "Detect sub-surface soil moisture gradients and organic matter volume … without digging" | 🔁 data covers surface soil moisture (0–5 cm) and a model estimate of the root zone, not organic matter. Suggested: "See how wet or dry your area has been, without leaving home." |
| "Continuously verified by NASA Harvest Program" | ❌ remove. Not true for this data. |
| "Empowering … satellite telemetry that boosts productivity" | 🔁 soften: "NASA satellite data, made simple." |

Keep the card style and the 3-card layout. Add one honest line: "A decision-support tool. It does not replace your own knowledge or local experts."

---

## 4. Explore Land (the most important screen)

The farmer chooses **one of 3 areas**: Desouk, Sidi Salem, Baltim (Kafr El-Sheikh). There are no individual fields, plots or acre figures.

**Calls**
1. On load: `GET /centers`, `GET /map/layers`, `GET /map/layers/crop_health` (or the active layer), `GET /glossary`.
2. Search box: `GET /centers?q=<text>` (debounce ~250 ms). Empty list → show `coverageNote`.
3. When an area is picked: `GET /centers/:centerId/overview` and `PUT /farm/center { centerId }` (works for guests and accounts; send the identity header).
4. Changing the map layer: `GET /map/layers/:layerId` (for 3 boxes at once).
5. Detail pop-ups: `GET /centers/:centerId/layers/{crop-health | soil-moisture | heat-stress | land-risk}`.
The `/centers`, `/map`, `/glossary` and layer endpoints are public and need no header. Only `PUT /farm/center` needs the identity (guest id or token). No login prompt on this screen.

**Header and search**
- ✅ "Step 1 of 5 · Explore Your Land".
- 🔁 Search placeholder "Green Valley, IA (Parcel #12)" → "Search Desouk, Sidi Salem or Baltim".
- Show the 3 areas as selectable cards/tabs **under or beside the search box**, so the farmer never needs to type.
- ❌ "Lat/Lon" under the title → show `center.mapCenter` or leave blank.

**Map**
- Use `center.bbox = [west, south, east, north]` to draw each area as a rectangle (Leaflet bounds `[[south, west],[north, east]]`).
- Fill color from the layer response (`centers[].fillHex`). If `fillHex` is `null` (heat layer), shade by rank of `value` among the 3 areas.
- NDVI layer also gives `face` (`sad`, `neutral`, `happy`) and `valueLabel`. Draw a small face, the name and the value on the box.
- Layers panel (from `GET /map/layers`): 1 Field Overview, 2 Soil Moisture, 3 Crop Health (NDVI), 4 Heat Stress, 5 Erosion Risk.
  - 🔁 Layer 5 has `available: false`: show it greyed with `unavailableReason` ("Not available yet"). Do not call its endpoint.
- Legend: build it from `legend` in the layer response. 🔁 Replace the static "Low/Moderate/Dense Canopy" legend.
- ❌ "Clear Sky (0% Cloud)" and "Recalibrated: Today 08:30 UTC" → replace with "Latest reading: June 2025" (`dataThrough`).
- If the layer endpoint returns 404 `LAYER_NOT_AVAILABLE`, show the layer greyed (this should not happen if you skip layer 5).
- Colors are never alone: always show the word too (for soil moisture "Drier than usual / About usual / Wetter than usual"; grey = "No data").

**Selected-area card (floating card on the map)**

| Mockup | Replace with |
|---|---|
| "Field #12 · Selected" | `center.name` |
| "Area 14.8 Hectares (36.5 Acres)" | ❌ remove |
| Current Cover / Primary Soil Type | ❌ remove |
| "Soil Moisture 68%" | 🔁 `overview.soilMoisture.satellite.label` (a word, not a %). The needle is a 0–100 rank, not a water percentage. |
| "NDVI Biomass Index 0.74 (Good Vigor)" | 🔁 `tiles[crop_greenness]` → `display` + `chip.label` |
| "Moisture / Yield Est +14% / Ground Temp 22 °C" | ❌ yield and ground temp. Use hot days from `tiles[hot_days]` instead. |

**Stat tiles (top row)**

| Mockup | Replace with |
|---|---|
| Total Plots 12 | `tiles[crop_greenness]` (value + chip) |
| Crop Diversity 4 Types | `tiles[green_months]` ("Green months, last 12", %) |
| Total Area 38.5 Hectares | `tiles[soil_moisture]` (word) |
| Health Index 92% "Prime" | `tiles[hot_days]` ("Hot days per year, 35 °C and above") |

**Lower cards**

| Mockup | Replace with |
|---|---|
| Microclimate 24 °C Partly Cloudy | "Typical heat" from `overview.heat`: `avgHighC`, `avgLowC`, `hottestDay`. ❌ live weather and wind. |
| 4-day forecast circles | "Last 4 months" from `overview.lastMonths[]` (`short`, `ndvi`, `fillHex`) |
| Soil Health & Nutrients (N, P, K, pH, "Lab Calibrated") | ❌ remove entirely. Replace with the **Soil moisture card**: two needles from `overview.soilMoisture` (`satellite` and `model`), `texts.satelliteLine`, `texts.modelLine`, `texts.last12Line`, and `texts.disagreeNote` when the two states differ. Show the `confidenceLabels` under each needle. |
| Farm Performance Score 84% ring | 🔁 **Land risk** card from `overview.landRisk`: score out of 3, `level`, `levelHex`, and the 4 `indicators` (status + text). Show `landRisk.notice`. Never call it "performance". |
| NDVI Multispectral photo panel, Field 4 (Wheat) | ❌ no field photos exist. Replace with the Crop Health detail card (below). |

**Detail pop-ups (open from the tiles or the layer name)**
- **Crop Health:** 5 steps, Next / Back / Restart with dots. Step 1 summary, 2 line chart "When is it green?", 3 bar chart "Bare months", 4 line chart "Greener or not?", 5 six insight lines. Charts include all 3 areas; highlight the selected one (thick line) and fade the others. Show NDVI with 2 decimals (never `-0.00`); the detail endpoint returns the raw value (0.562), while tiles and maps already return 2 decimals, so format both the same way. Print `insights[].text` as is.
- **Soil Moisture:** calendar with a year slider (SMAP row + POWER row, grey for no data), typical year, years strip (2015 and 2025 drawn as partial years), agreement (always show the level word with the `numbers` sentence), root zone, and one summary (`observed / may mean / to verify`).
- **Heat Stress:** summary values at fixed settings (35 °C). There are no sliders.
- **Land Risk:** 4 signs and the report.
- Never call SMAP a "measurement". It is a model that uses satellite data.

**Bottom CTA**
- "Tell us about your farm" → My Farm.
- "Open in Rotation Lab" → enabled only if `GET /journey` shows the farm step done (works for guests). Otherwise disabled with the hint "Complete My Farm first".
- 🔁 "Take Field #12 into your farm dashboard to view detailed soil nutrients, NPK estimations, simulated yield gains…" → ❌ NPK and yield. Suggested: "Tell us about your farm to compare crop rotation options for this area."

**Always visible on this screen:** `areaWarning`, `dataThrough`, `disclaimer`, `footer`.
**Heat data caveat:** Desouk shows 119.5 hot days/year and a 46.5 °C hottest day, which conflicts with satellite temperature. Show the area/limits text next to every heat number; do not hide it.
**Known data oddities the UI must not hide:** Baltim and Sidi Salem share the same weather values; the NDVI layer and the land-risk card describe vegetation differently (cropland-masked area vs one pixel); say "Different methods, different results" in the info text.

---

## 5. Tell Us About Your Farm

**Calls on load:** `GET /meta/options`, `GET /crops?use=current`, `GET /farm` (prefill).
**Call on submit:** `PUT /farm`.

| Section | Request field | Options come from | Rule |
|---|---|---|---|
| Current Crops (6 image cards, multi-select) | `currentCrops` (array of crop ids) | `GET /crops?use=current` | 1–8 |
| Where does your water come from? | `waterSource` | `options.waterSource` | single; if `other`, optional text → `waterSourceOther` (max 60) |
| How available is water? | `waterAvailability` | `options.waterAvailability` | single |
| Soil Type | `soilType` | `options.soilType` | single; `not_sure` is allowed |
| Equipment & Machinery | `equipment` | `options.equipment` | multi, may be empty |
| Growing Seasons Per Year | `seasonsPerYear` | `options.seasonsPerYear` | single, number 1, 2 or 3 |
| Farmer Priorities | `priorities` | `options.priority` | 1–3, disable the 4th, show "(N selected)" |

**Behavior**
- Prefill from `GET /farm`. If the farm is empty, nothing is selected. The mockup's selected cards (Corn, Soybeans, Mixed Sources…) are demo only.
- The "Recommended" badge on "2 Seasons / Year" comes from `options.seasonsPerYear[].recommended`. Show it, but do not preselect.
- "Build My Crop Plans" is disabled until every required section has a value.
- If `farm.centerId` is `null` show "Pick your area first" with a link to Explore Land (the API would answer 409 `FARM_SETUP_INCOMPLETE`). Works the same for guests: send the identity header on `GET /farm` and `PUT /farm`.
- Success returns the Farm with `setupStatus: "complete"` → go to Rotation Lab.
- 400: show `details.issues[]` under each section (e.g. `body.priorities`).
- 422 `UNKNOWN_CROP`: `details.unknownIds` lists the bad ids; refresh the crop list and drop those ids. Nothing was saved.
- `PUT /farm` must not contain `centerId` or any unknown key (400). `waterSourceOther` is only kept when `waterSource` is `other`.
- `setupStatus` (`none` / `center_selected` / `complete`) drives the navbar: only `complete` unlocks Rotation Lab.

**Label changes**
- ❌ "NASA" badge on "Not Sure" and its text "We'll check satellite telemetry & USDA SSURGO data automatically" → use `options.soilType[not_sure].hint` ("We will treat it as unknown and flag it as missing information."). No soil dataset exists for this area.
- 🔁 "We only recommend covers and cash crops compatible with your current field rig." → equipment is used to score "Practicality", not to filter crops. Suggested: "We use this to check how well each plan fits your equipment."
- 🔁 Equipment card sub-labels "Available" / "Optional" are only selection states: selected = "Available", unselected = "Optional".
- ✅ "Step 2 of 5" label stays.
- Crop names come from the API, so some names may differ from the mockup (for example "Field Corn" instead of "Corn").

---

## 6. Try a Crop Rotation (Rotation Lab)

**Calls on load:** `GET /rotation/draft`, then `POST /rotation/score` with the draft sequence.
**Calls on action:** `GET /crops?use=rotation&slot=<slot>` for the "Change crop" picker; `POST /rotation/score` after every change.
If any call returns 409 `FARM_SETUP_INCOMPLETE`, redirect to My Farm. All Rotation Lab calls work for guests (identity header). **[Planned endpoint: shapes may still shift slightly.]**

**Score request:** always 3 items, in this order and with these slots: `fall_winter`, `spring`, `summer_fall`.
```json
{ "sequence": [ { "slot": "fall_winter", "cropId": "winter-rye" },
                { "slot": "spring", "cropId": "crimson-clover" },
                { "slot": "summer_fall", "cropId": "field-corn" } ] }
```
Do not send farm answers; the backend already has them.

| UI | Source | Notes |
|---|---|---|
| "Your goals: …" chips | `draft.goals[].label` | "Edit" opens My Farm |
| "18-Month Cycle" | `draft.cycleLabel` | keep as returned |
| Season card heading | `sequence[].slotLabel` | "Season 1 · Fall / Winter" |
| Crop name, short line, image | `sequence[].crop.name`, `.description`, `.image.thumbUrl` | |
| "Change crop" | picker from `GET /crops?use=rotation&slot=…` | after pick → `POST /rotation/score` |
| "Your Field" map | `draft.field.bbox` (draw the rectangle) | |
| Field title "Field #12 · 42.5 Acres" | 🔁 `draft.field.name` + `draft.field.areaLabel` | hide the area if `null` |
| Plan chip "Plan: Winter → Crimson → Field" | build from the 3 crop names | |
| Water / Soil / Ground Cover toggle | Water = `metrics[water].value`, Soil = `metrics[soil].value`, Ground Cover = `metrics[erosion].value` | overlay intensity on the map. No extra call. |

**The 5 assessment cards** (render `metrics[]` in the returned order)

| Card part | Field |
|---|---|
| Title | `title` |
| Percentage | `value` |
| Level word | `levelLabel` (HIGH / MODERATE / LOW) |
| Italic question | `question` |
| Sentence | `text` |
| Small footer line | `basis` |
| Bar color | by `level`: green high, amber moderate, orange low |

**Also show**
- "Sample scores" badge while `status` is `placeholder`.
- A small "What we are unsure about" expander with `dataConfidence.note` and `gaps[]`.
- `notices[]` as a one-line note under the cards.

**Label changes**
- ❌ Any dollar or yield figure, such as "netting an estimated ~$46/acre fertilizer offset", "4% slope parcel", "Based on loamy soil water retention". Use only `text` and `basis` from the API.
- 🔁 "Updated live as crops change": keep. Show a small spinner while a call is running and keep the previous numbers dimmed.
- 🔁 The metric percentages and words in the mockup are placeholders. Use the API values.
- Buttons: "Back to My Farm" → My Farm; "Compare My Plans" → Compare Plans, passing the current sequence (it is sent as `labSequence`).

**Errors:** 422 `CROP_NOT_ALLOWED_IN_SLOT` → refresh the picker and revert the change. 502 → "We could not calculate this right now. Your last result is still shown." (the previous scores stay on screen).

---

## 7. Choose the Best Plan (Compare Plans)

**[Planned endpoint.]** Works for guests. **Call on load:** `POST /plans/compare` with `{ "labSequence": [...] }` (omit it if the farmer skipped the lab). Show a skeleton while it loads (up to 5 seconds when the real service is live).
**Call on button:** `POST /plans/choose { planSetId, planKey }` → go to Dashboard.

| UI | Source |
|---|---|
| "Your goals" bar | `goals[].label` (Edit → My Farm) |
| Step label | "Step 5 of 5 · Compare & Decide" (static) |
| Top badge on each card | `plan.badge.label`, color by `plan.badge.tone` |
| Highlighted "Recommended" card | the plan with `recommended: true`; label from `recommendedLabel` (replaces the static "Recommended for Soil Goals") |
| Title ("PLAN 1 — …") | `plan.number`, `plan.title` |
| "Main benefit" / "Watch out for" | `plan.mainBenefit`, `plan.watchOut` |
| 3-season rows | `plan.sequence[]`: `seasonNumber` (S1…), `slotLabel`, `crop.name`, `roleTag` chip |
| "How this plan fits your farm" rows | `plan.fit[]`: `label`, `value`, `fitLabel` pill, `note` |
| "Choose This Plan" | `POST /plans/choose` |

Rules
- Always render the plans in the returned order (1, 2, 3). Highlight by `recommended`, never by position.
- Every fit row shows `value` and `fitLabel`. (The mockup mixes plain "(65%)" and pills; use pills everywhere.) Colors: green Good Fit, amber Moderate Fit, orange Needs Checking.
- `matchScore` (0–100) is how well a plan matches the farmer's goals. If shown, label it "Goal match" and never describe it as a prediction.
- Add a "Why this plan?" expander on each card with `evidence[]`, `infoGaps[]`, `risksToReview[]` and `dataConfidence.note`. This is a challenge requirement, so do not skip it.
- Show "Sample scores" while `status` is `placeholder`. Show `notices[]` under the cards.
- ❌ The mockup crops and sentences (Daikon, Peas, Sorghum, "check local elevator prices") are demo content. Never hard-code them; use the API.
- Choosing: disable all buttons while the call runs. 404 means the comparison expired; re-run `POST /plans/compare`.
- The farmer can go back to the lab; the lab keeps its draft.

---

## 8. Dashboard

**[Planned endpoint.]** Works for guests (no name is needed). **Call on load:** `GET /dashboard` (single call). "View Full Plan" → `GET /reports/summary`.

**Empty states**
- `hasActivePlan: false` → show "Choose a plan to unlock your dashboard" with a link to Compare Plans. Still render the land blocks if `land` is not `null`.
- `land: null` (no area selected) → show "Pick your area" with a link to Explore Land.

| Mockup block | Replace with |
|---|---|
| Header "Field #12 · North Pasture · Cedar Valley, IA" | `header.farmName` and `header.locationLabel` ("Desouk · Kafr El-Sheikh") |
| Season Progress "Day 42 of 120 · 35%" | `seasonProgress`: `dayOfSeason`, `totalDays`, `percent`, `currentCropName`. Add "Estimated" when `isEstimate` is true. States: `not_started`, `in_progress`, `completed`. ❌ remove "Ahead of Fall Frost schedule". |
| Plot Schedule "11 of 12 Plots Healthy" | ❌ no plot data. Replace with the **Green months (last 12)** tile from `land.tiles`. |
| Live Soil Chemistry (NPK, "Telemetry 99.4% Accurate", Agronomist Tip) | ❌ remove entirely. Replace with the **Soil moisture card** from `land.soilMoisture` (two needles, sentences, `confidenceLabels`, disagreement note). |
| Live Parcel Health map with Field markers, "LIVE SYNC", "Landsat NDVI Active" | 🔁 map of the selected area (`bbox`) colored by NDVI. ❌ field markers and "live". Caption: "Monthly satellite data, latest reading <month year>". The source is NASA MODIS, not Landsat. |
| Avg Field Health 94% / Mean Soil Moisture 68% / Cover Crop Area 2.3 ha | `land.tiles` (NDVI + chip, soil moisture word, hot days). ❌ cover crop area. |
| Erosion Protection · Soil & Ground Cover Resilience | `protection.seasons[]`: `seasonLabel`, `label`, `value` (shown as "% cover"), `note`. Overall chip from `protection.overall.fitLabel` (replaces "Excellent"). ❌ "+0.3% YoY organic matter". |
| Hydrology Benchmark · Water Needs by Season | `waterBySeason.seasons[]`: `seasonLabel`, `value`, `label`. ❌ "Optimal Topsoil 31.4%". |
| My Crop Plan (3 cards) | `plan.sequence[]`: `seasonLabel`, `roleTag`, `crop.name`, `crop.description`, `crop.image.url`, `calendar.plantingLabel`, and a `state` chip: `upcoming_next` "Upcoming Next", `scheduled` "Scheduled", `in_progress` "In Progress", `done` "Done". |
| "Harvest: Sep–Oct 2026 · 195 bu/Ac Target" | 🔁 `calendar.harvestLabel` only. ❌ yield target. If `harvestLabel` is `null`, hide the line. |
| "View Full Plan" | opens a Plan summary built from `GET /reports/summary` |

**Add these (required by the challenge, missing in the mockup)**
- A **Land risk** card from `land.landRisk` with its `notice`.
- A "Plan confidence" strip: `plan.dataConfidence.note`, `plan.infoGaps[]`, `plan.risksToReview[]`.
- The date line "Latest reading: …" from `land.dataThrough`, plus `land.areaWarning`.
- "Sample scores" badge while `plan.status` is `placeholder`.

**Reports (`GET /reports/summary`)**
Show three plain sections, text copied as-is:
1. **What we observed** — `landStory.soilMoisture.observed` and `landStory.landRisk.observed[]`.
2. **What it might mean** — `landStory.soilMoisture.mayMean` and `landStory.landRisk.meaning[]`.
3. **What to check on your land** — `landStory.soilMoisture.toVerify` and `landStory.landRisk.verify[]`, plus `limits[]` and `disclaimer`.
Add a print button (browser print) so the farmer can keep a copy.

---

## 9. Quick map: label → what to do

| Mockup label | Action |
|---|---|
| Field #12, Parcel #12, plots, crop diversity, total area | ❌ |
| NPK, pH, "Lab Calibrated", soil chemistry | ❌ |
| Yield %, bu/ac target, $ per acre, fertilizer savings | ❌ |
| Farm Performance Score | 🔁 Land risk (score out of 3) |
| Soil moisture 68% | 🔁 word + needle (rank 0–100), never a water % |
| Health Index "Prime" | 🔁 Green months (last 12) |
| Microclimate / live weather / 4-day forecast | 🔁 Typical heat + last 4 months NDVI |
| Clear sky, "Recalibrated today", "LIVE SYNC" | 🔁 "Latest reading: <month year>" |
| Landsat | 🔁 NASA MODIS, SMAP, POWER |
| USDA SSURGO | ❌ (US only) |
| Plot schedule, cover crop area, "Ahead of frost schedule" | ❌ |
| Erosion Risk layer | greyed out: "Not available yet" |
| Static plan names, crops, sentences | 🔁 always from the API |
| "Log in to continue" gates before Farm, Lab, Plans, Dashboard | ❌ remove; guests may use every step |
| Profile for guests | Show "Create an account" prompt instead of the form |

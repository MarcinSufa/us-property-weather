# Round 4 of 5: the detail page

Read `docs/agent/slices/web/00-worker-rules.md` in full first, then `AGENTS.md`, `docs/plan.md` sections 5 and 10, `docs/design/README.md`, and the boards `docs/design/PropertyDetail.dc.html`, `DetailStates.dc.html`, `Tokens.dc.html`. Then read what rounds 1 to 3 left in `apps/web/src/**`: styles, layout, `PageTitle`, the `Property` document in `src/graphql/operations.ts`, the list page with its date and "Not reported" formatting and its loading and error states, the test helper and the existing tests. Reuse them: one function formats a date, one formats a missing value, the load-error alert with "Try again" and the skeleton exist already. If a piece of the list page has to be shared, move it to a shared module; do not copy it.

This round builds `/properties/:id`: `PropertyDetailPage` with the component `WeatherCard` in `apps/web/src/components/`. The "Delete property" button of the board and its dialog come in round 5: leave them out.

## Proposed criteria used in this round

- `AC-WEB-15`: Given a property that exists, when its detail page renders, then it shows street, city, state, zip code, latitude, longitude and the creation time.
- Reused from round 2: `AC-WEB-5` ("Not reported" for a weather value the service did not send), `AC-WEB-6` (creation time as `<time>` with the ISO value in `dateTime`), `AC-WEB-7` ("Try again" asks the network again).

## Behaviour

The page sends the `Property` query with the `id` of the route.

Loaded, per `PropertyDetail.dc.html`:

- `main` 1120px wide at most. A link "All properties" to `/` with the chevron icon (the form page has the same link: share it). The `<h1>` is the street. Under it the muted line `City, ST 85268` with the zip code in the mono font.
- The document title is `<street> - CoverTree`.
- Two cards in the grid of the board (`repeat(auto-fit, minmax(320px, 1fr))`, which already stacks at phone width; make sure nothing overflows at 390px: the 320px minimum must not exceed the available width).
- Card "Property" (`<h2>`), a description list: Street, City, State (as `AZ Arizona`), Zip code (mono), Latitude (mono), Longitude (mono), Created (a `<time>` with `dateTime` as received, text from the shared date function). Latitude and longitude are shown as the numbers received, without rounding.
- Card "Weather at creation" (`<h2>`), the component `WeatherCard`, which receives the weather data and the creation time:
  - The line under the title: `Observed 05:12 PM UTC on Oct 13, 2026. Saved once, never refreshed.` The time is `observation_time` as received (Weatherstack sends a UTC clock time without a date); the date is the creation time formatted in UTC (`Intl.DateTimeFormat` with `timeZone: 'UTC'`, `dateStyle: 'medium'`). When `observation_time` is null: `Observation time: Not reported. Saved once, never refreshed.`
  - The highlighted block: the temperature as `24 °C` at 36px, and under it the first weather description and `feels like 23 °C`, joined with the middle dot as on the board. Each missing part reads "Not reported". The sun icon of the board is decoration (`aria-hidden`); do not load `weather_icons` images (they are remote URLs and the page must work without the network).
  - A description list of the remaining fields the schema exposes, in this order, metric units: Humidity (`18 %`), Wind (`11 km/h SW`, speed and direction; either part missing reads "Not reported" in its place, both missing reads it once), Wind direction (`225°`, from `wind_degree`), Pressure (`1012 mb`), Precipitation (`0 mm`), Cloud cover (`0 %`), UV index (`6`), Visibility (`16 km`), Daytime (`Yes` or `No` from `is_day` being `yes` or `no`; any other value as received), Weather code (the number). A null field reads "Not reported". A value of `0` is a value, not a missing one.
  - No footnote explaining "Not reported" is needed; the board's footnote is a note to the reader of the board.

States, per `DetailStates.dc.html`, wording from the board. In each of them the page has exactly one `<h1>`:

- Loading: `<h1>` "Property details", a card with `aria-busy="true"`, a `role="status"` line "Loading property…" and static skeleton bars. Title `Property - CoverTree`.
- Load error (network failure or any GraphQL error): `<h1>` "Property details", the alert with the title "Could not load this property" and the body "The server did not answer. Nothing was changed.", a secondary button "Try again" (sends the query to the network again) and a link "All properties" to `/`. Title `Property - CoverTree`.
- Not found (`property` is null): the `<h1>` is "Property not found" in the empty-state card at the state-title size (20px), with the sentence of the board and a secondary link "Back to all properties" to `/`. Title `Property not found - CoverTree`.

## Tests first

`apps/web/src/pages/PropertyDetailPage.test.tsx`, rendered through the test helper at `/properties/<id>`, with `msw` handlers for the `Property` query that record the variables. One full fixture with every weather field set, and variants.

- `AC-DETAIL-1 ...`: the query is sent with the `id` of the route.
- `AC-WEB-15 ...`: the `<h1>` is the street; street, city, state, zip code, latitude and longitude are shown under their terms (find the definition through its term, by role `term` and `definition`, or by text within the card found by its heading).
- `AC-WEB-6 ...`: the creation time is a `<time>` whose `dateTime` equals the `createdAt` sent.
- `AC-DETAIL-5 ...`: a region or section named "Weather at creation" exists and shows the `observation_time` sent.
- `AC-DETAIL-5 ...`: the card shows the temperature, the description, the feels-like value and each of the listed fields with its unit.
- `AC-WEB-5 ...`: with `humidity` null and `observation_time` null the humidity reads "Not reported" and so does the observation line; with `precip` 0 the precipitation reads `0 mm`.
- `AC-WEB-5 ...`: with every weather field null nothing throws and the card shows "Not reported" for each.
- `AC-DETAIL-3 ...`: while the answer is held open (a promise, not a timer) the status "Loading property…" is shown.
- `AC-DETAIL-3 ...`: a network error and a GraphQL `INTERNAL_SERVER_ERROR` both show the alert "Could not load this property".
- `AC-WEB-7 ...`: "Try again" sends a second request and the property of the second answer appears.
- `AC-DETAIL-4 ...`: `property: null` shows the heading "Property not found" and a link "Back to all properties" to `/`.
- `AC-WEB-2 ...`: the document title is `<street> - CoverTree` once loaded and `Property not found - CoverTree` for a null answer.

Existing tests that open `/properties/<id>` (in `src/App.test.tsx` and in the create and refresh tests of `src/pages/NewPropertyPage.test.tsx`) now need a `Property` handler: add it there. In `src/App.test.tsx` the detail route's expectations change to what this round defines (while loading or once loaded, your choice, stated in the test name).

Save the failing output of the new file to `docs/agent/slices/web/04-red-output.txt` before implementing. Then implement, and save the full output of `npm run test --workspace=apps/web` to `docs/agent/slices/web/04-green-output.txt`. Run typecheck, eslint and prettier as the rules file says.

## Out of scope for this round

Delete and the dialog.

## Facts and fixes added by the conductor after round 3

1. The schema's `WeatherData` exposes 16 fields; the real Weatherstack `current` object has more (for example `air_quality` and `astro`), and those are not in the schema. Show the schema's fields only and do not edit the schema or the `Property` document beyond what it has. A field the answer lacks arrives as `null` and reads "Not reported".
2. Share the "All properties" back link (chevron plus text, now inline in `NewPropertyPage.tsx`) as one small component in `src/components/`, and move its CSS to where both pages get it.
3. `PropertyForm` focuses the first invalid field in an effect on `fieldErrors`. The state `<select>` is `disabled` while the mutation is `fetching`; if the effect runs before `fetching` turns false, focusing it does nothing. Add the test `AC-CREATE-13 state-only field error receives focus` to `NewPropertyPage.test.tsx` (a `BAD_USER_INPUT` answer with one field error for `state`; the state select has focus). If it is red, fix the cause (for example: let the effect depend on `fetching` too and focus only when it is false). If it is green at once, say so.
4. `apps/web/src/styles/base.css` now has both `.alert > svg` and `.alert__icon` with the same declarations; keep one and remove what nothing uses.
5. Test runs: as in rounds 2 and 3, run Vitest the way that works in your sandbox. If none works, say so and the conductor runs the tests.

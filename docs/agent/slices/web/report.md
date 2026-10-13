# Slice `web`: conductor report

The final message of the conductor of slice `web`, saved by the manager unedited after the merge into `main` as ea4b44c. It was read from the conductor's own transcript, because its task output file was empty. Branch head `0962888`, base `fca2bd7`, three review rounds, last verdict approve.

~~~text
# Report: slice `web`, wave 1

**Result:** built, verified, reviewed in three rounds, final verdict **approve**. Nothing blocks the merge. No browser run was done (the handoff forbids it in this slice).

## 1. Branch and last commit

- Branch `slice/web`, worktree `c:/tmp/covertree-web`, base `fca2bd7`.
- Last commit `0962888`. Working tree clean. Nothing pushed, merged or rebased.
- `git diff --name-only fca2bd7 HEAD` touches only `apps/web/index.html`, `apps/web/src/**`, `docs/agent/slices/web/**`, `docs/agent/reviews/web-grok.md`. No `package.json`, no lockfile, no `docs/SPEC.md`, no schema.
- Last `npm run codegen && npm run verify` (mine, on `7b83cec` content): exit 0; web 79/79, API 2/2, scripts 10/10, build ok.
- Author on all 8 commits: Marcin Sufa (GitHub no-reply), no trailer. No `--no-verify`.

## 2. What was built

- `/`: property table (7 columns, last one visually hidden "Actions"), count, filter form (city, state, zip), sort select, URL as source of truth, states loading / empty / nothing matches / load error with "Try again" / `BAD_USER_INPUT` field errors under the filter fields. Scrolls sideways below 820px, cards by CSS at 600px.
- `/properties/new`: form with native constraints, pending state, field errors with focus on the first invalid field, one alert for `LOCATION_NOT_FOUND`, `WEATHER_UNAVAILABLE` and anything else, navigation to the new property.
- `/properties/:id`: address card, "Weather at creation" card, states loading / error / not found, "Delete property".
- Delete: one native `<dialog>` (`showModal()`), used by the table rows and the detail page.
- Not-found route, layout with header links, document titles, tokens and base CSS, urql client factory, documents, error helpers, formatters, test helper with msw.

## 3. Commits

1. `6cd9dd0` feat(web): tokens, layout, client factory, documents, not-found route
2. `8a307b1` feat(web): property list with filters, sort and its states
3. `4851d5d` feat(web): new-property form with its error and pending states
4. `ba9147f` feat(web): property detail page with the weather card and its states
5. `10bb4db` feat(web): delete with the confirmation dialog on list and detail page
6. `97a1880` fix(web): address review round 1 findings
7. `7b83cec` fix(web): keep the create form working under Strict Mode
8. `0962888` docs(web): record review rounds 2 and 3

## 4. Red and green evidence (all in `docs/agent/slices/web/`)

| Round | Red | Green |
| --- | --- | --- |
| 1 | `01-red-output.txt` (8 failed) | `01-green-output.txt` (8) |
| 2 | `02-red-output.txt` (21 failed, 8 passed) | `02-green-output.txt` (30; one test added after red) |
| 3 | `03-red-output.txt` (17 failed, 23 passed) | `03-green-output.txt` (48) |
| 3, AC-LIST-5 proof | `03-red-additional-typenames.txt` (list stays "No properties yet" with `additionalTypenames` removed) | |
| 4 | `04-red-output.txt` (13 of 13 failed) | `04-green-output.txt` (62) |
| 5 | `05-red-output.txt` (12 failed, 61 passed) | `05-green-output.txt` (73) |
| 6, review 1 fixes | `07-red-output.txt` (4 failed, 66 passed) | `07-green-output.txt` (78) |
| 7, review 2 fixes | `09-red-output.txt` (13 failed, 66 passed, suite under Strict Mode) | `09-green-output.txt` (79) |
| 7, refutation proof | `09-red-additional-typenames.txt` (1 failed) | |

Tests green at once, no red of their own: `AC-FILTER-10 ...` (round 3), `AC-CREATE-13 state-only field error receives focus` (round 4), the null-icon assertion under `AC-WEB-5` and the list first-description assertion (round 6), `AC-LIST-5 a create that answers after the user left the form refreshes the list` (round 7; proven instead by removing `additionalTypenames`).

All worker test runs went through its sandbox wrapper (`npm run test` hits `spawn EPERM` there); I reran everything through `npm run verify` after rounds 2 to 7, exit 0 each time.

## 5. Review (Grok `grok-4.7`, `context=256k`, `reasoning_effort=high`, `fast=false`; record `docs/agent/reviews/web-grok.md`)

**Round 1**, whole slice, agent `bc-6fbff704-53a0-4d9b-9c3b-da1a0267de3f`, run `run-acc9fc3c-9e04-4e92-bea0-43d6e8205fde`: changes requested.

1. Major, dialog disables the focused button while deleting, focus leaves the modal, no status. Fixed in part: `aria-disabled`, ignored clicks, `role="status"` "Deleting…" (`AC-WEB-19`). Declined: Cancel and Escape during the request (a closed dialog with a delete in flight says nothing was deleted when it may be).
2. Major, form navigates after the user left. Fixed with an unmounted ref (`AC-WEB-20`).
3. Major, `WeatherCard` ignores `weather_icons`, first description only. Fixed: descriptions joined with ", ", first icon as decorative image. Declined: a "Not reported" row for a missing icon.
4. Minor, phone-width `thead` read twice. Fixed (`display: none`), no test possible in jsdom.
5. Minor, `transparent` as colour literal. Declined: the slice rule allows the keyword.
6. Minor, tests by text and `querySelector`. Fixed.
7. Minor, duplicated field-error wiring. Fixed (`components/FieldErrors.tsx`). Declined: `ErrorAlert` in the dialog (title plus body does not fit one sentence).
8. Minor, delete answer without data counts as success. Fixed (`AC-WEB-17`).

**Round 2**, fix alone, agent `bc-f07c37dc-1343-4398-ad90-7c43f9f488a7`, run `run-f2931186-3753-4e3a-adc0-108f1d52bc26`: changes requested.

1. Major, under React Strict Mode (used by `main.tsx`) the unmounted ref stayed `true`, so every create answer was dropped: property saved, no navigation, no message. Confirmed, a defect introduced by the round 1 fix, development mode only. Fixed: the effect setup resets the ref; the test helper now renders inside `<StrictMode>` like `main.tsx`, so the whole suite runs under it.
2. Major, a create answering after the user left leaves the list stale. Refuted by test, no code change (the mutation finishes in the client and the document cache refetches the tagged list).

**Round 3**, fix alone, agent `bc-adc39bc2-df4a-4d2d-90d6-fb1888509e20`, run `run-be11b7da-ad1b-477a-8b08-04620a52b654`: **approve, no findings.**

## 6. Deviations from the brief, with reasons

- Two extra tokens, `--color-dialog-backdrop` and `--shadow-dialog`: the dialog needs them and no literal may sit outside `tokens.css`.
- Document title set by an effect in `PageTitle`: jsdom ignores React 19 `<title>` hoisting, so it could not be tested otherwise.
- Temperature and description share one column "Weather at creation" (as on the board); the brief and AC-LIST-2 list them separately. Seven columns in total.
- The state select is `disabled` while saving (a select has no read-only state); its value is kept in React state.
- `BAD_USER_INPUT` without usable field errors falls back to the generic alert (form) or the load error (list).
- A network error counts as "anything else" on the form.
- Any delete error, including `PROPERTY_NOT_FOUND`, shows the same message.
- Cancel and Escape are blocked while a delete runs; the client has no timeout, so a hung request keeps the dialog open.
- `weather_icons`: the first icon is loaded as a remote image (after review), where round 4 had said not to load remote images. The page works without it.
- Fonts load from Google Fonts in `index.html`, with system fallback.
- msw option used is `onUnhandledFrame` (the 3.0.3 name).
- Orchestration done by me, no product or test code: commits, cleaning ANSI codes and BOM from evidence files, replacing long dashes in `07-worker-reply.md` and `10-review-3-reply.md` (reviewer and worker wrote them), writing prompts and the review record.

## 7. Departures from the boards, with reasons

- **Header and frame:** header min-height 68px and a page frame min-height (stable layout on short pages).
- **Form page h1** reads "Add property" where the skeleton said "New property" (matches the button and the header link).
- **Not-found route** uses the empty-state card: no board exists for it.
- **Phone breakpoint** at 600px. Mobile cards are CSS on the table: six cells stacked as labelled lines, the delete button in its own trailing row, `thead` hidden.
- **Detail grid:** 320px minimum capped with `min(320px, 100%)` so 390px does not overflow. The delete button stacks below the title on phones.
- **Detail states:** one h1 each. "Property not found" is the h1 where the board has an h3; loading and error use "Property details".
- **Weather card rows:** the board's eight plus wind direction (degrees) and weather code (every schema field shown).
- **Weather icon:** the saved icon as a decorative image instead of the board's sun; no icon when the answer has none.
- **No "Not reported" footnote** (the board's footnote is a note to the board's reader).
- **Observation line:** `observation_time` as received plus the creation date in UTC, en-US.
- **Dialog:** failure alert without the board's lead-in sentence; a status line "Deleting…" the board does not have.

## 8. Proposed criteria for `docs/SPEC.md` (area `AC-WEB-*`, all have tests under these ids)

1. An unknown path shows "Page not found" with a link to the list.
2. The document title names the page.
3. Header links; "Add property" is absent on the form page.
4. Count reads "N properties" or "1 property".
5. A missing weather value reads "Not reported".
6. Creation time is a `<time>` with the ISO value in `dateTime`.
7. "Try again" asks the network again.
8. The URL fills the filter form and the query variables.
9. Blank filter values are left out of URL and variables.
10. Clear removes the filters, keeps the sort, and empties typed values never applied.
11. List `BAD_USER_INPUT` field errors appear under their filter fields.
12. Filter fields are labelled and the zip filter has the 5-digit pattern.
13. Pending create: fields read-only, button "Saving…", status "Looking up the weather…".
14. Typed values stay after a failed create.
15. The detail page shows all address fields, coordinates and creation time.
16. The dialog names the street, focus is on "Cancel", Cancel and Escape close it with nothing deleted.
17. A failed delete (error or answer without data) keeps the dialog open with its message.
18. A confirmed delete from the list removes the row without reload.
19. During a delete focus stays in the dialog and a status reads "Deleting…".
20. Leaving the form while saving is not undone by the answer.

## 9. What the next wave must know

1. **Field error contract:** the web reads `extensions.fieldErrors` as `{ field, message }[]` with `field` equal to the input key (`street`, `city`, `state`, `zipCode`). The API slice must send exactly that, or errors fall back to the generic alert.
2. **Mutation answers must carry `Property`:** list refresh after create and delete depends on `__typename: 'Property'` in the mutation result plus `additionalTypenames: ['Property']`. Proven twice by removing the tag.
3. **Known open risk, accepted by the reviewer:** a list answer arriving after a later mutation result can put an older list back until the next request.
4. **Unproven without a browser:** native dialog modality, focus return to the opener, Escape, the phone layout, the remote weather icon. The test shim covers only the `open` attribute and the `close` event. A browser pass in the integration wave should cover these.
5. **Schema limit:** `WeatherData` exposes 16 fields, so `air_quality` and `astro` cannot be shown.
6. **Tests run under Strict Mode** now (`src/test/render-app.tsx`); new effects with cleanup flags must reset in setup.
7. Queries go out as GET (urql default); Yoga accepts them.

## 10. Housekeeping

- No server or browser was started; nothing listens on 4000 or 5173; no background process of mine is left.
- No key was read, printed or logged; no Weatherstack call; no new dependency.
- A session hook kept injecting "task brief lines" that belong to the `api` slice (AC-STORE-2, `docs/agent/slices/api/...`). They name no file of mine; I did not act on them.
~~~

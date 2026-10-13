# Round 2 of 5: the list page (table, states, filters, sort)

Read `docs/agent/slices/web/00-worker-rules.md` in full first, then `AGENTS.md`, `docs/plan.md` sections 5, 7 (List, Errors) and 10, `docs/design/README.md`, and the boards `docs/design/Main.dc.html`, `ListStates.dc.html`, `MobileList.dc.html`, `Tokens.dc.html`. Then read what round 1 left in `apps/web/src/**`: the tokens and base classes in `src/styles/`, the layout, the client factory, the documents in `src/graphql/`, the test helper in `src/test/` and `src/App.test.tsx`. Reuse them; do not write a second card, button, field, alert, skeleton or empty-state style.

This round builds `/`: `PropertyListPage` with the components `PropertyFilters` and `PropertyTable` in `apps/web/src/components/`. The delete button and its dialog come in round 5: leave the actions column out for now.

## Proposed criteria used in this round

- `AC-WEB-4`: Given the list has loaded, when the page renders, then a count next to the title reads "N properties", or "1 property" for one.
- `AC-WEB-5`: Given a weather value the service did not send, when the list or the detail page renders it, then it reads "Not reported".
- `AC-WEB-6`: Given a creation time, when a page renders it, then it is a `<time>` element whose `dateTime` is the ISO value.
- `AC-WEB-7`: Given a load error, when the user presses "Try again", then the query is sent to the network again.
- `AC-WEB-8`: Given a URL that carries filters or a sort, when the list page loads, then the form is filled in from it and the query carries the matching variables.
- `AC-WEB-9`: Given a filter value that is empty or blank, when the filters are applied, then its URL parameter and its query variable are left out.
- `AC-WEB-10`: Given applied filters and a sort, when the user presses "Clear", then the three filters leave the URL and the sort stays.
- `AC-WEB-11`: Given the server answers the list query with `BAD_USER_INPUT`, when the page renders, then each field error is shown under its filter field and tied to it.
- `AC-WEB-12`: Given the filter form, when it renders, then every control has a label and the zip code field carries the five-digit pattern.

## Behaviour

URL and variables:

- The URL is the only source of truth for the view. Parameters: `city`, `state`, `zip`, and `sort=oldest`. The default sort (newest first) has no parameter.
- Variables of the `Properties` query: `sort` is `CREATED_AT_DESC`, or `CREATED_AT_ASC` when the URL has `sort=oldest`; `filter` holds only the keys that are set (`city`, `state`, `zipCode`) and is left out entirely when none is set.
- Reading the URL: `city` and `zip` are trimmed; a blank value counts as absent; a `state` that is not one of `US_STATE_CODES` counts as absent (GraphQL would reject the whole query); any `sort` value other than `oldest` counts as the default. A `zip` that is not five digits is still sent: the server answers `BAD_USER_INPUT` and the page shows it (below).
- "Apply filters" (the form's submit) writes the three fields to the URL, trimmed, leaving blank ones out, keeping the sort. It pushes a history entry, so the back button returns to the previous view.
- The sort select applies on change, without a submit: it pushes a history entry with `sort=oldest` or without `sort`, keeping the filters that are in the URL.
- "Clear" removes `city`, `state` and `zip` from the URL and keeps `sort`.
- After any URL change, including back and forward, the form shows the values of the URL.
- The list query carries `additionalTypenames: ['Property']` in its urql context. Build that context object once (module constant or `useMemo`): a new object per render makes urql ask again in a loop.
- While the request for the current URL is pending, the page shows the loading state and not the rows of the previous view.

The form (`PropertyFilters`), per `Main.dc.html`:

- City: text input, label "City", placeholder "Any city", `maxlength` 100.
- State: select, label "State", first option "Any" with an empty value, then every state of `US_STATES` in the form `AZ Arizona` with the code as value.
- Zip code: text input, label "Zip code", placeholder "5 digits", `inputmode="numeric"`, `pattern="\d{5}"`, `maxlength` 5, mono font.
- Buttons "Apply filters" (secondary, submit) and "Clear" (quiet, `type="button"`).
- Sort: select, label "Sort by created", options "Newest first" and "Oldest first".
- No `required` anywhere: an empty form is a valid submit.

The table (`PropertyTable`), per `Main.dc.html`:

- Columns: Street, City, State, Zip code, Created, Weather at creation. Column headers are `<th scope="col">`.
- Street is a link to `/properties/<id>`. State is the two-letter code. Zip code in the mono font.
- Created is a `<time>` with `dateTime` set to the `createdAt` value as received and a local, readable text (`Intl.DateTimeFormat` with `dateStyle: 'medium'` and `timeStyle: 'short'`). One function formats it; round 4 reuses it.
- Weather at creation: the temperature as `24 °C` (the API stores metric values) and the first entry of `weather_descriptions`, joined as on the board (`24 °C · Sunny`). A null temperature, or a null or empty description list, reads "Not reported" in its place; when both are missing the cell reads "Not reported" once. One function formats a missing value; round 4 reuses it.
- The count next to the title: "4 properties", "1 property", "0 properties". It is shown once the list has loaded and counts the rows shown.

States, per `ListStates.dc.html`, wording taken from the board:

- Loading: a card with `aria-busy="true"`, a `role="status"` line "Loading properties…" and static skeleton bars.
- No properties at all (no filter in the URL, empty answer): heading "No properties yet", the sentence of the board, a primary link "Add property" to `/properties/new`.
- Nothing matches (at least one filter in the URL, empty answer): heading "No properties match these filters", a muted line that names the active filters in the form of the board (`City “Austin”, state WA, zip code 85268`, only the parts that are set), a secondary button "Clear filters" that does what "Clear" does.
- Load error (network failure, or any GraphQL error other than `BAD_USER_INPUT`): an alert (`role="alert"`) with the title "Could not load properties" and the body "The server did not answer. Nothing was changed.", and a secondary button "Try again" that sends the query to the network again (`requestPolicy: 'network-only'`).
- `BAD_USER_INPUT`: read `extensions.fieldErrors`, an array of `{ field, message }` where `field` is a key of `PropertyFilter` (`city`, `state`, `zipCode`). Show each message under its filter field, in the error style of the boards (icon plus text, danger colour), tie it to the control with `aria-describedby`, set `aria-invalid="true"`, and announce it (`aria-live="polite"` on the form or `role="alert"` on the message). The results area shows no table and no load error in that case. The extensions come from the network: narrow them with type guards in one module, `apps/web/src/graphql/errors.ts`, that exports what round 3 also needs: a function that returns the `extensions.code` of the first GraphQL error of a urql `CombinedError` (or `undefined`), and a function that returns its field errors as a typed array (empty when absent or malformed).

Headings: the page keeps its single `<h1>` "Properties"; state titles are `<h2>`.

Layout and responsive behaviour, CSS only:

- `main` at most 1120px wide, padding and gaps per `Main.dc.html`; the filter form is a card with the flex layout of the board (the sort control pushed to the right with a 220px cap).
- The table sits in a card. Below 820px the table keeps a minimum width of 820px and scrolls sideways inside its card. The scrolling container is reachable by keyboard: `role="region"`, an accessible name, `tabindex="0"`.
- At phone width (a media query at 600px) the rows become cards as in `MobileList.dc.html`: the table head is visually hidden, each row is a card, the cells stack; the filter form stacks as on that board (city, then state and zip side by side, then sort, then the buttons); page padding 24px 16px 32px and the title at 24px. Because `display` changes on table elements drop their semantics in some browsers, set the ARIA roles explicitly on the table, its row groups, rows, column headers and cells. Get as close to the board's card as CSS on a table allows and name what differs in your reply.

## Tests first

`apps/web/src/pages/PropertyListPage.test.tsx`, rendered through the round 1 helper at a URL, with `msw` handlers for the `Properties` query that record the variables of every request. Fixtures: at least three properties with different cities and states, one of them with a null temperature and one with a null `weather_descriptions`. Update `src/App.test.tsx` only as far as the list page now needs a handler there.

- `AC-LIST-2 ...`: every row shows street, city, state, zip code, creation time, temperature and description; the street is a link to `/properties/<id>`; the six column headers exist.
- `AC-WEB-6 ...`: the creation time is a `<time>` whose `dateTime` equals the `createdAt` sent.
- `AC-WEB-5 ...`: a null temperature and a null description read "Not reported".
- `AC-WEB-4 ...`: "3 properties" for three rows and "1 property" for one.
- `AC-LIST-4 ...`: while the answer is pending the status "Loading properties…" is shown (hold the handler open with a promise the test resolves, not with a timer).
- `AC-LIST-4 ...`: a network error and a GraphQL `INTERNAL_SERVER_ERROR` both show the alert "Could not load properties" and the button "Try again".
- `AC-WEB-7 ...`: "Try again" sends a second request and the rows of the second answer appear.
- `AC-LIST-3 ...`: an empty answer with no filter shows "No properties yet" and a link "Add property" to `/properties/new` in the main area.
- `AC-FILTER-8 ...`: an empty answer with a filter in the URL shows "No properties match these filters" and not "No properties yet"; "Clear filters" empties the URL of filters and the next request has no filter.
- `AC-FILTER-7 ...`: typing a city, choosing a state, typing a zip code and pressing "Apply filters" puts `city`, `state`, `zip` in `router.state.location.search` and sends `filter: { city, state, zipCode }`.
- `AC-FILTER-7 ...`: after applying a filter, `router.navigate(-1)` restores the previous URL, the previous rows and the previous form values.
- `AC-WEB-8 ...`: rendering at `/?city=Austin&state=TX&zip=78701&sort=oldest` fills the four controls and sends those variables with `sort: 'CREATED_AT_ASC'`.
- `AC-WEB-8 ...`: an unknown `state` in the URL is not sent and the select shows "Any".
- `AC-WEB-9 ...`: a city of spaces only and an empty zip code leave `city` and `zip` out of the URL and `filter` out of the variables.
- `AC-WEB-10 ...`: at `/?city=Austin&sort=oldest`, "Clear" leaves `?sort=oldest` and sends no filter with `CREATED_AT_ASC`.
- `AC-SORT-4 ...`: choosing "Oldest first" adds `sort=oldest`, keeps the filters of the URL and sends `CREATED_AT_ASC`; choosing "Newest first" removes the parameter; `router.navigate(-1)` restores the previous sort in the URL and in the select.
- `AC-WEB-11 ...`: at `/?zip=12` with a `BAD_USER_INPUT` answer carrying `fieldErrors: [{ field: 'zipCode', message: 'Zip code must be exactly 5 digits.' }]`, the message is the accessible description of the zip code field, the field is invalid, and neither a table nor the load-error alert is shown.
- `AC-WEB-12 ...`: the four controls are found by their labels; the zip code field has `pattern` `\d{5}` and `inputmode` `numeric`; the state select offers "Any" plus 51 options.
- `AC-LIST-4 ...` (pending after a change): with rows shown, applying a filter whose answer is held open shows "Loading properties…" and none of the earlier rows.

Run the tests and save the failing output to `docs/agent/slices/web/02-red-output.txt`. Then implement, run green and save the full output of `npm run test --workspace=apps/web` to `docs/agent/slices/web/02-green-output.txt`. Run typecheck, eslint and prettier as the rules file says.

## Out of scope for this round

Delete and the dialog, the form page, the detail page.

## One fix from the conductor's reading of round 1

`apps/web/src/App.tsx` now calls `createBrowserRouter(routes)` inside the `App` component body, so every render of `App` (twice under `StrictMode`) builds a new router with its own history listeners. Build the browser router exactly once: a module-level constant in `apps/web/src/main.tsx`, which already is the one place that builds the browser client, rendered there with `RouterProvider`. `App.tsx` then only exports `routes`; remove the `App` component if nothing uses it. Tests keep building memory routers from `routes`.

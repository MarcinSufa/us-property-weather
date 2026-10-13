# Brief: slice `web`, the three pages

Wave 1. Conductor rules: `docs/agent/handoffs/wave-1.md`. Binding design: `docs/plan.md` sections 5, 10 and 11 for what the screens do, `docs/design/README.md` and the boards next to it for how they look. Where the two disagree about behaviour, section 10 wins and the disagreement goes into the report. This brief adds only what they leave open.

The boards are markup with inline styles and literal values. They do not render from disk; read them as source. The worker takes sizes, colours and wording from them and does not copy their markup structure.

## Owns

`apps/web/**` except `apps/web/package.json`. The schema is read from `apps/api/schema.graphql` and never edited. This slice never runs or imports the API: tests answer GraphQL with `msw`.

## What to build

1. Styling: plain CSS. The tokens of `docs/design/README.md` as custom properties in one file; components use the properties, never a literal colour. IBM Plex Sans and IBM Plex Mono through one Google Fonts `<link>` in `index.html` with `display=swap` and the fallbacks the design names, so the app works without the network.
2. Documents in `apps/web/src/graphql/`, in the form the codegen config of wave 0 expects: the list query with `filter` and `sort`, the detail query, the create mutation, the delete mutation. The list asks only for what the table shows.
3. `/`, `PropertyListPage` with `PropertyFilters` and `PropertyTable`:
   - Filters (city, state select with "Any", zip code) are applied on submit and live in the URL as `city`, `state`, `zip`; sort lives in the URL as `sort=oldest` and is absent for the default. A blank value leaves its parameter out. "Clear" removes all three filters and keeps the sort. Loading the URL of a filtered view shows that view with the form filled in.
   - The zip filter carries the same native pattern as the form. A `BAD_USER_INPUT` answer for the filter is shown under the field.
   - Table: street (a link to the detail page), city, state, zip code, creation time in a `<time>` element with the ISO value in `dateTime` and a local, readable text, temperature in Celsius (the adapter sends no `units` parameter, so Weatherstack answers in metric), and the first entry of `weather_descriptions`. A missing weather value reads "Not reported".
   - A count next to the title ("4 properties", "1 property").
   - States per `ListStates.dc.html`: loading, "No properties yet" with a link to the form, "No properties match these filters" with a clear button, a load error with "Try again" that asks the network again.
   - The list query carries `additionalTypenames: ['Property']`.
4. Delete, `ConfirmDialog`: a native `<dialog>` opened with `showModal()`, naming the street, focus on Cancel when it opens, Escape and Cancel close it. A failed delete shows its message inside the dialog and keeps it open. Used from the table rows and from the detail page; from the detail page a successful delete returns to the list.
5. `/properties/new`, `NewPropertyPage` with `PropertyForm`:
   - Native constraints mirror the server rules: `required`, `maxlength` 200 and 100, `pattern` `\d{5}` with `inputmode="numeric"`, the state as a `<select>` from `us-states.ts` with an empty first option.
   - While the request runs: fields read-only, the button disabled and reading "Saving…", a status line "Looking up the weather…".
   - `BAD_USER_INPUT`: each entry of `extensions.fieldErrors` under its field, tied to the input with `aria-describedby`, focus on the first invalid field.
   - `LOCATION_NOT_FOUND`, `WEATHER_UNAVAILABLE` and anything else: one alert above the form with the sentence `docs/design/README.md` gives for the code. What was typed stays in the fields.
   - Success opens `/properties/:id` of the new property.
6. `/properties/:id`, `PropertyDetailPage` with `WeatherCard`: all address fields, the coordinates, the creation time, and the card titled "Weather at creation" with its observation time and the weather fields the schema exposes; a null field reads "Not reported". States per `DetailStates.dc.html`: loading, load error with "Try again", and not found when `property` is null.
7. Any other path: a short "Page not found" with a link to the list.
8. Layout per the boards: content 1120px wide at most, the form 640px; below 820px the table scrolls sideways inside its card; at phone width rows are cards (`MobileList.dc.html`). CSS only, no JavaScript media logic.
9. Accessibility: every input has a label, errors and status lines are announced through `aria-live`, the focus ring of the design on every interactive element, the page title in an `<h1>`, the document title changes per route.

## Tests (first)

Vitest, Testing Library, `msw` (node) answering the GraphQL operations by name. Queries by role and label, not by class or test id. Each test name starts with its criterion id from `docs/SPEC.md`.

- List: the rows; each of the four states; "Try again" sends the query again.
- Filters and sort: submit writes the URL and sends the variables; a URL with filters fills the form and sends the variables; clear; blank values are left out; the back button restores the previous view.
- Create: native constraints present; field errors under their fields with focus on the first; one alert per weather code with what was typed kept; the button disabled while the request runs; success opens the detail route.
- The empty-list refresh: start on an empty list, create a property, return to the list, and the new row is there without a reload. Seen red first with `additionalTypenames` removed.
- Detail: the fields and the card; a null weather field; not found; load error.
- Delete: the dialog names the street; cancel changes nothing; confirm removes the row; a failed delete keeps the dialog open with its message; delete from the detail page returns to the list.

## Gotchas

- The test DOM may not implement `showModal()`. A shim in the test setup file is allowed; a dependency for it is not.
- Do not assert on formatted local time: assert on the `dateTime` attribute.
- urql's document cache serves a repeated query from memory: each test builds its own client. The skeleton exports one module-level client fixed at `/graphql` and its route test renders without a urql `Provider` (finding 6 of the wave 0 review, deferred to this slice): export a client factory, keep one place that builds the client for the browser, and wrap every test render in a `Provider`.

## Done when

- `npm run verify` green in the worktree, including the web build; red and green output in `docs/agent/slices/web/`.
- The diff touches only `apps/web/**` and the slice record.
- The report lists every place where the build departs from a board and why. No browser run happens in this slice: the manager looks at the pages against the boards after `api` and `web` are both merged.

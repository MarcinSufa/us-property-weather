# Review of slice `web`, round 1

You review a patch for the CoverTree take-home project: a React 19 single-page app (Vite, React Router, urql 5 with its default document cache, plain CSS with design tokens) over a GraphQL API that stores properties with the weather at creation time. The patch is the whole web slice against its base: `git diff fca2bd7 HEAD` without the lockfile and the slice record. You cannot run code; review by reading.

Review only. Do not rewrite the code. Report findings.

## What the slice had to build

- `/`: the property list as a table (street as link to the detail page, city, state, zip code, creation time as `<time>`, weather as temperature and description, a delete button per row), with a count, a filter form (city, state select, zip code) and a sort select. The URL is the source of truth (`city`, `state`, `zip`, `sort=oldest`); apply, sort change and clear push history entries; blank filters are left out of URL and variables; an unknown state is ignored. States: loading, no properties yet, nothing matches the filters, load error with "Try again", `BAD_USER_INPUT` field errors under the filter fields. Below 820px the table scrolls sideways in a keyboard-reachable region; at 600px rows become cards through CSS.
- `/properties/new`: the form with native constraints (`required`, `maxlength` 200 and 100, `pattern="\d{5}"`, `inputmode="numeric"`, state select with an empty first option). While the request runs: inputs read-only, button disabled reading "Saving…", status "Looking up the weather…". `BAD_USER_INPUT` field errors (`extensions.fieldErrors`, an array of `{ field, message }`) under their fields with `aria-describedby`, focus on the first invalid field. `LOCATION_NOT_FOUND`, `WEATHER_UNAVAILABLE` and anything else: one alert above the form; typed values stay. Success opens `/properties/:id`.
- `/properties/:id`: all address fields, coordinates, creation time, a card "Weather at creation" with the weather fields the schema exposes (a null reads "Not reported"), states loading, load error with "Try again", not found when `property` is null, and "Delete property".
- Delete: a native `<dialog>` opened with `showModal()`, naming the street, focus on "Cancel"; Escape and "Cancel" close; a failed delete shows a message inside and the dialog stays open; from the detail page a successful delete returns to the list.
- The list query carries `additionalTypenames: ['Property']` so that a create from an empty list refreshes the list.
- Rules: TypeScript strict with `noUncheckedIndexedAccess`; no `any`; no colour literal outside `apps/web/src/styles/tokens.css`; no inline styles; responsive behaviour in CSS only; every input labelled; errors and status announced; one `<h1>` per page; tests query by role and label, each test name starts with a criterion id, `msw` answers GraphQL, no real network; no new dependency; no long dashes in any file.

## What to look for, in this order

1. Correctness bugs: wrong behaviour a user or the API would hit (state that goes stale, races between the URL, the form and the query, urql document-cache behaviour after mutations, the dialog's open and close life cycle, focus handling, history handling, error paths that show nothing or the wrong thing).
2. Accessibility defects with a concrete consequence for keyboard or screen-reader users.
3. Tests that do not test what their name claims, or behaviour above with no test.
4. Violations of the rules above.
5. Duplication or needless code worth removing.

Do not report style preferences, and do not report the absence of things the list above does not ask for.

## Form of the answer

A numbered list of findings, most severe first. For each: severity (`blocker`, `major`, `minor`), file and line or symbol, what is wrong, why it matters (the concrete failure), and the smallest fix. If you are unsure whether something is a defect, say so and say what would settle it. End with one line: `VERDICT: approve` or `VERDICT: changes requested`.

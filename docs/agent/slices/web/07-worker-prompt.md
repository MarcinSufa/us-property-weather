# Round 6: fixes after review round 1

Read `docs/agent/slices/web/00-worker-rules.md` in full first, then `AGENTS.md`. Then read `apps/web/src/**` as it is. A reviewer from another vendor read the whole slice; the conductor decided which findings are fixed. Fix exactly these, each test first: write or change the test, see it red, then fix. Save the red output of all new and changed tests to `docs/agent/slices/web/07-red-output.txt` before fixing, and the full green output of the web suite to `docs/agent/slices/web/07-green-output.txt` after.

## Proposed criteria used in this round

- `AC-WEB-19`: Given a delete is running, when the dialog is displayed, then keyboard focus stays inside the dialog and a status line reads "Deleting…".
- `AC-WEB-20`: Given the user leaves the form page while the create request runs, when the answer arrives, then the app stays on the page the user went to.

## Fixes

1. `ConfirmDialog`: while the delete runs both buttons get the native `disabled` attribute. The button that had focus is then disabled, the browser drops focus to the body, and nothing in the modal can take focus. Fix: do not use `disabled` while pending. Mark both buttons `aria-disabled="true"`, ignore their clicks while pending (and keep ignoring Escape as now), keep the disabled look through CSS for `[aria-disabled='true']` in the shared button styles, and add a `role="status"` line in the dialog that reads "Deleting…" while pending (the danger button keeps reading "Deleting…" too). Tests, named `AC-WEB-19 ...`, with the delete answer held open by a promise: the "Deleting…" button still has focus, it is not `disabled`, it has `aria-disabled="true"`, a status "Deleting…" is shown, a second click sends no second request, and "Cancel" does not close the dialog; after a failed answer the alert is shown and the danger button is usable again.
2. `ConfirmDialog.confirmDelete` treats every answer without `error` as success. Require `result.data?.deleteProperty`; anything else is the failure path. Test `AC-WEB-17 an answer without data keeps the dialog open with the failure message` (answer `{ data: null }` or an empty object).
3. `PropertyForm.submit` navigates to the new property even when the user left the form page while the request ran (the "Cancel" link, the back link and the header links work during "Saving…"). Fix in the smallest way: the form remembers that it unmounted (a ref set in an effect cleanup) and then neither navigates nor sets state. Test `AC-WEB-20 leaving the form while saving is not undone by the answer`: hold the create answer open, press the "Cancel" link, resolve the answer, and the router is still at `/` (wait for the list to settle, then assert).
4. `WeatherCard`:
   - Only the first entry of `weather_descriptions` is shown. Show every entry, joined with ", ". The list page keeps showing the first one (a table cell). Test under `AC-DETAIL-5`.
   - The highlighted block always draws a sun, also for rain. Replace the hard-coded sun: when `weather_icons` has a first entry, render it as a decorative image (`<img alt="" width="44" height="44" loading="lazy" referrerPolicy="no-referrer">`; the description next to it is the text alternative); when it is null or empty, render no icon. Remove the sun SVG. Tests under `AC-DETAIL-5` and `AC-WEB-5`: with an icon URL the card holds an image with that `src` (query it with `getByRole('presentation')` or `getByRole('img', { hidden: true })`, whichever the test DOM maps an empty `alt` to; no class or tag selector); with `weather_icons` null there is none.
5. `PropertyListPage.css`, phone breakpoint: the table head is hidden visually but stays in the accessibility tree while every cell also carries its label through `td::before { content: attr(data-label) }`, so a screen reader hears each column name twice. Use `display: none` on the `thead` at that breakpoint. Jsdom does not apply media queries: no test, say so in the reply.
6. Tests:
   - `AC-WEB-6` in `PropertyListPage.test.tsx` reads `document.querySelector('time')` and checks one row. Assert the `dateTime` of every row's `<time>`, found without `document.querySelector` (for example `within(row).getByRole('time')` if the test DOM knows that role, otherwise `within(row).getByText(...)` is not possible for formatted local time, so then keep a tag query scoped to the row and say so).
   - Where a role exists, use it instead of text: `getByRole('status')` for the loading and pending lines, and so on. Do not rewrite assertions that have no role alternative.
   - Add `AC-CREATE-13 with errors for street and zip code the street field has focus` (two field errors in one answer, zip code listed first in `fieldErrors`, the street field has focus).
7. Duplication: `PropertyFilters` and `PropertyForm` each build field-error ids, `aria-invalid`, `aria-describedby` and the error markup. Extract that once (a small module in `src/components/`: a function that returns the ARIA props for a control from its id, its errors and an optional hint id, and a component that renders the messages with matching ids) and use it in both forms. Keep the markup and classes of the form page; remove the classes that become unused.

## Not to change

- `transparent` in `base.css` stays (the rules file allows that keyword).
- The dialog's alert keeps its own short markup (it has no title; `ErrorAlert` is title plus body).
- No other behaviour changes. No new dependency.

Run typecheck, eslint and prettier as the rules file says. In your reply, list per fix: the test, red seen or not, and what changed.

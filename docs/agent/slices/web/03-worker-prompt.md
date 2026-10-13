# Round 3 of 5: the new-property form

Read `docs/agent/slices/web/00-worker-rules.md` in full first, then `AGENTS.md`, `docs/plan.md` sections 5, 7 (Create, Errors) and 10, `docs/design/README.md`, and the boards `docs/design/NewProperty.dc.html`, `NewPropertyErrors.dc.html`, `Tokens.dc.html`. Then read what rounds 1 and 2 left in `apps/web/src/**`: the styles, the layout, `PageTitle`, the documents in `src/graphql/operations.ts`, the error helpers in `src/graphql/errors.ts`, the list page and its components, the test helper and the existing tests. Reuse them; do not write a second field, button, alert or error-parsing helper.

This round builds `/properties/new`: `NewPropertyPage` with the component `PropertyForm` in `apps/web/src/components/`.

## Proposed criteria used in this round

- `AC-WEB-13`: Given the create request is running, when the form is displayed, then its fields are read-only, the button reads "Saving…" and a status line reads "Looking up the weather…".
- `AC-WEB-14`: Given a create request failed, when the form displays the error, then what was typed is still in the fields.

## Behaviour

The page, per `NewProperty.dc.html`: `main` 640px wide at most; a link "All properties" to `/` with the chevron icon; the `<h1>` "Add property"; the muted sentence of the board; the form in a card.

The form:

- Street: label "Street", `required`, `maxlength` 200, `autocomplete="address-line1"`, the placeholder of the board.
- City: label "City", `required`, `maxlength` 100, `autocomplete="address-level2"`, the placeholder of the board.
- State: label "State", a `<select>` with `required`, `autocomplete="address-level1"`, a first option "Select a state" with an empty value, then every state of `US_STATES` as `AZ Arizona` with the code as value. If round 2 wrote the state options for the filter, share that code instead of writing it twice.
- Zip code: label "Zip code", `required`, `inputmode="numeric"`, `pattern="\d{5}"`, `maxlength` 5, `autocomplete="postal-code"`, the placeholder and the hint of the board ("5 digits. The weather lookup uses it."), the hint tied with `aria-describedby`, mono font.
- A primary submit button "Add property" and a link "Cancel" to `/`.
- The native constraints stop an invalid submit before any request; do not add `noValidate` and do not re-implement them in JavaScript.

Submitting:

- Sends the `CreateProperty` mutation with `input: { street, city, state, zipCode }` as typed (the server trims).
- While the request runs: the text inputs are `readOnly`, the select is `disabled` (a select has no read-only state; its value is kept in React state), the button is `disabled` and reads "Saving…", a `role="status"` line next to it reads "Looking up the weather…", the form has `aria-busy="true"`. A second submit while the first runs sends nothing.
- A new submit clears the errors of the previous one.
- Success: navigate to `/properties/<id>` of the new property.

Errors, using the helpers of `src/graphql/errors.ts`:

- `BAD_USER_INPUT` with field errors: each `{ field, message }` (the fields are the keys of `CreatePropertyInput`: `street`, `city`, `state`, `zipCode`) is shown under its field in the error style of `NewPropertyErrors.dc.html` (icon plus text, danger colour), tied to the control with `aria-describedby` (the zip code keeps its hint in the same attribute), with `aria-invalid="true"` and the 2px danger border. The messages are announced: `aria-live="polite"` on the form, as on the board. Focus moves to the first invalid field in form order (street, city, state, zip code).
- `LOCATION_NOT_FOUND`: one alert (`role="alert"`) above the form, title "The weather service does not know this location", body "Check the zip code and try again. Nothing was saved."
- `WEATHER_UNAVAILABLE`: title "The weather service is not answering", body "Nothing was saved. Try again in a moment."
- Anything else (another code, a network failure, `BAD_USER_INPUT` without usable field errors): title "Something went wrong", body "Nothing was saved."
- One place maps a code to its title and body.
- In every error case what was typed stays in the fields and the form is usable again.

## Tests first

`apps/web/src/pages/NewPropertyPage.test.tsx`, rendered through the test helper at `/properties/new`, with `msw` handlers for `CreateProperty` that record the variables. The detail page is still a placeholder in this round and makes no request.

- `AC-CREATE-11 ...`: the four controls are found by their labels.
- `AC-CREATE-8 ...`: street is required with `maxlength` 200; city is required with `maxlength` 100; state is required with an empty first option and 51 states; zip code is required with `pattern` `\d{5}`, `maxlength` 5 and `inputmode` `numeric`.
- `AC-CREATE-8 ...`: pressing "Add property" on the empty form sends no request (the handler records nothing) and the route does not change.
- `AC-CREATE-10 ...`: a valid form sends the four values as `input` and the router ends at `/properties/<id of the answer>`.
- `AC-CREATE-14 ...`: while the answer is held open (a promise the test resolves, not a timer), the button is disabled.
- `AC-WEB-13 ...`: in that same pending state the button reads "Saving…", the status "Looking up the weather…" is shown, and street, city and zip code are read-only.
- `AC-CREATE-9 ...`: a `BAD_USER_INPUT` answer with field errors for `street` and `zipCode` shows each message as the accessible description of its field, and both fields are invalid.
- `AC-CREATE-12 ...`: the field errors are inside an `aria-live` region.
- `AC-CREATE-13 ...`: after that answer the street field has focus; with an error for `zipCode` only, the zip code field has focus.
- `AC-CREATE-15 ...` (one test per code, `test.each`): `LOCATION_NOT_FOUND`, `WEATHER_UNAVAILABLE`, `INTERNAL_SERVER_ERROR` and a network error each show exactly one alert with the title and the body given above.
- `AC-WEB-14 ...`: after a `WEATHER_UNAVAILABLE` answer and after a `BAD_USER_INPUT` answer the four controls still hold what was typed, and the button is enabled and reads "Add property" again.
- `AC-LIST-5 ...` (the empty-list refresh, through the whole app): start at `/` with a `Properties` handler that answers an empty list until the `CreateProperty` handler has run and the new property after that; see "No properties yet"; follow "Add property"; fill the form and submit; arrive at `/properties/<id>`; follow the header link "Properties"; the new street is in the list. No reload, no new client.

Save the failing output of the whole file to `docs/agent/slices/web/03-red-output.txt` before implementing.

After the implementation is green, prove that `AC-LIST-5` tests what it claims: remove `additionalTypenames` from the list query's context, run that one test, see it fail because the list still says "No properties yet", save that output to `docs/agent/slices/web/03-red-additional-typenames.txt`, then restore the line and run everything again. If the test stays green without `additionalTypenames`, the test is wrong: fix the test, do not skip the proof, and say what was wrong.

Then save the full output of `npm run test --workspace=apps/web` to `docs/agent/slices/web/03-green-output.txt` and run typecheck, eslint and prettier as the rules file says.

## Out of scope for this round

The detail page, delete and the dialog, changes to the list beyond a shared helper.

## Fixes from the conductor's reading of round 2 (do these in this round, test first where a test is named)

1. `Clear` does not empty fields that were typed but never applied: when the URL has no filter, `setSearchParams` leaves the URL as it was, `values` keeps its identity and the effect in `PropertyFilters` does not run. Add the test `AC-WEB-10 Clear empties typed values that were never applied` to `PropertyListPage.test.tsx` (type a city, press "Clear", the city field is empty and the URL has no `city`), see it red, then fix it in the smallest way (the form resets its own state when "Clear" is pressed). Check whether the `urlKey` prop still has a reason to exist; remove it if not.
2. A `BAD_USER_INPUT` answer to the list query without any usable field error now shows nothing at all in the results area. It must show the load error ("Could not load properties" with "Try again"). Add the test `AC-LIST-4 BAD_USER_INPUT without field errors shows the load error`, red first.
3. New criterion in `docs/SPEC.md` on another branch, `AC-FILTER-10`: "Given the client wants properties in any state, when the client calls `properties`, then it omits the `state` filter." Add a test named `AC-FILTER-10 ...`: at `/?city=Austin&state=TX`, choosing "Any" and applying sends `filter: { city: 'Austin' }` with no `state` key at all (assert with `not.toHaveProperty('state')`, an empty string would be rejected by GraphQL) and the URL has no `state`. It should pass against the round 2 code; say so in your reply if it does.
4. `src/graphql/errors.ts` types field errors by the keys of `PropertyFilter` only. The form needs `street`, `city`, `state`, `zipCode`. Make the helper serve both callers without duplication (for example: it returns `{ field: string; message: string }[]` and each caller picks the fields it knows).
5. The error icon SVG is written twice (list page alert and filter errors) and this round needs it twice more. Extract it once (a small component in `src/components/`), and extract the alert block (icon, title, body) as one component if the form's alert and the list's alert share their markup. Field errors in the filter form carry `role="alert"` while the form also has `aria-live="polite"`: that announces twice. Keep one mechanism, the same in both forms (`aria-live="polite"` on the form, no role on the message).
6. In `PropertyListPage.tsx` the filtered empty state puts its `<h2>` outside the card and the unfiltered one inside. Check both against `docs/design/ListStates.dc.html` and make them follow the board; say what you changed.

## Sandbox note

In round 2 `npm run test --workspace=apps/web` could not start in your sandbox (`spawn EPERM`) and you ran Vitest another way. Do the same. If no way works, do not guess: write the tests and the code, run typecheck, eslint and prettier, say in your reply that the test runs are missing, and the conductor runs them and hands failures back.

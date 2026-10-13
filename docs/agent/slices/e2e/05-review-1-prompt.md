# Review of slice `e2e`, round 1

You review a patch for the CoverTree take-home project: a GraphQL API (Node 24 running TypeScript directly, graphql-yoga, `node:sqlite`) that stores US properties with a weather snapshot taken from Weatherstack once, at creation, and a React 19 single-page app (Vite dev server on port 5173 with `strictPort`, proxying `/graphql` to port 4000). The patch is the whole end-to-end slice against its base: `git diff 814e452 HEAD` without the lockfile and the slice record. It adds a Playwright suite, a local Weatherstack stub, the type check of the `e2e` workspace and a GitHub Actions workflow. You cannot run code; review by reading.

Review only. Do not rewrite the code. Report findings.

## Facts about the code the patch drives (not in the patch)

- The API is started as `node src/main.ts` from `apps/api`. It reads `WEATHERSTACK_API_KEY` (required), `WEATHERSTACK_BASE_URL`, `WEATHER_TIMEOUT_MS` (default 5000), `PORT`, `DATABASE_PATH`, `LOG_LEVEL` from the environment, opens the SQLite file, listens with `server.listen(port)` and closes on `SIGINT` and `SIGTERM`. It has no health route; `GET /graphql?query={__typename}` answers 200.
- The weather adapter calls `GET <base>/current?access_key=<key>&query=<zipCode>`: only the zip code identifies the location. Code 615 in the body (the real service sends it with HTTP 400) becomes the GraphQL error `LOCATION_NOT_FOUND`. Validation of the input runs before the weather lookup; a street of spaces is rejected with `BAD_USER_INPUT` and `extensions.fieldErrors: [{ field: 'street', message: 'Street must be between 1 and 200 characters.' }]`.
- Only `PropertyService.create` may call the weather provider. The list, the filters, the sort, the detail query and the delete must make no weather request.
- The fixtures `apps/api/src/weather/fixtures/current-85268.json` (success: 19 °C, "Patchy rain nearby", lat "33.609", lon "-111.724") and `current-unknown.json` (code 615) are recorded answers of the real service with the key removed.
- The web app: `/` lists properties in a table inside a region named "Property list" (street as a link to `/properties/:id`, city, state, zip code, created, weather as "19 °C · Patchy rain nearby", a button "Delete <street>" per row), a count line ("3 properties"), a filter form (textbox "City", combobox "State", textbox "Zip code", button "Apply filters") and a select "Sort by created"; the URL carries `city`, `state`, `zip` and `sort=oldest`. `/properties/new` is the form (Street, City, State, Zip code, button "Add property"); server field errors are linked to their input with `aria-invalid` and `aria-describedby`, focus moves to the first invalid field; other errors show one alert above the form and the typed values stay. `/properties/:id` shows the address, the coordinates and a region "Weather at creation"; an unknown id shows the heading "Property not found". Delete opens a native `<dialog>` with `showModal()`, titled "Delete <street>?", focus on "Cancel", buttons "Cancel" and "Delete property".
- The page asks Google Fonts for fonts and the weather provider's image host for the icon; both are out of scope and the suite aborts every request to a host other than `localhost` and `127.0.0.1`.
- The root ESLint config lints every `.ts` file with typed rules; the root Vitest config includes only `scripts/**/*.test.mjs`; `.gitignore` ignores `test-results/` and `playwright-report/`.

## What the slice had to build

1. `e2e/weatherstack-stub.ts`: `node:http`, no dependency. `GET /current` answers from the recorded fixtures, read from the API's fixture folder and never copied: the unknown-location zip code (`00000`) gets the unknown fixture with HTTP 400, every other query the success fixture with HTTP 200. It counts the `/current` requests it served and returns the count on `GET /__calls`.
2. `e2e/playwright.config.ts`: Chromium only, one worker, tests in order. Three servers through `webServer`, each with `reuseExistingServer: false`: the stub on its own port; the API as `node src/main.ts` from `apps/api` with its whole configuration in `env` (`WEATHERSTACK_BASE_URL` at the stub, `WEATHERSTACK_API_KEY` the placeholder literal `e2e-stub-key`, `DATABASE_PATH` a file in a fresh directory under the system temporary folder, `PORT=4000`, `LOG_LEVEL` silent or warn), never `--env-file`, never needing `.env`; the web dev server on 5173. The temporary database directory is removed when the run ends. Known constraints: Playwright loads the config in the runner and in each worker process; on Windows it force-kills the servers, and `globalTeardown` runs before the servers stop, while SQLite still holds the file.
3. `e2e/stories.spec.ts`, each test name starting with a criterion id of the project's spec: create (detail page with weather card, stub count 0 to 1); create with an unknown location (alert, typed values stay, the list does not contain the address); create with input the browser lets through and the server rejects (field error under its field); list rows; filter by city in another letter case, by state, by zip code, with the filter in the URL and the same view after a reload; sort newest first by default, oldest first when chosen; detail reached from the list row; delete (confirm in the dialog, the row is gone, its detail URL shows not found), with these browser facts asserted inside the delete story: the dialog is modal, focus is on "Cancel", Escape closes it with nothing deleted, focus returns to the button that opened it; and the weather proof: after all of that the stub count equals the number of creates that reached the weather lookup and nothing more. Locators by role and label. No fixed sleeps.
4. `e2e/tsconfig.json` and a `typecheck` script so that `npm run verify` type-checks the suite; one changed line in the root `package.json`.
5. `.github/workflows/ci.yml`: on push and pull request; Node 24 with the npm cache; `npm ci`; `npm run verify`; `npx playwright install --with-deps chromium`; `npm run e2e`; the Playwright report uploaded as an artifact when the job fails; no secret; `permissions: contents: read`; actions pinned to a major version that exists (checked against the GitHub API on 2026-10-13: `actions/checkout` v7.0.1, `actions/setup-node` v7.1.0, `actions/upload-artifact` v7.0.2 are the latest releases).

Rules: TypeScript strict with `noUncheckedIndexedAccess` and `erasableSyntaxOnly`; no `any`; imports carry `.ts`; no code comments unless the code reads as a mistake without one; no new dependency; no long dashes in any file; nothing under `apps/**` changes.

## What was measured by the conductor (Windows 11, Node 24.16, Playwright 1.64)

- `npm run e2e` at the patch: 10 passed, twice in a row; after each run no directory with the prefix `covertree-e2e-` is left in the temporary folder and nothing listens on 4000, 5173 or 4174. `npm run verify` exit 0.
- With the list path of the API changed, in a scratch tree, to call the weather provider: the suite fails at the count check of the third test ("calls": 3 received, 2 expected), the first check after the list load that ends the second test.
- With the stub changed, in a scratch tree, to answer zip `00000` with the success fixture: the unknown-location test fails (alert not found).
- Not run anywhere yet: the workflow itself, and the suite on Linux.

## What to look for, in this order

1. Correctness of the suite as a proof: an assertion that can pass while the behaviour is broken (a locator that matches the wrong element, a check that holds before the action took effect, a count read too early, a modality or focus check that would also pass for a non-modal dialog), a story of point 3 that is asserted only in part, a place where the weather proof would miss a provider call.
2. Flakiness: a race between an action and an assertion, a dependency on timing, on the time zone, on the order of rows created within one millisecond, on the internet, on state left by an earlier run.
3. Process and file life cycle on Windows and on Linux: servers that survive the run, ports not released, the temporary directory not removed or removed too early, more than one directory created, behaviour when a run is interrupted or when a server fails to start.
4. The workflow: wrong or missing step, a step that cannot work on `ubuntu-latest`, wrong artifact path, permissions, caching, anything that would fail on the first push.
5. Safety: anything that could read `.env`, send or print a real key, or call the real Weatherstack.
6. Violations of the rules above, duplication or needless code worth removing.

Do not report style preferences, and do not report the absence of things the list above does not ask for (the phone layout, the remote weather icon and the fonts are out of scope).

## Form of the answer

A numbered list of findings, most severe first. For each: severity (`blocker`, `major`, `minor`), file and line or symbol, what is wrong, why it matters (the concrete failure), and the smallest fix. If you are unsure whether something is a defect, say so and say what would settle it. End with one line: `VERDICT: approve` or `VERDICT: changes requested`.

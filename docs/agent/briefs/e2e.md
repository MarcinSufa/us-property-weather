# Brief: slice `e2e`, the six stories in a browser and the CI workflow

Wave 2. Conductor rules: `docs/agent/handoffs/wave-2.md`. Binding design: `docs/plan.md` sections 4, 9, 11 and 12. This brief adds only what they leave open.

## Owns

`e2e/**` except the dependency list of `e2e/package.json`, and `.github/**`. In `e2e/package.json` the slice may add scripts. In the root `package.json` it may change one line only, the `typecheck` script, to include the `e2e` workspace. Nothing under `apps/**` changes: a defect found there is reported with a failing test and is not fixed in this slice.

## What to build

1. `e2e/weatherstack-stub.ts`: an HTTP server on `node:http`, no dependency. It answers `GET /current` from the recorded fixtures of the `weather` slice, read from `apps/api/src/weather/fixtures/` and never copied:
   - a query for the unknown-location address of the tests gets `current-unknown.json` with HTTP 400, as the real service answers (measured, `docs/agent/manager-state.md`);
   - every other query gets `current-85268.json` with HTTP 200;
   - it counts the `/current` requests it served and returns the count on `GET /__calls`, so a test can prove which actions reach the weather service.
2. `e2e/playwright.config.ts`: Chromium only, one worker, tests in order. Three servers through `webServer`, each with `reuseExistingServer: false` so a run never talks to a development server left open:
   - the stub on a port of its own;
   - the API, started as `node src/main.ts` from `apps/api`, with its whole configuration in `env`: `WEATHERSTACK_BASE_URL` pointing at the stub, `WEATHERSTACK_API_KEY` set to the literal `e2e-stub-key`, `DATABASE_PATH` a file in a fresh directory under the system temporary folder, `PORT=4000`, `LOG_LEVEL=silent` or `warn`. It never passes `--env-file` and never needs `.env` to exist;
   - the web dev server on 5173, whose proxy already points at port 4000.
   The temporary database directory is removed when the run ends.
3. `e2e/stories.spec.ts` (one file, or one per story if that reads better), each test name starting with its criterion id from `docs/SPEC.md`:
   - Create: fill the form, submit, land on the detail page of the new property with its weather card. The stub count went from 0 to 1.
   - Create with an unknown location: the alert of `LOCATION_NOT_FOUND` is shown, what was typed stays, and the list afterwards does not contain the address.
   - Create with invalid input the browser lets through (for example a street of spaces): the field error from the server is under its field.
   - List: the created properties are rows with city, state, zip code and the weather summary.
   - Filter: by city in another letter case, by state, by zip code; the URL carries the filter and a reload shows the same view.
   - Sort: newest first by default, oldest first when chosen.
   - Detail: reached from the list row, shows the address, the coordinates and the weather card.
   - Delete: confirm in the dialog, the row is gone, and its detail URL shows the not-found state.
   - The weather proof: after the list, the filters, the sort, the detail page and the delete have run, the stub count equals the number of creates that were sent and nothing more.
   Locators by role and label, as in the web tests. No fixed sleeps.
4. `e2e/tsconfig.json` extending `tsconfig.base.json`, and a `typecheck` script, so the suite is type-checked by `npm run verify`.
5. `.github/workflows/ci.yml`: on push and on pull request; Node 24 with the npm cache; `npm ci`; `npm run verify`; `npx playwright install --with-deps chromium`; `npm run e2e`; the Playwright report uploaded as an artifact when the job fails. The job needs no secret and declares `permissions: contents: read`. Actions are pinned to a major version that exists today: check, do not guess.

## Proof (the suite is the test, so red comes first here too)

- The weather proof is seen red once: point one list request of the test at a stub count that is deliberately wrong, or run it against an API whose list resolver calls the provider in a scratch copy outside the repository, and save the red output. Then the real run, green.
- The unknown-location story is seen red against a stub that answers that address with the success fixture.
- `npm run e2e` from the repository root, twice in a row, green both times: the second run proves the temporary database and the ports are released.
- After the run: no `node` process of the suite left alive, checked with a command and recorded.
- `npm run verify` exit 0 with the new `typecheck` line.
- The workflow cannot be seen running before Marcin publishes. Say so in the report; validate what can be validated locally (the YAML parses, every command in it was run by hand in this order).

## Gotchas

- Port 4000 and 5173 are fixed by the web proxy and `strictPort`. A development server left running makes the suite fail at start; that is wanted, and the README says to stop `npm run dev` first.
- On Windows a server started by Playwright through `npm run` can outlive the run as a child `node` process. Start the API and the stub with `node` directly where that avoids it.
- Node 24 runs `.ts` files directly; `erasableSyntaxOnly` applies, imports carry `.ts`.
- The root Vitest config must not pick up `e2e/**/*.spec.ts`. Check it; if it does, report it, because `vitest.config.js` is the manager's.
- `npx playwright install chromium` downloads a browser; it is not a dependency change and is allowed.
- The stub key literal is a placeholder, not a secret. The real key is never read, and no test calls the real Weatherstack.
- The Playwright report and `test-results` folders are ignored by git; if `.gitignore` lacks them, list the lines in the report for the manager to add.

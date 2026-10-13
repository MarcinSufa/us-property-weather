Implemented the E2E slice in the permitted files:

- Added [weatherstack-stub.ts](/C:/tmp/covertree-e2e/e2e/weatherstack-stub.ts), serving the API’s fixtures directly. The stub port is **4174**, and the unknown-location zip is **00000**; both constants are defined once and imported where needed.
- Added [playwright.config.ts](/C:/tmp/covertree-e2e/e2e/playwright.config.ts), [stories.spec.ts](/C:/tmp/covertree-e2e/e2e/stories.spec.ts) and [tsconfig.json](/C:/tmp/covertree-e2e/e2e/tsconfig.json).
- Added the E2E `typecheck` script in [e2e/package.json](/C:/tmp/covertree-e2e/e2e/package.json), extended the root `typecheck` command in [package.json](/C:/tmp/covertree-e2e/package.json), and added [ci.yml](/C:/tmp/covertree-e2e/.github/workflows/ci.yml).

The stories use these acceptance criteria:

- `AC-CREATE-10`: successful create and the additional creates that seed list coverage.
- `AC-CREATE-15`, `AC-WEB-14`: unknown location shows its alert, preserves the typed address, and saves nothing.
- `AC-CREATE-9`, `AC-CREATE-13`: server field error is described by the Street input and receives focus.
- `AC-LIST-2`: rows show all address fields and fixture weather.
- `AC-FILTER-7`: city, state and zip filters update the URL and survive reloads.
- `AC-SORT-4`: sort updates the URL and survives reload, while checking newest-first order.
- `AC-DETAIL-5`: list navigation opens details with coordinates and stored weather.
- `AC-DELETE-3`, `AC-WEB-16`: modal behavior, focus restoration, cancellation and deletion.
- `AC-WEATHER-9`: final running count proves list, filter, sort, detail and delete add no weather calls.

The temporary database directory is created once by the runner under the system temp directory with the `covertree-e2e-` prefix. An environment marker lets workers reuse its path. A synchronous exit handler registered only by the runner removes it after Playwright has stopped the servers; `force` and retries handle an already-removed directory and transient SQLite locks on Windows. Vite starts directly with `node node_modules/vite/bin/vite.js`, from `apps/web`.

Checks run:

- `npx prettier --check e2e .github package.json` - passed.
- `npx eslint e2e` - passed.
- `npm run typecheck` - passed for API, web and E2E.
- Prettier parsed the workflow YAML as part of its check.

I did not run Playwright, `npm run verify`, or start any servers, as directed. The conductor should run the red-first proof, the E2E suite twice, check process and temporary-directory cleanup, and validate the CI command sequence. The workflow itself cannot be observed running before publication.
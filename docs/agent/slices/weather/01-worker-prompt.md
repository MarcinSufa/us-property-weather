# Worker prompt 01: slice `weather`, round 1, tests only (red)

You are the worker of slice `weather` in this repository (a small GraphQL API that stores US properties with a weather snapshot). You work in the current directory, a git worktree on branch `slice/weather`. Read `AGENTS.md`, `docs/plan.md` sections 4, 8 and 11, and the criteria of area WEATHER in `docs/SPEC.md` before you write anything.

## This round

Write the tests of the Weatherstack adapter and nothing else. The implementation does not exist yet: `apps/api/src/weather/weatherstack-provider.ts` rejects with "not implemented" and `weatherstack-response.ts` is a placeholder. Do not implement anything in this round. The tests must fail now for the right reason (the behaviour is missing), not because of a syntax, import or type error. A second round implements.

## Paths

You may create or change only files under `apps/api/src/weather/`, and in this round only test files (`*.test.ts`) and, if you need one, a test helper file next to them. Do not change `apps/api/src/weather/fixtures/*.json` (recorded from the real service by the conductor). Do not touch any `package.json`, the lockfile, `docs/SPEC.md`, `docs/plan.md`, `AGENTS.md` or anything outside `apps/api/src/weather/`. The one exception: save the test output of this round to `docs/agent/slices/weather/02-red-skeleton.txt`.

Fixed and not to change, now or later: everything exported from `weather-provider.ts` (`WeatherReport`, `WeatherProvider`, `LocationNotFoundError`, `WeatherUnavailableError`) and `WeatherstackProviderOptions` with the constructor of `WeatherstackProvider`. Another slice builds against them at the same time.

## The behaviour the tests describe

`new WeatherstackProvider({ fetch, baseUrl, apiKey, timeoutMs, logger }).getCurrentWeather(address)`:

1. Makes exactly one call of the injected `fetch`: `GET {baseUrl}/current` with the query parameters `access_key` (the key) and `query` (the zip code of the address), and an `AbortSignal` as `signal` (it will be `AbortSignal.timeout(timeoutMs)`). No retry on any failure: after every failure case the stub has been called exactly once.
2. On success returns `{ lat, long, current }`: `lat` and `long` are finite numbers parsed from the strings `location.lat` and `location.lon`, and `current` is the response's `current` object whole, unknown keys kept.
3. Reads the body before it judges the HTTP status, because Weatherstack sends its error object with non-2xx statuses: code 106 was seen with HTTP 429 and code 615 with HTTP 400.
4. Error mapping:
   - body `{ success: false, error: { code: 615, ... } }`, whatever the HTTP status: rejects with `LocationNotFoundError`.
   - every other `success: false` body, whatever the HTTP status: rejects with `WeatherUnavailableError` whose `reason` is `code_<code>` (for example `code_106`).
   - `fetch` rejects with an error named `TimeoutError` or `AbortError`: `WeatherUnavailableError` with reason `timeout`. The same when reading the body rejects with such an error.
   - `fetch` rejects with anything else (or reading the body rejects with anything else): reason `network`.
   - non-2xx status and the body is not JSON or fits neither shape: reason `http_<status>` (for example `http_500`).
   - 2xx status and the body is not JSON: reason `unreadable_body`.
   - 2xx status, JSON, fits neither shape (no `location`, `lat` or `lon` not a string holding a finite number, `current` missing or not an object): reason `unexpected_shape`.
   - `lat` and `lon` must arrive as strings that hold a finite number. A number instead of a string, an empty or blank string, `"abc"`, `"NaN"`, `"Infinity"`: all `unexpected_shape`.
5. Writes exactly one log line per call through the injected logger, on success and on every failure, with the fields `outcome` (`ok`, `location_not_found` or `unavailable`), `reason` (on failures; for 615 it is `code_615`) and `durationMs` (a non-negative number). The line never contains the URL, the key or the raw error object of `fetch`.
6. The key never leaks: not into a log line and not into a thrown error at any depth.

## Tests to write

Vitest (`vitest` is installed), file `apps/api/src/weather/weatherstack-provider.test.ts` (a second file for the response schema is allowed if you find it clearer, but it must test through exports that will plausibly exist; prefer testing everything through the provider). A stub `fetch` passed through the constructor: a plain function you write, typed as `typeof fetch`, that records its calls and returns a real `Response` (`new Response(body, { status })`) or rejects. No HTTP mocking library, no network, no `vi.stubGlobal` of `fetch`. A real `pino` logger writing to an in-memory stream (a `node:stream` `Writable` that collects chunks), so the tests read the actual JSON lines.

Load the fixtures with `readFileSync` and `JSON.parse` relative to `import.meta.url`:

- `fixtures/current-85268.json`: a real success answer for zip code 85268 (recorded with HTTP 200).
- `fixtures/current-unknown.json`: the real answer for zip code `00000`: `{ "success": false, "error": { "code": 615, "type": "request_failed", "info": "..." } }`, recorded with HTTP status 400. Use it with status 400 for the 615 test.

Every test name starts with a criterion id. Use these ids:

| Id | Covers |
|---|---|
| `AC-WEATHER-1` | one `fetch` call, path `/current`, `query` is the zip code, `access_key` is the key, the signal is an `AbortSignal`, the base URL is the one injected |
| `AC-WEATHER-2` | success from `current-85268.json`: `lat` and `long` are numbers equal to `Number()` of the fixture strings |
| `AC-WEATHER-8` | `current` deep-equals the fixture's `current` key for key (it contains `astro` and `air_quality`), and an extra unknown key you add to a copy of `current` in the test survives |
| `AC-WEATHER-3` | HTTP 200 with `success: false` is a failure |
| `AC-WEATHER-4` | code 615 (from `current-unknown.json`, status 400, and once more with status 200) rejects with `LocationNotFoundError` |
| `AC-WEATHER-5` | codes 101, 104, 105, 106 (106 with HTTP 429) and one unlisted code (for example 999) reject with `WeatherUnavailableError` |
| `AC-WEATHER-6` | HTTP 500 with a non-JSON body, a rejected `fetch` (network), an aborted `fetch` (timeout: reject with `new DOMException('The operation was aborted due to timeout', 'TimeoutError')`), a 200 with an unreadable (non-JSON) body, a 200 without `location`, a 200 whose `lat` is not a number, plus the other `lat`/`lon` cases of point 4 |
| `AC-WEATHER-7` | the key never leaks (see below) |
| `AC-WEATHER-13` (proposed) | one log line per call with `outcome`, `reason` and `durationMs` |
| `AC-WEATHER-14` (proposed) | the body is read before the status: a `success: false` body with HTTP 429 gives `code_106`, not `http_429`; code 615 with HTTP 400 gives `LocationNotFoundError` |
| `AC-WEATHER-15` (proposed) | the `reason` of each failure: `timeout`, `network`, `http_500`, `code_106`, `unreadable_body`, `unexpected_shape` |

Use `it.each` tables where cases repeat, so one table of failure cases can feed the mapping tests, the log tests and the leak test (define the failure cases once).

### The leak test (AC-WEATHER-7)

Build the provider with the key `MARKER_KEY_7f3a`. Run the success case and every failure case of the table above. For the network and timeout cases the stub must be hostile: the error it rejects with carries the full request URL (which contains the key) in its `message` and in a `cause`, the way a real `fetch` failure can. For each case:

- collect every log line of the pino memory stream as raw text;
- catch the thrown error and inspect it to full depth: `message`, `reason`, `stack`, `cause` followed recursively, every own property (including non-enumerable ones), and `util.inspect(error, { depth: Infinity, showHidden: true })`.

Assert that the string `MARKER_KEY_7f3a` appears in none of them. Also assert that no log line and no error contains the string `access_key`. The test must have at least one assertion that proves the inspection itself can find a marker (for example run the same inspection helper over a hand-made error that does contain the marker and expect it to be found), so that a broken helper cannot make the test pass.

## Rules

- TypeScript strict, `noUncheckedIndexedAccess`, `erasableSyntaxOnly`: no enums, no parameter properties, no `any`. Imports carry the `.ts` extension.
- No code comments unless the code reads as a mistake without one. No long dashes (U+2014, U+2013) in any file.
- No new dependency. No `npm install`: the sandbox has no network and everything is installed.
- No real Weatherstack call, no network at all.
- You cannot write the git index: do not try to commit. The conductor commits.

## Before you finish

1. Run `npm run test --workspace=apps/api 2>&1` and save the complete output to `docs/agent/slices/weather/02-red-skeleton.txt`. Every new test that describes missing behaviour must fail; say which tests pass already and why (for example the helper self-check).
2. Run `npx eslint apps/api/src/weather` and `npm run typecheck --workspace=apps/api` and `npx prettier --check apps/api/src/weather`: all three must be clean, because a red test must be red for its behaviour only.
3. Reply with: the files you created, the number of tests failing and passing, anything in this prompt that you found contradictory or impossible, and any decision you made that the prompt did not settle.

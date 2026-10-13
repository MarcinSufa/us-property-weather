# Worker prompt 08: slice `weather`, round 3a, test changes only (red)

You are the worker of slice `weather` in this repository, in the current directory (git worktree, branch `slice/weather`). The adapter and its tests are committed and green (145 tests). The manager ruled on five open points. This round changes only the test file `apps/api/src/weather/weatherstack-provider.test.ts`; the next round changes the implementation. Read `AGENTS.md`, the test file, `weatherstack-provider.ts` and `weatherstack-response.ts` first.

## Rulings to turn into tests

1. Unknown errors propagate unchanged. The adapter catches only what it maps: a rejection of `fetch`, a rejection of the body read, a Weatherstack failure body, a bad status, a body that is not JSON, a body of the wrong shape. Any other error thrown inside the call comes out as itself, not as `WeatherUnavailableError`, and the reason `unexpected_error` does not exist. The adapter attempts no second log line for it.
   New test (id `AC-WEATHER-6`): a logger whose `info` method throws a specific `Error` instance on the success path (build a real pino logger on the memory stream and replace `info` on it, or pass a child with `info` overridden; no `any`). `getCurrentWeather` must reject with that very instance (`toBe`), the rejection is not a `WeatherUnavailableError`, and no log line was written to the memory stream (in particular no `warn` line with `unexpected_error`). This test is red today: the current code relabels the error and writes a warn line.
2. Coordinates are plain decimal numbers: an optional minus, digits, an optional fraction (`-111.724`, `33`, `33.609`), and inside range: latitude -90 to 90, longitude -180 to 180, bounds included. Anything else is `unexpected_shape`.
   Add to the existing table of coordinate failure cases, for latitude and for longitude: `"0x10"`, `"1e3"`, a leading plus (`"+33.6"`), a trailing dot (`"33."`), a leading dot (`".5"`), and one out-of-range value each (`"90.001"` for latitude, `"-180.001"` for longitude). Add one passing success test (id `AC-WEATHER-2`) for the bounds: `lat: "-90"`, `lon: "180"` give `-90` and `180`. Surrounding whitespace: the existing cases already say blank strings fail; add `" 33.609"` (leading space) as `unexpected_shape` too, since the format is exact.
   The hex, exponent and out-of-range cases are red today; say in your reply which of the others are red and which pass already.
3. One criterion id per test name. Today the `it.each` tables produce names such as `AC-WEATHER-13 logs one AC-WEATHER-6 HTTP 500 ... outcome`. Give each failure case a `label` without an id and a separate `criterion` field; the mapping test is named `<criterion> <label> rejects with the mapped weather error`, the other tables use their own id plus the label. No test name may contain two `AC-` ids. Every test name still starts with exactly one.
4. Remove near-duplicates. The `AC-WEATHER-15` table repeats for all cases what `AC-WEATHER-13` already asserts. Keep `AC-WEATHER-13` over the full table (one log line, `outcome`, `reason`, `durationMs`), and reduce `AC-WEATHER-15` to exactly one case per reason of the vocabulary: `timeout`, `network`, `http_500`, `code_106`, `unreadable_body`, `unexpected_shape`. In those six tests assert the `reason` on the thrown `WeatherUnavailableError` (not on the log line, which `AC-WEATHER-13` covers).
5. Keep everything else, in particular the test that pins code 615 with HTTP 400 from `current-unknown.json`, the leak tests over the full table and the leak-helper self-check.

## Rules

- Change only `apps/api/src/weather/weatherstack-provider.test.ts` in this round. No implementation change, no fixture change.
- TypeScript strict, `noUncheckedIndexedAccess`, `erasableSyntaxOnly`: no enums, no `any`. Imports carry the `.ts` extension. No code comments. No long dashes (U+2014, U+2013).
- No new dependency, no `npm install`, no network. Do not read any `.env` file. Do not commit.
- Vitest does not start in your sandbox (`spawn EPERM`): do not try, the conductor runs the tests. Run `npx eslint apps/api/src/weather`, `npm run typecheck --workspace=apps/api` and `npx prettier --check apps/api/src/weather`; all three must be clean.

Reply with: what you changed, which new tests you expect red and which green, the number of tests you expect in total, and anything you found contradictory.

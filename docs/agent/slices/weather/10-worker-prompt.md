# Worker prompt 10: slice `weather`, round 3b, implement the rulings

You are the worker of slice `weather` in this repository, in the current directory (git worktree, branch `slice/weather`). Round 3a changed `apps/api/src/weather/weatherstack-provider.test.ts`. The conductor ran it: 161 tests, 43 fail. The failures are the new coordinate cases (hex, exponent, plus sign, trailing dot, leading dot, leading space, out of range, for latitude and longitude, in the mapping, log and leak tables) and `AC-WEATHER-6 propagates a success logger error without logging again`. Read `AGENTS.md`, the test file, `weatherstack-provider.ts` and `weatherstack-response.ts` first.

## Changes

1. `weatherstack-response.ts`, coordinates: a coordinate is a string that is exactly a plain decimal number: an optional minus, one or more digits, an optional fraction of a dot and one or more digits. No trimming, no plus sign, no exponent, no hex. After conversion the latitude is inside -90 to 90 and the longitude inside -180 to 180, bounds included. Anything else fails the schema (the provider reports `unexpected_shape`). One small function that builds the schema for a given bound is enough (latitude 90, longitude 180); do not repeat the rule twice.
2. `weatherstack-provider.ts`, errors:
   - Remove the reason `unexpected_error` and the outer catch-all. The adapter catches only what it maps: a rejection of `fetch` and a rejection of the body read (`timeout` or `network`), and the JSON parse. Any other error thrown inside the call propagates unchanged, and no log line is attempted for it.
   - Remove the private one-line wrapper `unavailable(reason)`; construct `WeatherUnavailableError` where it is thrown.
   - Still exactly one log line per call for the success and for every mapped failure, with `outcome`, `reason` (failures) and `durationMs`; `info` for `ok`, `warn` otherwise. Write the failure log in one place, not at every throw site. A shape that works: a private method that performs the request and returns either the report or the mapped error to raise (or throws the mapped domain errors), and `getCurrentWeather` that measures the duration, logs once and returns or throws. In that shape the catch that logs the failure must handle only `LocationNotFoundError` and `WeatherUnavailableError` and rethrow everything else untouched without logging; and the success `logger.info` call must sit outside that `try`, so that a throwing logger is never caught by it. Choose the shortest form that satisfies the tests.
   - Unchanged: `WeatherstackProviderOptions`, the constructor, the request (one `GET {baseUrl}/current`, `access_key`, `query`, `AbortSignal.timeout`), body before status, the mapping order, no `cause` on any error, no URL anywhere.
3. `weatherstack-provider.test.ts`, one line only: the leak table still names its tests with `$name`, a field that no longer exists, so they read `AC-WEATHER-7 does not leak the key for undefined`. Change it to `$label`. No other test change. If a test looks wrong to you, say so in the reply instead of changing it.

## Rules

- Change only the three files named above, the test file only for that one line.
- TypeScript strict, `noUncheckedIndexedAccess`, `erasableSyntaxOnly`: no enums, no parameter properties, no `any`. Imports carry the `.ts` extension. Response types are inferred from the Zod schemas.
- No code comments. No long dashes (U+2014, U+2013). No new files, no new abstractions beyond what is described.
- No new dependency, no `npm install`, no network, no real Weatherstack call. Do not read any `.env` file. Do not commit.
- Vitest does not start in your sandbox (`spawn EPERM`): do not try, the conductor runs the tests. Run `npx eslint apps/api/src/weather`, `npm run typecheck --workspace=apps/api` and `npx prettier --check apps/api/src/weather`; all three must be clean.

Reply with: what you changed and anything you found contradictory.

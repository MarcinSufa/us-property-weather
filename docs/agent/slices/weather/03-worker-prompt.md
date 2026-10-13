# Worker prompt 03: slice `weather`, round 2a, the implementation with a deliberate key leak

You are the worker of slice `weather` in this repository, in the current directory (git worktree, branch `slice/weather`). Read `AGENTS.md`, `docs/plan.md` sections 4 and 8, and `apps/api/src/weather/weatherstack-provider.test.ts` (committed in round 1, all red) before you write anything. The test file is the specification of this round.

## This round

Implement the adapter so that every test passes except the key-leak tests, which must fail in this round on purpose. The project rule is that the leak test is seen red against an implementation that puts the URL into the error. The conductor runs the tests after you and saves that red output; the next round removes the leak.

So, deliberately and only for this round:

- every `WeatherUnavailableError` and `LocationNotFoundError` the adapter throws gets a `cause` that holds the request URL as a string (for example `error.cause = url.href`), and when `fetch` or the body read rejected, the `cause` is the caught error itself;
- nothing else is unsafe: the log line stays clean (the log tests must pass).

Mark the deliberate leak with one comment line `// ROUND 2A DELIBERATE LEAK, REMOVED IN ROUND 2B` so it cannot survive by accident.

## What to build

1. `apps/api/src/weather/weatherstack-response.ts`: replace the placeholder. A Zod 4 schema (`zod` is installed) for the two answers Weatherstack gives:
   - failure: `{ success: false, error: { code: number, type: string } }` (extra keys such as `info` are allowed);
   - success: `{ location: { lat, lon }, current: {...} }`. `current` is an object whose unknown keys are kept, not stripped (it is stored whole). `lat` and `lon` arrive as strings and leave as finite numbers: a number instead of a string, an empty or blank string, `"abc"`, `"NaN"`, `"Infinity"` do not parse.
   - The exported types are inferred from the schema (`z.infer` / `z.output`), not written by hand. The old hand-written interfaces and the `parseWeatherstackResponse` placeholder may be replaced freely: nothing outside this folder imports them (check with a search before you remove an export).
2. `apps/api/src/weather/weatherstack-provider.ts`: the body of `getCurrentWeather(address)`. Do not change `WeatherstackProviderOptions`, the constructor or anything in `weather-provider.ts`.
   - One request: `GET {baseUrl}/current` with `access_key` and `query` (the zip code) built with `URL` and `URLSearchParams`, and `AbortSignal.timeout(timeoutMs)`. The base URL may carry a path (`https://host/v1` gives `https://host/v1/current`).
   - Returns `{ lat, long, current }` with `current` whole.
   - Read the body before judging the status. Mapping, in this order: `fetch` or the body read rejects with an error named `TimeoutError` or `AbortError`: `WeatherUnavailableError('timeout')`; rejects with anything else: `'network'`. Body is JSON and fits the failure shape: code 615 gives `LocationNotFoundError`, any other code gives `WeatherUnavailableError('code_<code>')`, whatever the HTTP status. Otherwise, non-2xx status: `'http_<status>'`. Otherwise, body not JSON: `'unreadable_body'`. Otherwise, body does not fit the success shape: `'unexpected_shape'`.
   - One log line per call through the injected pino logger, on success and on every failure, with the fields `outcome` (`ok`, `location_not_found`, `unavailable`), `reason` (failures only; for 615 it is `code_615`) and `durationMs`. `info` level for `ok`, `warn` for the others. Never the URL, never the key, never the raw error object of `fetch`.
   - No retry, no cache.
   - Weatherstack knowledge (the path, the parameter names, code 615) stays in this file and in `weatherstack-response.ts`.

## Rules

- Change only `apps/api/src/weather/weatherstack-provider.ts` and `apps/api/src/weather/weatherstack-response.ts`. Do not change the test file or the fixtures in this round. If a test looks wrong to you, do not change it: say so in your reply.
- TypeScript strict, `noUncheckedIndexedAccess`, `erasableSyntaxOnly`: no enums, no parameter properties, no `any`. Imports carry the `.ts` extension.
- Minimum code that works: no helper layers or abstractions the tests do not need. No code comments except the one marker line above. No long dashes (U+2014, U+2013) in any file.
- No new dependency, no `npm install`, no network, no real Weatherstack call. Do not read any `.env` file.
- You cannot write the git index: do not commit.

## Before you finish

Run the API tests if your sandbox allows it (`npm run test --workspace=apps/api`; if it fails to start with `spawn EPERM`, say so and stop trying: the conductor runs them), then `npx eslint apps/api/src/weather`, `npm run typecheck --workspace=apps/api` and `npx prettier --check apps/api/src/weather`. Do not write output files in this round. Reply with: what you changed, which tests fail and why, and anything in the prompt or the tests you found contradictory.

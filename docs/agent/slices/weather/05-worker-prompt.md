# Worker prompt 05: slice `weather`, round 2b, remove the deliberate leak and tidy

You are the worker of slice `weather` in this repository, in the current directory (git worktree, branch `slice/weather`). Round 2a left an implementation of the Weatherstack adapter in `apps/api/src/weather/weatherstack-provider.ts` and `weatherstack-response.ts` that leaks the request URL on purpose. The conductor ran the tests: 111 pass, 34 fail, all 34 are the `AC-WEATHER-7 does not leak the key` cases, as intended. Read both files, `apps/api/src/weather/weatherstack-provider.test.ts` and `AGENTS.md` first.

## This round

1. Remove the leak completely. No thrown error carries a `cause`, a URL or the caught `fetch` error; the marker comment line goes too. `WeatherUnavailableError` carries only its `reason`, `LocationNotFoundError` carries nothing. The private helper that attached a cause is no longer needed in that form.
2. Tidy what round 2a left, without changing behaviour that a test pins:
   - The branch `if ('success' in data) throw ...` after the success checks is unreachable and exists only to narrow a union. Prefer two schemas in `weatherstack-response.ts` (one for the failure answer, one for the success answer, each with its inferred type exported) and try the failure schema first, then the status, then JSON validity, then the success schema. The mapping order stays: failure shape (615, then other codes), non-2xx status, not JSON, unexpected shape.
   - The outer `catch` maps every unknown error to `network`. Only a rejection of `fetch` or of the body read is a network or timeout failure. Structure the code so that no other error is relabelled as `network`, and so that exactly one log line is written per call on every path (one place that logs the failure, one that logs the success).
   - Keep it short and flat: no new files, no new abstractions, no comments.
3. Do not change `WeatherstackProviderOptions`, the constructor, `weather-provider.ts`, the test file or the fixtures. If a test looks wrong to you, say so in the reply instead of changing it.

## Rules

- Change only `apps/api/src/weather/weatherstack-provider.ts` and `apps/api/src/weather/weatherstack-response.ts`.
- TypeScript strict, `noUncheckedIndexedAccess`, `erasableSyntaxOnly`: no enums, no parameter properties, no `any`. Imports carry the `.ts` extension. Types of the response are inferred from the Zod schemas.
- No code comments. No long dashes (U+2014, U+2013) in any file.
- No new dependency, no `npm install`, no network, no real Weatherstack call. Do not read any `.env` file.
- You cannot write the git index: do not commit. The API tests do not start in your sandbox (`spawn EPERM`): do not try, the conductor runs them.

## Before you finish

Run `npx eslint apps/api/src/weather`, `npm run typecheck --workspace=apps/api` and `npx prettier --check apps/api/src/weather`. Reply with: what you changed, and anything you found contradictory.

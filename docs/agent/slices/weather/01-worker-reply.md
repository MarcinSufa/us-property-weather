Created the tests in [weatherstack-provider.test.ts](/C:/tmp/covertree-weather/apps/api/src/weather/weatherstack-provider.test.ts) and saved the run output in [02-red-skeleton.txt](/C:/tmp/covertree-weather/docs/agent/slices/weather/02-red-skeleton.txt). No implementation files were changed.

The latest run reports **142 failed, 3 passed**. All 142 failures are weather behavior tests against the current “not implemented” provider. The passing tests are the leak-inspection self-check and two existing GraphQL contract tests.

ESLint, API typecheck, and Prettier all pass. The requested `npm run test` command hit the sandbox’s `spawn EPERM` before collecting tests; I used the repository’s Vitest sandbox wrapper to capture the red results.

One prompt mismatch: AC-WEATHER-13/14/15 are proposed IDs absent from `docs/SPEC.md`, but the prompt also explicitly requires those tests. I used the requested IDs without changing the spec.
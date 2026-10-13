Implemented the slice. `US_STATES` is compile-time checked against the generated `UsState` type; input validation returns ordered, safe field errors; configuration validation applies defaults and aggregates errors without exposing values.

**Files changed:** [property-input.ts](C:/tmp/covertree-api/apps/api/src/property/property-input.ts), [property-input.test.ts](C:/tmp/covertree-api/apps/api/src/property/property-input.test.ts), [config.ts](C:/tmp/covertree-api/apps/api/src/config.ts), [config.test.ts](C:/tmp/covertree-api/apps/api/src/config.test.ts), [01-red-output.txt](C:/tmp/covertree-api/docs/agent/slices/api/01-red-output.txt), [01-green-output.txt](C:/tmp/covertree-api/docs/agent/slices/api/01-green-output.txt).

**Verification:**

- Red run: 52 new tests failed against the skeleton; 2 existing tests passed.
- Green run: 54 tests passed.
- `npx prettier --check apps/api` passed.
- `npm run lint` passed.
- `npm run typecheck` passed.
- `git diff --check` passed.

The direct `npm run test --workspace=apps/api` attempt hit the Windows sandbox’s `spawn EPERM` before tests ran. I used the repository’s Vitest sandbox wrapper for the red and green runs. No plan or signature conflicts found.
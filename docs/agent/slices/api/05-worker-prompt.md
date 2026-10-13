# Worker prompt 05: slice `api`, round 3 continued (the masking mismatch resolved, new criterion ids, the proof)

You are the implementer of slice `api` of the CoverTree project. Working directory: the git worktree `c:/tmp/covertree-api`, branch `slice/api`. You stopped on prompt 04 (`docs/agent/slices/api/04-worker-prompt.md`) with the implementation written and 6 tests failing, because Yoga masked the `GraphQLError` thrown by the resolver wrapper. You were right to stop. This prompt resolves it and finishes the round. Everything in prompt 04 still binds unless this prompt changes it; read it again first. Your uncommitted files from that round are in the tree: `apps/api/src/graphql/errors.ts`, `errors.test.ts`, `resolvers.ts`, `yoga.ts`, `yoga.test.ts`.

## The cause of the mismatch, measured by the conductor

Under plain Node the code you wrote behaves as prompt 04 assumed: a script that built the Yoga instance and sent `deleteProperty` with an unknown id got `PROPERTY_NOT_FOUND`, with and without `NODE_ENV=development`. Only under Vitest it is masked. Yoga decides with `error instanceof GraphQLError` (`node_modules/graphql-yoga/esm/error.js`, `isOriginalGraphQLError`). The `graphql` package has a `development` export condition (`node_modules/graphql/package.json`), so the `graphql` that Vitest resolves for `errors.ts` is very likely a second copy of the module, different from the one Node loads for `graphql-yoga`, and `instanceof` is false across the two copies. Confirm or refute this in a sentence in your final message if you can do it cheaply; do not spend long on it.

## The fix

In `apps/api/src/graphql/errors.ts`, build the errors with `createGraphQLError` exported by `graphql-yoga` instead of `new GraphQLError(...)` from `graphql`, keeping `import type { GraphQLError } from 'graphql'` for the return type. The error is then made by the same `graphql` copy that Yoga checks against, under Vitest and under Node alike. The signature `toGraphQLError(error: unknown): GraphQLError` does not change. Do not touch `apps/api/vitest.config.ts`, any `package.json` or Yoga's masking options. If this does not make the six tests pass, stop and report what you measured.

## Changes to the tests

1. Criterion ids. `docs/SPEC.md` was reworded by the manager on another branch (do not edit the file; the text below is the new one). Rename the tests of this slice accordingly, in `property-input.test.ts`, `property-service.test.ts` and `yoga.test.ts` (you may edit the first two for the names and the additions of this prompt only):
   - AC-FILTER-5: a city filter that is empty or contains only whitespace applies no restriction.
   - AC-FILTER-6: a non-blank zip-code filter whose trimmed value is not exactly five digits fails with `BAD_USER_INPUT`.
   - AC-FILTER-9: a zip-code filter that is empty or contains only whitespace applies no restriction.
   - AC-FILTER-11: an empty string for `state` in the filter is rejected by GraphQL validation as an invalid `UsState` before the service runs.
   So every test of a blank `zipCode` filter is named AC-FILTER-9, not AC-FILTER-5; split a test that covers both into two, or name it with both ids. A whole filter of `null`, `undefined` or `{}` stays under AC-FILTER-5 and AC-FILTER-9 together.
2. New in `yoga.test.ts`, AC-FILTER-11: `properties(filter: { state: "" })` with the empty string written inline, and again with `state: ""` sent as a variable, is rejected by GraphQL itself: the response has errors, no `properties` data, and no error has the code `INTERNAL_SERVER_ERROR`. To show that the service did not run, use a service or repository double that records calls to `list` (or a subclass that throws when `list` is called) and assert that it was not reached.
3. Facts from the `weather` slice, which is writing the real adapter. Bring the fake and the tests in line with them:
   - The real `current` object has 18 keys, some nested with hyphenated names. Add a hyphenated nested key to the default report of `apps/api/src/property/fake-weather-provider.ts` (`air_quality: { ..., 'us-epa-index': '1' }`) and make sure the existing "stored whole" assertions (AC-CREATE-16) cover it: the object read back through the repository deep-equals the provider's `current`.
   - The adapter's `WeatherUnavailableError` reasons are one of `timeout`, `network`, `http_<status>`, `code_<code>`, `unreadable_body`, `unexpected_shape`. Use such a value with a marker inside it where a test needs to follow the reason (for example `http_503_marker-reason-do-not-leak`), or keep a pure marker; either is fine.
   - Any other error from the provider propagates unchanged out of the service. New test in `yoga.test.ts`, AC-ERROR-5 and AC-WEATHER-11: the fake provider rejects with `new Error('marker-provider-internal-do-not-leak')`; the response has one error with code `INTERNAL_SERVER_ERROR`, the marker is nowhere in the response body text, exactly one captured log line contains the marker and it has level `error` (50), the provider was called exactly once, and the list is empty afterwards.
   - Tighten the existing AC-ERROR-5 repository test the same way: exactly one log line for the failure, not at least one.

## Then finish the round as prompt 04 describes

1. Run the API tests. If Vitest cannot start in your sandbox (`spawn EPERM`), say so and stop after lint, typecheck and format: the conductor then runs the tests and the proof run and saves the outputs. If it starts, continue.
2. The new tests of this prompt must be seen failing before the code that satisfies them exists where that is possible (the AC-ERROR-5 provider test and the six masked tests are red right now, before the `createGraphQLError` change: save that run as `docs/agent/slices/api/05-red-output.txt` before you change `errors.ts`).
3. Make them pass.
4. The zero-provider-calls proof, exactly as in prompt 04 step 4: plant one deliberate call to `this.weatherProvider.getCurrentWeather(...)` inside `PropertyService.list`, run the API tests, save the output as `docs/agent/slices/api/04-zero-provider-calls-red-output.txt`, name the failing tests in your final message, remove the planted call so that `git diff -- apps/api/src/property/property-service.ts` is empty.
5. Run the API tests into `docs/agent/slices/api/04-green-output.txt`, then `npx prettier --check apps/api`, `npm run lint` and `npm run typecheck`, and fix what they report.

## Hard rules, unchanged

Never open any `.env` file. No network, no port. No new dependency. No git index or history command. No `any`, no comments unless the code reads as a mistake without one, no long dashes, no SQL text outside `db/database.ts` and `property/property-repository.ts`. Files you may change: those of prompt 04, plus `apps/api/src/property/fake-weather-provider.ts`, `apps/api/src/property/property-input.test.ts`, `apps/api/src/property/property-service.test.ts`, `apps/api/src/property/property-repository.test.ts` (only if the fake's new key requires it), and `docs/agent/slices/api/05-red-output.txt`.

## Final message

List the files you changed, the test counts of each run, which tests failed in the planted run and with what message, the commands you ran with their result, what you found about the two `graphql` copies, and anything you could not do or decided on your own.

# Slice `api`: conductor report

The final message of the `api` conductor after its first review round, unedited, saved by the manager at the merge (a subagent cannot write a report file). The branch was not merged in this state: the manager ruled on the points it raises (rows of 2026-10-13 in `docs/agent/decisions-log.md`) and ordered one more round, reported in `report-fix-round.md`.

~~~text
# Report: slice `api`, wave 1

Built, verified and reviewed once. Branch `slice/api` in `c:/tmp/covertree-api`, last commit `3bfd4eb`, base `fca2bd7`. Working tree clean, nothing pushed. Two decisions are waiting for the manager: D1 and R1 below.

## What was built

- **Input rules** (`apps/api/src/property/property-input.ts`): create input and filter parsing with Zod, one `{ field, message }` per failing field in the order street, city, state, zipCode. `US_STATES` fails the typecheck if it drifts from the generated `UsState`.
- **Configuration** (`apps/api/src/config.ts`): `loadConfig` and `ConfigError`. All six values are trimmed, a blank value counts as unset, and the message names every bad variable and never a value.
- **Storage** (`apps/api/src/db/database.ts`, `apps/api/src/property/property-repository.ts`): the plan section 6 DDL verbatim, the folder is created, five prepared statements with bound named parameters.
- **Service** (`apps/api/src/property/property-service.ts`): create validates, calls the provider once, then inserts. List, get and delete never touch the provider.
- **Test double** (`apps/api/src/property/fake-weather-provider.ts`): includes a nested hyphenated key (`air_quality['us-epa-index']`).
- **GraphQL layer** (`apps/api/src/graphql/errors.ts`, `resolvers.ts`, `yoga.ts`): `toGraphQLError`, `createResolvers(logger)` with one error-translating wrapper, and `createPropertyYoga({ propertyService, logger })`.
- **Composition root** (`apps/api/src/main.ts`): config, pino, database, the real `WeatherstackProvider`, repository, service, Yoga, `node:http`. It handles a configuration error, a server error, and `SIGINT`/`SIGTERM`.

## Commits

All carry the repository author (Marcin Sufa) and no trailer.

- `7e33bb3` feat(api): add input rules and configuration parsing
- `e9519cf` feat(api): add the database, the property repository and the property service
- `0ff87c4` feat(api): add the GraphQL error mapping, the resolver wrapper and the Yoga factory
- `550e2c2` feat(api): wire the composition root and trim configuration values
- `3bfd4eb` docs(api): record the review round and the start-up proofs

`git diff --stat fca2bd7 HEAD` shows only `apps/api/src/{property,db,graphql}/**`, `main.ts`, `config.ts`, `config.test.ts`, `docs/agent/slices/api/**` and `docs/agent/reviews/api-grok.md`. Nothing under `weather/`, `generated/`, `schema.contract.test.ts`, any `package.json` or the lockfile changed.

## Verification

- **`npm run verify`**: exit 0 after every round. The last run is `docs/agent/slices/api/06-verify.txt`: 108 API tests in 8 files, 3 web tests, 10 script tests, build passed.
- **SQL-keyword search**: a grep of `apps/api/src/**/*.ts` for SELECT, INSERT, UPDATE, DELETE FROM, CREATE TABLE, CREATE INDEX, ORDER BY, WHERE, RETURNING, COLLATE and PRAGMA, excluding `property-repository.ts`, `db/database.ts` and `generated/`, found 0 matches.
- **Long dashes**: none in the tracked files of the slice. I replaced three in the worker's reply `05-worker-reply.md`.
- **Processes**: port 4000 is free at the end and I left nothing running.

## Red and green evidence

All under `docs/agent/slices/api/`.

| Round | Red | Green |
|---|---|---|
| 1 | `01-red-output.txt`: 52 failed, 2 passed | `01-green-output.txt`: 54 passed |
| 2 | `02-red-output.txt`: 21 failed, 54 passed | `02-green-output.txt`: 75 passed |
| 3 | `04-red-output.txt`: 24 failed against stubs; `05-red-output.txt`: 6 failed, 101 passed | `04-green-output.txt`: 107 passed |
| 4 | `06-red-output.txt`: 1 failed, 107 passed | `06-green-output.txt`: 108 passed |

Zero-provider-calls proof, with one provider call planted in `PropertyService.list`: `04-zero-provider-calls-red-output.txt` shows 4 failed, 103 passed. The Yoga test `AC-WEATHER-9 leaves query and delete provider call count unchanged` expected 1 call and got 3. The service-level AC-WEATHER-9 test and the Yoga AC-ERROR-3 and AC-ERROR-4 tests expected 1 and got 2. The planted call was removed and the service file matched its commit again.

## Start-up proof

`docs/agent/slices/api/06-startup-proof.txt`, run in `apps/api` with a placeholder key on the command line and no env file:

```
## port 4000 before start
free
## missing key: env -u WEATHERSTACK_API_KEY node src/main.ts   (with PORT=abc)
WEATHERSTACK_API_KEY is required; PORT must be an integer from 1 to 65535
exit code 1
## start: WEATHERSTACK_API_KEY=placeholder-not-a-key DATABASE_PATH=<temp>/nested/properties.db node src/main.ts
## query { properties { id } }
{"data":{"properties":[]}}
## query deleteProperty unknown id
{"errors":[{"message":"Property not found.","locations":[{"line":1,"column":12}],"path":["deleteProperty"],"extensions":{"code":"PROPERTY_NOT_FOUND"}}],"data":null}
## server log
{"level":30,...,"port":4000,"msg":"GraphQL server listening"}
## database file
properties.db
## port 4000 after stop (process stopped by pid with taskkill)
free
```

`08-port-in-use-proof.txt`: a second instance on the taken port logged one `error` line (`EADDRINUSE`, "HTTP server error") and exited with code 1.

**Not proven:** the `SIGINT`/`SIGTERM` shutdown path was never exercised. On Windows, stopping a Node process by pid ends it without running the handler. It needs a Linux run or a manual Ctrl+C.

## Review

One round with `grok-4.7` (`context=256k`, `reasoning_effort=high`, `fast=false`) through `c:/tmp/covertree-tools/grok-review.mjs`. Agent `bc-7e98a2b1-4478-4bc6-a600-b59e9696a4d2`, run `run-4ff9054e-0f6b-4949-8a27-9b2cde8b6b52`, finished in 1412 s. Verdict: CHANGES REQUESTED, two findings. Neither was fixed in code, so there was no round 2. Prompt: `07-review-prompt-round1.md`. Raw reply: `07-review-reply-round1.md`. Reply with outcomes: `docs/agent/reviews/api-grok.md`.

- **R1 [MAJOR], not fixed, your decision.** The list predicate `(:city IS NULL OR city = :city) AND ...` never uses the three indexes. I measured it: `EXPLAIN QUERY PLAN` gives `SCAN property` for the plan's form and `SEARCH property USING INDEX property_city (city=?)` for `WHERE city = :city`. Results are correct either way. The predicate is prescribed word for word by `docs/plan.md` section 6, so I left it. Your options are to change the plan and have the repository compose the WHERE clause from fixed fragments (one more worker round), or to list the unused indexes as a known limit.
- **R2 [MINOR], not fixed by a test.** `main.ts` has no automated test for the configuration failure, the port-in-use path or the signal path. The brief says no test may need `main.ts`. The first two are proven by hand in the files above; the signal path is unproven. A test that spawns `node src/main.ts` as a child process would cover it on Linux CI, if you want it.

## Deviations from the brief and my own readings

- **D1 Error construction.** `errors.ts` builds errors with `createGraphQLError` from `graphql-yoga`, not `new GraphQLError` from `graphql`. Under Vitest, `graphql` resolves to a second module copy (its `development` export condition), so Yoga's `instanceof` check fails and mapped errors were masked as `INTERNAL_SERVER_ERROR`. Plain Node behaved correctly in both forms. The root-cause fix belongs in `apps/api/vitest.config.ts`, which the manager owns. Because of this, `errors.test.ts` asserts the error name, not `instanceof`.
- **D2 Where translation happens.** A wrapper in `resolvers.ts` (`createResolvers(logger)`) translates errors, as plan section 4 rule 1 says. My prompt 03 had put it in Yoga's `maskedErrors`; the worker stopped on the conflict and prompt 04 replaced it. Yoga keeps default masking. `GraphQLContext` and the exported `resolvers` are unchanged.
- **D3 Yoga factory location.** It lives in `apps/api/src/graphql/yoga.ts`; `main.ts` no longer reads the SDL.
- **D4 Sort tie-break.** Descending is `created_at DESC, rowid DESC`, the exact reverse of ascending. This is my reading of AC-SORT-3.
- **D5 Configuration whitespace.** Blank values count as unset and all six values are trimmed.
- **D6 A test never seen red.** The AC-ERROR-5 test for a plain `Error` from the provider passed before the fix existed, because Yoga masked it anyway.
- **D7 Worker stops.** Rounds 03 and 04 each ended with the worker stopping on a real conflict. Their prompts and replies are in the record; the code of round 3 came from prompts 04 and 05.
- **D8 Orchestration I did myself.**
  - Created the worktree, ran `npm ci` and `npm run codegen`, and made every commit with explicit paths.
  - Converted the worker's UTF-16 outputs to UTF-8 and stripped ANSI codes.
  - Replaced the long dashes in one worker reply.
  - Created and deleted a temporary probe script, `apps/api/src/zz-probe.ts`, to diagnose D1. It was never committed.
  - Ran the start-up and port-in-use proofs and the `EXPLAIN` measurement.
  - Wrote no product or test code.

## Proposed criteria for `docs/SPEC.md`

- **AC-CONFIG-1**: given only the key, the five defaults apply; given all six, the values are returned trimmed, with numbers as numbers.
- **AC-CONFIG-2**: every missing or malformed variable is named in one error message.
- **AC-CONFIG-3**: the message contains no value from the environment; blank optional values fall back to the defaults.
- **AC-STORE-1**: given a `DATABASE_PATH` whose folder does not exist, when the API opens the database, then the folder and the file are created and stored properties survive closing and reopening.

The filter tests already carry your ids AC-FILTER-5, 6, 9 and 11.

## For the next wave

- **Real adapter.** `main.ts` constructs `WeatherstackProvider({ fetch, baseUrl, apiKey, timeoutMs, logger })`. On this branch the adapter is still the placeholder, so `createProperty` only works after the merge with `weather`.
- **Provider errors.** Anything from the provider other than `LocationNotFoundError` or `WeatherUnavailableError` is masked as `INTERNAL_SERVER_ERROR` and logged once at `error`. The `WeatherUnavailableError` reason is logged once at `warn` and never sent to the client.
- **Client messages.** `Invalid input.`, `Property not found.`, `Location not found.`, `Weather is unavailable.`, `Unexpected error.`. `fieldErrors` sits under `extensions`.
- **Stored weather of the wrong type.** A `WeatherData` field whose stored value has an unexpected type would come back as null with a masked error for that field. Nothing guards the stored shape beyond the adapter's own validation.
- **Dual `graphql` copy.** Under Vitest it will bite any later test that constructs `GraphQLError` from `graphql` directly (D1).
- **Verify order.** At this base, run `npm run codegen && npm run verify`.
~~~

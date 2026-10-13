# Worker prompt 01: slice `api`, round 1 (input rules and configuration, tests first)

You are the implementer of slice `api` of the CoverTree project. Working directory: the git worktree `c:/tmp/covertree-api`, branch `slice/api`. `node_modules` exists and `npm run codegen` has produced `apps/api/src/graphql/generated/resolvers-types.ts`. This is round 1 of 4. Later rounds build the database and repository, the service, the GraphQL layer and `main.ts`; do not start them.

## Read first, in full

1. `AGENTS.md`
2. `docs/plan.md`, sections 4, 5, 7 and 9
3. `docs/SPEC.md`, areas CREATE, FILTER and ERROR
4. `apps/api/src/property/property.ts`, `apps/api/src/property/property-input.ts`, `apps/api/src/config.ts`, `apps/api/src/graphql/generated/resolvers-types.ts` (read only)

Where this prompt and those files disagree, stop and say so in your final message instead of choosing.

## Hard rules

- Never open, read, print or copy any `.env` file. No network call of any kind.
- Files you may create or change in this round, and no others:
  - `apps/api/src/property/property-input.ts`
  - `apps/api/src/property/property-input.test.ts`
  - `apps/api/src/config.ts`
  - `apps/api/src/config.test.ts`
  - `docs/agent/slices/api/01-red-output.txt` and `docs/agent/slices/api/01-green-output.txt` (command output only)
- The exported signatures in `property-input.ts`, `config.ts` and `property.ts` do not change: `parseCreatePropertyInput(input: unknown): PropertyAddress`, `parsePropertyFilter(filter: unknown): PropertyFilter`, `loadConfig(env: NodeJS.ProcessEnv): Config`, the `Config` interface. You may add exports. If a signature is wrong or incomplete, stop and say so.
- No new dependency, no change to any `package.json`, no `npm install`.
- Do not run `git add`, `git commit` or any history command. The conductor commits.
- No `any`. No TypeScript enums. Imports of project files carry the `.ts` extension. No code comments unless the code reads as a mistake without one. No long dashes (U+2013, U+2014) in any file.
- Everything must pass `npx prettier --check`, `npm run lint` and `npm run typecheck`.

## Order of work (test first, binding)

1. Write both test files against the current skeleton, whose functions throw `not implemented`.
2. Run `npm run test --workspace=apps/api > docs/agent/slices/api/01-red-output.txt 2>&1` and check that every new test fails because the behaviour is missing, not because of a mistake in the test (a test that passes against the skeleton is wrong or pointless: fix or delete it).
3. Only then write the implementation.
4. Run `npm run test --workspace=apps/api > docs/agent/slices/api/01-green-output.txt 2>&1`, then `npx prettier --check apps/api`, `npm run lint` and `npm run typecheck`, and fix what they report.

## Part A: `apps/api/src/property/property-input.ts`

Zod 4 (`zod` is installed in `apps/api`). Two pure functions.

### `parseCreatePropertyInput(input: unknown): PropertyAddress`

- `street`: a string, trimmed, 1 to 200 characters after trimming.
- `city`: a string, trimmed, 1 to 100 characters after trimming.
- `state`: one of the 51 values of the GraphQL enum `UsState`. GraphQL already rejects an unknown state before the service runs, but this function takes `unknown`, so it checks too. Write the list once in this file as a `const` tuple and type it so that `npm run typecheck` fails if it drifts from the generated `UsState` type in either direction (a value missing or a value too many). Export the list.
- `zipCode`: a string matching `^\d{5}$`, not trimmed (a zip code with a surrounding space is invalid on create).
- The result holds the trimmed `street` and `city` and exactly the four keys.
- On failure it throws `InvalidInputError` (from `property.ts`) with exactly one `{ field, message }` per failing field, in the order `street`, `city`, `state`, `zipCode`. `field` is the GraphQL input field name. `message` is a short English sentence written by you for that rule (for example `Street must be between 1 and 200 characters.`, `Zip code must be exactly five digits.`), never Zod's default text and never the rejected value.
- An input that is not an object at all (null, a string, a number) throws `InvalidInputError` with one error for each of the four fields.

### `parsePropertyFilter(filter: unknown): PropertyFilter`

Semantics fixed by the manager:

- `filter` itself `null` or `undefined`: no restriction.
- `city` absent, `null`, empty or whitespace-only: no restriction. Otherwise the trimmed value.
- `zipCode` absent, `null`, empty or whitespace-only: no restriction. Otherwise it is trimmed, and a trimmed value that is not exactly five digits fails with `InvalidInputError` carrying `{ field: 'zipCode', message }`.
- `state` absent or `null`: no restriction. Otherwise it must be one of the 51 values, else `InvalidInputError` with `field: 'state'`.
- A `city` or `zipCode` that is present and not a string fails with an error for that field.
- The result always has the three keys `city`, `state` and `zipCode`, each holding the normalised value or `null` for "no restriction". There is no length rule for the city filter.

## Part B: `apps/api/src/config.ts`

`loadConfig(env)` parses the six variables of plan section 9 with Zod and returns `Config`.

| Variable | Rule | Default when unset |
|---|---|---|
| `WEATHERSTACK_API_KEY` | required, non-blank; returned as given, trimmed | none |
| `WEATHERSTACK_BASE_URL` | an absolute `http:` or `https:` URL | `https://api.weatherstack.com` |
| `WEATHER_TIMEOUT_MS` | digits only, an integer of at least 1 | `5000` |
| `PORT` | digits only, an integer from 1 to 65535 | `4000` |
| `DATABASE_PATH` | any non-blank string | `./data/properties.db` |
| `LOG_LEVEL` | one of `fatal`, `error`, `warn`, `info`, `debug`, `trace`, `silent` | `info` |

- A variable that is unset, empty or whitespace-only counts as unset: the default applies, and for the key that is an error. (`.env.example` ships `WEATHERSTACK_API_KEY=` empty, and Node's `--env-file` turns that into an empty string.)
- On failure it throws one error of an exported class `ConfigError` (extends `Error`, `name` set to `ConfigError`). Its message names every missing or malformed variable by its environment name with a short reason per variable (for example `WEATHERSTACK_API_KEY is required`, `PORT must be an integer from 1 to 65535`), all of them in one message, and contains no value from `env`: not the key, not a malformed value, not Zod's "received ..." text. The error carries no `cause` that holds a value either.
- `loadConfig` does not read `process.env` itself and does not exit the process: `main.ts` (a later round) calls it, prints the message and exits.

## Tests

Vitest. Each test name starts with a criterion id. Pure functions, no database, no network.

`property-input.test.ts`, ids from `docs/SPEC.md`:

- AC-CREATE-1: a valid input returns the four fields unchanged.
- AC-CREATE-2 and AC-CREATE-3: `street` and `city` come back trimmed.
- AC-CREATE-4: `street` empty, whitespace-only, and 201 characters fail with a `street` field error; 200 characters pass.
- AC-CREATE-5: the same for `city` with 100 and 101.
- AC-CREATE-6: `zipCode` with four digits, six digits, letters, a surrounding space, and empty all fail with a `zipCode` field error.
- AC-CREATE-7: a state outside the list fails with a `state` field error.
- AC-ERROR-1: several invalid fields at once give exactly one error per failing field, in the fixed order, each with a non-empty `message` that does not contain the rejected value; an input that is not an object gives four errors. Assert that the thrown value is an `InvalidInputError`.
- AC-FILTER-1: a city filter with surrounding whitespace comes back trimmed, its letter case unchanged (case is the database's job).
- AC-FILTER-3 and AC-FILTER-4: a valid state and a valid zip code come back as given; a zip code with surrounding whitespace comes back trimmed.
- AC-FILTER-5: `null`, `undefined` and `{}` as the whole filter, and for `city` and `zipCode` each of absent, `null`, `''` and `'   '`, and `state` absent or `null`, all give `null` for that key and do not throw.
- AC-FILTER-6: a zip filter of four digits, six digits or letters throws `InvalidInputError` with exactly one error, `field` `zipCode`.

`config.test.ts`. `docs/SPEC.md` has no criteria for configuration yet; use these proposed ids (the manager adds them to the file at merge):

- AC-CONFIG-1: with only the key set, the five defaults apply; with all six set, the given values are returned with numbers as numbers.
- AC-CONFIG-2: each variable, missing where required or malformed, is named in the message. Cover: the key unset, empty and whitespace-only; `WEATHERSTACK_BASE_URL` as `not a url` and as `ftp://example.test`; `WEATHER_TIMEOUT_MS` as `abc`, `0`, `-5` and `1.5`; `PORT` as `abc`, `0`, `70000` and `40.5`; `LOG_LEVEL` as `loud`. One more test with several broken at once asserts that all of their names are in the one message. Assert that the thrown value is a `ConfigError`.
- AC-CONFIG-3: with the key set to a marker string and another variable malformed with a second marker string, neither marker appears in the error's message, in `String(error)`, in `error.stack`, or in `JSON.stringify` of the error with its own property names. Also: empty or whitespace-only values of the five optional variables fall back to the defaults.

Use obviously fake values in tests (for example `marker-key-do-not-leak`), never anything that looks like a real key.

## Final message

List the files you changed, the test counts from the red and the green run, the commands you ran with their result, and anything you could not do or decided on your own.

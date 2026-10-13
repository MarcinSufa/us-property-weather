# Worker prompt 03: slice `api`, round 3 (GraphQL layer, error mapping, the zero-provider-calls proof, tests first)

You are the implementer of slice `api` of the CoverTree project. Working directory: the git worktree `c:/tmp/covertree-api`, branch `slice/api`. Rounds 1 and 2 are committed: input rules, configuration, the database, `PropertyRepository`, `PropertyService` and `FakeWeatherProvider`. This is round 3 of 4: the GraphQL layer. Round 4 rewrites `main.ts`; do not touch it now.

## Read first, in full

1. `AGENTS.md`
2. `docs/plan.md`, sections 4, 5, 7 and 11
3. `docs/SPEC.md`, all areas except the web criteria
4. `apps/api/schema.graphql`, `apps/api/src/graphql/resolvers.ts`, `apps/api/src/graphql/errors.ts`, `apps/api/src/main.ts` (how wave 0 built Yoga; read only), `apps/api/src/property/*.ts`, `apps/api/src/weather/weather-provider.ts`
5. The installed `graphql-yoga` 5 types in `node_modules/graphql-yoga` for `createYoga`, `createSchema` and the `maskedErrors` option, before you rely on any of them

Where this prompt and those files disagree, stop and say so in your final message instead of choosing.

## Hard rules

- Never open, read, print or copy any `.env` file. No network call, no listening port: tests call `yoga.fetch` in process.
- Files you may create or change in this round, and no others:
  - `apps/api/src/graphql/errors.ts`, `apps/api/src/graphql/errors.test.ts`
  - `apps/api/src/graphql/resolvers.ts` (only if needed; it must stay free of logic)
  - `apps/api/src/graphql/yoga.ts`, `apps/api/src/graphql/yoga.test.ts`
  - `apps/api/src/property/property-service.ts`, only for the temporary planted call of the proof below; at the end of the round `git diff -- apps/api/src/property/property-service.ts` must be empty
  - `docs/agent/slices/api/03-red-output.txt`, `docs/agent/slices/api/03-zero-provider-calls-red-output.txt`, `docs/agent/slices/api/03-green-output.txt` (command output only)
- Do not touch `apps/api/src/graphql/schema.contract.test.ts`, `apps/api/src/graphql/generated/**`, `apps/api/schema.graphql`, `apps/api/src/main.ts` or anything under `apps/api/src/weather/`.
- Fixed signatures: `toGraphQLError(error: unknown): GraphQLError`, the `GraphQLContext` interface and the exported `resolvers`. You may add exports. If one is wrong or incomplete, stop and say so.
- No new dependency, no change to any `package.json`, no `npm install`.
- Do not run `git add`, `git commit` or any history command. The conductor commits.
- No `any`. No TypeScript enums, no parameter properties. Imports of project files carry the `.ts` extension. No code comments unless the code reads as a mistake without one. No long dashes (U+2013, U+2014) in any file. No SQL text in any file of this round, tests included.
- No test imports `main.ts`.
- Everything must pass `npx prettier --check`, `npm run lint` and `npm run typecheck`.

## What to build

### `apps/api/src/graphql/errors.ts`

`toGraphQLError(error)` is a pure function with no logging:

| Thrown | `extensions.code` | Client message | Extra |
|---|---|---|---|
| `InvalidInputError` | `BAD_USER_INPUT` | `Invalid input.` | `extensions.fieldErrors`: the error's `fieldErrors`, each exactly `{ field, message }` |
| `PropertyNotFoundError` | `PROPERTY_NOT_FOUND` | `Property not found.` | |
| `LocationNotFoundError` | `LOCATION_NOT_FOUND` | `Location not found.` | |
| `WeatherUnavailableError` | `WEATHER_UNAVAILABLE` | `Weather is unavailable.` | the `reason` is not in the message and not in the extensions |
| anything else, including non-Error values | `INTERNAL_SERVER_ERROR` | `Unexpected error.` | no stack, no original message, no `originalError` |

The returned `GraphQLError` never carries the original error object (no `originalError`), so nothing downstream can serialise its stack or its fields.

### `apps/api/src/graphql/yoga.ts`

One exported function that builds the Yoga instance from the service and the logger, so that tests need no port and `main.ts` (round 4) only wires it to `node:http`:

```ts
export interface PropertyYogaOptions {
  propertyService: PropertyService;
  logger: Logger; // from pino
}
export function createPropertyYoga(options: PropertyYogaOptions) // returns the Yoga server instance
```

- It reads `apps/api/schema.graphql` relative to `import.meta.url` (as `main.ts` does today), builds the schema with `createSchema` and the exported `resolvers`, and puts `{ propertyService }` into the context.
- Error translation happens in one place for all four operations, not in each resolver: use Yoga's `maskedErrors` option with your own `maskError` function (check the exact type in the installed package). Its rules:
  - An error that GraphQL itself raised (a syntax error, a validation error, a bad variable or an unknown enum value: a `GraphQLError` with no `originalError`) passes through unchanged.
  - An error thrown inside a resolver arrives wrapped; take its original error and return `toGraphQLError(original)`, keeping the `path` and locations of the wrapped error when Yoga gives them to you.
  - Never fall back to Yoga's default masking function: in development mode it adds the original message and the stack to the response. The response must be the same whatever `NODE_ENV` says.
- Logging, through the given pino logger, done here and nowhere else:
  - `WeatherUnavailableError`: one line at level `warn` with the `reason` as a field. This is the only place the reason goes.
  - anything unexpected (the `INTERNAL_SERVER_ERROR` case): one line at level `error` with the error under the key `err`, so pino serialises its message and stack into the log.
  - the other three domain errors are expected outcomes and are not logged.
- Pass `logging: false` to Yoga so that it does not write to the console on its own. Keep Yoga's defaults for the endpoint (`/graphql`), GraphiQL and the health check.
- Resolvers stay as they are unless something forces a change: they hold no logic and no `try`.

## Tests

Vitest. Real SQLite in `:memory:` through `openDatabase(':memory:')`, the real `PropertyRepository` and `PropertyService`, the `FakeWeatherProvider`, a pino logger that writes into an array the test can read (pino accepts a destination object with a `write(chunk: string)` method). Requests go through `yoga.fetch('http://localhost/graphql', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ query, variables }) })`. One small helper in the test file for that call is fine. Each test name starts with its criterion id.

`graphql/errors.test.ts`: one test per row of the table above (AC-ERROR-1, AC-ERROR-2, AC-ERROR-3, AC-ERROR-4, AC-ERROR-5). For AC-ERROR-4 the reason is a marker string and `JSON.stringify(result.toJSON())` does not contain it. For AC-ERROR-5 the input is an `Error` with a marker message, and separately a thrown string; the marker is absent from the serialised result and `originalError` is undefined.

`graphql/yoga.test.ts`:

- AC-CREATE-1: `createProperty` with a full selection (`id street city state zipCode lat long createdAt weatherData { observation_time temperature weather_descriptions }`) returns the stored fields, the fake provider's coordinates and weather values.
- AC-CREATE-2 and AC-CREATE-3: street and city come back trimmed.
- AC-CREATE-4, AC-CREATE-5, AC-CREATE-6 and AC-ERROR-1: an invalid street, city and zip code in one request give one error with `extensions.code` `BAD_USER_INPUT` and `extensions.fieldErrors` equal to three `{ field, message }` objects in the order street, city, zipCode; the provider has zero calls; the list is empty afterwards.
- AC-CREATE-7: a state outside the enum (sent as a variable, and again written inline in the document) is rejected by GraphQL itself: the response has errors and no created property, the provider has zero calls, the list is empty, and no error has the code `INTERNAL_SERVER_ERROR`.
- AC-CREATE-16: after a create, the row read through the repository holds the whole `current` object of the fake provider, including the keys GraphQL does not expose.
- AC-LIST-1: `{ properties { id } }` on an empty database is `[]`; after two creates it holds both.
- AC-SORT-1 and AC-SORT-2: no sort argument gives newest first; `CREATED_AT_ASC` gives oldest first; `CREATED_AT_DESC` equals the default.
- AC-FILTER-1 to AC-FILTER-4: through GraphQL, a city filter in another letter case with surrounding spaces, a state filter, a zip filter, and all three together, each return the expected ids; a partial city name returns nothing.
- AC-FILTER-5: `filter: { city: "", zipCode: "   " }`, `filter: {}`, `filter: null` and no filter argument each return the full list.
- AC-FILTER-6 and AC-ERROR-1: `filter: { zipCode: "1234" }` gives `BAD_USER_INPUT` with one field error for `zipCode`.
- AC-DETAIL-1 and AC-DETAIL-2: `property(id)` returns the stored property with its weather; an unknown id gives `data.property` `null` and no errors.
- AC-DELETE-1: `deleteProperty` returns the deleted property; `property(id)` is `null` afterwards.
- AC-DELETE-2 and AC-ERROR-2: `deleteProperty` with an unknown id gives `PROPERTY_NOT_FOUND`.
- AC-ERROR-3 and AC-WEATHER-11: the provider rejects with `LocationNotFoundError`: code `LOCATION_NOT_FOUND`, the list is empty afterwards, the provider was called exactly once (AC-WEATHER-10).
- AC-ERROR-4 and AC-WEATHER-11: the provider rejects with `new WeatherUnavailableError('marker-reason-do-not-leak')`: code `WEATHER_UNAVAILABLE`, the list is empty afterwards, the marker is nowhere in the response body text, and exactly one captured log line has level `warn` (pino level 40) and contains the marker.
- AC-ERROR-5: a repository whose `list` throws `new Error('marker-internal-do-not-leak')` (a subclass of `PropertyRepository` that overrides `list` is fine): the response has one error with code `INTERNAL_SERVER_ERROR`, the response body text contains neither the marker nor the word `stack` nor a file path of this repository, and one captured log line at level `error` (50) contains the marker. Run the same assertion a second time with `NODE_ENV` set to `development` through `vi.stubEnv` (restore it afterwards) before the Yoga instance is built: the response is identical.
- AC-WEATHER-9, the zero-provider-calls proof, as its own `describe` block: on a database that already holds one property created through the mutation (provider calls: exactly 1 after it), the operations `properties` (once without and once with a filter and a sort), `property` (a known id and an unknown one) and `deleteProperty` (a known id and an unknown one) leave the fake provider's call count at exactly 1. A second test: a fresh instance, one `createProperty`, call count exactly 1.

## Order of work (test first, binding)

1. Write both test files against the current skeleton (`toGraphQLError` throws `not implemented`, `yoga.ts` does not export a working factory yet; a stub export that throws `not implemented` is allowed so that the test file compiles).
2. Run the API tests and save the output as `docs/agent/slices/api/03-red-output.txt`. Every new test must fail because the behaviour is missing.
3. Write the implementation until all API tests pass.
4. The proof of plan section 4 rule 6, seen red: add one deliberate, temporary call to `this.weatherProvider.getCurrentWeather(...)` inside `PropertyService.list` (any valid address literal, result ignored). Run the API tests and save the output as `docs/agent/slices/api/03-zero-provider-calls-red-output.txt`. The AC-WEATHER-9 list test must fail on the call count (expected 1, received more), and you say in your final message which tests failed. Then remove the planted call completely, so that `git diff -- apps/api/src/property/property-service.ts` is empty.
5. Run the API tests into `docs/agent/slices/api/03-green-output.txt`, then `npx prettier --check apps/api`, `npm run lint` and `npm run typecheck`, and fix what they report.

## Final message

List the files you changed, the test counts of the three runs, which tests failed in the planted run and with what message, the commands you ran with their result, how Yoga's `maskedErrors` behaved compared with what this prompt assumed, and anything you could not do or decided on your own.

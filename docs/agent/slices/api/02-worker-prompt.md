# Worker prompt 02: slice `api`, round 2 (database, repository, service, tests first)

You are the implementer of slice `api` of the CoverTree project. Working directory: the git worktree `c:/tmp/covertree-api`, branch `slice/api`. Round 1 (input rules in `property-input.ts`, configuration in `config.ts`) is committed. This is round 2 of 4: the database, the repository and the service. Round 3 builds the GraphQL layer and round 4 `main.ts`; do not start them.

## Read first, in full

1. `AGENTS.md`
2. `docs/plan.md`, sections 4, 6 and 7
3. `docs/SPEC.md`, areas CREATE, LIST, FILTER, SORT, DETAIL, DELETE and WEATHER
4. `apps/api/src/property/property.ts`, `property-input.ts`, `property-repository.ts`, `property-service.ts`, `apps/api/src/db/database.ts`, `apps/api/src/weather/weather-provider.ts`

Where this prompt and those files disagree, stop and say so in your final message instead of choosing.

## Hard rules

- Never open, read, print or copy any `.env` file. No network call of any kind.
- Files you may create or change in this round, and no others:
  - `apps/api/src/db/database.ts`, `apps/api/src/db/database.test.ts`
  - `apps/api/src/property/property-repository.ts`, `apps/api/src/property/property-repository.test.ts`
  - `apps/api/src/property/property-service.ts`, `apps/api/src/property/property-service.test.ts`
  - `apps/api/src/property/fake-weather-provider.ts` (the test double, reused by round 3)
  - `docs/agent/slices/api/02-red-output.txt` and `docs/agent/slices/api/02-green-output.txt` (command output only)
- Nothing under `apps/api/src/weather/` changes: another slice is writing there right now. Import the `WeatherProvider` interface, `WeatherReport`, `LocationNotFoundError` and `WeatherUnavailableError` from `weather-provider.ts` and nothing else from that folder.
- Exported signatures do not change: `openDatabase(path: string): DatabaseSync`; `PropertyRepository` with `constructor(database: DatabaseSync)`, `insert(row: NewProperty): Property`, `findById(id: string): Property | null`, `list(filter: PropertyFilter, sort: PropertySort): Property[]`, `deleteById(id: string): Property | null`; `PropertyService` with `constructor(dependencies: PropertyServiceDependencies)`, `create(input: unknown): Promise<Property>`, `list(filter: unknown, sort: PropertySort): Property[]`, `get(id: string): Property | null`, `delete(id: string): Property`. If one is wrong or incomplete, stop and say so.
- No new dependency, no change to any `package.json`, no `npm install`. SQLite is the built-in `node:sqlite`.
- Do not run `git add`, `git commit` or any history command. The conductor commits.
- No `any`. No TypeScript enums, no parameter properties (`erasableSyntaxOnly`). Imports of project files carry the `.ts` extension. No code comments unless the code reads as a mistake without one. No long dashes (U+2013, U+2014) in any file.
- SQL lives in exactly two files: the `CREATE` statements in `db/database.ts`, everything else in `property/property-repository.ts`. No SQL text in the service and none in any test file: tests reach the database only through `openDatabase` and `PropertyRepository`. A later search of `apps/api/src` for SQL keywords outside those two files must find nothing.
- Everything must pass `npx prettier --check`, `npm run lint` and `npm run typecheck`.

## Order of work (test first, binding)

1. Write the three test files and the fake provider against the current skeleton, whose bodies throw `not implemented`.
2. Run the API tests and save the output as `docs/agent/slices/api/02-red-output.txt` (UTF-8 if you can). Every new test must fail because the behaviour is missing, not because of a mistake in the test.
3. Only then write the implementation.
4. Run the API tests again into `docs/agent/slices/api/02-green-output.txt`, then `npx prettier --check apps/api`, `npm run lint` and `npm run typecheck`, and fix what they report.

## Part A: `apps/api/src/db/database.ts`

`openDatabase(path)`:

- `:memory:` opens an in-memory database. Any other path is a file: create its parent folder first (recursively) when it does not exist, then open it.
- Then run the statements of plan section 6, character for character, with `CREATE TABLE IF NOT EXISTS` and the three `CREATE INDEX IF NOT EXISTS`. Copy them from the plan, including the column alignment; do not add a pragma, a column, an index or a migration.
- Opening the same file twice in a row must work (the statements are idempotent).

## Part B: `apps/api/src/property/property-repository.ts`

The only file with queries. Five prepared statements, prepared once in the constructor (the table exists by then, because `openDatabase` created it):

- insert with `RETURNING *`. `id` is `crypto.randomUUID()`, generated here. `created_at` is not in the insert: the column default sets it. `weather_data` is `JSON.stringify` of the whole `weatherData` object.
- select by id.
- delete by id with `RETURNING *`: the deleted row, or `null` when nothing matched, from one statement.
- the list in two variants, because a sort direction cannot be a bound parameter:
  - `CREATED_AT_ASC`: `ORDER BY created_at ASC, rowid ASC`
  - `CREATED_AT_DESC`: `ORDER BY created_at DESC, rowid DESC`
  so the descending list is always the exact reverse of the ascending one, also for rows created in the same millisecond.
  Both carry the filter of plan section 6 as bound named parameters: `(:city IS NULL OR city = :city) AND (:state IS NULL OR state = :state) AND (:zipCode IS NULL OR zip_code = :zipCode)`. No string concatenation of values into SQL anywhere.
- `list` treats an absent or `null` filter key as "no restriction" and binds `null` for it. It does not trim and does not validate: that is the job of `parsePropertyFilter`, called by the service.
- The city comparison is case-insensitive through the column's `COLLATE NOCASE`; do not add `LOWER()` or `LIKE`.
- One private mapping function turns a row into the domain `Property`: `zip_code` to `zipCode`, `created_at` to `createdAt`, `weather_data` parsed back from JSON to an object. No `any`: narrow the row values that `node:sqlite` returns with type checks, and throw a plain `Error` naming the column (never its value) when a row does not have the expected shape.

## Part C: `apps/api/src/property/property-service.ts`

- The constructor keeps the two dependencies.
- `create(input)`: `parseCreatePropertyInput(input)`, then `weatherProvider.getCurrentWeather(address)` exactly once, then `repository.insert` with the address, the provider's `lat` and `long`, and the provider's whole `current` object as `weatherData`. Returns the inserted property. A validation failure throws `InvalidInputError` before the provider is called. A provider error propagates unchanged (same error object), is not retried, and nothing is stored.
- `list(filter, sort)`: `parsePropertyFilter(filter)`, then `repository.list`. Never touches the provider.
- `get(id)`: `repository.findById`. Never touches the provider.
- `delete(id)`: `repository.deleteById`; `null` becomes `throw new PropertyNotFoundError(id)`. Never touches the provider.
- No logging, no catching, no other rule.

## The fake provider, `apps/api/src/property/fake-weather-provider.ts`

A small class implementing `WeatherProvider` for tests: it counts calls (a public `calls` array of the addresses it received is enough), returns a configurable `WeatherReport`, and can be told to reject with a given error instead. Its default report must look like a real one: `lat` and `long` as finite numbers and a `current` object with scalar values, an array (`weather_descriptions`), nested objects (`astro`, `air_quality`) and at least one key that is not in the GraphQL `WeatherData` type, so that "stored whole" can be asserted.

## Tests

Vitest, real SQLite in `:memory:` (one fresh database per test), the fake provider. No port, no network, no mocking of `node:sqlite`. Each test name starts with its criterion id from `docs/SPEC.md`.

`db/database.test.ts`:

- AC-STORE-1 (proposed id, not in `docs/SPEC.md` yet: "Given a `DATABASE_PATH` whose folder does not exist, when the API opens the database, then the folder and the file are created and stored properties survive closing and reopening"): open a path two folders deep under a fresh directory from `fs.mkdtempSync(path.join(os.tmpdir(), ...))`, insert one property through `PropertyRepository`, close, open the same path again, find the property by id. Remove the temporary directory afterwards.
- AC-STORE-1: `:memory:` opens and a repository built on it lists zero properties.

`property/property-repository.test.ts`:

- AC-CREATE-1: `insert` returns the address fields, the coordinates, a UUID `id` and a `createdAt`; two inserts get different ids.
- AC-CREATE-16: the `weatherData` read back with `findById` deep-equals the object given, including the nested objects, the array and the key unknown to GraphQL.
- AC-CREATE-17: `createdAt` matches `^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$` and lies within a few seconds of the test's own clock.
- AC-DETAIL-1 and AC-DETAIL-2: `findById` returns the stored property; an unknown id gives `null`.
- AC-DELETE-1: `deleteById` returns the deleted property and it is gone afterwards; an unknown id gives `null` and deletes nothing.
- AC-FILTER-1 to AC-FILTER-4, on a fixed set of at least five properties that differ in city, state and zip code (two share a city name in different states, one stored city is in mixed case): every one of the eight combinations of the three filters being set or `null` is asserted against the expected ids (a table-driven test is fine); a city filter in another letter case matches; a city filter that is only part of a stored name matches nothing; state and zip code match exactly.
- AC-SORT-1 and AC-SORT-2: ascending returns insertion order, descending the reverse.
- AC-SORT-3: insert 200 properties in a tight loop, assert that at least two of them share a `createdAt` value (otherwise the test proves nothing), then assert that ascending is exactly the insertion order and descending exactly its reverse.
- AC-FILTER-1: a filter value containing SQL metacharacters (for example `x' OR '1'='1`) matches nothing and the table still holds its rows: the filter is a bound parameter.

`property/property-service.test.ts`:

- AC-CREATE-1 and AC-WEATHER-1: `create` with a valid input calls the provider exactly once with the validated address (trimmed street and city) and returns a property with the provider's `lat`, `long` and whole `current` object.
- AC-CREATE-2 and AC-CREATE-3: the stored street and city are the trimmed ones.
- AC-CREATE-4, AC-CREATE-5 and AC-CREATE-6: an invalid input rejects with `InvalidInputError`, the provider has zero calls and nothing is stored.
- AC-WEATHER-10 and AC-WEATHER-11: when the provider rejects with `LocationNotFoundError`, and again with `WeatherUnavailableError`, `create` rejects with that same error object, the provider has exactly one call, and the list is empty.
- AC-WEATHER-9: after one `create`, calls to `list`, `get` and `delete` leave the provider's call count at one.
- AC-LIST-1, AC-SORT-1: `list(undefined, 'CREATED_AT_DESC')` returns everything, newest first.
- AC-FILTER-1 and AC-FILTER-5: the service trims the city filter and treats blank `city` and `zipCode` as no restriction (the list is the full list).
- AC-FILTER-6: `list` with a zip filter of four digits throws `InvalidInputError` with a `zipCode` field error.
- AC-DETAIL-2: `get` of an unknown id is `null`.
- AC-DELETE-1 and AC-DELETE-2: `delete` returns the deleted property; `delete` of an unknown id throws `PropertyNotFoundError` carrying the id.

## Final message

List the files you changed, the test counts from the red and the green run, the commands you ran with their result, and anything you could not do or decided on your own.

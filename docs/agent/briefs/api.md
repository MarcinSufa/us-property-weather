# Brief: slice `api`, validation, storage, service, resolvers, start-up

Wave 1. Conductor rules: `docs/agent/handoffs/wave-1.md`. Binding design: `docs/plan.md` sections 4 to 7, 9 and 11. This brief adds only what the plan leaves open.

## Owns

`apps/api/src/property/**`, `apps/api/src/db/**`, `apps/api/src/graphql/**`, `apps/api/src/main.ts`, `apps/api/src/config.ts`. Not `apps/api/src/weather/**`: this slice imports the `WeatherProvider` interface and its two error classes and tests against a fake provider. `main.ts` constructs the real `WeatherstackProvider`, whose body another slice is writing.

## What to build

1. `property/property-input.ts`: the Zod rules of plan section 7 for the create input and for the filter. `street` and `city` trimmed, 1 to 200 and 1 to 100 characters; `zipCode` `^\d{5}$`. In the filter, `city` and `zipCode` are trimmed, an empty or blank value means no filter, and a zip code that is not five digits is an error. A failure becomes `InvalidInputError` with one `{ field, message }` per failing field, `field` being the GraphQL input field name.
2. `db/database.ts`: opens the file at `DATABASE_PATH` (creating its folder), or `:memory:`, and runs the `CREATE TABLE` and the three `CREATE INDEX` statements of plan section 6, character for character.
3. `property/property-repository.ts`: the only file with SQL. Prepared statements per plan section 6: insert with `RETURNING *`, select by id, delete with `RETURNING *`, and the list in two variants ordered by `created_at` then `rowid`. Filters are bound parameters. `id` is `crypto.randomUUID()`. Rows are mapped to the domain type here; `weather_data` is parsed back from JSON here.
4. `property/property-service.ts`: `create` validates, calls the provider once, inserts; a provider error propagates and nothing is stored. `list`, `get` and `delete` never touch the provider. `delete` of an unknown id throws `PropertyNotFoundError`.
5. `graphql/errors.ts` and `graphql/resolvers.ts`: resolvers hold no logic. The four domain errors become GraphQL errors with `extensions.code` per the table in plan section 7; `BAD_USER_INPUT` carries `extensions.fieldErrors`. The `reason` of a weather error goes to the log and never to the client. Anything else stays masked by Yoga.
6. The Yoga instance is built by a function that takes the service and the logger, so tests call `yoga.fetch` without a port. If wave 0 built it inside `main.ts`, move it into `graphql/`. Importing `main.ts` must not be needed by any test.
7. `config.ts`: the six variables of plan section 9 parsed with Zod. A missing or malformed value stops the process with a message that names the variable and never shows a value.
8. `main.ts`: the composition root of plan section 4, rule 5. On `SIGINT` and `SIGTERM` it stops accepting requests, closes the server and the database, and exits.

## Tests (first)

Vitest, real SQLite in `:memory:`, a fake `WeatherProvider` that counts its calls. No port, no network, no real key. Each test name starts with its criterion id from `docs/SPEC.md`.

- Input rules as pure functions: valid input, each invalid field, trimming, several invalid fields at once, blank filter values, an invalid zip filter.
- Service and repository: create stores the provider's coordinates and the whole `current` object; list with every combination of the three filters; city compared without regard to case; both sort orders, including two rows created in the same millisecond; get; delete; delete of an unknown id.
- GraphQL through `yoga.fetch`: the six stories; each error code; `fieldErrors`; a failed weather call (both error classes) leaves the table empty; an unexpected error from the repository reaches the client as `INTERNAL_SERVER_ERROR` with no stack trace and no message of the original error; an unknown state is rejected by GraphQL itself; `property` with an unknown id is null.
- The zero-provider-calls proof, plan section 4 rule 6: `properties`, `property` and `deleteProperty` make zero provider calls, `createProperty` makes exactly one. Seen red first against a list path that deliberately calls the provider; then the call is removed. The red output is saved under that name in the slice record.
- Config: each missing or malformed variable is named in the message, and a marker value given for the key appears nowhere in the message.

## Done when

- `npm run verify` green in the worktree; red and green output in `docs/agent/slices/api/`.
- The API starts in the worktree with a placeholder key given on the command line (not the real one, no `.env`), a temporary `DATABASE_PATH`, and answers `{ properties { id } }` with an empty list on `http://localhost:4000/graphql`. Stopped afterwards; the output saved.
- The diff touches only the owned paths and the slice record. A search of `apps/api/src` for SQL keywords outside `property-repository.ts` and `db/database.ts` finds nothing; the search and its result are in the report.

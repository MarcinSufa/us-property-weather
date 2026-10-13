# Worker prompt 09: slice `api`, round 5 (the list query uses the indexes, `mapRow` helpers, one redundant trim)

You are the implementer of slice `api` of the CoverTree project. Working directory: the git worktree `c:/tmp/covertree-api`, branch `slice/api`. Rounds 1 to 4 are committed and reviewed. The reviewer found, and the conductor measured, that the list predicate `(:city IS NULL OR city = :city) AND ...` plans as `SCAN property`, so the three indexes are never used. The manager ruled: fix it. This ruling supersedes the predicate text in `docs/plan.md` section 6 (the manager changes the plan on another branch; do not edit it and do not stop because the plan still shows the old predicate).

## Read first, in full

1. `AGENTS.md`
2. `apps/api/src/property/property-repository.ts`, `apps/api/src/property/property-repository.test.ts`, `apps/api/src/db/database.ts` (read only), `apps/api/src/config.ts`

## Hard rules

- Never open, read, print or copy any `.env` file. No network, no port.
- Files you may change, and no others: `apps/api/src/property/property-repository.ts`, `apps/api/src/property/property-repository.test.ts`, `apps/api/src/config.ts`, `docs/agent/slices/api/09-red-output.txt`, `docs/agent/slices/api/09-green-output.txt` (command output only).
- `apps/api/src/db/database.ts` does not change: the table and the indexes stay.
- The exported signatures of `PropertyRepository` do not change and nothing new is exported from the production file.
- No new dependency, no Zod in the repository. No git index or history command.
- No `any`, no TypeScript enums, no parameter properties. Imports of project files carry the `.ts` extension. No code comments unless the code reads as a mistake without one. No long dashes (U+2013, U+2014) in any file, your final message included.
- SQL lives only in `db/database.ts` and `property/property-repository.ts`. In the new test the only SQL text allowed is the literal prefix `EXPLAIN QUERY PLAN ` put in front of a statement that the repository itself prepared; the test writes no query of its own.
- Everything must pass `npx prettier --check apps/api`, `npm run lint` and `npm run typecheck`.

## Order of work (test first, binding)

### 1. The red test, in `property-repository.test.ts`

Proposed criterion id AC-STORE-2: "Given a filter on only the city, only the state or only the zip code, when the list is read, then the query is answered through the index of that column."

- Get the SQL that the repository really prepares without widening the production API: hand the repository a wrapper around the real `DatabaseSync` from `openDatabase(':memory:')` (a subclass, a `Proxy` or an object that delegates; typed without `any`) that records every string given to `prepare` and delegates to the real database.
- For each of the three cases (city only, state only, zip code only): call `list` with that filter, take the statement text that the call caused to be prepared or used for it, run `EXPLAIN QUERY PLAN ` plus that text on the real database with the same bound values, and assert that the `detail` of a plan row contains `SEARCH property USING INDEX property_city` (respectively `property_state`, `property_zip_code`) and that no plan row contains `SCAN property`.
- If the repository prepares its list statements in the constructor today, design the recorder so that the test works both against the current code (where it must fail with `SCAN property`) and against the new code. Make the assertion output show the plan detail it received, so that the red output names `SCAN property`.
- Run the API tests and save the output as `docs/agent/slices/api/09-red-output.txt`. The three new cases must fail on the plan, not on a mistake of the test. If Vitest cannot start in your sandbox (`spawn EPERM`), say so and continue; the conductor runs it.

### 2. The list query, in `property-repository.ts`

- The WHERE clause holds only the predicates whose filter value is set (not `null`, not absent): `city = :city`, `state = :state`, `zip_code = :zipCode`, joined by `AND`; with no filter set there is no WHERE clause.
- The statement is composed from fixed SQL fragments that are literals in this file. Every value stays a bound named parameter. No value and no caller string is ever concatenated into SQL: the only things that decide which fragments are used are whether each of the three filter values is set and which of the two sort values was given.
- The sort stays a choice between two fixed fragments: `ORDER BY created_at ASC, rowid ASC` and `ORDER BY created_at DESC, rowid DESC`.
- Bind only the parameters that the composed statement contains.
- Statements may be prepared per call or cached by filter shape and sort: choose whichever is less code.
- All existing tests stay green and unchanged: the eight filter combinations, the city in another letter case, a partial city matching nothing, both sort orders, the same-millisecond order, the SQL metacharacter test.

### 3. `mapRow`, same file

It repeats the same type check ten times. Reduce it with small private helpers in this file (one for a text column, one for a number column), with the same error messages (`Invalid property row column: <name>`), the same behaviour and no value in a message.

### 4. `config.ts`

In `loadConfig`, the line that reads the key calls `.trim()` on the result of `optionalValue`, which already trims. Drop that second `.trim()`. Nothing else changes there; the configuration tests stay green unchanged.

### 5. Finish

Run the API tests into `docs/agent/slices/api/09-green-output.txt`, then `npx prettier --check apps/api`, `npm run lint` and `npm run typecheck`, and fix what they report.

## Final message

List the files you changed, the test counts of the red and the green run, the plan detail lines seen in the red run and in the green run for each of the three cases, the commands you ran with their result, and anything you could not do or decided on your own.

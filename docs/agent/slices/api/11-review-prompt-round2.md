# Reviewer prompt: slice `api`, round 2

You reviewed the slice `api` of a property management app in round 1 (Node 24 running TypeScript directly, GraphQL Yoga 5, `node:sqlite`, Zod 4, pino, Vitest 5). The patch below is the fix alone: the diff since the commit you reviewed. `npm run verify` is green on the branch with 111 API tests.

## Your round 1 findings and their outcome

1. "[MAJOR] `apps/api/src/property/property-repository.ts:35` `listAscendingStatement` - Both list statements use `(:city IS NULL OR city = :city)` and the same shape for state and zip. SQLite plans that as `SCAN property`, so `property_city`, `property_state`, and `property_zip_code` are unused for every list, including a one-column filter. `WHERE city = :city` plans as `SEARCH property USING INDEX property_city`. `city = :city OR :city IS NULL` and `city = COALESCE(:city, city)` also scan. Keep only the predicates that are set, with bound parameters, in this file. A city-only `EXPLAIN QUERY PLAN` should show `SEARCH property USING INDEX property_city`."
   Outcome: fixed in this patch. The project owner changed the plan, which had prescribed the old predicate. `list` composes the WHERE clause from fixed fragments for the filters that are set; values stay bound named parameters; the sort is a choice between two fixed fragments. New tests (AC-STORE-2) take the statement the repository really prepares and assert its query plan for a city-only, a state-only and a zip-only filter. They were seen failing with `SCAN property` against the old predicate and now report `SEARCH property USING INDEX property_city (city=?)`, `property_state (state=?)` and `property_zip_code (zip_code=?)`.
2. "[MINOR] `apps/api/src/main.ts:shutdown` - No test runs this file, so a configuration failure that does not exit, an `EADDRINUSE` handler that leaves the process up, or a signal handler that skips `database.close()` still leaves `npm run verify` green. Cover those three paths."
   Outcome: not changed, by decision of the project owner. No test may need `main.ts`. The configuration failure (exit code 1, variable names only) and the port already in use (one error log line, exit code 1) were proven by hand and the outputs are in the record; the signal path is recorded as unproven on Windows.

## Also in this patch

- `mapRow` in the repository: ten repeated type checks replaced by two private helpers, same error messages.
- `config.ts`: a second `.trim()` on the key removed, because `optionalValue` already trims.

## What to review

1. Is finding 1 fixed completely: can any filter value or caller string reach the SQL text; are only the parameters of the composed statement bound; do the eight filter combinations and both sort orders still behave as before; is the statement prepared on every call a problem worth a finding at this scale.
2. Could the new tests pass with a wrong implementation, or fail for a reason other than the plan.
3. Did the `mapRow` change or the `config.ts` change alter behaviour.
4. Anything the fix broke.

## What not to report

Finding 2 again, the SDL, the table and its indexes, the signatures, the layering, style settled by Prettier and ESLint.

## Form of the answer

Start with one line: `VERDICT: APPROVE` or `VERDICT: CHANGES REQUESTED`.
Then a numbered list of findings, most severe first, each as:
`<n>. [BLOCKER|MAJOR|MINOR] <file>:<line or symbol> - <what is wrong> - <what to do>`
Only findings you can point at in the patch. No praise, no summary, no long dashes. If there is nothing to fix, say so in one line.

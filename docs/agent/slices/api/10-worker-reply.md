Updated only [property-repository.test.ts](/C:/tmp/covertree-api/apps/api/src/property/property-repository.test.ts): it asserts one statement was prepared during `list`, uses that statement, and no longer logs the query plan.

- API tests: passed, 111 tests across 8 files. Direct Vitest worked, so the wrapper was unnecessary.
- `npx prettier --check apps/api`: passed.
- `npm run lint`: passed.
- `npm run typecheck`: passed.
- The SQL text and `console.info` search found no matches. The only SQL prefix in the test is `EXPLAIN QUERY PLAN`.

Nothing else could not be done.
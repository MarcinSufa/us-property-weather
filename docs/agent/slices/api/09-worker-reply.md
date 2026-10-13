**Changed files**

- [property-repository.ts](/C:/tmp/covertree-api/apps/api/src/property/property-repository.ts): list queries now include only active filter predicates and bind only their values. Added private text and number column readers.
- [property-repository.test.ts](/C:/tmp/covertree-api/apps/api/src/property/property-repository.test.ts): added three index plan checks with plan details in the test output.
- [config.ts](/C:/tmp/covertree-api/apps/api/src/config.ts): removed the redundant API key trim.
- [09-red-output.txt](/C:/tmp/covertree-api/docs/agent/slices/api/09-red-output.txt) and [09-green-output.txt](/C:/tmp/covertree-api/docs/agent/slices/api/09-green-output.txt): saved test output.

**Test results**

- Red: 3 failed, 108 passed, 111 total. Each new case reported `SCAN property` and `USE TEMP B-TREE FOR ORDER BY`.
- Green: 111 passed across 8 files. The plan details were:
  - City: `SEARCH property USING INDEX property_city (city=?) | USE TEMP B-TREE FOR ORDER BY`
  - State: `SEARCH property USING INDEX property_state (state=?) | USE TEMP B-TREE FOR ORDER BY`
  - Zip code: `SEARCH property USING INDEX property_zip_code (zip_code=?) | USE TEMP B-TREE FOR ORDER BY`

**Commands**

- `npm test --workspace=apps/api` could not start Vitest because the sandbox returned `spawn EPERM`. I used the repository’s Vitest sandbox wrapper for both test runs.
- Wrapper red run: the three new plan assertions failed as expected.
- Wrapper green run with `--reporter=verbose`: passed, 111 tests.
- `npx prettier --check apps/api`: passed.
- `npm run lint`: passed.
- `npm run typecheck`: passed.

All changes stayed within the allowed files. No other blockers.
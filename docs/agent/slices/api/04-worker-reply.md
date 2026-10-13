I stopped at the prompt’s disagreement rule. The installed Yoga docs say resolver-thrown `GraphQLError`s are returned as-is, but the in-process tests show otherwise: Yoga returned `INTERNAL_SERVER_ERROR` for mapped domain errors. With `NODE_ENV=development`, it also exposed an `originalError` stack for the mapped error. I did not change Yoga’s default masking or add a workaround.

**Runs**

- Red run: 24 tests failed because the error mapper and Yoga factory were still stubs. Output is saved in [04-red-output.txt](/C:/tmp/covertree-api/docs/agent/slices/api/04-red-output.txt).
- Post-implementation API run: 93 passed, 6 failed. The failures were the invalid create input, invalid filter, unknown delete, missing location, unavailable weather, and development-mode internal-error cases. I removed this failed run from the green-output slot.
- Planted-call run: not run because of the masking mismatch. No planted provider call was added.

**Files changed**

- [errors.ts](/C:/tmp/covertree-api/apps/api/src/graphql/errors.ts)
- [resolvers.ts](/C:/tmp/covertree-api/apps/api/src/graphql/resolvers.ts)
- [yoga.ts](/C:/tmp/covertree-api/apps/api/src/graphql/yoga.ts)
- [errors.test.ts](/C:/tmp/covertree-api/apps/api/src/graphql/errors.test.ts)
- [yoga.test.ts](/C:/tmp/covertree-api/apps/api/src/graphql/yoga.test.ts)
- [04-red-output.txt](/C:/tmp/covertree-api/docs/agent/slices/api/04-red-output.txt)

I confirmed `git diff -- apps/api/src/property/property-service.ts` is empty. Prettier, lint, and typecheck were not run. The injected session context’s memory tools were unavailable.
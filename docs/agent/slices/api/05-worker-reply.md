Implemented the API slice and confirmed that the temporary `PropertyService.list` change is gone (`git diff -- apps/api/src/property/property-service.ts` is empty).

**Test runs**

- Pre-fix red run: **6 failed, 101 passed**. The failures were invalid create input, invalid zip filter, deleting an unknown id, missing weather location, weather unavailable, and the development-mode repository error.
- Planted-call proof: **4 failed, 103 passed**. `AC-WEATHER-9 leaves query and delete provider call count unchanged` expected 1 call and received 3. The service-level `AC-WEATHER-9` check and the `AC-ERROR-3` and `AC-ERROR-4` create-failure checks each expected 1 and received 2.
- Final API run: **107 passed** across 8 files.

The new provider-error test passed in the pre-fix run: Yoga already masked that resolver failure as `INTERNAL_SERVER_ERROR`, and its logging and storage assertions were satisfied. I left it unchanged rather than manufacturing a failure.

**Checks**

- `npx prettier --check apps/api` — passed
- `npm run lint` — passed
- `npm run typecheck` — passed

The `instanceof` mismatch was confirmed under Vitest: an error created through Yoga’s `createGraphQLError` did not pass `instanceof` against the directly imported `graphql` class. The installed `graphql` package also has a `development` export condition. Together, that supports the two-module-copy diagnosis. I updated the unit assertion to check the error name while retaining the requested `GraphQLError` return type.

**Files changed**

- [errors.ts](C:/tmp/covertree-api/apps/api/src/graphql/errors.ts)
- [errors.test.ts](C:/tmp/covertree-api/apps/api/src/graphql/errors.test.ts)
- [resolvers.ts](C:/tmp/covertree-api/apps/api/src/graphql/resolvers.ts)
- [yoga.ts](C:/tmp/covertree-api/apps/api/src/graphql/yoga.ts)
- [yoga.test.ts](C:/tmp/covertree-api/apps/api/src/graphql/yoga.test.ts)
- [fake-weather-provider.ts](C:/tmp/covertree-api/apps/api/src/property/fake-weather-provider.ts)
- [property-input.test.ts](C:/tmp/covertree-api/apps/api/src/property/property-input.test.ts)
- [property-service.test.ts](C:/tmp/covertree-api/apps/api/src/property/property-service.test.ts)
- [05-red-output.txt](C:/tmp/covertree-api/docs/agent/slices/api/05-red-output.txt)
- [04-zero-provider-calls-red-output.txt](C:/tmp/covertree-api/docs/agent/slices/api/04-zero-provider-calls-red-output.txt)
- [04-green-output.txt](C:/tmp/covertree-api/docs/agent/slices/api/04-green-output.txt)

I did not run a build or make a commit; neither was requested for this round.
Implemented the wave 0 reviewer script and API/web skeletons. The schema already had `deleteProperty` in this checkout, so it needed no change. The reviewer and web tests pass; the API contract test and full typecheck still fail on issues in the unchanged contract test and installed GraphQL API.

**Files changed**

- Root: [.gitattributes](/C:/tmp/covertree-wave0/.gitattributes), [.prettierignore](/C:/tmp/covertree-wave0/.prettierignore), [package.json](/C:/tmp/covertree-wave0/package.json), [scripts/grok-review.mjs](/C:/tmp/covertree-wave0/scripts/grok-review.mjs)
- API: [codegen.ts](/C:/tmp/covertree-wave0/apps/api/codegen.ts), [config.ts](/C:/tmp/covertree-wave0/apps/api/src/config.ts), [database.ts](/C:/tmp/covertree-wave0/apps/api/src/db/database.ts), [errors.ts](/C:/tmp/covertree-wave0/apps/api/src/graphql/errors.ts), [resolvers.ts](/C:/tmp/covertree-wave0/apps/api/src/graphql/resolvers.ts), [main.ts](/C:/tmp/covertree-wave0/apps/api/src/main.ts), [property.ts](/C:/tmp/covertree-wave0/apps/api/src/property/property.ts), [property-input.ts](/C:/tmp/covertree-wave0/apps/api/src/property/property-input.ts), [property-repository.ts](/C:/tmp/covertree-wave0/apps/api/src/property/property-repository.ts), [property-service.ts](/C:/tmp/covertree-wave0/apps/api/src/property/property-service.ts), [weather-provider.ts](/C:/tmp/covertree-wave0/apps/api/src/weather/weather-provider.ts), [weatherstack-provider.ts](/C:/tmp/covertree-wave0/apps/api/src/weather/weatherstack-provider.ts), [weatherstack-response.ts](/C:/tmp/covertree-wave0/apps/api/src/weather/weatherstack-response.ts)
- Web: [App.tsx](/C:/tmp/covertree-wave0/apps/web/src/App.tsx), [main.tsx](/C:/tmp/covertree-wave0/apps/web/src/main.tsx), [client.ts](/C:/tmp/covertree-wave0/apps/web/src/graphql/client.ts), [PropertyListPage.tsx](/C:/tmp/covertree-wave0/apps/web/src/pages/PropertyListPage.tsx), [NewPropertyPage.tsx](/C:/tmp/covertree-wave0/apps/web/src/pages/NewPropertyPage.tsx), [PropertyDetailPage.tsx](/C:/tmp/covertree-wave0/apps/web/src/pages/PropertyDetailPage.tsx), [us-states.ts](/C:/tmp/covertree-wave0/apps/web/src/us-states.ts)

**Checks run**

- `npm run format:check` - passed: “All matched files use Prettier code style!”
- `npm run lint` - passed.
- `npm run codegen` - passed for API and web.
- `npm run typecheck` - failed: `apps/api/src/graphql/schema.contract.test.ts(37,10): error TS2532: Object is possibly 'undefined'.`
- `npm run typecheck --workspace=apps/web` - passed.
- API contract test via the Vitest sandbox wrapper - 1 passed, 1 failed. The failure says the schema argument’s `defaultValue` is `undefined`, even though `apps/api/schema.graphql` contains `sort: PropertySort! = CREATED_AT_DESC`; its AST contains the default.
- Web route test via the Vitest sandbox wrapper - 1 file passed, 3 tests passed.
- Reviewer test via the Vitest sandbox wrapper - 1 file passed, 9 tests passed.
- `npm run build` - failed in Vite with `Error: spawn EPERM` while resolving the build config.

**Deviations and decisions**

- `apps/web/src/graphql/generated/graphql.ts` does not export `UsState` with the current client-preset output. `us-states.ts` imports the generated `UsState` from the API resolver types instead.
- Constructor signatures not specified in the prompt: `InvalidInputError(fieldErrors: FieldError[])`, `PropertyNotFoundError(id: string)`, `LocationNotFoundError()`, and `WeatherUnavailableError(reason: string)`.
- Codegen regenerated ignored generated artifacts. No tests or docs were edited; `.prettierignore` received the requested `docs/plan.md` entry.
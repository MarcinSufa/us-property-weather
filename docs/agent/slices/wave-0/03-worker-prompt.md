# Worker prompt 03: wave 0, round 3 (implementation: reviewer script, API skeleton, web skeleton)

You are the implementer of wave 0 of the CoverTree project. Working directory: the git worktree `c:/tmp/covertree-wave0`, branch `slice/wave-0`. Round 1 (manifests, configs, contract) and round 2 (three tests) are committed. `node_modules` is installed. The conductor ran the three tests and saved their red output: the contract test fails on the renamed mutation, the other two fail because the module under test does not exist. In this round you make them green and build the skeleton of both apps.

## Read first, in full

1. `docs/plan.md` (sections 3 to 9 and 11 to 15 bind this wave)
2. `docs/agent/briefs/wave-0.md` (items 3, 4 and 6 of "What to build" are this round)
3. `docs/agent/manager-state.md`, section "Environment facts"
4. The three tests: `apps/api/src/graphql/schema.contract.test.ts`, `scripts/grok-review.test.mjs`, `apps/web/src/App.test.tsx`
5. The generated types, to import from: `apps/api/src/graphql/generated/resolvers-types.ts`, `apps/web/src/graphql/generated/graphql.ts`

Where this prompt and those files disagree, or a signature in the brief cannot be written as given, stop and say so in your final message instead of choosing.

## Hard rules

- Never open, read, print or copy `.env`. No network call. No real call to the Cursor API or to Weatherstack.
- Do not change the three tests to make them pass. If a test is wrong, say so in the final message and leave it.
- Add no dependency, change no version, do not run `npm install`. If something is missing, name it in the final message.
- Do not run `git add`, `git commit` or any history command. The conductor commits.
- Touch nothing under `docs/`. No `AGENTS.md`, `CLAUDE.md`, `docs/SPEC.md`, `README.md` in this round.
- This wave writes signatures, not behaviour. A body the brief does not ask for throws `new Error('not implemented')`. Do not implement validation rules, SQL, the Weatherstack call, config parsing or error mapping: five later slices own those.
- `erasableSyntaxOnly` is on: no enums, no parameter properties, no namespaces. Error classes are plain classes that extend `Error`, with fields declared on the class and assigned in the constructor body, and `name` set.
- Imports of project files carry the extension (`.ts`, `.tsx`). Type-only imports use `import type`.
- No `any`. No code comments unless the code reads as a mistake without one. No long dashes (U+2013, U+2014) in any file.

## A. Fixes to round 1, found by the conductor

1. Restore the mutation name `deleteProperty` in `apps/api/schema.graphql`. After that the file must again equal the fenced `graphql` block of plan section 5 character for character.
2. `npm run format:check` fails on two files. `package.json`: format it the way Prettier wants (the `workspaces` array). `docs/plan.md` belongs to the manager and must not be reformatted: add it to `.prettierignore`.
3. Add `.gitattributes` with `* text=auto eol=lf`. Reason: this machine checks out with `core.autocrlf=true`, Prettier's default is `lf`, so without it a fresh clone on Windows fails the format check.

## B. `scripts/grok-review.mjs`

Implement exactly the interface and behaviour that `scripts/grok-review.test.mjs` pins and that round 2's prompt (`docs/agent/slices/wave-0/02-worker-prompt.md`, section "Test 2") describes. In addition:

- One overall deadline of 300 seconds for the whole run (one `AbortSignal.timeout` passed to every `fetch`); hitting it is a failure with a non-zero exit code and a message that names the elapsed seconds.
- Read the event stream incrementally from `response.body` and stop reading at the `done` event.
- When the file is executed directly (`node scripts/grok-review.mjs ...`), call `main(process.argv.slice(2), { env: process.env, fetch, readFile, writeFile, log: console.log, now: Date.now })` and set `process.exitCode` from its result. Importing the file must not run anything.
- Nothing the script prints or writes may contain the key, the Authorization header value, or text from a thrown error or a response body that has not had both removed. On success print one line with the status, the elapsed seconds and the `--out` path.
- No dependency: Node 24 built-ins only.

## C. API skeleton, `apps/api/src/`

Names and shapes are the contract for five parallel slices, so follow the brief's item 3 exactly. Details the brief leaves open, decided here:

- `property/property.ts`: `PropertyAddress` (`street`, `city`, `state: UsState`, `zipCode`); `Property` (the address fields plus `id: string`, `lat: number`, `long: number`, `weatherData: Record<string, unknown>`, `createdAt: string`); `PropertyFilter` (`city?`, `state?: UsState`, `zipCode?`, each also allowing `null` because GraphQL sends `null` for an omitted input field); `PropertySort` (the generated union `'CREATED_AT_DESC' | 'CREATED_AT_ASC'`, re-exported from the generated type, not redeclared); `FieldError` (`field`, `message`); `InvalidInputError` (carries `fieldErrors: FieldError[]`); `PropertyNotFoundError` (carries `id: string`). `UsState` is imported from the generated file.
- `weather/weather-provider.ts`: `WeatherReport`, `interface WeatherProvider`, `LocationNotFoundError`, `WeatherUnavailableError` (carries `reason: string`), as in the brief.
- `weather/weatherstack-provider.ts`: `class WeatherstackProvider implements WeatherProvider`; export the options type `WeatherstackProviderOptions` (`fetch: typeof fetch`, `baseUrl: string`, `apiKey: string`, `timeoutMs: number`, `logger: Logger` with `Logger` imported as a type from `pino`). The constructor stores the options; `getCurrentWeather` throws not implemented.
- `weather/weatherstack-response.ts`: exported types `WeatherstackSuccessResponse` (`location: { lat: string; lon: string }`, `current: Record<string, unknown>`), `WeatherstackErrorResponse` (`success: false`, `error: { code: number; type: string }`), `WeatherstackResponse` (their union), and `parseWeatherstackResponse(body: unknown): WeatherstackResponse` throwing not implemented.
- `property/property-repository.ts`: `class PropertyRepository`, constructor takes the open database (`DatabaseSync` from `node:sqlite`, type import); export the row type `NewProperty` (the address fields, `lat`, `long`, `weatherData`); `insert(row: NewProperty): Property`, `findById(id: string): Property | null`, `list(filter: PropertyFilter, sort: PropertySort): Property[]`, `deleteById(id: string): Property | null`. All bodies throw not implemented.
- `property/property-service.ts`: `class PropertyService`, constructor takes `{ repository, weatherProvider }` (export the type as `PropertyServiceDependencies`); `create(input: unknown): Promise<Property>`, `list(filter: unknown, sort: PropertySort): Property[]`, `get(id: string): Property | null`, `delete(id: string): Property`. All bodies throw not implemented.
- `property/property-input.ts`: `parseCreatePropertyInput(input: unknown): PropertyAddress` and `parsePropertyFilter(filter: unknown): PropertyFilter`, both throwing not implemented.
- `db/database.ts`: `openDatabase(path: string): DatabaseSync`, throwing not implemented.
- `config.ts`: `interface Config` (`weatherstackApiKey`, `weatherstackBaseUrl`, `weatherTimeoutMs: number`, `port: number`, `databasePath`, `logLevel`) and `loadConfig(env: NodeJS.ProcessEnv): Config`, throwing not implemented.
- `graphql/errors.ts`: `toGraphQLError(error: unknown): GraphQLError`, throwing not implemented.
- `graphql/resolvers.ts`: export `interface GraphQLContext { propertyService: PropertyService }` and `resolvers`, typed with the generated `Resolvers<GraphQLContext>`. Each of the four resolvers only passes its arguments to the service; no logic. For the types to line up, the generated `Property` parent type must be the domain `Property`: add a `mappers` entry (and `contextType` if you prefer it over the generic) to `apps/api/codegen.ts`, keeping `enumsAsTypes`, `useTypeImports` and generated imports that carry the `.ts` extension. Run `npm run codegen` after changing it.
- `graphql/schema.ts` if you need one place that reads `schema.graphql` from disk (path from `import.meta.url`) and builds the Yoga schema with the resolvers; otherwise do it in `main.ts`.
- `main.ts`: enough for `npm run dev` to serve the schema with GraphiQL at `http://localhost:4000/graphql` on `node:http`: build the service from a `PropertyRepository`, a `WeatherstackProvider` and nothing that throws at start-up (so do not call `loadConfig` or `openDatabase` yet; pass placeholders and leave one short comment saying the `api` slice of wave 1 replaces this wiring), create Yoga, listen on `Number(process.env.PORT ?? 4000)`, log one line with the address through `pino`, close the server on `SIGINT` and `SIGTERM`. Operations answer with Yoga's masked error because the service throws not implemented; that is expected.

## D. Web skeleton, `apps/web/src/`

- `App.tsx`: named exports `routes` and `App`, as `apps/web/src/App.test.tsx` expects. Three routes: `/`, `/properties/new`, `/properties/:id`.
- `pages/PropertyListPage.tsx`, `pages/NewPropertyPage.tsx`, `pages/PropertyDetailPage.tsx`: placeholders, each one `<main>` with an `<h1>` (`Properties`, `New property`, `Property details`). Nothing else; the `web` slice of wave 1 replaces them.
- `graphql/client.ts`: the urql client for the URL `/graphql` with the default exchanges (document cache and fetch).
- `main.tsx`: mounts `App` inside the urql `Provider` in `StrictMode`.
- `us-states.ts`: `US_STATES`, the 50 states and DC as code to name, typed against the generated `UsState` so that a missing or extra code is a compile error (`satisfies Record<UsState, string>`), plus the ordered list of codes if a select needs it.
- No CSS file in this round.

## E. Check before you finish

Run what your sandbox allows and report each result honestly: `npm run format:check`, `npm run lint`, `npm run typecheck`, `npm run codegen`, the three test files (see round 2's note about the Vitest wrapper), `npm run build`. If a command cannot run in your sandbox (`spawn EPERM`, for example), say exactly that with the error line; do not work around a blocked binary. The conductor runs `npm run verify` and `npm run dev` outside the sandbox afterwards.

## Final message

List every file you created or changed, the result of each command you ran with its summary line or error, every place you could not follow this prompt or the brief and why, and every signature you had to decide beyond what is written here. Facts only. Do not claim a check you did not run.

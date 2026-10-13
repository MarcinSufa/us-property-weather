# Worker prompt 06: slice `api`, round 4 (the composition root `main.ts`, trimmed configuration values)

You are the implementer of slice `api` of the CoverTree project. Working directory: the git worktree `c:/tmp/covertree-api`, branch `slice/api`. Rounds 1 to 3 are committed: input rules, configuration, the database, the repository, the service, the error mapping, the resolver wrapper and the Yoga factory `createPropertyYoga`. This is the last round: `apps/api/src/main.ts` and one small gap in `config.ts`.

## Read first, in full

1. `AGENTS.md`
2. `docs/plan.md`, section 4 (rule 5 above all) and section 9
3. `apps/api/src/main.ts` (the wave 0 placeholder you replace), `apps/api/src/config.ts`, `apps/api/src/config.test.ts`, `apps/api/src/db/database.ts`, `apps/api/src/graphql/yoga.ts`, `apps/api/src/property/property-repository.ts`, `apps/api/src/property/property-service.ts`, `apps/api/src/weather/weatherstack-provider.ts` (read only: the constructor options)

Where this prompt and those files disagree, stop and say so in your final message instead of choosing.

## Hard rules

- Never open, read, print or copy any `.env` file. No network call. Do not start the server and do not bind a port: the conductor runs the start-up proof.
- Files you may create or change in this round, and no others: `apps/api/src/main.ts`, `apps/api/src/config.ts`, `apps/api/src/config.test.ts`, `docs/agent/slices/api/06-red-output.txt`, `docs/agent/slices/api/06-green-output.txt` (command output only).
- Nothing under `apps/api/src/weather/` changes. Exported signatures do not change (`loadConfig(env: NodeJS.ProcessEnv): Config`, the `Config` interface, `ConfigError`).
- No new dependency, no change to any `package.json`, no `npm install`. No git index or history command.
- No `any`, no `as unknown as`, no TypeScript enums. Imports of project files carry the `.ts` extension. No code comments unless the code reads as a mistake without one. No long dashes (U+2013, U+2014) in any file, your final message included. No SQL text.
- No test imports `main.ts`, and `main.ts` exports nothing.
- Everything must pass `npx prettier --check apps/api`, `npm run lint` and `npm run typecheck`.

## Part A: `config.ts`, surrounding whitespace (test first)

Today a blank value counts as unset, but a non-blank optional value is used untrimmed: `PORT=" 4000 "` is reported as malformed and a base URL or a database path with a surrounding space is returned with it. The rule becomes: every one of the six values is trimmed before it is checked and returned.

1. Add to `config.test.ts`, under the proposed id AC-CONFIG-1: with `WEATHERSTACK_BASE_URL`, `WEATHER_TIMEOUT_MS`, `PORT`, `DATABASE_PATH` and `LOG_LEVEL` each given with surrounding spaces, `loadConfig` returns the trimmed values (numbers as numbers).
2. Run the API tests and save the output as `docs/agent/slices/api/06-red-output.txt`. The new test must fail. If Vitest cannot start in your sandbox (`spawn EPERM`), say so; the conductor runs it.
3. Make it pass with the smallest change (the trim belongs in `optionalValue`, once).

## Part B: `apps/api/src/main.ts`, the composition root

The only file that knows every concrete class. In this order:

1. `loadConfig(process.env)`. When it throws a `ConfigError`: write its message (which names the variables and never a value) and a newline to `process.stderr`, set a non-zero exit code and stop, without a stack trace and before anything else is created. Any other error is rethrown.
2. A pino logger at `config.logLevel`.
3. `openDatabase(config.databasePath)`.
4. `new WeatherstackProvider({ fetch, baseUrl: config.weatherstackBaseUrl, apiKey: config.weatherstackApiKey, timeoutMs: config.weatherTimeoutMs, logger })`.
5. `new PropertyRepository(database)`, `new PropertyService({ repository, weatherProvider })`.
6. `createPropertyYoga({ propertyService, logger })` from `./graphql/yoga.ts`. `main.ts` no longer reads `schema.graphql` and no longer imports `createSchema`, `createYoga` or the resolvers.
7. A `node:http` server whose listener hands the request to Yoga, listening on `config.port`. After it listens, one `info` line with the port. Never log the configuration object, the key or the base URL with a query string.
8. A server `error` event (for example the port is already in use) is logged once at level `error` with the error under `err`, the database is closed and the process ends with a non-zero exit code.
9. Shutdown, on `SIGINT` and on `SIGTERM`, through one function that runs at most once: stop accepting requests with `server.close(...)`, also call `server.closeIdleConnections()` so that kept-alive sockets do not hold the process open, and in the close callback close the database, log one `info` line and let the process end with exit code 0 (set `process.exitCode`; call `process.exit` only if something would otherwise keep the process alive).

Keep it one flat file of plain statements with at most the one or two small functions that the steps above need. No class, no dependency container, no configuration beyond `loadConfig`.

## Then

Run the API tests into `docs/agent/slices/api/06-green-output.txt`, then `npx prettier --check apps/api`, `npm run lint` and `npm run typecheck`, and fix what they report.

## Final message

List the files you changed, the test counts of the red and the green run, the commands you ran with their result, and anything you could not do or decided on your own.

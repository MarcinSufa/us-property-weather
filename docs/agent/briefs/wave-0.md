# Brief: wave 0, foundation

Owner session: `wave 0`. Conductor works in this checkout; the worker works in worktree `c:/tmp/covertree-wave0` on branch `slice/wave-0` off `main`. Read `docs/plan.md` in full first: sections 3 to 9 and 11 to 15 bind this wave. This brief adds only what the plan leaves open. Where the two disagree, stop and ask the manager.

Wave 0 is serial: no other session touches the repository until it is merged. Its purpose is to create every file two later slices would otherwise both touch, so that five sessions can run in parallel afterwards.

## Owns

Everything outside `docs/agent/` and `docs/plan.md`. After this wave the root `package.json`, the workspace `package.json` files and `package-lock.json` belong to the manager.

## What to build

1. Workspace and gates
   - Root `package.json` with workspaces `apps/api`, `apps/web`, `e2e`; `engines.node` `>=24`; `.nvmrc`; scripts `dev`, `verify`, `e2e`, `codegen`, `format`, `lint`, `typecheck`, `test`.
   - `tsconfig.base.json` with `strict`, `noUncheckedIndexedAccess`, `erasableSyntaxOnly`, and whatever direct execution of `.ts` files needs (imports carry the `.ts` extension). TypeScript pinned to 6.0.
   - ESLint flat config with typescript-eslint type-checked rules, Prettier, Vitest configs for both apps.
   - Every dependency the plan names, installed now, for all three workspaces (section 3 and section 11), including the web test stack and `@playwright/test`. Playwright browsers are not downloaded in this wave.
   - `npm run verify` runs, in this order: format check, lint, typecheck, codegen, tests, web build.
2. Contract
   - `apps/api/schema.graphql`: the SDL of plan section 5, character for character.
   - `apps/api/codegen.ts` (resolver types) and `apps/web/codegen.ts` (typed documents). Generated files are not committed; `verify` regenerates them.
3. API skeleton, signatures only. Bodies throw `new Error('not implemented')` unless stated.
   - `property/property.ts`: `Property`, `PropertyAddress` (`street`, `city`, `state`, `zipCode`), `PropertyFilter`, `PropertySort`, `FieldError` (`field`, `message`), and the domain errors `InvalidInputError` (carries `fieldErrors`) and `PropertyNotFoundError`. `state` is typed from the generated `UsState`.
   - `weather/weather-provider.ts`: `WeatherReport` (`lat: number`, `long: number`, `current: Record<string, unknown>`), `interface WeatherProvider { getCurrentWeather(address: PropertyAddress): Promise<WeatherReport> }`, and the errors `LocationNotFoundError` and `WeatherUnavailableError` (carries a `reason` for the log, never a URL).
   - `weather/weatherstack-provider.ts`: `class WeatherstackProvider implements WeatherProvider`, constructor takes one options object: `fetch`, `baseUrl`, `apiKey`, `timeoutMs`, `logger`.
   - `property/property-repository.ts`: `class PropertyRepository`, constructor takes the open database; `insert(row)`, `findById(id)`, `list(filter, sort)`, `deleteById(id)`; the last three return a `Property`, `Property | null` or `Property[]` as fits.
   - `property/property-service.ts`: `class PropertyService`, constructor takes `{ repository, weatherProvider }`; `create(input): Promise<Property>`, `list(filter, sort): Property[]`, `get(id): Property | null`, `delete(id): Property`.
   - `property/property-input.ts`, `db/database.ts`, `config.ts`, `graphql/errors.ts`, `weather/weatherstack-response.ts`: exported names and types only.
   - `graphql/resolvers.ts` and `main.ts`: enough for `npm run dev` to serve the schema with GraphiQL on port 4000. Operations may fail with "not implemented".
   - Error classes are plain classes with fields assigned in the constructor body: `erasableSyntaxOnly` forbids parameter properties and enums.
4. Web skeleton: Vite, React, the router with the three routes of plan section 10 rendering placeholders, the urql client, the `/graphql` dev proxy, `us-states.ts` typed against the generated enum.
5. Agent rules and spec
   - `AGENTS.md` per plan section 13, `CLAUDE.md` containing the single line `@AGENTS.md`.
   - `docs/SPEC.md`: acceptance criteria in Given/When/Then form. Ids `AC-<AREA>-<n>` with areas `CREATE`, `LIST`, `FILTER`, `SORT`, `DETAIL`, `DELETE`, `WEATHER`, `ERROR`. Source: plan sections 5, 7, 8 and 10. Every row of the errors table and every rule of section 7 gets at least one criterion.
   - `.env.example` with the six variables of plan section 9 and no value for the key.
   - `git mv cover-tree.md docs/brief/cover-tree.md`.
6. `scripts/grok-review.mjs`, written first and used for this wave's own review
   - Arguments: `--model <id>` (required, no default), `--prompt <file>`, `--patch <file>`, `--out <file>`.
   - Route and request shape: `docs/agent/manager-state.md`, "Environment facts", and the trial in `docs/agent/reviews/grok-smoke.md`.
   - Reads `CURSOR_API_KEY` from the environment, never prints it, saves the raw reply and the elapsed seconds to `--out`, exits non-zero when the run does not reach `done`.

## Tests (first)

- Contract test: the SDL builds into a schema and exposes exactly the two queries and two mutations of section 5 with their argument types. Seen red by renaming one field, then restored.
- Reviewer script: the request body and headers are built from the arguments, a missing `--model` exits non-zero, and a marker key appears in nothing the script prints. Stub `fetch`, no network.
- Web: the three routes render their placeholders.

Red output goes into `docs/agent/slices/wave-0/`.

## Rules that bind the implementer

- No dependency beyond the plan. A package that installs with a peer warning, or a native binding that Windows application control blocks (Vite's bundler, for example), is reported to the manager, not forced and not swapped.
- No real Weatherstack call. No reading, printing or logging of `.env` values.
- No code comments unless the code reads as a mistake without one. No long dashes in any file.
- Commits: one per worker round, conventional messages, author from the repository's git config, no trailers, never `--no-verify`. No push, no merge.

## Reviewer

Grok at high reasoning through the Cursor v1 API, called with `scripts/grok-review.mjs` on the real diff of `slice/wave-0` against `main` written to a patch file. Check the model list first and pass the id explicitly. At most three rounds. Prompt and raw reply of each round go to `docs/agent/slices/wave-0/`, the verdict to `docs/agent/reviews/wave-0-grok.md`. Stop and report if one call runs far longer than the trial (34 seconds).

## Done when

- On `slice/wave-0`: `npm ci` then `npm run verify` green, output saved in the slice record.
- `npm run dev` starts both apps: GraphiQL at `http://localhost:4000/graphql` shows the schema, the web app at `http://localhost:5173` shows the three placeholder routes. Both processes stopped afterwards.
- `docs/agent/slices/wave-0/report.md` lists what was built, every deviation from this brief with its reason, installed versions, peer warnings, and review findings with their outcome.
- The branch is handed to the manager for `git merge --no-ff`.

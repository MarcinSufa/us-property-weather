# Repository rules

## What this is

This is a small full-stack application for keeping records of US properties. It stores a weather snapshot with each property when it is created. Weatherstack is called once, at creation, and never from a query.

## Commands

- Use Node.js 24.
- Run `npm install` to install the workspaces.
- Create `.env` from `.env.example` and set the required key locally.
- Run `npm run dev` to start the API at `http://localhost:4000/graphql` and the web app at `http://localhost:5173`.
- Run `npm run verify`: `npm run format:check`, `npm run codegen`, `npm run lint`, `npm run typecheck`, `npm test`, then `npm run build`.
- Run `npm run codegen` to generate GraphQL types and documents.
- Run `npm run e2e` to run the Playwright suite.
- Run `npm run format` to format the repository.

## Layout

- `apps/api/` contains the GraphQL contract, API source and tests.
- `apps/api/src/db/` opens and initializes SQLite.
- `apps/api/src/property/` contains property types, validation, service and repository.
- `apps/api/src/weather/` contains the provider interface, adapter and fixtures.
- `apps/api/src/graphql/` contains resolvers, error mapping and generated resolver types.
- `apps/web/` contains the React application, routes, components, tests and generated documents.
- `e2e/` contains Playwright configuration, a local weather stub and story tests.
- `scripts/` contains the reviewer and session-export scripts.
- `docs/brief/` contains the starting assignment.
- `docs/agent/` contains prompts, decisions, slice records, reviews, metrics and redacted sessions.
- `docs/` contains the plan and acceptance criteria.

## Architecture rules

- Keep resolvers free of business logic; pass arguments to the service and translate domain errors to GraphQL errors.
- Keep validation, weather retrieval and persistence rules in `PropertyService`, which depends on `WeatherProvider` and never on `fetch`.
- Put all SQL in `PropertyRepository`.
- Keep Weatherstack URL, query, response and error-code knowledge in `WeatherstackProvider`; inject `fetch`, base URL, key and timeout.
- Keep `main.ts` as the composition root, including startup and shutdown, without a dependency-injection container.
- Call the provider only from `PropertyService.create`; prove the queries and delete make zero provider calls and create makes exactly one.

## Coding standards

- Enforce TypeScript `strict`, `noUncheckedIndexedAccess` and `erasableSyntaxOnly`; do not use enums or parameter properties.
- Include `.ts` or `.tsx` on imports.
- Do not use `any`.
- Validate untrusted mutation input and Weatherstack responses with Zod at those two trust boundaries.
- Use `BAD_USER_INPUT`, `PROPERTY_NOT_FOUND`, `LOCATION_NOT_FOUND` and `WEATHER_UNAVAILABLE` for their specified cases; mask unexpected errors as `INTERNAL_SERVER_ERROR` without a stack trace.
- Keep hand-written SQL in the repository file.
- Add no comments unless code reads as a mistake without one.
- Add no dependency without the manager's approval.
- Never edit or commit generated code.
- Treat `apps/api/schema.graphql` as the contract; only the manager changes it.

## Tests

- Write each test first and show it failing before implementing the behavior.
- Start every test name with its acceptance-criterion id from `docs/SPEC.md`.
- Tests of tooling and of the skeleton that cover no criterion carry no acceptance-criterion id.
- Do not call real Weatherstack from tests, development loops or CI jobs.
- Use a stub `fetch` and a fake provider in API tests; use `msw` in web tests.

## Definition of done

- `npm run verify` passes.
- Tests cover the acceptance criteria touched by the change.
- No file outside the slice's ownership changed.
- The relevant record under `docs/agent/` is updated.

## Never

- Read, print, log or commit `.env` or a key value.
- Log or throw a URL containing the key.
- Call Weatherstack from anything except `PropertyService.create`.
- Push, merge or rebase; Marcin publishes.
- Use `--no-verify`.
- Add a layer, abstraction or dependency without a stated reason.

## Where the record lives

- `docs/plan.md` is the approved project plan.
- `docs/SPEC.md` is the acceptance-criteria source for tests.
- `docs/agent/` holds the project record: prompts, decisions log, manager state, briefs, handoffs, slice records, reviews, review log, session metrics and redacted transcripts.

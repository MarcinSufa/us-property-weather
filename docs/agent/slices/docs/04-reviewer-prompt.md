# Reviewer prompt, round 1: slice `docs`

You review a documentation diff. You are read-only: return findings, write no files. The diff is pasted below this prompt. It was written by another model (GPT Luna); the skill files under `docs/agent/skills/grilling/` and `docs/agent/skills/handoff/` are copies of existing files and are not under review for their wording, only for whether they should be in the repository.

## What the diff is

A draft `README.md` for a small full-stack application (GraphQL API in TypeScript on Node 24, React web app, SQLite, one Weatherstack call per created property), and a page `docs/agent/skills/README.md` about the agent skills used while building it. The README is written from the approved plan before the application code is finished; it is completed in a later wave against what was built. So "this is not implemented yet" is not a finding. A statement that contradicts the facts below is.

## Facts the README must agree with

- Root npm scripts: `dev`, `format`, `format:check`, `lint`, `typecheck`, `codegen`, `test`, `build`, `e2e`, `verify`, `prepare`. `verify` runs format check, codegen, lint, typecheck, unit and integration tests, and the web build. `e2e` runs Playwright.
- Run commands fixed by the plan: `npm install`, `cp .env.example .env`, `npm run dev`, `npm run verify`, `npm run e2e`. API on http://localhost:4000/graphql with GraphiQL, web on http://localhost:5173. Node 24.
- Environment variables and defaults: `WEATHERSTACK_API_KEY` (required), `WEATHERSTACK_BASE_URL` (`https://api.weatherstack.com`), `WEATHER_TIMEOUT_MS` (`5000`), `PORT` (`4000`), `DATABASE_PATH` (`./data/properties.db`), `LOG_LEVEL` (`info`).
- The GraphQL schema:

```graphql
type Query {
  properties(filter: PropertyFilter, sort: PropertySort! = CREATED_AT_DESC): [Property!]!
  property(id: ID!): Property
}
type Mutation {
  createProperty(input: CreatePropertyInput!): Property!
  deleteProperty(id: ID!): Property!
}
type Property { id: ID! street: String! city: String! state: UsState! zipCode: String! lat: Float! long: Float! weatherData: WeatherData! createdAt: String! }
type WeatherData { observation_time: String temperature: Float weather_code: Int weather_icons: [String!] weather_descriptions: [String!] wind_speed: Float wind_degree: Float wind_dir: String pressure: Float precip: Float humidity: Float cloudcover: Float feelslike: Float uv_index: Float visibility: Float is_day: String }
input CreatePropertyInput { street: String! city: String! state: UsState! zipCode: String! }
input PropertyFilter { city: String state: UsState zipCode: String }
enum PropertySort { CREATED_AT_DESC CREATED_AT_ASC }
enum UsState { the 50 states and DC as two-letter codes }
```

- Architecture rules: resolvers hold no logic; `PropertyService` validates, fetches weather and persists and depends on the `WeatherProvider` interface; `PropertyRepository` is the only file with SQL; `WeatherstackProvider` is the only file that knows Weatherstack and gets `fetch`, base URL, key and timeout through its constructor; `main.ts` is the composition root; only `PropertyService.create` calls the provider.
- Weather is fetched once at creation and never refreshed. A failed weather call stores nothing. There is no retry.
- Roles: manager and conductors are Claude Opus 5.5 and never implement; the worker is GPT Luna through `codex exec`; the reviewer is Grok 4.7 at high reasoning through the Cursor v1 API, never the model that wrote the diff. At most three review rounds per slice.

## What to look for

1. A statement in either file that contradicts the facts above or contradicts another statement in the same diff.
2. A command or GraphQL operation that would not work as typed (the six operations must each be valid against the schema and map one to one to the six user stories: list, sort, filter, detail, create, delete).
3. A stranger following "Run it" and "Test it" who would get stuck: a missing step, an ambiguous instruction, a wrong order.
4. The AWS Lambda paragraph: anything technically wrong or misleading in it.
5. Text rules: no long dashes (em or en), no praise or marketing words, no personal names other than inside a source URL or the licence notice, no email address, nothing about who assesses the work, no secret value.
6. The skills pages: is the provenance of each copy stated honestly (source URL, version or commit, licence, locally modified), is anything claimed that the diff does not support, does a copied file contain anything that should not be published (a private path, a client, a person, an email address).
7. Structure: a required section missing. Required order: what it is and the six stories; run it; test it; environment variables; example operations; architecture; stack and why; trade-offs and what comes next with the Lambda path; how AI was used (roles, loop, record, the placeholder "Where an agent was wrong and how it was caught", which must contain no invented incident); skills.

## Answer format

First line: `APPROVED` or `CHANGES REQUESTED`. Then findings, numbered F1, F2, ..., each with: severity (high, medium, low), file and the quoted text, what is wrong, the change you propose. No finding without a quote. Do not report style preferences or things the prompt says are out of scope.

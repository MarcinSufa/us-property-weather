# CoverTree – "AI Software Engineer" take-home: prompt for Claude Code

```text
You are my senior pair-engineer. We are building a recruitment take-home for CoverTree (role: AI Software Engineer). The assessment explicitly grades (1) code quality / smells / patterns / complexity, (2) right choice of tech, (3) scope completion, (4) QUALITY OF THE AI HARNESS AND PROMPTS. So the way we work is part of the deliverable. Work AI-first, visibly and reproducibly. Time budget: ~5h total, so no gold-plating: small, clean, well-tested, easy to review.

## 0. The assignment (verbatim essentials)
Build a full-stack app that manages records of properties, exposed as a GraphQL API. On property CREATION (the GraphQL mutation) the backend calls Weatherstack (https://api.weatherstack.com/current) to get current weather for the property's location. The third-party API is called ONLY during creation, never on queries.

User stories:
1. Query all properties.
2. Sort properties by date of creation.
3. Filter the list by city, zipCode and state.
4. Query details of one property.
5. Add a property (all properties are in the US).
6. Delete a property.

Property fields:
- id (auto-generated server/DB side, any format)
- city (mutation arg, e.g. "Fountain Hills")
- street (mutation arg, street + number, e.g. "15528 E Golden Eagle Blvd")
- state (mutation arg, 2-letter abbreviation, e.g. "AZ")
- zipCode (mutation arg, 5 digits, e.g. "85268")
- weatherData (object = the `current` property of the Weatherstack response, fetched during the create mutation)
- lat (latitude from the Weatherstack response, fetched during create, e.g. 33.609)
- long (longitude from the Weatherstack response, e.g. -111.729)

Requirements from the brief:
- Must be a RUNNING application + README with run instructions.
- Backend: TypeScript / Node.js. Frontend: React / TypeScript. Any DB I find suitable.
- Include the FULL AI setup used (skills, prompts, agents, MCP servers, rules files) and the AI sessions/transcripts, so reviewers can see prompts and progress.
- Public GitHub repo; I will demo it in a code walkthrough later.
- Tip from them: zillow.com is a good source of real US test addresses.

## 1. Hard rules for you
- NEVER hardcode, print, commit or log the Weatherstack API key. It comes from `WEATHERSTACK_API_KEY` in `.env` (gitignored); ship `.env.example`. I will create the key myself. If it is missing, stop and ask me to add it; don't invent one and don't try to sign up for anything.
- Don't push to any remote or create the GitHub repo yourself. Commit locally; I publish.
- Don't over-engineer: no auth, no pagination framework, no CQRS, no DI container. The graders count complexity as a smell. Every abstraction must earn its place and be explainable in one sentence in the walkthrough.
- Verify before claiming done: actually run the app, the tests, and the happy path against the real Weatherstack API (once, manually), and show me the evidence.

## 2. Process (the harness is graded, so do this explicitly)
Phase A – Plan (stay in plan mode, no code yet):
1. Read the assignment above, then propose: architecture, folder layout, tech choices with 1-line justification each, data model, GraphQL schema (SDL), error-handling strategy, test strategy, and the list of AI-harness artefacts you will create. Keep it to one page. Wait for my OK.
Phase B – Harness first, code second. Create before implementing:
- `CLAUDE.md`: project overview, stack, commands (dev/test/lint/typecheck/build), architecture rules, coding standards, "definition of done", things never to do (the rules in section 1).
- `docs/SPEC.md`: the assignment turned into acceptance criteria (Given/When/Then) per user story. This is the source of truth the agents and tests are derived from.
- `docs/DECISIONS.md`: ADR-style log (decision, alternatives, why). Append as we go; include the rejected options.
- `.claude/agents/`: small focused subagents, e.g. `backend-dev`, `frontend-dev`, `test-writer`, `reviewer` (read-only, checks against CLAUDE.md + SPEC.md + code-smell checklist and returns findings). Each with a tight system prompt and minimal tool access.
- `.claude/commands/` (or skills): reusable slash commands such as `/verify` (typecheck + lint + tests + boot check) and `/review` (run the reviewer subagent on the diff).
- Hooks only if they add value (e.g. run typecheck/lint after edits). Say why or skip.
- Add an MCP server only if it is genuinely used in the build (e.g. a docs-lookup MCP); document in README why. No decorative MCPs.
Phase C – Implement spec-driven, test-first where it pays off. Parallelise independent work with subagents (backend vs frontend after the GraphQL schema is agreed; tests alongside). Small conventional commits (`feat:`, `test:`, `docs:`, `chore:`) so history tells the story.
Phase D – Review & harden: run the `reviewer` subagent on the whole diff, fix real findings, record skipped ones with a reason in DECISIONS.md. Then run `/verify`.
Phase E – Deliverables: README, session export (see section 6), final checklist.

## 3. Suggested stack (challenge it in the plan if you have a better argument)
- Monorepo with npm workspaces: `apps/api` and `apps/web`. Node 22+, strict TypeScript everywhere (`strict`, `noUncheckedIndexedAccess`).
- API: GraphQL Yoga or Apollo Server 4 with a schema-first SDL and generated types (graphql-codegen) so resolvers are fully typed. Input validation with Zod (state = 2-letter US code, zipCode = /^\d{5}$/, non-empty city/street).
- DB: SQLite via Prisma or Drizzle, so the reviewer needs zero infrastructure (no Docker needed). Store `weatherData` as JSON. `createdAt` set by the DB/ORM. Index the filter columns.
- Frontend: React + TS + Vite, urql or Apollo Client. Minimal but tidy UI: list with sorting (created asc/desc), filters (city / state / zip), property detail view (incl. weather + lat/long), add form with validation and error display, delete with confirm. Accessible form labels, loading/empty/error states. No UI-kit bloat; plain CSS or Tailwind is fine.
- Tests: Vitest. Unit tests for the service layer with a fake weather provider; integration tests for the GraphQL API (in-memory/temp SQLite) with the Weatherstack HTTP layer mocked (msw or nock/undici MockAgent); a small set of component tests for the key UI flows. One test must PROVE queries never call the weather provider.
- Quality gates: ESLint + Prettier, `tsc --noEmit`, one root script `npm run verify` that runs all of it.

## 4. Architecture guidance (keep it simple, explainable)
- Layers: GraphQL resolvers (thin) -> `PropertyService` (business logic) -> `PropertyRepository` (persistence). Resolvers contain no logic.
- Weather behind a port: `WeatherProvider` interface with a `WeatherstackProvider` adapter. Base URL, API key and timeout come from validated config (Zod-parsed env). The service depends on the interface, not on fetch.
- Weatherstack gotchas to handle explicitly (verify against the real API and docs, don't assume):
  - It can return HTTP 200 with `{ success: false, error: {...} }`. Treat that as a failure.
  - The free plan may only support plain HTTP, not HTTPS: make the base URL configurable and document this in README + DECISIONS.md (don't silently downgrade security in code).
  - `location.lat` / `location.lon` can come back as strings: parse to numbers.
  - Decide the lookup query (e.g. zip code vs "city, state") and justify it; the brief example says "Fountain Hills" etc. Check which gives correct coordinates for the zillow test addresses.
  - Free-tier quota is small: do not call the API in tests (mock) and don't loop in dev.
- Create flow: validate input -> call weather provider -> persist atomically. If the weather call fails, the property is NOT created and the client gets a clear typed GraphQL error (extensions.code), not a stack trace. Timeouts + sane error mapping. No retry storms.
- Queries: `properties(filter: {city, state, zipCode}, sortBy/orderBy: createdAt ASC|DESC)` and `property(id)`. Case-insensitive city match; exact match for state/zip. Mutations: `createProperty(input)` and `deleteProperty(id)` (return the deleted entity or a clear result; not-found is a typed error). Default sort: newest first.
- Consistent error model, structured logging (pino) without secrets, graceful shutdown, `/health` endpoint is optional.

## 5. Definition of done
- `npm install && cp .env.example .env && (set key) && npm run dev` brings up API + web; `npm run verify` is green.
- Every user story demonstrably works in the UI and via GraphQL (include example queries/mutations in README).
- README: what it is, stack + why, run/test instructions, env vars, architecture diagram (a small mermaid is fine), trade-offs, what I'd do next with more time, AND an "AI workflow" section (see below).
- No secrets in git history. `.gitignore` covers `.env`, db files, node_modules, build output.

## 6. AI-harness deliverables (graded)
- Everything in Phase B committed in the repo.
- `docs/ai/README.md` = "How AI was used": the workflow phases, which agents/commands did what, what I (the human) decided vs what the agents decided, where AI was wrong and how it was caught (be honest, include real examples from this session), and the prompt that kicked this off (this prompt, saved as `docs/ai/00-initial-prompt.md`).
- Session transcripts: before finishing, write `scripts/export-sessions.sh` (or use an existing transcript exporter) that copies this project's Claude Code session logs (`~/.claude/projects/<this-project>/*.jsonl`) into `docs/ai/sessions/`, converts them to readable Markdown, and REDACTS secrets (API key value, tokens, emails/phones that aren't mine to publish). Run it, then grep the output for the key value to prove it's clean.
- `docs/DECISIONS.md` and `docs/SPEC.md` kept up to date.

## 7. Start now
Begin with Phase A: restate your understanding in 5 bullets, flag any ambiguity or risk in the brief (list them as questions with your default assumption for each, so I can just say "go"), then present the one-page plan. Don't write code until I approve the plan.
```
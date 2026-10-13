# Worker prompt 01: slice `docs`, the README draft and the skills page

You are the worker of slice `docs` in this repository. Your working directory is the slice worktree. You write two Markdown files and nothing else:

1. `README.md` at the repository root (new file).
2. `docs/agent/skills/README.md` (new file).

Do not create, change or delete any other file. Do not run git commands that write (the conductor stages and commits). You have no network and need none. Add no dependency.

## Read first, in full

- `docs/plan.md` (the binding design; this README describes what the plan says will exist)
- `AGENTS.md`
- `apps/api/schema.graphql`
- `package.json` (root), `.env.example`, `.nvmrc`
- `docs/agent/skills/grilling/SOURCE.md` and `docs/agent/skills/handoff/SOURCE.md` (provenance of the two skill copies the conductor already placed there; do not edit them)

Do not read `docs/brief/`, `.env` or anything outside this worktree.

Two sentences of `docs/plan.md` in this worktree are out of date. Use this wording instead:

- Section 11: `npm run verify` runs format check, codegen, lint, typecheck, unit and integration tests, and the web build. `npm run e2e` runs Playwright.
- Section 14: conductors are started by the manager session as background subagents, one per slice, each pointed at the handoff file of its wave under `docs/agent/handoffs/` and at its own brief under `docs/agent/briefs/`. A conductor writes its slice record under `docs/agent/slices/<slice>/` inside the slice worktree and commits it on the slice branch; the record reaches `main` with the merge.

## Rules for the text (both files)

- Plain sentences. No praise of the project, no marketing words.
- No long dashes anywhere (no em dash, no en dash). Use a comma, a colon, parentheses or a plain hyphen.
- Every command sits in a code block exactly as it is typed.
- State as fact only what the plan fixes. Much of the application is not built yet: other slices build it in parallel. Write the README the way the plan says the finished repository will be. Do not add "planned" or "will" to every sentence; the README is finished in a later wave against what was built.
- No personal names and no email addresses. Where a person is meant, write "the author".
- Nothing about who reads, grades or assesses the work and nothing about why the project exists beyond what it does. Section 1 of the plan has a paragraph that begins "The assessment grades": carry none of it over. Do not call the project an assignment, a take-home or an exercise.
- Never mention a key value. The variable name `WEATHERSTACK_API_KEY` is fine.
- Name only npm scripts that exist in the root `package.json`.
- Name only file paths that the plan's repository layout (section 4) or `AGENTS.md` names, or that exist in this worktree.
- `README.md` must pass `npx prettier --check README.md` (run it if your sandbox allows it; the conductor runs it in any case). `docs/agent/**` is ignored by Prettier.

## `README.md`: sections, in this order

1. **Title and what it is**: three sentences, then the six user stories as a numbered list (plan section 1).
2. **Run it**: the Node version (24, `.nvmrc`), then the commands of plan section 12 in one code block, exactly as the plan has them. Say where the key goes: `.env`, created from `.env.example`, variable `WEATHERSTACK_API_KEY`. Say that nothing else is needed: no Docker, no cloud account. Give the two local URLs.
3. **Test it**: `npm run verify` and `npm run e2e`, each in a code block, one sentence on what each runs, then plan section 11 as a short table (layer, what, how). Say that no test calls the real Weatherstack.
4. **Environment variables**: the table of plan section 9.
5. **Example GraphQL operations**: exactly six operations, one per user story, in the order of the stories, each in its own fenced block with the language tag `graphql`, each a complete named operation that is valid against `apps/api/schema.graphql` on its own. Use literal arguments, not variables, so each can be pasted into GraphiQL. Use the address from plan section 2 for the create example (zip 85268, Fountain Hills, AZ; invent a plain street line). For detail and delete use an obviously placeholder id and say in a sentence that it must be replaced with a real one. Put no other `graphql` fenced block in the file.
6. **Architecture**: the Mermaid diagram of plan section 4 unchanged, then its six rules, each in one sentence.
7. **Stack and why**: the table of plan section 3 shortened to three columns: choice, reason, rejected. Keep every row.
8. **Trade-offs and what comes next**: every deferral of plan section 17, each with one sentence on why it was left out, taken from the plan where the plan gives the reason. Add two more items: the weather is a snapshot from creation and is never refreshed (plan section 1), and `npm audit` reports 10 high findings, all through the transitive development dependency `braces`, left untouched. Then a subsection on the path to AWS Lambda, as a description of what would change and clearly not built: GraphQL Yoga exposes a fetch-style handler, so the same schema and resolvers would run behind a Lambda function URL or API Gateway with a thin adapter in place of `main.ts`; a SQLite file does not survive between invocations, so `PropertyRepository` would get a second implementation over a managed database while the service stays unchanged; the key would move from `.env` to a secrets store; the web bundle would be served as static files from object storage behind a CDN. Keep it to one short paragraph or a short list and word it as what would be done.
9. **How AI was used**:
   - the roles of plan section 14 as a table (role, who, does, never);
   - the loop of one slice as a numbered list;
   - where the record lives: `docs/agent/`, with one line per entry: `prompts/`, `decisions-log.md`, `manager-state.md`, `briefs/`, `handoffs/`, `slices/<slice>/`, `reviews/`, `review-log.md`, `session-metrics.md`, `sessions/`, `skills/` (plan section 13 says what each holds; `skills/` holds the copies and descriptions of the skills used);
   - also name `AGENTS.md`, `CLAUDE.md`, `docs/SPEC.md`, `scripts/grok-review.mjs` and `scripts/export-sessions.ts` with what each is for (plan section 13);
   - a subsection with the exact heading `Where an agent was wrong and how it was caught`, containing only one sentence: that it is filled in wave 2 from the review logs under `docs/agent/reviews/` and the slice records. Invent no incident.
10. **Skills**: which skills were used, which are copied under `docs/agent/skills/`, which are described only and why. Short: a table with skill, status (copied or described only) and the reason, and a pointer to `docs/agent/skills/README.md`. Use the facts below.

## `docs/agent/skills/README.md`

A page that says what this folder holds and why. Contents:

- One paragraph: skills are instruction files an agent session loads for a kind of task. This folder holds copies of the public skills that were invoked while this project was built (skill files only, not whole upstream repositories) and descriptions of the ones that are not copied.
- **Copied**: `grilling` (`grilling/SKILL.md`) and `handoff` (`handoff/SKILL.md`, `handoff/LICENSE`). For each: what it did in this project (below), and the source URL, commit or version, licence and the locally-modified note exactly as its `SOURCE.md` states them. Where `SOURCE.md` says "not established locally", repeat that; do not fill the gap.
- **Described only**, each with the two sentences below (you may rephrase lightly, keep the facts) and the reason it is not copied.
- **Not invoked**: the session-start text of the `superpowers` plugin was injected into the sessions, but none of its skills was invoked, so nothing of it is copied.

Facts about what each skill did in this project:

- `grilling`: an interview skill that puts every open decision of a plan to the author in rounds, each question with a recommended answer. Here it was used in the planning session to settle the open points of the plan before approval (plan section 19).
- `handoff`: passes a session's working state (goal, specifics, state, next step, constraints, gotchas, verification commands) to a fresh session through a structured document. Here its document format is the model for the files under `docs/agent/handoffs/` that conductors are started from.
- `conduct` (private repository, described only): makes the driving session route every coding task to a worker model instead of implementing it, and requires a review by a model from another vendor. Here it is the source of the roles in the README: manager and conductors never implement, the worker writes, another vendor's model reviews.
- `conduct-binding` (private repository, described only): binds `conduct` to the author's own machine: which worker and reviewer routes exist there and where decisions are recorded. Here it applied alongside `conduct` in the manager session; the project-specific equivalents are written out in `AGENTS.md` and the handoff files, so the repository does not depend on it.
- `exo-compact` (private repository, described only): a plugin that replaces the built-in context compaction of a long session with its own summary and keeps the earlier part of the session searchable. Here it took one compaction of the manager session, after which the work in progress continued without a question to the author.
- `i-have-adhd` (described only): shapes long final answers so that the next action comes first and multi-step work is numbered. Here it shaped the manager session's long answers to the author; it is not copied because its public origin is inferred, not confirmed, and a copy waits for the author's confirmation.

Reason for "described only" on the three private ones: they live in private repositories and are not published.

## When you are done

Reply with:

1. The two file paths you wrote.
2. A list headed "to check in wave 2": every statement in either file that depends on something not present in this worktree today (a path, a behaviour, a script's coverage, a URL, a count), one line each with the file and the section.
3. Anything in these instructions that contradicts `docs/plan.md` or `AGENTS.md`. Report it; do not resolve it yourself.

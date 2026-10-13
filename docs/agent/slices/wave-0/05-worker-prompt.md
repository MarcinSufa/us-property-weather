# Worker prompt 05: wave 0, round 5 (agent rules and the spec)

You are the implementer of wave 0 of the CoverTree project. Working directory: the git worktree `c:/tmp/covertree-wave0`, branch `slice/wave-0`. Rounds 1 to 4 built the workspace, the contract, the tests and the skeleton of both apps. In this round you write three documents and no code.

## Read first, in full

1. `docs/plan.md`, all of it
2. `docs/agent/briefs/wave-0.md`, item 5 of "What to build"
3. `docs/brief/cover-tree.md` (the assignment as received, for the six user stories)
4. The tree as it is now: root `package.json` (the real script names), `apps/api/schema.graphql`, `apps/api/src/**`, `apps/web/src/**`, `scripts/grok-review.mjs`

Where this prompt and those files disagree, stop and say so in your final message instead of choosing.

## Hard rules

- Never open, read, print or copy `.env`. No network call.
- Write only `AGENTS.md`, `CLAUDE.md` and `docs/SPEC.md`. Change no code, no config, no other document. Do not run `git add` or `git commit`.
- No long dashes (U+2013, U+2014) anywhere: use a comma, colon, parentheses or a plain hyphen. No emoji.
- Plain, direct English. No marketing words, no filler, each rule once. A reader is a coding agent or a reviewer who has not seen the plan.
- Both Markdown files must pass `npx prettier --check AGENTS.md CLAUDE.md docs/SPEC.md`.
- State nothing the plan or the code does not support. If the plan is silent on something a section needs, leave it out and name the gap in your final message.

## 1. `AGENTS.md` (root)

The rules every agent works under in this repository, per plan section 13. Under about 120 lines. Sections:

1. What this is: two or three sentences from plan section 1, and the one invariant that matters most (Weatherstack is called once, at creation, and never from a query).
2. Commands: the real scripts from the root `package.json` with one line each (`npm install`, `npm run dev` with both addresses, `npm run verify` and its six steps in order, `npm run codegen`, `npm run e2e`, `npm run format`). Node 24 is required. `.env` comes from `.env.example`.
3. Layout: the repository layout of plan section 4, reduced to what exists or is planned, one line per folder.
4. Architecture rules: the six rules of plan section 4, each as one imperative sentence.
5. Coding standards: what the configs and the plan enforce: TypeScript `strict`, `noUncheckedIndexedAccess`, `erasableSyntaxOnly` (no enums, no parameter properties), imports with the `.ts` or `.tsx` extension, no `any`, validation with Zod only at the two trust boundaries, error codes of plan section 7, hand-written SQL only in the repository file, no comments unless the code reads as a mistake without one, no dependency without the manager's approval, generated code is never edited or committed, `apps/api/schema.graphql` is the contract and changes only through the manager.
6. Tests: test first and seen red before the implementation; each test name starts with its acceptance-criterion id from `docs/SPEC.md`; no test, dev loop or CI job calls the real Weatherstack; the API uses a stub `fetch` and a fake provider, the web uses `msw`.
7. Definition of done for a change: `npm run verify` green, the acceptance criteria it touches covered by tests, no file outside the slice's ownership changed, the record under `docs/agent/` updated.
8. Never: read, print, log or commit `.env` or a key value; log or throw a URL that carries the key; call Weatherstack from anything but `PropertyService.create`; push, merge or rebase (Marcin publishes); use `--no-verify`; add complexity (a layer, an abstraction, a dependency) without a stated reason.
9. Where the record lives: `docs/plan.md`, `docs/SPEC.md`, `docs/agent/` with one line on what each subfolder holds (plan section 13).

## 2. `CLAUDE.md` (root)

Exactly one line: `@AGENTS.md`

## 3. `docs/SPEC.md`

Acceptance criteria in Given/When/Then form, the source every later test is named after.

- Ids: `AC-<AREA>-<n>`, areas `CREATE`, `LIST`, `FILTER`, `SORT`, `DETAIL`, `DELETE`, `WEATHER`, `ERROR`, numbered from 1 within each area. Ids are stable: later slices add criteria, they do not renumber.
- Sources: plan sections 5, 7, 8 and 10. Nothing else. Do not invent behaviour.
- Coverage that is required:
  - each of the six user stories of plan section 1 has at least one criterion at the GraphQL level and one at the UI level;
  - every rule of plan section 7 has at least one criterion: each validation rule on create (trimming, the length limits of `street` and `city`, the zip pattern, the state enum rejected by GraphQL itself), the weather call made exactly once with the zip code as the query, nothing stored when the weather call fails, no retry, each filter rule (city whole and case-insensitive after trimming, state and zip exact, blank means no filter, a malformed zip filter is `BAD_USER_INPUT`), default sort newest first and both sort orders, same-millisecond rows keeping insertion order, delete returning the deleted property;
  - every row of the errors table of plan section 7 has at least one criterion, including the `fieldErrors` shape and the masking of unexpected errors as `INTERNAL_SERVER_ERROR` with no stack trace;
  - plan section 8: coordinates parsed from strings to finite numbers, HTTP 200 with `success: false` treated as a failure, code 615 mapped to `LOCATION_NOT_FOUND`, codes 101, 104, 105, 106 and any other mapped to `WEATHER_UNAVAILABLE`, timeout, network failure, non-2xx, unreadable or unexpected body, the key appearing in no log line and no error, unknown keys inside `current` kept;
  - the invariant: `properties`, `property` and `deleteProperty` make zero provider calls, `createProperty` makes exactly one;
  - plan section 10: filters and sort in the URL, the confirmation dialog before delete, native constraints on the form, server field errors under their fields, one alert per weather error code, the submit button disabled while the request runs, navigation to the detail page after create, the not-found state, loading, empty and error states with "no properties yet" distinct from "nothing matches the filters", labels tied to inputs, errors announced, focus moved to the first invalid field, the list refreshing after a create from an empty list.
- Form: a short introduction (what the ids are for, the rule that a test name starts with its id), then one section per area. Each criterion is an id as a heading or bold lead, one line naming its source (for example `Source: plan 7, Create step 2`), then `Given`, `When`, `Then` lines. One behaviour per criterion; use concrete values where the plan gives them (`85268`, 200 characters, `BAD_USER_INPUT`).
- End with a table that maps every user story (1 to 6) to its criteria ids.

## Final message

List the files written, the number of criteria per area, the result of the Prettier check if you could run it, and every place where the plan was silent or ambiguous and what you did about it. Facts only.

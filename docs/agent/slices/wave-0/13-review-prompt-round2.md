# Reviewer prompt: wave 0, round 2

You reviewed wave 0 (foundation) of a property management take-home project in round 1 and answered `VERDICT: CHANGES REQUESTED` with eleven findings. The patch below is only the fix: `git diff fca2bd7 HEAD` without `package-lock.json` and without the record of the agent rounds. `npm run verify` is green on it (24 tests: schema contract 6, web routes 3, reviewer script 15).

Context that has not changed: Node 24 running TypeScript directly, GraphQL Yoga 5, schema-first SDL (`apps/api/schema.graphql`, fixed), generated code not committed, a root `prepare` script that runs codegen. The skeleton bodies throw `not implemented` by design; wave 1 fills them.

## Your round 1 findings and what was done with each

1. BLOCKER `scrub` order in `scripts/grok-review.mjs`: FIXED. `Basic <encoded>` first, then the encoded key, then the raw key. Two tests with the key `Vm0w` (401 path, saved result).
2. MAJOR `readDoneEvent` drops a final event without a trailing blank line: FIXED. The buffered remainder is checked at end of stream. One test.
3. MAJOR `verify` order: FIXED. `format:check`, `codegen`, `lint`, `typecheck`, `test`, `build`; same sequence in `AGENTS.md`; the `prepare` script stays.
4. MAJOR contract test locks operations only: FIXED. Table-driven exact field sets and types for `Property`, `WeatherData`, `CreatePropertyInput`, `PropertyFilter`.
5. MAJOR `docs/SPEC.md` AC-FILTER-5 against AC-FILTER-6: FIXED. Blank city applies no restriction (AC-FILTER-5); a non-blank zip whose trimmed value is not five digits is `BAD_USER_INPUT` (AC-FILTER-6); blank zip applies no restriction (AC-FILTER-9); the client omits `state` for "any" (AC-FILTER-10); an empty state string is rejected by GraphQL validation (AC-FILTER-11). Ids were not renumbered.
6. MAJOR `App.test.tsx` without a urql `Provider`, one module-level client: DEFERRED to the web slice of wave 1, which owns `apps/web/**` and whose brief requires a client per test. Not in this patch.
7. MINOR `weatherData: Record<string, unknown>`: REJECTED. No code on the API reads a single weather field: the object is validated by Zod at the adapter, stored whole and served by GraphQL's default field resolvers under Weatherstack's own names. Sixteen optional fields in the domain type would be types without a reader.
8. MINOR `useIndexSignature: true` in `apps/api/codegen.ts`: FIXED. Removed; codegen and typecheck pass without it.
9. MINOR SSE field parsing: PARTLY FIXED. The optional space after `event:` is accepted, with a test. "Last event field wins" is REJECTED: one server, one observed format.
10. MINOR nothing tests the deadline: FIXED. The deadline is a dependency (`deadlineMs`, default 2,700,000 ms, because a review at high reasoning took 22 minutes); a test passes 35 ms and a fetch that only settles on abort. Also new: the script logs the agent id and the run id right after the create call, with a test.
11. MINOR test names without criterion ids: FIXED as an exemption, one sentence in `AGENTS.md` and one in `docs/SPEC.md`.

## What to review

1. For each finding marked FIXED or PARTLY FIXED: is the fix correct and complete, and does its test fail without the fix?
2. Did the fix introduce anything new: a secret path, a parsing regression, a contradiction between `AGENTS.md`, `docs/SPEC.md`, `package.json` and the code?
3. If you disagree with a DEFERRED or REJECTED outcome, say so once, as MINOR, with the concrete failure it leaves; do not repeat the round 1 text.

Do not report missing features, style settled by Prettier and ESLint, or changes to the SDL. Read the patch; do not run long experiments.

## Form of the answer

Start with one line: `VERDICT: APPROVE` or `VERDICT: CHANGES REQUESTED`.
Then a numbered list of findings, most severe first, each as:
`<n>. [BLOCKER|MAJOR|MINOR] <file>:<line or symbol> - <what is wrong> - <what to do>`
Only findings you can point at in the patch. No praise, no summary, no long dashes. If there is nothing to fix, say so in one line.

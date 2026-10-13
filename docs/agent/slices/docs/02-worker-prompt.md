# Worker prompt 02: slice `docs`, corrections from the conductor's own read

You are the worker of slice `docs`. Round 1 wrote `README.md` and `docs/agent/skills/README.md`. Change only these two files. Do not run git commands that write. All rules of round 1 still hold: plain sentences, no long dashes, no personal names, no email addresses, nothing about who reads or grades the work, every command in a code block, only existing npm scripts, `README.md` passes `npx prettier --check README.md`, exactly six `graphql` fenced blocks.

Read `docs/plan.md` sections 3, 5, 14 and 17 again before editing.

## Corrections in `README.md`

1. Section "How AI was used", roles table: the "Who" column lost what plan section 14 fixes. Restore it:
   - Manager: the manager session, Claude Opus 5.5.
   - Conductor: one Claude Opus 5.5 subagent of the manager session per slice, at medium effort, running in the background.
   - Worker: GPT Luna through `codex exec`, one per slice, in its own worktree and branch `slice/<name>`.
   - Reviewer: Grok 4.7 at high reasoning through the Cursor v1 API. It reads the diff pasted into the prompt and is never the model that wrote the diff.
2. Same section, the loop: follow plan section 14 step for step: brief from the manager; worker prompt written by the conductor; worker round (test seen red, then green); the conductor's own verification (reads the whole diff, runs `npm run verify`); reviewer round; fixes, at most three review rounds; report to the manager; merge with `git merge --no-ff`; `npm run verify` on `main`. Add the sentence that a finding that is not fixed is recorded with its reason, and the sentence that model ids are checked before every vendor leg and passed explicitly.
3. Same section, the record list: give each entry what plan section 13 says it holds: `prompts/` holds the prompts verbatim with their outcomes; `briefs/` one brief per slice; `handoffs/` one handoff file per wave; `slices/<slice>/` each worker prompt and reviewer prompt with its raw reply, and the red and green test output; `reviews/` the reviewer's raw findings per slice; `sessions/` redacted session transcripts. Keep the others.
4. Section "Trade-offs and what comes next":
   - `astro` and `air_quality`: the plan's reason is in section 5: the whole `current` object is stored, but these two are not exposed because some of their keys are expected to contain hyphens, which GraphQL field names cannot (the plan marks this as unverified). Use that reason.
   - The production build item: say why in plain terms from the plan: the API runs its TypeScript directly with Node and the application is meant to run locally with `npm install` and nothing else, so no compiled API build, no serving of the web bundle from the API and no deployment exist.
   - Retries, caching, circuit breaker: the plan's reason (section 7) is that the quota is small and the person can press the button again. Use it.
   - Give the Lambda paragraph its own subheading `### Path to AWS Lambda (not built)` and give the deferral list the lead-in sentence "Not built:".
5. Section "Stack and why":
   - Last column of the quality gates row: leave the cell empty, as the plan does, instead of "None specified".
   - Database row, rejected column: restore the plan's reasons: Drizzle or Prisma with `better-sqlite3` is a native addon and an ORM for one table; Drizzle on `node:sqlite` is release candidate only.
   - Add a first column "Concern" with the plan's row labels, so the table reads concern, choice, reason, rejected.
6. Section "Run it": after the code block add one sentence that the last two commands are the checks described in the next section, so a reader knows only the first three are needed to run the application.

## Corrections in `docs/agent/skills/README.md`

7. The two `SOURCE.md` files changed one phrase: "byte for byte" became "text unchanged ... (git stores it with LF line endings)". Read both again and bring the two "Copied" entries in line with them.

## When you are done

Reply with the list of changes made, by number, and an updated "to check in wave 2" list only if it changed.

# Manager state (updated by the planning session at every milestone)

Last update: 2026-10-13 by the manager session (Claude Opus 5.5, prompt log `docs/agent/prompts/001-planning.md`).

## Where the work stands

Plan approved on 2026-10-13. Wave 0 is built and reviewed, its review fixes are in progress, and the five slices of wave 1 are being built in parallel from the wave 0 commit. Nothing is merged into `main` yet and nothing is pushed. Commits are authored with the GitHub no-reply address set in this repository's config.

Settled (rows in `docs/agent/decisions-log.md`): the working model, planning for parallel sessions, the local stack without cloud infrastructure, no push during the work, Grok as reviewer on a pasted diff, the record from the first prompt, this session as manager, Playwright and CI as extras, redacted transcripts, no deadline pressure, standing permission for local commits, the wave split, conductors in this checkout with the worker in worktrees.

## Open

- Wave 0: built, verified by the manager (`npm run verify` exit 0, 15 tests, on fca2bd7) and reviewed by Grok: CHANGES REQUESTED, 11 findings, of which the manager accepted 9 (one as a trial, one in part), deferred one to the `web` slice and rejected one (rows in the decisions log). The fix round and the round 2 review run on `slice/wave-0` under the same conductor (subagent `aa9056fd978ca8e30`). When it reports, the manager reads the fix diff, runs `npm run verify`, saves the report, merges with `--no-ff`, runs `npm run verify` on `main` and removes the worktree (which still holds a copy of the env file from the dev proof).
- Wave 1: five conductors started together on 2026-10-13 as background subagents (Opus 5.5, medium effort), each from commit fca2bd7 in its own worktree, per `docs/agent/handoffs/wave-1.md`. Nothing reaches `main` before the wave 0 merge. Merge order after wave 0: `weather`, `api`, `web`, `transcripts`, `docs`, each with `npm run verify` on `main`; a conductor that reaches its review before the fixed reviewer script is on `main` ends with "built and verified, not reviewed" and is resumed.
- P7 settled by Marcin on 2026-10-13: public (copies committed) are grilling, i-have-adhd, handoff, superpowers, gstack, graphify, demo-video; private (described only) are conduct, conduct-binding, exo-compact. For the wave 1 brief that owns the README and the record: commit a copy only of a skill that was actually invoked in this project, and only its skill files, not the whole upstream repository (superpowers and gstack are large plugin repositories); each copy carries its source URL, the commit or version, the licence notice and, for grilling, i-have-adhd and graphify, a line saying it is a locally modified copy. The origin of i-have-adhd and graphify is inferred, not recorded locally, and must be confirmed before a copy is committed. That narrowing to invoked skills and skill files is the manager's reading, not something Marcin said.
- Design step: done and accepted by Marcin on 2026-10-13 ("Design ok"). Eight boards drawn by the manager on a Claude design canvas (private artifact on Marcin's account), sources and README in `docs/design/`. The `web` brief of wave 1 must point at `docs/design/README.md`.
- exo-compact: the first two compactions of this session were native, the third (2026-10-13, about 12:44 local) was taken by the plugin. Evidence: the context after it opens with the plugin's seed marker, the capture folder holds a segment file of 105 records, the recall tool answers from an index of 1054 of 1054 vectors, and the label file holds 7 labels produced by jev-1.13.0. This refutes the earlier note that the changed options would only reach a new session. One compaction so far (n=1); the work in progress (the design boards) continued after it without a question to Marcin. Seen in the seed and worth reporting to the plugin's agent: harness boilerplate lines and one sentence fragment landed in its constraints section, and its errors section arrived truncated. Options as set: `interactiveOnly` false, `jevEnabled` true (backup `settings.json.bak-2026-10-13-exo-compact` next to the user settings file).
- Jev (the plugin's external ranking model) is on for this project by Marcin's decision; the doctor probe passed (exit 0, model jev-1.13.0). Span text of the session goes to that service. Conductors started in this folder inherit both options.
- The name of the earlier project appears verbatim in the first prompt of `000-bootstrap.md`; whether it stays is Marcin's call before publication.

## Facts from wave 0

What the conductors of wave 1 need and the plan does not say. Measured on 2026-10-13 in the wave 0 run; record in `docs/agent/slices/wave-0/`.

- Worker id: `gpt-6-luna` answers; `gpt-5.6-luna` is the stale name. Dispatch as `codex exec -m gpt-6-luna -s workspace-write -C <worktree> -o <reply file> - < <prompt file> > <log file> 2>&1`, with the log file outside the repository.
- The worker sandbox has no network: the conductor runs `npm ci` itself. No `npm install` is needed in wave 1, because no slice may add a dependency.
- The worker sandbox cannot write the git index: the conductor stages and commits, with an explicit path list.
- Vite cannot start its build inside the sandbox (`spawn EPERM`): the conductor runs `npm run verify` and the build, and gives the output back to the worker when something fails. The worker can run the API and web unit tests.
- Stopping a background task does not stop the Node processes it started on Windows: find them by command line and stop them by process id, and check that ports 4000 and 5173 are free before the final message.
- A subagent cannot write a file named as a report: the harness refuses. The final message of a conductor is its report; the manager saves it as `docs/agent/slices/<slice>/report.md` at merge.
- Generated GraphQL code is not committed. A root `prepare` script runs codegen after `npm ci`. At commit fca2bd7 `npm run verify` runs lint and typecheck before codegen; the review round of wave 0 moves codegen first.
- Reviewer: `grok-4.7` with `--param context=256k --param reasoning_effort=high --param fast=false` through `scripts/grok-review.mjs`. The patch leaves out `package-lock.json` and `docs/agent/slices/**`. The wave 0 review of an 80 KB patch took 22 minutes (12.5 minutes of thinking, then four terminal experiments in the reviewer's own sandbox) and produced about 22 thousand tokens: the 34 seconds of the trial were for a diff of a few lines. The script of commit fca2bd7 gives up after 300 seconds; the fixed one waits 45 minutes and logs the agent id and the run id right after the create call.
- A run that outlives the script is not lost: `GET /v1/agents?limit=N` lists the agents, `GET /v1/agents/{id}` gives `latestRunId`, and the run's `result` can be read once its status is `FINISHED`.
- `npm audit` reports 10 high findings, all through the transitive development dependency `braces`. Not touched in wave 1; listed in the README under trade-offs.
- `docs/SPEC.md` holds 60 criteria in the areas CREATE, LIST, FILTER, SORT, DETAIL, DELETE, WEATHER and ERROR. The tests of wave 0 carry no criterion id, because they test the skeleton and no criterion.
- The web GraphQL client in `apps/web/src/graphql/client.ts` is one module-level instance; tests that need their own client need a factory, which the `web` slice may add inside its own paths.
- The skeleton signatures are the contract between `api`, `weather` and `web`. Read them from the source on `main`: `apps/api/src/property/property.ts`, `property-input.ts`, `property-repository.ts`, `property-service.ts`, `apps/api/src/weather/weather-provider.ts`, `weatherstack-provider.ts`, `apps/api/src/graphql/resolvers.ts`, `errors.ts`, `apps/api/src/config.ts`, `apps/api/src/db/database.ts`.

## Roles

| Role | Who | Rule |
|---|---|---|
| Manager | this session, Claude Opus 5.5 | plans, briefs, verifies, merges; never implements |
| Conductor | one Claude Opus 5.5 subagent of the manager session per slice, medium effort, in the background | writes worker and reviewer prompts, checks results itself; never implements |
| Worker | GPT Luna through `codex exec`, one per slice, own worktree | touches only its slice's files |
| Reviewer | Grok 4.7 at high reasoning through the Cursor v1 API | read-only, sees the diff pasted into the prompt, never the model that wrote it |

## Environment facts

- Windows 11, Git Bash, Node 24.16.0, codex-cli 0.159.2, `gh` logged in.
- Reviewer route, proven once (`docs/agent/reviews/grok-smoke.md`): `POST https://api.cursor.com/v1/agents` with `prompt.text` and `model.id`, no `repos` and no `env`; follow `GET /v1/agents/{id}/runs/{runId}/stream` to the `done` event; read `result` from `GET /v1/agents/{id}/runs/{runId}`. Basic auth with `CURSOR_API_KEY`. The API returns neither the model nor the cost.
- Model ids differ per route: `GET /v1/models` lists `grok-4.7`, `grok-4.6`, `grok-4.5` with separate `reasoning_effort`, `context` and `fast` parameters; the older `/v0/models` lists combined ids such as `cursor-grok-4.5-high`. Check the list before each reviewer leg and pass the id explicitly.
- `agent` on PATH is the Grok CLI (1.0.46), not the Cursor CLI. The Cursor CLI is not installed.
- The codex config maps `gpt-5.6-luna` to another id: check the current Luna id before the first dispatch.
- `.claude/handoff/HANDOFF.md` is one file per repository. When several slice sessions are spawned by handoff, keep a copy per slice under `docs/agent/handoffs/` and point each session at its own copy.
- exo-compact loads only in new main sessions under a folder that carries its flag; subagents and worktrees outside this folder stay on native compaction.
- The Weatherstack key lives in `.env` (ignored by git). No agent reads, prints or logs it. Real calls made so far: 3 (two answered, one refused with code 106 for coming right after another). Leave seconds between calls.
- Weatherstack answers over HTTPS on this key. Coordinates arrive as strings. Measured values and the comparison of the two lookup variants are in `docs/plan.md` section 2.
- `node:sqlite` and direct TypeScript execution both work on this Node with nothing printed on stderr.
- TypeScript 7 is outside `typescript-eslint`'s supported range today; the plan pins 6.0.

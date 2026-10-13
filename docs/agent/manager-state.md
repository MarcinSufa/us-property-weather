# Manager state (updated by the planning session at every milestone)

Last update: 2026-10-13 by the manager session (Claude Opus 5.5, prompt log `docs/agent/prompts/001-planning.md`).

## Where the work stands

Plan approved on 2026-10-13: `docs/plan.md` carries the approved status, its eight open points are settled as recommended. Wave 0 is briefed (`docs/agent/briefs/wave-0.md`, handoff `docs/agent/handoffs/wave-0.md`) and waits for Marcin to start its conductor session. No application code yet, no slice session spawned. Commits are authored with the GitHub no-reply address set in this repository's config.

Settled (rows in `docs/agent/decisions-log.md`): the working model, planning for parallel sessions, the local stack without cloud infrastructure, no push during the work, Grok as reviewer on a pasted diff, the record from the first prompt, this session as manager, Playwright and CI as extras, redacted transcripts, no deadline pressure, standing permission for local commits, the wave split, conductors in this checkout with the worker in worktrees.

## Open

- Wave 0: running since 2026-10-13 as a background subagent of the manager session (Opus 5.5, medium effort), worker tree `c:/tmp/covertree-wave0`, branch `slice/wave-0`, record on that branch. When it reports, the manager reads the diff, scans it, merges with `--no-ff`, runs `npm run verify` on `main`, then starts the five conductors of wave 1 together. Meanwhile the manager writes the wave 1 briefs and handoffs.
- P7 settled by Marcin on 2026-10-13: public (copies committed) are grilling, i-have-adhd, handoff, superpowers, gstack, graphify, demo-video; private (described only) are conduct, conduct-binding, exo-compact. For the wave 1 brief that owns the README and the record: commit a copy only of a skill that was actually invoked in this project, and only its skill files, not the whole upstream repository (superpowers and gstack are large plugin repositories); each copy carries its source URL, the commit or version, the licence notice and, for grilling, i-have-adhd and graphify, a line saying it is a locally modified copy. The origin of i-have-adhd and graphify is inferred, not recorded locally, and must be confirmed before a copy is committed. That narrowing to invoked skills and skill files is the manager's reading, not something Marcin said.
- Design step: done and accepted by Marcin on 2026-10-13 ("Design ok"). Eight boards drawn by the manager on a Claude design canvas (private artifact on Marcin's account), sources and README in `docs/design/`. The `web` brief of wave 1 must point at `docs/design/README.md`.
- exo-compact: the first two compactions of this session were native, the third (2026-10-13, about 12:44 local) was taken by the plugin. Evidence: the context after it opens with the plugin's seed marker, the capture folder holds a segment file of 105 records, the recall tool answers from an index of 1054 of 1054 vectors, and the label file holds 7 labels produced by jev-1.13.0. This refutes the earlier note that the changed options would only reach a new session. One compaction so far (n=1); the work in progress (the design boards) continued after it without a question to Marcin. Seen in the seed and worth reporting to the plugin's agent: harness boilerplate lines and one sentence fragment landed in its constraints section, and its errors section arrived truncated. Options as set: `interactiveOnly` false, `jevEnabled` true (backup `settings.json.bak-2026-10-13-exo-compact` next to the user settings file).
- Jev (the plugin's external ranking model) is on for this project by Marcin's decision; the doctor probe passed (exit 0, model jev-1.13.0). Span text of the session goes to that service. Conductors started in this folder inherit both options.
- The name of the earlier project appears verbatim in the first prompt of `000-bootstrap.md`; whether it stays is Marcin's call before publication.

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

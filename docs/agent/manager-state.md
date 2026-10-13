# Manager state (updated by the planning session at every milestone)

Last update: 2026-10-13 by the manager session (Claude Opus 5.5, prompt log `docs/agent/prompts/001-planning.md`).

## Where the work stands

Planning. `docs/plan.md` exists with status PROPOSED: project description, stack, architecture, GraphQL schema, data model, behaviour, error model, tests, harness, orchestration, waves, definition of done. It is not approved. Marcin read it and called it OK in general; the eight open points are not answered one by one yet. No application code, no slice sessions spawned. Commits are authored with the GitHub no-reply address set in this repository's config.

Settled (rows in `docs/agent/decisions-log.md`): the working model, planning for parallel sessions, the local stack without cloud infrastructure, no push during the work, Grok as reviewer on a pasted diff, the record from the first prompt, this session as manager, Playwright and CI as extras, redacted transcripts, no deadline pressure, standing permission for local commits, the wave split, conductors in this checkout with the worker in worktrees.

## Open

- The eight open points of `docs/plan.md` section 19 (database access, running TypeScript directly, the shape of `weatherData`, the state enum, the lookup query, one record folder, copies of skills, reviewer cost). The next grilling round runs against that file.
- Design step: Marcin wants the frontend designed in Claude Design before the `web` slice. The Claude Design connection was rejected in this session (HTTP 403, login needed), so it has not started.
- exo-compact did not take this session's compactions (two so far, both native): the summary is in the native format, the plugin's status tool lists no session, the recall tool reports no index. Likely cause, inferred from `compact.ts:404` and not proven: the option `interactiveOnly` was true and a session started from the editor extension reports no surface. Changed on Marcin's word: `interactiveOnly` is now false and `jevEnabled` is true in the plugin options of the user settings file (backup `settings.json.bak-2026-10-13-exo-compact` next to it). Options are read at session start, so this session stays native. Not yet proven: a new session in this folder, `/compact`, and the first message after it starting with the plugin's seed marker. If that fails, the fallback is starting sessions from a terminal with the plugin's launcher and its Jev switch.
- Jev (the plugin's external ranking model) is on for this project by Marcin's decision; the doctor probe passed (exit 0, model jev-1.13.0). Span text of the session goes to that service. Conductors started in this folder inherit both options.
- The name of the earlier project appears verbatim in the first prompt of `000-bootstrap.md`; whether it stays is Marcin's call before publication.

## Roles

| Role | Who | Rule |
|---|---|---|
| Manager | this session, Claude Opus 5.5 | plans, briefs, verifies, merges; never implements |
| Conductor | one Claude Opus 5.5 session per slice, working directory in this checkout | writes worker and reviewer prompts, checks results itself; never implements |
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

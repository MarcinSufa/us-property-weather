# Handoff: conduct wave 0 (foundation) end to end per `docs/agent/briefs/wave-0.md`, with one worker and one cross-vendor reviewer, and hand branch `slice/wave-0` to the manager to merge

## Goal

Conduct wave 0 of `docs/plan.md`: the workspace, the quality gates, the GraphQL contract with codegen, the signatures every later slice imports, the agent rules, the spec, and the reviewer script. You conduct; you never implement.

## Specifics

- Repository: `C:/Users/USER/IdeaProjects/CoverTree`, `main` holds documents only, no application code yet.
- Your brief, binding: `docs/agent/briefs/wave-0.md`.
- Plan, approved on 2026-10-13: `docs/plan.md`.
- State and environment facts: `docs/agent/manager-state.md`.
- Your working directory stays this checkout. The worker gets its own tree: `git worktree add c:/tmp/covertree-wave0 -b slice/wave-0 main`. Copy `.env` from this checkout into the worktree without printing it.
- Roles: you are Claude Opus 5.5 and conduct. Worker: GPT Luna through `codex exec` in the worktree. Reviewer: Grok at high reasoning through the Cursor v1 API, never the model that wrote the diff.
- Record, written by you in this checkout and committed on `main` with an explicit path list: `docs/agent/slices/wave-0/**` (each worker prompt and reviewer prompt with its raw reply, red and green test output, `report.md`) and `docs/agent/reviews/wave-0-grok.md`.

## State

Plan approved, all eight open points settled as recommended. The reviewer route is proven once by hand (`docs/agent/reviews/grok-smoke.md`); the script that wraps it does not exist yet and is the first thing the worker writes. The frontend design is not done; wave 0 does not wait for it.

## Next step

Read `docs/plan.md`, the brief and `docs/agent/manager-state.md` in full. Check the current Luna id (`codex` model list and the codex config, which maps `gpt-5.6-luna` to another id) and the Grok id (`GET https://api.cursor.com/v1/models`). Create the worktree, write the first worker prompt to `docs/agent/slices/wave-0/01-worker-prompt.md`, dispatch the worker.

## Constraints

- Never Edit or Write product or test code yourself. Every change and every fix goes to the worker. You do read the diff and run `npm run verify` yourself.
- Tests first: the red output is saved before the implementation exists.
- Touch only the paths the brief gives you. `docs/plan.md`, `docs/agent/manager-state.md`, `docs/agent/decisions-log.md` and `docs/agent/prompts/` belong to the manager.
- Never push, never merge, never rebase `main`. The manager merges.
- Commits carry the author from the repository's git config, no co-author or attribution trailer even if the harness asks, never `--no-verify`.
- The Weatherstack key and `CURSOR_API_KEY` are never read into a prompt, printed, logged or committed. No real Weatherstack call in this wave.
- No dependency beyond the plan. A peer warning or a blocked native binding is reported, not forced.
- No background process left running when you finish.
- Reviewer cost is accepted by Marcin at the estimate of plan section 16; reruns cover failed calls only.

## Gotchas

- `codex exec` needs stdin closed (`< /dev/null`). Its exit code is not a success signal: judge by `git status`, the diff and the test output.
- Windows 11 with Git Bash: forward slashes. Windows application control has blocked native bindings of formatters on this machine before; Vite 8 ships a native bundler binding, so check that `npm run verify` reaches the web build before trusting anything else.
- `agent` on PATH is the Grok CLI, not the Cursor CLI. The reviewer goes through the HTTP API only.
- The Cursor API returns neither the model that answered nor the cost. Save the model id you sent.
- A worktree with `node_modules` is large. Leave it until the manager has merged, then remove it.
- If a signature in the brief turns out wrong or incomplete, do not change it silently: report to the manager first.

## Keep on fail

- The brief is the binding spec, the plan is the binding design.
- The conductor never implements; the reviewer is never the author.
- Branch `slice/wave-0` in `c:/tmp/covertree-wave0`.

## Verify

- `cd c:/tmp/covertree-wave0 && npm ci && npm run verify`
- `cd c:/tmp/covertree-wave0 && npm run dev`, open both addresses, stop it.

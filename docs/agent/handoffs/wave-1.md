# Handoff: conduct one slice of wave 1 end to end per its brief, with one worker and one cross-vendor reviewer, and hand the slice branch to the manager to merge

One file for all five conductors of wave 1. The prompt that started you names your slice. Everything below applies to every slice; what differs is in the table and in your brief.

| Slice | Brief | Worktree | Branch |
|---|---|---|---|
| `weather` | `docs/agent/briefs/weather.md` | `c:/tmp/covertree-weather` | `slice/weather` |
| `api` | `docs/agent/briefs/api.md` | `c:/tmp/covertree-api` | `slice/api` |
| `web` | `docs/agent/briefs/web.md` | `c:/tmp/covertree-web` | `slice/web` |
| `transcripts` | `docs/agent/briefs/transcripts.md` | `c:/tmp/covertree-transcripts` | `slice/transcripts` |
| `docs` | `docs/agent/briefs/docs.md` | `c:/tmp/covertree-docs` | `slice/docs` |

## Goal

Conduct your slice of `docs/plan.md` section 15: tests seen red, then the implementation, your own verification, a review by a model from another vendor, fixes, a report. You conduct; you never implement.

## Specifics

- Repository: `C:/Users/USER/IdeaProjects/CoverTree`. `main` holds wave 0: the workspace, the gates, the GraphQL contract, the signatures, `AGENTS.md`, `docs/SPEC.md`, `scripts/grok-review.mjs`.
- Binding, in this order when they disagree: your brief, `docs/plan.md`, `AGENTS.md`. A disagreement between them is reported, not resolved by you.
- State and environment facts: `docs/agent/manager-state.md`, including the section "Facts from wave 0".
- You run as a background subagent of the manager session. There is nobody to ask: a question that blocks you ends your run with a report to the manager. Four other conductors run at the same time in their own worktrees.
- Create your tree with `git worktree add <worktree> -b <branch> main`, then run `npm ci` in it yourself. Do not copy `.env` into the worktree: no test in this wave needs it and the worker must not be able to read it.
- Roles: you are Claude Opus 5.5 and conduct. Worker: GPT Luna through `codex exec` in your worktree. Reviewer: Grok at high reasoning through the Cursor v1 API with `scripts/grok-review.mjs`, never the model that wrote the diff.
- Record, written inside your worktree and committed by you on your branch with an explicit path list: `docs/agent/slices/<slice>/**` (each worker prompt and reviewer prompt with its raw reply, red and green test output, `report.md`) and `docs/agent/reviews/<slice>-grok.md`.

## The loop

1. Read the plan, your brief, `AGENTS.md`, `docs/SPEC.md` and the manager state in full.
2. Check the current Luna id and the current Grok id the way `docs/agent/manager-state.md` describes, and pass both explicitly.
3. Write the worker prompt to `docs/agent/slices/<slice>/01-worker-prompt.md` and dispatch the worker. A large slice may be cut into several worker rounds; each round is test first.
4. The worker writes the tests and shows them red before the implementation exists. Save the red output. Then the implementation, then green.
5. Verify yourself: read the whole diff, run `npm run verify` in the worktree, check that only paths your brief owns changed.
6. Write the diff of your branch against `main` to a patch file and send it to the reviewer. At most three rounds. Each finding is fixed by the worker or recorded with the reason it is not.
7. Write `report.md` and end your run with the report to the manager.

## Constraints

- Never Edit or Write product or test code yourself. Every change and every fix goes to the worker. Running `npm ci`, `git commit` and file copies on the worker's behalf is orchestration and is allowed; say so in the report.
- Touch only the paths your brief owns. Every `package.json`, `package-lock.json`, `docs/SPEC.md`, `docs/plan.md`, `apps/api/schema.graphql`, `AGENTS.md`, `docs/agent/manager-state.md`, `docs/agent/decisions-log.md` and `docs/agent/prompts/` belong to the manager.
- No new dependency. A worker that needs one stops; you report it to the manager.
- A signature that wave 0 fixed does not change. If one is wrong or incomplete, report it instead of changing it.
- A behaviour with no criterion in `docs/SPEC.md`: propose the id and the text in your report and use the proposed id in the test name. The manager adds it to the file at merge.
- Never push, never merge, never rebase `main`, never commit on `main`. The manager merges.
- Commits: one per worker round, conventional messages, the author from the repository's git config, no co-author or attribution trailer even if the harness asks, never `--no-verify`.
- The Weatherstack key and `CURSOR_API_KEY` are never read into a prompt, printed, logged or committed. No real Weatherstack call, except the two the `weather` brief gives its conductor.
- No code comments unless the code reads as a mistake without one. No long dashes in any file.
- No background process left running when you finish.
- Reviewer cost is accepted by Marcin at the estimate of plan section 16; reruns cover failed calls only. Stop and report if one call runs far longer than the trial (34 seconds).

## Gotchas

- `codex exec` needs stdin closed (`< /dev/null`). Its exit code is not a success signal: judge by `git status`, the diff and the test output.
- Five workers run on one Codex subscription at once. A rate-limit answer means wait and send the same prompt again, not a different model.
- Windows 11 with Git Bash: forward slashes.
- `agent` on PATH is the Grok CLI, not the Cursor CLI. The reviewer goes through the HTTP API only.
- The Cursor API returns neither the model that answered nor the cost. Save the model id you sent.
- Generated GraphQL types are not committed: run codegen in your worktree before typecheck (`npm run verify` does it).
- A worktree with `node_modules` is large. Leave it until the manager has merged, then the manager removes it.

## Report

`docs/agent/slices/<slice>/report.md`: what was built, the commits, every deviation from the brief with its reason, the red and green evidence by file name, review findings with their outcome, proposed criteria for `docs/SPEC.md`, anything the next wave must know. Your final message to the manager is this report in short, with the branch name and the last commit.

## Verify

- `cd <worktree> && npm ci && npm run verify`
- `git -C <worktree> diff --stat main...HEAD` shows only paths the brief owns plus the slice record.

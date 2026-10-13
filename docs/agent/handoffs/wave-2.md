# Handoff: conduct the `e2e` slice of wave 2 end to end per its brief, with one worker and one cross-vendor reviewer, and hand the slice branch to the manager to merge

| Slice | Brief | Worktree | Branch |
|---|---|---|---|
| `e2e` | `docs/agent/briefs/e2e.md` | `c:/tmp/covertree-e2e` | `slice/e2e` |

## Goal

Conduct the `e2e` slice of `docs/plan.md` section 15: the suite seen red where the brief says, then green, your own verification, a review by a model from another vendor, fixes, a report. You conduct; you never implement.

## Specifics

- Repository: `C:/Users/USER/IdeaProjects/CoverTree`. Waves 0 and 1 are on `main`. Your base is the commit the manager names in the prompt that starts you; it contains the finished API and web application.
- Everything in `docs/agent/handoffs/wave-1.md` under "The loop", "Constraints" and "Gotchas" applies to you unchanged, except the points below.
- Create your tree with `git worktree add c:/tmp/covertree-e2e -b slice/e2e <base>`, then `npm ci` in it. Do not copy `.env`: the suite must run without it.
- The reviewer script is `scripts/grok-review.mjs` in your worktree: it waits 45 minutes and prints the agent id and the run id after the create call. The copy under `c:/tmp/covertree-tools/` is gone.
- Order at this base: `npm run verify` runs codegen itself.
- The patch for the reviewer is `git diff <base> HEAD` without `package-lock.json` and `docs/agent/slices/**`.

## What wave 1 taught, binding here

- Do not end your turn while a review or a worker is running. One conductor of wave 1 ended its turn "waiting for the completion notice" and was never woken; its review reply was lost. Run the call in the foreground with a long timeout, or poll it in a loop yourself, and write your final report only when the slice is finished.
- A reviewer finding that contradicts the plan or the brief is sent to the manager in the report with the measurement that supports it, not patched around and not silently dropped.
- Red and green output saved into the record must not carry a private path that adds nothing. Where a tool prints one, keep the output as it is and say so in the report; the manager decides about redaction before publication.
- The worker's sandbox on this machine may block process spawning. Run the suite yourself and judge by what you saw.

## Report

Your final message: head commit, `npm run verify` exit code and counts, `npm run e2e` result of both consecutive runs, the red proofs with the file that holds each, the review verdict per round word for word, what each finding led to, the lines the manager must add to files you do not own, and anything you could not prove.

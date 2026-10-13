# Review log

One row per reviewer call, oldest first. The reviewer is Grok through the Cursor v1 API and is never the model that wrote the diff. The full text of each review (prompt, raw reply, what was done with each finding) lives in `docs/agent/reviews/` and `docs/agent/slices/<slice>/`; this file is the index. The manager adds a row when a review comes back and fills the outcome when the slice is merged.

| Date | Subject | Round | Model and parameters | Duration | Verdict | Findings | Outcome | Record |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 2026-10-13 | Trial on a synthetic diff with three planted defects | 1 | `grok-4.7`, context=256k, reasoning_effort=high, fast=false | 34 s | BLOCK | 3, all three planted, no false one | Route proven before any slice depended on it | `reviews/grok-smoke.md` |
| 2026-10-13 | Wave 0, `git diff main...slice/wave-0` at fca2bd7, 80,830 bytes | 1, first call | same | none: the script gave up at its 300-second deadline | none | none | Reply not lost: the run went on at the service and the manager fetched its text once it had finished | `reviews/wave-0-grok.md` |
| 2026-10-13 | Wave 0, the same call, reply fetched after the run finished | 1 | same | about 22 minutes | CHANGES REQUESTED | 11 | Adjudicated by the manager: 9 accepted (one as a trial, one in part), 1 deferred to the `web` slice, 1 rejected with the reason in `decisions-log.md`. Fixed in commit e8edf5e | `slices/wave-0/07-review-prompt-round1.md`, `11-review-reply-round1.md`, `reviews/wave-0-grok.md` |
| 2026-10-13 | Wave 0, fix diff `git diff fca2bd7 e8edf5e`, 19,521 bytes, with the earlier findings and their outcomes | 2 | same | 837 s | APPROVE | none | Merged into `main` as 82e4f29 after the manager's own `npm run verify` | `slices/wave-0/13-review-prompt-round2.md`, `13-review-reply-round2.md`, `reviews/wave-0-grok.md` |
| 2026-10-13 | Slice `weather`, `git diff fca2bd7 50028b9` without the slice record, 25,708 bytes, 5 files | 1 | same | 996 s | APPROVE | none; the reply is the verdict line alone, so it shows that nothing was found, not what was examined | Merged into `main` as 739bcfc after the manager's own reading of the adapter and `npm run verify` | `slices/weather/13-review-prompt-round1.md`, `14-review-reply-round1.md`, `reviews/weather-grok.md` |
| 2026-10-13 | Slice `docs`, `git diff fca2bd7 eefb44b` without the slice record, 42,219 bytes, 7 files | 1 | same | 814 s | CHANGES REQUESTED | 10 | 7 fixed, 1 fixed in part (the plan keeps error translation in the resolvers; the README now names the mapping file), 2 on skill provenance left for the manager and settled at the merge | `slices/docs/04-reviewer-prompt.md`, `04-reviewer-reply.md`, `reviews/docs-grok.md` |
| 2026-10-13 | Slice `docs`, fix diff `git diff eefb44b ff5631a -- README.md`, 9,462 bytes | 2 | same | 377 s | CHANGES REQUESTED | 2 | Both fixed in commit 94a012d | `slices/docs/07-reviewer-prompt.md`, `07-reviewer-reply.md`, `reviews/docs-grok.md` |
| 2026-10-13 | Slice `docs`, fix diff `git diff ff5631a 94a012d -- README.md`, 1,798 bytes | 3 | same | 82 s | APPROVED | none | Merged into `main` as 634b7c8 after the manager's own reading of the README and `npm run verify`. The two provenance findings of round 1 proved right when the manager compared the copies with GitHub; the notes were corrected after the merge and are not yet reviewed | `slices/docs/09-reviewer-prompt.md`, `09-reviewer-reply.md`, `reviews/docs-grok.md` |

## What the first real review changed

- The reviewer script waits 45 minutes and logs the agent id and the run id right after the create call, so a slow run can be fetched by hand.
- From round 2 on, a review receives the fix diff and the earlier findings with their outcomes, not the whole patch again.
- Cost is not returned by the API and is read from the Cursor dashboard.

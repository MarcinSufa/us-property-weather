# Review record: slice `web`, reviewer Grok

Reviewer: Grok through the Cursor v1 API, sent by `c:/tmp/covertree-tools/grok-review.mjs`. Model id sent in every round: `grok-4.7` (the newest of `grok-4.5`, `grok-4.6`, `grok-4.7` listed by `/v1/models` at the time), with `context=256k`, `reasoning_effort=high`, `fast=false`. The reviewer reads a patch and cannot run code. Worker: GPT Luna (`gpt-6-luna`, `codex exec`). The conductor (Claude Opus 5.5) decided the outcome of each finding and wrote no product or test code.

Raw prompts and replies are in `docs/agent/slices/web/`: `06-review-1-*`, `08-review-2-*`, `10-review-3-*`.

## Round 1

- Patch: `git diff fca2bd7 10bb4db` without `package-lock.json` and `docs/agent/slices/**` (the whole slice).
- Agent `bc-6fbff704-53a0-4d9b-9c3b-da1a0267de3f`, run `run-acc9fc3c-9e04-4e92-bea0-43d6e8205fde`, 1717 seconds.
- Verdict: changes requested. Fix commit: `97a1880`.

| # | Severity | Finding | Outcome |
| --- | --- | --- | --- |
| 1 | major | `ConfirmDialog` disables the focused button while a delete runs; focus leaves the modal; no status | Fixed in part: buttons stay focusable with `aria-disabled`, clicks ignored, `role="status"` "Deleting…" (`AC-WEB-19`). Declined: "Cancel" and Escape working during the request, because a closed dialog with a delete in flight says nothing was deleted when it may be. Known cost: a request that never answers keeps the dialog open (no client timeout). |
| 2 | major | `PropertyForm` navigates to the new property after the user left the form page | Fixed: an unmounted ref stops the late navigation and state updates (`AC-WEB-20`). |
| 3 | major | `WeatherCard` ignores `weather_icons` and shows the first description only | Fixed: all descriptions joined with ", "; the first icon as a decorative image in place of the hard-coded sun. Declined: a "Not reported" row for a missing icon (a decorative image carries no information). |
| 4 | minor | Phone width: hidden `thead` plus `data-label` reads column names twice | Fixed: `display: none` on `thead` in the 600px media query. No test (the test DOM has no media queries). |
| 5 | minor | `transparent` is a colour literal outside the tokens | Declined: the slice rule allows the keywords `transparent`, `currentColor`, `inherit`. |
| 6 | minor | Tests query by text and `querySelector`; only the first row's `<time>` checked; no two-error focus test | Fixed. |
| 7 | minor | Field-error wiring written twice; dialog alert does not reuse `ErrorAlert` | Fixed: `components/FieldErrors.tsx`. Declined: `ErrorAlert` in the dialog (it is title plus body, the dialog shows one sentence). |
| 8 | minor | A delete answer without data counts as success | Fixed: success requires `result.data?.deleteProperty` (`AC-WEB-17`). |

## Round 2

- Patch: `git diff 10bb4db 97a1880`, same exclusions (the fix alone). The prompt listed the eight findings with their outcomes.
- Agent `bc-f07c37dc-1343-4398-ad90-7c43f9f488a7`, run `run-f2931186-3753-4e3a-adc0-108f1d52bc26`, 1267 seconds.
- Verdict: changes requested. Fix commit: `7b83cec`.

| # | Severity | Finding | Outcome |
| --- | --- | --- | --- |
| 1 | major | Under React Strict Mode (used by `main.tsx`) the unmounted ref of `PropertyForm` stays `true`, so every create answer is dropped: a saved property, no navigation, no message | Confirmed and fixed. The effect's setup resets the ref. The test helper now renders inside `<StrictMode>` as `main.tsx` does; red before the fix: 13 failed, 66 passed. The defect came in with the round 1 fix and existed in development mode only. |
| 2 | major | A create that answers after the user left the form leaves the list stale | Refuted by test, no code change. `AC-LIST-5 a create that answers after the user left the form refreshes the list` was green at once and fails when `additionalTypenames` is removed (`09-red-additional-typenames.txt`). Not covered: a list request that starts before the insert and answers after the mutation result. |

## Round 3

- Patch: `git diff 97a1880 7b83cec`, same exclusions. The prompt listed the findings of both rounds with their outcomes.
- Agent `bc-adc39bc2-df4a-4d2d-90d6-fb1888509e20`, run `run-be11b7da-ad1b-477a-8b08-04620a52b654`, 663 seconds.
- Verdict: approve. No findings. The reviewer confirmed that the uncovered ordering of round 2 finding 2 is a real overwrite in urql's document cache and held that a user does not hit it (the list read is fast, the create waits for the weather lookup).

## Open after review

- The delete dialog cannot be closed while its request runs, and the client sets no timeout.
- A list answer that arrives after a later mutation result can put an older list back until the next request.
- No browser run in this slice: native dialog modality, focus return, Escape and the phone layout are unproven by the test DOM.

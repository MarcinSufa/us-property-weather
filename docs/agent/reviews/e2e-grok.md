# Review record: slice `e2e`, reviewer Grok

Reviewer: Grok through the Cursor v1 API, sent by `scripts/grok-review.mjs`. Model id sent in both rounds: `grok-4.7` (the newest of `grok-4.5`, `grok-4.6`, `grok-4.7` listed by `/v1/models` before each round), with `context=256k`, `reasoning_effort=high`, `fast=false`. The reviewer reads a patch and cannot run code. Worker: GPT Luna (`gpt-6-luna`, `codex exec`). The conductor (Claude Opus 5.5) decided the outcome of each finding, ran the suite and the red proofs, and wrote no product or test code.

Raw prompts and replies are in `docs/agent/slices/e2e/`: `05-review-1-*`, `09-review-2-*`.

## Round 1

- Patch: `git diff 814e452 e21a2dc` without `package-lock.json` and `docs/agent/slices/**` (the whole slice).
- Agent `bc-44ec10ad-450c-4189-896e-7fb4ba221d26`, run `run-fb1a51cd-38d5-4ee9-9ab9-c5eea994a5f1`, 2220 seconds (the run's own `durationMs`; the stream of the script ended after 459 seconds with the run still `RUNNING`, and the result was read by polling the same run, with no second call).
- Verdict: changes requested. Fix commit: `d51f66b`.

| # | Severity | Finding | Outcome |
| --- | --- | --- | --- |
| 1 | major | The unknown-location story asserts that the street is absent from the list after waiting only for the static heading "Properties", so it can pass before the list answers | Confirmed and fixed. The story waits for one row holding the first story's street and for "1 property", then asserts the absence. Red proof: with `PropertyService.create` storing the row although the weather lookup failed, the story fails at the row count, 2 received, 1 expected (`08-red-create-stores-on-weather-failure.txt`). The same rule was applied to every assertion of absence in the file. |
| 2 | major | `permissions: contents: read` leaves no `actions` scope, so `actions/upload-artifact@v7` would get 403; add `actions: write` | Not changed: the brief requires `permissions: contents: read`, and `action.yml` and the README of the action at v7 name no token and no permission. Sent back to the reviewer in round 2, who withdrew it. Still unmeasured: the workflow has not run on GitHub. |
| 3 | minor | The state leg of the filter story asserts only a count of 2, which any two rows satisfy | Fixed: both Arizona streets visible and the Texas street absent, after the filter and after the reload; the city and zip legs name their row and exclude the two others after the reload too. |

Added by the conductor in the same fix round: each story checks the stub count after the answer of its action is rendered. Red proof: with `PropertyService.list` calling the provider, the unknown-location story now fails at its own count check, "calls" 3 received, 2 expected (`08-red-list-calls-provider.txt`); before the fix the same change failed one test later (`04-red-weather-proof.txt`).

## Round 2

- Patch: `git diff e21a2dc d51f66b`, without `docs/agent/slices/**` (the fix alone, one file). The prompt listed the three findings with their outcomes.
- Agent `bc-b3c90cc5-d35b-4ff1-a5c6-afa83650c893`, run `run-ffd19be0-f11b-403b-87e3-fa10f4b5619a`, 618 seconds.
- Verdict: approve. No findings. The reviewer withdrew round 1 finding 2: the upload goes through `@actions/artifact` with `ACTIONS_RUNTIME_TOKEN`, the runner's own token, and `actions: write` is needed only to delete an artifact of another run or repository through the REST API.

## Open after review

- The workflow has not run on GitHub and the suite has not run on Linux. The commands of the workflow were run by hand, in order, in a fresh tree on Windows (`06-ci-steps-by-hand.txt`).
- The artifact upload under `permissions: contents: read` is argued from the action's source by the reviewer, not measured: the step runs only when the job fails.
- After a failed `npm run e2e` the report folder `e2e/playwright-report/` holds generated `.js` files that ESLint lints, so `npm run verify` fails until the folder is removed (`06-verify-red-after-failed-e2e-run.txt`). The fix is an ignore in `eslint.config.js`, which this slice does not own.
- Cleanup of the temporary database directory after an interrupted run (Ctrl+C, a killed runner) was not tested.

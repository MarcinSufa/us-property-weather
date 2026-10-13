# Slice `weather`: conductor report

The final message of the `weather` conductor, unedited, saved by the manager at the merge (a subagent cannot write a report file). It replaces an earlier interim message of the same conductor, which asked for the rulings listed under "Manager rulings, outcome" and is kept only in the session transcript. The harness had escaped one closing tag quoted in finding F5; the manager restored it. The manager's own checks before the merge are in `docs/agent/manager-state.md`.

~~~text
# Slice `weather`: built, verified, reviewed (APPROVE)

Status: DONE. Ready to merge. This report replaces the earlier one.

## Top findings

- F1 Fixtures: 2 real Weatherstack calls made in total (25 seconds apart, both answered, none since the resume). No hook refused the command. Key check printed `key present: false` for both files. Calls spent in the project: 5; 2 left for the final manual run.
- F2 Code 615 seen for query `00000`, with HTTP 400 (accepted by the manager; the test pinning 615 with HTTP 400 is kept).
- F3 Fixtures reformatted by Prettier, whitespace only, equality proven against the raw copies in `c:/tmp/covertree-weather-logs/raw/` (accepted; raw copies kept until merge).
- F4 Review verdict is APPROVE with zero findings after 996 seconds. The reply is one line and carries no reasoning, so it shows that nothing was found, not what was examined. No second call made (reruns cover failed calls only).
- F5 Hook noise: the exo-compact recall hook injected unrelated "task brief lines" (a skills licence table, a subagent hand-back frame, an `</agent-message>` tag) into four of my tool calls with "compare and fix". Ignored as unrelated data.

## Branch and commits

Branch `slice/weather`, worktree `c:/tmp/covertree-weather`, base fca2bd7, last commit `2e3fd39`. Author from the repository config, no trailer. Tree clean, nothing pushed, nothing on `main`.

- `941776c` test: add Weatherstack adapter tests and recorded fixtures, seen red
- `a5eef37` feat: implement the Weatherstack adapter and its response schema
- `50028b9` fix: propagate unknown errors and accept only plain in-range coordinates
- `2e3fd39` docs: record the weather slice review

`git diff --stat fca2bd7 HEAD`: only `apps/api/src/weather/**` (5 files), `docs/agent/slices/weather/**` and `docs/agent/reviews/weather-grok.md`.

## What was built

- `apps/api/src/weather/weatherstack-response.ts`: two Zod schemas (failure answer, success answer), types inferred. `current` is `z.record(z.string(), z.unknown())`, unknown keys kept. Coordinates: string matching `^-?\d+(?:\.\d+)?$`, converted, latitude within -90..90, longitude within -180..180, bounds included.
- `apps/api/src/weather/weatherstack-provider.ts`: one `GET {baseUrl}/current` with `access_key` and `query` through `URL`/`searchParams`, `AbortSignal.timeout(timeoutMs)`; body read before status; 615 gives `LocationNotFoundError`, other failure bodies `code_<n>`, fetch or body-read rejection `timeout` or `network`, then `http_<status>`, `unreadable_body`, `unexpected_shape`. One pino line per call for success and every mapped failure (`outcome`, `reason`, `durationMs`; info or warn). Errors carry no cause and no URL. Unknown errors propagate unchanged with no log line; `unexpected_error` and the one-line wrapper are gone. No retry, no cache. Wave 0 signatures unchanged.
- `apps/api/src/weather/weatherstack-provider.test.ts`: 159 tests (161 in the API package), stub `fetch`, real pino on a memory stream, both fixtures.
- `apps/api/src/weather/fixtures/current-85268.json`, `current-unknown.json`.

## Manager rulings, outcome

1. F2 accepted: test with 615 and HTTP 400 kept.
2. F3 accepted: nothing changed.
3. O1 wrapper removed.
4. O2/D4 `unexpected_error` removed; red test first (`AC-WEATHER-6 propagates a success logger error without logging again`: a throwing `logger.info` comes out as the same instance, zero log lines).
5. O3 strict decimal and range; red first with `0x10`, `1e3`, `90.001`, `-180.001`, plus `+33.6`, `33.`, `.5`, leading space; bounds `-90`/`180` accepted.
6. O4 one id per test name (checked: zero names with two `AC-` ids in the green output).
7. O5 AC-WEATHER-15 reduced to six cases, one per reason, asserted on the thrown error; AC-WEATHER-13 keeps the full table.
8. `docs/SPEC.md` not touched.

## Red and green evidence (`docs/agent/slices/weather/`)

- `02-red-skeleton.txt`: 142 failed, 3 passed against the skeleton.
- `04-red-key-leak.txt`: 34 failed, 111 passed against the deliberately leaking implementation; all 34 are `AC-WEATHER-7`. That state was never committed.
- `06-green.txt`: 145 passed. `07-verify.txt`: verify exit 0.
- `09-red-rulings.txt`: 161 tests, 43 failed: the 14 new coordinate cases in three tables (42) and the logger-error test (1).
- `11-green-rulings.txt`: 161 passed. `12-verify-after-rulings.txt`: `npm run codegen && npm run verify` exit 0 (API 161, web 3, root 10, build ok), run by me.
- Worker prompts and raw replies: `01`, `03`, `05`, `08`, `10`. Reviewer: `13-review-prompt-round1.md`, `14-review-reply-round1.md`.

## Review

Record: `docs/agent/reviews/weather-grok.md`. Model `grok-4.7`, `context=256k`, `reasoning_effort=high`, `fast=false`, id checked against `GET /v1/models` first (lists grok-4.7, 4.6, 4.5). Script `c:/tmp/covertree-tools/grok-review.mjs`. Patch `git diff fca2bd7 50028b9` without the slice record: 25,708 bytes, 5 files; neither key present in patch or prompt (checked, printed `false` twice). Agent `bc-cfa3f525-ea37-45ac-8154-25fdab194deb`, run `run-679ede09-d464-471a-8438-d2b358ce7ece`, FINISHED in 995.752 s. Reply: `VERDICT: APPROVE`, no findings. One round, no fixes after it.

## Deviations

- D1 Fixture whitespace (accepted).
- D2 Rounds 2 and 3 were each two worker dispatches (red state witnessed by me, then the implementation) and one commit each; the red states are in the record, not in git history as separate commits.
- D3 The worker cannot start Vitest in its sandbox (`spawn EPERM` at config load). The manager-state line "the worker can run the API and web unit tests" did not hold: I ran every test run; the worker ran eslint, typecheck and prettier.
- D4 The worker's own saved red output in round 1 was UTF-16 debris; I replaced it with my run.
- D5 Orchestration done by me: worktree, `npm ci`, codegen, the two recordings, `prettier --write` on the two fixtures, saved outputs, commits, the review call. No product or test code written by me.

## Criteria for `docs/SPEC.md` (accepted, to add at merge)

- AC-WEATHER-13: one log line per call for the success and every mapped failure, with `outcome` (`ok`, `location_not_found`, `unavailable`), `reason` on failures, `durationMs`; never the URL or the key.
- AC-WEATHER-14: for a non-2xx response whose body is a Weatherstack `success: false` object, the code in the body decides, not the HTTP status.
- AC-WEATHER-15: `WeatherUnavailableError.reason` is one of `timeout`, `network`, `http_<status>`, `code_<code>`, `unreadable_body`, `unexpected_shape`.
- Tests under existing ids that stretch their text: AC-WEATHER-6 now also covers "an unknown error propagates unchanged" and the strict coordinate format and range; AC-WEATHER-2 covers the inclusive bounds. If you want separate ids for those two rulings, the test names need a one-line change each.

## For the next wave

- `api` slice: an unknown error from the adapter (not `LocationNotFoundError`, not `WeatherUnavailableError`) reaches the service unchanged and must be masked and logged by the API layer; the adapter logs nothing for it.
- The 615 log line carries `reason: code_615`, `outcome: location_not_found`.
- e2e stub: serve `current-unknown.json` with HTTP 400 to match the real service.
- Real `current` has 18 keys; `air_quality` holds the hyphenated keys `us-epa-index` and `gb-defra-index`.
- A coordinate with a leading space, a plus sign or an exponent is rejected as `unexpected_shape`; the real service sent `"33.609"` and `"-111.724"`.

## Housekeeping

No background process of mine left running (the reviewer call finished; ports 4000 and 5173 free; the `codex` processes visible on the machine belong to the other conductors). Worktree `c:/tmp/covertree-weather` kept with `node_modules` for the manager to remove after the merge. Outside the repository: `c:/tmp/covertree-weather-logs/` (worker logs, review patch and log, raw fixture bodies; no key in them).
~~~

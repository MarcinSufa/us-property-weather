# Slice `api`: conductor report

The final message of the `api` conductor after the fix round the manager ordered, unedited, saved by the manager at the merge. The branch was merged at the head it names, 3e89212, as 8407a25. The manager checked one of its open points itself: with the old predicate put back for the city, the committed AC-STORE-2 test fails on the plan (`SCAN property`), so the committed test does catch the defect.

~~~text
# Report: slice `api`, fix round after the manager ruling

The list query now uses the column indexes, and Grok approved the fix in round 2. Branch `slice/api` in `c:/tmp/covertree-api`, head `3e89212`, working tree clean, nothing pushed.

## Commits since `3bfd4eb`

- `8bcc322` fix(api): filter the property list through the column indexes (worker round)
- `3e89212` docs(api): record the second review round

Both carry the repository author (Marcin Sufa) and no trailer; `--no-verify` was not used. The round changed only `apps/api/src/property/property-repository.ts`, `property-repository.test.ts`, `apps/api/src/config.ts`, `docs/agent/slices/api/**` and `docs/agent/reviews/api-grok.md`.

## Verification

- **`npm run verify`**: exit 0 before each of the two commits. API 111 tests in 8 files, web 3, scripts 10. Output of the first run is in `docs/agent/slices/api/10-verify.txt`.
- **Long-dash scan**: 0 hits in `apps/api/src`, the slice record and `docs/agent/reviews/api-grok.md`.
- **SQL-keyword search** outside `property-repository.ts`, `db/database.ts` and `generated/`: 0 matches.
- **Port 4000**: free; I left no process running.

## What changed

1. **List query** (`property-repository.ts`): `list` builds the WHERE clause from the fixed fragments `city = :city`, `state = :state` and `zip_code = :zipCode` for the filters that are set, and omits it when none is. Only those parameters are bound. The sort is one of two fixed fragments, `ORDER BY created_at ASC, rowid ASC` or `DESC, rowid DESC`. The statement is prepared per call, which was the worker's choice as less code.
2. **`mapRow`**: two private helpers, `textColumn` and `numberColumn`, with the same `Invalid property row column: <name>` messages.
3. **`config.ts`**: the second `.trim()` on the key is gone.
4. **Tests**: three new ones under the proposed id AC-STORE-2. A `Proxy` around the real `DatabaseSync` records what `prepare` receives; the test asserts exactly one statement is prepared during `list` and runs `EXPLAIN QUERY PLAN` on it. The existing list tests are unchanged and green.

## EXPLAIN QUERY PLAN lines

Red, `docs/agent/slices/api/09-red-output.txt` (3 failed, 108 passed), the same for all three cases:

```
SCAN property
USE TEMP B-TREE FOR ORDER BY
```

Green, `docs/agent/slices/api/09-green-output.txt` (111 passed):

```
AC-STORE-2 property_city: SEARCH property USING INDEX property_city (city=?) | USE TEMP B-TREE FOR ORDER BY
AC-STORE-2 property_state: SEARCH property USING INDEX property_state (state=?) | USE TEMP B-TREE FOR ORDER BY
AC-STORE-2 property_zip_code: SEARCH property USING INDEX property_zip_code (zip_code=?) | USE TEMP B-TREE FOR ORDER BY
```

## Grok round 2

Model `grok-4.7` (newest of `grok-4.7`, `grok-4.6`, `grok-4.5` in the model list, checked before the leg), `context=256k`, `reasoning_effort=high`, `fast=false`. Agent `bc-d9031588-073a-44af-82af-4d5d7b6dbf4d`, run `run-ce364157-0624-4bcf-b1f1-c21ef367c223`, 337 s. The patch was `git diff 3bfd4eb 8bcc322` without the lockfile and the slice record, with both round 1 findings quoted. Verdict verbatim:

```
VERDICT: APPROVE
Nothing to fix.
```

The raw reply is `docs/agent/slices/api/11-review-reply-round2.md` and is appended to `docs/agent/reviews/api-grok.md` under "Round 2". The prompt is `11-review-prompt-round2.md`.

## Deviations and notes

- **Two worker dispatches, one commit.** The first version of the test (prompt 09) identified the list statement with the literal `'SELECT * FROM property'` and had a `console.info`. Prompt 10 removed both, so the test now carries no SQL beyond the `EXPLAIN QUERY PLAN ` prefix. The plan lines in `09-green-output.txt` come from that removed `console.info`; the committed test shows the plan only in an assertion message on failure.
- **The committed test was not re-run red.** The red run was against the prompt 09 version of the test. The prompt 10 version asserts exactly one `prepare` during `list`, so against the old constructor-prepared code it would fail on that count, not on the plan.
- **Orchestration by me:** converted the two output files to UTF-8, made the commits, ran verify and the review. I wrote no product or test code.
- **Not mine, not touched:** `docs/agent/reviews/grok-smoke.md` (a base file) contains a long dash.

## Not proven

- The `SIGINT`/`SIGTERM` shutdown path, as before (Windows).
- Index use for combined filters is not asserted; only the three single-column cases are.
- `ORDER BY` still uses a temp B-tree in every plan. That is expected with these indexes and nobody asked for a change.

## Proposed criterion

- **AC-STORE-2**: given a filter on only the city, only the state or only the zip code, when the list is read, then the query is answered through the index of that column.
~~~

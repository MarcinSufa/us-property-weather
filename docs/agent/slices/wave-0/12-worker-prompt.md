# Worker prompt 12: wave 0, round 8 (fixes after review round 1)

Working directory: the git worktree `c:/tmp/covertree-wave0`, branch `slice/wave-0`, head fca2bd7. The reviewer (Grok) read the whole wave and requested changes. The raw reply is `docs/agent/slices/wave-0/11-review-reply-round1.md`; read it in full. The manager adjudicated every finding. This prompt is the binding list: do exactly these fixes, nothing else.

## Hard rules

- Never open, read, print or copy `.env` (a copy is in the worktree; it is not yours to touch). No network call.
- No `git add`, no `git commit`. No new dependency. No long dashes (U+2013, U+2014). No comments unless the code reads as a mistake without one.
- Files you may change, and no other: `scripts/grok-review.mjs`, `scripts/grok-review.test.mjs`, root `package.json` (the `verify` line only), `AGENTS.md`, `docs/SPEC.md`, `apps/api/src/graphql/schema.contract.test.ts`, `apps/api/codegen.ts`.
- Nothing under `apps/web/**`. No signature, name or exported type in `apps/api/src/**` changes: five slices of wave 1 build against them right now. `apps/api/schema.graphql` does not change.
- Test first wherever a test can show the defect: write the test, run it, see it fail for the stated reason, then fix. Save nothing yourself; paste the red summary lines and the failing assertion messages into your final message, per finding.

## Fixes (numbers are the reviewer's finding numbers)

**1. Scrub order (`scripts/grok-review.mjs`, `scrub`).** The raw key is replaced before its encoded forms, so a key that occurs inside `base64(key + ':')` splits the credential and the rest leaks: key `Vm0w` turns `Basic Vm0wdzo=` into `Basic [redacted]dzo=`. Redact the `Basic <encoded>` header first, then the bare encoded key, then the raw key. Tests first, with the key `Vm0w`: (a) the 401 path, where the response body echoes the Authorization header: the log contains neither `Vm0wdzo=` nor `dzo=`; (b) the success path, where `run.result` contains `Basic Vm0wdzo=`: the written output file contains neither `Vm0wdzo=` nor `dzo=`.

**2. Final event without a trailing blank line (`readDoneEvent`).** A stream that ends with `event: done` and no blank line after it is reported as ended before done. Process the buffered remainder when the stream ends. Test first: a stream whose last bytes are `event: done\ndata: {}` with no blank line makes `main` succeed.

**9. SSE field parsing, same function.** Accept the optional space after the colon: `event:done` counts as done. Test first. Do not implement "last event field wins".

**10. Deadline and run ids (`scripts/grok-review.mjs`).**
- (a) The deadline becomes 2,700,000 ms (45 minutes). It is a value in `dependencies` (name it `deadlineMs`) whose default is that number when the caller leaves it out, so the direct-run block needs no change beyond what you choose. The failure message takes its number from the value, never from a literal (today it prints `300-second deadline`). Test first: `main` with `deadlineMs` of some tens of milliseconds and a `fetch` that never resolves until its `signal` aborts (reject with the signal's reason on `abort`) returns a non-zero code, and the log names the deadline. The test must fail if the deadline is removed from the script.
- (b) Right after the create call succeeds and both ids are read, log the agent id and the run id through `safeLog`, in one line, so a run that outlives the script can be fetched later. Test first: the log of a successful run contains both ids before the final line.

**3. Order of `verify` (root `package.json`).** New order: `format:check`, `codegen`, `lint`, `typecheck`, `test`, `build`. Keep the `prepare` script. Write the same sequence in the Commands section of `AGENTS.md`.

**4. Contract test locks operations only (`apps/api/src/graphql/schema.contract.test.ts`).** Add table-driven assertions for every field name and its type string, exact set (no extra, none missing), of `Property`, `WeatherData`, `CreatePropertyInput` and `PropertyFilter`, taken from `apps/api/schema.graphql` as it is. The SDL is the fixed contract, so these tests pass at once; to show they are real, temporarily retype one field of `WeatherData` and drop one field of `PropertyFilter` in the SDL, run, see both fail, restore. `git diff --stat apps/api/schema.graphql` must print nothing at the end. Keep the file passing `tsc` under `noUncheckedIndexedAccess`.

**5. `docs/SPEC.md`, AC-FILTER-5 against AC-FILTER-6.** The semantics, binding:
- `city` empty or whitespace-only applies no restriction;
- `zipCode` empty or whitespace-only applies no restriction;
- `zipCode` that is non-blank after trimming and not exactly five digits fails with `BAD_USER_INPUT`;
- `state` is an enum: the client leaves it out for "any"; an empty string is not a `UsState` and is rejected by GraphQL validation before the service runs.
Reword the existing criteria so that each states one of these behaviours without contradicting another. Add new ids at the end of the FILTER area where one criterion would otherwise hold two behaviours (the next free id is AC-FILTER-9), and add them to the user story table. Renumber nothing, delete no id.

**11. Tests without criterion ids.** One sentence in the Tests section of `AGENTS.md` and one in the introduction of `docs/SPEC.md`: tests of tooling and of the skeleton that cover no criterion carry no id.

**8. Trial: `useIndexSignature` (`apps/api/codegen.ts`).** Remove `useIndexSignature: true`, run `npm run codegen` and `npm run typecheck`. If both pass, leave it removed. If the compiler then rejects the resolver map passed to `createSchema` (or anything else), put the option back, and quote the complete compiler error in your final message. Either outcome is acceptable; an unreported one is not.

## Not in this round

Finding 6 (urql `Provider` in the web test) is deferred to the web slice. Finding 7 (`weatherData` typing) is rejected. Do not act on either.

## Check before you finish

`npm run format:check`, `npm run codegen`, `npm run lint`, `npm run typecheck`, and the three test files through the Vitest wrapper of your global instructions. The spawn test of the reviewer script fails in your sandbox with `EPERM`, and `npm run build` with `spawn EPERM`; the conductor runs both.

## Final message

Per finding number: files changed, the red result (summary line and assertion message) and the green result. The outcome of the trial in finding 8 with the compiler error if any. Each check command with its result. Anything you could not do. Facts only.

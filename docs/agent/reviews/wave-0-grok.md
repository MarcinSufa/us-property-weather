# Wave 0: Grok review

Verdict: APPROVE in round 2, after CHANGES REQUESTED in round 1. Two review rounds, one fix round.

Reviewer: `grok-4.7` with `context=256k`, `reasoning_effort=high`, `fast=false`, through `scripts/grok-review.mjs`. The model list of the Cursor API was checked before each round; `grok-4.7` was the newest Grok id both times.

## Round 1: CHANGES REQUESTED, 11 findings

- Prompt `docs/agent/slices/wave-0/07-review-prompt-round1.md`, raw reply `docs/agent/slices/wave-0/11-review-reply-round1.md`.
- Patch: `git diff main...slice/wave-0` at fca2bd7 without `package-lock.json`, `docs/agent/slices/**` and `docs/brief/**`, 80,830 bytes.
- Agent `bc-e772c328-cc89-4902-99f7-143402e9f81e`, run `run-f0850e51-dc55-40d8-93a7-7684f551c745`, about 22 minutes. The script gave up at its 300-second deadline of the time; the run went on at Cursor and the manager fetched the reply afterwards.
- A first attempt failed before any request: Node could not load the script (named import from `node:console`), fixed in 2fa9d2f.

| #   | Severity | Finding                                                                   | Outcome                                                                                                                                                                                                 |
| --- | -------- | ------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | BLOCKER  | `scrub` replaces the raw key before its encoded forms; a colliding key leaks | Fixed in e8edf5e: `Basic <encoded>`, then the encoded key, then the raw key. Two tests with the key `Vm0w`.                                                                                             |
| 2   | MAJOR    | `readDoneEvent` drops a final event without a trailing blank line         | Fixed in e8edf5e, with a test.                                                                                                                                                                          |
| 3   | MAJOR    | `verify` runs lint and typecheck before codegen                           | Fixed in e8edf5e: `format:check`, `codegen`, `lint`, `typecheck`, `test`, `build`; `AGENTS.md` updated; `prepare` kept.                                                                                 |
| 4   | MAJOR    | Contract test locks operations only                                       | Fixed in e8edf5e: exact field sets and types of `Property`, `WeatherData`, `CreatePropertyInput`, `PropertyFilter`.                                                                                     |
| 5   | MAJOR    | AC-FILTER-5 contradicts AC-FILTER-6 for a blank zip; blank state          | Fixed in e8edf5e: AC-FILTER-5 and AC-FILTER-6 reworded, AC-FILTER-9, AC-FILTER-10 and AC-FILTER-11 added, nothing renumbered.                                                                           |
| 6   | MAJOR    | `App.test.tsx` without a urql `Provider`, one module-level client         | Deferred to the web slice of wave 1, which owns `apps/web/**` and whose brief requires a client per test.                                                                                               |
| 7   | MINOR    | `weatherData: Record<string, unknown>`                                    | Rejected by the manager: no API code reads a single weather field; the object is validated at the adapter, stored whole and served by default resolvers.                                                |
| 8   | MINOR    | `useIndexSignature: true` adds `any` to generated types                   | Fixed in e8edf5e: removed; codegen and typecheck pass without it.                                                                                                                                       |
| 9   | MINOR    | SSE field parsing                                                         | Partly fixed in e8edf5e: the optional space after `event:` is accepted, with a test. "Last event field wins" rejected by the manager: one server, one observed format.                                  |
| 10  | MINOR    | Nothing tests the deadline                                                | Fixed in e8edf5e: the deadline is an injected value (default 2,700,000 ms) with a test on a stalled fetch. Added at the manager's request: the agent id and run id are logged after create, with a test. |
| 11  | MINOR    | Test names without criterion ids                                          | Fixed in e8edf5e as an exemption in `AGENTS.md` and `docs/SPEC.md` for tests of tooling and of the skeleton.                                                                                            |

## Round 2: APPROVE, no finding

- Prompt `docs/agent/slices/wave-0/13-review-prompt-round2.md`, raw reply `docs/agent/slices/wave-0/13-review-reply-round2.md` ("Nothing to fix.").
- Patch: `git diff fca2bd7 e8edf5e` without `package-lock.json` and `docs/agent/slices/**`, 19,521 bytes. The prompt listed the eleven findings with the outcome of each.
- Agent `bc-986e807d-a0dc-4696-85c4-3b429a7f92d6`, run `run-5702ed3a-e8b7-4777-a7c2-9f71d66f268d`, 836.5 seconds, status FINISHED.

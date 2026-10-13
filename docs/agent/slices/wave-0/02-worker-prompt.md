# Worker prompt 02: wave 0, round 2 (tests first, seen red)

You are the implementer of wave 0 of the CoverTree project. Working directory: the git worktree `c:/tmp/covertree-wave0`, branch `slice/wave-0`. Round 1 (manifests, configs, `apps/api/schema.graphql`, codegen configs) is committed and the conductor has run `npm install`, so `node_modules` exists and `npm run codegen` has produced the generated types. In this round you write the three tests of the brief and nothing that makes them pass. The conductor runs them, saves the red output, and only then dispatches the implementation round.

## Read first, in full

1. `docs/plan.md` (sections 3 to 9 and 11 to 15 bind this wave)
2. `docs/agent/briefs/wave-0.md`, sections "Tests (first)" and item 6 of "What to build"
3. `docs/agent/manager-state.md`, section "Environment facts" (the reviewer route)
4. The configs already in the tree: root `package.json`, `vitest.config.js`, `apps/api/vitest.config.ts`, `apps/web/vitest.config.ts`

Where this prompt and those files disagree, stop and say so in your final message instead of choosing.

## Hard rules

- Never open, read, print or copy `.env`. No network call of any kind. No real call to the Cursor API or to Weatherstack: every test stubs `fetch`.
- Do not write the implementation: no `scripts/grok-review.mjs`, no `apps/web/src/App.tsx`, no `apps/api/src/**` other than the one test file. The tests must fail because the thing under test does not exist or is wrong, not because of a typo in the test.
- Do not change any `package.json`, add no dependency, do not run `npm install`.
- Do not run `git add`, `git commit` or any history command. The conductor commits.
- Touch nothing under `docs/`.
- No code comments unless the code reads as a mistake without one. No long dashes (U+2013, U+2014) in any file.
- Test files must pass `npm run lint` and `npx prettier --check` once the implementation exists; imports of project files carry their extension (`.ts`, `.tsx`, `.mjs`).

## Test 1: the GraphQL contract, `apps/api/src/graphql/schema.contract.test.ts`

Reads `apps/api/schema.graphql` from disk (path resolved from `import.meta.url`), builds it with `buildSchema` from `graphql`, and asserts:

- the `Query` type has exactly the fields `properties` and `property`, the `Mutation` type exactly `createProperty` and `deleteProperty` (exact sets, so an added or renamed field fails);
- every argument with its type printed as SDL: `properties(filter: PropertyFilter, sort: PropertySort! = CREATED_AT_DESC): [Property!]!`, `property(id: ID!): Property`, `createProperty(input: CreatePropertyInput!): Property!`, `deleteProperty(id: ID!): Property!`. Assert argument names, argument types, the default value of `sort` and the return types;
- `UsState` has 51 values and contains `DC`; `PropertySort` has exactly `CREATED_AT_DESC` and `CREATED_AT_ASC`.

To show it red: after writing the test, rename the mutation `deleteProperty` to `removeProperty` in `apps/api/schema.graphql` and leave the file like that at the end of this round. Change nothing else in that file. The next round restores it.

## Test 2: the reviewer script, `scripts/grok-review.test.mjs`

The script `scripts/grok-review.mjs` does not exist yet. Write the test against this interface, which the next round implements exactly:

```js
// scripts/grok-review.mjs
export function parseArgs(argv)        // argv without node and script path; returns { model, params, promptFile, patchFile, outFile }; throws an Error with a usage message when a required argument is missing or a --param is malformed
export function buildCreateRequest({ model, params, promptText, patchText, apiKey })
                                       // returns { url, init } for fetch
export async function main(argv, { env, fetch, readFile, writeFile, log, now })
                                       // returns the process exit code (0 or non-zero); never calls process.exit itself
```

Behaviour the implementation will have, and the tests pin:

- Arguments: `--model <id>` (required, there is no default), `--prompt <file>`, `--patch <file>`, `--out <file>` (all required), and `--param <id>=<value>` (optional, repeatable; this is how reasoning effort is passed, for example `--param reasoning_effort=high`).
- `buildCreateRequest`: `url` is `https://api.cursor.com/v1/agents`; `init.method` is `POST`; headers `Content-Type: application/json` and `Authorization: Basic <base64 of "<apiKey>:">`; the JSON body is `{ "prompt": { "text": <text> }, "model": { "id": <model>, "params": [ { "id": <id>, "value": <value> }, ... ] } }`. `params` is omitted when no `--param` was given. The body has no `repos` key and no `env` key. `<text>` is the prompt file's content, then a blank line, then the patch inside a fenced `diff` block.
- `main` flow with the injected `fetch`:
  1. `POST /v1/agents` answers 201 with `{ "agent": { "id": "bc-1" }, "run": { "id": "run-1", "status": "RUNNING" } }`.
  2. `GET https://api.cursor.com/v1/agents/bc-1/runs/run-1/stream` with `Accept: text/event-stream` and the same `Authorization` header. The body is server-sent events; the ones that matter are `event: status` with `data: {"runId":"run-1","status":"FINISHED"}`, `event: result` with `data: {"runId":"run-1","status":"FINISHED","text":"...","durationMs":8827}`, and the last one, `event: done` with `data: {}`. Other events (`interaction_update`, `thinking`, `assistant`) appear in between and are ignored.
  3. `GET https://api.cursor.com/v1/agents/bc-1/runs/run-1` answers 200 with `{ "id": "run-1", "agentId": "bc-1", "status": "FINISHED", "durationMs": 8827, "result": "<the reply text>" }`.
  4. `writeFile(outFile, ...)` receives text that contains the model id, the params, the agent id, the run id, the status, the elapsed seconds (computed from the injected `now`), and after a separator line the `result` text verbatim, byte for byte.
  5. Returns 0.
- `main` returns non-zero and writes a message through `log` when: `--model` is missing (and makes no `fetch` call at all); `CURSOR_API_KEY` is missing from `env` (the message names the variable); the create call is not 2xx; the stream ends without a `done` event; the run status after `done` is not `FINISHED`; `fetch` rejects.
- The key never leaks: run `main` through the success path and through every failure path above with `env.CURSOR_API_KEY` set to a marker such as `MARKER-KEY-123`, and assert that neither the marker nor its base64 form (`Buffer.from('MARKER-KEY-123:').toString('base64')`) appears in anything passed to `log` or to `writeFile`. Include a failure path in which the stubbed `fetch` rejects with an error whose message contains the Authorization header value, and one in which a non-2xx response body echoes it: the script must not pass either through.

Write the stub `fetch` as a small function in the test that returns `Response` objects (global in Node 24); no mocking library, no network.

## Test 3: the web routes, `apps/web/src/App.test.tsx`

`apps/web/src/App.tsx` does not exist yet. The next round implements it with this interface: a named export `routes` (the route objects for React Router 8, three routes) and a named export `App`. The test renders the routes in a memory router (`createMemoryRouter` and `RouterProvider`, or whatever React Router 8 offers for tests: read the installed package's types in `node_modules/react-router`) at each of these entries and asserts the placeholder heading (`role` heading, level 1):

- `/` shows `Properties`
- `/properties/new` shows `New property`
- `/properties/abc-123` shows `Property details`

## Running

Try to run each test yourself and report what you saw. On this Windows machine your sandbox blocks process spawning with pipes, so plain `npx vitest` may fail with `spawn EPERM`; your global instructions name a wrapper (`node C:/Users/USER/.codex/tools/vitest-sandbox/vitest.mjs run <filter>`, run from the directory that holds the Vitest config). It was built for an older Vitest and may not work with Vitest 5 and Vite 8. If neither works, say exactly that and paste the error: the conductor runs the tests outside the sandbox either way. Do not work around a blocked binary.

## Final message

List every file you created or changed, the result of each run you attempted with the summary line or the error, and anything you could not follow. Facts only. Do not claim a check you did not run.

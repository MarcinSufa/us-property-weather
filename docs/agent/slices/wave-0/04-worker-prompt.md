# Worker prompt 04: wave 0, round 4 (fixes after the conductor's verification of round 3)

You are the implementer of wave 0 of the CoverTree project. Working directory: the git worktree `c:/tmp/covertree-wave0`, branch `slice/wave-0`. Round 3 (reviewer script, API skeleton, web skeleton) is in the working tree, not committed yet. The conductor read the diff and ran `npm run verify` outside your sandbox: format check and lint pass, the web build passes (Vite's native bundler loads), the reviewer script test (9) and the web route test (3) pass. Typecheck and one contract test fail. This round fixes those and five points from the conductor's reading of the diff. Nothing else changes.

Read `docs/agent/briefs/wave-0.md` and `docs/agent/slices/wave-0/03-worker-prompt.md` again before you start: the hard rules of round 3 still bind (no `.env`, no network, no `git add` or `git commit`, no new dependency, nothing under `docs/`, no long dashes, no comments unless the code reads as a mistake without one).

## Fixes

1. **Contract test and `graphql` 17** (`apps/api/src/graphql/schema.contract.test.ts`). Two defects in the test itself, so this time the test is what you change:
   - `tsc` fails: `src/graphql/schema.contract.test.ts(37,10): error TS2532: Object is possibly 'undefined'.`
   - The assertion on the default of `sort` reads `args[1]?.defaultValue`, which `graphql` 17 deprecates and leaves `undefined` for a schema built from SDL (see `node_modules/graphql/type/definition.d.ts`: `default` replaces `defaultValue`). Assert the default through the non-deprecated API so that the test fails when the SDL default is removed or changed and passes for `CREATED_AT_DESC`.
   Keep every other assertion as strict as it is. To show the new assertion is real, temporarily change the default in `apps/api/schema.graphql` to `CREATED_AT_ASC`, run the test, see it fail, restore the file, and report both results. The SDL file must end the round identical to HEAD (`git diff --stat apps/api/schema.graphql` prints nothing).

2. **`apps/web/src/us-states.ts` imports from the API package** (`../../api/src/graphql/generated/resolvers-types.ts`). The web app must not reach into `apps/api/src`. The brief says the file is typed against the generated enum of the web app's own codegen. The `client` preset leaves `UsState` out because no document uses it yet. Make the web codegen emit the schema's enum types: first look for an option of the installed `@graphql-codegen/client-preset` that does it (read its sources or types in `node_modules`). If none exists, add a second output to `apps/web/codegen.ts`, `src/graphql/generated/schema-types.ts`, with the `typescript` plugin (`enumsAsTypes: true`, `useTypeImports: true`); in that case, and only for that, add `@graphql-codegen/typescript` `^6.1.2` to the `devDependencies` of `apps/web/package.json` (the package is already installed for the API, so nothing new enters the lockfile except this one manifest line; the conductor re-runs `npm install`). Then import `UsState` from the web's generated folder, run `npm run codegen`, and keep `satisfies Record<UsState, string>`.

3. **Placeholder noise in the API skeleton.** The bodies carry `void _x;` lines and `await Promise.resolve();` only to satisfy lint. Remove them:
   - in `eslint.config.js`, configure `@typescript-eslint/no-unused-vars` with `argsIgnorePattern: '^_'` for the TypeScript files, then delete every `void _name;` line and `void this.options;`;
   - the two promise-returning methods (`PropertyService.create`, `WeatherstackProvider.getCurrentWeather`) keep their declared return types, drop `async` and the fake `await`, and return `Promise.reject(new Error('not implemented'))`.
   Signatures, names and exported types stay exactly as they are.

4. **`apps/api/src/main.ts`.** Move the one comment about wave 1 from the end of the file to directly above the placeholder wiring it explains (the repository built without a database and the provider built with empty options), in one or two lines. Nothing else in the file changes.

5. **`scripts/grok-review.mjs`: failures say too little to act on.** Today every failure logs a fixed sentence. Keep the redaction and change the messages:
   - a non-2xx answer (create, stream or run) logs which of the three calls failed, the HTTP status code, and the first 500 characters of the response body after `scrub`;
   - the `catch` block logs the error's `name` and `message` after `scrub`, and for the deadline also the elapsed seconds as now;
   - a run that ends with a status other than `FINISHED` logs that status.
   Add or extend tests in `scripts/grok-review.test.mjs` first, see them fail, then change the script: the 401 case asserts that the log contains `401` and still contains neither the marker key nor its base64 form; the rejected-fetch case asserts that the log contains the error's own words (`Request failed`) and neither secret; the `FAILED` status case asserts that the log contains `FAILED`. Report the red and the green summary lines.

## Check before you finish

Run and report honestly: `npm run format:check`, `npm run lint`, `npm run typecheck`, `npm run codegen`, the three test files through the Vitest wrapper of your global instructions. `npm run build` fails in your sandbox with `spawn EPERM`; the conductor runs it.

## Final message

Files changed, each command with its summary line or error, the red and green results asked for in fixes 1 and 5, which route you took in fix 2 and why, and anything you could not do. Facts only. Do not claim a check you did not run.

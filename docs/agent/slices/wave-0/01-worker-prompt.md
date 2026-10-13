# Worker prompt 01: wave 0, round 1 (workspace manifests, configs, contract files)

You are the implementer of wave 0 of the CoverTree project. Your working directory is the git worktree `c:/tmp/covertree-wave0`, branch `slice/wave-0`. A conductor dispatched you, verifies your work afterwards and commits it. This is round 1 of several: in this round you write manifests, configuration and the contract files only. No application code, no tests, no `npm install`.

## Read first, in full

1. `docs/plan.md` (the approved design; sections 3 to 9 and 11 to 15 bind this wave)
2. `docs/agent/briefs/wave-0.md` (the binding spec of the slice)

Where this prompt and those two files disagree, stop and say so in your final message instead of choosing.

## Hard rules

- Never open, read, print or copy `.env`. It holds real secrets. You only write `.env.example`.
- No network call of any kind. Do not run `npm install`, `npm ci` or `npx`: the conductor installs after this round. `node_modules` does not exist yet, so do not try to run lint, tests or codegen in this round.
- Do not run `git commit`, `git add`, `git push` or any history command. The conductor commits. Exception: the one `git mv` below; if it fails because of your sandbox, use a plain `mv` and say so.
- Touch nothing under `docs/agent/` and do not edit `docs/plan.md`.
- No dependency other than the list below. If you believe one is missing, do not add it: name it in your final message.
- No code comments unless the code reads as a mistake without one. No long dashes (U+2013, U+2014) in any file: use a comma, colon, parentheses or a plain hyphen.
- Use forward slashes in every path and script. Scripts must work in Git Bash and in `cmd` on Windows and on Linux: no shell features beyond `&&`.

## What to write in this round

### 1. Root

- `package.json`: `"private": true`, `"type": "module"`, name `covertree`, workspaces `["apps/api", "apps/web", "e2e"]`, `engines.node` `">=24"`.
  Scripts:
  - `dev`: starts the API and the web app together with `concurrently` (named, and killing the other when one exits).
  - `format`: `prettier --write .`; `format:check`: `prettier --check .`
  - `lint`: `eslint .`
  - `typecheck`: runs `tsc --noEmit` for each workspace that has TypeScript (`apps/api`, `apps/web`, `e2e`).
  - `codegen`: runs the codegen of `apps/api` and `apps/web`.
  - `test`: runs the Vitest suites of `apps/api` and `apps/web` once (not in watch mode) and the test of `scripts/` (see 5).
  - `build`: builds the web app.
  - `e2e`: runs Playwright in the `e2e` workspace.
  - `verify`: runs, in exactly this order and stopping at the first failure: format check, lint, typecheck, codegen, tests, web build.
  - `prepare`: runs `npm run codegen`. Reason: generated types are not committed, and lint and typecheck come before codegen in `verify`, so a fresh `npm ci` must leave generated files in place.
- `.nvmrc`: `24`
- `tsconfig.base.json`: `strict`, `noUncheckedIndexedAccess`, `erasableSyntaxOnly`, `verbatimModuleSyntax`, `allowImportingTsExtensions`, `noEmit`, `skipLibCheck`, `isolatedModules`, target `ES2024` or newer. Imports between project files carry the `.ts` (or `.tsx`) extension, because Node 24 executes the API's `.ts` files directly with no build step.
- `eslint.config.js` (flat config, plain JavaScript ESM, so no extra loader is needed): `@eslint/js` recommended, `typescript-eslint` `recommendedTypeChecked` with `projectService`, applied to `.ts` and `.tsx`; plain `.js` and `.mjs` files linted without type information. Ignore `node_modules`, `dist`, generated code, `docs/**`, `.claude/**`. No React-specific ESLint plugin (none is in the plan).
- `.prettierrc.json` (single quotes, semicolons, trailing commas, print width 100) and `.prettierignore` (node_modules, dist, generated code, `package-lock.json`, `docs/agent/**`, `docs/design/**`, `docs/brief/**`, `.claude/**`, `.exovault/**`).
- `.gitignore`: keep every existing line, add `dist/`, the generated-code paths, `data/`, `test-results/`, `playwright-report/`.
- `.env.example`: the six variables of plan section 9 with their defaults, `WEATHERSTACK_API_KEY=` with no value, one short line above it saying where the key comes from.
- `git mv cover-tree.md docs/brief/cover-tree.md`

### 2. `apps/api`

- `package.json`: name `@covertree/api`, private, `"type": "module"`. Scripts: `dev` (`node --watch --env-file=../../.env src/main.ts`), `start` (same without `--watch`), `codegen` (`graphql-codegen --config codegen.ts`), `typecheck`, `test` (`vitest run`).
- `tsconfig.json` extending the base: `module` and `moduleResolution` `nodenext`, `types: ["node"]`, includes `src`, `codegen.ts`, `vitest.config.ts`.
- `vitest.config.ts`: node environment, tests are `src/**/*.test.ts`.
- `schema.graphql`: the SDL of plan section 5, character for character (copy the fenced block exactly, including descriptions, the one-line enums and the blank lines; no reformatting). Add `apps/api/schema.graphql` to `.prettierignore` so the formatter never rewrites it.
- `codegen.ts`: schema `./schema.graphql`, output `src/graphql/generated/resolvers-types.ts` with plugins `typescript` and `typescript-resolvers`. Config must produce code that passes `erasableSyntaxOnly` and `verbatimModuleSyntax`: `enumsAsTypes: true`, `useTypeImports: true`, `useIndexSignature: true`. Do not add mappers in this round.

### 3. `apps/web`

- `package.json`: name `@covertree/web`, private, `"type": "module"`. Scripts: `dev` (`vite`), `build` (`vite build`), `codegen`, `typecheck`, `test` (`vitest run`).
- `tsconfig.json` extending the base: `module` `esnext`, `moduleResolution` `bundler`, `jsx` `react-jsx`, `lib` with `DOM` and `DOM.Iterable`, `types` for Vite client and Node as needed.
- `vite.config.ts`: the React plugin, dev server on port 5173 with `strictPort`, and a proxy of `/graphql` to `http://localhost:4000`.
- `vitest.config.ts`: `jsdom` environment, a setup file `src/test-setup.ts` that imports `@testing-library/jest-dom/vitest`, tests are `src/**/*.test.{ts,tsx}`. Write that one-line setup file too.
- `index.html` with a root element and the module script `/src/main.tsx` (the file itself comes in a later round).
- `codegen.ts`: schema `../api/schema.graphql`, documents `src/**/*.{ts,tsx}` (ignoring the generated folder, and tolerant of zero documents so far: `ignoreNoDocuments: true`), output `src/graphql/generated/` with the `client` preset. Config for `erasableSyntaxOnly` and `verbatimModuleSyntax`: `enumsAsTypes: true`, `useTypeImports: true`; generated imports must resolve under `moduleResolution: bundler` with `allowImportingTsExtensions`.

### 4. `e2e`

- `package.json`: name `@covertree/e2e`, private, `"type": "module"`, script `test` (`playwright test`), devDependency `@playwright/test`. Nothing else in this round: no config, no spec, no browser download. Because there is no TypeScript file there yet, leave `e2e` out of the root `typecheck` for now and say so in your final message.

### 5. `scripts`

The reviewer script `scripts/grok-review.mjs` and its test `scripts/grok-review.test.mjs` come in the next rounds. In this round only make sure a Vitest run can find it: add a root `vitest.config.js` whose `include` is `scripts/**/*.test.mjs` (node environment), and let the root `test` script run it together with the two apps.

### Dependencies: exactly these, with these version ranges

Checked against the npm registry by the conductor today (2026-10-13). TypeScript stays on 6.0 because `typescript-eslint` 8.71.2 accepts only TypeScript below 6.1.0.

Root `devDependencies`:
`typescript` `~6.0.3`, `eslint` `^10.12.0`, `@eslint/js` `^10.0.1`, `typescript-eslint` `^8.71.2`, `prettier` `^3.9.10`, `concurrently` `^10.0.6`, `@types/node` `^24.19.2`, `vitest` `^5.0.4`

`apps/api` `dependencies`: `graphql` `^17.0.2`, `graphql-yoga` `^5.24.4`, `zod` `^4.6.7`, `pino` `^10.4.0`
`apps/api` `devDependencies`: `@graphql-codegen/cli` `^7.4.6`, `@graphql-codegen/typescript` `^6.1.2`, `@graphql-codegen/typescript-resolvers` `^6.1.1`, `vitest` `^5.0.4`

`apps/web` `dependencies`: `react` `^19.3.0`, `react-dom` `^19.3.0`, `react-router` `^8.4.0`, `urql` `^5.0.4`, `@urql/core` `^6.0.3`, `graphql` `^17.0.2`
`apps/web` `devDependencies`: `vite` `^8.3.4`, `@vitejs/plugin-react` `^6.1.2`, `vitest` `^5.0.4`, `jsdom` `^30.1.2`, `@testing-library/react` `^16.3.3`, `@testing-library/dom` `^10.4.2`, `@testing-library/user-event` `^14.6.8`, `@testing-library/jest-dom` `^7.0.1`, `msw` `^3.0.3`, `@types/react` `^19.3.0`, `@types/react-dom` `^19.3.0`, `@graphql-codegen/cli` `^7.4.6`, `@graphql-codegen/client-preset` `^6.2.3`

`e2e` `devDependencies`: `@playwright/test` `^1.64.0`

## Not in this round

`src/**` of either app (except `apps/web/src/test-setup.ts`), any test, `scripts/grok-review.mjs`, `AGENTS.md`, `CLAUDE.md`, `docs/SPEC.md`, `README.md`, `.github/**`, `e2e` config.

## Final message

List every file you created or changed, every place you could not follow this prompt and why, and anything you were unsure about (a config key whose exact name you could not confirm without the package installed, for example). Facts only. Do not claim a check you did not run.

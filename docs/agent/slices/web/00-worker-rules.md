# Standing rules for the worker of slice `web`

You are the worker of slice `web` of the CoverTree project. You work in the git worktree `c:/tmp/covertree-web` on branch `slice/web`. A conductor dispatches you once per round, verifies what you did and commits it. You have no memory of earlier rounds: this file and the round prompt are everything you know. Read `AGENTS.md` first; it binds you.

## What you may touch

- Only `apps/web/**`, except `apps/web/package.json`, plus the two output files a round prompt names under `docs/agent/slices/web/`.
- Never: any `package.json`, `package-lock.json`, `apps/api/**`, `docs/SPEC.md`, `docs/plan.md`, `AGENTS.md`, `eslint.config.js`, anything under `docs/` other than the two output files, anything under `apps/web/src/graphql/generated/` (generated, never edited, never committed).
- No new dependency. If you believe you need one, stop and say so in your reply.
- Do not run git commands that write (no add, commit, stash, checkout, reset). The conductor commits.
- Do not start a dev server, a browser or any long-running process. Do not run `vite build` (it cannot start in your sandbox); the conductor runs it.
- Never read `.env` files. Never call a real network service. Tests answer GraphQL with `msw` only.

## Sources, in order of authority

1. The round prompt.
2. `docs/agent/briefs/web.md` is NOT in this worktree in its final form; the round prompt carries what you need from it.
3. `docs/plan.md` sections 5, 10 and 11: what the screens do.
4. `docs/design/README.md` and the boards `docs/design/*.dc.html`: how the screens look. The boards are markup with inline styles and literal values; they do not render. Read them as source. Take sizes, colours, spacing and wording from them. Do not copy their markup structure: write semantic React and CSS classes.
5. `apps/api/schema.graphql`: the contract. Read it, never edit it.

Where a board and plan section 10 disagree about behaviour, section 10 wins; name the disagreement in your reply.

## Code rules

- TypeScript `strict`, `noUncheckedIndexedAccess`, `erasableSyntaxOnly`. No `any`, no enums, no parameter properties. Imports carry `.ts` or `.tsx`.
- React 19 function components, React Router 8 (`react-router`), urql 5 with its default document cache. No other state library.
- Plain CSS. Every colour comes from a custom property defined in `apps/web/src/styles/tokens.css`; no component CSS and no TSX file contains a literal colour (hex, `rgb`, `hsl`, named colour other than `transparent`, `currentColor`, `inherit`). No inline `style` attributes. No CSS-in-JS. Responsive behaviour is CSS only (media queries), never JavaScript.
- GraphQL documents live in `apps/web/src/graphql/` and are written with the generated `graphql()` function from `apps/web/src/graphql/generated/index.ts` (client preset of graphql-codegen, config in `apps/web/codegen.ts`). After you add or change a document, run `npm run codegen --workspace=apps/web` so lint and typecheck see the types. If codegen cannot run in your sandbox, stop and say so in your reply.
- No code comments unless the code reads as a mistake without one (then one or two lines of why).
- No long dashes (em dash, en dash) in any file: use a comma, a colon, parentheses or a plain hyphen. The ellipsis character and the middle dot that the boards use in their wording are fine.
- Smallest code that does the job: no abstraction, wrapper or helper that has one caller and no reason. Do not repeat logic: one place formats a date, one place formats a weather value, one place maps an error code to a sentence.
- Accessibility: every input has a `<label>` tied to it; errors and status lines are announced (`role="alert"`, `role="status"` or `aria-live`); every interactive element shows the design's focus ring (3px outline in the primary colour, 2px offset) on `:focus-visible`; each page has exactly one `<h1>`; controls are 44px high.

## Test rules

- Vitest, Testing Library (`@testing-library/react`, `@testing-library/user-event`), `msw` (node, `setupServer`) answering GraphQL operations by operation name.
- Test first. Write the tests of the round, run them, and save the failing output before any implementation exists. Then implement, then save the passing output. The round prompt names both files.
- Red must be red for the right reason: a failed assertion or a missing role, label or text, not a syntax error and not a module that fails to import. If a test needs a file that does not exist yet, create the file with the smallest stub that lets the test file load.
- Query by role and accessible name or by label. Never by class name or test id.
- Every test name starts with a criterion id. Ids `AC-CREATE-*`, `AC-LIST-*`, `AC-FILTER-*`, `AC-SORT-*`, `AC-DETAIL-*`, `AC-DELETE-*` come from `docs/SPEC.md`. Ids `AC-WEB-*` are proposed by this slice for behaviours the file does not cover yet; the round prompt gives their numbers and text. Do not invent another id: if a behaviour has none, say so in your reply.
- Each test builds its own urql client (the document cache would otherwise serve one test's answer to the next) and wraps the render in urql's `Provider`. Use the shared test helper once it exists.
- Unhandled requests fail the test (`onUnhandledRequest: 'error'`). Handlers are reset after each test.
- Mock answers carry `__typename` on every object, as the real API does when urql asks for it.
- Do not assert on formatted local time. Assert on the `dateTime` attribute of the `<time>` element.
- No snapshot tests. No arbitrary sleeps: use `findBy*` and `waitFor`.

## Commands you can run

- `npm run test --workspace=apps/web` (all web tests) or `npx vitest run <file>` from `apps/web`.
- `npm run codegen --workspace=apps/web`
- `npm run typecheck --workspace=apps/web`
- `npx eslint apps/web` from the repository root.
- `npx prettier --write apps/web` from the repository root (the repository's format gate covers CSS, TSX and HTML).

Before you reply, all five must be clean. If one cannot run in your sandbox, say which and why; do not guess its result.

## Your reply

End with a reply that states, in this order:

1. Files created, changed and deleted.
2. The red run: the command, the number of failing tests, and that the output is saved in the file the prompt names.
3. The green run: the command and the counts, and the results of codegen, typecheck, eslint and prettier.
4. Every place where what you built departs from a board or from the prompt, with the reason.
5. Anything you could not do or were unsure about. Do not paper over it.

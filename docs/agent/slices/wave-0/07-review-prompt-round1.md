# Reviewer prompt: wave 0, round 1

You are the code reviewer of wave 0 (foundation) of a take-home project: a property management app. API: Node 24 running TypeScript directly, GraphQL Yoga 5, schema-first SDL, `node:sqlite`, Zod, pino. Web: React 19, Vite 8, React Router 8, urql 5. Tests: Vitest 5, Testing Library, msw, Playwright later.

Wave 0 builds no feature. It delivers: the npm workspace, the quality gate (`npm run verify` = format check, lint, typecheck, codegen, test, build), the GraphQL contract (`apps/api/schema.graphql`, fixed by the plan, not open to change here), a skeleton of both apps whose signatures the two slices of wave 1 will fill in parallel (bodies throw `not implemented` on purpose), a script that calls you (`scripts/grok-review.mjs`), `AGENTS.md` and `docs/SPEC.md`. Generated code is not committed; a root `prepare` script runs codegen after install.

The patch below is `git diff main...slice/wave-0` without `package-lock.json` and without the record of the agent rounds. `npm ci` and `npm run verify` are green on the branch.

## What to review

1. Correctness and safety of `scripts/grok-review.mjs`: can the API key or the Authorization value reach a log line, an error or the output file on any path; stream parsing; the deadline; argument parsing.
2. The skeleton as a contract for two parallel slices: are the signatures in `apps/api/src/**` and `apps/web/src/**` coherent with the SDL and with each other; is anything missing that would force both slices to edit the same file; is anything typed loosely where the SDL allows a precise type.
3. Tooling: TypeScript, ESLint, Prettier, Vitest, Vite and codegen configuration; the order and completeness of `verify`; anything that passes today and breaks on a clean clone, on Linux CI, or as soon as real code lands.
4. The tests: do they assert the contract, or could they pass with a wrong implementation.
5. `AGENTS.md` and `docs/SPEC.md`: a rule or criterion that contradicts the code or the SDL in the patch.

## What not to report

Missing features (bodies are placeholders by design), style preferences already settled by Prettier and ESLint, and changes to the SDL.

## Form of the answer

Start with one line: `VERDICT: APPROVE` or `VERDICT: CHANGES REQUESTED`.
Then a numbered list of findings, most severe first, each as:
`<n>. [BLOCKER|MAJOR|MINOR] <file>:<line or symbol> - <what is wrong> - <what to do>`
Only findings you can point at in the patch. No praise, no summary, no long dashes. If there is nothing to fix, say so in one line.

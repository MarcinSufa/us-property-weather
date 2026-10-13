Implemented the round 1 manifests, configuration, and contract files. The schema matches plan section 5, apart from line endings.

**Created or changed**

- Root: `.env.example`, `.nvmrc`, `.prettierignore`, `.prettierrc.json`, `eslint.config.js`, `package.json`, `tsconfig.base.json`, `vitest.config.js`; updated `.gitignore`.
- API: `apps/api/package.json`, `apps/api/tsconfig.json`, `apps/api/vitest.config.ts`, `apps/api/codegen.ts`, `apps/api/schema.graphql`.
- Web: `apps/web/package.json`, `apps/web/tsconfig.json`, `apps/web/vite.config.ts`, `apps/web/vitest.config.ts`, `apps/web/codegen.ts`, `apps/web/index.html`, `apps/web/src/test-setup.ts`.
- E2E: `e2e/package.json`.
- Moved `cover-tree.md` to `docs/brief/cover-tree.md`.

`git mv` failed because the sandbox could not create the worktree index lock, so I used the prompt’s permitted PowerShell move fallback. The root typecheck omits `e2e` because it has no TypeScript files yet. No package lock was created.

I did not install dependencies or run codegen, lint, tests, or builds. The existing untracked `docs/agent/slices/` entry was left untouched.
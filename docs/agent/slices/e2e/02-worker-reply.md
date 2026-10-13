Updated `e2e/playwright.config.ts` so Vite’s bin path is resolved from `apps/web` using Node’s `createRequire`, then derived from the resolved `vite/package.json`. Vite exports that metadata path, but does not export `bin/vite.js`. The command quotes the resolved path for checkouts whose path contains spaces.

I removed the repeated host, port, and strict-port flags. `apps/web/vite.config.ts` already sets port `5173` and `strictPort`; Playwright’s readiness URL and `baseURL` both use `localhost`.

The other checked runtime settings are consistent: the stub runs from `e2e`, the API runs from `apps/api` with its test environment supplied, and the temporary database path is passed to the API.

**Requested checks:**

- `npx prettier --check e2e .github package.json` - passed.
- `npx eslint e2e` - passed.
- `npm run typecheck` - passed for the API, web, and E2E workspaces.

I did not start a server or run Playwright, as the slice instructions prohibit that. In the next run, the conductor should check that Vite starts from the resolved bin path and that its `localhost:5173` readiness check succeeds.
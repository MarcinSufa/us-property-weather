# Worker prompt 02, slice `e2e`: the web server of the suite does not start

You are the worker of slice `e2e` of the CoverTree project, in the git worktree `c:/tmp/covertree-e2e` on branch `slice/e2e`. You have no memory of the earlier round. Read `AGENTS.md`, `docs/agent/briefs/e2e.md` and `docs/agent/slices/e2e/01-worker-prompt.md` (the rules of that prompt bind this round unchanged: what you may touch, the code rules, no server and no `playwright test` started by you), then the files of the slice as they stand: `e2e/playwright.config.ts`, `e2e/weatherstack-stub.ts`, `e2e/stories.spec.ts`.

## What the conductor saw

`npm run e2e` from the repository root, first run, exit 1, before any test ran. Full output in `docs/agent/slices/e2e/01-first-run-output.txt`. The cause:

```
[WebServer] Error: Cannot find module 'C:\tmp\covertree-e2e\apps\web\node_modules\vite\bin\vite.js'
Error: Process from config.webServer was not able to start. Exit code: 1
```

The config starts Vite as `node node_modules/vite/bin/vite.js` with `cwd` at `apps/web`. npm workspaces hoist `vite` to the root `node_modules`; `apps/web/node_modules/vite` does not exist. A literal path to the root `node_modules` would work today and break when npm stops hoisting it.

## What to do

1. Start Vite with `node` on its bin file found through Node's own resolution from the web workspace (for example `createRequire` anchored at `apps/web/package.json`, resolving `vite/package.json` and joining `bin/vite.js`, after you checked in `node_modules/vite/package.json` what its `exports` allow), with `cwd` at `apps/web`. Quote the path in the command so a checkout path with a space works.
2. The command passes `--host 127.0.0.1 --port 5173 --strictPort` while `apps/web/vite.config.ts` already sets port 5173 and `strictPort`, and the readiness URL and `baseURL` are `http://localhost:5173`. Either drop the flags that repeat the config, or state in your reply why each is needed. If you keep `--host 127.0.0.1`, the readiness URL and `baseURL` must name the same host, because on a Linux runner `localhost` may resolve to `::1` first.
3. Read the rest of the config and the spec once more for anything else that can only fail at run time (a path, a `cwd`, an environment name) and fix what you find. Change nothing that works.

Run `npx prettier --check e2e .github package.json`, `npx eslint e2e` and `npm run typecheck`, and report the real results.

## Reply

What you changed and why, each command with its real result, and what the conductor should watch in the next run.

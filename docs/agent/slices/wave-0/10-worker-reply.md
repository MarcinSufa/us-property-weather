Changed [grok-review.mjs](/C:/tmp/covertree-wave0/scripts/grok-review.mjs) and [grok-review.test.mjs](/C:/tmp/covertree-wave0/scripts/grok-review.test.mjs). The script now uses the default export from `node:console`. The new test starts the real script with `process.execPath`, with `CURSOR_API_KEY` removed from its environment.

**Red and green:** Before the fix, plain Node failed with the reported `SyntaxError` for the named `console` export. After the fix, direct execution prints the usage error and exits 1. The new test itself could not verify that result: the sandbox blocks its child process with `spawnSync ... EPERM`. The test run reports 9 passed and 1 failed because `result.status` is `null`; the conductor will need to run it outside the sandbox.

**Checks:**

- `npm run format:check` - passed.
- `npm run lint` - passed.
- `node C:/Users/USER/.codex/tools/vitest-sandbox/vitest.mjs run scripts/grok-review.test.mjs` - 9 passed, 1 blocked by `EPERM`.
- `node --input-type=module -e "await import('./scripts/grok-review.mjs')"` - passed (`module import ok`).
- `node scripts/grok-review.mjs` - exited 1; output:

```text
Error: Usage: node scripts/grok-review.mjs --model <id> --prompt <file> --patch <file> --out <file> [--param <id>=<value>]
```

I checked the script's other built-in imports by loading it with Node; the module import succeeded.
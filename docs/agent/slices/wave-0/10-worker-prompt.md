# Worker prompt 10: wave 0, round 7 (the reviewer script does not start)

Working directory: the git worktree `c:/tmp/covertree-wave0`, branch `slice/wave-0`. The hard rules of `docs/agent/slices/wave-0/03-worker-prompt.md` still bind (no `.env`, no network, no `git add` or `git commit`, no new dependency, nothing under `docs/`, no long dashes, no comments unless the code reads as a mistake without one).

## Defect

The conductor ran the script for the first real review and Node 24.16.0 refused to load it:

```
file:///C:/tmp/covertree-wave0/scripts/grok-review.mjs:2
import { console } from 'node:console';
         ^^^^^^^
SyntaxError: The requested module 'node:console' does not provide an export named 'console'
```

The nine tests pass because Vitest's module interop accepts the named import; plain Node does not. So the suite never proved that the file runs as a program.

## Fix, test first

1. In `scripts/grok-review.test.mjs`, add a test that starts the real program with plain Node and no arguments (`execFile` or `spawnSync` of `process.execPath` with the script path, an environment without `CURSOR_API_KEY`), and asserts: the exit code is 1, the combined output contains the usage line, and it contains no `SyntaxError`. No network is touched on that path. Run it and see it fail for the reason above. If your sandbox refuses to spawn a process (`EPERM`), say so; the conductor then runs the red and the green outside the sandbox, and you still write the test and the fix.
2. Fix the import in `scripts/grok-review.mjs`. Check every other import of the file against what the Node 24 built-in modules really export (`node:buffer`, `node:process`, `node:util`, `node:url`, `node:fs/promises`), by loading the file with `node` if you can. Change nothing else in the script.
3. See the new test and the nine old ones pass.

## Check before you finish

`npm run format:check`, `npm run lint`, and the reviewer script test file through the Vitest wrapper of your global instructions. Also run `node scripts/grok-review.mjs` with no arguments and paste its output and exit code.

## Final message

Files changed, the red and green summary lines, each command with its result, anything you could not run. Facts only.

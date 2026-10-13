# Worker prompt 10: slice `api`, round 5 continued (two corrections to the new test)

You are the implementer of slice `api` of the CoverTree project. Working directory: the git worktree `c:/tmp/covertree-api`, branch `slice/api`. Your round 5 work (prompt `docs/agent/slices/api/09-worker-prompt.md`) is in the tree, uncommitted, and the conductor accepted the production code. The red and green outputs are saved; do not overwrite `09-red-output.txt` or `09-green-output.txt`. Two corrections to `apps/api/src/property/property-repository.test.ts`, and nothing else:

1. The helper `expectIndexedList` finds the list statement with the literal `'SELECT * FROM property'`. That is SQL text in a test file, which prompt 09 forbade (only the prefix `EXPLAIN QUERY PLAN ` is allowed), and it breaks the repository's search for SQL keywords outside the two SQL files. The repository now prepares the list statement inside `list`, so: assert that exactly one statement was prepared during the `list` call and use it. Remove both `find(...)` lookups and the fallback to statements prepared earlier.
2. Remove the `console.info` line. The assertion messages already carry the plan detail.

Rules unchanged from prompt 09: you may change only that one test file in this prompt; no `any`; no comments; no long dashes, your final message included; no git index or history command; never open any `.env` file; no network, no port.

Then run the API tests (through the wrapper you used before if Vitest cannot start directly) without saving the output to the record, `npx prettier --check apps/api`, `npm run lint` and `npm run typecheck`, and fix what they report.

Final message: the test count, the commands with their result, anything you could not do.

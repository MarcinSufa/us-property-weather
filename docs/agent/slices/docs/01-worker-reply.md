Wrote:

- [README.md](/C:/tmp/covertree-docs/README.md)
- [docs/agent/skills/README.md](/C:/tmp/covertree-docs/docs/agent/skills/README.md)

`npx prettier --check README.md` passed.

### to check in wave 2

- `README.md`, Run it: confirm the local API and web URLs and run commands against a fresh clone.
- `README.md`, Test it: confirm the verifier’s coverage and order, the test coverage described in the table, and the Playwright and manual service checks.
- `README.md`, Environment variables: confirm startup validation, logging, stub configuration, and database path behavior in the implementation.
- `README.md`, Example GraphQL operations: run the six examples against the completed API; the schema validates their shapes.
- `README.md`, Architecture: confirm the described boundaries and provider-call behavior in the implementation and tests.
- `README.md`, Stack and why: confirm the final workspace dependencies and versions match the table.
- `README.md`, Trade-offs and what comes next: confirm the listed deferrals; verify the `npm audit` count and `braces` finding; the AWS Lambda path is descriptive and unbuilt.
- `README.md`, How AI was used: confirm the described workflow and record contents. `scripts/export-sessions.ts`, `docs/agent/review-log.md`, `docs/agent/session-metrics.md`, and `docs/agent/sessions/` are not present in this worktree yet.
- `README.md`, Skills: confirm the skill-use descriptions against the completed records.
- `docs/agent/skills/README.md`, Copied and Described only: the local source notes support the copied-skill provenance; confirm the described skill-use facts against the completed records.

### Instruction differences

The requested section 11 wording changes the `npm run verify` order from both the current `docs/plan.md` and `AGENTS.md`. The requested section 14 wording adds a brief file alongside the handoff file; the current plan mentions only the handoff file. I followed the worker prompt’s specified wording for the README.
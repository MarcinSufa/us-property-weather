# Brief: slice `docs`, the README draft and the skills used

Wave 1. Conductor rules: `docs/agent/handoffs/wave-1.md`. Binding design: `docs/plan.md`, all of it: this slice describes what the plan says will exist. It is finished in wave 2 against what was built.

## Owns

`README.md` at the repository root and `docs/agent/skills/**`. Nothing else.

## What to build

1. `README.md`, a draft a stranger can follow, in this order:
   - What it is, in three sentences, and the six user stories.
   - Run it: the commands of plan section 12, the Node version, where the key goes. Nothing else is needed.
   - Test it: `npm run verify` and `npm run e2e`, what each covers (plan section 11 as a short table).
   - Environment variables: the table of plan section 9.
   - Example GraphQL operations: one per story, written against `apps/api/schema.graphql`.
   - Architecture: the Mermaid diagram of plan section 4 and its six rules, each in one sentence.
   - Stack and why: the table of plan section 3, shortened to choice, reason and what was rejected.
   - Trade-offs and what comes next: plan section 17, each deferral with one sentence on why. Includes the path to AWS Lambda as a description.
   - How AI was used: the roles of plan section 14, the loop of one slice, where the record lives (`docs/agent/`, with a line per subfolder), and a placeholder section "Where an agent was wrong and how it was caught", marked as filled in wave 2 from the review logs. Do not invent incidents.
   - Skills: which were used, which are copied under `docs/agent/skills/`, which are described only and why.
2. `docs/agent/skills/`: copies of the public skills that were invoked in this project, skill files only, not whole upstream repositories. The conductor makes the copies itself (copying existing files is not implementation); the worker writes `docs/agent/skills/README.md`.
   - Invoked so far, counted from the session files by the manager: `grilling`, `i-have-adhd`, `handoff`, `conduct`, `conduct-binding`. The session-start text of `superpowers` was injected but none of its skills was invoked.
   - Copy: `grilling` and `handoff`, each with its source URL, the commit or version, the licence notice, and for `grilling` a line saying it is a locally modified copy.
   - Describe only: `conduct`, `conduct-binding` and `exo-compact` (private repositories), each with what it does in this project in two sentences.
   - `i-have-adhd`: its public origin is inferred, not confirmed. Describe it only, and say in the report that a copy waits for Marcin's confirmation.
   - Before copying, read each file: a skill file that names a client, a person, an email address or a private path is not copied; say which in the report.

## Rules for the text

- Plain sentences. No long dashes. No praise of the project. Every command in a code block exactly as typed.
- State as fact only what the plan fixes. What depends on a later slice is written the way the plan says it will be and listed in the report under "to check in wave 2".
- Nothing about the person who assessed the work, nothing from the private parts of the brief.

## Tests

No test framework here. The checks, run by the conductor and saved in the slice record:

- Every npm script the README names exists in the root `package.json`.
- Every path the README names exists on `main` or is listed under "to check in wave 2".
- Every example operation is valid against `apps/api/schema.graphql` (a short node check with the `graphql` package already installed).
- A search for long dashes and for the email pattern in the owned paths finds nothing.
- `npm run verify` green (the format check covers Markdown).

## Done when

- The checks above pass and their output is in `docs/agent/slices/docs/`.
- The diff touches only the owned paths and the slice record.

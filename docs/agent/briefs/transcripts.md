# Brief: slice `transcripts`, session export with redaction

Wave 1. Conductor rules: `docs/agent/handoffs/wave-1.md`. Binding design: `docs/plan.md` section 13 and the decisions-log row on redacted transcripts. This brief adds what they leave open.

## Why this slice is careful

The raw session files of this project carry context that is not Marcin's to publish: hook output and reminders injected from unrelated client work, his email address, his private global instructions, tool output listing other sessions. The export must drop that by structure, not by hoping a phrase list catches it.

Two rules follow, and they bind the conductor:

- The worker never reads a real session file and never receives text from one. It works on synthetic fixtures. The conductor may look at the real files to learn their record shapes, and describes the shapes to the worker with invented content only.
- No real export is committed by this slice. The final export is run by the manager in wave 2.

## Owns

`scripts/export-sessions.ts`, its test and its fixtures under `scripts/`, one new line in `.gitignore` (`banned-phrases.local.txt`), `docs/agent/sessions/README.md`. The folder `docs/agent/sessions/` and `docs/agent/session-metrics.md` are filled in wave 2.

## Input

Claude Code writes one JSON Lines file per session, and one per subagent under `<session id>/subagents/agent-<id>.jsonl` with a `.meta.json` beside it. Record types seen in this project: `user`, `assistant`, `system` (subtypes `compact_boundary`, `stop_hook_summary`), `attachment`, and bookkeeping types (`ai-title`, `queue-operation`, `file-history-snapshot`, `file-history-delta`, `last-prompt`, and others). `message.content` is a string or a list of blocks: `text`, `thinking`, `tool_use`, `tool_result`. Records carry `timestamp`, `isSidechain`, and on some user records `isMeta` or `isCompactSummary`; assistant records carry `message.model` and `message.usage`. An unknown record type must not break the export.

## What to build

`node scripts/export-sessions.ts --in <folder> --out <folder> [--banned <file>] [--metrics <file>]`, run directly by Node 24, standard library only.

1. Selection, allow-list: a record is exported only if it is one of the kinds below. Everything else, known or unknown, is dropped.
   - What the person typed: `user` records that are not meta, not a compaction summary, and whose content is a string or `text` blocks.
   - What the assistant said: `text` blocks of `assistant` records. `thinking` blocks are dropped.
   - What the assistant did: each `tool_use` block as one line with the tool name and, where the input has one, its `description`. The rest of the input and every `tool_result` are dropped.
   - A compaction boundary as one line saying that the context was compacted there.
2. Inside exported text: remove every `<system-reminder>` element and every other injected element with its content (a list of element names in one place in the code); replace email addresses, the home folder in Windows and POSIX spelling, and strings that look like keys or tokens with fixed placeholders.
3. Banned phrases, from the `--banned` file (one per line, compared without regard to case; default `banned-phrases.local.txt` at the repository root, optional): each occurrence in exported text is replaced with `[redacted]`.
4. Fail closed: after rendering, a second and independent pass searches the complete output for every banned phrase, for an email pattern and for the home folder. One hit means a non-zero exit, a message naming the output file and the line (never the phrase), and no file written at all.
5. Output: one Markdown file per session and one per subagent session, named by start time and a short id, with a header (start, end, models, number of prompts) and the turns in order. Subagent files say which session started them. Running twice on the same input gives identical files.
6. `--metrics`: one Markdown table, a row per session: start, duration, prompts, assistant replies, tool calls, compactions, input, output and cache tokens summed from `usage`, models, and how many replacements each redaction made.
7. `docs/agent/sessions/README.md`: what is in an export, what is dropped and why, how to run it, and that the phrase list itself is not in the repository because it names what must not be published.

## Tests (first)

Vitest, run by the same configuration that runs the reviewer script's test. Fixtures are hand-written JSON Lines with invented content. Banned phrases in tests are invented words.

- The redaction test, seen red first against an exporter that passes text through: a fixture session that plants an invented banned phrase in a prompt, in an assistant reply, in a tool input, in a tool result, in a `<system-reminder>` inside a prompt, in a hook summary record, in an attachment record, in a thinking block and in a compaction summary; plus an email address and a home folder path. None of them is in the output; the prompt and the reply around them are.
- Fail closed: with the replacement step disabled by a test seam, the run exits non-zero, writes nothing, and its message does not contain the phrase.
- Unknown record types and malformed lines do not stop the run and export nothing.
- Subagent files are exported and linked to their session.
- Metrics: sums and counts for a fixture with known numbers.
- Determinism: two runs, identical bytes.

## Trial run, by the conductor, nothing committed

When the tests are green, the conductor runs the exporter once on `C:/Users/USER/.claude/projects/C--Users-USER-IdeaProjects-CoverTree` with the output in a folder outside the repository and outside every worktree. Report only: exit code, number of files, number of replacements per kind, and whether a search of the output for the email pattern and the home folder finds anything. Quote nothing from the output in the report or to the worker. Delete the folder afterwards.

## Done when

- `npm run verify` green in the worktree; red and green output in `docs/agent/slices/transcripts/`.
- The trial run's numbers are in the report.
- The diff touches only the owned paths and the slice record; no file under `docs/agent/sessions/` except the README.

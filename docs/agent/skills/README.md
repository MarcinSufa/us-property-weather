# Skills used in this project

Skills are instruction files an agent session loads for a kind of task. This folder holds copies of the public skills invoked while the project was built (skill files only, not whole upstream repositories) and descriptions of skills that are not copied.

## Copied

### grilling

An interview skill that puts each open plan decision to the author in rounds, with a recommended answer for every question. In this project it was used in the planning session to settle the plan's open points before approval (plan section 19).

- File copied: `SKILL.md`, text unchanged from the local skill folder on 2026-10-13 (git stores it with LF line endings).
- Source URL: https://github.com/mattpocock/skills, path `skills/productivity/grilling` (as recorded in the local skill folder's own source note).
- Commit or version: not established locally. The local source note records only the date the skill was taken from upstream, 2026-09-04.
- Licence: MIT, as recorded in the local source note. The upstream licence text and its copyright line are not established locally and are therefore not reproduced here.
- This is a locally modified copy. The local note says a single skill was taken instead of the whole upstream plugin; which lines differ from upstream is not established locally.
- Files: `grilling/SKILL.md`.

### handoff

Passes a session's working state (goal, specifics, state, next step, constraints, gotchas and verification commands) to a fresh session through a structured document. In this project its document format models the files under `docs/agent/handoffs/` that conductors are started from.

- Files copied: `SKILL.md` and `LICENSE`, text unchanged from the installed plugin on 2026-10-13 (git stores them with LF line endings).
- Source URL: https://github.com/MarcinSufa/claude-handoff (from the plugin manifest).
- Version: 1.0.0 (plugin manifest). Installed from commit `03c5eb1434a40e322a4ebaa5b3de2fee907a9fa1` (the local plugin registry).
- Licence: MIT. The notice is in `handoff/LICENSE` next to the skill.
- This is a locally modified copy: the installed `SKILL.md` differs from the one at the commit above (the spawn modes and the same-window default were added after installation). Whether upstream has since received the same change is not established locally.
- Not copied: the plugin's `tools/` and `hooks/` scripts, which `SKILL.md` refers to, its README, and its manifest files. The manifest files carry an email address.
- Files: `handoff/SKILL.md` and `handoff/LICENSE`.

## Described only

### conduct

This skill makes the driving session route every coding task to a worker model instead of implementing it, and requires review by a model from another vendor. In this project it is the source of the roles in the README: the manager and conductors never implement, the worker writes, and a model from another vendor reviews.

It is in a private repository and is not published, so it is described rather than copied.

### conduct-binding

This skill binds `conduct` to the author's own machine: which worker and reviewer routes exist there and where decisions are recorded. In this project it applied alongside `conduct` in the manager session; project-specific equivalents are written in `AGENTS.md` and the handoff files, so the repository does not depend on it.

It is in a private repository and is not published, so it is described rather than copied.

### exo-compact

This plugin replaces built-in context compaction in a long session with its own summary and keeps the earlier part of the session searchable. In this project it compacted the manager session once, after which work continued without a question to the author.

It is in a private repository and is not published, so it is described rather than copied.

### i-have-adhd

This skill shapes long final answers so the next action comes first and multi-step work is numbered. In this project it shaped the manager session's long answers to the author.

It is not copied because its public origin is inferred, not confirmed, and a copy waits for the author's confirmation.

## Not invoked

The session-start text of the `superpowers` plugin was injected into the sessions, but none of its skills was invoked, so nothing of it is copied.

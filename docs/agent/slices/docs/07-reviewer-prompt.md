# Reviewer prompt, round 2: slice `docs`

You review the fix for your round 1 findings on a documentation diff. You are read-only: return findings, write no files. The diff below is the fix alone (the change to `README.md` since the commit you reviewed). The context is the same as in round 1: a draft `README.md` written from the approved plan before the application is finished, so "not implemented yet" is not a finding.

## Round 1 findings and their outcome

- F1 (real Weatherstack create against "no test calls it"): fixed. The closing sentence now speaks of automated tests, development loops and CI jobs; the manual row says it is made once by hand at the end of the project and is not a reader step. No command is given on purpose: the reader is not asked to make that call.
- F2 (missing value stops the process, although five variables have defaults): fixed.
- F3 ("runs with `npm install` and nothing else"): fixed.
- F4 (wrong reason why SQLite does not fit Lambda): fixed with your reason.
- F5 (error translation in resolvers): fixed in part. The approved plan fixes the rule as "resolvers contain no logic; they pass arguments to the service and translate domain errors into GraphQL errors", so the sentence stays; the README now names the file that holds the mapping, `apps/api/src/graphql/errors.ts`.
- F6 (grilling: "locally modified", missing licence notice): not changed in this round. The conductor may state only what the local files establish and has no network; the commit, the upstream licence text and the difference to upstream stay "not established locally". Your observations (an older upstream snapshot, the upstream MIT notice) are passed to the manager to verify and to add the notice before publication.
- F7 (handoff: version and "locally modified"): not changed in this round, for the same reason. The local plugin registry records commit `03c5eb1` and the installed file differs from it; your observation that the text matches a later upstream revision is passed to the manager to verify.
- F8 (state is not free text): fixed.
- F9 (three workspaces, "two packages"): fixed.
- F10 (`npm run dev` does not return): fixed. The run block ends at `npm run dev`; `npm run verify` is said not to need the running application. Whether `npm run e2e` needs it stopped is not known until the end-to-end slice exists, and is deliberately not stated.

## What to look for

1. Does each fix resolve its finding without a new contradiction inside the diff?
2. Anything in the changed lines that is wrong as typed, or breaks the text rules (no long dashes, no praise, no personal names, no email address, no secret value).

Do not raise F6 and F7 again; do not report on unchanged text.

## Answer format

First line: `APPROVED` or `CHANGES REQUESTED`. Then findings numbered G1, G2, ..., each with severity, the quoted text, what is wrong and the change you propose. No finding without a quote.

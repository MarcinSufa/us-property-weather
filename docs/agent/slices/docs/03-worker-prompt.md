# Worker prompt 03: slice `docs`, two structural corrections

You are the worker of slice `docs`. Change only `README.md`. Do not run git commands that write. All earlier rules hold (plain sentences, no long dashes, no personal names, `npx prettier --check README.md` passes, exactly six `graphql` fenced blocks).

Round 2 left two defects, both caused by an unclear instruction:

1. Section "Trade-offs and what comes next" now has the deferrals twice: once as the list with reasons, and again as a bare list under "Not built:" placed after the Lambda subsection. Wanted structure:
   - the heading `## Trade-offs and what comes next`;
   - the lead-in line `Not built:`;
   - the one list with reasons. Each item starts with what is not built and then gives the reason in the same item, for example "Retries, caching or a circuit breaker around the weather call: the quota is small and the person can press the button again." Reword the production build item to that shape too. The two items that are not deferrals (the weather snapshot is never refreshed; the `npm audit` findings) go into a second short list after it with the lead-in line `Known limits:`;
   - then `### Path to AWS Lambda (not built)` with its paragraph, as the last part of the section.
   Delete the bare second list.
2. Section "How AI was used": the loop of one slice became one long sentence that begins "The loop follows plan section 14 step for step". Make it a numbered list, one step per item, introduced by the line "The loop of one slice:". Steps: the manager writes the brief; the conductor writes the worker prompt; the worker writes the tests and shows them red, then implements until they are green; the conductor verifies on its own (reads the whole diff, runs `npm run verify`); the reviewer reads the diff and returns findings; the worker fixes them, with at most three review rounds; the conductor reports to the manager; the manager merges with `git merge --no-ff` and runs `npm run verify` on `main`. Keep the two sentences after it (unfixed findings recorded with the reason; model ids checked and passed explicitly). Put `git merge --no-ff` in inline code as now.

Reply with what you changed.

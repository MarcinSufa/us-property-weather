# Worker prompt 07, slice `e2e`: fixes after review round 1

You are the worker of slice `e2e` of the CoverTree project, in the git worktree `c:/tmp/covertree-e2e` on branch `slice/e2e`. You have no memory of the earlier rounds. Read `AGENTS.md`, `docs/agent/briefs/e2e.md` and `docs/agent/slices/e2e/01-worker-prompt.md` (its rules bind this round unchanged: what you may touch, the code rules, the stories and their assertions, no server and no `playwright test` started by you), then `e2e/stories.spec.ts` as it stands at commit `e21a2dc`, and `apps/web/src/pages/PropertyListPage.tsx` and `apps/web/src/components/PropertyTable.tsx` for what the list page renders before and after its query answers.

The suite is green (10 passed, twice in a row) and was reviewed by a model from another vendor. Three changes come out of that review and of the conductor's own red proof. Change only `e2e/stories.spec.ts`.

## 1. The unknown-location story asserts "saves nothing" before the list has loaded (reviewer, major, accepted)

In the test `AC-CREATE-15 AC-WEB-14 ...`, after `page.goto('/')` the test waits for the heading "Properties" and then asserts that the link "9 Nowhere Road" has count 0. The heading is static: `PropertyListPage` renders the `<h1>` before the list query answers. `toHaveCount(0)` is satisfied at once while the list is still loading, so a create that shows the alert and still stores the row would pass whenever the list answer arrives after the check.

Fix: before asserting the absence, wait for something that exists only once the list answer is rendered and that this story can predict: the row of the first story's property ("15 Saguaro Blvd") is visible and the list shows exactly one property row (use the same row locator the other stories use; the count line "1 property" is a second witness if you want one). Then assert the unknown street is absent.

Then apply the rule everywhere in the file: every assertion of absence (`toHaveCount(0)`, `toBeHidden`, a count that is also true of an empty or loading page) must come after an assertion that proves the page has rendered the answer it is about. Name each such place in your reply, the ones you changed and the ones that were already safe and why (for example an element that was present just before and must go away is safe, because the assertion can only pass once it is gone).

## 2. The state leg of the filter story does not identify its rows (reviewer, minor, accepted)

In `AC-FILTER-7 ...`, after the state filter `AZ` the test checks only `toHaveCount(2)`, before and after the reload. Two of the three properties are in Arizona, so any two rows pass: a state filter that returned "15 Saguaro Blvd" and "300 Pine Avenue" would be green.

Fix: after the state filter is applied, and again after the reload, assert that the two Arizona streets are listed and the Texas street is not, the absence after the presence (rule of point 1). Do the same check of identity for the city leg and the zip leg after their reloads, where today only the count is repeated.

## 3. The story that loads the list last does not check the weather count after it (conductor)

The conductor made the list path of the API call the weather provider in a scratch tree. The suite went red as it must, but in the third test (`AC-CREATE-9 ...`, "calls": 3 received, 2 expected) and not in the second, whose last action is the list load that made the extra call. The prompt of round 1 asked that a failure name the action that reached the weather service.

Fix: in the unknown-location story, assert the stub count once more after the list has rendered (after the fix of point 1, so the list request has been answered). Check the other stories for the same gap: every story that loads the list, a filter, a sort, a detail page or deletes must assert the count after the answer of that action is rendered, not only before it.

## What the conductor will run

`npm run e2e` twice, `npm run verify`, and two red proofs again: the list path calling the provider (expected: the unknown-location story fails at its own count check) and a create that stores the row although the weather lookup failed (expected: the unknown-location story fails at the absence check). Do not write these mutations; the conductor makes them in a scratch tree.

Run `npx prettier --check e2e .github package.json`, `npx eslint e2e/stories.spec.ts e2e/playwright.config.ts e2e/weatherstack-stub.ts` and `npm run typecheck`, and report the real results. (`npx eslint e2e` also lints the generated `e2e/playwright-report/` of a failed run; that is known and is not yours to solve.)

## Reply

Each change with its reason, the list of absence assertions and count checks you audited with the verdict for each, each command with its real result, and anything you are unsure about.

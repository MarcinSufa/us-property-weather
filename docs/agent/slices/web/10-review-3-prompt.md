# Review of slice `web`, round 3 (last)

You review a patch for the CoverTree take-home project: a React 19 single-page app (Vite, React Router, urql 5 with its default document cache, plain CSS with design tokens) over a GraphQL API that stores properties with the weather at creation time. You reviewed the whole web slice in round 1 and its fix in round 2. This patch is the fix of round 2 alone: `git diff 97a1880 7b83cec` without the lockfile and the slice record. You cannot run code; review by reading. Files the patch does not touch are as you saw them before.

Review only. Do not rewrite the code. Report findings.

## Round 1 findings and outcomes (unchanged since round 2)

1. `ConfirmDialog` pending state: fixed with `aria-disabled`, ignored clicks and a `role="status"` line; "Cancel" and Escape stay blocked while the delete runs (declined, recorded).
2. `PropertyForm` navigating after the user left: fixed with an unmounted ref.
3. `WeatherCard` icons and descriptions: fixed (all descriptions joined, first icon as a decorative image); no "Not reported" row for a missing icon (declined).
4. Phone-width `thead`: fixed with `display: none`.
5. `transparent` keyword: declined, the slice rule allows it.
6. Tests by role, every row's `<time>`, two-error focus test: fixed.
7. Shared field-error helper: fixed; `ErrorAlert` in the dialog declined.
8. Delete answer without data: fixed.

## Round 2 findings and what was done

1. Major, the unmounted ref of `PropertyForm` stayed `true` under React Strict Mode, so every create answer was dropped. **Fixed.** The effect's setup now sets `unmounted.current = false`. The test helper `src/test/render-app.tsx` now renders the tree inside `<StrictMode>` as `main.tsx` does, so the whole suite runs under Strict Mode. Red run before the fix: 13 failed (the create tests that wait for navigation, field errors or an alert), 66 passed. Green after: 79 passed. `AC-WEB-14` gained an assertion that the failure is shown, because it had passed without one. The worker checked the other effects and refs (`ConfirmDialog`, `PageTitle`, `PropertyFilters`, the pages) and found no other flag that a second mount leaves stale.
2. Major, a create that answers after the user left the form leaves the list stale. **Refuted by test, no code change.** The mutation runs to its end in the urql client after the form unmounts; its result holds `__typename: 'Property'`, and the document cache then asks the list query again because it is tagged `additionalTypenames: ['Property']`. Test: `AC-LIST-5 a create that answers after the user left the form refreshes the list` (start at an empty list, open the form, submit with the answer held open, press "Cancel", see the empty list, resolve the create, the new street appears, the route is still `/`). It was green at once, and it fails when `additionalTypenames` is removed from the list query (the list keeps saying "No properties yet"), which shows that the tag is what refreshes the list. Not covered: a list request that starts before the insert and answers after the mutation result; the list query is a fast read and the create waits for the weather lookup, and the list has "Try again" and a reload as the way out.

## What to look for

1. Does the fix do what it claims, and do the tests prove it?
2. Does the fix introduce a new defect?
3. If you hold that the refuted finding is still a defect a user would hit, say so once, with the concrete failure and why the test does not show it.

Do not repeat findings that were fixed or declined above. Do not report style preferences, and do not report the absence of things this patch was not asked to do.

## Form of the answer

A numbered list of findings, most severe first. For each: severity (`blocker`, `major`, `minor`), file and line or symbol, what is wrong, why it matters (the concrete failure), and the smallest fix. If you are unsure whether something is a defect, say so and say what would settle it. If there are no findings, say so. End with one line: `VERDICT: approve` or `VERDICT: changes requested`.

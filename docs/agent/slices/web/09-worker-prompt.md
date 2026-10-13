# Round 7: fixes after review round 2

Read `docs/agent/slices/web/00-worker-rules.md` in full first, then `AGENTS.md`. Then read `apps/web/src/main.tsx`, `apps/web/src/components/PropertyForm.tsx`, `apps/web/src/test/render-app.tsx`, `apps/web/src/pages/NewPropertyPage.test.tsx` and `apps/web/src/graphql/client.ts`. The reviewer read the fix of round 6 and reported two findings. Handle exactly these, each test first. Save the red output to `docs/agent/slices/web/09-red-output.txt` before fixing, and the full green output of the web suite to `docs/agent/slices/web/09-green-output.txt` after.

## Finding 1: the form is dead under React Strict Mode (real, fix it)

`main.tsx` renders the app inside `<StrictMode>`. In development Strict Mode runs every effect's setup, then its cleanup, then the setup again, on the same instance, and refs keep their values. The effect added in round 6 to `PropertyForm` has an empty setup and a cleanup that sets `unmounted.current = true`. After the Strict Mode cycle the ref stays `true` for the whole life of the form, so every submit sends the mutation and then returns before `navigate` and before any error is shown: a saved property with no navigation and no message. The tests do not render under Strict Mode, so they are green.

Test first:

- The test helper `src/test/render-app.tsx` must render what `main.tsx` renders: wrap the tree in `<StrictMode>`. Run the whole suite and save the output as the red output. Expected red: the create tests that wait for navigation or for an error (`AC-CREATE-10`, `AC-CREATE-9`, `AC-CREATE-13`, `AC-CREATE-15`, `AC-WEB-14`, `AC-LIST-5`), all for the reason above.
- If tests fail for another reason (for example a request counted twice because Strict Mode mounted an effect twice), look at each: if the product code does something wrong under Strict Mode, that is a defect, fix it and say so; if only the count in the test is an artefact of the double mount, say which tests and why, and then, instead of the global wrap, give the helper an option `strict` (default `false`), keep the suite as it is, and add these tests that pass `strict: true`: `AC-CREATE-10 under Strict Mode a valid form ends at the new property` and `AC-CREATE-15 under Strict Mode a failed create shows its alert`. Prefer the global wrap when it is possible without weakening an assertion.

Fix: the smallest one. The setup of the effect sets `unmounted.current = false` before it returns the cleanup.

Then check every other effect and ref in `apps/web/src` for the same construction (a cleanup that sets a flag which the setup does not reset, or a ref written during a mount that Strict Mode's second mount does not restore): `ConfirmDialog` (its `showModal()` effect), `PageTitle`, `PropertyFilters`, the pages. Name each place you checked in the reply and what you found.

## Finding 2: a create that answers after the user left may leave the list stale (prove or fix)

The reviewer's claim: when the user leaves the form while the create runs, the answer is dropped, nothing tells the list about the new row, and the list keeps showing the cached result without the new property.

The conductor's expectation is that this does not happen: the mutation still runs to its end in the urql client after the form unmounts, its result holds `__typename: 'Property'`, and the document cache then asks every query tagged `additionalTypenames: ['Property']` again. Do not trust either claim: write the test.

- `AC-LIST-5 a create that answers after the user left the form refreshes the list`, through the whole app: a `Properties` handler that answers an empty list until the `CreateProperty` handler has answered and the new property after that; start at `/`, see "No properties yet"; follow "Add property"; fill the form and submit, with the create answer held open by a promise; press the "Cancel" link; see "No properties yet" again at `/`; resolve the create answer; the new street appears in the list and the router is still at `/`. No reload, no new client.
- If it is green at once, say so in the reply (finding refuted, the test stays). Then prove the test tests what it claims the same way as in round 3: remove `additionalTypenames` from the list query's context, run that one test, see it fail, save that output to `docs/agent/slices/web/09-red-additional-typenames.txt`, restore the line, run everything again.
- If it is red, find the cause and fix it in the smallest way (the list must show the new property; the user must stay at `/`), and say what the cause was.

The existing test `AC-WEB-20 ...` stays; if the Strict Mode wrap or the new test shows that it scripts something a real server could not answer, correct the script, not the assertion about the route.

## Not to change

No other behaviour, no new dependency, no change outside `apps/web/src/**` and the two output files (three with the typenames proof).

Run typecheck, eslint and prettier as the rules file says. Test runs: as before, run Vitest the way that works in your sandbox. In your reply, list per finding: the tests, red seen or not, and what changed. No long dashes in the reply or in any file.

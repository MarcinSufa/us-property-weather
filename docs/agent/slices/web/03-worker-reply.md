1. **Files:** Added [PropertyForm.tsx](/C:/tmp/covertree-web/apps/web/src/components/PropertyForm.tsx), shared error and state option components, the new page CSS and tests, and the three requested output files. Updated the list page, filters, error helper, base styles, and list tests. No files were deleted or generated files changed.

2. **Red runs:** The full targeted run had **17 failures and 23 passes**, saved in [03-red-output.txt](/C:/tmp/covertree-web/docs/agent/slices/web/03-red-output.txt). With `additionalTypenames` removed, `AC-LIST-5` failed and the page remained at “No properties yet”; that output is saved in [03-red-additional-typenames.txt](/C:/tmp/covertree-web/docs/agent/slices/web/03-red-additional-typenames.txt).

3. **Green and checks:** The sandbox Vitest wrapper ran the full web suite: **48 tests passed across 3 files**, saved in [03-green-output.txt](/C:/tmp/covertree-web/docs/agent/slices/web/03-green-output.txt). Codegen, typecheck, ESLint, and Prettier checks passed. `AC-FILTER-10` passed against the round 2 code.

4. **List board and behavior:** The filtered empty-state heading is now inside its card, matching the board; the unfiltered heading was already inside its card. Clear resets typed, unapplied values, and `urlKey` was removed because the values prop handles URL-driven resets. Filter field errors use the form’s polite live region without a second alert role.

5. **Limitations:** I used the sandbox Vitest wrapper because the npm test launcher is known to hit `spawn EPERM`. I did not run the build, per the worker rules.
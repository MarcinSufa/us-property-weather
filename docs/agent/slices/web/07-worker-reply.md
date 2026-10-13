## Files

Created [FieldErrors.tsx](/C:/tmp/covertree-web/apps/web/src/components/FieldErrors.tsx) and changed the dialog, form, filters, weather card, shared button styles, responsive list CSS, and the three related test files. No files were deleted.

Saved the red output to [07-red-output.txt](/C:/tmp/covertree-web/docs/agent/slices/web/07-red-output.txt) and the full green output to [07-green-output.txt](/C:/tmp/covertree-web/docs/agent/slices/web/07-green-output.txt).

## Fixes

1. **Pending delete: `AC-WEB-19`: red seen.** Pending buttons stay focusable, use `aria-disabled`, ignore repeat clicks and Cancel, and show a `role="status"` line. The test also checks recovery after a failed answer.
2. **Delete answer without data: `AC-WEB-17`: red seen.** Missing `data.deleteProperty` now follows the failure path and leaves the dialog open.
3. **Leave form while saving: `AC-WEB-20`: red seen.** An effect cleanup marks the form unmounted; late answers then cannot navigate or set state.
4. **Weather card: `AC-DETAIL-5`: red seen.** The test failed on the missing second description. The card now joins descriptions and uses the saved icon when present. The null-icon assertion under `AC-WEB-5` and the list’s first-description assertion passed; neither had a separate red failure.
5. **Phone table header:** changed the breakpoint rule to `display: none`. No test added, as requested: jsdom does not apply media queries.
6. **Test queries and focus:** changed `AC-WEB-6` to check every row’s `<time>` by role, and changed loading checks to query `status` by role. Added the multi-error `AC-CREATE-13` focus test. These assertions passed in the red run because the existing behavior already met them.
7. **Shared field errors:** both forms now use one helper for ARIA attributes and one component for error messages. Existing field-error tests passed in the red run; no separate new test was needed for this refactor.

## Verification

The red run had **4 failures and 66 passes across 70 tests**, all on intended behavior assertions. The full web suite passed: **78/78**. Typecheck, ESLint, and Prettier completed cleanly. Codegen was not run because no GraphQL documents changed. No phone-breakpoint test was run.
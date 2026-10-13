## Files

Changed:

- [PropertyForm.tsx](C:/tmp/covertree-web/apps/web/src/components/PropertyForm.tsx): reset the mounted flag in effect setup.
- [render-app.tsx](C:/tmp/covertree-web/apps/web/src/test/render-app.tsx): wrap test renders in Strict Mode.
- [NewPropertyPage.test.tsx](C:/tmp/covertree-web/apps/web/src/pages/NewPropertyPage.test.tsx): assert create failures are shown and add the delayed-create list test.

Created:

- [09-red-output.txt](C:/tmp/covertree-web/docs/agent/slices/web/09-red-output.txt)
- [09-red-additional-typenames.txt](C:/tmp/covertree-web/docs/agent/slices/web/09-red-additional-typenames.txt)
- [09-green-output.txt](C:/tmp/covertree-web/docs/agent/slices/web/09-green-output.txt)

No files deleted. I left the other untracked review and worker prompt files untouched.

## Finding 1

The Strict Mode full-suite red run had **13 failures and 66 passes**. It exposed the create navigation, field error, alert, and list refresh failures, including both `AC-WEB-14` cases. The output is saved in `09-red-output.txt`.

Resetting `unmounted.current` during effect setup fixes the issue. The new delayed-create test also passed in this red run, which helped distinguish Finding 2.

## Finding 2

The delayed-create test shows that the property appears in the list after the user cancels, while the router remains at `/`. The street is a link in the table, so the test checks for a link.

With `additionalTypenames: ['Property']` removed, that test failed: the new street link did not appear. That one-test red output is saved in `09-red-additional-typenames.txt`. Restoring the tag produced the final green run.

## Verification

- Full web suite: **79 passed**, saved in `09-green-output.txt`.
- `npm run typecheck --workspace=apps/web`: passed.
- `npx eslint apps/web`: passed.
- `npx prettier --write apps/web/src`: passed; files were unchanged.

## Effect and ref review

- `PropertyForm`: the mounted flag now resets during setup. Field refs are refreshed through React callback refs; the pending ref is not changed during mount.
- `ConfirmDialog`: `showModal()` is guarded by `dialog.open`; there is no cleanup flag to remain stale.
- `PageTitle`: Strict Mode repeats the same document title assignment.
- `PropertyFilters`: its effect repeats an idempotent sync from URL values.
- `NewPropertyPage`, `PropertyListPage`, `PropertyDetailPage`, and `NotFoundPage`: no effects or refs with the reviewed pattern. The source search found no other effect or ref usage in `apps/web/src`.

No behavior outside the two findings was changed.
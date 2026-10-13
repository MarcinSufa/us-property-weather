## Files changed

Created [ConfirmDialog.tsx](/C:/tmp/covertree-web/apps/web/src/components/ConfirmDialog.tsx) and its CSS. Updated the list table, detail page, shared button styles, date/temperature formatting, and dialog test setup. Added list and detail delete tests.

Saved the red run to [05-red-output.txt](/C:/tmp/covertree-web/docs/agent/slices/web/05-red-output.txt) and the full green output to [05-green-output.txt](/C:/tmp/covertree-web/docs/agent/slices/web/05-green-output.txt). No files were deleted.

## Verification

The red run had **12 failing tests and 61 passing tests**. The green run had **73 passing tests**. Vitest ran through the Windows sandbox wrapper; its output is saved in full.

Typecheck, ESLint, and Prettier check passed. Codegen was not run because the GraphQL document was already present and unchanged.

## Board differences

- **Main/list:** The seventh Actions column and danger-quiet row buttons follow the board. On mobile, the action appears in its own trailing row in the card rather than inline with the weather summary; the table keeps Actions as a separate column.
- **MobileList:** The action button is right-aligned with the board’s quiet danger treatment. The separate trailing row is the mobile layout difference noted above.
- **PropertyDetail:** The outlined danger button sits to the right of the title block on wider screens and stacks below it on phone widths.
- **DetailStates dialog:** The native dialog uses the requested backdrop and shadow tokens. Its failure alert displays the required sentence without the board’s explanatory “If the delete fails” lead-in.

The jsdom shim toggles the dialog’s `open` attribute and dispatches `close`. The Escape test dispatches `cancel` and applies the default close path; the shim cannot prove browser-native modality, focus restoration, or Escape behavior. No other board departures were found.
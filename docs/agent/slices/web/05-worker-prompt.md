# Round 5 of 5: delete and the confirmation dialog

Read `docs/agent/slices/web/00-worker-rules.md` in full first, then `AGENTS.md`, `docs/plan.md` sections 5, 7 (Errors) and 10, `docs/design/README.md`, and the boards `docs/design/DetailStates.dc.html` (the dialog), `Main.dc.html` and `MobileList.dc.html` (the delete button of a row), `PropertyDetail.dc.html` (the "Delete property" button), `Tokens.dc.html`. Then read what rounds 1 to 4 left in `apps/web/src/**`. Reuse the button, alert and card styles and the tokens `--color-dialog-backdrop` and `--shadow-dialog`.

This round adds `ConfirmDialog` in `apps/web/src/components/` and uses it from the table rows and from the detail page.

## Proposed criteria used in this round

- `AC-WEB-16`: Given the delete dialog opens, when it is shown, then it names the street and focus is on "Cancel"; "Cancel" and Escape close it and nothing is deleted.
- `AC-WEB-17`: Given the user confirms and the delete fails, when the answer arrives, then the dialog stays open and shows the failure message.
- `AC-WEB-18`: Given the user confirms a delete from the list, when it succeeds, then the dialog closes and the row is gone without a reload.

## Behaviour

`ConfirmDialog`, per the dialog of `DetailStates.dc.html`:

- A native `<dialog>` opened with `showModal()` and closed with `close()`. No `open` attribute set by hand, no portal, no focus-trap code: the element does that natively. The backdrop is styled through `::backdrop` with the backdrop token.
- Title (`<h2>`, state-title size): `Delete <street>?`. Body: "The property and its saved weather are removed. This cannot be undone." The dialog is labelled by its title and described by its body (`aria-labelledby`, `aria-describedby`).
- Buttons: "Cancel" (white surface, input-border colour, as on the board) and "Delete property" (danger). Focus is on "Cancel" when the dialog opens.
- "Cancel" and Escape close it. Listen to the dialog's native `close` event (React's `onClose`) so that state follows however it was closed. Focus returns to the button that opened it (native behaviour of `showModal()`; do not write code for it unless a test shows the need).
- Confirming sends the `DeleteProperty` mutation with the id. While it runs both buttons are disabled, the danger button reads "Deleting…", and Escape does not close the dialog (cancel the native `cancel` event while pending).
- A failed delete (any GraphQL error including `PROPERTY_NOT_FOUND`, or a network failure): an alert (`role="alert"`) inside the dialog with the text "Could not delete. The property is still here.", the dialog stays open, the buttons work again. Reopening the dialog later shows no stale message.
- A successful delete closes the dialog and tells the caller (a callback prop).
- Keep the component small: it receives what it must show and do (the street, the id or a confirm function, the close and deleted callbacks). Decide where the mutation lives (in the dialog or in a hook its two callers share) so that the logic is written once.

Callers:

- Table rows: a seventh column whose header is the visually hidden text "Actions"; in each row a danger-quiet button with the visible text "Delete" and the accessible name `Delete <street>`. One dialog instance for the table, not one per row. After a successful delete the row disappears: the mutation answers a `Property`, so urql's document cache asks the list again because the query is tagged with `additionalTypenames: ['Property']`; write no manual refetch unless a test shows it is needed. The mobile card of round 2 places the button as `MobileList.dc.html` does, as far as CSS on the table allows.
- Detail page: the "Delete property" button of `PropertyDetail.dc.html` (white surface, danger border and text: add this outline variant to the shared button styles if it does not exist) at the right of the title block. After a successful delete navigate to `/`.

## Tests first

The test DOM may not implement `showModal()` and `close()` on `<dialog>`. Check first. If it does not, add a shim to `apps/web/src/test-setup.ts` that sets and removes the `open` attribute and dispatches the `close` event on `close()`; no dependency. If jsdom does not move focus or handle Escape for a dialog, the component may set focus on "Cancel" itself after `showModal()` (that is correct in browsers too), and the Escape test may dispatch the `cancel` event that a browser fires, followed by what the browser does next; say in your reply what the shim covers and what it cannot prove.

`apps/web/src/components/ConfirmDialog.test.tsx` or the page test files, your choice, all through the test helper with `msw` handlers for `Properties`, `Property` and `DeleteProperty` that record the variables:

- `AC-DELETE-3 ...`: on the list, pressing "Delete 15 Saguaro Blvd" opens a dialog and sends no `DeleteProperty` request.
- `AC-WEB-16 ...`: the dialog's accessible name is "Delete 15 Saguaro Blvd?" and "Cancel" has focus.
- `AC-WEB-16 ...`: "Cancel" closes the dialog, no request was sent and the row is still there.
- `AC-WEB-16 ...`: Escape closes the dialog, no request was sent and the row is still there.
- `AC-WEB-18 ...`: "Delete property" in the dialog sends `DeleteProperty` with the id of that row; the dialog closes; the list is asked again and the row is gone while the other rows remain.
- `AC-WEB-17 ...`: with a `PROPERTY_NOT_FOUND` answer and with a network error the dialog stays open, shows the alert "Could not delete. The property is still here.", and the row is still there.
- `AC-WEB-17 ...`: after a failed delete, cancelling and opening the dialog of another row shows that row's street and no alert.
- `AC-DELETE-3 ...`: on the detail page, "Delete property" opens the dialog naming the street and sends no request.
- `AC-DELETE-4 ...`: on the detail page, confirming sends `DeleteProperty` with the id and the router ends at `/`.
- `AC-WEB-17 ...`: on the detail page a failed delete keeps the dialog open with the alert and the route unchanged.
- `AC-LIST-2 ...` in the existing list test: the header row now has seven column headers, the last named "Actions".

Save the failing output to `docs/agent/slices/web/05-red-output.txt` before implementing. Then implement, and save the full output of `npm run test --workspace=apps/web` to `docs/agent/slices/web/05-green-output.txt`. Run typecheck, eslint and prettier as the rules file says.

## Also in this round: a last pass over the whole of `apps/web/src`

- No literal colour outside `src/styles/tokens.css`, no inline `style`, no unused class in the CSS, no unused export, no duplicated formatting or error-mapping logic, no code comment that only says what the code does.
- Every interactive element is at least 44px high and shows the focus ring.
- Report in your reply every place where the result departs from a board, with the reason, for all three pages (the conductor passes this list on).

## Facts added by the conductor after round 4

1. `deleteProperty` answers a `Property`, so after a successful delete urql's document cache asks every query again whose result held a `Property`: the list, and on the detail page the `Property` query of the page itself (which then answers `property: null`). On the detail page the user must end at `/` on the list; the test's `Property` handler answers `null` once the delete has run, and the test asserts that the router ends at `/`. A short "Property not found" in between is acceptable only if you cannot avoid it simply; say in your reply what happens.
2. Mock answers of `DeleteProperty` carry `__typename: 'Property'` (the invalidation depends on it).
3. `formatDate` in `src/formatters.ts` now takes options and a locale and `WeatherCard` passes `timeStyle: undefined` to switch the time off. In the last pass, make that read plainly (for example two small exported functions sharing nothing but `Intl.DateTimeFormat`, or one function with a clear parameter); keep one place per format.
4. Test runs: as before, run Vitest the way that works in your sandbox; if none works, say so.

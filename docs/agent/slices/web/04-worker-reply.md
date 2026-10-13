## Files

Created [BackToProperties.tsx](C:/tmp/covertree-web/apps/web/src/components/BackToProperties.tsx) and its CSS, [WeatherCard.tsx](C:/tmp/covertree-web/apps/web/src/components/WeatherCard.tsx), [PropertyDetailPage.css](C:/tmp/covertree-web/apps/web/src/pages/PropertyDetailPage.css), and [PropertyDetailPage.test.tsx](C:/tmp/covertree-web/apps/web/src/pages/PropertyDetailPage.test.tsx). The red and green test outputs are saved in [04-red-output.txt](C:/tmp/covertree-web/docs/agent/slices/web/04-red-output.txt) and [04-green-output.txt](C:/tmp/covertree-web/docs/agent/slices/web/04-green-output.txt).

Updated the detail page, shared the back link and date/missing-value formatting, removed the duplicate alert icon CSS, and added Property handlers and updated expectations in the existing tests. No files were deleted.

## Verification

- **Red:** The detail test command failed as expected: 13 of 13 tests failed against the placeholder page. Output is saved in `04-red-output.txt`.
- **State focus:** The new state-only field-error focus test passed on its first run; no fix was needed.
- **Green:** The sandbox Vitest wrapper ran the full web suite: 62 passed across 4 files. Output is saved in `04-green-output.txt`.
- **Typecheck, ESLint, and Prettier:** Passed. Prettier write and check both completed cleanly.
- **Codegen:** Not run; the GraphQL document was unchanged.

The delete button and dialog remain out of scope. The board’s 320px grid minimum is capped by available width to prevent overflow on narrow screens. No other board or prompt deviations.
I edited only [stories.spec.ts](/C:/tmp/covertree-e2e/e2e/stories.spec.ts). The other modified and untracked paths shown by `git status` were already in the worktree.

### Locator and assertion audit

- **Create:** Made the Street, City, State, Zip code, Add property button, and resulting street heading names exact. Scoped weather assertions to the “Weather at creation” region and used `toContainText` because `19 °C` appears in both the temperature and description.
- **Unknown location:** Made the submit button and alert heading exact; made field names, the Properties heading, and the absent street link exact. Kept the alert sentence assertion scoped to the alert.
- **Street validation:** Made the submit button exact. The source sets the message to `Street must be between 1 and 200 characters.` The Street input’s `aria-describedby` points to that error paragraph; its icon is hidden from accessibility and Street has no hint, so the accessible description assertion matches the source.
- **List:** Made the “3 properties” text exact, used exact street links to identify each row, and kept address and weather assertions scoped to that row.
- **Filters and sorting:** Made City, State, Zip code, Sort by created, and Apply filters names exact. Escaped the literal `+` in the city URL regex, since URLSearchParams encodes the space that way.
- **Detail:** Made the street link and heading exact; kept coordinate text assertions exact and weather assertions scoped to the weather region.
- **Delete:** Made the row button, dialog, dialog buttons, street links, count text, navigation, and Add property link names exact. Replaced the timed click with a check that the navigation link remains connected while `elementFromPoint` at its center hits something other than the link. The existing `:modal` assertion confirms a modal is open.
- **Checked and left:** The table-row `has: page.getByRole('link')` filter intentionally selects rows containing any link; it does not require that locator to resolve to exactly one element. Scoped `toContainText`, row counts, weather-call counts, and the route URL assertions do not need exact text matching.

The repository query orders by creation time and uses `rowid` to break ties. The stories’ expected sequence and counts are consistent: the unknown-location and invalid-input attempts save no rows; the remaining creates yield three rows; deleting the newest leaves two.

### Commands

- `npx prettier --check e2e .github package.json` - **passed**. I ran Prettier on `stories.spec.ts` first to fix formatting.
- `npx eslint e2e` - **failed** on 1,178 lint errors in the existing generated `e2e/playwright-report/` artifacts. `npx eslint e2e/stories.spec.ts` - **passed**.
- `npm run typecheck` - **passed** for API, web, and e2e.

I did not start Playwright, per the slice instructions. In the next run, check the dialog modality assertion’s header-link hit test in Chromium and then watch for any later strict-mode failure; browser hit testing and the remaining stories’ runtime behavior cannot be established from source alone.
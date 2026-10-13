# Review of slice `e2e`, round 2

You reviewed the end-to-end slice of the CoverTree take-home project in round 1 (a Playwright suite in `e2e/stories.spec.ts`, a local Weatherstack stub, a GitHub Actions workflow) and requested changes. You have no memory of that round; your three findings and what each led to are below. The patch after this prompt is the fix alone: `git diff e21a2dc d51f66b` without the slice record. Only `e2e/stories.spec.ts` changed. You cannot run code; review by reading.

Review only. Do not rewrite the code. Report findings.

## Facts about the code the patch drives (not in the patch)

- A GraphQL API stores US properties with a weather snapshot taken from Weatherstack once, at creation. Only `PropertyService.create` may call the weather provider. The list, the filters, the sort, the detail query and the delete must make no weather request. In the suite the provider is a local stub that counts the `/current` requests it served and returns the count on `GET /__calls`.
- The web app: `/` renders the static heading "Properties" at once, then, when the list query has answered, a table inside a region named "Property list" (street as a link to `/properties/:id`, city, state, zip code, created, weather, a button "Delete <street>" per row) and a count line ("3 properties", "1 property"). A filter form (textbox "City", combobox "State", textbox "Zip code", button "Apply filters") and a select "Sort by created" write `city`, `state`, `zip` and `sort=oldest` to the URL.
- The suite runs its tests in file order in serial mode against one database: the first test creates "15 Saguaro Blvd" (Fountain Hills, AZ, 85268), the second tries "9 Nowhere Road" with the unknown-location zip `00000`, the third sends an invalid street, the fourth creates two more properties (one more in Arizona in another city and zip, one in Austin, TX, 78701), so `properties[0]` and `properties[1]` are in Arizona and `properties[2]` is in Texas.
- Helpers in the file that the patch uses and does not show in full: `propertyRows(page)` is the rows of the table in the region "Property list" that contain a link; `expectWeatherCalls(request, expected = expectedWeatherCalls)` reads the stub's `/__calls` and expects `{ calls: expected }`; `expectedWeatherCalls` is a running count that each create increments where it is sent.

## Round 1 findings and outcomes

1. Major: in the unknown-location test, `toHaveCount(0)` on the link "9 Nowhere Road" after `goto('/')` could pass before the list query answered, because the heading "Properties" is static. Accepted and fixed: the test now waits for exactly one property row, that row containing the first story's street, and the count line "1 property", and only then asserts the absence. The worker was also told to audit every assertion of absence in the file so that each comes after an assertion that proves the answer is rendered.
2. Major: `permissions: contents: read` in `.github/workflows/ci.yml` leaves the job token without the `actions` scope, so `actions/upload-artifact@v7` would get 403; add `actions: write`. NOT changed. Reasons: the assignment of the slice requires the workflow to declare exactly `permissions: contents: read`, so the change is the project manager's to decide and the finding is forwarded to them; and the conductor could not confirm the claim: `actions/upload-artifact` has no token input in its `action.yml` at v7 and its README at v7 names no required permission (it uploads with the runner's own runtime token, not with `GITHUB_TOKEN`), while the action's own test workflow does declare `actions: write` beside `contents: read`, which may be for its delete and merge tests. The workflow has not run on GitHub yet, so neither reading is measured. If you hold the finding, say on what source; if you withdraw it, say so.
3. Minor: the state leg of the filter test asserted only a count of 2, before and after the reload. Accepted and fixed: after the state filter and again after the reload the test asserts that both Arizona streets are visible and the Texas street is absent; the city and zip legs repeat the identity of their row after the reload and assert that the two other streets are absent.

Added by the conductor in the same fix: every story now checks the stub count after the answer of its action is rendered (after each create inside the helper, after the list load that ends the unknown-location test, after each filter, the sort change, the detail page, the delete), so a provider call from a query fails in the test that made it.

## What was measured by the conductor after the fix (Windows 11, Node 24.16, Playwright 1.64)

- `npm run e2e`: 10 passed, twice in a row (11.1 s and 11.0 s); after each run no temporary directory of the suite is left and nothing listens on 4000, 5173 or 4174. `npm run verify` exit 0.
- With `PropertyService.list` changed, in a scratch tree, to call the weather provider: the unknown-location test fails at its own count check after the list load ("calls": 3 received, 2 expected); before the fix the same mutation failed one test later.
- With `PropertyService.create` changed, in a scratch tree, to store the row although the weather lookup failed: the unknown-location test fails at the row count (2 received, 1 expected); the alert was still shown, so the suite before the fix could have passed that mutation.

## What to look for

1. Whether each fix closes its finding: an absence assertion that can still pass before the answer it is about is rendered, a filter leg that still passes for wrong rows.
2. Defects the fix introduced: a new assertion that is racy or that can never fail, a count check placed where a request may still be in flight, a wait that depends on timing.
3. Anything of the same construction as findings 1 and 3 that the fix missed in the changed tests.

Do not report style preferences. Do not repeat a round 1 finding whose outcome above you accept.

## Form of the answer

A numbered list of findings, most severe first. For each: severity (`blocker`, `major`, `minor`), file and line or symbol, what is wrong, why it matters (the concrete failure), and the smallest fix. If there are none, say so. End with one line: `VERDICT: approve` or `VERDICT: changes requested`.

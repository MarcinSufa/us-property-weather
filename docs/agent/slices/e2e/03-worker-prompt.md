# Worker prompt 03, slice `e2e`: locators that match more than one element

You are the worker of slice `e2e` of the CoverTree project, in the git worktree `c:/tmp/covertree-e2e` on branch `slice/e2e`. You have no memory of the earlier rounds. Read `AGENTS.md`, `docs/agent/briefs/e2e.md` and `docs/agent/slices/e2e/01-worker-prompt.md` (its rules bind this round unchanged: what you may touch, the code rules, the stories and their assertions, no server and no `playwright test` started by you), then `e2e/stories.spec.ts`, `e2e/playwright.config.ts` and `e2e/weatherstack-stub.ts` as they stand.

## What the conductor saw

The three servers start now and the temporary directory is removed after the run. `npm run e2e`, exit 1: the first test fails, and the other nine did not run because the file is serial. Full output: `docs/agent/slices/e2e/02-run-output.txt`.

```
Error: expect(locator).toBeVisible() failed
Locator: getByText('19 °C')
Error: strict mode violation: getByText('19 °C') resolved to 2 elements:
    1) <span class="weather-card__temperature">19 °C</span> aka getByText('19 °C', { exact: true })
    2) <span class="weather-card__description">Patchy rain nearby · feels like 19 °C</span> aka getByText('Patchy rain nearby · feels')
  at stories.spec.ts:73:41
```

The accessibility snapshot of the detail page at that moment (what Chromium exposes, so what role and text locators see):

```yaml
- banner:
    - navigation "Main navigation":
        - link "Properties"
        - link "Add property"
- main:
    - link "All properties"
    - heading "15 Saguaro Blvd" [level=1]
    - paragraph: Fountain Hills, AZ 85268
    - button "Delete property"
    - region:
        - heading "Property" [level=2]
        - term: Street
        - definition: 15 Saguaro Blvd
        - term: City
        - definition: Fountain Hills
        - term: State
        - definition: AZ Arizona
        - term: Zip code
        - definition: "85268"
        - term: Latitude
        - definition: "33.609"
        - term: Longitude
        - definition: "-111.724"
        - term: Created
        - definition:
            - time: Oct 13, 2026, 4:52 PM
    - region:
        - heading "Weather at creation" [level=2]
        - paragraph: Observed 12:10 PM UTC on Oct 13, 2026. Saved once, never refreshed.
        - generic: 19 °C
        - generic: Patchy rain nearby · feels like 19 °C
        - term: Humidity
        - definition: 72 %
        - term: Wind
        - definition: 8 km/h ENE
        (eight more term and definition pairs)
```

## What to do

Each run shows the conductor one failure only, and each round with you costs minutes. So do not fix only line 73: audit EVERY locator and every assertion of `e2e/stories.spec.ts` against the source of the page it runs on (`apps/web/src/pages/*.tsx`, `apps/web/src/components/*.tsx`, `apps/web/src/formatters.ts`, `apps/web/src/graphql/errors.ts`, `apps/api/src/property/property-input.ts` for the exact server message) and make each one match exactly one element where Playwright's strict mode requires one. In particular:

1. Text locators match by substring unless `exact: true`: `19 °C`, `Patchy rain nearby`, `3 properties`, `2 properties`, a street that is also the page heading, the definition cells and the paragraph of the detail page. Scope them (to the weather card region, to a row, to the dialog) or make them exact. Prefer a scoped assertion on a container (`toContainText`) to a page-wide text locator.
2. Role locators match the accessible name by substring unless `exact: true`: `heading "Properties"` against other headings of the list page, `link "Add property"` (the header link and, on an empty list, any second link with that name), `button "Add property"`, `button "Delete ..."` against the dialog's "Delete property" button and the row buttons, `textbox "City"` and `textbox "Zip code"` and `combobox "State"` on the list page (the filter form) against any other control.
3. The modality check `await expect(link.click({ timeout: 250 })).rejects.toThrow()` waits a fixed 250 ms for a failure, which is a sleep by another name and also passes when the link is simply missing. Replace it with a check that needs no wait and cannot pass for the wrong reason, for example: evaluate in the page that the element at the centre of the header link (`document.elementFromPoint`) is not that link while the dialog is open, or that the dialog is `:modal` and the link, still present in the DOM, does not receive a real pointer click (`trial: true` is not enough on its own; state what you chose and why it proves modality).
4. The exact server message for a street of spaces: read it from `apps/api/src/property/property-input.ts` and the API tests, and check what the accessible description of the Street input really is when `FieldErrors.tsx` renders it (which attribute links them, whether the hint or an icon adds text).
5. Check the URL assertions against how `URLSearchParams` encodes a space (`+`), and that a regular expression containing `+` escapes it.
6. Check the expected row order and counts of each story against what earlier stories created and deleted.

Change only `e2e/stories.spec.ts` unless the audit finds something in the other two files. Run `npx prettier --check e2e .github package.json`, `npx eslint e2e` and `npm run typecheck`, and report the real results.

## Reply

A list of every locator or assertion you changed with the reason, the ones you checked and left, each command with its real result, and what you could not decide from the source and the conductor must watch in the next run.

Changed only [e2e/stories.spec.ts](/C:/tmp/covertree-e2e/e2e/stories.spec.ts).

The unknown-location story now waits for the first property row and the “1 property” count before checking that the unknown address is absent. The filter story checks the matching streets and excludes the others for city, state, and zip, both after applying each filter and after reloading. Weather-call checks now follow each rendered create, list, filter, sort, detail, delete, and missing-detail result.

**Absence checks audited**

- Unknown address, line 127: safe after the expected row, street, and count establish that the list query rendered.
- City filter, lines 192 - 193 and 201 - 202: safe after the matching row is identified, both after applying and after reload.
- State filter, lines 212 and 219: safe after both Arizona rows are visible, both after applying and after reload.
- Zip filter, lines 228 - 229 and 235 - 236: safe after the Austin row is identified, both after applying and after reload.
- Deleted row, line 349: safe after the rendered count and row total show two remaining properties.
- Dialog `toBeHidden` checks, lines 331, 338, and 346: already safe; each follows a visible-dialog assertion and the action that closes it.

**Weather-count audit**

Counts follow rendered results for creates (including each property created by the helper), the unknown-location response and subsequent list load, validation, list, every filter application and reload, sort selection and reload, detail navigation, deletion, deleted-detail navigation, and the final weather proof. The list and detail stories also check the count after their initial list query renders. Verdict: the reviewed actions have post-render count checks; the helper checks each successful create individually.

**Command results**

- `npx prettier --check e2e .github package.json` - passed after formatting.
- `npx eslint e2e/stories.spec.ts e2e/playwright.config.ts e2e/weatherstack-stub.ts` - passed.
- `npm run typecheck` - passed for API, web, and e2e workspaces.
- `npx prettier --write e2e/stories.spec.ts` - formatted the edited file.
- `git diff --check` - passed. The working-tree change is limited to the story file; I left the existing untracked slice records untouched.

I did not run `npm run e2e` or start a server, as instructed. The conductor should run the suite and the two red proofs.
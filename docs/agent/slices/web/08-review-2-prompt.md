# Review of slice `web`, round 2

You review a patch for the CoverTree take-home project: a React 19 single-page app (Vite, React Router, urql 5 with its default document cache, plain CSS with design tokens) over a GraphQL API that stores properties with the weather at creation time. You reviewed the whole web slice in round 1. This patch is the fix alone: `git diff 10bb4db 97a1880` without the lockfile and the slice record. You cannot run code; review by reading. Files the patch does not touch are as you saw them in round 1.

Review only. Do not rewrite the code. Report findings.

## Round 1 findings and what was done

1. Major, `ConfirmDialog` disabled the focused button while a delete ran, so focus left the modal, and there was no status. **Fixed in part.** Both buttons now stay focusable and carry `aria-disabled="true"` while pending, their click handlers ignore the press, and a `role="status"` line reads "Deleting…". Test: `AC-WEB-19 pending delete keeps focus, blocks repeat actions, and recovers after failure`. **Not taken:** leaving "Cancel" and Escape working during the request. The round brief says both are blocked while the delete runs, because a closed dialog with a delete still in flight tells the user nothing was deleted when it may be. The known cost is recorded: a request that never answers keeps the dialog open (the client sets no timeout).
2. Major, `PropertyForm` navigated to the new property after the user had left the page. **Fixed.** A ref set in an effect cleanup marks the form unmounted; a late answer neither navigates nor sets state. Test: `AC-WEB-20 leaving the form while saving is not undone by the answer`. The links were not disabled.
3. Major, `WeatherCard` ignored `weather_icons` and showed the first description only. **Fixed.** All descriptions are joined with ", ". The first icon is shown as a decorative image (`alt=""`, 44 by 44, `loading="lazy"`, `referrerPolicy="no-referrer"`) in place of the hard-coded sun; with no icon nothing is rendered. **Not taken:** a "Not reported" row for a missing icon, because a decorative image carries no information for the reader. The list keeps the first description only (one line per row, as on the design board), asserted in `AC-LIST-2`. Test: `AC-DETAIL-5 shows every weather description and the saved icon as a decorative image`.
4. Minor, at phone width the visually hidden `thead` plus `data-label` read each column name twice. **Fixed:** `display: none` on `thead` inside the 600px media query. No test (the test DOM has no media queries).
5. Minor, `transparent` as a colour literal in `base.css`. **Declined.** The slice rule on literals allows the keywords `transparent`, `currentColor` and `inherit`; they are not design values.
6. Minor, tests queried by text and by `querySelector`. **Fixed:** the `<time>` of every row is found by role, the loading status by role, and `AC-CREATE-13 with errors for street and zip code the street field has focus` covers the two-error case.
7. Minor, the field-error wiring was written twice. **Fixed:** `components/FieldErrors.tsx` (`fieldErrorProps`, `FieldErrorMessages`) serves both forms. **Declined:** `ErrorAlert` in the dialog, because `ErrorAlert` has a title and a body and the dialog's alert is one sentence.
8. Minor, a delete answer without data counted as success. **Fixed:** success requires `result.data?.deleteProperty`. Test: `AC-WEB-17 an answer without data keeps the dialog open with the failure message`.

## What to look for

1. Does each fix do what it claims, and does its test prove it?
2. Does the fix introduce a new defect (focus, announcements, races, stale state, the dialog's life cycle)?
3. If you hold that a declined or partly taken finding is still a defect a user would hit, say so once, with the concrete failure.

Do not repeat round 1 findings that were fixed. Do not report style preferences, and do not report the absence of things this patch was not asked to do.

## Form of the answer

A numbered list of findings, most severe first. For each: severity (`blocker`, `major`, `minor`), file and line or symbol, what is wrong, why it matters (the concrete failure), and the smallest fix. If you are unsure whether something is a defect, say so and say what would settle it. If there are no findings, say so. End with one line: `VERDICT: approve` or `VERDICT: changes requested`.

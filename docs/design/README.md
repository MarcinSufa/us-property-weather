# Frontend design

How the three screens of `docs/plan.md` section 10 look. Section 10 stays the description of what they do; where the two disagree about behaviour, section 10 wins and the design is corrected.

## How it was made

On 2026-10-13 the manager session (Claude Opus 5.5) drew the boards on a Claude design canvas, a private artifact on Marcin's account: https://claude.ai/artifact/P6j1fZTVgX6kcseReng843 (it opens only for him unless he shares it). The Claude Design connection itself rejected the login in that session, so no separate design session ran. The manager cannot see a rendered canvas: the boards were written as markup and have not been looked at by the session that wrote them. Marcin's look at the canvas is the review.

The `.dc.html` files here are the sources of those boards, copied unchanged. They load a `support.js` that belongs to the canvas and is not in this repository, so they do not render when opened from disk. Read them as markup: every style is inline, every value is a literal.

## Boards

| File | Route | Shows |
|---|---|---|
| `Main.dc.html` | `/` | Header, filter form (city, state, zip code, apply, clear), sort control, table with seven columns, delete per row |
| `ListStates.dc.html` | `/` | Loading skeleton, "No properties yet", "No properties match these filters" with a clear button, load error with "Try again" |
| `MobileList.dc.html` | `/` at 390px | Filters stacked, rows as cards instead of a table |
| `NewProperty.dc.html` | `/properties/new` | Empty form: street, city, state, zip code, submit, cancel |
| `NewPropertyErrors.dc.html` | `/properties/new` | Field errors under their fields, one alert per weather error code, the sending state |
| `PropertyDetail.dc.html` | `/properties/:id` | Address fields, coordinates, creation time, weather card labelled "Weather at creation" with its observation time |
| `DetailStates.dc.html` | `/properties/:id` | Not found, loading, load error, the delete dialog and its failure message |
| `Tokens.dc.html` | all | Colours, type scale, spacing, radius, buttons, fields, alert |

`canvas.json` holds the position and title of each board on the canvas.

## Tokens

Plain CSS custom properties are enough for this; the plain-CSS choice of plan section 3 stands.

| Token | Value | Use |
|---|---|---|
| `--color-bg` | `#F3F5F7` | page |
| `--color-surface` | `#FFFFFF` | cards, inputs |
| `--color-surface-subtle` | `#F8FAFB` | table head, read-only field |
| `--color-border` | `#D5DBE1` | cards |
| `--color-border-subtle` | `#E6EAEE` | row lines, skeleton, disabled fill |
| `--color-border-input` | `#7B8794` | inputs |
| `--color-text` | `#16202E` | body |
| `--color-text-muted` | `#4A5868` | labels, hints |
| `--color-primary` | `#0B5D5E` | actions, links, focus ring |
| `--color-primary-hover` | `#084647` | hover |
| `--color-danger` | `#B42318` | delete, errors |
| `--color-danger-strong` | `#7A1810` | alert title |
| `--color-danger-bg` | `#FDECEA` | alert fill |

- Type: IBM Plex Sans (400, 500, 600) and IBM Plex Mono for zip codes and coordinates, falling back to `system-ui` and `ui-monospace`. Sizes 28 (page title), 20, 18, 15 (body, line height 1.45), 13 (labels and hints).
- Spacing steps: 4, 8, 12, 16, 24, 32, 40, 48.
- Radius 6 for controls and alerts, 10 for cards and the dialog.
- Controls are 44px high, which is also the smallest touch target. Content is 1120px wide at most, the form 640px.
- Focus: a 3px outline in the primary colour with a 2px offset on every interactive element.
- Light theme only. Skeletons do not animate.

Contrast, computed from the hex values with the WCAG 2 formula: text on white 16.4:1, muted text on white 7.3:1 and on the page background 6.7:1, primary on white 7.7:1, danger on white 6.6:1, alert title on alert fill 9.3:1, input border on white 3.7:1.

## What the design adds to section 10

Wording and small behaviours the plan leaves open. Each is a proposal the `web` brief can take or drop.

- Weather alert sentences: `LOCATION_NOT_FOUND` reads "The weather service does not know this location. Check the zip code and try again. Nothing was saved."; `WEATHER_UNAVAILABLE` reads "The weather service is not answering. Nothing was saved. Try again in a moment."; anything else reads "Something went wrong. Nothing was saved."
- While the create request runs the fields are read-only, the button reads "Saving…" and a status line reads "Looking up the weather…".
- The delete dialog names the street, opens with focus on Cancel, and shows its failure message inside the dialog without closing.
- A weather field that Weatherstack did not send shows "Not reported".
- Below 820px the table scrolls sideways inside its card; at phone width the rows become cards.
- The list shows a count ("4 properties") next to the title.

The fonts are loaded from Google Fonts on the boards. Whether the app loads them, bundles them or uses the system fallback alone is for the `web` brief to decide.

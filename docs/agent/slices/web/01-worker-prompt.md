# Round 1 of 5: foundation (tokens, layout, client factory, documents, routes)

Read `docs/agent/slices/web/00-worker-rules.md` in full first, then `AGENTS.md`, `docs/plan.md` sections 5 and 10, `docs/design/README.md`, and the boards `docs/design/Tokens.dc.html`, `Main.dc.html`, `NewProperty.dc.html`, `MobileList.dc.html` (for the header and the page frame only). Read the current `apps/web/**` skeleton and `apps/api/schema.graphql`.

This round builds the frame the next four rounds fill: list (round 2), form (round 3), detail page (round 4), delete dialog (round 5). Do not build those now. The three pages stay placeholders except for what this round names.

## Proposed criteria used in this round

- `AC-WEB-1`: Given a path no route matches, when the app renders, then it shows "Page not found" with a link to the list.
- `AC-WEB-2`: Given the user opens a route, when the page renders, then the document title names that page.
- `AC-WEB-3`: Given any page, when it renders, then the header shows a link to the list, and a link to the new-property form on every page except the form itself.

## Tests first

Replace `apps/web/src/App.test.tsx`. Write:

1. A shared test helper, `apps/web/src/test/render-app.tsx`: builds a new urql client from the client factory (below) with an absolute URL such as `http://localhost/graphql`, builds a memory router from the exported `routes` with the given initial entries, renders inside urql's `Provider`, and returns what later tests need (at least the router, so a test can read `router.state.location` and call `router.navigate(-1)`, and a `userEvent` instance).
2. The `msw` server in `apps/web/src/test/server.ts` (`setupServer()` with no default handlers), started, reset and closed from `apps/web/src/test-setup.ts` with `onUnhandledRequest: 'error'`.
3. Tests in `apps/web/src/App.test.tsx`, all rendered through the helper:
   - `AC-WEB-2`: each of `/`, `/properties/new`, `/properties/abc-123` renders exactly one level 1 heading, and `document.title` is `Properties - CoverTree`, `Add property - CoverTree`, `Property - CoverTree` respectively. (Round 4 changes the detail title to the street once it has loaded.) The level 1 headings are "Properties", "Add property" and "Property details".
   - `AC-WEB-1`: `/no/such/path` shows a level 1 heading "Page not found", a link named "All properties" whose `href` is `/`, and the title `Page not found - CoverTree`.
   - `AC-WEB-3`: the header (the `banner` landmark) holds a link "Properties" to `/` on every route; a link "Add property" to `/properties/new` on `/` and on `/properties/abc-123`; no "Add property" link inside the banner on `/properties/new`.
   - `AC-WEB-3`: clicking "Add property" in the banner on `/` moves the router to `/properties/new`.

The placeholder pages make no GraphQL request in this round, so no handler is needed and an accidental request fails the test.

Run the tests and save the failing output to `docs/agent/slices/web/01-red-output.txt` (the full Vitest output, redirected). Only then implement.

## Implement

1. `apps/web/src/graphql/client.ts`: export a factory `createGraphqlClient(url: string)` returning a urql client with `cacheExchange` and `fetchExchange`. Remove the module-level client. `apps/web/src/main.tsx` is the only place that builds the browser client (`createGraphqlClient('/graphql')`) and it imports the global stylesheets.
2. `apps/web/src/styles/tokens.css`: every token of the table in `docs/design/README.md` as a custom property on `:root`, with the names of that table; plus the type sizes, the spacing steps, the two radii, the control height (44px), the content width (1120px), the form width (640px) and the two font stacks (`'IBM Plex Sans', system-ui, sans-serif` and `'IBM Plex Mono', ui-monospace, monospace`). A board literal that has no token in the table (for example the dialog backdrop `rgba(22, 32, 46, 0.45)` and the dialog shadow in `DetailStates.dc.html`) becomes an extra token in this file; list each extra token in your reply.
3. `apps/web/src/styles/base.css`: page background, body type (15px, line height 1.45), `box-sizing`, link colours with hover, the `:focus-visible` ring for links, buttons, inputs and selects, a visually-hidden utility class, and the shared classes later rounds reuse so they are written once: card, button variants (primary, secondary, quiet, danger, danger quiet, disabled) per the Components section of `Tokens.dc.html`, field (label, input, select, hint, error text, invalid state with the 2px danger border, read-only state with the subtle surface), alert (icon plus title plus body), skeleton bar (static, no animation), empty state. Links styled as buttons use the same classes as buttons.
4. `apps/web/index.html`: one Google Fonts `<link rel="stylesheet">` for IBM Plex Sans (400, 500, 600) and IBM Plex Mono (400, 500) with `display=swap`, preceded by the two `preconnect` links Google documents. The app must work without the network, which the fallbacks in the font stacks give. Keep `<title>CoverTree</title>` as the initial title.
5. `apps/web/src/components/Layout.tsx` (a layout route with `<Outlet />`): the header per the boards (white surface, bottom border, inner width 1120px, padding 12px 24px, 16px side padding at phone width; the house icon and "Properties" as the brand link to `/`; the "Add property" primary link with the plus icon, absent on `/properties/new`). The pages render their own `<main>`.
6. `apps/web/src/App.tsx`: `routes` stays an exported array, now one layout route with the children `/` (index), `properties/new`, `properties/:id` and `*`. `App` builds the browser router from it.
7. `apps/web/src/pages/NotFoundPage.tsx`: "Page not found" as the `<h1>`, one muted sentence, a link "All properties" to `/`, laid out like the empty-state card of `ListStates.dc.html`.
8. The document title: one small mechanism used by every page (React 19 hoists a `<title>` element rendered by a component into the head; use that unless it does not update `document.title` under jsdom, in which case use one hook and say so). Format: `<page> - CoverTree`.
9. The three placeholder pages: keep them placeholders, give each its `<main>` with the page width of its board (1120px, 640px for the form), its `<h1>` at the page-title size and its title.
10. GraphQL documents in `apps/web/src/graphql/`, one file per operation or one file for all four, with these operation names exactly (tests and `msw` handlers address them by name):
    - `query Properties($filter: PropertyFilter, $sort: PropertySort!)`: `properties(filter: $filter, sort: $sort)` selecting only what the table shows: `id street city state zipCode createdAt weatherData { temperature weather_descriptions }`.
    - `query Property($id: ID!)`: every field of `Property` and every field of `WeatherData` that the schema exposes.
    - `mutation CreateProperty($input: CreatePropertyInput!)`: `createProperty(input: $input) { id }`.
    - `mutation DeleteProperty($id: ID!)`: `deleteProperty(id: $id) { id }`.
    Run codegen after writing them. Nothing uses them yet in this round; if lint flags an unused export, that is fine to leave only if lint is clean (exports are not flagged).

Then run the tests green and save the full output to `docs/agent/slices/web/01-green-output.txt`. Run typecheck, eslint and prettier as the rules file says.

## Out of scope for this round

The list, the filters, the form, the detail page, the dialog, any GraphQL request from a page.

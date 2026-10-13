1. **Files:** Updated the web app entry point, routes, page placeholders, GraphQL client, test setup, and `App.test.tsx`. Added the layout, shared title component, not-found page, styles, GraphQL operations, test helper, and MSW server. Saved the red and green runs in `01-red-output.txt` and `01-green-output.txt`. No files were deleted.

2. **Red run:** The Vitest sandbox wrapper ran the suite with 8 failing tests. The output is saved in [01-red-output.txt](/C:/tmp/covertree-web/docs/agent/slices/web/01-red-output.txt).

3. **Green run and checks:** The same wrapper ran the suite with 8 passing tests; output is saved in [01-green-output.txt](/C:/tmp/covertree-web/docs/agent/slices/web/01-green-output.txt). Codegen, typecheck, ESLint, and Prettier checks all passed.

4. **Departures:** jsdom did not update `document.title` from a React 19 `<title>`, so the shared title component uses one `useEffect` hook. The installed MSW version does not accept `onUnhandledRequest`; its `onUnhandledFrame: 'error'` option makes unhandled requests fail. Added the extra tokens `--color-dialog-backdrop` and `--shadow-dialog` for the dialog literals in the design board.

5. **Could not do:** I did not run the app build because the slice rules prohibit running it in this sandbox.
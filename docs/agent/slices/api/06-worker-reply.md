Implemented the config trimming and composition root. Only these five authorized files changed:

- [main.ts](C:/tmp/covertree-api/apps/api/src/main.ts)
- [config.ts](C:/tmp/covertree-api/apps/api/src/config.ts)
- [config.test.ts](C:/tmp/covertree-api/apps/api/src/config.test.ts)
- [06-red-output.txt](C:/tmp/covertree-api/docs/agent/slices/api/06-red-output.txt)
- [06-green-output.txt](C:/tmp/covertree-api/docs/agent/slices/api/06-green-output.txt)

The red API run had **1 failed and 107 passed**; the new whitespace test failed as expected. The green run had **108 passed**.

- `npx prettier --check apps/api` passed.
- `npm run lint` passed.
- `npm run typecheck` passed.
- API tests passed using the repository’s Vitest sandbox wrapper.

I also made server errors close a live listener and its connections so they cannot keep the process alive. I did not start the server.
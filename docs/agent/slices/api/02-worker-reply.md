Implemented the database, repository, and service slice.

Files changed:

- [database.ts](/C:/tmp/covertree-api/apps/api/src/db/database.ts)
- [database.test.ts](/C:/tmp/covertree-api/apps/api/src/db/database.test.ts)
- [property-repository.ts](/C:/tmp/covertree-api/apps/api/src/property/property-repository.ts)
- [property-repository.test.ts](/C:/tmp/covertree-api/apps/api/src/property/property-repository.test.ts)
- [property-service.ts](/C:/tmp/covertree-api/apps/api/src/property/property-service.ts)
- [property-service.test.ts](/C:/tmp/covertree-api/apps/api/src/property/property-service.test.ts)
- [fake-weather-provider.ts](/C:/tmp/covertree-api/apps/api/src/property/fake-weather-provider.ts)
- [02-red-output.txt](/C:/tmp/covertree-api/docs/agent/slices/api/02-red-output.txt)
- [02-green-output.txt](/C:/tmp/covertree-api/docs/agent/slices/api/02-green-output.txt)

The red run had **21 failures** in the new tests because the database was unimplemented; 54 existing tests passed. The green run passed **75/75 tests**.

- The standard `npm test --workspace=apps/api` hit the Windows sandbox `spawn EPERM` startup error. The prescribed Vitest sandbox wrapper then ran successfully.
- `npx prettier --check apps/api` passed.
- `npm run lint` passed.
- `npm run typecheck` passed.
- The SQL scan found no SQL outside the database and repository files; `git diff --check` passed.

An untracked `docs/agent/slices/api/02-worker-prompt.md` was present in the worktree; I did not modify it.
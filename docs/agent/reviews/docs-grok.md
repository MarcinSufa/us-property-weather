# Grok review of slice `docs`

Reviewer: `grok-4.7` with `context=256k`, `reasoning_effort=high`, `fast=false`, through the Cursor v1 API (`grok-review.mjs`, the fixed file of commit e8edf5e). The id was checked against `GET /v1/models` before round 1 (it lists grok-4.7, grok-4.6 and grok-4.5). The API returns neither the model that answered nor the cost. Prompts and raw replies: `docs/agent/slices/docs/04-`, `07-` and `09-reviewer-prompt.md` and `-reply.md`.

| Round | Patch | Elapsed | Verdict |
|---|---|---|---|
| 1 | `git diff fca2bd7 eefb44b` without the slice record, 42,219 bytes, 7 files | 814 s | CHANGES REQUESTED, F1 to F10 |
| 2 | `git diff eefb44b ff5631a -- README.md`, 9,462 bytes | 377 s | CHANGES REQUESTED, G1 and G2 |
| 3 | `git diff ff5631a 94a012d -- README.md`, 1,798 bytes | 82 s | APPROVED |

## Outcome of each finding

| Id | Severity | Finding | Outcome |
|---|---|---|---|
| F1 | high | "Test it" asks for a real Weatherstack create and says no test calls it | Fixed in ff5631a: the sentence speaks of automated tests, development loops and CI jobs; the manual row is marked as made once by hand, not a reader step. No command is given on purpose. |
| F2 | medium | "A missing value stops the process" although five variables have defaults | Fixed in ff5631a. |
| F3 | medium | "runs with `npm install` and nothing else" | Fixed in ff5631a, then narrowed in 94a012d (G2). |
| F4 | medium | Wrong reason why the SQLite file does not fit Lambda | Fixed in ff5631a with the reviewer's reason. |
| F5 | medium | Error translation in resolvers is logic | Fixed in part in ff5631a. The plan fixes the rule with the translation in it, so the sentence stays; the README names `apps/api/src/graphql/errors.ts` as the place of the mapping. |
| F6 | medium | `grilling`: not a local modification but an older upstream snapshot; the upstream MIT notice is missing | Not fixed. The reviewer checked upstream; the conductor has no network and may state only what the local files establish. Passed to the manager: verify against upstream and add the notice before publication. |
| F7 | medium | `handoff`: the text matches a later upstream revision, so "locally modified" and version 1.0.0 are not exact | Not fixed, same reason. The local registry records commit 03c5eb1 and the installed file differs from it. Passed to the manager to verify. |
| F8 | low | `state` is not free text | Fixed in ff5631a, label corrected in 94a012d (G1). |
| F9 | low | Three workspaces, "two packages" | Fixed in ff5631a. The plan's own table still says "two packages". |
| F10 | low | `npm run dev` does not return, the checks after it are never reached | Fixed in ff5631a: the run block ends at `npm run dev`. Whether `npm run e2e` needs it stopped is left for wave 2. |
| G1 | medium | The label still called state validation unbuilt | Fixed in 94a012d. |
| G2 | low | "no compiled build" against the web build | Fixed in 94a012d with the reviewer's wording. |

## Raw replies

### Round 1

CHANGES REQUESTED

F1. **High.** `README.md`: "One create against Weatherstack, evidence saved without the key" and "No test calls the real Weatherstack service."
Those two statements are in the same Test it section and cannot both be true. The matrix tells a reader to perform a real Weatherstack create; the next sentence says no test does that. There is also no command for the manual row, so a reader cannot carry it out.
Change: Keep one account. If the manual create stays, say that no automated test calls Weatherstack, and give the exact command, the required environment, and where the redacted evidence is written. If no real call is allowed, delete the Real service row.

F2. **Medium.** `README.md`: "A missing or malformed value stops the process with a message naming the variable, never its value."
The same section gives defaults for `WEATHERSTACK_BASE_URL`, `WEATHER_TIMEOUT_MS`, `PORT`, `DATABASE_PATH`, and `LOG_LEVEL`. A missing `PORT` uses `4000`; it does not stop the process. Only `WEATHERSTACK_API_KEY` is required.
Change: Say that a missing `WEATHERSTACK_API_KEY`, or a malformed value for any variable, stops the process with a message that names the variable and not the value. Say that every other variable uses the default in the table.

F3. **Medium.** `README.md`: "the application is meant to run locally with `npm install` and nothing else."
Run it requires Node 24, `.env`, a Weatherstack key, and `npm run dev`. `npm install` alone does not start the application.
Change: Say that no compiled API build, bundled hosting, or cloud deploy is part of this project, and point to the Run it steps.

F4. **Medium.** `README.md`: "Since a SQLite file does not survive between invocations, `PropertyRepository` would get a second implementation over a managed database while the service stayed unchanged."
A file under `/tmp` can survive later warm invocations of the same Lambda environment. The file is still the wrong store: the deployment directory is read-only, `/tmp` is not shared and is discarded when the environment is replaced, and concurrent environments cannot share one SQLite file. The second repository implementation is the right conclusion; the reason is not.
Change: Say that Lambda has no durable shared disk for `./data/properties.db`, so the repository needs a second implementation on a managed database. Leave the service unchanged.

F5. **Medium.** `README.md`: "Resolvers pass arguments to the service and translate domain errors into GraphQL errors."
The architecture rule is that resolvers hold no logic. Validation, weather, and persistence are already placed in `PropertyService`. Error translation is still logic in the resolver.
Change: Say that resolvers only pass arguments and return the service result. Name the non-resolver place that maps domain errors, or delete that mapping from the resolver sentence.

F6. **Medium.** `docs/agent/skills/README.md` (repeated in `docs/agent/skills/grilling/SOURCE.md`): "This is a locally modified copy. The local note says a single skill was taken instead of the whole upstream plugin; which lines differ from upstream is not established locally." Also: "The upstream licence text and its copyright line are not established locally and are therefore not reproduced here."
Taking one skill out of the repository does not modify `SKILL.md`. The copied text matches `skills/productivity/grilling/SKILL.md` on `main` except that it lacks the later sentence `Word each question so "yes" accepts your recommended answer.` That is an older upstream snapshot, not a local edit. The cited repository also publishes an MIT `LICENSE` whose copyright line is `Copyright (c) 2026 Matt Pocock`. The copy should not be in this repository without that notice.
Change: Call it an unmodified upstream snapshot as of the recorded date, note the one sentence current upstream has added, and add the upstream MIT notice beside `SKILL.md`.

F7. **Medium.** `docs/agent/skills/README.md` (repeated in `docs/agent/skills/handoff/SOURCE.md`): "Version: 1.0.0 (plugin manifest). Installed from commit `03c5eb1434a40e322a4ebaa5b3de2fee907a9fa1`" and "This is a locally modified copy: the installed `SKILL.md` differs from the one at the commit above (the spawn modes and the same-window default were added after installation). Whether upstream has since received the same change is not established locally."
The cited commit is real, its manifest version is 1.0.0, and its `SKILL.md` does not contain the spawn modes. Current `main` does contain that same spawn-mode text, plus a later `Rotation actuator` section that this copy does not have. The bytes match an upstream revision between that commit and current `main`, not a local patch, and 1.0.0 is not the version of the file being published.
Change: Cite the commit whose `SKILL.md` matches these bytes, or describe the copy as that intermediate upstream snapshot. Drop "locally modified" unless a diff against that later upstream text exists. The copied `SKILL.md` and `LICENSE` do not contain a private path, a client, a person outside the licence notice, or an email address, so they may stay once the provenance is corrected. Keeping the manifest files out is correct.

F8. **Low.** `README.md`: "Zip-to-city and state validation: the address is trusted as typed, and Weatherstack region naming was measured for one state only."
`state` is not free text. `CreatePropertyInput.state` and `PropertyFilter.state` are `UsState`, the 50 states and DC. City and zip are the values accepted as typed.
Change: Say that city and zip are not checked against each other or against state, and that state must still be a `UsState` code.

F9. **Low.** `README.md`: "npm workspaces: `apps/api`, `apps/web`, `e2e`" and "pnpm or Turborepo: another tool for two packages".
The same cell lists three workspaces and then calls them two packages.
Change: Say three workspace packages, or name which two are meant and why `e2e` is not one of them.

F10. **Low.** `README.md`: "npm run dev" followed in the same block by "npm run verify" and "npm run e2e", then "The last two commands are the checks described in the next section; only the first three are needed to run the application."
`npm run dev` does not return, so a reader who runs the block never reaches the checks. Test it does not say whether that process must be stopped or left up, or whether Playwright starts its own API and web server.
Change: End the Run it block at `npm run dev` and say that it keeps running. State under Test it whether `verify` and `e2e` need that process stopped.
### Round 2

CHANGES REQUESTED

G1. Severity: medium. Quote: "Zip-to-city and state validation: `state` must be a `UsState` code; the city and zip code are accepted as typed and are not checked against each other or against the state, and Weatherstack region naming was measured for one state only." This bullet is under "Not built", and its name still calls state validation unbuilt, while the new text requires `state` to be a `UsState` code. That code check is a validation rule. The rest of the sentence limits the gap to the city and zip code, which are not checked against each other or against the state. Change the label so the unbuilt item is only that cross-check: "Zip-to-city checks: `state` must be a `UsState` code; the city and zip code are accepted as typed and are not checked against each other or against the state, and Weatherstack region naming was measured for one state only."

G2. Severity: low. Quote: "so no compiled build, bundled hosting or deployment is part of it." The same diff says "`npm run verify` runs format check, codegen, lint, typecheck, unit and integration tests, and the web build." The web build is a compiled build, so "no compiled build" is broader than this bullet's subject, "A compiled API build, serving the web bundle from the API or deployment". Change the ending to: "so a compiled API build, serving the web bundle from the API, and deployment are not part of it."
### Round 3

APPROVED

The two replacements resolve G1 and G2. Neither item adds a contradiction or breaks a text rule.
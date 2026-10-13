# Brief: slice `weather`, the Weatherstack adapter

Wave 1. Conductor rules: `docs/agent/handoffs/wave-1.md`. Binding design: `docs/plan.md` sections 4, 8 and 11. This brief adds only what the plan leaves open.

## Owns

`apps/api/src/weather/**`. Nothing else. Fixed by wave 0 and not to change: everything exported from `weather-provider.ts` (`WeatherReport`, `WeatherProvider`, the two error classes) and `WeatherstackProviderOptions` with the constructor of `WeatherstackProvider`, because the `api` slice builds against them at the same time. The types in `weatherstack-response.ts` are used only inside this slice: wave 0 wrote them as a placeholder and this slice replaces them with types inferred from the Zod schema.

## What to build

1. `weatherstack-response.ts`: a Zod schema for the two answers Weatherstack gives, either `{ success: false, error: { code, type } }` or `{ location: { lat, lon }, current: {...} }`. Unknown keys inside `current` are kept, not stripped. `lat` and `lon` arrive as strings and leave as finite numbers; anything else is an unexpected response.
2. `weatherstack-provider.ts`, the body of `getCurrentWeather(address)`:
   - One request: `GET {baseUrl}/current` with `access_key` and `query` (the zip code) built with `URL` and `URLSearchParams`, and `AbortSignal.timeout(timeoutMs)`.
   - Returns `{ lat, long, current }` with `current` whole.
   - Error mapping per plan section 8: code 615 becomes `LocationNotFoundError`; every other `success: false`, a timeout, a network failure, a non-2xx status, a body that is not JSON and a body that fits neither shape become `WeatherUnavailableError` with a short `reason` (`timeout`, `network`, `http_503`, `code_106`, `unreadable_body`, `unexpected_shape`).
   - Read the body before judging the status: code 106 was seen here with HTTP 429, and the code is the better reason.
   - One log line per call through the injected logger: outcome, reason or error code, duration in milliseconds. Never the URL, never the key, never the raw error object of `fetch`.
   - No retry, no cache.
3. Fixtures in `apps/api/src/weather/fixtures/`: `current-85268.json` and `current-unknown.json`, recorded from the real service, with nothing changed except that the key must not be in them.

## Fixtures: two real calls, made by the conductor

The worker never sees the key and makes no network call. Before the first worker round the conductor records the two fixtures itself:

- One `node --env-file=C:/Users/USER/IdeaProjects/CoverTree/.env -e "..."` command per call that fetches `/current` for the query and writes the response body to the fixture file. The command prints the HTTP status and nothing else.
- Queries: `85268`, then `00000`. At least 15 seconds between the two: a second call right after the first was refused with code 106.
- Exactly two calls. A refused or failed call is not repeated: save what came back and report it. The budget of the whole project is four more calls.
- Afterwards prove the key is not in the files with a node check that reads the key from the environment and prints only `true` or `false`.
- Plan section 8 takes code 615 for an unknown location from the documentation; it has not been seen here. If `00000` answers with anything else (a different code, or a location), keep the file as recorded, do not adapt the mapping, and put the finding at the top of your report: the mapping is then the manager's decision.

## Tests (first)

Vitest, a stub `fetch` passed through the constructor, no HTTP mocking library, no network. Each test name starts with its criterion id from `docs/SPEC.md` (area `WEATHER`).

- Success from `current-85268.json`: coordinates are numbers, `current` equals the fixture's `current` key for key.
- The request: one call, the path is `/current`, `query` is the zip code, the signal is an abort signal.
- `success: false` for each mapped code: 615, 101, 104, 105, 106 (with HTTP 429), and one unlisted code.
- HTTP 500 with a non-JSON body, a rejected `fetch` (network), an aborted `fetch` (timeout), a 200 with an unreadable body, a 200 without `location`, a 200 whose `lat` is not a number.
- The key never leaks: run every failure above with the key `MARKER_KEY_7f3a`, collect every log line from a real pino logger writing to a memory stream, and inspect every thrown error to full depth (message, `reason`, `cause`, stack). The marker appears in none of them. Seen red first against an implementation that puts the URL into the error.

## Done when

- `npm run verify` green in the worktree; red and green output in `docs/agent/slices/weather/`.
- The two fixture files exist, the key check printed `false` for "key present", and the number of real calls made (two, or fewer) is in the report.
- The diff touches only `apps/api/src/weather/**` and the slice record.

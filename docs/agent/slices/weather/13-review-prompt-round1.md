# Reviewer prompt: slice `weather`, round 1

You are the code reviewer of one slice of a take-home project: a property management app. API: Node 24 running TypeScript directly (strict, `noUncheckedIndexedAccess`, `erasableSyntaxOnly`, imports with `.ts`), GraphQL Yoga 5, `node:sqlite`, Zod 4, pino 10. Tests: Vitest 5.

The slice is the Weatherstack adapter. It is the only code that knows Weatherstack. `PropertyService.create` (another slice) calls `getCurrentWeather(address)` once per created property; no query calls it. The patch below is `git diff fca2bd7 HEAD` for `apps/api/src/weather/**`. `npm run verify` (format check, lint, typecheck, codegen, tests, build) is green: 161 API tests.

## Fixed, not open to change in this slice

`apps/api/src/weather/weather-provider.ts` (not in the patch, unchanged):

```ts
import type { PropertyAddress } from '../property/property.ts';

export interface WeatherReport {
  lat: number;
  long: number;
  current: Record<string, unknown>;
}

export interface WeatherProvider {
  getCurrentWeather(address: PropertyAddress): Promise<WeatherReport>;
}

export class LocationNotFoundError extends Error {
  constructor() {
    super('Location not found');
    this.name = 'LocationNotFoundError';
  }
}

export class WeatherUnavailableError extends Error {
  reason: string;

  constructor(reason: string) {
    super('Weather is unavailable');
    this.name = 'WeatherUnavailableError';
    this.reason = reason;
  }
}
```

Also fixed: `WeatherstackProviderOptions` and the constructor of `WeatherstackProvider`. `PropertyAddress` is `{ street: string; city: string; state: UsState; zipCode: string }`; the service validates `zipCode` against `^\d{5}$` before the adapter is called.

## The specification the code must meet

- One request: `GET {baseUrl}/current` with `access_key` and `query` (the zip code) built with `URL` and `URLSearchParams`, and `AbortSignal.timeout(timeoutMs)`. No retry, no cache.
- Returns `{ lat, long, current }` with `current` whole, unknown keys kept. `lat` and `lon` arrive as strings. Decided by the manager: a coordinate is a plain decimal string (optional minus, digits, optional fraction), latitude inside -90..90, longitude inside -180..180; anything else is `unexpected_shape`.
- The body is read before the status is judged, because Weatherstack sends its error object with non-2xx statuses (code 106 was seen with HTTP 429, code 615 with HTTP 400). Mapping: failure body with code 615 gives `LocationNotFoundError`; any other failure body gives `WeatherUnavailableError('code_<code>')`; a `fetch` or body-read rejection gives `timeout` (error named `TimeoutError` or `AbortError`) or `network`; a non-2xx status without a failure body gives `http_<status>`; a 2xx body that is not JSON gives `unreadable_body`; a 2xx JSON body of the wrong shape gives `unexpected_shape`.
- Decided by the manager: an error the adapter does not map propagates unchanged and the adapter writes no log line for it (the API layer masks and logs it).
- One log line per call for the success and every mapped failure: `outcome`, `reason`, `durationMs`. Never the URL, never the key, never the raw error object of `fetch`. The key travels in the query string because Weatherstack accepts it no other way, so no thrown error may carry the URL or a `cause`.
- The two fixture files are recorded from the real service (reformatted by Prettier, whitespace only). `current-unknown.json` was answered with HTTP 400.
- Tests: Vitest, a stub `fetch` through the constructor, a real pino logger on a memory stream, no network. Every test name starts with one acceptance-criterion id. Ids AC-WEATHER-13, 14 and 15 are accepted additions.

## What to review

1. Key safety: any path on which the key, the URL or a `fetch` error object can reach a log line, a thrown error (message, property, `cause`, stack) or a return value. Consider real `fetch` behaviour in Node 24 (undici), not only the stub.
2. Correctness of the mapping and its order against the specification, including real-world cases the tests do not exercise: timeout while the body is read, an empty body, a `success: false` body with a non-numeric code, redirects, a base URL with or without a trailing slash or with a query string.
3. The Zod schemas: can a wrong body pass, can a legitimate Weatherstack answer be rejected (look at the recorded fixture), are unknown keys of `current` really kept.
4. The tests: could they pass with a wrong implementation; is the leak test able to miss a leak; is anything asserted only by accident; flakiness.
5. Simplicity: dead code, needless abstraction, anything a reader would stumble over.

## What not to report

The fixed signatures, the absence of retry or cache, style already settled by Prettier and ESLint, the choice of zip code as the query, the reformatting of the fixtures.

## Form of the answer

Start with one line: `VERDICT: APPROVE` or `VERDICT: CHANGES REQUESTED`.
Then a numbered list of findings, most severe first, each as:
`<n>. [BLOCKER|MAJOR|MINOR] <file>:<line or symbol> - <what is wrong> - <what to do>`
Only findings you can point at in the patch. No praise, no summary, no long dashes. If there is nothing to fix, say so in one line.

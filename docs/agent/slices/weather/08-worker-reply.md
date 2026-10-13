Changed only [weatherstack-provider.test.ts](/C:/tmp/covertree-weather/apps/api/src/weather/weatherstack-provider.test.ts). Added the logger-error test, coordinate format and bounds cases, single-criterion test names, and six focused reason tests. The code 615/HTTP 400 fixture and leak checks remain.

Expected results: the logger-error test and all added malformed-coordinate cases are red against the current adapter. That includes hex, exponent, out-of-range, leading plus, trailing dot, leading dot, and leading whitespace for both coordinates. The inclusive bounds test is green.

The file should have 159 tests; with the stated 145-test baseline, the total should be 161. Vitest was not run, as instructed. ESLint, API typecheck, and Prettier all pass. I found no contradictions.
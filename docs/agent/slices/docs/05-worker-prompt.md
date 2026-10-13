# Worker prompt 05: slice `docs`, two facts that are now measured

You are the worker of slice `docs`. Change only `README.md`. Do not run git commands that write. All earlier rules hold (plain sentences, no long dashes, no personal names, `npx prettier --check README.md` passes, exactly six `graphql` fenced blocks).

1. Section "Trade-offs and what comes next", the item on `astro` and `air_quality`. The reason is now measured, not expected. Facts: the whole `current` object of the Weatherstack answer is stored; in the recorded answer it has 18 keys; `air_quality` holds the hyphenated keys `us-epa-index` and `gb-defra-index`, and a GraphQL field name cannot contain a hyphen. Rewrite the item with these facts, keep it to one or two sentences, and remove "This is unverified." and the word "expected".
2. Section "Test it", the table row "Weather adapter". Measured: Weatherstack answered an unknown location with error code 615 in the body and HTTP 400, and a rate limit with code 106 and HTTP 429. The adapter rule is that a body with `success: false` is a failure at any HTTP status and the error code in the body decides. Change the cell that now says "mapped error codes" so that it says: each mapped error code in the body, at any HTTP status. Keep the rest of the row.

Do not state how many real Weatherstack calls were made. Reply with what you changed.

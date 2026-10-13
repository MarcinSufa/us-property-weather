# Worker prompt 08: slice `docs`, fixes after review round 2

You are the worker of slice `docs`. Change only `README.md`, and in it only the two list items below under "Not built". Do not run git commands that write. All earlier rules hold (no long dashes, `npx prettier --check README.md` passes).

- G1, fix. The item that starts "Zip-to-city and state validation:" is under "Not built", but checking that `state` is a `UsState` code is built. Change the label so the unbuilt part is only the cross-check. New item: "Checking that the city, the zip code and the state belong together: `state` must be a `UsState` code, but the city and the zip code are accepted as typed and are not checked against each other or against the state; Weatherstack region naming was measured for one state only."
- G2, fix. The item on the compiled API build ends "so no compiled build, bundled hosting or deployment is part of it", which contradicts the web build that `npm run verify` runs. Change the ending to: "so a compiled API build, serving the web bundle from the API, and deployment are not part of it."

Reply with what you changed.

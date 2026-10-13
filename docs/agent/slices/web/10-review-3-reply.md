Model: grok-4.7
Param context: 256k
Param reasoning_effort: high
Param fast: false
Agent: bc-adc39bc2-df4a-4d2d-90d6-fb1888509e20
Run: run-be11b7da-ad1b-477a-8b08-04620a52b654
Status: FINISHED
Elapsed: 662.902 seconds
---
The Strict Mode fix holds, and the list-refresh test actually proves the claim it makes. No new defect.

The effect now sets `unmounted.current = false` in setup and `true` in cleanup. In development, React replays that as setup, cleanup, setup, so the ref is false while `PropertyForm` is mounted and true after a real unmount. `renderApp` wrapping the tree in `<StrictMode>` is what makes the existing create tests prove it: those tests wait for navigation, field errors, or an alert, and they failed while the ref stayed true. `AC-WEB-14` needed the new assertion because a dropped error still re-enables the button and keeps the typed values.

`AC-LIST-5` matches the default document cache. The held mutation result is only `{ __typename: 'Property', id }`, the street exists only on the list payload, and `created` is set before any later list request can see it. The street can show up only if a list request starts after that result. That is the `additionalTypenames: ['Property']` invalidation refetch, which is why removing the tag leaves "No properties yet". The uncovered case, a list read that starts before the insert and arrives after the mutation, is a real overwrite in urql's document cache, and this test does not hit it (the empty-list assertion waits until that read has finished, and the mock reads `created` when the request is handled). It is not a failure a user hits: the list read is fast, the create waits on the weather lookup, and by the time the form is filled the list request is already done.

No findings.

VERDICT: approve
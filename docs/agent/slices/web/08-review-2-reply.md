Model: grok-4.7
Param context: 256k
Param reasoning_effort: high
Param fast: false
Agent: bc-f07c37dc-1343-4398-ad90-7c43f9f488a7
Run: run-f2931186-3753-4e3a-adc0-108f1d52bc26
Status: FINISHED
Elapsed: 1267.112 seconds
---
1. **Major.** `PropertyForm`’s `unmounted` effect (the effect whose cleanup sets `unmounted.current = true` and whose setup does nothing). In development, React Strict Mode runs effect setup, then cleanup, then setup again on the same instance, and it does not reset refs. The cleanup leaves `unmounted.current` true for the rest of the mount. Every later `onSubmit` still sends `createProperty`, then hits `if (unmounted.current) return` and skips both `navigate` and the field-error / alert updates. `finally` still sets `pending.current` false, so the form looks idle. A successful save stays on `/properties/new` and shows no error. The property is already stored, and another click creates a second one. `AC-WEB-20` and the other create tests never mount the form under Strict Mode, so they stay green. Smallest fix: set `unmounted.current = false` in the effect setup before returning the cleanup. What settles the uncertainty: if the root render does not use `StrictMode`, this extra cycle does not run and this failure does not happen. The Vite React template does use it, and the cycle is development-only.

2. **Major.** `PropertyForm` `onSubmit`, the `unmounted.current` return before `navigate`. A create that finishes after the user has left is dropped on purpose, and nothing else tells the list about the new row. urql’s default document cache does not insert a mutation result into the `Properties` query, and the default request policy is cache-first. The create is the slow call because it stores weather. The usual path is: the list was already cached, or its fetch finishes while the weather lookup is still running; then the success handler returns and the list never reloads. The new property is on the server and absent on `/`. The form can be opened again and saved again. `AC-WEB-20` scripts the list response as `{ properties: [] }` and expects “No properties yet” after `successResponse()`, so it locks that outcome in. Smallest fix: on `result.data?.createProperty`, if the form is gone, do not navigate, and reexecute the active `Properties` query network-only. A list request that started before the insert can still resolve later and write the stale document back, so that refresh has to be the one that lands last.

`VERDICT: changes requested`
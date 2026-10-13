# Grok trial review through the Cursor v1 API (2026-10-13)

One call, made to prove the reviewer route before any slice depends on it. The diff is synthetic and carries three planted defects, one per project rule.

- Route: `POST https://api.cursor.com/v1/agents`, no `repos` and no `env` (a no-repo agent), then `GET /v1/agents/{id}/runs/{runId}/stream` until the `done` event, then `GET /v1/agents/{id}/runs/{runId}` for the final text.
- Auth: the ordinary user API key from `CURSOR_API_KEY`, Basic auth. The create call answered HTTP 201.
- Model requested: `grok-4.7` with context=256k, reasoning_effort=high, fast=false. The API does not echo the model back; "MODEL: Grok 4.7" in the reply is the model describing itself.
- Run: status FINISHED, 34128 ms.
- Cost: not returned by the API. Read it from the Cursor dashboard.
- Result: 3 of 3 planted defects found, verdict BLOCK, no false finding.

## Prompt (verbatim)

~~~text
You are a read-only code reviewer. You have no repository and need no tools: review ONLY the diff below, do not create files, do not run commands.

Project rules the diff must satisfy:
1. The Weatherstack API is called ONLY inside the createProperty mutation, never from a query resolver.
2. zipCode is exactly 5 digits. state is exactly 2 uppercase letters.
3. If the weather call fails, the property is NOT persisted.

Reply in exactly this format:
MODEL: <the model name you are running as>
VERDICT: APPROVE or BLOCK
FINDINGS: a numbered list, each with severity (P1, P2, P3), the file and line quoted from the diff, the rule broken, and a one-line fix. Report only defects you can point to in the diff. If there are none, write 'none'.

```diff
--- /dev/null
+++ b/apps/api/src/validation.ts
@@ -0,0 +1,9 @@
+import { z } from 'zod';
+
+export const createPropertyInput = z.object({
+  city: z.string().trim().min(1),
+  street: z.string().trim().min(1),
+  state: z.string().regex(/^[A-Z]{2}$/),
+  zipCode: z.string().regex(/^\d{5}/),
+});
+export type CreatePropertyInput = z.infer<typeof createPropertyInput>;
--- /dev/null
+++ b/apps/api/src/resolvers.ts
@@ -0,0 +1,27 @@
+import { createPropertyInput } from './validation';
+import type { Context } from './context';
+
+export const resolvers = {
+  Query: {
+    properties: (_: unknown, args: { filter?: PropertyFilter }, ctx: Context) =>
+      ctx.repository.list(args.filter),
+    property: async (_: unknown, args: { id: string }, ctx: Context) => {
+      const property = await ctx.repository.findById(args.id);
+      if (!property) return null;
+      const weather = await ctx.weather.current(`${property.city}, ${property.state}`);
+      return { ...property, weatherData: weather.current };
+    },
+  },
+  Mutation: {
+    createProperty: async (_: unknown, args: { input: unknown }, ctx: Context) => {
+      const input = createPropertyInput.parse(args.input);
+      const saved = await ctx.repository.insert(input);
+      const weather = await ctx.weather.current(input.zipCode);
+      return ctx.repository.update(saved.id, {
+        weatherData: weather.current,
+        lat: Number(weather.location.lat),
+        long: Number(weather.location.lon),
+      });
+    },
+  },
+};
```
~~~

## Reply (verbatim)

~~~text
MODEL: Grok 4.7
VERDICT: BLOCK
FINDINGS:
1. P1 — `apps/api/src/resolvers.ts:11` `const weather = await ctx.weather.current(`${property.city}, ${property.state}`);` — Rule 1: Weatherstack is called from the `property` query resolver. Fix: delete that call and return the stored property.
2. P2 — `apps/api/src/validation.ts:7` `zipCode: z.string().regex(/^\d{5}/),` — Rule 2: the regex is not end-anchored, so it accepts more than 5 digits. Fix: use `/^\d{5}$/`.
3. P1 — `apps/api/src/resolvers.ts:18` `const saved = await ctx.repository.insert(input);` — Rule 3: the property is inserted before the weather call, so a failed call leaves it persisted. Fix: call weather first and insert only after it succeeds.
~~~

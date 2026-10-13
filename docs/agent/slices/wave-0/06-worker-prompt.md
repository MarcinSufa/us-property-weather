# Worker prompt 06: wave 0, round 6 (agent rules and the spec, corrected sources)

You stopped round 5 correctly: `docs/agent/slices/wave-0/05-worker-prompt.md` limited the sources of `docs/SPEC.md` to plan sections 5, 7, 8 and 10 while requiring a criterion (same-millisecond rows keep insertion order) that the plan states only in section 6.

Do the whole of `docs/agent/slices/wave-0/05-worker-prompt.md` now, read it in full first, with this one correction: plan section 6 is an allowed source for criteria about stored data and ordering, cited as `Source: plan 6`. Every other rule of that prompt stands, including its hard rules and its final message. If you meet another conflict of the same kind, where a required criterion has its only source in another section of `docs/plan.md`, cite that section, write the criterion, and list it in your final message instead of stopping.

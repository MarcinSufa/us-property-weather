Wrote [AGENTS.md](/C:/tmp/covertree-wave0/AGENTS.md), [CLAUDE.md](/C:/tmp/covertree-wave0/CLAUDE.md) and [docs/SPEC.md](/C:/tmp/covertree-wave0/docs/SPEC.md). No code or other documents were changed.

The spec has **60 criteria**: CREATE 17, LIST 5, FILTER 8, SORT 4, DETAIL 5, DELETE 4, WEATHER 12 and ERROR 5. The required Prettier check passed, and `AGENTS.md` is 81 lines.

Three criteria cite plan section 6, as authorized: **AC-CREATE-16** (store the full weather object), **AC-CREATE-17** (database timestamp precision) and **AC-SORT-3** (insertion order for same-millisecond rows). No other required criterion had its only source in another plan section. Pre-existing untracked round files were left untouched.
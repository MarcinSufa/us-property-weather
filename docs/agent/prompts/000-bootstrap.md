# 000: bootstrap (2026-10-13)

First session in this folder (Claude Code, Cursor extension, model Claude Opus 5.5), before the folder was a git repository. It read the brief (`cover-tree.md`) and a reference workflow, installed the exo-compact plugin, asked round 1 of the grilling and ended with a handoff to a fresh session so the plugin could load. No project file was written.

Prompts are quoted as typed, in Polish, typos included. Source: the session transcript, each prompt confirmed by a text search of the transcript file. Two passages of prompt 1 were replaced by `[redacted]` before publication, at Marcin's request (prompt 34 in `001-planning.md`).

## Prompt 1

> hej chcę żebyśmy użyli podobneg flow jak w [redacted] - czyli raportowanie sesji i historii i decyzji, również chcę użyć podobnych skill i pluginów jak tam , zacząć od planowania z grill-me , grill-me-with-docs , sprawdź cover-tree.md , [redacted] Pracować po planowaniu będziemy w wielu sesjach orkietrowanych , gdzie workerem będzie luna, opus 5.5 będzie orkiestrował w każdej  równoległych sekcji, grok będzie review robił - używająć api cursora .

Outcome: the working model for this repo. A manager session plans and merges, one Opus 5.5 conductor per slice, GPT Luna implements through `codex exec`, Grok reviews through the Cursor API, and every prompt, decision and review round is kept in the repo.

## Prompt 2

> przy planowaniu pamiętaj żeby planować pod sesje równoległe żeby jak najwięcej pracy było robionej równoleke

Outcome: the plan is split into waves with one serial wave only (the GraphQL schema as the contract), everything else in parallel sessions with file ownership per slice.

## Prompts 3 to 6

> mozemy również użyć mojego skilla exo-compact

> przetestujemy jak dziala na windowsie

> i jak sobie radzi przy dużej delegacji zadań do innych sesji które pracują w orkietracji

> mozesz tutaj zainstalować tego skilla exo-compact z mojego repo

Outcome: exo-compact 4.7.3 (Marcin's own context-compaction plugin, private repository) installed with local scope for this folder. The work doubles as its test on Windows and under heavy delegation to orchestrated sessions.

## Prompt 7

> musimy chyba najpierw sesje zresetować

Outcome: handoff written, session closed. Round 1 of the grilling (nine questions with a recommendation each) had been asked and not answered; it is asked again in `001-planning.md`.

# Writing elective lessons (E1 to E3): addendum

Read `design/NEXT_LESSONS.md`, `design/AI_LESSONS.md` and `design/DIAGRAMS.md` first. Every rule there applies. This file lists only what is different for the three elective modules.

## 1. Where things go

- Modules and slugs come from `src/lib/ai-syllabus.ts`: `ai/e1-classic-ml`, `ai/e2-training`, `ai/e3-inference-deep`. Do not rename.
- Lesson path: `src/content/lessons/ai/<module-slug>/<lesson-slug>.mdx`. Create the folder if missing.
- Components: `src/components/anim/lessons/AiE1<Name>.tsx`, `AiE2<Name>.tsx`, `AiE3<Name>.tsx`. Simulator maths goes in a separate `AiE<n><Name>Logic.ts` with a quick node check.
- Spec for each lesson (Write, Animate, Prove it, sources) is in `AI_SYSTEM_DESIGN_PLAN.md`, section "Part: Electives (optional) (E1 to E3)". Source keys like [M1], [C7], [K3] map to URLs in the sources list of the same file (grep `- \[K3\]`). Follow the topic list. You may improve animation ideas.

## 2. Who reads this

A backend engineer who finished the core AI track (A0 to A14) or parts of it, and now wants depth for an ML-infrastructure, training or inference role. The electives are optional and come last. They may link to any core AI lesson and any backend lesson. Do not re-teach what a core lesson already teaches: check `ls src/content/lessons/ai/*/` and read the lesson you build on (especially `ai/a2-inference-cost/*` for E2 and E3, `ai/a5-rag/*` and `ai/a8-evals/*` for E1). Link it in one sentence and go deeper.

Still teach every new term at the moment of need (question-chain style of `src/content/lessons/ai/a12-multimodal/vlms.mdx` and `speech-pipeline.mdx`; read one before writing): four parts per idea (what, picture, why, example). No arXiv IDs or spec numbers in prose, tables, captions or quiz text; only in Further reading.

## 3. Lesson shapes

- **Concept lessons** (most): NEXT_LESSONS.md lesson contract. About 3,000 to 4,000 words, set by the number of ideas. End with "## What experienced teams know" (4 to 6 sourced field notes), Trade-offs, Interview lens, Check yourself, Further reading.
- **Capstones** (E1.10 video-recommendation, E1.11 ad-click-prediction, E1.12 fraud-detection): follow the A13 case shape in `design/AI_CASES.md` sections 2 and 3 (DesignBuild first, drills listed in the plan block, staff vs senior, 4,000 to 5,500 words). Read `src/content/lessons/ai/a13-cases/support-agent.mdx` for the house shape.
- **Teardowns** (E1.13 michelangelo-monolith-radar, E2.7 llama3-reliability): follow `design/AI_WILD.md` (Company claim / Our reading labels, numbers table with what is NOT published, 2,800 to 3,800 words). Read `src/content/lessons/ai/a14-wild/characterai-inference.mdx` for the house shape.

## 4. Numbers policy wins over the plan

The plan was written before the Numbers policy (NEXT_LESSONS.md, 2026-10-20). Where they conflict, the policy wins:

- No `Ballpark` anywhere in the electives. Where the plan says "Prove it: Ballpark", write a `Diagnose` or a concept quiz question instead (what happens, why, which choice).
- No step-by-step arithmetic walks in prose and no quiz question that asks the reader to compute. A single sourced order-of-magnitude anchor that explains a design choice is fine ("~16 bytes per parameter, so one GPU cannot hold a 70B model's training state").
- Interactive calculators and simulators are allowed: the widget does the arithmetic, the prose states the conclusion. Label assumptions in the widget "illustrative" when they are not sourced.
- Published figures from a source (a paper's speedup, a company's latency) are fine. Cite them, label vendor numbers "company claim" or "paper claim", and state what exactly they measure.

## 5. Facts

- Fetch every source you cite yourself and read the relevant part. The plan marks some claims UNVERIFIED or "writer must verify/source": find a primary source or drop the claim.
- Prices: provider, model or GPU, unit, price, "as of 2026-10-28", pricing page URL. Fetch the page. If it will not load, leave the number out. GPU prices may come from `src/lib/ai-prices.ts` if its as-of date is stated.
- Known verified facts from earlier lessons: Llama 3.1 8B on one H100 serves about 4,485 output tok/s in the E2E benchmark (throughput column is input+output); 70B in BF16 needs 2 or more H100s. Do not contradict existing core lessons; if you find one wrong, report it, do not edit it.

## 6. Rules for parallel writers

- Touch only your own lesson files and your own new components. Do not edit shared files (syllabus, tracks, plan, glossary, other lessons, shared components). Report shared-file problems in your final message.
- `requires` may name elective lessons earlier in the syllabus order even if their file is not written yet (the build checks the syllabus, not files). Never link (`/learn/...`) to a lesson file that does not exist yet; write "lesson E1.5" as plain text. The orchestrator turns those into links later.
- Do not commit.
- Quiz rules from NEXT_LESSONS.md: plain literals, globally unique question text, answer index spread, correct option not the longest. Unique `Diagnose` ids (prefix with the lesson slug).

## 7. Verify before you report

- `npx astro check` (0 errors in your files).
- `python3 scripts/quiz-audit.py --strict` and `python3 scripts/diagnose-audit.py` (no flags in your files).
- `node` check of every Logic.ts calculation you rely on.
- Do NOT run a full `astro build` or start a dev server: many writers run at once and builds collide. The orchestrator builds and sweeps pages at 1280 and 390 after all writers finish.
- Confirm each Further reading URL loads.
- Final report under 150 words per lesson: files, word counts, components, claims you dropped or could not verify, shared-file problems.

# Writing A14 "In the Wild" teardowns: addendum

Read `design/NEXT_LESSONS.md`, `design/AI_LESSONS.md`, and `design/AI_CASES.md` first. Every rule applies except the case-study section order and length in `AI_CASES.md`. A teardown reads one real system through one primary source and asks: what did they build, what numbers did they publish, what is our reading, and what would we copy.

## 1. Shape

- 2,800 to 3,800 words of prose. Path: `src/content/lessons/ai/a14-wild/<slug>.mdx`. Slug and title from `src/lib/ai-syllabus.ts`. Components: `src/components/anim/lessons/Ai14<Name>.tsx`.
- Read two finished lessons for house style and structure: `src/content/lessons/ai/a13-cases/support-agent.mdx` and `src/content/lessons/12-in-the-wild/shopify-inventory.mdx` (the backend teardown shape). Use the question-chain teaching style of `ai/a12-multimodal/speech-pipeline.mdx`: teach every term at the moment of need; four parts per idea (what, picture, why, example).
- Fetch the primary source(s) named in the plan block yourself, read the WHOLE page, and quote exactly. If a page does not load, say so and do not use its numbers. Labelling is mandatory: every claim from the source is a "**Company claim**" (with the source and its date); every inference of ours is "**Our reading**". Never present a vendor number as measured fact. Never invent a figure the page does not state; say "not published".
- Spec: `AI_SYSTEM_DESIGN_PLAN.md`, section "A14. In the Wild", the block for your lesson. Follow its topic list; you may improve the animation ideas.

## 2. Sections (h2)

1. **What they built and why it was hard** (the problem with the source's own numbers).
2. **The before** (the naive or earlier design, with its cost or failure).
3. **The design** (what the source describes, step by step, in plain words; each mechanism is taught from scratch and linked to the A0 to A13 lesson that teaches the general idea: `/learn/ai/<module>/<lesson>/`, only lessons whose files exist).
4. **The numbers** (every published figure in a table: figure, what it measures exactly, source and date, label; and what is NOT published).
5. **Our reading** (what we infer, how it maps onto lessons, what we would test before copying it).
6. **What to copy and what not to** (a short table: idea, when it fits, when it does not).
7. **Interview lens** (`Callout` tip and mistake), **Check yourself** (`Quiz` 4 questions, plus the Diagnose the plan names; no Ballpark, unique ids), **Further reading** (the primary source plus 1 to 3 more you fetched and confirmed load).

## 3. Visuals

Two: (1) a step-through of the before/after or the mechanism with `AnimFrame` or `DesignCompare` (see `src/components/anim/DesignBuild.tsx`, `src/components/anim/lessons/ShopifyCompare.tsx`); (2) the second visual the plan names (simulator, bar compare, timeline). Follow `design/DIAGRAMS.md`. Interactive maths goes in a separate `.ts` file with a node check; label simulator assumptions "illustrative".

## 4. Rules

Frontmatter `summary` single-quoted; `requires` earlier lessons only (A13 lessons are earlier than A14; check `src/lib/ai-syllabus.ts`). Quiz rules from `NEXT_LESSONS.md` (plain literals, unique question text, correct option not the longest, answer index spread). Prices as of today with the page URL. Do not commit. Touch only your own lesson file and new components. Verify: `npx astro check`; scratch build into `~/.cache/<name>-dist`; `python3 scripts/quiz-audit.py --strict`; `python3 scripts/diagnose-audit.py`; node check of maths; sweep at 1280 and 390 (no console errors, no horizontal scroll, SVG text at least 12px); view animation steps in light and dark; Further reading URLs return 200. Final report under 150 words.

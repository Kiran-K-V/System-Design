# Writing A13 case studies: addendum

Read `design/NEXT_LESSONS.md` and `design/AI_LESSONS.md` first. Every rule there applies. This file adds the rules for the A13 deep cases. Quality over quantity: each case is a full lesson, not a sketch.

## 1. What a deep case must do

- 4,000 to 5,500 words. Written in the question-chain teaching style of `src/content/lessons/ai/a12-multimodal/speech-pipeline.mdx` and `vlms.mdx` (read both): terms taught at the moment of need, four parts per idea (what, picture, why, example), no spec or arXiv IDs in prose or captions.
- The reader is a backend engineer who has finished A0 to A12. Do not re-teach a mechanism an earlier lesson teaches. Link it (`/learn/ai/<module>/<lesson>/`) in one sentence and build on it. Check `ls src/content/lessons/ai/*` for what exists. Never link to a lesson that is not written yet; write "lesson A9.5" as plain text.
- Lesson path: `src/content/lessons/ai/a13-cases/<slug>.mdx`. Slugs come from `src/lib/ai-syllabus.ts`. Components: `src/components/anim/lessons/Ai13<Name>.tsx`.
- The spec for each case (requirements, deep dives, drills, sources) is in `AI_SYSTEM_DESIGN_PLAN.md`, section "A13. Case Studies". Follow it. Improve an animation idea if you can; do not drop a deep dive or a drill.

## 2. Section order (h2)

1. **The problem** (one paragraph: the pain, then what makes this hard).
2. **Requirements and the quality bar.** Functional, out of scope, and non-functional in words (fast, cheap, correct), with a number only when it sets the bar. Say which metric is the bar and how it is measured.
3. **Eval plan.** Before any design (A0.2 method: eval is step 2). Offline set, online signals, the slice that matters.
4. **Budgets.** Which stage dominates latency and cost, and why. No arithmetic walk; state the conclusion. Latency per stage and dollars per request. Live prices only, with provider, model, unit, price, "as of 2026-10-19" and the pricing page URL. Fetch the page yourself. If you cannot load a price, leave the number out.
5. **Core entities and API.** Short.
6. **A naive design and where it breaks.** Show the failure as a story.
7. **High-level design.** Built step by step with `DesignBuild` (one box per requirement, each step names the requirement).
8. **Three deep dives** (h2 each, named for the idea). Each has a worked example. At least one has a second interactive visual (`DesignCompare` or a simulator with sliders).
9. **Failure modes and an incident drill.** A table of failure modes (what happens, how you detect it, what you do). Then one `Diagnose` with a unique id.
10. **Drills** (only where the plan lists them). A "## Drill: <name>" h2 each, 10 to 15 minutes of work: bar, design in a few paragraphs, a failure, a `Diagnose`. Drills need their own sources.
11. **Staff answer vs senior answer.** A two-column table or two short blocks. Concrete differences, not adjectives.
12. **What experienced teams know.** 4 to 6 sourced field notes (cutting-edge, high ROI, "forbidden knowledge"). Each states the claim, the source, and our reading when it is our inference.
13. **Trade-offs** (table), **Interview lens** (`Callout` tip and mistake), **Check yourself** (`Quiz` 4 to 5 concept questions, no `Ballpark`), **Further reading** (2 to 5 URLs you fetched and confirmed load).

## 3. Rules that matter most

- Every number is sourced, derived on the page, or marked "illustrative". The plan lists some figures that are vendor claims: label them "company claim". Where the plan says UNVERIFIED or "writer must source", find a primary source or drop the number.
- Prices and model facts change. Use the date 2026-10-19. Do not copy price numbers from older lessons without checking the pricing page.
- Show one real failure pattern from a cited source, not an invented one. Mark made-up examples "illustrative".
- Say how often something fails, not only that it can.
- Overlap with the Backend track: open with 3 to 5 sentences and a `CrossTrackLink` card, then cover only the AI-specific part (see the overlap table in the plan).
- Animation 1 is `DesignBuild` (see `src/components/anim/DesignBuild.tsx` and a backend case such as `src/components/anim/lessons/AdClickBuild.tsx`). Animation 2 is `DesignCompare` or a simulator. Logic of a simulator goes in a separate `.ts` file with a quick node check of the numbers. Follow `design/DIAGRAMS.md`.
- Quiz rules: plain literals, globally unique question text, answer index spread, correct option not the longest. Run `python3 scripts/quiz-audit.py --strict` and `python3 scripts/diagnose-audit.py`.
- Do not commit. Do not edit shared files. Touch only your own lesson file and your own new components. Report shared-file problems to the orchestrator.

## 4. Verify before you report

`npx astro check` (0 errors). Scratch build into `~/.cache/<name>-dist` (never `dist/`; concurrent builds can collide on `.astro/.prerender`, so retry). Hand-check every computed number. Drive each widget with a script. Check the page at 1280 and 390 widths (no console errors, no horizontal scroll, SVG text at least 12px rendered). Confirm Further reading URLs load. Final report under 200 words: file, word count, components, unverified claims, shared-file problems.

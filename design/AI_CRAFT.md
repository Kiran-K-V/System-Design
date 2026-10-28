# Writing A15 "The AI Engineer's Craft" lessons: addendum

Read `design/NEXT_LESSONS.md` and `design/AI_LESSONS.md` first. Every rule there applies. A15 teaches daily skills, not architecture: how a strong AI engineer works, debugs, and decides. The reader should finish each lesson with a habit they can use tomorrow.

## 1. Shape

- Path: `src/content/lessons/ai/a15-craft/<slug>.mdx`. Slug and title from `src/lib/ai-syllabus.ts`. Components: `src/components/anim/lessons/Ai15<Name>.tsx`.
- Spec: `AI_SYSTEM_DESIGN_PLAN.md`, section "A15. The AI Engineer's Craft", the block for your lesson. Follow its topic list. Use its `requires` list.
- Research notes: `design/research/a15/<slug>.md`. A Haiku worker wrote them. Treat them as leads, not facts. Before you use a number or a quote, open its URL and check it. If the page does not say it, drop it. Notes marked UNVERIFIED are not usable until you load the page.
- Length: about 3,000 to 4,000 words of prose.
- House style: read `src/content/lessons/ai/a9-llmops/versioning.mdx` and `src/content/lessons/ai/a8-evals/judges.mdx` end to end. Copy their section order and their teaching style: a short problem story, then a chain of plain questions or ideas, a naive way that fails, the real fix, trade-offs, "What experienced teams know", interview lens, check yourself, further reading. Teach every term at the moment of need. Four parts per idea: what, everyday picture, why, example.
- Numbers policy: A15 lessons are NOT number lessons. No `Ballpark`, no arithmetic quiz, no step-by-step math. A sourced order-of-magnitude anchor is fine.

## 2. Craft-specific rules

- **Show the practice, not only the theory.** Each lesson must contain at least one concrete artifact the reader can copy: a checklist, a short file template, a command, a prompt snippet, or a step list. Put it in a fenced code block or a table.
- **"What experienced teams know"**: 4 to 6 numbered field notes. Each is a non-obvious, high-value lesson with a linked source you loaded. Same shape as `versioning.mdx`.
- **No overlap.** Earlier lessons already teach some of this. Read the overlap lessons named in section 3 for your slug. Do not re-teach their content. Give a one or two sentence recap and link it (`/learn/ai/<module>/<lesson>/`), then go further.
- **Vendor neutral.** Name tools as examples (Claude Code, Codex, Cursor; DSPy, GEPA), not as the one right answer. A tool fact that can change carries "as of 2026-10-28".
- **Label claims.** A vendor's own number is "a vendor claim". A study result names the study. Do not present a vendor number as a measured fact.

## 3. Overlap map (read these before writing)

| Lesson | Read and link, do not repeat |
|---|---|
| A15.1 driving-coding-agents | `a13-cases/coding-agent.mdx` (how a coding agent is built), `a14-wild/claude-agent-sdk.mdx`, `a6-agents/subagents.mdx`, `a4-context/compaction.mdx` |
| A15.2 prompt-optimization | `a4-context/prompts-as-code.mdx`, `a4-context/few-shot-examples.mdx`, `a8-evals/golden-sets.mdx`, `a11-finetuning/reinforcement-finetuning.mdx` (for the GEPA vs RL contrast) |
| A15.3 model-migration | `a9-llmops/versioning.mdx` (already covers pinned IDs, drift study, format sensitivity, retirement deadlines; do not repeat those field notes), `a8-evals/rollout.mdx`, `a8-evals/online-evals-ab.mdx` |
| A15.4 debugging-model-behavior | `a1-model-function/tokens.mdx`, `a1-model-function/sampling-decoding.mdx`, `a0-orientation/probabilistic-components.mdx` (mentions batch invariance), `a8-evals/error-analysis.mdx`, `a9-llmops/tracing.mdx` |
| A15.5 reading-benchmarks | `a8-evals/golden-sets.mdx` (contamination, SWE-bench), `a1-model-function/scaling-laws.mdx` (model choice), `a5-rag/embedding-models.mdx` (MTEB leaderboard) |

## 4. Visuals

Two per lesson. Follow `design/DIAGRAMS.md` (hand-drawn look). One step-through with `AnimFrame` (see existing `Ai9Ver*.tsx` components for the pattern). One second visual: a compare, a simulator, or a checklist widget. Interactive maths goes in a separate `.ts` file with a node check; label assumptions "illustrative". SVG text at least 12px rendered.

## 5. Rules

Frontmatter `summary` single-quoted; `requires` exactly as the plan block says. Quiz: 4 questions plus one `Diagnose` (unique id), plain literals, unique question text, correct option not the longest, answer index spread across 0 to 3. Do not commit. Touch only your own lesson file and your new `Ai15*` components. Do not edit shared files (syllabus, tracks, other lessons).

Verify before you report: `npx astro check` 0 errors; scratch build `npx astro build --outDir ~/.cache/a15-<slug>-dist` (another writer may be building at the same time; if `.astro/.prerender` collides, wait and retry); `python3 scripts/quiz-audit.py --strict`; `python3 scripts/diagnose-audit.py`; node check of any maths; page sweep at 1280 and 390 (no console errors, no horizontal scroll, SVG text at least 12px; helper scripts in the session scratchpad, `playwright-core` with `/usr/bin/google-chrome`); view first, middle and last animation steps in light and dark; Further reading URLs return 200. Delete your scratch build after. Final report under 150 words: files, word count, checks run and results, any claim you dropped.

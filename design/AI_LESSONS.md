# Writing AI track lessons: addendum

Read `design/NEXT_LESSONS.md` first. Every rule there applies (lesson contract, quiz rules, visual contract, verification, gotchas). This file lists only what is different for the AI System Design track.

## 1. Where things go

- Lesson path: `src/content/lessons/ai/<module-slug>/<lesson-slug>.mdx`. Module and lesson slugs come from `src/lib/ai-syllabus.ts`. Do not rename them.
- Lesson id: `ai/<module-slug>/<lesson-slug>`, for example `ai/a1-model-function/tokens`.
- Imports are one level deeper than backend lessons: `../../../../components/lesson/Quiz.tsx`, `../../../../components/anim/lessons/<Name>.tsx`.
- Components: `src/components/anim/lessons/Ai<module><Name>.tsx`, for example `Ai1BpeMerge.tsx`, `Ai0MethodFlow.tsx`. The prefix stops collisions between parallel writers.
- Elective modules (optional, last in the track) use ids `ai/e1-classic-ml/<lesson>`, `ai/e2-training/<lesson>`, `ai/e3-inference-deep/<lesson>`. They display as E1, E1.3 (the `label` field in `ai-syllabus.ts`), not A15. A core lesson (A0 to A14) must not require an elective lesson. The build fails if it does. Write a pointer to an elective as plain text, for example "elective E3.4".
- The lesson spec (Write, Animate, Prove it, sources) for each lesson is in `AI_SYSTEM_DESIGN_PLAN.md` section 3. Follow it. You may improve an animation idea; do not drop the topic list.

## 2. Links and requires

- AI lesson URL: `/learn/ai/<id without the ai/ prefix>/`. Example: `/learn/ai/a1-model-function/tokens/`.
- Backend lesson URL: `/learn/backend/<id>/`. Example: `/learn/backend/01-one-machine/latency-numbers/`. Do not use the old `/learn/<id>/` form.
- `requires` takes full ids. An AI lesson may require a backend lesson (`'01-one-machine/estimation'`) or an earlier AI lesson (`'ai/a0-orientation/ai-design-method'`). Only earlier lessons; the build checks it.
- Never link forward to an unwritten lesson. Write "lesson A5.1" as plain text.

## 3. Overlap with the backend track

When a topic is already taught in the backend track, do not teach it again. Give a 3 to 5 sentence summary and a `CrossTrackLink` card, then go deeper only on the AI-specific part.

```mdx
import CrossTrackLink from '../../../../components/CrossTrackLink.astro';
<CrossTrackLink id="01-one-machine/estimation">Short summary of what that lesson teaches and why it matters here.</CrossTrackLink>
```
Check the component's props in `src/components/CrossTrackLink.astro` before use.

## 4. Math

Formulas use the shared component. No client JS.

```mdx
import Math from '../../../../components/lesson/Math.astro';
Inline: the cache holds <Math tex="2 \times L \times H_{kv} \times d" /> values per token.
<Math block tex="\text{FLOPs} \approx 6ND" />
```
Inside the `tex` attribute, a backslash is written once (MDX attribute strings are literal). Keep formulas short; always say in words what the formula means and work one example with real numbers.

## 5. Prices and model facts

- Quote live provider prices only. Every price states provider, model, unit, price, and "as of 2026-10-15" with the pricing page URL. Fetch the page yourself.
- Model facts that change (context window, model names) also carry an "as of" date.
- Do not invent a price, a context window size, or a benchmark score. If you cannot load the source, leave the number out.

## 6. AI-specific teaching rules

- Every design names its quality bar and how it is measured, its latency budget, and its cost per request.
- Show real model behavior when you show a failure (a real tokenization, a real hallucination pattern from a cited source). Mark a made-up example as "illustrative".
- Probabilistic thinking: say how often something fails, not only that it can fail.
- The reader is a backend engineer. Map new ideas to things they know (a lookup table, a hash, a cache, a queue) and link the backend lesson.

## 7. Verify

Same as `NEXT_LESSONS.md` section 6, plus:
- `python3 scripts/quiz-audit.py --strict` and `python3 scripts/diagnose-audit.py` pass (both scan `ai/` now).
- Open each lesson at `/learn/ai/<...>/` on the scratch build. Check that the track accent is indigo, the sidebar shows the lesson as ready, and formulas render in light and dark.

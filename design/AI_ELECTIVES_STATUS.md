# Electives E1 to E3: status

Status (2026-10-28): all 28 elective lessons are written and checked. Nothing is committed.

Checks passed:
- `astro check`: 0 errors.
- `quiz-audit --strict`: no flags in the elective lessons.
- Scratch build passes.
- Sweep of all 28 pages at 1280 and 390 widths: no console errors, no page-level overflow, SVG text at least 12px.

Not done:
- Nobody took screenshots of animation steps in light and dark mode.

Fixes made by the orchestrator:
- `scripts/linkify-ai-refs.py`: the regex now accepts `label` after `title`. Before this fix, E references never linked. The script then wrote 110 elective links.
- `src/styles/global.css`: inline code now has `overflow-wrap: anywhere`, which fixed the serving-engines overflow at 390.
- AiE3LoadKnee and AiE3ScaleSim: the chart is now stacked under the controls, because the side-by-side layout shrank SVG text to 7px.
- AiE3BatchSim: SVG text size changed from 12 to 13.
- paged-attention: reworded a quiz question that was a duplicate of one in kv-cache.
- flash-attention: added a caveat that the traffic widget models the paper's simple algorithm only.

Open items:
- Some lessons are over the length target: E1.10 and E1.11 (~5.4k prose each), E1.12 (~5.6k), and E2.5, E3.2 and E3.3 (~4.3–4.5k each).
- Some sources were not checked directly:
  - Stripe Radar is paraphrased, because the fetch returned only a summary.
  - Young 1974 is cited through Daly 2006.
  - The Llama 3 root-cause table is internally inconsistent; E2.7 says so.
- The plan text is wrong on two points. Correct the plan if the lessons are re-specced:
  - "Copy-on-write saves 55% for parallel sampling" is wrong. 55.2% is the beam-search peak; parallel sampling saves 6–30%.
  - The FlashAttention "no saving at d=128" result is a modelling artifact of the widget.

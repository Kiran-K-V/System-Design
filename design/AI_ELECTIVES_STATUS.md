# Electives E1 to E3: resume point (paused 2026-10-28)

Brief for writers: `design/AI_ELECTIVES.md`. Spec: `AI_SYSTEM_DESIGN_PLAN.md`, "Part: Electives (optional) (E1 to E3)".
Nothing here is committed. Every file listed is untracked on disk.

The user paused the work on 2026-10-28. Twelve Sonnet writers were stopped while they were still working. Their agent sessions are gone, so start fresh writers. Point each one at its existing files and tell it to finish, not restart.

## State per lesson

"Drafted" means the file exists and runs to Further reading. No drafted file has been through a check: no `astro check`, quiz audit, fact re-check or node check of Logic.ts. Some writers were stopped in the middle of an edit, so read each draft in full before you trust it.

| Lesson | File | State | Components on disk |
|---|---|---|---|
| E1.1 problem-framing | e1-classic-ml/problem-framing.mdx | drafted, 3.2k words | ChainBuilder, ProxyDrift |
| E1.2 data-labels | data-labels.mdx | drafted, 3.3k | LabelTimeline, ImbalanceSim, ImbalanceLogic |
| E1.3 features-store | features-store.mdx | drafted, 3.1k | FeaturePipeline, PointInTime, PitLogic |
| E1.4 training-serving-skew | training-serving-skew.mdx | drafted, 4.3k; has a "## Prove it" section, so check it follows the policy | SkewPipes, SkewGaps, SkewLogic |
| E1.5 retrieval-ranking | retrieval-ranking.mdx | drafted, 3.9k; has a "## Prove it" section | CascadeFunnel, CascadeBudget, TwoTower, RetrievalLogic |
| E1.6 offline-online-metrics | **missing** | components only | ThresholdMatrix, OfflineOnline, LogBias, MetricsLogic |
| E1.7 drift-monitoring | drift-monitoring.mdx | drafted, 4.0k | DriftDecay, DriftHist, DriftLogic |
| E1.8 ab-testing-models | ab-testing-models.mdx | drafted, 4.2k | AbPeek, AbInterleave, AbLogic |
| E1.9 online-learning | **missing** | components only | OnlineStream, OnlineBandwidth, OnlineLogic |
| E1.10 video-recommendation | video-recommendation.mdx | drafted, 8.3k (over the 5.5k target, trim it) | VideoBuild, VideoExplore(+Logic), PositionBias(+Logic), PymkHops(+Logic) |
| E1.11 ad-click-prediction | ad-click-prediction.mdx | drafted, 7.6k (over the target, trim it) | AdBuild, AdCalibPlot(+Logic), EtaLoss(+Logic) |
| E1.12 fraud-detection | **missing** | components only | FraudBuild, FraudLabels, FraudThreshold, FraudLogic |
| E1.13 michelangelo-monolith-radar | **missing** | components only | MikeBefore, MikeLatency |
| E2.1 data-pipelines | e2-training/data-pipelines.mdx | drafted, 3.8k | DataFunnel, DedupDemo, DedupLogic |
| E2.2 memory-per-parameter | memory-per-parameter.mdx | drafted, 3.4k | MemBars, StepPeaks, MemLogic |
| E2.3 data-parallel-zero | data-parallel-zero.mdx | drafted, 3.2k | ZeroWalk, ZeroCalc |
| E2.4 model-parallelism | model-parallelism.mdx | drafted, 4.3k; has no "Interview lens" section | ParGrid, PipeBubble, ParLogic |
| E2.5 mixed-precision-checkpoints | **missing** | components only; the writer was checking the source for the optimal checkpoint interval (Young/Daly) | PrecisionWalk, CkptTimeline, CkptCalc, CkptLogic |
| E2.6 failures-at-scale | failures-at-scale.mdx | drafted, 4.4k; the writer was about to run the audits | FailureSim, FailureCycle, FailureLogic |
| E2.7 llama3-reliability | llama3-reliability.mdx | drafted, 4.5k (over the 3.8k target) | LlamaCauses, FourDGrid, FourDLogic, LayoutPlanner |
| E3.1 continuous-batching | e3-inference-deep/continuous-batching.mdx | drafted, 3.8k | BatchSim, SchedLoop, SelectiveBatch, BatchLogic |
| E3.2 paged-attention | **missing** | nothing; the writer was reading the vLLM paper | none |
| E3.3 flash-attention | **missing** | nothing | none |
| E3.4 speculative-decoding | speculative-decoding.mdx | drafted, 4.3k | SpecWalk, SpecSpeedup, SpecLogic |
| E3.5 disaggregation | **missing** | components only | DisaggFlow, DisaggTradeoff, DisaggLogic |
| E3.6 parallelism-moe | **missing** | components only | ParSplit, MoeRouter, ParLogic |
| E3.7 serving-engines | serving-engines.mdx | drafted, 4.6k; has no "Interview lens" section | TraceMarks, LoadKnee, ServeLogic |
| E3.8 gpu-autoscaling | gpu-autoscaling.mdx | drafted, 4.4k; has no "Interview lens" section | ColdStartTimeline, ScaleSim, Planner, ScaleLogic, PlanLogic |

All component names have the prefix `AiE1`, `AiE2` or `AiE3` and live in `src/components/anim/lessons/`.
No drafted lesson uses `Ballpark`, which follows the policy.

Totals: 19 lessons drafted and 9 missing. Of the 9 missing, 7 already have components and 2 (E3.2, E3.3) have nothing.

## Resume plan

1. **Write the 9 missing lessons.** Use Sonnet writers at medium effort, one prompt per old group:
   - E1.6 and E1.9
   - E1.12 and E1.13
   - E2.5
   - E3.2 and E3.3
   - E3.5 and E3.6

   Each prompt says: read `design/AI_ELECTIVES.md`; reuse the components listed above (review them, fix them if needed); write the lesson.
2. **Finish the 19 drafts.** Use Sonnet writers at medium effort, one per module group. Each one:
   - Runs the AI_ELECTIVES.md section 7 checks on the drafts.
   - Fills missing sections (Interview lens).
   - Trims the over-length capstones (E1.10, E1.11, E2.7).
   - Checks that the "Prove it" sections in E1.4 and E1.5 follow the numbers policy.
   - Re-checks the figures against the sources.
3. **Orchestrator steps:**
   - Run `python3 scripts/linkify-ai-refs.py . --write`.
   - Run `npx astro check`, `python3 scripts/quiz-audit.py --strict` and `python3 scripts/diagnose-audit.py`.
   - Scratch-build into `~/.cache/<name>-dist`.
   - Sweep pages at 1280 and 390 widths: no console errors, no horizontal scroll, SVG text at least 12px.
   - Hand-check the ZeRO, 16-bytes-per-parameter, KV and failure-rate arithmetic in the Logic.ts files.
4. Update the memory file `ai-track-plan.md` and the progress counts in the plan header.

Do not touch the A15 files (`Ai15*`, `a15-craft/`). Another session owns them.

# Prompt Optimization as Search: Primary-Source Findings

Research date: 2026-10-28. Each bullet gives the fact, the number, the URL, and the page date. "not shown" means the loaded page had no date. UNVERIFIED marks items I could not load or that conflict across sources.

## 1. DSPy (Stanford)

- Signature: "A signature is a declarative specification of input/output behavior of a DSPy module." Example: "question -> answer". Source: https://raw.githubusercontent.com/stanfordnlp/dspy/main/docs/docs/learn/programming/signatures.md (repo copy of the dspy.ai docs; the dspy.ai page returned only a redirect stub). Date: not shown.
- Module: "A DSPy module is a building block for programs that use LMs." Built-ins include dspy.Predict, dspy.ChainOfThought, dspy.ReAct, dspy.ProgramOfThought, dspy.MultiChainComparison, dspy.RLM. Source: https://raw.githubusercontent.com/stanfordnlp/dspy/main/docs/docs/learn/programming/modules.md. Date: not shown.
- MIPROv2: "a prompt optimizer" that is "capable of optimizing both instructions and few-shot examples jointly." Source: https://dspy.ai/current/api/optimizers/MIPROv2/. Date: not shown.
- GEPA: "GEPA (Genetic-Pareto) is a reflective optimizer" that "uses LLMs to reflect on structured execution traces (inputs, outputs, failures, feedback)." Source: https://dspy.ai/current/api/optimizers/GEPA/overview/. Date: not shown.
- SIMBA: "SIMBA (Stochastic Introspective Mini-Batch Ascent) optimizer for DSPy." It samples mini-batches and either "creates self-reflective rules or adds successful examples as demonstrations." Defaults: bsize 32, num_candidates 6, max_steps 8, max_demos 4. Source: https://dspy.ai/current/api/optimizers/SIMBA/. Date: not shown.
- BootstrapFewShot: "A Teleprompter class that composes a set of demos/examples to go into a predictor's prompt." It changes demos, not instructions. Source: https://dspy.ai/current/api/optimizers/BootstrapFewShot/. Date: not shown.
- COPRO, BootstrapRS, BootstrapFinetune: UNVERIFIED (not loaded).

## 2. GEPA paper

- arXiv:2507.19457. v1 submitted 25 Jul 2025. v2 revised 14 Feb 2026. Source: https://arxiv.org/abs/2507.19457v1 and https://arxiv.org/abs/2507.19457v2.
- Method: "GEPA samples trajectories (e.g., reasoning, tool calls, and tool outputs) and reflects on them in natural language," then combines "complementary lessons from the Pareto frontier of its own attempts." Source: https://arxiv.org/abs/2507.19457 (v2 abstract). Date: 14 Feb 2026.
- v1 vs GRPO: "Across four tasks, GEPA outperforms GRPO by 10% on average and by up to 20%, while using up to 35x fewer rollouts." Source: https://arxiv.org/abs/2507.19457v1. Date: 25 Jul 2025.
- v2 vs GRPO: "Across six tasks, GEPA outperforms GRPO by 6% on average and by up to 20%, while using up to 35x fewer rollouts." Source: https://arxiv.org/abs/2507.19457v2. Date: 14 Feb 2026.
- v2 vs MIPROv2: "GEPA also outperforms the leading prompt optimizer, MIPROv2, by over 10% (e.g., +12% accuracy on AIME-2025)." Source: https://arxiv.org/abs/2507.19457v2. Date: 14 Feb 2026.
- Note: v1 and v2 give different averages (10% vs 6%). Cite v2 for the current number.
- UNVERIFIED: the GRPO rollout count (24,000), the MIPROv2 aggregate (+14% GEPA vs +7%), and the benchmark list (HotpotQA, IFBench, HoVer, PUPA; Qwen3 8B, GPT-4.1 mini). These came from one summarized fetch of the HTML body. The retry was refused.
- UNVERIFIED: ICLR 2026 oral status (search snippet only).

## 3. OPRO (Google DeepMind)

- arXiv:2309.03409, "Large Language Models as Optimizers." Submitted 7 Sep 2023. Latest version revised 15 Apr 2024. Source: https://arxiv.org/abs/2309.03409.
- "Take a deep breath and work on this problem step-by-step" scored 80.2 zero-shot on GSM8K (PaLM 2-L scorer). "Let's think step by step." scored 71.8. The empty instruction scored 34.0. Source: https://arxiv.org/html/2309.03409v3 (Tables 1 and 4). Date: 15 Apr 2024.
- Abstract: optimized prompts beat human-designed prompts "by up to 8% on GSM8K, and by up to 50% on Big-Bench Hard tasks." Source: https://arxiv.org/abs/2309.03409. Date: 7 Sep 2023.

## 4. TextGrad

- arXiv:2406.07496, Yuksekgonul et al. Abstract: "we introduce TextGrad, a powerful framework performing automatic "differentiation" via text." Source: https://arxiv.org/abs/2406.07496. Date: 11 Jun 2024.

## 5. Vendor prompt tools

- Anthropic prompt improver: "Today, we're introducing the ability to improve prompts and manage examples directly in the Anthropic Console." Techniques: chain-of-thought reasoning, example standardization, example enrichment, rewriting, prefill addition. Reported: "increased accuracy by 30% for a multilabel classification test" (Claude 3 Haiku) and "word count adherence up to 100%" on summarization. Source: https://claude.com/blog/prompt-improver (the anthropic.com/news URL redirects here). Date: 14 Oct 2024.
- UNVERIFIED: Anthropic prompt generator. The docs URL https://platform.claude.com/docs/en/prompt-generator returned a different page on load.
- OpenAI prompt optimizer: a chat interface in the dashboard that rewrites a prompt "according to current best practices before returning it to you." Source: https://developers.openai.com/api/docs/guides/prompt-optimizer.md. Date: not shown.
- Same page: "Always evaluate and manually review optimized prompts before using them in production."
- Same page: "OpenAI is deprecating the dataset-backed prompt optimizer as part of the Evals platform." Evals "will become read-only for existing users on October 31, 2026," and "the platform is scheduled to shut down on November 30, 2026."
- Same page: "Create at least three rows of data with responses in your dataset."

## 6. Prompt sensitivity (FormatSpread)

- arXiv:2310.11324, Sclar et al., "Quantifying Language Models' Sensitivity to Spurious Features in Prompt Design." Abstract: "performance differences of up to 76 accuracy points when evaluated using LLaMA-2-13B" (few-shot). Source: https://arxiv.org/abs/2310.11324. Date: submitted 17 Oct 2023; v2 1 Jul 2024.
- Median spread: "a median spread of 6.4 accuracy points with GPT3.5 across 320 formats and 53 tasks." Source: https://arxiv.org/html/2310.11324v2. Date: 1 Jul 2024.

## 7. Overfitting and dataset sizes

- DSPy: "you can often get substantial value out of 30 examples," "but aim for at least 300 examples." Source: https://raw.githubusercontent.com/stanfordnlp/dspy/main/docs/docs/learn/optimization/overview.md. Date: not shown.
- DSPy: "we recommend an unusual split compared to deep neural networks: 20% for training, 80% for validation," because "prompt-based optimizers often overfit to small training sets." Same source.
- DSPy (dspy.GEPA guidance): "Maximize the training set size, while keeping the validation set just large enough to reflect the distribution of the downstream tasks (test set)." Same source.
- Decagon: "GEPA has a tendency to overfit to training examples by encoding edge cases into increasingly verbose prompts." Source: https://decagon.ai/blog/optimizing-gepa-for-production. Date: 25 Mar 2026.
- Decagon: "Scaling from 50 to 500 samples caused prompt length to balloon by 75% while performance decreased." Also "20–100 is optimal; 500 hurts performance." Same source.
- Willison (individual, not a company): train 20 questions, test 10. Baseline test 95.0 to GEPA test 85.0. Train 90.0 to 95.0. Source: https://raw.githubusercontent.com/simonw/research/main/dspy-datasette-agent-prompts/README.md. Post date: 2 Jul 2026 (https://simonwillison.net/2026/jul/2/dspy-datasette-agent-prompts).
- Willison: the prompt grew from "~2,400-char production system prompt" to "~8,800-char rulebook." Same README.
- Willison: "Before optimizing a prompt against a metric, debug the metric against real transcripts." Two of three baseline failures were metric bugs. Same README.

## 8. Cost of an optimization run

- MIPROv2 source, auto presets: light n=6, val_size=100; medium n=12, val_size=300; heavy n=18, val_size=1000. Source: https://raw.githubusercontent.com/stanfordnlp/dspy/main/dspy/teleprompt/mipro_optimizer_v2.py. Date: not shown.
- Same source, trial count: `num_trials = int(max(2 * num_vars * math.log2(num_candidates), 1.5 * num_candidates))`. The source states no total LM call count and no dollar figure.
- GEPA (Decagon): "Baseline budget: 1.0x multiplier (~150 LLM calls)" and "20 samples ... (~60 LLM calls)." Source: https://decagon.ai/blog/optimizing-gepa-for-production. Date: 25 Mar 2026.
- Same source: "the reflection model is only called ~10-20 times during optimization" and "Spending on a frontier reflection model represents only 5-10% of total optimization cost."
- DSPy GEPA docs: budget is "total number of metric calls made across the run." No number given. Source: https://dspy.ai/current/api/optimizers/GEPA/overview/. Date: not shown.
- UNVERIFIED: any dollar cost for a MIPROv2 or GEPA run, and any total MIPROv2 LM call count. None found in primary sources.

## 9. Field notes (teams using DSPy or GEPA)

1. Decagon, GEPA in production: the 50-to-500 sample overfitting result and the ~150 LLM call baseline in section 7 and 8. URL: https://decagon.ai/blog/optimizing-gepa-for-production. Date: 25 Mar 2026.
2. Inkeep, secondary report of a Databricks GEPA study: "Open-source models with optimization outperform Claude Opus 4.1 by 2.2% while costing 90x less to serve." Opus 4.1 with optimization: "a 6.4% improvement over its baseline." URL: https://inkeep.com/blog/cut-ai-costs-90-percent-databricks-study. Date: 26 Sep 2025 (updated 27 Feb 2026). UNVERIFIED: the original Databricks post was not found.
3. Zoro UK (guest post on Portkey): DSPy used for "normalizing product attributes across millions of items from hundreds of suppliers." No Zoro accuracy or cost figure. Only quantified claim is from Gradient AI: "10x lower cost per table and 10x lower manual effort." URL: https://portkey.ai/blog/dspy-in-production/. Date: 3 Sep 2024.
4. Datasette Agent (Simon Willison, individual developer): see section 7. Cautionary case. URL: https://simonwillison.net/2026/jul/2/dspy-datasette-agent-prompts. Date: 2 Jul 2026.
5. GEPA project page, vendor claims, not company posts: Nubank "lifts E2 eval accuracy 68.88% → 88.89%"; Microsoft AI "Uses GEPA / DSPy to optimize the Qwen3-30B LLM-judge prompt." URL: https://github.com/gepa-ai/gepa. Date: not shown.
- UNVERIFIED: the project page lists Shopify, Databricks, and Dropbox as users. No company post confirms this.
- Dropped: JetBlue (no DSPy source found).

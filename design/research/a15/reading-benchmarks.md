# Reading Benchmarks Without Being Fooled: Sources

Research date: 2026-10-28. Every cited page was loaded with WebFetch unless marked UNVERIFIED. "Page date" is the date shown on the page, or "not shown".

## 1. Contamination

- GSM1k, NeurIPS 2024 abstract: "we observe accuracy drops of up to 8%". Spearman r²=0.36 for the link between memorization probability and the GSM8k–GSM1k gap. Page date: NeurIPS 2024. URL: https://proceedings.neurips.cc/paper_files/paper/2024/hash/53384f2090c6a5cac952c598fd67992f-Abstract.html
- GSM1k, arXiv v1 abstract: "accuracy drops of up to 13%". Spearman r²=0.32. Note: the two versions disagree. Cite the version you use. Page date: v1 submitted 1 May 2024. URL: https://arxiv.org/abs/2405.00332v1
- GSM1k, arXiv v1 body: "with the worst model performing 13% worse on GSM1k compared to GSM8k". Dataset size: "GSM1k consists of 1250 problems". Not public: "we will not be releasing the dataset publicly at this time." Page date: May 2024. URL: https://arxiv.org/html/2405.00332v1
- GSM1k, arXiv v1 abstract: "several families of models (e.g., Phi and Mistral) showing evidence of systematic overfitting." Page date: May 2024. URL: https://arxiv.org/abs/2405.00332v1
- GSM1k, frontier models (Gemini, GPT, Claude) show little or no overfitting: UNVERIFIED (seen only in a search summary of the PDF).
- LiveCodeBench, abstract: problems are collected "from contests across three competition platforms" and "four hundred high-quality coding problems" published May 2023 to May 2024. Page date: last revised 6 June 2024. URL: https://arxiv.org/abs/2403.07974
- LiveCodeBench, Section 5.1 body: "We notice a stark drop in the performance of DS-Ins-33B model after Aug. 2023." The paper's own text is inconsistent on the DeepSeek date (Aug vs Sep 2023). Page date: June 2024. URL: https://arxiv.org/html/2403.07974v2
- LiveCodeBench: "this drop in performance primarily occurs for the LeetCode problems only." Base model: "dropping from Pass@1 ∼60 in May problems to Pass@1 ∼0 in September LeetCode problems." Page date: June 2024. URL: https://arxiv.org/html/2403.07974v2
- LiveCodeBench: "performance of the GPT-4-O model drops on problems released since November (its official cutoff date)." Page date: June 2024. URL: https://arxiv.org/html/2403.07974v2

## 2. Arena problems

- "The Leaderboard Illusion", abstract: "we identify 27 private LLM variants tested by Meta in the lead-up to the Llama-4 release." Top two providers got "an estimated 19.2% and 20.4% of all data on the arena". 83 open-weight models got "an estimated 29.7%". Gains of "up to 112% on the arena distribution". Page date: submitted 29 Apr 2025; v2 12 May 2025. URL: https://arxiv.org/abs/2504.20879
- Same paper, Section 3.1: "we observed that Meta and Google had 27 and 10 private models, respectively." The authors call 27 a conservative count (paraphrase, not verbatim): it covers only the main Chatbot Arena, Jan–Mar 2025. Page date: May 2025. URL: https://arxiv.org/html/2504.20879v1 (text read up to Section 7 only)
- Llama 4 incident, TechCrunch: Meta used "an experimental, unreleased version of its Llama 4 Maverick model" for its LM Arena score. Spokesperson: "is a chat optimized version we experimented with that also performs well on LM Arena." The public model "was ranked below models" including GPT-4o and Claude 3.5 Sonnet. Page date: 11 Apr 2025. URL: https://techcrunch.com/2025/04/11/metas-vanilla-maverick-ai-model-ranks-below-rivals-on-a-popular-chat-benchmark
- Llama 4 incident, LMArena (quoted by Simon Willison): "Meta's interpretation of our policy did not match what we expect from model providers." LMArena says Meta should have made clear "Llama-4-Maverick-03-26-Experimental" was "a customized model to optimize for human preference." LMArena released "2,000+ head-to-head battle results." Page date: 8 Apr 2025. URL: https://simonwillison.net/2025/Apr/8/lmaren
- Llama 4 incident, The Decoder: the standard Maverick "currently ranks 32nd on LMarena" (update). Page date: 12 Apr 2025. URL: https://the-decoder.com/metas-llama-4-models-show-promise-on-standard-tests-but-struggle-with-long-context-tasks/
- Llama 4 incident, Elo 1417 for the experimental variant: UNVERIFIED (not in the pages loaded).
- Style control, LMSYS blog: "we controlled for the effect of style by adding extra 'style features' into our Bradley-Terry regression." Controlled features: answer length, markdown header count, bold count, list count. "length was the dominant style factor." Page date: 29 Aug 2024. URL: https://lmsys.org/blog/2024-08-28-style-control
- Style control, Arena's own page: UNVERIFIED (the page loaded with no content). Default view on the live site: UNVERIFIED.

## 3. Saturation and label noise

- SWE-bench Verified, why OpenAI made it, the 500-task count, and the "68.3%" filter figure: UNVERIFIED. The OpenAI page returned HTTP 403. The 68.3% figure appears only in a secondary wiki.
- SWE-bench Verified, OpenAI Feb 2026 statement that it no longer measures frontier coding: UNVERIFIED primary (OpenAI page returned 403).
- SWE-bench Verified, Epoch review: rating "Flawed". OpenAI's audit examined 27.6% of tasks, and "59.4%" of those had test cases that wrongly rejected correct submissions. Epoch: "reasonable confidence that over 20% of questions have scoring-based issues." Page date: reviewed 3 Sep 2026. URL: https://epoch.ai/benchmarks/swe-bench-verified/review
- MMLU, "Are We Done with MMLU?": "We estimate that 6.49% of MMLU questions contain errors." "57% of the analysed questions in the Virology subset contain errors." MMLU-Redux: "a subset of 5,700 manually re-annotated questions across all 57 MMLU subjects." Rankings change: "leading to changes in model rankings." Page date: arXiv v3 (2024–2025). URL: https://arxiv.org/html/2406.04127v3. Venue (NAACL 2025): UNVERIFIED (search summary only).
- Humanity's Last Exam, FutureHouse: "29 ± 3.7% (95% CI)" of text-only chemistry and biology questions "had answers with directly conflicting evidence in peer reviewed literature." Audit covered 321 questions out of 2,500. Page date: 23 Jul 2025. URL: https://futurehouse.org/research/hle-exam
- Humanity's Last Exam, Epoch review: rated "Flawed". 48 questions sampled. "22 (46%) questions had substantial accuracy-altering errors." Page date: 11 Aug 2026. URL: https://epoch.ai/benchmarks/hle/review
- 2025–2026 flaw reports on other benchmarks beyond the above: UNVERIFIED (not searched further).

## 4. Reporting tricks

- Vendor launch footnotes, Claude Opus 4.5: "All evals were run with a 64K thinking budget, interleaved scratchpads, 200K context window, default effort (high)." "averaged over 5 independent trials." Exceptions: "SWE-bench Verified (no thinking budget)" and "Terminal Bench (128K thinking budget)." Footnote 1: "parallel test-time compute" "aggregates multiple 'tries' from the model and selects from among them." Footnote 2: adjusted Terminus-2 scores for Gemini 3 (56.7%) and GPT-5.1 (48.6%) "differ from the figures their developers reported." The page does not say pass@1. Page date: 24 Nov 2025. URL: https://www.anthropic.com/news/claude-opus-4-5
- Majority vote (cons@64) dispute, TechCrunch: "it basically gives a model 64 tries to answer each problem in a benchmark and takes the answers generated most frequently as the final answers." xAI's chart "didn't include o3-mini-high's AIME 2025 score at 'cons@64.'" Omitting it "might make it appear as though one model surpasses another." Page date: 22 Feb 2025. URL: https://techcrunch.com/2025/02/22/did-xai-lie-about-grok-3s-benchmarks
- Pass@1 definition, Artificial Analysis: "We generally use pass@1 scoring across our evaluations, where a model must produce the correct answer on its first attempt." Page date: not shown (page shows v5.0). URL: https://artificialanalysis.ai/methodology/intelligence-benchmarking
- pass@k vs pass^k, Anthropic: pass@k "measures the likelihood that an agent gets at least one correct solution in k attempts." pass^k "measures the probability that all k trials succeed." Page date: 9 Jan 2026. URL: https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents
- Scaffold and "with tools" vs "without tools" footnote examples: UNVERIFIED (no source found for the wording).

## 5. Goodhart's law

- Manheim and Garrabrant, abstract: "a metric which can be used to improve a system is used to an extent that further optimization is ineffective or harmful," "sometimes termed Goodhart's Law." Page date: submitted 13 Mar 2018; v4 revised 24 Feb 2019. URL: https://arxiv.org/abs/1803.04585

## 6. Independent evaluators

- Epoch AI Benchmarking Hub: "Epoch's Capabilities & benchmarking hub brings together results from many of the most informative AI benchmarks." Covers Epoch's own runs and outside results. Page date: not shown. URL: https://epoch.ai/benchmarks/about
- Artificial Analysis: Intelligence Index v5.0, nine evaluations, four categories at 25% each (Knowledge Work, Coding, Science, General). 95% confidence intervals use "the sandwich estimator." Note: a search summary said v4.1, which conflicts. Page date: not shown. URL: https://artificialanalysis.ai/methodology/intelligence-benchmarking
- METR time horizon: "the time humans typically take to complete tasks that AI models can complete with 50% success rate." Frontier horizon "doubling approximately every seven months since 2019." Human timing covered "RE-Bench, HCAST, and 66 novel shorter tasks." Page date: submitted 18 Mar 2025. URL: https://arxiv.org/abs/2503.14499
- Vals AI: "The independent evaluator of artificial intelligence." "Scores are based on our privately held test sets." "This prevents training to the test set, unlike in open-source benchmarks." Page date: not shown. URL: https://www.vals.ai/about
- Scale Labs leaderboards: "combining private datasets to prevent overfitting." Models "can only be featured the FIRST TIME the organization encounters the prompts." Page date: not shown (copyright 2026). URL: https://labs.scale.com/leaderboard . The name "SEAL" does not appear on this page.
- Epoch "Flawed" and METR 2026 "Time Horizon 1.1" updates: UNVERIFIED.

## 7. Build your own eval

- Anthropic docs: "Building a successful LLM-based application starts with clearly defining your success criteria and then designing evaluations to measure performance against them." "Be task-specific: Design evals that mirror your real-world task distribution." Page date: not shown. URL: https://platform.claude.com/docs/en/test-and-evaluate/develop-tests.md
- OpenAI evaluation best practices: "Design task-specific evals: Make tests reflect model capability in real-world distributions." "Adopt eval-driven development: Evaluate early and often." Warning: "OpenAI is deprecating the Evals platform." Read-only from "October 31, 2026"; shutdown "November 30, 2026." Page date: not shown. URL: https://developers.openai.com/api/docs/guides/evaluation-best-practices
- Hamel Husain: "Don't rely on generic evaluation frameworks to measure the quality of your AI." "Your pass rate is a product decision, depending on the failures you are willing to tolerate." "You must remove all friction from the process of looking at data." Page date: 29 Mar 2024. URL: https://hamel.dev/blog/posts/evals/

## 8. Field notes

- METR developer study: 16 experienced developers, 246 issues. With AI, developers "take 19% longer to complete issues." Before the study they expected a "24%" speedup. Afterwards they believed "20%". Page date: 10 Jul 2025. URL: https://metr.org/blog/2025-07-10-early-2025-ai-experienced-os-dev-study/ . The page says results are out of date and links a Feb 2026 update.
- Anthropic infrastructure noise: the gap between most- and least-resourced setups on Terminal-Bench 2.0 was "6 percentage points (p < 0.01)." Resources above roughly 3x "start helping agents solve tasks they couldn't solve before." Publish the multiplier: "should thus be reported." Page date: 5 Feb 2026. URL: https://www.anthropic.com/engineering/infrastructure-noise
- Anthropic evals post: "Source realistic tasks from the failures you see." "Reading transcripts is how you verify that your eval is measuring what actually matters." Page date: 9 Jan 2026. URL: https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents

# AI System Design Track: Course Plan

Track name: **AI System Design**. Site: Uptime. Sibling of the Backend System Design track (13 modules, see `/home/ll-kv-kirababu/.claude/plans/i-need-to-create-delightful-crescent.md`).

Date of research: 2026-10-14. Decisions applied: 2026-10-15 and 2026-10-16 (see the Decisions section). Source keys like `[K3]` are listed in section 9 with their URLs.

## Summary: lessons per module

Core path: **114 lessons** (A0 to A14). Electives: **28 lessons** (E1 to E3, optional). Total: **142**.

| Part | Module | Title | Lessons |
|---|---|---|---|
| Foundations | A0 | Orientation | 4 |
| Foundations | A1 | The Model as a Function | 7 |
| Foundations | A2 | Inference and Cost Intuition | 7 |
| Building with models | A3 | LLM APIs and Integration | 10 |
| Building with models | A4 | Context Engineering | 7 |
| Building with models | A5 | Retrieval and RAG | 10 |
| Agents | A6 | Agent Foundations | 11 |
| Agents | A7 | Agents in Production | 10 |
| Quality and trust | A8 | Evals | 9 |
| Quality and trust | A9 | Observability and LLMOps | 7 |
| Quality and trust | A10 | Safety and Security | 7 |
| Customization and media | A11 | Fine-tuning and Post-training | 5 |
| Customization and media | A12 | Multimodal and Voice | 5 |
| Practice | A13 | Case Studies (9 deep cases with drills) | 9 |
| Practice | A14 | In the Wild | 6 |
| Electives (optional) | E1 | Classic ML Systems | 13 |
| Electives (optional) | E2 | Training at Scale | 7 |
| Electives (optional) | E3 | Inference Systems Deep Dive | 8 |
| | | **Core total** | **114** |
| | | **Electives total** | **28** |
| | | **All lessons** | **142** |

**ML share.** Count "ML infrastructure" as classic ML, training at scale, and deep inference serving, plus the cases and teardowns built on them.
- Before (2026-10-15): 35 of 128 lessons (27%), all on the required path. They were A3 (9), A4 (10), A5 (11), A13.1 to A13.3 (3), A14.1 and A14.6 (2).
- After (2026-10-16): 0 of 119 core lessons. 28 of 147 total lessons (19%), all optional: E1 (13), E2 (7), E3 (8).
- Moved into the core, in smaller form: serving intuition (A2, 7 lessons) and fine-tuning (A11, 5 lessons).

Old to new module map: A2 (hardware) folds into A2. A3 (classic ML) becomes E1. A4 (training) splits into E2 and A11. A5 (serving) splits into A2 and E3. A6 (RAG) becomes A5. A7 (LLM apps) splits into A3, A4, A7.10 and A9.4. A8 (agents) splits into A6 and A7. A9 (evals) becomes A8. A10 (LLMOps) becomes A9 (and E3.8). A11 (safety) becomes A10. A12 stays A12. A13 and A14 are reshaped.

---

## 1. Context

### Why this track

The Backend track teaches a reader to design deterministic systems. An AI system has a part that is not deterministic. The model can be wrong, slow, and costly on every call. A backend engineer must learn five new things:

1. How to measure quality. A model has no unit test that always passes.
2. How to price a request. Each request burns GPU time or paid tokens.
3. How to read hardware limits. GPU memory and bandwidth decide latency.
4. How to bound risk. Untrusted text can steer the system.
5. How to improve over time. Logs must become evals and training data.

Target reader: a backend engineer who aims to become an expert AI engineer. Targets: senior and staff interviews, and real production work.

Since 2026-10-16 the track is agent- and integration-first. The core path teaches what a builder does: call models through APIs, engineer context, retrieve facts, build agents, run them in production, evaluate them, and keep them safe. Classic ML systems, training at scale, and deep inference serving are electives (E1 to E3). They serve ML infrastructure roles and are not needed for the core path.

Rule for the whole track: **every design names its eval, its dollars per request, and its latency budget.** A design without these three is not finished.

### Sources surveyed

| Platform | Strength | Gap |
|---|---|---|
| Chip Huyen, AI Engineering [P1] | Decision logic: prompt vs RAG vs finetune; eval first | No build path. Thin on GPUs, serving, cost. Not interview style |
| Chip Huyen, Designing ML Systems [P2] | Full ML lifecycle, monitoring, retraining | Pre-LLM. No RAG, agents, generative evals |
| Hello Interview, ML System Design [P3] | Interview delivery. Short and direct | Few cases. No visible GenAI content |
| ByteByteGo ML System Design [P4] | Ten classic ML cases with diagrams | No LLM chapters. No eval or monitoring chapter |
| ByteByteGo GenAI System Design [P5] | Text, image, video cases. RAG and chatbot | No agents. No eval chapter. Little cost and latency |
| Educative Grokking ML Interview [P6] | Widest list of named cases. Experimentation module | No GenAI. Many titles hidden |
| Educative ML System Design [P7] | Clearest 6-step framework tied to metrics | Five cases. No GenAI |
| Hamel Husain and Shreya Shankar, AI Evals [P8] | Best on evals and error analysis. Trace-first | Evals only. No architecture or serving. $4,200 |
| Full Stack Deep Learning LLM Bootcamp [P9] | End-to-end app thinking, UX | 2023. Shallow on evals, agents, GPUs |
| Stanford CS336 [P10] | Deepest on compute, parallelism, data | No product design. Little on serving cost |
| Stanford CS329S [P11] | ML lifecycle with industry tutorials | 2022. No GenAI |
| Karpathy, Zero to Hero [P12] | Best first-principles feel for models | No serving, evals, product |
| Made With ML [P13] | Engineering practice: tests, CI, reproducibility | One LLM task. No generative evals |
| Eugene Yan, LLM patterns [P14] | Short decision map for LLM products | Shallow per pattern. No infrastructure |
| Hugging Face Ultra-Scale Playbook [P15] | Measured parallelism trade-offs | Training only |
| Anthropic Cookbook [P16] | Current agent patterns, cost-quality search | No order. Little system design |
| ByteByteGo AI Engineering live [P18] | Pretraining to agents in one path | One session per topic. Little on scale and cost |
| Hyperskill Agentic AI bootcamp [P19] | Closest to "build a production AI app" | Little theory. No interview format |
| calm.rocks AI Engineer Notebooks [P20] | Free. Inference design and red-teaming | Uneven depth |

Source for the table: `1-platforms.md` in the research notes. No source covers all of: first-principles hardware, serving, RAG, agents, evals, security, and interview-style cases. This track does.

### How this track closes the 10 gaps

The 10 gaps come from section (b) of `1-platforms.md`.

| # | Gap | How the track closes it | Lessons |
|---|---|---|---|
| 1 | Eval-driven design | Eval plan is step 2 of the A0 method. Every case ends with an eval section. A8 teaches the full method, including agent trajectory evals and simulated users | A0.2, A8.1 to A8.9, all A13 |
| 2 | Cost as a design constraint | Dollar-per-request model in A2 and A3.9. Cost levers in A2.5, A4, and A9.2. Every case has a cost table | A2.4, A2.7, A3.9, A9.2, all A13 |
| 3 | Agent system design | Loop, graphs, tools, MCP, memory, durable runtime, loop control, approvals, sandboxes, identity, multi-agent, agent UX | A6.1 to A6.11, A7.1 to A7.10, A13.4 to A13.9 |
| 4 | LLM serving at scale | Intuition for builders in A2. Mechanisms in elective E3. A platform drill in A13.2 | A2.1 to A2.7, E3.1 to E3.8, A13.2 |
| 5 | Rollout of AI features | A/B, shadow, canary, rollback, version pinning | A8.7, A8.8, A9.3, A9.6, E1.8 |
| 6 | Feedback pipelines | Logs to evals to training data, with a build lesson | A8.9, A11.5, A13.1 (eval-platform drill) |
| 7 | Retrieval beyond a demo | Freshness, ACLs, chunking at scale, filtered search, RAG eval | A5.1 to A5.10, A13.3 |
| 8 | Generative media pipelines | Image, speech, video with latency budgets, cost, evals | A12.1 to A12.5, A13.8 |
| 9 | Threat model for LLM apps | Indirect injection through tools, lethal trifecta, exfiltration, least privilege | A10.1 to A10.7, A7.4, A7.8 |
| 10 | UX for probabilistic output | Progress, interrupt, undo, uncertainty display, correction flows | A7.10, A8.7, A8.9 |
| 11 | Integration layer (added 2026-10-16) | LLM APIs, structured output, tool protocol, retries, gateways, metering, SaaS auth | A3.1 to A3.10, A7.8, A13.4 (workflow drill), A13.9 |

## 2. Teaching method

### The 7-part lesson shape (reused from the Backend track)

1. **Problem first.** A concrete pain, with numbers.
2. **Naive solution.** Show it. Show where it fails, with an animation or a real model failure.
3. **Mechanism.** Build the real solution from parts already taught.
4. **Numbers.** Latency, memory, dollars. Link to "AI Numbers to Know" (A2.7).
5. **Trade-offs.** A table: gain, pay, when to choose.
6. **Interview lens.** What to say. What the interviewer probes. Common mistakes.
7. **Check yourself.** 3 to 5 quiz questions. One `Diagnose` or `Ballpark` where it fits.

The lesson contract, quiz rules, and visual contract live in `design/NEXT_LESSONS.md`. The AI track uses them without change. Do not repeat them in lesson plans.

### AI-specific rules

1. **Name the eval.** Each design states how quality is measured. It names the metric, the data source, and the pass bar.
2. **Name the price.** Each design shows dollars per request. Show the formula and the inputs.
3. **Name the latency budget.** Split it: TTFT, tokens per second, tool calls, retrieval, network.
4. **Show real failures.** Each lesson that teaches a model-facing mechanism shows a real model failure. Use a captured output, not an invented one. Writers must run the prompt and keep the transcript. If the writer cannot reproduce the failure, the writer must say so.
5. **Derive, then quote.** Show the arithmetic for each hardware number. Quote the vendor figure second.
6. **Mark dense vs sparse.** NVIDIA lists Tensor Core peaks with sparsity. Dense is half [H1]. Always say which one you use.
7. **Probabilistic language.** Say "pass rate" and "failure rate". Never say "the model knows" or "the model decides to lie".
8. **Backend reuse and the overlap rule.** See "Cross-track overlap rule" below. Do not re-teach a Backend mechanism (cache, queue, rate limit, consistency, vector database). Show what changes when the component is a model.
9. **Dated facts.** Model names and limits change. Each such number carries the page date. Prefer formulas over lists.
10. **Original text.** Platforms are for coverage checks only. Never copy sentences, structure, or diagrams.
11. **Live prices.** Quote live provider pricing. Each price shows four things: provider, model, price, and an "as of YYYY-MM-DD" stamp with the source URL. The writer fetches the provider pricing page when writing the lesson. All prices live in one table, `src/lib/ai-prices.ts`, and lessons render them with `AiPriceTag`. There is no "assumed price only" option. If a price cannot be fetched, the lesson shows the formula with a named input and does not show a made-up figure. A quarterly price-refresh task keeps the table current (section 8).

### Cross-track overlap rule

Some AI topics already have a Backend chapter. The AI lesson does not re-teach it. It does three things:

1. It shows a short summary of the Backend topic: 3 to 5 sentences, in new words, using only terms the AI lesson already requires.
2. It shows a `CrossTrackLink` card that points to the Backend chapter.
3. It then goes deeper only on the AI-specific part.

Known overlaps:

| AI lesson | Backend chapter | AI lesson adds |
|---|---|---|
| E1.5, E1.10 | `B:11-breakdowns/youtube`, `B:11-breakdowns/news-feed` | Two-tower retrieval, ranking cascade, long-term metrics |
| A5.2, A5.3, A5.9 | `B:10-advanced/vector-databases` (10.4) | Recall and memory tuning, billion scale, filtered search |
| A13.2 | `B:11-breakdowns/chatgpt` (11.24) | KV cache state, serving, evals, cost per conversation |
| A2.5, A4.5 | `B:05-caching/*` | KV prefix reuse, provider prompt cache, cache-friendly layout, semantic cache risks |
| A3.6, A13.1 | `B:07-reliability/rate-limiting`, `B:11-breakdowns/rate-limiter`, `B:03-api-design/idempotency` | TPM, RPM, and ITPM limits, spend caps, provider fallback, idempotency keys on tool calls |
| A2.4, A3.7, A7.7 | `B:06-async/queues` | Per-step batch scheduler, batch jobs, background agent queues |
| A3.2, A3.10 | `B:02-networking/real-time-transport` | Cancel on disconnect, partial output, barge-in events |
| A5.8 | `B:06-async/cdc` | Re-embed, upsert, and delete-old-chunks pipeline |
| A5.9, A7.8 | `B:03-api-design/auth` | ACLs in vector search, leak windows, OAuth on behalf of a user |
| A9.1 | `B:07-reliability/observability` | Traces for model calls and tools |
| A6.3, A7.1 | `B:08-technologies/temporal` | Agents as graphs map to state machines. Checkpoint per node vs replay of an event history |
| A7.7 | `B:09-patterns/long-running-tasks` | Run ids, polling, and durable state for agent runs |
| A3.8 | `B:08-technologies/api-gateway` | Model routing and fallback behind a gateway |
| E1.11 | `B:11-breakdowns/ad-click-aggregator` | Calibration, sparse embeddings, online learning |

Any other overlap found by a writer follows the same rule. The writer adds a row to this table through the orchestrator.

### Case study template (A13)

Each of the 9 deep cases follows the A0.2 method as h2 sections: Requirements and quality bar, Eval plan, Budgets (latency and dollars, with live prices from `ai-prices.ts`), Core entities and API, High-level design, three staff-level Deep dives, Failure modes with an incident drill, and a "Staff answer vs senior answer" box. Drills from the first plan live inside the nearest new case, or in an elective. Where a drill sits, add a **Drill** h2 (10 to 15 min variant exercise with its own Prove it and sources). Then Trade-offs, Interview lens, Check yourself. Animation 1 uses `DesignBuild`. Animation 2 uses `DesignCompare` for one deep dive. The backend template in `NEXT_LESSONS.md` section 8 applies. If the case overlaps a Backend chapter, apply the overlap rule above.

The three classic ML cases (video recommendation, ad click prediction, fraud detection) are elective capstones in E1.10 to E1.12 and use the same template. Drill moves: search ranking and People You May Know stay in E1.10. ETA and dynamic pricing stay in E1.11. Bot and spam detection stay in E1.12. Content moderation moves to A13.8 (with the text-to-image drill). Document extraction is a drill in A13.3. Browser and computer-use agent is a drill in A13.6. Code review bot is a drill in A13.6. Workflow automation is a drill in A13.4. Eval platform stays in A13.1. Open-model inference platform moves to A13.2. Visual and semantic search stays in A13.3. Code completion and Smart Compose move to A13.6. Answer engine stays in A13.7. Multi-tenant LoRA platform moves to A13.9.

---

## 3. Syllabus

Format per lesson: **requires** (earlier lessons, AI or backend), **Write** (the first-principles chain), **Animate** (one step-through plus one more visual), **Prove it** (one `Diagnose` or `Ballpark`), **Src** (source keys). Case lessons use the deep-case template (section 2).

Backend ids used in `requires` use short names, for example `B:05-caching/why-cache`. Full ids are in `src/lib/syllabus.ts`.

The track is agent- and integration-first. Part order is Foundations, Building with models, Agents, Quality and trust, Customization and media, Practice. The Electives part comes last and is optional. A core lesson never requires an elective lesson. The build fails if it does.

### Part: Foundations (A0 to A2)

#### A0. Orientation

_Written. Slugs and entries kept as they were._

**A0.1 how-ai-interviews-differ: How AI Design Interviews Differ**
- requires: B:00-orientation/judging-designs
- Write: A backend interview asks "does it scale". An AI interview adds "is it right, and what does each answer cost". Four new scoring axes: quality bar, eval plan, cost, risk. Two interview families: classic ML (features, ranking, metrics) and GenAI (RAG, agents, serving). What a staff answer adds: eval first, budgets with numbers, failure modes, rollout plan.
- Animate: Rubric bars per level (mid, senior, staff) with the four new axes in accent. Second visual: infographic that sorts 26 real prompts into two families.
- Prove it: Diagnose. A candidate designs a chatbot and never says how quality is measured. Name the missing axis.
- Src: [C9], [P3], [P6]

**A0.2 ai-design-method: The AI Design Method**
- requires: A0.1, B:00-orientation/design-method
- Write: Six steps. (1) Requirements with a quality bar, for example "answers are correct on at least X% of a golden set". (2) Eval plan first. (3) Latency and cost budget. (4) Data and model choice. (5) Architecture. (6) Rollout, monitoring, failure modes. Why eval comes before architecture: without it, no design change can be judged. The answer structure from C9: confirm depth, requirements and metrics, data and serving path, then evaluation, feedback, risks. The 6-step framework of Educative [P7] as a cross-check.
- Animate: 45-minute timeline where each phase expands to show sample output for "support bot". Second: a "budget card" that fills in as the reader picks choices (quality, p95 latency, $ per request).
- Prove it: Ballpark. Given 1M requests per day and a $0.01 budget per request, what is the daily cap? Show how it limits model choice.
- Src: [C9], [P7], [P2]

**A0.3 probabilistic-components: Probabilistic Components**
- requires: A0.2
- Write: A function returns the same output for the same input. A model does not guarantee it. Four consequences: outputs need a pass rate, retries can change results, errors compound across steps, and tests become statistics. Reliability math: p^n. At 95% per step, 10 steps succeed about 60% (derived). At 90%, about 35%. Design rule: shorten chains, add checks, keep a human path.
- Animate: Chain of n steps, slider for per-step success rate; the end-to-end bar shrinks. Second: Monte Carlo of 1,000 runs showing the spread of outcomes (seeded, run in effect).
- Prove it: Ballpark. A 20-step agent at 95% per step. What is the end-to-end rate? Answer ~36%.
- Src: [A6], [A5], [P1]

**A0.4 build-buy-finetune: Build, Buy, or Fine-tune**
- requires: A0.2, A0.3
- Write: A decision tree. Start with a hosted API plus a prompt. Add retrieval if the model lacks facts. Fine-tune if behavior or format fails and prompts cannot fix it. Self-host if privacy, unit cost at volume, or latency forces it. Rule 1 from Google's ML rules: launch without ML if you do not need it yet [M1]. Cost crossover: API price per token against GPU price per token at your utilization (links to A2.7). Lock-in, data privacy, and eval cost as hidden terms.
- Animate: Decision tree where each answer lights a path. Second: crossover chart. Sliders for volume and GPU utilization; the break-even line moves.
- Prove it: Diagnose. A team fine-tunes to add company facts, and answers go stale in a week. Which step did they skip?
- Src: [M1], [P1], [P14]

#### A1. The Model as a Function

_Written. Slugs and entries kept as they were._

**A1.1 tokens: Tokens and Tokenizers**
- requires: A0.3
- Write: A model reads integers, not text. A tokenizer splits text into pieces (BPE, Karpathy tokenizer lecture [P12]). Cost, speed, and context limits count tokens. Naive view: one word equals one token. Failure: numbers, code, and non-English text cost more tokens. Rule of thumb for token counts must be measured per tokenizer. Writer must verify the numbers.
- Animate: Step-through of BPE merges on a short string. Second: live token counter. The reader pastes text in English, code, and Hindi, and sees token counts and a dollar estimate.
- Prove it: Ballpark. Cost of a 2,000-token prompt at a stated price per million tokens.
- Src: [P12], [P10]

**A1.2 embeddings: Embeddings**
- requires: A1.1
- Write: A token ID is turned into a vector. Meaning becomes distance. Why a vector: arithmetic works on it. Text-embedding models return fixed-size vectors: 1536 or 3072 dims, unit length, so cosine equals dot product [R1]. Storage: 4 bytes times dims (6,144 bytes at 1536). Failure: two unrelated texts can land close.
- Animate: 2D scatter where phrases cluster; click two phrases to see distance. Second: dimension and storage calculator.
- Prove it: Ballpark. Storage for 10M vectors at 1536 dims in float32. Answer ~61 GB before index overhead.
- Src: [R1], [R2]

**A1.3 forward-pass: The Transformer Forward Pass**
- requires: A1.2
- Write: For systems people, a transformer is a stack of identical layers. Each layer has attention and a feed-forward block. Most parameters sit in matrices. One forward pass is mostly matrix multiplies. Cost: about 2 FLOPs per parameter per token [K1]. A 70B model takes 140 GFLOPs per token (derived). Training costs about 6 x N x D [derived from the scaling literature, see open items].
- Animate: Step-through of one token moving through layers, with a FLOP counter. Second: parameter-count calculator from layers and model width.
- Prove it: Ballpark. FLOPs to generate 500 tokens with a 70B model.
- Src: [K1], [T1]

**A1.4 attention-cost: Attention and Its Cost**
- requires: A1.3
- Write: Attention lets each token read all earlier tokens. Naive cost: time and memory grow with sequence length squared [K10]. Why a 100K-token prompt is not 100 times a 1K prompt. Past tokens are stored as Keys and Values (previews KV cache in A2.3). Variants: MQA and GQA share KV heads to cut memory [K2].
- Animate: Attention matrix grows as the sequence grows; cells count up. Second: slider for sequence length that plots compute (quadratic) against KV size (linear).
- Prove it: Diagnose. Latency for a long prompt grows faster than expected. Name the term.
- Src: [K10], [K2], [K1]

**A1.5 sampling-decoding: Sampling and Decoding**
- requires: A1.3
- Write: The model outputs a probability for each next token. Greedy picks the top one. Temperature and top-p add controlled randomness. Why the same prompt gives different answers. Why temperature 0 is still not a guarantee in a batched system (writer must verify with a reproducible test). Link to constrained decoding in A3.3.
- Animate: Bar chart of next-token probabilities; sliders for temperature and top-p reshape it; a sampler draws tokens step by step. Second: side-by-side runs of 5 seeds.
- Prove it: Diagnose. A classification prompt returns different labels on reruns. Fix it with settings and with a check.
- Src: [P1], [A1]

**A1.6 hallucination-context: Why Models Hallucinate, and the Context Window**
- requires: A1.5, A1.4
- Write: The model is trained to give a likely next token, not a true one. Without the fact in context, it still produces fluent text. Fix by supplying facts (RAG, A5). Context window limits: 128K tokens for Llama 3 [T2]. Accuracy is highest at the start and end, lower in the middle [T10]. Recall falls as the window fills (context rot) [A7].
- Animate: Needle-in-haystack grid. Move the fact through positions and watch the pass rate curve (data from [T10], marked as illustrative). Second: real failure transcripts, three fabricated citations.
- Prove it: Diagnose. A bot cites a policy that does not exist. Pick the cheapest fix.
- Src: [T10], [A7], [T2]

**A1.7 scaling-laws: Scaling Laws and Model Choice**
- requires: A1.3
- Write: Loss falls with compute, data, and size. Chinchilla: scale parameters and tokens together; a 70B model with 4x more data beat a 280B model at equal compute [T1]. Llama 3 405B used 15.6T tokens, about 38 per parameter [T2]. Why small models trained long are cheaper to serve. Model-size choice is a serving-cost choice.
- Animate: Compute budget slider splits between parameters and tokens; the loss curve moves. Second: table of a model's training FLOPs from 6ND with Llama 3 (3.8e25).
- Prove it: Ballpark. Check Llama 3 compute: 6 x 405e9 x 15.6e12.
- Src: [T1], [T2]

#### A2. Inference and Cost Intuition

_Intuition only. A builder needs to know why a call is slow and costly. Mechanisms (PagedAttention, FlashAttention, speculative decoding, disaggregation) are in elective E3._

**A2.1 gpu-memory-math: GPU Memory Math**
- requires: A1.3, B:01-one-machine/request-journey
- Write: A GPU has small fast on-chip memory (SRAM) and large HBM. The weights must fit in HBM. H100 SXM: 80 GB HBM3, 3.35 TB/s [H1]. H200: 141 GB, 4.8 TB/s [H2]. Weight bytes = parameters x bytes per value. FP16 is 2, INT8 is 1, INT4 is 0.5 [K2]. A 70B model in BF16 is 140 GB. It needs two 80 GB GPUs before any KV cache. MoE: Mixtral holds 47B parameters and uses 13B per token. Memory follows total size. Compute follows active size [K13]. NVIDIA lists peak FLOPs with sparsity. Dense is half [H1]. Always say which one you use. Training memory (16 bytes per parameter) is elective E2.2.
- Animate: Stacked memory bar: weights, KV, activations, free. Dropdown for model and precision; the bar turns red above 80 GB. Second: data path from disk to HBM to SRAM to Tensor Core, with a bandwidth label per hop.
- Prove it: Ballpark. Memory for Mixtral 8x7B in BF16 (about 94 GB). Second check: time to read 80 GB from HBM on an H100 (about 24 ms).
- Src: [H1], [H2], [K2], [K13]

**A2.2 prefill-decode: Prefill vs Decode: TTFT and TPOT**
- requires: A2.1, A1.4
- Write: A call has two phases. Prefill reads the whole prompt in one pass. Decode makes one token per pass. Two ceilings limit a kernel: compute (FLOP/s) and memory (bytes/s) [K2]. Arithmetic intensity is FLOPs per byte moved. The ridge point is peak FLOPs over bandwidth. A100: 312e12 / 1.5e12 = 208 [K1]. H100 BF16 dense: about 295 (derived). Prefill is compute-bound. Decode at batch b has intensity about b, so it is memory-bound until b nears 300 (derived) [K2]. Decode floor for a 70B BF16 model on one H100: 140 GB / 3.35 TB/s = about 42 ms per step, so about 24 tokens/s at batch 1 (derived). Latency = TTFT + TPOT x output tokens [K2]. TPOT of 100 ms is 10 tokens/s per user [K2]. Standard GPU utilization misleads [C1]. Use MFU and MBU. Llama 3 reached 41% MFU [T2].
- Animate: Roofline plot with a slider for batch size. The dot slides from the slope to the flat roof. Second: one request timeline split into TTFT and TPOT.
- Prove it: Ballpark. The 70B decode floor above. Diagnose. A GPU shows 100% "utilization" but throughput is low. Name better metrics.
- Src: [K1], [K2], [H1], [T2], [C1]

**A2.3 kv-cache: The KV Cache**
- requires: A2.2
- Write: Generating token n needs Keys and Values of tokens 1 to n-1. Naive: recompute them each step. Cost grows quadratically. Fix: store them. Bytes per token = 2 x layers x KV heads x head dim x bytes [K1, K2]. Llama 3 70B, 8 KV heads, BF16: 320 KiB per token; 8K tokens is 2.5 GiB; 32 such sequences is about 80 GiB (derived). Lesson A2.2 covers the two phases.
- Animate: KV cache growth bar per generated token against GPU memory. Second: slider for sequence length and batch; the bar turns red at 80 GB.
- Prove it: Ballpark. KV size of one 128K-token sequence (40 GiB, derived).
- Src: [K1], [K2], [T2]. Note: KV head count for Llama 3 70B came from a search summary; verify in `config.json`.

**A2.4 batching-throughput: Batching and Throughput**
- requires: A2.3, B:06-async/queues
- Write: One request at batch 1 leaves the GPU idle, because decode is memory-bound (A2.2). Batching lifts throughput: many requests share each read of the weights. Static batching waits for the slowest request. Continuous batching schedules per step: finished requests leave, new ones join [K5]. Databricks reports 10x to 20x over dynamic batching. At low load, dynamic batching can win [K2]. The price: users share KV memory (A2.3), and latency per user rises with load. Goodput is the rate that meets both SLOs [K7]. Cost formula: dollars per million output tokens = GPU $/hour / (tokens/s x 3600) x 1e6 (derived). Doubling throughput halves cost. Internals (Orca, PagedAttention) are elective E3.1 and E3.2.
- Animate: Timeline of static vs continuous batching with 6 requests of different lengths. Second: cost calculator with sliders for GPU price, throughput, utilization, and goodput share.
- Prove it: Ballpark. Cost per million tokens at a live GPU price from `ai-prices.ts` and 1,500 tokens/s. Diagnose. Short requests wait behind a 4,000-token request.
- Src: [K2], [K5], [K7]

**A2.5 prompt-caching: Prompt Caching: Mechanics and Economics**
- requires: A2.3, B:05-caching/cache-strategies
- Write: Many requests share a long prefix: system prompt, tools, examples, a document. Recomputing it wastes prefill. Store its KV and reuse it. SGLang RadixAttention keeps a radix tree over prompts [K14]. A cache miss on a chat forces a recompute of the whole conversation [C1]. Provider caching: Anthropic writes cost 1.25x (5-minute TTL) or 2x (1-hour). Reads cost 0.1x on standard models (page date applies) [A2]. Prefix order is tools, system, messages. Editing tools invalidates everything [A2]. OpenAI: reads 0.1x on GPT-5.6 and later, minimum 1,024 tokens, default 30 minutes [A3]. Cached reads can skip ITPM [A10]. Semantic cache: reuse an answer for a similar query. Risk: wrong reuse across users or intents (no source loaded; writer must test and source). Prompt layout rules for cache hits are in A4.5.
- Animate: A cache write, then reads; cost per call falls. Second: break-even calculator for hit rate, TTL, and prefix size.
- Prove it: Ballpark. Break-even number of reads for a 1.25x write and 0.1x reads. Diagnose. TTFT is high only for the first request of each session.
- Src: [K14], [C1], [A2], [A3], [A10]

**A2.6 quantization-small-models: Quantization and Small Models**
- requires: A2.1, A2.2
- Write: Decode reads all weights each step, so fewer bytes means faster steps. FP16 2, INT8 1, INT4 0.5 bytes [K2]. Moving to 8-bit can halve GPUs in memory-bound setups [K2]. GPTQ: 3 or 4 bit post-training, a 175B model in about 4 GPU hours [K11]. AWQ protects about 1% salient channels [K12]. FP8 on H100 doubles the BF16 rate [H1]. Cost: quality loss that evals must measure. Small models: a small model trained long is cheaper to serve (lesson A1.7). Distillation builds one (lesson A11.5).
- Animate: Weight grid rounding to fewer levels with error shown. Second: memory and speed calculator by precision; quality column left to the reader's eval.
- Prove it: Ballpark. GPUs needed for 70B at FP16, INT8, INT4 on 80 GB cards.
- Src: [K2], [K11], [K12]
- Real data: Shopify served fine-tuned open vision LLMs (40M calls and about 16B tokens per day) with FP8, KV caching, Triton, and Kafka; median latency 2 s to 500 ms; selective field prompting cut GPU use 40% [G11].

**A2.7 self-host-vs-api: Self-host vs API**
- requires: A2.4, A2.6, A0.4
- Write: Find the crossover. API price per token against GPU price per token at your utilization (the formula in A2.4). Self-host only when privacy, unit cost at volume, or latency forces it. Hidden terms: idle GPUs, on-call time, eval cost on each model change, lock-in. Capacity rule: GPUs = requests per second x output tokens per request / tokens per second per GPU, then add headroom. Multi-GPU: NVLink is 900 GB/s on H100 [H1]. Tensor parallelism stays inside a node (elective E3.6). Quote live prices from `ai-prices.ts`. The lesson ends with the "AI Numbers to Know" page (section 6): hardware, memory per parameter, KV bytes per token, latency terms, serving gains, price formulas. Each number links to its lesson and source.
- Animate: Crossover chart. Sliders for volume and GPU utilization; the break-even line moves. Second: sortable table of AI numbers.
- Prove it: Ballpark. GPUs for 200 requests/s, 600 output tokens each, 2,000 tokens/s per GPU (60 before headroom). Throughput must be measured or sourced. Second: a five-estimate set with tolerance bands.
- Src: [H1], [H3], [K2], [P1], [M1]

### Part: Building with models (A3 to A5)

#### A3. LLM APIs and Integration

_The integration layer. A builder spends most days here._

**A3.1 api-anatomy: Anatomy of an LLM API Call**
- requires: A1.5, A2.2, B:03-api-design/rest
- Write: A call has a model id, messages (system, user, assistant), tools, sampling parameters, and a cap on output tokens. The response has content blocks, a stop reason, and usage (input, output, cached tokens). The API is stateless. You resend the history on every call. Stop reasons: end of turn, max tokens, tool use, refusal. The usage field drives cost metering (A3.9). Writer must read the provider API reference and quote field names with the page date.
- Animate: Request and response JSON with fields highlighted. A token meter shows input growing on each turn. Second: stop-reason explorer.
- Prove it: Diagnose. The output ends mid-sentence. Which field gives the cause?
- Src: [A1], [A2], [A10]

**A3.2 streaming: Streaming Responses**
- requires: A3.1, A2.2, B:02-networking/real-time-transport
- Write: Users feel TTFT and reading speed, not total time. Stream tokens over SSE. Backpressure to slow clients. Cancel on disconnect to stop GPU work. Show progress for tool calls. Backend lesson on SSE reused; the new part is cancel and partial output handling.
- Animate: Timeline of blocking vs streaming response with user-perceived wait. Second: cancel demo showing GPU work saved.
- Prove it: Ballpark. User-perceived wait for 500 tokens at 40 tokens/s vs full response.
- Src: [K2], [C1]

**A3.3 structured-output: Structured Output and Constrained Decoding**
- requires: A3.1, A1.5
- Write: Asking for JSON fails sometimes. Constrained decoding compiles a schema into a grammar and limits sampling to valid tokens [A1]. First call with a new schema is slower; grammars are cached 24 hours [A1]. Limits: no recursive schemas, no numeric bounds, `additionalProperties` false, 20 strict tools per request [A1]. Failure modes: refusal and max_tokens can break the schema [A1]. SGLang uses compressed finite state machines [K14].
- Animate: Token-by-token generation with invalid tokens masked by the grammar. Second: failure panel for `max_tokens` cutting JSON.
- Prove it: Diagnose. Valid JSON, wrong content. Constrained decoding fixed syntax, not truth.
- Src: [A1], [K14]
- Real data: LinkedIn's output parser cut schema and YAML errors from about 10% to about 0.01% without re-prompting; on a 200-token step, +10 ms per token adds about 2 s [G14b].

**A3.4 tool-calling-protocol: The Tool-calling Protocol**
- requires: A3.3, B:03-api-design/rest
- Write: The model emits a structured call; your code runs it; the result returns to the model. The model never executes anything. Tool design: consolidate steps into one tool, namespace names, return high-signal fields, offer a concise mode (206 vs 72 tokens), cap output (25,000 tokens in Claude Code) [A4]. Absolute paths remove relative-path errors [A5].
- Animate: Sequence of user, model, tool, model. Second: tool-output size slider vs tokens and cost.
- Prove it: Diagnose. An agent loops on a paginated tool. Fix the tool.
- Src: [A4], [A5]
- Note: this lesson covers the call protocol. Tool design for agents is lesson A6.5.

**A3.5 files-images-input: Files and Images as Input**
- requires: A3.1
- Write: A model reads tokens. Files and images become tokens. Image tokens cost like text tokens and grow with resolution (writer must source each provider formula). A PDF has a text layer and page images. Choose by layout: plain text, tables, scans. Upload once and refer by id where the provider offers it (writer must verify). Check size, type, and page limits. Files can carry injected text (A10.2). Pre-process: resize, crop, or run OCR first. Vision internals are in A12.1.
- Animate: Same invoice sent as text, as an image, and as a PDF; token count and cost per path. Second: resolution slider vs tokens.
- Prove it: Ballpark. Cost of 1,000 page images at a stated tokens per image and a live price.
- Src: [A1]. UNVERIFIED in notes: provider file and image docs; writer must source.

**A3.6 limits-retries-idempotency: Rate Limits, Retries, and Idempotency**
- requires: A3.1, B:07-reliability/rate-limiting, B:07-reliability/timeouts-retries, B:03-api-design/idempotency
- Write: Provider limits: RPM, ITPM, OTPM, using a token bucket, so bursts hit limits below the minute rate [A10]. Example Opus 5.5 tiers: Start 1,000 RPM, 2M ITPM, 400K OTPM; Scale 10,000 RPM, 10M ITPM, 2M OTPM [A10]. With 2M ITPM and 80% cache hits you process 10M input tokens a minute [A10]. A spend-cap 429 has no `retry-after`, so retries fail [A10]. Use `retry-after` otherwise. Fall back to a second model or provider. a retried call that triggers a tool with side effects can run the tool twice. Give each tool call an idempotency key. Reuse the backend lesson.
- Animate: Token bucket for tokens, with requests passing or rejected. Second: retry storm with and without `retry-after`.
- Prove it: Diagnose. All retries fail after a 429. It is a spend cap, not a rate limit.
- Src: [A10]

**A3.7 batch-async-apis: Batch and Async APIs**
- requires: A3.6, B:06-async/queues
- Write: Not every call needs an answer now. A batch API takes many requests and returns results within a window, at a discount (writer must fetch the current discount and window from the provider page). Use it for evals, backfills, and bulk extraction. Pattern: submit, poll or use a webhook, collect results by custom id, retry failed items. Batch has its own limits. Mix batch with prompt caching (A2.5).
- Animate: Job lifecycle: submit, queued, running, done, with partial failures. Second: sync vs batch cost and wait calculator.
- Prove it: Ballpark. Cost of a 10M-token backfill, sync vs batch, at live prices.
- Src: [A10]. UNVERIFIED in notes: batch discount and window; writer must source.

**A3.8 multi-provider-gateway: Multi-provider Gateway and Fallbacks**
- requires: A3.6, B:08-technologies/api-gateway
- Write: A gateway sits between apps and model providers. Jobs: auth, quotas, logging, caching, routing, fallback. Routing is a workflow pattern [A5]. Cascade: try a cheap model, escalate on low confidence. Eval-gated routing. Cost and quality Pareto (Anthropic cookbook cost_optimization [P16]). A provider outage is your outage. Fail over to a second provider or a self-hosted model. Prompts and eval results differ per model; the fallback needs its own eval. KV caches do not move between regions. Compare: active-active vs warm standby with costs.
- Animate: Request enters; router picks model by rule; cost meter. Second: Pareto chart of routing thresholds. Also: Primary fails; router shifts traffic; quality bar dips. Second: failover cost vs RTO table.
- Prove it: Ballpark. Blended cost with 70% on a cheap model and 30% on a strong one (prices come from `ai-prices.ts`). Also: Diagnose. Failover works, but output format breaks downstream.
- Src: [A5], [P16], [A10], [C1]

**A3.9 cost-metering: Cost Metering per Request and per Tenant**
- requires: A3.1, A2.5
- Write: Cost per request = input tokens x price + output tokens x price + cached tokens at their rate + tool and retrieval cost. Meter from the usage field of each response, not from estimates. Tag each call with tenant, feature, user, and run id. Set per-tenant budgets and alerts. Reconcile against the provider invoice. For agents, track dollars per run and per successful task. Cache math: 80% hits turn 2M ITPM into 10M effective [A10].
- Animate: Waterfall of one request cost with each token class. Second: per-tenant spend table with a budget alert firing.
- Prove it: Ballpark. Monthly cost for 5M requests, 3K input and 500 output tokens, at stated prices.
- Src: [A10], [A2], [P16]

**A3.10 realtime-apis: Realtime APIs**
- requires: A3.2, A3.1, B:02-networking/real-time-transport
- Write: Voice and live apps need a persistent two-way connection (WebSocket or WebRTC), not request and response. Events flow both ways: audio chunks in, partial transcripts, model audio out. Barge-in (the user interrupts) must cancel output. Sessions hold state and have time limits. Audio is billed in tokens or minutes (writer must source). The backend real-time transport lesson covers the wire. The new part is event design and cancel. The latency budget is in A12.2.
- Animate: Event timeline for one voice turn with a barge-in. Second: session state machine.
- Prove it: Diagnose. The model keeps talking after the user interrupts. Which event handler is missing?
- Src: [G6]. UNVERIFIED in notes: OpenAI Realtime and other provider specs; writer must source.

#### A4. Context Engineering

_What goes into the window, in what order, and at what cost._

**A4.1 prompts-as-code: Prompts as Versioned Code**
- requires: A3.1, A0.3
- Write: A prompt is an API contract with a probabilistic callee. Parts: role, task, context, format, examples. Prompts are versioned code. Defensive prompting basics (full threats in A10). Naive: one long prompt that grows. Fix: small, testable prompts with evals.
- Animate: Prompt anatomy with parts toggled and output quality change on a 5-case set. Second: prompt-diff viewer.
- Prove it: Diagnose. A prompt edit fixes one case and breaks three.
- Src: [P1], [P14]

**A4.2 few-shot-examples: Few-shot Examples**
- requires: A4.1
- Write: Examples teach format and edge cases faster than rules. Start with a few (writer must measure the best count on a real set). Pick them in two ways: a fixed set, or retrieved by similarity to the query. Order and label balance bias the output. Examples add tokens to every call, so put them in the cached prefix (A2.5). Failure: the model copies the surface of an example. Test on held-out cases.
- Animate: Same task with 0, 2, and 5 examples; pass rate on a 10-case set. Second: dynamic selection picks the examples nearest to the query.
- Prove it: Diagnose. The model copies an entity from an example into every answer. Fix it.
- Src: [P14], [P1], [P16]. UNVERIFIED in notes: example counts; writer must measure.

**A4.3 context-budgeting: Context Window Budgeting**
- requires: A4.1, A1.6
- Write: Context is finite with diminishing returns [A7]. What goes in: instructions, tools, retrieved facts, history, scratch notes. Compaction keeps decisions and open bugs and drops stale tool output [A7]. Notes outside the window. Sub-agents return 1,000 to 2,000 token summaries [A7]. Order matters for caching (A2.5).
- Animate: A window fills as turns pass; compaction fires; what was kept is shown. Second: budget bar per component.
- Prove it: Ballpark. Turns until a 200K window fills at 6K tokens per turn (~33).
- Src: [A7]

**A4.4 compaction: Compaction of Long Conversations**
- requires: A4.3
- Write: A long chat exceeds the window. Compaction writes a summary and keeps decisions and open items. It drops stale tool output [A7]. Trigger it at a fraction of the window. Clearing old tool results is a cheaper first step. Keep the raw log outside the window in case the summary loses a fact. Compaction changes the prefix, so it breaks the prompt cache (A4.5). The Claude Agent SDK compacts near the limit [A11].
- Animate: A window fills as turns pass; compaction fires; show what was kept and dropped. Second: token counts before and after.
- Prove it: Ballpark. History of 150K tokens becomes an 8K summary. How many turns until the window fills again at 6K tokens per turn?
- Src: [A7], [A11]

**A4.5 cache-friendly-layout: Cache-friendly Prompt Layout**
- requires: A4.3, A2.5
- Write: A cache hit needs a stable prefix (A2.5). Order the prompt: tools, system, static documents, examples, history, new turn [A2]. Put anything that changes (time, user name) at the end. Editing tools invalidates everything after them [A2]. Shopify returns just-in-time instructions with tool data so the prompt stays cache-friendly [G12]. Measure the hit rate per route.
- Animate: A prompt as colored blocks; edit one block and see which cache entries die. Second: hit rate vs cost per call.
- Prove it: Diagnose. The hit rate fell to 0 after someone added a timestamp to the system prompt.
- Src: [A2], [A3], [G12]

**A4.6 long-documents: Long-document Strategies**
- requires: A4.3, A2.5
- Write: Four options for a long document. Put all of it in context: costly, and recall dips in the middle [T10]. Chunk and map-reduce: summarize parts, then merge. Retrieve only the relevant parts (module A5). Build hierarchical summaries. Rule: long context for one document, RAG for a corpus (A5.7). Cache the document (A2.5). Cost per question = document tokens x read price + output.
- Animate: One 150K-token document handled four ways; cost and recall per path. Second: cost per question vs number of questions, with and without cache.
- Prove it: Ballpark. Cost to ask 20 questions of a 150K-token document, with and without caching, at live prices.
- Src: [T10], [A7], [A2], [R14]

**A4.7 reasoning-budgets: Reasoning Models and Thinking Budgets**
- requires: A3.1, A1.5
- Write: A reasoning model spends tokens thinking before it answers. Thinking tokens bill as output tokens and add latency (TTFT grows). A thinking budget caps them. Use thinking for hard tasks (math, planning, multi-step tool use). Skip it for lookups. Measure quality against budget on your own set and pick the knee. DeepSeek-R1 shows reasoning behavior can be trained with RL on checkable rewards [T6].
- Animate: Slider for thinking budget; pass rate, latency, and cost curves. Second: a trace with thinking blocks between tool calls.
- Prove it: Ballpark. Time and cost of 8K thinking tokens at a TPOT of 20 ms and a live output price.
- Src: [T6]. UNVERIFIED in notes: provider extended-thinking docs; writer must source.

#### A5. Retrieval and RAG

_Ten lessons, trimmed from twelve. GraphRAG stays as one lesson._

**A5.1 embedding-models: Choosing Embedding Models**
- requires: A1.2
- Write: Bi-encoder: encode query and document separately, so document vectors are precomputed. What changes with dimension, max input (8192 tokens [R1]), and domain. Shorter vectors via `dimensions` save storage [R1]. Evaluate on your own queries, not only on public leaderboards. Re-embedding cost when you change model.
- Animate: Same corpus embedded by two models; query neighbors differ. Second: dimension vs storage vs recall table.
- Prove it: Ballpark. Cost and time to re-embed 50M chunks (price inputs come from `ai-prices.ts`).
- Src: [R1]

**A5.2 ann-indexes: ANN Indexes and Billion-Scale Search**
- requires: A5.1, B:10-advanced/vector-databases
- Write: Exact search compares the query with every vector: too slow at scale. ANN trades recall for speed. HNSW: layered graph, greedy hops from the top [R4]. IVF: cluster, probe some clusters (Milvus defaults nlist 128, nprobe 8) [R3]. PQ: compress each vector to a short code. Memory formulas from Faiss: Flat 4d bytes; PQ ceil(M x nbits / 8); HNSW 4d + links [R2]. Overlap: Backend 10.4 (`B:10-advanced/vector-databases`) showed HNSW. This lesson gives a 3 to 5 sentence summary and a `CrossTrackLink` card, then adds recall, memory, and tuning only. RAM cost of HNSW at billions of vectors. Options: PQ in RAM plus full vectors on SSD (DiskANN style), or object storage as the source of truth with NVMe and memory cache. turbopuffer: S3 as the source of truth; cold query p90 1,214 ms on 1M docs; write p90 248 ms [R7]. DiskANN numbers are unverified in the notes; writer must source them.
- Animate: HNSW greedy hop from the entry point down layers to the nearest neighbor. Second: recall vs QPS sliders for efSearch and nprobe. Also: Tiered storage: query hits RAM cache, then NVMe, then object store, with latency per tier. Second: cost per month calculator for 1B vectors by design.
- Prove it: Ballpark. PQ with M=96, 8 bits, at 1536 dims: 96 bytes, ~64x smaller than float32 [derived]. Also: Ballpark. RAM needed for 1B vectors at 1536 dims, float32 vs PQ.
- Src: [R2], [R3], [R4], [R16], [R7]. UNVERIFIED: DiskANN paper figures.

**A5.3 vector-db-filters: Vector DB Choice and Filtered Search**
- requires: A5.2
- Write: Filters break graph search. Removing nodes that fail a filter can split the HNSW graph; precision@10 fell from 0.85 to 0.05 in a Qdrant test of an old design [R6]. In pgvector, the filter runs after the index scan: with ef_search 40 and a 10% filter you get about 4 rows [R5]. Fixes: iterative scans, payload-aware links, exact search for selective filters. Choice matrix: pgvector, Milvus, Qdrant, turbopuffer, managed services (writer must source Pinecone and Qdrant docs).
- Animate: Graph with filtered nodes greyed; the search gets stuck. Second: selectivity slider vs returned rows for post-filter.
- Prove it: Diagnose. A search with a tenant filter returns 3 results instead of 10.
- Src: [R5], [R6], [R3]

**A5.4 chunking-contextual: Chunking and Contextual Retrieval**
- requires: A5.1
- Write: A chunk is the unit of retrieval. Too big: noise. Too small: lost context. Chroma tests: LLM chunker 91.9% recall; cluster-400 91.3%; recursive-200 88.1%; the OpenAI default (800 tokens, 400 overlap) 87.9% recall with 1.4% IoU [R9]. Removing overlap raises IoU. Structure-aware splits (headings, tables, code). A chunk like "revenue grew 3%" has no company or year. Prepend a short generated context (50 to 100 tokens) before embedding and BM25 [R8]. Top-20 failure rate: 5.7% baseline; 3.7% with contextual embeddings; 2.9% with contextual BM25 too; 1.9% with reranking [R8]. One-time cost about $1.02 per million document tokens with caching [R8].
- Animate: One document cut four ways; query hits highlighted. Second: chunk size vs recall vs cost chart (data from [R9], labeled by method). Also: Step-through of one chunk before and after context; query now hits. Second: waterfall of failure rate across four stages.
- Prove it: Diagnose. Answers miss a rule that sits across two chunks. Also: Ballpark. Index cost for a 200M-token corpus at $1.02 per million.
- Src: [R9], [R8]

**A5.5 hybrid-rrf: Hybrid Search and Reciprocal Rank Fusion**
- requires: A5.2, B:08-technologies/elasticsearch
- Write: Dense vectors catch meaning and miss exact terms (SKUs, names, error codes). BM25 catches exact terms. Run both, merge. Scores are on different scales, so merge by rank. RRF: score = sum of 1/(k + rank), k = 60 by default [R10]. No tuning needed. A larger rank window helps relevance and costs speed [R10].
- Animate: Two ranked lists merge by RRF; step through scores for one document. Second: k slider reshapes the final order.
- Prove it: Ballpark. RRF score of a document ranked 1 in one list and 10 in the other at k=60.
- Src: [R10], [R3]

**A5.6 reranking-rewriting: Reranking and Query Rewriting**
- requires: A5.5
- Write: Cascade again. Stage 1 retrieves top 25 fast with a bi-encoder. Stage 2 reranks to top 3 with a cross-encoder that reads query and document together [R11]. A cross-encoder cannot precompute, so run it only on a short list [R11]. ColBERT's late interaction sits between the two [R12]. Query rewriting and HyDE (an LLM writes a fake answer, then you search with it) add recall and a risk of false details [R13].
- Animate: Funnel 1M to 25 to 3 with latency per stage. Second: rewrite demo with a bad query before and after.
- Prove it: Ballpark. Rerank latency for 25 candidates at a stated per-pair cost.
- Src: [R11], [R12], [R13]
- Note: the two-tower and ranking cascade of classic recommenders is elective E1.5. Write it as plain text here.

**A5.7 graphrag-longctx: GraphRAG and Long Context vs RAG**
- requires: A5.6, A1.6, A4.6
- Write: Vector RAG answers local questions. A global question ("main themes") needs a whole-corpus view. GraphRAG builds an entity graph and community summaries, then merges partial answers [R14]. Cost: heavy indexing. Long context vs RAG: long prompts raise cost and hurt recall in the middle [T10]; RAG keeps cost flat but adds retrieval errors. Rule: use long context for one document, RAG for a corpus.
- Animate: Corpus to graph to summaries to answer. Second: cost-per-query curve of long context vs RAG as corpus grows.
- Prove it: Diagnose. "What are the top risks across all contracts?" returns one contract's risks.
- Src: [R14], [T10], [P11]

**A5.8 freshness-updates: Freshness and Index Updates**
- requires: A5.2, B:06-async/cdc
- Write: A doc changes; the index must follow. Pipeline: change event, re-chunk, re-embed, upsert, delete old chunks. Cursor hashes files into a Merkle tree so a small edit changes only one path; sync visits only differing branches; embeddings are cached by chunk content [C4]. HNSW deletes and inserts have costs (writer must verify). Freshness SLO and how to measure it.
- Animate: Merkle tree with one changed leaf; sync walks one path. Second: pipeline lag simulator for event burst.
- Prove it: Diagnose. A deleted document still appears in answers. Which stage failed?
- Src: [C4], [R7]

**A5.9 retrieval-permissions: Permissions in Retrieval**
- requires: A5.3, A5.8, B:03-api-design/auth
- Write: A user must never see a chunk they cannot open. Options: pre-filter by ACL in the query, post-filter (can return too few results [R5]), per-tenant indexes. ACL changes must propagate fast. Cursor's index-sharing drops results for files the client cannot prove with a path proof [C4]. OWASP LLM08 names vector weaknesses [S1]. Writer must source enterprise ACL patterns.
- Animate: Two users run one query; results differ by ACL. Second: ACL-change timeline showing a leak window.
- Prove it: Diagnose. A revoked employee still gets answers from a private doc. Find the stale layer.
- Src: [C4], [S1], [R5]

**A5.10 rag-evaluation: RAG Evaluation**
- requires: A5.4, A5.6, B:08-technologies/elasticsearch
- Write: Split the failure: did retrieval find it, did the model use it. Retrieval metrics: recall@k, precision, MRR. Generation metrics: faithfulness, answer relevance. RAGAS lists context precision, context recall, faithfulness, noise sensitivity [R15]. Build the retrieval golden set first. Fix retrieval before prompts.
- Animate: Pipeline with two meters, retrieval and generation, showing which broke. Second: confusion grid of (retrieved right, answered right).
- Prove it: Diagnose. Users say answers are wrong. Retrieval recall is 95%. Where to look?
- Src: [R15], [E1]
- Ordering note: A9 comes after A6, so this lesson writes "full eval method in A9" as plain text, not a link.

### Part: Agents (A6 to A7)

#### A6. Agent Foundations

_Eleven lessons. Agents are the core of the track._

**A6.1 agent-loop: The Agent Loop**
- requires: A3.4, A0.3
- Write: Loop: gather context, act, verify, repeat [A11]. A model plus tools plus a stop rule. Naive: let it run forever. Fix: step budget, token budget, time budget. Each iteration adds tokens (agents use about 4x chat tokens [A6]).
- Animate: Loop with a failing tool call at step 3 and a retry. Second: budget meters (steps, tokens, dollars).
- Prove it: Ballpark. Cost of a 12-step run with growing context (writer derives).
- Src: [A11], [A6], [A5]

**A6.2 workflows-vs-agents: Workflows vs Agents**
- requires: A6.1
- Write: Workflows follow code paths. Agents choose their own steps [A5]. Five patterns: chaining, routing, parallelization, orchestrator-workers, evaluator-optimizer [A5]. Start with the simplest. Frameworks can hide prompts [A5]. Decision rule: fixed steps means a workflow.
- Animate: Five pattern diagrams stepped one by one. Second: chooser quiz tool.
- Prove it: Diagnose. A "researcher agent" always runs the same 4 steps. Replace with what?
- Src: [A5]

**A6.3 agents-as-graphs: Agents as Graphs**
- requires: A6.1, A6.2, B:08-technologies/temporal
- Write: An agent is a graph. State is a typed object: messages, plan, scratch data, counters. A node is a function that reads state and returns an update: a model call, a tool call, a check. An edge says which node runs next. A conditional edge routes on state ("tool calls present? go to tools, else end"). A workflow with fixed steps is a DAG. An agent loop is a cycle with an exit condition. Why use a graph: explicit steps give you checkpoints, retries, tracing, and a test per node. Map to the backend: a graph is a state machine. State is the row. Nodes are transitions. A Temporal workflow is the same idea with replay (`B:08-technologies/temporal`). Rule: every cycle needs an exit edge guarded by a budget (A7.2).
- Animate: One agent drawn as a loop, then as a graph with state. Step through three turns and watch the state change. Second: toggle a conditional edge and watch the route change.
- Prove it: Diagnose. A "retry until valid" flow has no exit edge and loops forever. Add the missing edge.
- Src: [A5], [A11], [A9]. UNVERIFIED in notes: graph runtime docs (for example LangGraph); writer must source.

**A6.4 loop-patterns: Loop Patterns**
- requires: A6.1, A6.2
- Write: Five patterns. ReAct: think, act, observe, repeat. Evaluator-optimizer: one call drafts, another critiques, loop until the bar is met [A5]. Reflection: the agent critiques its own output. It is weak without an outside signal. Generate-verify-fix: run a check (tests, schema, linter) and feed the errors back. It is the strongest, because the verifier is code [A11]. Plan-execute-replan: write a plan, run the steps, revise on failure (A6.8). For each: when it fits, and the cost of one more round in tokens and latency. Verify with rules first, then visual checks, then LLM judges, which are "not very robust" [A11].
- Animate: Five loops drawn as small graphs; step through one failing case in each. Second: cost of k rounds.
- Prove it: Diagnose. A reflection loop "improves" the answer and the pass rate does not move. Which signal is missing?
- Src: [A5], [A11]. UNVERIFIED in notes: ReAct paper; writer must source.

**A6.5 tool-design: Tool Design for Agents**
- requires: A6.1, A3.4
- Write: Tools are the agent's interface. Test them with many inputs and watch mistakes [A5]. Anthropic's tool-testing agent rewrote descriptions and cut task time 40% [A6]. Track accuracy, runtime, tool calls, tokens, tool errors; many redundant calls signal a pagination problem [A4]. Pair tasks with verifiable outcomes.
- Animate: Tool call log with errors tagged. Second: tool-description A/B; error rate bars.
- Prove it: Diagnose. An agent calls `search` 14 times per task.
- Src: [A4], [A5], [A6]
- Real data: Shopify Sidekick tool tiers: 0 to 20 tools easy to debug, 20 to 50 blurred, 50+ hard to reason about; just-in-time instructions return with tool data to keep prompts cache-friendly [G12].

**A6.6 mcp: MCP Servers and Clients**
- requires: A6.5, B:02-networking/rpc-grpc
- Write: Without a standard, each model-tool pair is custom. MCP (spec 2025-06-18): JSON-RPC 2.0, stateful; hosts start connections; servers offer resources, prompts, tools; clients offer sampling, roots, elicitation [A8]. Tools are arbitrary code: hosts must get user consent [A8]. Tool descriptions are untrusted unless the server is trusted [A8]. a server exposes tools, resources, and prompts. A client inside the host connects to it. Writer must verify transports (stdio, HTTP) in the spec [A8].
- Animate: Host, client, server handshake and a tool call. Second: capability map of who offers what.
- Prove it: Diagnose. A server's tool description tells the model to send files elsewhere. Which spec rule applies?
- Src: [A8]

**A6.7 agent-memory: Memory**
- requires: A4.4, A6.1
- Write: Short-term: the window. Long-term: notes, a store, or retrieval. Compaction near the limit [A11]. What to store, when to read, when to forget. Staleness and poisoning risk. Agentic search (grep, tail) before semantic search [A11].
- Animate: Memory read and write across sessions. Second: compaction before and after with token counts.
- Prove it: Diagnose. Agent repeats a mistake it fixed yesterday.
- Src: [A7], [A11]

**A6.8 planning: Planning**
- requires: A6.1, A6.2
- Write: A plan is a list of steps the model writes before it acts. Long tasks drift without one. Keep the plan in state and show it to the model each turn. Static plan or replan on failure: replan when a tool fails or a check does not pass. A strong model plans and cheaper models execute (cost lever). Rigid plans break when tools fail. Check progress against the plan before the agent says "done".
- Animate: A 6-step plan with one step failing; the agent replans. Second: plan checklist state across turns.
- Prove it: Diagnose. The agent finishes step 2 of 6 and declares done. Which check is missing?
- Src: [A5], [A11]

**A6.9 long-running-context: Context Management for Long-running Agents**
- requires: A4.4, A6.7
- Write: Each loop adds tokens. Agents use about 4x the tokens of chat [A6]. Tool output is the largest part. Tactics: cap and paginate tool output, clear old tool results, compact (A4.4), keep notes outside the window [A7], pass references (paths, URLs) instead of contents and load them just in time [A7], delegate to subagents (A6.10). Cost grows with context size x steps. Keep the prefix stable so the cache works (A4.5).
- Animate: A window filling over 40 steps with each tactic toggled. Second: cost of a run with and without clearing.
- Prove it: Ballpark. Turns until a 200K window fills at 6K tokens per turn (about 33). Then state the new count if clearing removes 70% of each tool result.
- Src: [A7], [A11], [A6]

**A6.10 subagents: Subagents**
- requires: A6.1, A6.5
- Write: A subagent gets a fresh context and a narrow task. It returns a short summary, about 1,000 to 2,000 tokens [A7]. Uses: keep the main context small, search in parallel, isolate a risky tool. A good brief names the goal, the output format, the tools, and the stop rule. Cost: multi-agent runs use about 15x chat tokens [A6]. Early versions spawned 50 subagents for simple queries [A6]. They fit tightly coupled tasks poorly [A6]. Fleet-level orchestration is A7.6.
- Animate: Main agent hands a task to a subagent; the subagent context grows and collapses to a summary. Second: main context size with and without delegation.
- Prove it: Ballpark. Cost of a multi-agent run at 15x a 10K-token chat.
- Src: [A6], [A7], [A11]

**A6.11 skills: Skills**
- requires: A6.5, A6.6
- Write: A skill is a folder of instructions and scripts that the agent loads when a task matches. Only the name and description sit in context. The body loads on demand (writer must verify against the primary spec). This avoids a huge system prompt and lets teams share know-how. Tools do actions. MCP connects systems. Skills teach a procedure. A skill is code and instructions, so review it like a dependency (A10.4).
- Animate: Agent with 30 skills; a task arrives and one skill body loads. Second: context size with skills vs one big prompt.
- Prove it: Diagnose. An agent prompt holds 40K tokens of rarely used procedures. Redesign it.
- Src: [A11]. UNVERIFIED in notes: Agent Skills spec; writer must source the primary doc.

#### A7. Agents in Production

_Ten lessons. Run agents safely, cheaply, and for hours._

**A7.1 durable-graph-runtime: Durable Execution and the Graph Runtime**
- requires: A6.3, A6.1, B:08-technologies/temporal, B:09-patterns/long-running-tasks
- Write: An agent run can last minutes to hours. A crash must not restart it. Durable execution: a workflow replays its event history on another worker and resumes; timers survive restarts; retries follow a policy [A9]. Checkpoints let agents resume from the failure point [A6]. Rainbow deployments shift traffic gradually so running agents are not cut off [A6]. Idempotent tools are required for replay. Graph runtime features: checkpoint per node (after each node the runtime saves state, so a crash resumes at the next node); resume by thread id; interrupts (a node pauses the run and waits for input, see A7.3); parallel fan-out and join (nodes run in parallel, then a reducer merges results, so define merge rules); subgraphs (a graph used as one node, with its own state); replay (re-run from a checkpoint to debug or to fork). Compare: Temporal replays code from an event history. A graph runtime restores state at a node.
- Animate: Worker crash; another worker replays history to step 7. Second: rainbow deploy with two versions side by side.
- Prove it: Diagnose. After a crash the agent sent the email twice. Which property was missing?
- Src: [A9], [A6]. UNVERIFIED in notes: graph runtime APIs; writer must source.

**A7.2 loop-control: Loop Control and Stopping**
- requires: A7.1, A6.4
- Write: p^n: 95% per step, 10 steps, 60%; 20 steps, 36%; 90% per step, 10 steps, 35% (derived) [A6]. "Errors compound" [A6]. Levers: fewer steps, verifiers, retries on idempotent steps, checkpoints. Evaluate trajectories, not only final answers (A6.7). Stop conditions: the model says done, a goal check passes, max steps, token budget, dollar budget, wall-clock timeout, user cancel. Stuck and oscillation detection: the same tool call with the same arguments repeats; the state hash repeats; the progress metric stays flat for k steps. On a trigger: stop, summarize, ask a human, or fall back. Runaway cost math: cost = steps x average context tokens x price per token. At 30K tokens per step, 200 steps is 6M input tokens before caching.
- Animate: Chain-reliability slider with verifier and retry toggles. Second: trace with first failing step highlighted.
- Prove it: Ballpark. Reliability of 10 steps at 95% with one verifier that catches 80% of errors (writer derives).
- Src: [A6], [A4]

**A7.3 human-in-the-loop: Human-in-the-Loop**
- requires: A7.2, A6.6, A7.1
- Write: Where to put approvals: before irreversible actions, above a spend limit, on low confidence. MCP requires consent before tool runs [A8]. Approval fatigue. Async approval needs durable state (A7.1). Interface: show the exact action, not a summary.
- Animate: Agent pauses at an approval gate, then resumes. Second: approval rate vs risk chart.
- Prove it: Diagnose. Users click approve on all prompts. Redesign the gate.
- Src: [A8], [A11]

**A7.4 sandboxes-code-execution: Sandboxes and Code Execution**
- requires: A6.6, B:03-api-design/auth
- Write: An agent that runs code can do harm. A sandbox has no ambient credentials, a network egress allow list, a limited filesystem, and time and memory caps. It is disposable per run. Options: container, microVM, remote sandbox service (writer must source designs; none is in the notes). Inject scoped, short-lived secrets. Treat all output as untrusted.
- Animate: Agent in a box with allowed and blocked calls. Second: network egress allow list demo.
- Prove it: Diagnose. A code-running agent reads `~/.ssh`. Which control was missing?
- Src: [A8], [S3]. UNVERIFIED in notes: sandbox designs.

**A7.5 computer-browser-use: Computer and Browser Use**
- requires: A7.4, A7.2
- Write: Computer use: the model sees screenshots and emits clicks and keystrokes. Browser use: the model reads the page structure plus screenshots. Cost: screenshot tokens on every step. Latency: seconds per step. Reliability: many steps, so p^n (A7.2). Risk: any text on a page can steer the agent (A10.2). Controls: an isolated browser profile, no logged-in sessions by default, a domain allow list, and confirmation before submit or pay (A7.3). Prefer an API or an MCP tool when one exists.
- Animate: A browse task step by step with screenshot tokens and elapsed time. Second: success rate vs number of steps.
- Prove it: Ballpark. Cost and time of a 30-step browser task at a stated screenshot size and live prices.
- Src: [S2], [S3], [A8]. UNVERIFIED in notes: computer-use provider docs and benchmarks; writer must source.

**A7.6 multi-agent-orchestration: Multi-agent Orchestration**
- requires: A6.10, A7.1
- Write: A lead plans; subagents run in parallel with their own contexts. Anthropic's system: 3 to 5 subagents, up to 90% less research time, but about 15x chat tokens; token use explained 80% of variance on BrowseComp [A6]. Lead Opus 4 with Sonnet 4 subagents beat single Opus 4 by 90.2% on an internal eval [A6]. Early versions spawned 50 subagents for simple queries [A6]. Poor fit for tightly coupled tasks such as most coding [A6].
- Animate: Lead spawns 4 subagents; results merge; token meter. Second: single vs multi-agent cost and time chart.
- Prove it: Ballpark. Cost of a multi-agent run at 15x a 10K-token chat.
- Src: [A6], [A11]

**A7.7 background-agents-queues: Background Agents and Queues**
- requires: A7.1, B:06-async/queues, B:09-patterns/long-running-tasks
- Write: An agent that runs for minutes must not hold an HTTP request. Submit a task and get a run id. A worker pool runs it. The client polls or subscribes to events. Use a queue per tenant, concurrency limits, priorities, and fair share. Triggers: schedule, webhook, new email. Store results with the trace and notify on completion. A worker crash is handled by the durable runtime (A7.1) or by a visibility timeout plus idempotent steps. Set cost limits per queue.
- Animate: Run lifecycle: queued, running, waiting for input, done. Second: queue simulator with a noisy tenant and fair share on and off.
- Prove it: Ballpark. Workers needed for 500 runs per hour at 6 minutes each (50 busy at once; 100 with 2x headroom).
- Src: [A9], [A6]

**A7.8 agent-identity-oauth: Agent Identity and OAuth for Tools**
- requires: A7.4, B:03-api-design/auth
- Write: Whose permission does the agent use? A shared service account is too broad. The user's own token (OAuth, on behalf of the user) is safer. A scoped, short-lived token per run is safest. OAuth for tools: authorization code flow, consent screen, scopes, refresh tokens stored encrypted, revocation. The MCP spec has an authorization section (writer must verify) [A8]. Confused deputy: the agent uses its own broad rights for a user who has none. Log who, which agent, which tool, which user. Isolate per tenant.
- Animate: Token flow from user consent to a tool call, with scopes. Second: confused-deputy path with and without per-user tokens.
- Prove it: Diagnose. A shared admin token lets user A read user B's tickets. Which control fixes it?
- Src: [A8], [S1]. UNVERIFIED in notes: OAuth patterns for agents; writer must source.

**A7.9 agent-protocols: Agent-to-Agent Protocols**
- requires: A6.6, A7.6
- Write: Agents from different teams or vendors need a wire protocol. MCP connects an agent to tools. An agent-to-agent protocol connects an agent to another agent. It covers discovery (a card that lists skills), a task lifecycle (submitted, working, input needed, done), streamed updates, and auth. Output from a remote agent is untrusted (A10.2). Do not use a network protocol when an in-process subagent is enough.
- Animate: Discovery, task submit, status stream, result. Second: trust boundary map with a remote agent.
- Prove it: Diagnose. A remote agent returns text that tells your agent to call a tool. Which rule applies?
- Src: [A8]. UNVERIFIED in notes: A2A spec; writer must source the primary spec.

**A7.10 agent-ux: Agent UX: Progress, Interrupt, Undo**
- requires: A3.2, A7.3, A0.3
- Write: Show progress: stream steps and tool calls so a long run does not look frozen. Let the user interrupt and steer. Make actions undoable: diffs, checkpoints, reversible writes. Show sources. Show confidence only when it is calibrated. Make correction cheap: edit, regenerate, thumbs. Do not auto-apply risky actions. Trust calibration: over-trust and under-trust. Sources: defensive UX and feedback patterns [P14]; FSDL on language UIs [P9]; Copilot design [C3].
- Animate: Same run in 4 UI treatments with a trust meter. Second: correction flow from edit to logged signal.
- Prove it: Diagnose. Users accept wrong agent actions at a high rate. Which UX change helps?
- Src: [P14], [P9], [C3]

### Part: Quality and trust (A8 to A10)

#### A8. Evals

_Nine lessons. Adds agent trajectory evals and simulated users. Pairwise and pointwise judging merge into one lesson. Contamination folds into golden sets._

**A8.1 eval-driven-design: Eval-Driven Design**
- requires: A0.2, A4.1
- Write: Without an eval, a prompt change is a guess. Build the eval before the feature. Pass rate is a product choice, not a demand for 100% [E1]. Eval types: code checks, human labels, LLM judges. The loop: change, run, compare, ship. Fills gap 1.
- Animate: Loop of change, eval run, scoreboard. Second: eval-cost calculator (cases x model x judge).
- Prove it: Diagnose. A team ships a prompt change after testing three examples by hand.
- Src: [E1], [P8], [P1]
- Real data: LinkedIn reached 80% of the target experience in month one and needed four more months to pass 95%. Its three eval tiers: engineers (fast), annotators (about 1 day), members (3+ days) [G14b].

**A8.2 error-analysis: Error Analysis**
- requires: A8.1
- Write: Read traces. Label pass or fail with a critique. Group failures into scenarios. Keep reading until nothing new appears [E1]. Turn each scenario into a test. The method is the Hamel and Shreya trace review [E1, P8].
- Animate: Trace cards sorted into failure groups; counts form a bar chart. Second: sample-size explorer for "have I seen enough".
- Prove it: Diagnose. 100 traces, 40 failures. Group them from five given critiques.
- Src: [E1], [P8]

**A8.3 golden-sets: Golden Sets, Synthetic Data, and Contamination**
- requires: A8.2
- Write: Start with real traces. Add synthetic cases for rare scenarios. Keep a held-out split. Version the set. Label cost and agreement between labelers. Tool evals: held-out test sets with verifiable outcomes [A4]. Test data found in training data inflates scores. C4 contained examples from other benchmarks [E3]. Defenses: private held-out sets, fresh sets, dedup, rotating sets. Public leaderboards for model choice need your own eval too.
- Animate: Set grows from traces to scenarios to synthetic cases. Second: coverage heat map by scenario. Also: Train and test sets overlapping; score rising with overlap. Second: checker that finds n-gram overlap.
- Prove it: Ballpark. Labels needed for a given confidence (writer derives). Also: Diagnose. A model scores 95% on a public set and 60% on your own.
- Src: [E1], [A4], [P8], [E3], [P10]

**A8.4 judges: Code Checks and LLM Judges**
- requires: A8.3
- Write: Code checks are cheap and exact; use them first. For fuzzy quality use a judge. MT-Bench: GPT-4 agreed with humans over 80%, similar to human-human agreement; named biases are position, verbosity, and self-enhancement [E2]. Validate the judge on 25 to 50 labeled examples at a time; use precision and recall, not raw agreement [E1]. Prefer prompt changes to judge fine-tuning [E1]. Pointwise: score one answer; scales drift. Pairwise: pick the better of two; more stable; needs both orders to cancel position bias. Rubrics and binary checks. Writer must source the claim on stability.
- Animate: Judge bias demo: swap answer order and watch the verdict flip; lengthen an answer and watch the score rise. Second: agreement vs precision/recall on imbalanced labels. Also: Pointwise scores drifting vs pairwise win rate. Second: order-swap consistency counter.
- Prove it: Diagnose. A judge picks answer A 70% of the time. Which bias, which test? Also: Diagnose. Pointwise scores rise 0.4 after a judge model update with no quality change.
- Src: [E2], [E1]. UNVERIFIED in notes: pairwise vs pointwise.
- Real data: Airbnb samples 5% of live traffic daily, uses 3 to 5 judges (not 20 to 30), a golden set of 50 to 100 examples, and targets high kappa [G14]. Shopify Sidekick judge kappa ranged 0.02 to 0.61 against a human baseline of 0.69 [G12].

**A8.5 trajectory-evals: Agent Trajectory Evals**
- requires: A8.4, A6.1, A6.5
- Write: A pass or fail on the final answer hides where an agent broke. A trajectory is the list of steps: model calls, tool calls, results. Grade four things. Outcome: a checkable result (tests pass, the record changed). Steps: right tool, valid arguments, no redundant calls. Efficiency: steps, tokens, dollars. Safety: no forbidden action. Prefer state checks (compare the end state of the environment with the expected state) over text matching. Track tool accuracy, runtime, call count, tokens, and errors [A4]. Run each task k times and report how often all k runs pass. Code checks first. Judges on trajectories are noisy.
- Animate: A trajectory with the first bad step highlighted. Second: pass rate of one run vs all of k runs.
- Prove it: Diagnose. An agent passes 70% of tasks but 30% of repeat runs of one task fail. Which metric shows it?
- Src: [A4], [A6], [E1]. UNVERIFIED in notes: repeat-run pass metrics; writer must source.

**A8.6 simulated-users: Simulated Users and Scenario Tests**
- requires: A8.5, A8.2
- Write: Chat and support agents need multi-turn tests. A simulated user is a model with a persona, a goal, and hidden facts. It talks to your agent. Run many personas: cooperative, vague, hostile. Mock the tools with seeded state. Success means the goal is reached and the policy is followed, judged by state checks. Risks: simulator drift, users that are too cooperative, blind spots shared with the agent model. Check the simulator against real traces (A8.2). Cost: two models per turn.
- Animate: A simulated user and an agent in a 6-turn dialog with a hidden fact. Second: success rate by persona.
- Prove it: Ballpark. Cost of 300 personas x 12 turns x 2 models at stated token counts and live prices.
- Src: [E1], [P8], [A6]. UNVERIFIED in notes: published user-simulation benchmarks; writer must source.

**A8.7 online-evals-ab: Online Evals and A/B for LLM Features**
- requires: A8.4
- Write: Offline evals miss user behavior. Online signals: accept, edit, retry, thumbs, task success. Copilot A/B: FIM gave about 10% relative gain in accepted completions; neighboring tabs about 5% [C3]. LLM outputs are noisy, so sample size grows. Guardrail metrics: latency, cost, refusal rate.
- Animate: Funnel of signals per answer. Second: A/B dashboard with live interval.
- Prove it: Diagnose. Acceptance rises but edits per suggestion double.
- Src: [C3], [E1]
- Note: A/B test statistics (power, sample size, interleaving) are in elective E1.8. This lesson covers only the LLM-specific parts.

**A8.8 rollout: Shadow, Canary, and Rollback**
- requires: A8.7, B:07-reliability/circuit-breaker
- Write: Shadow: run new model on live traffic, show nothing. Canary: 1% of users. Gates: quality eval, latency, cost, refusals. Rollback in one switch. Pin model versions: providers retire models, and silent updates change behavior. Fills gap 5.
- Animate: Traffic split with gates turning green or red. Second: rollback timeline with time-to-detect.
- Prove it: Diagnose. A provider updates a model alias; pass rate drops 6 points overnight.
- Src: [P2], [P14]. UNVERIFIED in notes: provider version policy.

**A8.9 feedback-flywheel: The Feedback Flywheel**
- requires: A8.3, A8.7
- Write: Logs become eval cases; failures become training data (SFT pairs, DPO preferences [T5]). Pipeline: capture, redact PII, sample, label, add to sets, retrain or re-prompt. Where signals come from: edits, retries, thumbs. Risks: selection bias, privacy, feedback loops. Fills gaps 6 and 10.
- Animate: Wheel of log to eval to model to log with counts at each stage. Second: privacy filter step showing redactions.
- Prove it: Diagnose. New model gets better on the eval and worse in production. Which source was missing from the set?
- Src: [P14], [E1], [T5]

#### A9. Observability and LLMOps

_Seven lessons. GPU-level dashboards move to E3._

**A9.1 tracing: Tracing and Observability**
- requires: A8.2, B:07-reliability/observability
- Write: One request becomes many spans: retrieval, model calls, tools. Log prompt, version, tokens, latency, cost, and outcome. OpenTelemetry GenAI conventions moved to a separate repo; attribute names must be verified before use [OT]. Traces feed error analysis [E1]. Privacy: redact before storage. an agent run is a tree: run, step, model call, tool call. Log each node with its state version.
- Animate: Waterfall of an agent run built span by span. Second: trace-to-eval button path.
- Prove it: Diagnose. p95 is high. Find the slow span in a sample trace.
- Src: [E1], [OT]. UNVERIFIED: attribute names.

**A9.2 cost-engineering: Cost Engineering**
- requires: A3.9, A2.5, A3.8
- Write: Cost per request = input tokens x price + output tokens x price + tool and retrieval cost. Levers: shorter prompts, caching, routing, batching, smaller models, quantization. Cache math: 80% hits turn 2M ITPM into 10M effective [A10]. Cookbook shows pass rate vs cost search [P16]. Track dollars per successful task, not per call.
- Animate: Waterfall of a request's cost with each lever applied. Second: Pareto explorer.
- Prove it: Ballpark. Monthly cost for 5M requests, 3K in and 500 out tokens, at stated prices.
- Src: [A10], [P16], [A2]

**A9.3 versioning: Model and Prompt Versioning**
- requires: A8.8, A4.1
- Write: Prompt, model, tools, and retrieval config form one release. Version them together. Link each trace to a version. Rollback needs the old model still available. CI for LLMs (FSDL) [P9] and tests for code, data, and models (Made With ML) [P13].
- Animate: Release manifest diff between v12 and v13. Second: trace filtered by version.
- Prove it: Diagnose. Which of four changed files caused the regression?
- Src: [P9], [P13]

**A9.4 guardrails-pipeline: The Guardrails Pipeline and Output Checks**
- requires: A3.3, A9.2
- Write: Input checks, output checks, and retries. Rule checks (schema, regex, allow list) first, model checks second. Cost of each check in latency and dollars. A guardrail is not a security boundary (A10.4). Verify with rules, then visual checks, then LLM judges, which are "not very robust" [A11]. Input filters, retrieval filters, output filters, action gates. Budget each stage's latency and cost. Parallelize where possible. Monitor block rates. Not a security boundary (A10).
- Animate: Pipeline with three checkers, each with latency. Second: false-positive vs false-negative slider. Also: Request through four stages with timers. Second: block-rate dashboard with drift.
- Prove it: Ballpark. Added p95 latency of three serial checks vs parallel. Also: Ballpark. Latency added by 4 serial 50 ms checks.
- Src: [A11], [P14], [S3]

**A9.5 provider-failover: Provider and Region Failover**
- requires: A3.8, B:04-data/replication
- Write: A provider outage is your outage. Fail over to a second provider or a self-hosted model. Prompts and eval results differ per model; the fallback needs its own eval. KV caches do not move between regions. Compare: active-active vs warm standby with costs.
- Animate: Primary fails; router shifts traffic; quality bar dips. Second: failover cost vs RTO table.
- Prove it: Diagnose. Failover works, but output format breaks downstream.
- Src: [A10], [C1]

**A9.6 incident-response: Incident Response for Model Regressions**
- requires: A9.3, A8.8
- Write: Detect (online evals, complaint rate), triage (version diff, trace sample), mitigate (rollback, route, disable feature), learn (add to eval set). A runbook for "answers got worse". Compare to the backend failure playbook.
- Animate: Incident timeline with each action. Second: decision tree from symptom to action.
- Prove it: Diagnose. Complaint spike after a silent provider update. Walk the runbook.
- Src: [E1], [P2]

**A9.7 llm-dashboards: Dashboards and Alerts for LLM Systems**
- requires: A9.1, A2.2
- Write: Metrics that matter: TTFT, TPOT, token spend, cache hit rate, tool error rate, steps per run, stuck-run rate, queue depth. If you self-host, add KV utilization, batch size, goodput, and MBU [K2, K7, C1] (elective E3.7). GPU utilization misleads [C1]. Alert on SLO burn and on budget burn.
- Animate: A dashboard stepped through three failure scenes. Second: metric cheat sheet.
- Prove it: Diagnose. TTFT spikes with flat GPU utilization.
- Src: [K2], [K7], [C1]

#### A10. Safety and Security

_Seven lessons, agent-focused: tool permissions, indirect injection through tools, the lethal trifecta._

**A10.1 threat-model: Threat Model for Agents**
- requires: A6.5, B:03-api-design/auth
- Write: Assets, actors, entry points. New entry point: any text the model reads. The model cannot reliably separate data from instructions. OWASP Top 10 for LLM Apps 2025 lists ten classes [S1]. Draw a trust-boundary diagram for every design. for an agent, every tool is an entry point and an exit point. Draw the trust boundary around each tool.
- Animate: Data-flow diagram with trust boundaries lighting up. Second: OWASP ten map to components.
- Prove it: Diagnose. List three entry points in a support bot.
- Src: [S1]

**A10.2 prompt-injection: Prompt Injection, Direct and Indirect (via Tools)**
- requires: A10.1
- Write: Direct: the user writes the attack. Indirect: attackers plant text in pages, files, or emails the app retrieves; tested on Bing Chat and GPT-4 apps; impacts include data theft, worms, API manipulation [S2]. Authors say mitigations are lacking [S2]. Show a real captured attack. tool results are the main indirect path. A web page, a ticket, an email, or an MCP tool description can carry the attack.
- Animate: Retrieved page contains hidden instruction; step through the hijack. Second: attack-surface counter as tools are added.
- Prove it: Diagnose. A summarizer sends a link to an attacker. Find the injection point.
- Src: [S2], [S1]

**A10.3 lethal-trifecta: The Lethal Trifecta and Exfiltration**
- requires: A10.2
- Write: Three parts: private data, untrusted content, external communication. Do not give all three to one agent [S3]. Exfiltration paths: links, images, tool calls. Once untrusted input enters, limit what the agent can trigger [S3].
- Animate: Three circles; remove one and the attack path closes. Second: path tracer on an agent design.
- Prove it: Diagnose. Mark the three legs in a given mail-assistant design.
- Src: [S3]

**A10.4 tool-permissions: Tool Permissions and Least Privilege**
- requires: A10.3, A6.6, A7.8
- Write: Scope credentials per task. Read-only by default. Human approval for writes. Willison: do not rely on guardrail products; 95% effective is a failing grade in application security [S3]. MCP: hosts must get consent [A8]. OWASP LLM06 Excessive Agency [S1].
- Animate: Permission matrix with a tool set shrinking. Second: blast-radius meter.
- Prove it: Diagnose. An agent with a admin token deletes records after an injection.
- Src: [S3], [A8], [S1]

**A10.5 pii-privacy: PII and Data Handling**
- requires: A10.1, A9.1
- Write: PII in prompts, logs, traces, training data, and indexes. Redact before logging. Retention. Provider data terms. Delete requests and embeddings. OWASP LLM02 [S1]. Writer must source PII handling patterns.
- Animate: Data flow with PII markers at each store. Second: redaction demo.
- Prove it: Diagnose. A user asks for deletion. List where their data still lives.
- Src: [S1]. UNVERIFIED: PII handling.

**A10.6 jailbreaks-redteam: Jailbreaks and Red-Teaming**
- requires: A10.2
- Write: Jailbreaks make a model ignore its rules. Red-team loops: attacker model tries, judge scores (PAIR loop in calm.rocks [P20]). Turn each success into a regression eval. Hamel's course lists red-teaming for injection and unsafe tool calls [P8]. Writer must source a jailbreak taxonomy.
- Animate: Attacker and target iterate over 5 rounds. Second: success-rate by attack family.
- Prove it: Diagnose. A fix blocks one phrasing; the same attack works with a paraphrase.
- Src: [P20], [P8]. UNVERIFIED: taxonomy.

**A10.7 owasp-llm10: OWASP LLM Top 10 as a Design Checklist**
- requires: A10.4, A10.5, A10.6
- Write: Walk all ten: prompt injection, sensitive information disclosure, supply chain, data and model poisoning, improper output handling, excessive agency, system prompt leakage, vector and embedding weaknesses, misinformation, unbounded consumption [S1]. For each: one design control and one test.
- Animate: Checklist mapped onto a reference architecture. Second: audit tool where the reader marks controls.
- Prove it: Diagnose. Map five incidents to the right category.
- Src: [S1]

### Part: Customization and media (A11 to A12)

#### A11. Fine-tuning and Post-training

_Five lessons. Moved up from the old training module. Pretraining at scale is elective E2._

**A11.1 when-to-finetune: When to Fine-tune**
- requires: A0.4, A5.10, A8.2
- Write: Three levers. Prompt: cheapest, no new facts at scale. RAG: adds fresh facts and citations. Fine-tune: changes behavior, style, format, latency. Decide by the failure type from error analysis (links to A8.2). Memory and cost of each (links to A11.2). Yan's pattern map [P14] and AIE ch 7 [P1].
- Animate: Triage tool: pick a failure (stale facts, wrong tone, bad format, slow); path lights up. Second: cost-per-quality table.
- Prove it: Diagnose. Five failure examples; sort each to the right lever.
- Src: [P1], [P14], [P20]

**A11.2 sft-lora: SFT and LoRA**
- requires: A11.1, A2.1
- Write: Pretraining gives a text predictor. SFT teaches a format or a behavior from example pairs [P10]. Full fine-tune of 70B needs 1.12 TB of states. LoRA freezes weights and trains small low-rank adapters: 10,000x fewer trainable parameters on GPT-3 175B, 3x less GPU memory, no extra latency once merged [T7]. QLoRA stores the base in 4-bit: a 65B model fits on one 48 GB GPU [T8]. 65B x 0.5 byte is about 33 GB (derived).
- Animate: Frozen matrix plus two small matrices; step through forward and backward. Second: memory calculator across full, LoRA, QLoRA for model size.
- Prove it: Ballpark. Memory for QLoRA on a 70B model: weights ~35 GB plus overhead.
- Src: [T7], [T8], [T3], [P10]

**A11.3 preference-tuning: Preference Tuning and DPO**
- requires: A11.2
- Write: SFT shows what to say. Preference tuning shows which answer is better. RLHF trains a reward model and then uses PPO. DPO trains on preference pairs with a classification-style loss and no reward model [T5]. Preference data comes from the feedback flywheel (A8.9): edits, retries, thumbs. When each fits: DPO for style and safety preferences; skip both when a prompt fix works.
- Animate: DPO pair demo: a chosen and a rejected answer move the probability bars. Second: pipeline of SFT, preference tuning, and eval gates with the data each needs.
- Prove it: Diagnose. After preference tuning, answers get longer and quality does not rise. Which bias did the data teach?
- Src: [T5], [P10]

**A11.4 reinforcement-finetuning: Reinforcement Fine-tuning and Graders**
- requires: A11.3, A8.5
- Write: Reinforcement fine-tuning trains on a reward signal. A grader scores each sampled answer. A grader can be a code check (tests, exact match) or a model. RLVR uses a checker, such as a math answer or unit tests, as the reward [T6]. It needs tasks with a checkable result. The grader is the product. A weak grader gets gamed (reward hacking). The data is prompts plus a grader, not labeled answers. Cost: many samples per prompt. It fits agent tasks with a checkable outcome (A8.5).
- Animate: Sample 4 answers per prompt, grade each, and update. Second: a grader loophole and how the model exploits it.
- Prove it: Diagnose. A model writes confident wrong math. Which method has a checkable reward?
- Src: [T6], [T5], [P10]. UNVERIFIED in notes: provider reinforcement fine-tuning docs; writer must source.

**A11.5 distillation-data: Distillation and Training Data**
- requires: A11.3
- Write: Train a small student on a large teacher's outputs. Why: serving cost follows size (A2.1). DeepSeek-R1 reports reasoning patterns can guide smaller models [T6]. Risks: copy teacher errors, license terms, eval gap on hard cases. build the training set from production traces (A8.9), dedupe it, keep an eval split out, and check the license of teacher outputs.
- Animate: Teacher and student side by side on 5 prompts with growing agreement. Second: quality vs cost frontier plot with points for sizes (illustrative, labeled).
- Prove it: Diagnose. A student matches the teacher on average but fails a rare category. Which eval slice was missing?
- Src: [T6], [P1]

#### A12. Multimodal and Voice

_Five lessons. Voice moves up._

**A12.1 vlms: Vision Encoders and VLMs**
- requires: A1.3, A1.2, A3.5
- Write: An image is cut into patches, encoded, and turned into tokens the model reads. Image tokens cost like text tokens and can be many. Latency and cost grow with resolution. Writer must source encoder and token counts.
- Animate: Image to patches to tokens, with a token counter. Second: resolution vs cost slider.
- Prove it: Ballpark. Cost of 1,000 images at a stated tokens per image.
- Src: [P10]. UNVERIFIED: VLM details.

**A12.2 speech-pipeline: Speech Pipeline and Voice Agent Latency Budget**
- requires: A2.2, A3.2, A3.10, B:02-networking/real-time-transport
- Write: Stages: voice activity detection, speech-to-text, LLM, text-to-speech, network. Naive: run them in sequence. Fix: stream each stage and overlap. Turn-taking and interruption. Budget table with each stage's cost. ElevenLabs budget, P50 / P95 in ms: capture and endpointing 120 / 280, STT final 60 / 150, network 60 / 160, LLM TTFT 250 / 600, TTS first audio 110 / 220, player buffer 80 / 150. Total about 680 ms P50 and 1,560 ms P95. Vendor target: P50 under 800 ms, P95 under 1.5 s. A 700 ms silence threshold adds 700 ms to every turn, so endpointing is a main cost [G6]. LiveKit, Pipecat, and OpenAI Realtime budgets are not sourced.
- Animate: Gantt of sequential vs streamed pipeline; time to first audio. Second: budget builder.
- Prove it: Ballpark. Total time to first audio from five stage latencies.
- Src: [G6], [K2]

**A12.3 diffusion-serving: Diffusion Serving Cost and Latency**
- requires: A2.2, A12.1
- Write: A diffusion model makes an image in many denoising steps; each step is a model pass. Latency = steps x step time. Fewer steps via distillation. Batching and queueing differ from LLMs: fixed-size jobs. Salad benchmark (Stable Diffusion v1.4, 512x512, 50 steps, Aug 2023, vendor): RTX 3060 6.6 s per image, about $191 per 1M images; A100 (AWS) 4.3 s, about $3,333 per 1M (derived); T4 14.9 s [G7]. Cost falls until the GPU is full; cold starts and idle time add cost [G7]. The page's RTX 3090 figures conflict (3.4 s vs 0.25 s); do not use them. SDXL and Flux costs are not sourced.
- Animate: Noise to image over steps; timer per step. Second: steps vs quality vs cost slider.
- Prove it: Ballpark. GPU cost per image at 30 steps and a stated step time.
- Src: [G7], [P5]. UNVERIFIED: SDXL and Flux serving numbers.

**A12.4 video-gen: Video Generation**
- requires: A12.3
- Write: Video adds a time axis: frames multiply cost. Approaches: frame-by-frame, latent video diffusion, cascades. Cost per second of video. Async job model: queue, poll or webhook (backend queue lesson). Writer must source.
- Animate: Frame stack with cost growth. Second: job lifecycle with status polling.
- Prove it: Ballpark. GPU time for 5 s of video at 24 fps with stated per-frame time.
- Src: [P5]. UNVERIFIED.

**A12.5 media-evals: Evals for Generated Media**
- requires: A12.3, A8.4
- Write: No exact answer exists. Metrics: human preference, model-based scores, prompt adherence checks. Safety checks on output (A10). ByteByteGo GenAI covers the cases with little eval depth [P5]. Pairwise preference as the main tool.
- Animate: Pairwise vote UI feeding a leaderboard. Second: judge-human agreement chart.
- Prove it: Diagnose. A new model has a better automatic score and worse user votes.
- Src: [P5], [E2]

### Part: Practice (A13 to A14)

#### A13. Case Studies

_Twelve deep cases, agent- and integration-first. Order is easy to hard and by dependency._

**A13.1 llm-gateway: LLM Gateway**
- requires: A3.8, A3.6, A9.2
- Requirements and quality bar: Multi-tenant gateway in front of many providers. Bar: no tenant starves another; failover within a stated time; spend per team is exact.
- Eval plan: Routing quality by eval gate (A8.4); failover drills; budget accuracy against provider invoices.
- Budgets: Added latency of the gateway (target a few ms). Dollars: blended cost per million tokens by route, with live provider prices from `ai-prices.ts`.
- High-level design: Auth, quotas by team, per-model limits, caching, routing, fallback, logging, budget enforcement, chargeback. Overlap: rate limiting and caching follow the overlap rule (cards to B:07-reliability/rate-limiting and B:05-caching).
- Deep dives: (1) Quota design: token buckets on TPM and RPM, fair share, burst credit. (2) Eval-gated routing and cascades: cheap model first, escalate on low confidence. (3) Provider outage and spend-cap 429s [A10]: fallback order, retry budget, and degraded modes.
- Failure modes and incident drill: Primary provider outage; one team burns the shared quota; cache poisons answers across tenants. Drill: a cost spike at 3 a.m.; find the team and cut it off.
- Staff vs senior: Senior builds a proxy with keys and limits. Staff adds eval-gated routing, per-tenant isolation, exact cost attribution, and a tested failover.
- Drill: Eval platform. Datasets, runners, judges, scoreboards, CI gates, trace import, human labeling queue. Judge validation on 25 to 50 labels per batch [E1]. Regression gates per release. Cost per eval run priced from `ai-prices.ts`. Feedback flywheel integration. Prove it: eval cost per release: cases x judge price x runs. Depends on A8.9, A9.1, A9.6. Src: [E1], [P8], [E2].
- Animate: `DesignBuild`. Second: quota simulator with bursts and token buckets. Drill visual: CI gate showing a regression blocking a release.
- Prove it: Diagnose. One team burns the shared quota. Fix the design.
- Src: [A10], [A5], [E1], [P8], [E2]. No loaded primary source for a named gateway design; writer must source.

**A13.2 chatgpt-assistant: ChatGPT-style Assistant**
- requires: A2.3, A3.2, B:11-breakdowns/chatgpt
- Overlap: Backend `B:11-breakdowns/chatgpt` already teaches the chat app. This case opens with a 3 to 5 sentence summary and a `CrossTrackLink` card, then covers only serving, evals, and cost.
- Requirements and quality bar: Streaming chat with history. Bar: TTFT and TPOT SLOs; answer quality on a golden set; safe-output rate.
- Eval plan: Offline golden set and regression suite; online satisfaction and thumbs; safety rate.
- Budgets: TTFT, tokens per second, history length. Dollars per conversation by formula (A2.4) with live prices from `ai-prices.ts`.
- High-level design: KV cache as conversation state: a miss recomputes the whole chat; GPU RAM is the usual bottleneck [C1]. Scheduling by batch size and KV use [C1]. Routing, safety, memory. 100M weekly users in about a year [C1]. No latency or cost figures are published in the source.
- Deep dives: (1) Session affinity vs cache miss: routing for KV reuse. (2) Memory and history: compaction, summaries, and what to store. (3) Capacity under launch spikes: no spare GPUs, multi-region, graceful degradation [C1].
- Failure modes and incident drill: Cache-miss storm after a deploy; a region loses GPUs. Drill: TTFT doubles for long chats only.
- Staff vs senior: Senior draws the chat flow. Staff prices a conversation, plans KV memory, and defines shed-load behavior.
- Drill: Open-model inference platform. Serve an open model for many apps. Bar: TTFT and TPOT SLO attainment, and quality parity after quantization. Design: router, engine pool (vLLM, SGLang), prefix-aware routing, prefill and decode pools [K7, K8], autoscaling on queue depth and KV use [C1], weights cache, quotas, metrics. Character.AI: about 20,000 QPS, under 1 cent per hour of conversation, at least 33x cost cut since 2022, inter-turn caching named [C2]. Deep dives: capacity plan with goodput; prefix-aware routing vs load balance; cold start and warm pools. The mechanisms are in elective E3 (write as plain text, do not require). Incident: goodput falls while throughput rises. Prove it: GPUs and monthly cost at 20,000 QPS under stated assumptions. Src: [C2], [K7], [K8], [C1].
- Animate: `DesignBuild`. Second: session-affinity vs cache-miss simulator.
- Prove it: Ballpark. KV memory for 10K concurrent 4K-token chats on 70B.
- Src: [C1], [K2], [P5]

**A13.3 enterprise-rag: Enterprise RAG over Company Docs with Permissions**
- requires: A5.9, A5.10, A5.8, A3.3, A3.5, A3.7, A8.3
- Requirements and quality bar: Answers with citations from company docs. Bar: zero permission leaks; retrieval recall and faithfulness above stated pass bars; freshness SLO.
- Eval plan: Retrieval golden set; faithfulness and answer relevance [R15]; leak tests with canary documents; freshness probes.
- Budgets: Latency by stage: embed, search, rerank, generate. Dollars per query with live embedding and model prices from `ai-prices.ts`; index cost and re-embed cost.
- High-level design: Connectors, ACL sync, chunking, hybrid retrieval, rerank, citations. ACL filter with filtered-search limits [R5]. Freshness SLO. Contextual retrieval gains [R8]. Overlap: vector database basics follow the overlap rule (card to B:10-advanced/vector-databases).
- Deep dives: (1) ACL propagation: pre-filter vs post-filter vs per-tenant index, and the leak window after a revoke. (2) Freshness pipeline: change events, re-embed, delete old chunks, and the SLO. (3) Retrieval quality at scale: chunking, hybrid, contextual retrieval, and fixing retrieval before prompts.
- Failure modes and incident drill: Stale ACL leak; deleted doc still answers; connector falls behind. Drill: a manager's doc leaks to an ex-member.
- Staff vs senior: Senior builds a RAG pipeline. Staff owns the ACL consistency model, the freshness SLO, and the retrieval eval, and says what happens on partial failure.
- Drill: Visual and semantic search. Embed images and text into one space. Index with ANN. Filters. Re-rank. Update path for new items. Eval: recall@k on labeled queries. Cost: index memory. Variants: street-view blurring, similar listings, entity linking, defect detection. Prove it: index size for 500M images at 512 dims in PQ. Src: [P4], [R2].
- Drill: Document extraction pipeline (invoices, contracts, forms into typed records). Bar: field-level accuracy per field type, zero silent wrong values on money fields, human-review rate under a cap. Convert pages by text layer, OCR, or page images (A3.5). Extract with structured output (A3.3). Validate in code: sums, dates, cross-field rules. Abstain and route low confidence to review. Golden set sliced by layout, vendor, scan quality (A8.3). Batch for cost (A3.7). Decision: prompt or fine-tune (A11). Failure: an invented value for a missing field; accuracy drops for one vendor after a template change; injected text inside a document (A10.2). Prove it: cost and wall-clock for 2M pages per day at stated tokens per page and a live batch price. Src: [A1], [G11], [G14b], [A10]. Writer must source OCR and layout claims.
- Animate: `DesignBuild`. Second: ACL-change leak window simulator. Drill visual: query-by-image neighbor demo.
- Prove it: Diagnose. A manager's doc leaks to an ex-member.
- Src: [R8], [R5], [R15], [C4], [P4], [R2]. Notion says its AI only surfaces what the user may access (marketing page only). No engineering post on Glean or Notion ACL sync is loaded; writer must source.

**A13.4 support-agent: Customer Support Agent**
- requires: A7.1, A7.3, A13.3
- Requirements and quality bar: Resolve tickets with RAG plus tools plus human handoff. Bar: resolution rate, escalation rate, and wrong-action rate at stated levels.
- Eval plan: Task-level evals on real tickets; wrong-action audits; handoff quality; online resolution and CSAT.
- Budgets: Latency per turn. Dollars per resolved ticket with live model prices; compare with human cost per ticket (writer states the source).
- High-level design: Workflow first, agent only where needed [A5]. Least-privilege tools (refund, order lookup). Handoff policy. Klarna (press release, Feb 2024): 2.3M conversations in the first month, two-thirds of chats, 35+ languages, resolution under 2 min (was 11), work of 700 agents; no architecture detail [G2]. Fin (vendor page): "Procedures" run multi-step actions such as refunds; claims 76% average resolution; other published figures (56%, 38 to 50%) use other definitions, so treat all as unverified [G3]. Airbnb voice support: ASR word error rate 33% to about 10% with a domain phrase list; top-30 vector retrieval, then an LLM reranker; intent detection under 50 ms, retrieval within 60 ms [G13].
- Deep dives: (1) Tool permissions and confirmation for money-moving actions. (2) Injection through ticket text and the lethal trifecta (A10). (3) Handoff policy: when to escalate, and how to measure the cost of a wrong answer.
- Failure modes and incident drill: Injected ticket triggers a refund; the agent loops on a failing tool. Drill: refunds rise 4x in a day.
- Staff vs senior: Senior builds RAG plus tools. Staff defines the action budget, the human path, and the metric that counts wrong actions, not only resolutions.
- Drill: Workflow automation agent (email and ticket triage across SaaS tools). Webhook and poll triggers with dedupe by item id (A3.6). Classify and route as a workflow, not a free agent (A6.2). Per-user OAuth with refresh mid-run (A7.8). Risk tiers: read, reversible write, irreversible write; approval on the last (A7.3). Shadow, then suggest, then auto (A8.8). Failure: a duplicate webhook sends an auto-reply twice. Prove it: cost per day for 50,000 items with a 90% cheap-model share, at live prices.
- Animate: `DesignBuild`. Second: handoff-policy slider vs cost and risk.
- Prove it: Ballpark. Cost per resolved ticket with a stated resolution rate.
- Src: [G2], [G3], [G13], [A5], [S3]

**A13.5 text-to-sql: Text-to-SQL Analytics Agent**
- requires: A5.6, A6.4, A10.4
- Requirements and quality bar: Business users ask questions in plain English over a warehouse with thousands of tables. The agent writes SQL, runs it, and returns a table, a chart, and the SQL. Bar: execution accuracy on a golden set, a near-zero "plausible wrong number" rate, P95 latency in seconds, and a cap on warehouse cost per question. A refusal or a clarifying question is a correct answer when the question is ambiguous.
- Eval plan: Golden set of (question, reference SQL, result) triples mined from real query logs per domain. Score by result-set match, not SQL string match (A8.3). An ambiguity set where the right output is a question back. Public benchmarks only as a reference point: BIRD top test execution accuracy 82.95 vs a human baseline of 92.96 (leaderboard, Sep 2026) [G20]; Spider 2.0 uses enterprise schemas (often over 1,000 columns, queries often over 100 lines) and is far harder than Spider 1.0; re-check its leaderboard before quoting a score [G21]. Uber scores each golden question on intent accuracy, table overlap, runs, returns rows, and LLM similarity to the golden SQL, and warns that about 5% run-to-run change is noise [G19]. Online: share of answers the user accepts, edits, or reruns.
- Budgets: Seconds, not milliseconds. Dollars per question = LLM tokens at live prices from `ai-prices.ts` plus warehouse compute. Staff point: warehouse scan cost can exceed model cost, so a dry run with a bytes-scanned cap runs before every query.
- Core entities and API: Question, Domain (workspace), TableDoc (schema, column descriptions, sample values, sample queries), Metric (semantic-layer definition), CandidateSQL, Execution (bytes scanned, rows, error), Feedback.
- High-level design: Route the question to a domain. Retrieve tables and columns from TableDocs and past queries (A5.5, A5.6). Prune columns to fit the context budget (A4). Few-shot from similar past queries. Prefer the semantic layer: generate against defined metrics ("revenue", "active user") before raw tables. Generate SQL as structured output (A3.3). Static checks: parse, read-only, allowlisted schemas, forced LIMIT. Dry run for cost. Execute under the user's own identity so row-level security applies (A7.8, A5.9). On an error, feed the error back and retry with a cap (generate-verify-fix, A6.4). Show the SQL and a plain-English explanation next to the result. Uber QueryGPT (Sep 2024): intent agent maps the question to curated workspaces (12 system workspaces), a table agent proposes tables the user confirms, a column prune agent cuts tokens, cost, and latency; about 1.2M interactive queries per month on the platform; authoring time about 10 min down to about 3 min; hallucination "not fully solved" [G19]. Snowflake: a verified-query repository skips reasoning for known questions (up to 3x faster), and the SQL model is trained with execution-based rewards [G23].
- Deep dives: (1) Schema retrieval at 10,000 tables: metadata quality is the real bottleneck; column pruning; recall@k of the right tables as its own eval. (2) Correctness: semantic layer vs raw SQL; join-key mistakes that double a sum; ambiguity detection; when to refuse. (3) Safety and cost: user identity not a service account, read-only role, bytes-scanned guard, injection through column comments and data values (A10.2, A10.4).
- Failure modes and incident drill: A query scans 40 TB. A wrong join doubles revenue and nobody notices. A renamed table breaks a domain. Drill: the agent's "weekly active users" disagrees with the official dashboard; find why.
- Staff vs senior: Senior puts the schema and the question in a prompt. Staff builds on the semantic layer, scores by execution, runs as the user, caps scan cost, and treats a confident wrong number as the worst failure.
- Drill: Data analysis agent over CSVs and spreadsheets. The agent writes Python in a sandbox (A7.4) instead of SQL. File upload (A3.5), code execution limits, chart output, and reproducibility. Prove it: sandbox cost per session at a stated CPU-seconds figure.
- Animate: `DesignBuild`. Second: schema-retrieval k slider vs table recall vs prompt tokens.
- Prove it: Ballpark. Tokens to paste a full schema of 2,000 tables x 30 columns x about 15 tokens per column (about 900,000 tokens), so retrieval is required.
- Src: [G19], [G20], [G21], [G23]. Re-check leaderboard numbers before writing; they move.

**A13.6 coding-agent: AI Coding Agent**
- requires: A7.4, A6.7, A9.6, A7.5, A10.3
- Requirements and quality bar: Complete repo tasks end to end. Bar: task pass rate on a repo suite with tests; no writes outside the repo; cost per task within a stated cap.
- Eval plan: Pass rate on a held-out repo suite; trace review; regression gate per prompt or model change.
- Budgets: Wall-clock per task. Dollars per task with live model prices and measured tokens.
- High-level design: Loop: search, edit, run tests, verify [A11]. Agentic search first, semantic search if needed [A11]. Codebase index with Merkle sync [C4]; semantic search gave 12.5% average accuracy gain; time to first query median 7.87 s down to 525 ms with index reuse [C4]. Sandbox for code runs. Subagents keep context small [A11]. Coupled coding tasks suit multi-agent poorly [A6].
- Deep dives: (1) Sandbox and permissions: file, network, and secret boundaries. (2) Context management: search strategy, compaction, subagents. (3) Verification loop: tests as the reward, and handling flaky tests and runaway loops.
- Failure modes and incident drill: Edits outside the repo; infinite fix loop; leaked secret in a log. Drill: pass rate falls after a tool-output size change.
- Staff vs senior: Senior describes the loop. Staff defines sandbox policy, the eval suite, per-task budgets, and the kill switch.
- Drill: Code completion (Copilot, Cursor Tab). Ghost text while typing. Bar: acceptance rate and retention up; latency under a typing-speed deadline. Design: Copilot builds the prompt from code and context; fill-in-the-middle added about 10% relative gain in accepted completions; neighbor tabs about 5%; about 6,000 characters fit; caching keeps context work off the latency path; a contextual filter runs before a model that generates n completions [C3]. Cursor apply reaches about 1000 tokens/s on a 70B fine-tune with deterministic speculation [C5]. Deep dives: context packing under a character budget; speculative decoding (elective E3.4, plain text); cancellation, debouncing, and caching. Incident: acceptance drops after a model upgrade. Prove it: latency budget from keystroke to ghost text. Variant: Smart Compose and search autocomplete (QPS for 50M users at 10 suggestions per minute for 2 hours a day). Src: [C3], [C5], [P5].
- Drill: Code review bot. A PR webhook starts a job (A7.7). Diff plus context by agentic search (A5.8). Linters and tests as tool results. The model proposes findings with evidence; a verifier pass confirms each one (A6.4). Dedupe, rank, cap comments per PR. Bar: comment precision and recall on seeded bugs (A8.4). Repo content is untrusted; read-only permissions (A10.2). Failure: acceptance rate halves after a prompt change. Prove it: cost per PR at a stated diff and context size.
- Drill: Browser and computer-use agent. A task in a web UI with no API. Bar: task success on a suite, no unapproved purchase or submit, cost and time within a cap. Observe (screenshot plus page structure), decide, act, verify, in a sandbox per run (A7.4). Domain allow list; credentials from a scoped vault, never in the prompt; approval before irreversible clicks (A7.3). Eval: end-state checks, repeat each task k times (A8.5), a hostile-page injection suite (A10.2). Failure: a CAPTCHA, an infinite scroll, a hidden instruction, a page redesign that makes the agent buy the wrong item. Prove it: end-to-end success of 30 steps at 98% per step (about 55%). Src: [S2], [S3], [A8], [A6]. Writer must source computer-use docs.
- Animate: `DesignBuild`. Second: agent loop with a failing test and a retry.
- Prove it: Diagnose. The agent edits files outside the repo. Which control?
- Src: [A11], [C4], [A6]

**A13.7 deep-research: Deep Research Agent**
- requires: A7.6, A7.1, A8.4
- Requirements and quality bar: Long-form cited reports. Bar: claim-level citation precision; rubric score above a stated bar; cost per report within a cap.
- Eval plan: Judge on a rubric plus human spot checks; citation check per claim; cost and latency tracking.
- Budgets: Wall-clock with parallel subagents. Dollars per run: token cost about 15x chat [A6], priced with live model prices from `ai-prices.ts`.
- High-level design: Lead plans; 3 to 5 subagents search in parallel; citation subagent checks claims [A6]. Durable state and rainbow deploys [A6]. Limits on tool calls.
- Deep dives: (1) Effort scaling: how many subagents for which query. (2) Durable execution: checkpoints, resume, and rainbow deploys [A6]. (3) Source trust, injection from fetched pages, and citation verification (A10).
- Failure modes and incident drill: 50 subagents for a simple query [A6]; a poisoned page steers the report. Drill: cost per run triples in a week.
- Staff vs senior: Senior draws lead plus subagents. Staff sets effort-scaling rules, a cost cap, resume semantics, and a citation gate.
- Drill: Answer engine (Perplexity-style). Query rewrite, web search, fetch, chunk, rerank, cited answer. Latency budget across fetches. Citation check. Freshness. Source trust and injection from web pages (A10). Eval: citation precision and answer correctness by judge. Perplexity on Vespa (vendor case study): one engine does retrieval, ranking, filtering, real-time indexing, and model inference, which avoids network hops; hybrid keyword, semantic, and structured filters; vector databases could not reliably support even simple boolean filters; passage-level retrieval, then a light ranker, then neural rerank; 780M+ queries per month [G1]. No latency in ms is published. Prove it: budget for 6 parallel fetches with 1.2 s p95 each. Depends on A5.6, A2.5. Src: [G1], [R11], [S2].
- Teardown inside this case (Anthropic multi-agent research system): Lead and 3 to 5 subagents; up to 90% less time; 4x and 15x chat tokens; 90.2% gain over single-agent on an internal eval; tool-testing agent cut task time 40%; checkpoints and rainbow deploys [A6].
- Animate: `DesignBuild`. Second: effort-scaling rule table: query complexity vs subagents. Drill visual: latency Gantt of parallel fetches.
- Prove it: Ballpark. Dollar cost of a run at 15x tokens of a stated chat.
- Src: [A6], [A9], [G1], [R11], [S2]

**A13.8 voice-agent: Voice Agent**
- requires: A12.2, A6.1, A3.10, A12.3, A12.5, A3.7
- Requirements and quality bar: Natural spoken conversation. Bar: P50 time to first audio under 800 ms and P95 under 1.5 s (vendor target [G6]); task success rate; low word error rate.
- Eval plan: Task success; interruption handling; word error rate; latency percentiles from real calls.
- Budgets: Use the ElevenLabs stage budget from A12.2 [G6]. Dollars per call minute from live STT, LLM, and TTS prices in `ai-prices.ts`, plus telephony.
- High-level design: Streamed speech pipeline, turn-taking, barge-in, tool calls without dead air, telephony.
- Deep dives: (1) Endpointing: the silence threshold is a main latency cost [G6]. (2) Barge-in and turn-taking state machine. (3) Tool calls with filler speech, and fallback when a stage fails.
- Failure modes and incident drill: Echo triggers self-interrupt; a slow tool call creates dead air. Drill: P95 doubles on mobile networks.
- Staff vs senior: Senior lists the stages. Staff budgets each stage, tunes endpointing, and plans the fallback path.
- Drill: Text-to-image service. Submit returns a job id; prompt moderation, then a priority queue per tier (A3.7, A7.7); GPU workers keep weights warm and batch jobs of the same resolution; output moderation before storage; signed CDN URLs. Bar: P50 and P95 time to image per tier, preference win rate (A12.5), unsafe-output rate, cost per image. Steps vs latency vs cost (A12.3); few-step distilled models for the fast tier. Anchors: FLUX.1-dev at 1024x1024 about 6.75 s per image at baseline bf16, GPU not named (Modal, Jun 2025) [G22]; Gemini 3.1 Flash Image $0.067 per 1K image, $0.034 batch, as of 2026-10-16 [G24]; put the price in `ai-prices.ts`. Failure: queue backlog after a viral launch; P95 jumps 5x while GPU use stays at 60% because odd resolutions fragment batches. Prove it: GPUs for 20 images per second at a stated per-image time. Src: [G7], [P5], [G22], [G24]. Variants: text-to-video (A12.4), headshots, captioning.
- Drill: Content moderation with LLMs. Cascade: cheap classifier, then LLM, then human review. Class imbalance. Policy as a prompt; policy versioning. Eval: precision and recall per policy class; appeals. LLM only on the uncertain band (priced from `ai-prices.ts`). Failure: adversarial rewording. Discord Osprey (Dec 2025 scale): about 400M actions per day, 204 action types, 2,288 rules, about 500 rules per action; rules are written in a Python-based language and reach workers through etcd with no deploy; outputs go to Kafka and Druid for investigators, and investigation feedback becomes new rules [G8]. Llama Guard (Llama2-7B base) matches or exceeds other moderation tools on two public evals [G10]. OpenAI describes taxonomy-driven classifiers with active learning for rare events [G9]. No latency figures are loaded. Prove it: human reviews per day at a stated pass-through rate. Depends on A8.4, A3.6, A10.5. Src: [G8], [G9], [G10], [P3], [P4].
- Animate: `DesignBuild`. Second: budget Gantt with tool-call filler.
- Prove it: Ballpark. Cost per call minute from stage prices.
- Src: [G6], [K2]

**A13.9 agent-platform: Multi-tenant Agent Platform (MCP Marketplace, Per-tenant Tools and Auth)**
- requires: A7.8, A6.6, A10.4
- Requirements and quality bar: Many tenants build and run agents. The platform offers an MCP marketplace, per-tenant tools and auth, runs, and billing. Bar: zero cross-tenant data access, run success rate, and exact cost attribution.
- Eval plan: Tenant isolation tests with canary data. Per-tenant eval suites (A8.1). Vetting tests for tool servers. Billing reconciled against provider invoices.
- Budgets: Platform latency added per tool call, in ms. Dollars: model cost, tool-server hosting, sandbox time, and margin per tenant. Live prices from `ai-prices.ts`.
- Core entities and API: Tenant, Agent (config version), ToolServer (MCP), Connection (tenant OAuth grant), Run, Quota, UsageLine.
- High-level design: A control plane (agents, versions, tool catalog) and a data plane (run workers). An MCP registry with vetting and version pinning. A tool gateway that enforces per-tenant auth, scopes, rate limits, and audit. A secrets vault. Sandboxes for code tools (A7.4). Durable runs (A7.1) on per-tenant queues (A7.7). Cost metering (A3.9). A model gateway behind it (A13.1).
- Deep dives: (1) Tenant isolation: data, credentials, queues, and caches. No cross-tenant prompt-cache or semantic-cache hits. (2) Marketplace trust: tool-description injection, supply chain, vetting, version pinning, permission review (A10.2, A10.4). (3) Auth for tools: per-tenant OAuth, token refresh, revocation, and the confused deputy (A7.8).
- Failure modes and incident drill: A malicious tool server exfiltrates data. A noisy tenant starves others. A tool update changes behavior. Drill: one tenant's agent reads another tenant's ticket.
- Staff vs senior: Senior builds a runner with a tool list. Staff isolates tenants end to end, vets and pins tools, meters cost exactly, and owns the incident path.
- Drill: Multi-tenant LoRA platform. Many tenants, one base model. Train LoRA adapters [T7]. Serve many adapters on one base: load on demand, batch across adapters. Isolation, data privacy, quotas, evals per tenant, versioned rollouts. Cost: adapter storage and swap time. 175B GPT-3: 10,000x fewer trainable parameters [T7]. Prove it: memory for 500 adapters at 100 MB each. UNVERIFIED: multi-adapter serving; writer must source. Src: [T7], [T8].
- Animate: `DesignBuild`. Second: tenant-isolation map with a leak path. Drill visual: adapter cache hit rate vs swap latency.
- Prove it: Diagnose. One tenant's agent reads another tenant's ticket. Find the shared layer.
- Src: [A8], [A9], [S1], [S3], [A6], [T7], [T8]. UNVERIFIED in notes: no loaded primary source for a named agent platform or MCP marketplace. Writer must source.

#### A14. In the Wild

_Six teardowns, each with a loaded primary source. Agent teardowns only where the notes hold the page._

**A14.1 characterai-inference: Character.AI Inference**
- requires: A13.2
- Write: About 20,000 QPS; under 1 cent per hour of conversation; at least 33x cost cut since 2022; inter-turn caching [C2]. The loaded page does not list MQA or int8; say "secondary reports" if used.
- Animate: Before and after cost bars. Second: inter-turn cache hit simulator.
- Prove it: Ballpark. Cost per million conversation hours.
- Src: [C2]

**A14.2 cursor: Cursor Codebase Indexing and Instant Apply**
- requires: A5.8, A5.9, A2.2, A13.6
- Write: Indexing: Merkle tree sync; 50,000 files about 3.2 MB of names and hashes; embeddings cached by chunk content; shared index via simhash with 92% average clone similarity; content proofs (the page says "content proofs"); first query median 7.87 s to 525 ms and p99 4.03 h to 21 s [C4].
  Apply: Full-file rewrite with deterministic speculation; about 1000 tokens/s on a 70B fine-tune; about 9x over the earlier GPT-4 speculative-edits setup; served on Fireworks [C5].
- Animate: Merkle sync step-through. Second: index-reuse before and after timeline. Then: Speculation accepting copied lines. Second: tokens/s bar compare.
- Prove it: Diagnose. What leaks if the proof is skipped? Second: Ballpark. Time to rewrite a 400-line file.
- Src: [C4], [C5]
- Note: speculative decoding is elective E3.4. Name it as plain text; do not require it.

**A14.3 perplexity-vespa: Perplexity on Vespa**
- requires: A5.6, A13.7
- Write: Vendor case study; label company claim vs our reading. One serving engine for retrieval, ranking, filtering, real-time indexing, and inference. Hybrid retrieval; passage-level retrieval; light ranker then neural rerank; 780M+ queries per month, 20%+ monthly growth. Boolean-filter limits of vector databases. The web index later moved to an internal system [G1].
- Animate: Before and after: separate stores vs one engine, with network hops counted. Second: multi-stage ranking funnel.
- Prove it: Diagnose. Which hops disappear when inference runs inside the serving layer?
- Src: [G1]

**A14.4 linkedin-genai: LinkedIn GenAI Product**
- requires: A8.1, A3.3
- Write: 80% of the target in month one, four more months to pass 95%. Three-tier eval. Small model for routing and retrieval, larger model for generation. Internal APIs wrapped as skills with LLM-friendly schemas. Parser fix: errors about 10% to about 0.01%. Inter-token latency math [G14b].
- Animate: Eval-tier timeline with feedback delay. Second: parser error before and after.
- Prove it: Ballpark. Added seconds for +10 ms per token over 200 tokens (2 s).
- Src: [G14b]

**A14.5 claude-agent-sdk: Claude Agent SDK: The Agent Loop**
- requires: A6.1, A6.9
- Write: Label each item "company claim" or "our reading". Claim: the loop is gather context, act, verify, repeat [A11]. The post names agentic search (file tools such as grep) before semantic search, subagents to keep context small, compaction near the limit, and three ways to verify: rules, visual feedback, and an LLM judge, which it calls "not very robust" [A11]. Our reading: map each part to a lesson (A6.1, A6.9, A6.10, A4.4, A6.4). No latency or cost figures are published in the loaded page.
- Animate: The loop with each stage expanded to its tools. Second: before and after for a task with and without a verify step.
- Prove it: Diagnose. An agent declares done without running tests. Which stage of the loop was skipped?
- Src: [A11]

**A14.6 shopify-sidekick: Shopify Sidekick**
- requires: A6.5, A8.4, A4.5
- Write: Label each item "company claim" or "our reading". Claims [G12]: tool tiers: 0 to 20 tools are easy to debug, 20 to 50 blur, 50+ are hard to reason about. Just-in-time instructions come back with tool data, which keeps prompts cache-friendly. Judge agreement (kappa) ranged from 0.02 to 0.61 against a human baseline of 0.69. Our reading: map to tool design (A6.5), judges (A8.4), and cache-friendly layout (A4.5).
- Animate: Tool count vs debuggability. Second: judge kappa by criterion.
- Prove it: Diagnose. An agent with 70 tools picks wrong ones. Which fixes does the post suggest?
- Src: [G12]

### Part: Electives (optional) (E1 to E3)

#### E1. Classic ML Systems

_Optional. For ML infrastructure roles. The old classic ML module, three classic cases, and the sourced teardown._

**E1.1 problem-framing: From Business Goal to ML Objective**
- requires: A0.2
- Write: A product goal is not a loss function. Map one to the other: goal, metric, label, model task. Proxy metrics and how they drift from the goal. Rule 1 and Rule 3: launch without ML if you can, then add ML when you have data [M1]. DMLS ch 2 framing [P2].
- Animate: Chain builder: pick a goal (watch time, clicks, fraud loss) and see label, metric, and failure of the proxy. Second: example where click-through rises and satisfaction falls.
- Prove it: Diagnose. Team optimizes clicks; session time falls. Name the proxy gap.
- Src: [M1], [P2], [P7]

**E1.2 data-labels: Data and Labels**
- requires: E1.1
- Write: Where labels come from: explicit, implicit, human, programmatic. Sampling, class imbalance (fraud is about 1 in 1,000 payments [C8]), label delay, selection bias. Naive random split leaks time. Split by time.
- Animate: Timeline showing label delay and a leaky split. Second: imbalance simulator; accuracy of "always no fraud" is 99.9%.
- Prove it: Diagnose. Model has 99.9% accuracy and catches no fraud.
- Src: [C8], [P2], [M1]

**E1.3 features-store: Features and Feature Stores**
- requires: E1.2, B:05-caching/cache-strategies
- Write: A feature is an input computed from raw data. Offline store for training, online store for low-latency serving. One definition for both (Michelangelo: about 10,000 shared features, one DSL [C6]; online features in Cassandra). Point-in-time joins stop leakage.
- Animate: Feature pipeline from batch and stream into offline and online stores. Second: toggle on a point-in-time join and watch leakage disappear.
- Prove it: Ballpark. Online store size for 100M users x 50 features x 8 bytes.
- Src: [C6], [M1]

**E1.4 training-serving-skew: Training-Serving Skew**
- requires: E1.3
- Write: Same model, different features in training and in production. Three causes: different code, different data, joined tables that change. Fixes: log serving features and train on logs (Rule 29), reuse code (Rule 32), measure three gaps (Rule 37) [M1].
- Animate: Two pipelines side by side with a diverging value; step to the detection point. Second: skew dashboard with three gap bars.
- Prove it: Diagnose. Offline AUC is high; online is poor. Which gap is wide?
- Src: [M1], [C6]

**E1.5 retrieval-ranking: Two-Tower Retrieval and the Ranking Cascade**
- requires: E1.3, A1.2, B:10-advanced/vector-databases
- Write: Scoring all items for each user is too slow. Stage 1: candidate generation with two towers (user and item encoders, scored by dot product), via ANN. Stage 2: a heavier ranker on hundreds of items. Stage 3: re-rank for policy and diversity. YouTube uses candidate generation followed by ranking [M2]. The same fast-then-precise cascade appears in RAG [R11].
- Animate: Funnel from millions to ~1,000 to ~100 to ~10, with latency per stage. Second: two-tower diagram; change an item and see which stage recomputes.
- Prove it: Ballpark. Latency budget of 100 ms split across stages.
- Src: [M2], [R11], [C6]

**E1.6 offline-online-metrics: Offline and Online Metrics**
- requires: E1.1, E1.5
- Write: Offline: AUC, precision@k, NDCG, calibration. Online: clicks, watch time, revenue, guardrail metrics. Why offline gains often fail online: the log is biased by the old model. Monitor feature coverage (Rule 10) [M1].
- Animate: Confusion matrix with a threshold slider. Second: offline vs online scatter showing weak correlation.
- Prove it: Diagnose. AUC up 2%, revenue flat.
- Src: [M1], [P2]

**E1.7 drift-monitoring: Drift and Model Aging**
- requires: E1.4, E1.6, B:07-reliability/observability
- Write: Input drift, label drift, concept drift. Know how fast your model ages (Rule 8) [M1]. Retraining schedule from a measured decay curve. Alert on feature statistics, not only on model output.
- Animate: Metric decays over weeks; retrain resets it. Second: feature histogram overlay of train vs live.
- Prove it: Diagnose. Coverage of one feature falls from 98% to 60% overnight.
- Src: [M1], [P2]

**E1.8 ab-testing-models: A/B Testing Models**
- requires: E1.6
- Write: Randomize by user. Pick one primary metric and guardrails. Sample size from effect size and variance. Novelty effect. Interleaving for ranking. Shadow mode first, then canary, then ramp. Writer must verify power formulas and quote one primary source.
- Animate: Two-arm test with live p-value and confidence interval as users arrive. Second: ramp plan 1%, 5%, 25%, 100% with guardrail gates.
- Prove it: Ballpark. Users needed to detect a 1% lift on a 5% base rate (writer derives).
- Src: [P2], [P7]. UNVERIFIED in notes: writer must source.

**E1.9 online-learning: Online and Continual Learning**
- requires: E1.7, B:06-async/pubsub-logs
- Write: Daily retrain is too slow for fast-changing items. Monolith: push touched sparse keys to serving every minute; sync dense parameters daily [C7]. Collisionless embedding table with cuckoo hashing and expiring IDs. Example: 100,000 IDs at 1024 dims is about 400 MB per minute [C7]. Risk: feedback loops and bad data poisoning.
- Animate: Sparse update stream from trainer to servers; a daily dense sync pulse. Second: bandwidth calculator for update size vs ID count.
- Prove it: Ballpark. Per-minute sync size for 250,000 IDs at 512 dims in float32.
- Src: [C7], [P2]

**E1.10 video-recommendation: Capstone: Video Recommendation Feed**
- requires: E1.5, E1.8, B:11-breakdowns/youtube
- Requirements and quality bar: Goal is long-term satisfaction, not clicks. Bar: watch time up with a satisfaction survey and a 28-day retention guardrail not down.
- Eval plan: Offline: candidate recall@k, NDCG, calibration. Online: A/B with a long-term holdout. Guardrails: diversity, creator reach, complaints.
- Budgets: Latency by stage (candidates, ranker, re-rank) from the E1.5 funnel. Dollars: ranker QPS, embedding refresh job, GPU price from `ai-prices.ts`.
- High-level design: Two-stage design from [M2]. PinnerFormer: a user embedding from an action sequence, refreshed daily in batch, trained to predict long-term engagement; the abstract reports retention gains without figures [G4]. Re-rank for policy and diversity.
- Deep dives: (1) Two-tower candidates, ANN index, and embedding refresh lag. (2) Multi-objective ranking: watch time, satisfaction, long-term retention; exploration and cold start. (3) Feedback loops and long-term metrics: how the log is biased by the old model, and a holdout design.
- Failure modes and incident drill: Popularity collapse; failed batch leaves stale embeddings. Drill: CTR is up and 28-day retention is down. Find the cause.
- Staff vs senior: Senior names the funnel and the metric. Staff names the proxy gap, the holdout, the exploration budget, and the rollback gate.
- Drill: Search ranking. Query understanding, retrieval, learning-to-rank, re-ranking; position bias in click logs; NDCG offline and interleaving online; latency budget by stage for a 200 ms search. Src: [P6], [P7], [M2].
- Drill: People You May Know. Graph candidates (friends of friends), then ranking; privacy and fairness limits; cold start; accept rate and hide feedback. Prove it: a user is shown an ex-partner; name the missing control. Src: [P4], [P6].
- Animate: `DesignBuild`. Second: exploration-rate slider vs long-term metric. Drill visuals: position-bias click curves; candidate-count explosion by hop.
- Prove it: Ballpark. Ranker QPS for 100M daily users at 20 feeds per session.
- Src: [M2], [G4], [P4], [P3], [P6], [P7]

**E1.11 ad-click-prediction: Capstone: Ad Click Prediction**
- requires: E1.6, E1.9, B:11-breakdowns/ad-click-aggregator
- Requirements and quality bar: Predict click probability for auction ranking. The number sets prices, so calibration matters more than AUC. Bar: logloss and calibration error within a stated band per segment.
- Eval plan: Offline logloss and calibration; online revenue with advertiser guardrails.
- Budgets: Auction latency budget split by stage. Dollars: serving cost per 1,000 auctions with the live GPU or CPU price.
- High-level design: Features, labels with delay, imbalance. Monolith online learning [C7]. DLRM shape: embedding tables for sparse features, a bottom MLP for dense features, pairwise dot-product interaction, a top MLP, sigmoid; tables use model parallelism, MLPs data parallelism, with an all-to-all exchange [G5].
- Deep dives: (1) Calibration under delayed labels and class imbalance. (2) Sparse embedding tables: sharding, minute-level sync, memory [C7]. (3) Feature store reads at auction QPS and training-serving skew (E1.4).
- Failure modes and incident drill: Miscalibrated model overcharges advertisers; a feature outage. Drill: revenue drops 3% after a deploy with no AUC change.
- Staff vs senior: Senior says "train a DLRM". Staff says why calibration is the product, how delayed labels bias it, and how to roll back safely.
- Drill: ETA prediction. Regression with a skewed error cost (late is worse than early); features: route, traffic, time, restaurant prep; quantile loss; MAE and late-rate; A/B by region. Prove it: MAE improves and complaints rise; explain. Src: [P7], [P6].
- Drill: Dynamic pricing as a variant of ETA plus CTR (calibrated demand, guardrails on fairness).
- Animate: `DesignBuild`. Second: calibration plot with a slider for bias. Drill visual: error distribution with an asymmetric loss slider.
- Prove it: Ballpark. QPS and feature-store reads for 50K auctions per second.
- Src: [C7], [G5], [P4], [P7], [P6]

**E1.12 fraud-detection: Capstone: Fraud Detection**
- requires: E1.2, E1.4, E1.8
- Requirements and quality bar: Score each payment in real time. Bar: recall at a fixed false-positive rate, and a decision under 100 ms.
- Eval plan: Recall at a fixed false-positive rate; delayed labels (chargebacks); shadow mode then canary.
- Budgets: Latency under 100 ms with stage split. Dollars: cost of a false block vs a missed fraud; serving cost per million scores with the live compute price.
- High-level design: Stripe Radar: 1,000+ characteristics in under 100 ms; fraud about 1 in 1,000 payments; about 0.1% of legitimate payments blocked [C8]. DNN-only model cut training time over 85%; dropping XGBoost outright would have cost about 1.5% recall [C8]. 10x more data gave significant gains [C8].
- Deep dives: (1) Label delay and imbalance: how to train and evaluate when truth arrives in weeks. (2) Model choice and the explainability trade-off; reason codes for declines. (3) Adversarial drift: fraudsters adapt; retrain cadence and a rules layer for fast response.
- Failure modes and incident drill: Feature outage fails open or closed; a wave of new fraud. Drill: block rate doubles after a feature-pipeline change.
- Staff vs senior: Senior picks a model and a threshold. Staff sets the threshold from the cost of both errors, owns the label-delay plan, and defines the fail-open policy.
- Drill: Bot detection, and spam and phishing detection, as variants of the cascade in the moderation drill (A13.8).
- Animate: `DesignBuild`. Second: threshold slider with the cost of a false block vs a miss.
- Prove it: Ballpark. Blocked good payments per day at 0.1% of 5M payments.
- Src: [C8], [P6]
- Note: the content moderation drill moved to the text-to-image case (A13.8).

**E1.13 michelangelo-monolith-radar: Teardown: Michelangelo, Monolith, and Radar**
- requires: E1.9, E1.12
- Write: Three classic ML systems. Uber: six stages, about 10,000 features, P95 under 5 ms without Cassandra and under 10 ms with, over 250,000 predictions per second [C6]. Monolith: minute-level sparse sync, 14.03% to 18.08% online AUC gain in a live ads A/B [C7]. Radar: under 100 ms, 1,000+ characteristics [C8].
- Animate: Three-column before and after. Second: latency budget bar compare.
- Prove it: Ballpark. Feature-store reads per second at 250,000 predictions.
- Src: [C6], [C7], [C8]

#### E2. Training at Scale

_Optional. For ML infrastructure roles. Post-training lessons moved to A11._

**E2.1 data-pipelines: Data Pipelines and Data Quality**
- requires: A1.7, B:06-async/pubsub-logs
- Write: Model quality follows data quality. Stages: collect, filter, deduplicate, mix, synthesize (CS336 data lectures [P10]). Why dedup matters: benchmark examples were found inside C4 [E3]. Why filters need evals of their own.
- Animate: Funnel of tokens dropping per stage with example discarded docs. Second: dedup demo with near-duplicate pairs (simhash intuition).
- Prove it: Diagnose. Eval score jumps after a new crawl; test set leaked.
- Src: [P10], [E3]

**E2.2 memory-per-parameter: Memory Per Parameter**
- requires: A2.1
- Write: Adam with mixed precision: fp16 weights 2 + grads 2 + fp32 master 4 + momentum 4 + variance 4 = 16 bytes per parameter [T3]. 70B needs 1.12 TB before activations. 405B needs 6.5 TB (derived). Why one GPU cannot train it. Activation checkpointing trades one extra forward pass for memory (writer must verify).
- Animate: Stacked bar of 16 bytes by component, per model size, against GPU count. Second: step-through of one training step with memory peaks.
- Prove it: Ballpark. GPUs needed just for states of a 70B model.
- Src: [T3], [P15]

**E2.3 data-parallel-zero: Data Parallelism, ZeRO, and FSDP**
- requires: E2.2
- Write: Copy the model, split the batch, average gradients. Waste: each copy holds all 16 bytes. ZeRO shards optimizer state (about 4x less), then gradients (about 8x), then parameters (16/Nd bytes) [T3]. Example: 7.5B parameters, 64 GPUs: 120 GB, 31.4, 16.6, 1.9 GB per device [T3]. Cost: more communication.
- Animate: Four GPUs holding shards; step through ZeRO 1, 2, 3 with memory bars. Second: stage selector with a memory calculator.
- Prove it: Ballpark. Per-GPU model-state memory for 70B on 128 GPUs under ZeRO-3.
- Src: [T3], [P15]

**E2.4 model-parallelism: Tensor, Pipeline, Sequence, and Expert Parallelism**
- requires: E2.3, A2.7
- Write: A model too big for one GPU must be split. Tensor: split matrices, needs NVLink. Pipeline: split layers into stages, with bubble overhead. Sequence or context: split long inputs. Expert: split MoE experts. Llama 3 405B on 16,384 GPUs: TP 8, CP 1, PP 16, DP 128 [T2]. Megatron: 1T model on 3,072 GPUs at 52% of peak [T4]. links inside a node and between nodes. NVLink 900 GB/s on H100 [H1]; 1.8 TB/s bidirectional per Blackwell GPU [H3]. InfiniBand ports run up to 400 Gb/s, which is 50 GB/s (derived) [H3]. This is why tensor parallelism stays inside a node.
- Animate: Grid of GPUs colored by TP, PP, DP group; step through one micro-batch. Second: pipeline timeline showing the bubble; slider for micro-batch count.
- Prove it: Diagnose. TP degree 16 across two nodes, throughput collapses. Why?
- Src: [T2], [T4], [P15]

**E2.5 mixed-precision-checkpoints: Mixed Precision and Checkpointing**
- requires: E2.2, A2.2
- Write: BF16 and FP8 cut bytes and raise FLOP rate. H100 FP8 is 2x BF16 [H1]. Why master weights stay fp32. Checkpoints: what to save, how often, async write. Cost of a checkpoint against cost of lost work.
- Animate: Training timeline with checkpoint markers and a crash; lost work shown. Second: calculator for the optimal checkpoint interval (writer derives and states the model).
- Prove it: Ballpark. Checkpoint every 30 min with one failure per 3 hours: expected lost work.
- Src: [H1], [T2], [T3]

**E2.6 failures-at-scale: Failures at Scale**
- requires: E2.4, B:07-reliability/failure-modes
- Write: At 16K GPUs failure is routine. Llama 3 405B, 54 days: 466 interruptions, 419 unexpected, about 8.6 per day (derived). GPU faults 30.1%, HBM3 17.2%, network 8.4%, software 12.9% of unexpected [T2]. Effective training time above 90% [T2]. Design for restart: fast detect, spare nodes, fast checkpoint load.
- Animate: Job timeline with interruptions colored by cause. Second: Poisson simulator of cluster size vs mean time between failures (writer states the per-GPU rate assumption).
- Prove it: Diagnose. Throughput drops every few hours; which logs and metrics help?
- Src: [T2]

**E2.7 llama3-reliability: Teardown: Llama 3 Training Reliability**
- requires: E2.6, E2.4
- Write: 16K H100s, 54 days, 466 interruptions, 47 planned, 419 unexpected; 58.7% GPU-related; MFU 41% at TP 8, PP 16, DP 128; 38% for 131K context with CP 16; total compute 3.8e25 FLOPs [T2].
- Animate: Interruption timeline with cause split. Second: 4D layout grid.
- Prove it: Ballpark. Effective-training-time loss for a stated recovery time.
- Src: [T2]

#### E3. Inference Systems Deep Dive

_Optional. For inference and platform roles. The mechanisms behind the A2 numbers._

**E3.1 continuous-batching: Continuous Batching Internals**
- requires: A2.4
- Write: One request at batch 1 leaves the GPU idle, because decode is memory-bound. Static batching waits for the slowest request. Continuous batching schedules per step: finished requests leave, new ones join [K5]. Orca: 36.9x over FasterTransformer at equal latency on GPT-3 175B [K5]. Databricks: continuous batching gives 10x to 20x over dynamic batching; at low load dynamic can win [K2]. Link to the queue lesson: this is a queue with a per-step scheduler.
- Animate: Timeline of static vs continuous batching with 6 requests of different lengths. Second: load slider; throughput and latency curves.
- Prove it: Diagnose. Short requests wait behind a 4,000-token request. Which scheduler fixes it?
- Src: [K5], [K2]

**E3.2 paged-attention: PagedAttention**
- requires: A2.3, B:01-one-machine/request-journey
- Write: Naive serving reserves a max-length block per request. Existing systems waste 60% to 80% of KV memory through fragmentation and over-reservation [K3]. PagedAttention splits KV into fixed blocks mapped by a block table, like virtual memory. Waste falls under 4% [K3]. Copy-on-write saves up to 55% for parallel sampling [K3]. Throughput is 2x to 4x over FasterTransformer and Orca [K4].
- Animate: Block table with logical to physical mapping as tokens arrive; two sequences share a prefix block. Second: memory waste bars for contiguous vs paged.
- Prove it: Ballpark. If 70% of KV memory is wasted, how many more concurrent requests fit when waste drops to 4%?
- Src: [K3], [K4]

**E3.3 flash-attention: FlashAttention**
- requires: A2.3, A2.1
- Write: Standard attention writes a large score matrix to HBM and reads it back. HBM is slow, SRAM is fast. FlashAttention tiles the work in SRAM so the big matrix never lands in HBM [K10]. Speedups: 3x on GPT-2 at 1K; 2.4x on Long Range Arena [K10]. It is exact, not approximate. It is an IO fix, not a FLOPs fix.
- Animate: Tiles of Q, K, V stream through SRAM; HBM traffic counter compares naive and tiled. Second: sequence-length slider vs HBM bytes.
- Prove it: Diagnose. A custom attention kernel is slow although FLOPs are low. Which resource?
- Src: [K10]

**E3.4 speculative-decoding: Speculative Decoding**
- requires: A2.2, E3.1
- Write: Decode is memory-bound, so checking 5 tokens costs about the same as making 1. A small draft model proposes tokens; the large model verifies them in one pass; the output distribution stays the same [K9]. T5-XXL gained 2x to 3x [K9]. Gain depends on acceptance rate. Cursor uses a deterministic speculation from the existing file for edits and reaches about 1000 tokens/s on a 70B fine-tune [C5].
- Animate: Draft proposes 5 tokens; verifier accepts 3, rejects at 4; step through. Second: acceptance-rate slider vs speedup.
- Prove it: Ballpark. Expected tokens per large-model pass at acceptance 0.7 and 5 drafted (writer derives).
- Src: [K9], [C5]

**E3.5 disaggregation: Prefill and Decode Disaggregation**
- requires: E3.1
- Write: Prefill and decode on the same GPU interfere. A long prefill stalls decode and breaks TPOT. Chunked prefill mixes a chunk per batch (decode up to 10x in one test) [K6]. Disaggregation puts each phase on its own machines. DistServe: 7.4x more requests, or 12.6x tighter SLOs [K7]. Splitwise: 1.4x throughput at 20% less cost, or 2.35x at equal cost [K8]. Price: KV transfer between machines.
- Animate: Mixed batch where prefill blocks decode, then split pools with an arrow carrying KV. Second: goodput chart against TTFT and TPOT SLOs.
- Prove it: Ballpark. KV transfer time for 2.5 GiB over a 50 GB/s link (about 50 ms).
- Src: [K6], [K7], [K8]

**E3.6 parallelism-moe: Parallelism and MoE for Inference**
- requires: E2.4, A2.6
- Write: Tensor parallelism cuts latency but sub-linearly: Llama2-70B from 4 to 8 GPUs cut latency only 0.7x [K2]. Pipeline raises throughput. MoE: all experts in memory, a few active per token; expert parallelism adds all-to-all traffic (writer must verify) [K13]. When to replicate instead of shard.
- Animate: A model split over 2, 4, 8 GPUs with comm time added to each step. Second: MoE router sending tokens to experts, with a hot expert.
- Prove it: Diagnose. One expert is hot and the step time follows it. What fixes it?
- Src: [K2], [K13]

**E3.7 serving-engines: Serving Engines and Metrics**
- requires: E3.2, A2.5, E3.5
- Write: vLLM, SGLang, TensorRT-LLM, TGI: what each optimizes (writer must verify from primary docs; only SGLang's claims are loaded [K14]). Metrics: TTFT, TPOT, throughput, goodput, MBU [K2, K7]. TPOT 100 ms is 10 tokens/s per user [K2]. Goodput is the rate that meets both SLOs [K7]. MBU example: 7B at 16-bit, 14 ms TPOT, 2 TB/s gives 50% [K2].
- Animate: Request trace with TTFT and TPOT marks. Second: load test simulator; throughput rises, goodput falls past a knee.
- Prove it: Diagnose. Throughput is at a record, users complain. Which metric did the team miss?
- Src: [K2], [K7], [K14]

**E3.8 gpu-autoscaling: GPU Autoscaling, Capacity, and Cold Start**
- requires: E3.7, B:02-networking/load-balancing, A2.7
- Write: CPU autoscaling reacts in seconds. A GPU pod must load tens to hundreds of GB of weights first. Naive autoscaler on request rate lags the spike. ChatGPT had no spare GPUs to autoscale into and used multiple regions and clusters [C1]. Scale on queue depth and KV utilization, not GPU utilization [C1]. Load time = bytes / disk or network speed (derived). Warm pools, weight caching, and cost of idle GPUs. Inputs: requests per second, tokens in and out, SLOs, model size. Throughput per GPU from a load test, as goodput [K7]. Headroom for peaks and failures. Reserved vs on-demand vs spot. ChatGPT used batch size and KV utilization as the key metrics [C1]. Show the full worked plan.
- Animate: Traffic spike vs pod start timeline with a cold-start gap. Second: simulator with warm-pool size vs dropped requests vs $ per hour. Also: Demand curve vs capacity steps. Second: planner with sliders; output GPU count and $ per month.
- Prove it: Ballpark. Load time of 140 GB at 2 GB/s (70 s). Also: Ballpark. GPUs for 200 req/s, 600 output tokens each, 2,000 tokens/s per GPU (60 GPUs before headroom).
- Src: [C1], [K2], [K7]

---

## 4. Interview question bank

The notes list 26 prompts in `1-platforms.md` section (c), 11 more in `4-case-studies.md` (source [C9]), and 32 in `5-case-gaps.md`. Each maps to a deep case (12 in A13), an elective capstone (E1.10 to E1.12), or a lesson. "Drill" means a variant exercise inside a case, not a lesson. "Variant" means a small change of a case or drill. Classic ML prompts map to elective E1. Rows 49 to 53 are agent prompts added on 2026-10-16.

| # | Prompt (source) | Case |
|---|---|---|
| 1 | Visual search (ByteByteGo, Grokking) | Drill in A13.3 |
| 2 | Street View face and plate blurring (ByteByteGo) | Variant of the A13.3 drill plus the A13.8 moderation drill |
| 3 | YouTube video search (ByteByteGo) | Variant of the A13.3 drill and the E1.10 search drill |
| 4 | Harmful content detection (ByteByteGo, Grokking, Hello Interview) | Drill in A13.8 (content moderation) |
| 5 | Video recommendation (ByteByteGo, Educative, Hello Interview) | E1.10 |
| 6 | Event recommendation (ByteByteGo) | Variant of E1.10 |
| 7 | Ad click prediction (ByteByteGo, Educative, Grokking) | E1.11 |
| 8 | Similar vacation-rental listings (ByteByteGo) | Variant of the A13.3 drill |
| 9 | Personalized news feed (ByteByteGo, Grokking, Educative) | Variant of E1.10 and its search drill |
| 10 | People You May Know (ByteByteGo, Grokking) | Drill in E1.10 |
| 11 | Rental search ranking (Educative, Grokking) | Drill in E1.10 (search ranking) |
| 12 | Food-delivery ETA (Educative, Grokking) | Drill in E1.11 |
| 13 | Bot detection (Hello Interview) | Variant of E1.12 |
| 14 | Fraud detection (Grokking) | E1.12 |
| 15 | Dynamic pricing (Grokking) | Variant in E1.11 (ETA and CTR drills) |
| 16 | Entity linking (Grokking) | Variant of the A13.3 drill |
| 17 | Self-driving image segmentation (Grokking) | Out of scope. A12.1 covers the basics |
| 18 | Movie or show recommendation (Grokking) | Variant of E1.10 |
| 19 | Gmail Smart Compose (ByteByteGo) | Drill in A13.6 |
| 20 | Google Translate-style system (ByteByteGo) | Variant of the A13.6 drill |
| 21 | ChatGPT-style assistant (ByteByteGo, Hello Interview) | A13.2 |
| 22 | RAG system design (ByteByteGo, Aminian) | A13.3 |
| 23 | Text-to-image, text-to-video, headshots (ByteByteGo) | A13.8, A12.3, A12.4 |
| 24 | LLM inference system design (calm.rocks) | Drill in A13.2 (open-model inference platform), A2.1 to A2.7, E3.1 to E3.8 |
| 25 | Ask-the-web and deep-research agents (Aminian) | A13.7 (includes the answer-engine drill) |
| 26 | Agent vs fixed pipeline; PAIR red-team loop (calm.rocks) | A6.2, A10.6 |
| 27 | YouTube recommendations (C9) | E1.10 |
| 28 | Instagram feed ranking (C9) | Variant of E1.10 |
| 29 | Search autocomplete (C9) | Variant of the A13.6 drill |
| 30 | Design ChatGPT (C9) | A13.2 |
| 31 | Coding assistant (C9) | A13.6 (with the code-completion drill) |
| 32 | Assistant over company documents (C9) | A13.3 |
| 33 | Where would you add AI to our e-commerce platform (C9) | A0.4, A0.2 |
| 34 | Support ticket overload (C9) | A13.4 |
| 35 | Agent that books travel (C9) | A7.3, A13.4, A13.6 |
| 36 | Model takes actions for a user (C9) | A7.4, A10.4 |
| 37 | "Our RAG is slow and wrong, fix it" (C9) | A5.10, A9.1 |
| 38 | LLM gateway (not in notes; added by this plan) | A13.1 |
| 39 | Eval platform, multi-tenant LoRA platform (added by this plan) | Drills in A13.1 and A13.9 |
| 40 | Image captioning, realistic face generation, high-resolution synthesis, headshot generation (ByteByteGo GenAI intro [G15]) | Variants in A13.8, A12.1, A12.3 |
| 41 | Design an agent harness and evaluation system (Prachub [G16]) | A6.1, A8.5, A13.1 (eval-platform drill) |
| 42 | Scalable and safe agentic system (Prachub [G16]) | A7.4, A7.3, A10.4 |
| 43 | E-commerce search ranking (Analytics Vidhya [G17]) | Drill in E1.10 (search ranking) |
| 44 | Spam and phishing detection (G17) | Variant of the A13.8 moderation drill and E1.12 |
| 45 | Visual defect detection (G17) | Variant of the A13.3 drill, A12.1 |
| 46 | Demand forecasting (G17) | Out of scope as a case. E1.1 to E1.7 cover the method |
| 47 | End-to-end ML system; real-time feature store (Prachub ML [G18]) | E1.1 to E1.9; E1.3, E1.9, E1.13 |
| 48 | Short-video, food-delivery, generic recommender; ranking service; personalized feed (G18) | E1.10, E1.11 (ETA drill) |
| 49 | Document extraction pipeline (added 2026-10-16) | A13.3 |
| 50 | Email or ticket triage agent with SaaS integrations (added 2026-10-16) | Drill in A13.4 |
| 51 | Code review bot (added 2026-10-16) | Drill in A13.6 |
| 54 | Text-to-SQL analytics agent (added 2026-10-19) | A13.5 |
| 52 | Browser or computer-use agent (added 2026-10-16) | A13.6 |
| 53 | Multi-tenant agent platform, MCP marketplace (added 2026-10-16) | A13.9 |

Merged lists: the 32 prompts in `5-case-gaps.md` section 13 (ByteByteGo GenAI intro, Prachub GenAI, Analytics Vidhya, Prachub ML). Duplicates of rows 1 to 39 were dropped: Smart Compose, Translate, ChatGPT, RAG, text-to-image, text-to-video, enterprise support agent, RAG with evaluation, enterprise RAG agent, feed ranking, ads CTR, fraud, ETA, dynamic pricing, RAG support assistant.

Answer structure from C9: confirm depth, clarify requirements and metrics, cover data and serving, finish with evaluation, feedback, and risks. A0.2 extends it with budgets. Each deep case adds a "staff answer vs senior answer" box.

---

## 5. Site integration

### What exists now

- `src/lib/syllabus.ts`: one array `syllabus: ModuleOutline[]` (13 modules). `buildSyllabus(written)` assigns numbers `${moduleIndex}.${lessonIndex+1}`, then checks that each `requires` id exists and sits earlier in the flat order.
- `src/lib/lessons.ts`: `loadSyllabus()` reads the `lessons` collection and calls `buildSyllabus`.
- `src/content.config.ts`: one collection, glob `**/*.mdx` under `src/content/lessons`, schema `{ summary, requires[] }`.
- `src/pages/learn/[...id].astro`: one lesson route at `/learn/<id>/`. It computes `level` from `parseInt(entry.id)` and uses `flat` for prev and next.
- `src/layouts/Layout.astro`: sidebar renders `modules` as `<details>` with lesson links and "Soon" pills.
- `src/lib/mastery.ts`: progress, review cards, and calibration in `localStorage` keys (`sd-progress`, `sd-cards`, `sd-explain`).
- `src/pages/questions.json.ts` and `review.astro`: read every `.mdx` under `src/content/lessons/**` and extract quizzes.
- `scripts/quiz-audit.py`, `diagnose-audit.py`: audit quiz and Diagnose rules.

### Decided routes (2026-10-15)

| URL | Page |
|---|---|
| `/` | Hub. A track picker with two cards (Backend, AI). Each card shows lesson count and the reader's progress |
| `/learn/backend/` | Backend landing page (track map and roadmap) |
| `/learn/backend/<id>/` | Backend lesson. `<id>` is the current id, for example `05-caching/why-cache` |
| `/learn/ai/` | AI landing page (track map and roadmap) |
| `/learn/ai/<id>/` | AI lesson. `<id>` is the id without the `ai/` prefix, for example `a2-inference-cost/kv-cache` |
| `/learn/<id>/` (old) | Redirects to `/learn/backend/<id>/` |

### Proposal

1. **Content path.** Backend lessons stay at `src/content/lessons/<module>/<lesson>.mdx`. AI lessons live at `src/content/lessons/ai/<module-slug>/<lesson-slug>.mdx`. The AI lesson id is `ai/a2-inference-cost/kv-cache`. The existing glob already matches it. No change to `content.config.ts`.
2. **Backend ids do not change.** `sd-progress`, `sd-cards`, and `sd-explain` key on the lesson id. Unchanged ids keep all existing progress. AI ids start with `ai/`, so they cannot collide.
3. **Routes.** Replace `src/pages/learn/[...id].astro` with a shared `src/components/LessonPage.astro` and two thin pages: `src/pages/learn/backend/[...id].astro` (all ids that do not start with `ai/`) and `src/pages/learn/ai/[...id].astro` (ids that start with `ai/`; the page strips the prefix from the URL). Add `src/pages/learn/backend/index.astro` and `src/pages/learn/ai/index.astro` as landing pages. Both reuse `CourseMap.tsx`.
4. **Redirects.** Old `/learn/<id>/` URLs must keep working. Use the Astro `redirects` option in `astro.config.mjs`. Build the map at config time from the backend syllabus: `'/learn/<id>': '/learn/backend/<id>/'` for each backend id. Add `'/learn': '/learn/backend/'`. If the config cannot read the syllabus, generate one static redirect page per lesson instead. Add a build check that every old URL resolves.
5. **Internal links.** A scripted pass rewrites `/learn/<id>/` links in all `.mdx`, `Layout.astro`, `CourseMap.tsx`, `review.astro`, `search.json.ts`, and `questions.json.ts` to `/learn/backend/<id>/`. The redirects remain for external links only. Writers use the new form (see section 8).
6. **Hub.** `src/pages/index.astro` becomes the track picker. Show "continue where you left off" from `sd-progress`. Remember the last track in `localStorage`, wrapped in try/catch.
7. **Syllabus.** Add `src/lib/ai-syllabus.ts` that exports `aiSyllabus: ModuleOutline[]`. Keep `syllabus.ts` for the backend. Extend `ModuleOutline` with `track: 'backend' | 'ai'`. Define the flat order as backend modules first, then AI modules, so AI lessons can list backend lessons in `requires` and the existing "earlier only" check still works.
8. **Numbering.** Pass a number prefix to `buildSyllabus`: backend `0.1`, AI `A0.1`. Module `number` becomes a string label. An optional `label` on a module outline overrides the prefix, so elective modules show as `E1` and `E1.3`, not `A15`. `ai-syllabus.ts` sets `label: 'E1'` to `'E3'` on the three elective modules.
9. **Cross-track `requires`.** AI to backend allowed. Backend to AI blocked by the existing check. Build fails on a violation. Backend lessons that mention AI use plain text, not links.
10. **Level label.** The route computes `level` from `parseInt(entry.id)`. For AI ids, read the module's `level` field in the outline instead. Add an optional `level` to `ModuleOutline`.
11. **Sidebar and track switch.** In `Layout.astro`, add a two-tab control at the top of the sidebar: Backend, AI. The active track comes from the URL. Pass `modules` for the active track only.
12. **Coming soon stubs.** Every AI lesson is in `ai-syllabus.ts` from day one. `buildSyllabus(written)` marks a lesson without an `.mdx` file as "Soon". The AI landing page and the sidebar show all AI lessons (147 after the 2026-10-16 restructure), with "Soon" pills, from Phase 0.
13. **Cross-track cards.** Add the `CrossTrackLink` component (section 7). It takes a target lesson id, finds its title and track from the syllabus, and builds the URL with the new routes. The build fails if the target id does not exist.
14. **Prices.** Add `src/lib/ai-prices.ts`: the one table for every price shown in a lesson. Each row has `provider`, `model` (or GPU SKU), `unit` (for example per million input tokens), `price`, `asOf` (YYYY-MM-DD), and `sourceUrl`. Lessons import prices through the `AiPriceTag` component and never type a price by hand. A build check fails when a lesson quotes a dollar figure that has no row. A row older than 120 days prints a warning; it does not fail the build. See the quarterly refresh task in section 8.
15. **Progress, quiz, review, mastery.** Reuse as is. `questions.json.ts` and `review.astro` already glob all lessons. Add a track filter on `/review` (all, backend, AI).
16. **Audits.** `quiz-audit.py` and `diagnose-audit.py` must scan `src/content/lessons/ai/` as well. Question text stays unique across both tracks.
17. **Search.** `search.json.ts` takes both tracks. Add a track badge to results.
18. **Contract.** `NEXT_LESSONS.md` applies unchanged. Add one short section that says AI lessons live under `ai/`, may require backend ids, use the new routes, and follow the overlap and price rules of this plan.

Shared files that only the orchestrator edits: `syllabus.ts`, `ai-syllabus.ts`, `ai-prices.ts` (writers may request a row; the orchestrator adds it), `Layout.astro`, `LessonPage.astro`, both route pages, `astro.config.mjs`, `content.config.ts`, `index.astro`. Writers do not touch them.
19. **Electives.** The last part of the AI track is "Electives" (E1 to E3). The track home marks it optional with a small tag and one muted line: "For ML infrastructure roles. Not needed for the core path." Elective ids follow the same rule: `ai/e1-classic-ml/<lesson>`. A core lesson must not require an elective lesson. The existing "earlier only" check enforces this, because electives sit last in the flat order.

---

## 6. AI Numbers to Know (draft)

Only numbers present in the research notes. "Derived" means the notes show the arithmetic. Dated: 2026-10-14. This table holds no dollar prices. Prices live in `src/lib/ai-prices.ts`.

| Group | Number | Lesson | Source |
|---|---|---|---|
| Hardware | H100 SXM: 80 GB HBM3, 3.35 TB/s, NVLink 900 GB/s | A2.1 | [H1] |
| Hardware | H200 SXM: 141 GB HBM3e, 4.8 TB/s | A2.1 | [H2] |
| Hardware | NVIDIA peak numbers are with sparsity; dense is half. H100 BF16 dense about 989 TF | A2.2 | [H1] |
| Hardware | H100 FP8 is 2x BF16 rate (3,958 vs 1,979 TF with sparsity) | A2.6 | [H1] |
| Hardware | PCIe Gen5 x16 = 128 GB/s | A2.1 | [H1] |
| Hardware | InfiniBand up to 400 Gb/s per port = 50 GB/s (derived) | E2.4 | [H3] |
| Hardware | Blackwell NVLink 1.8 TB/s bidirectional per GPU | E2.4 | [H3] |
| Roofline | A100 ridge 312e12 / 1.5e12 = 208 FLOPs/byte | A2.2 | [K1] |
| Roofline | H100 BF16 dense ridge about 295 FLOPs/byte (derived) | A2.2 | [K1], [H1] |
| Compute | Inference about 2 FLOPs per parameter per token | A1.3 | [K1] |
| Compute | 70B decode floor: 140 GB / 3.35 TB/s = ~42 ms per step (derived) | A2.2 | [K1], [H1] |
| Memory | Bytes per weight: FP16 2, INT8 1, INT4 0.5 | A2.1 | [K2] |
| Memory | 70B BF16 = 140 GB | A2.1 | [K2] |
| Memory | Training with Adam, mixed precision: 16 bytes per parameter | E2.2 | [T3] |
| Memory | ZeRO example 7.5B on 64 GPUs: 120, 31.4, 16.6, 1.9 GB | E2.3 | [T3] |
| KV cache | Llama 3 70B: 320 KiB per token; 8K tokens = 2.5 GiB; 128K = 40 GiB (derived; KV head count to verify) | A2.3 | [K1], [T2] |
| Serving | PagedAttention: 60% to 80% waste before, under 4% after | E3.2 | [K3] |
| Serving | PagedAttention 2x to 4x throughput vs FasterTransformer and Orca | E3.2 | [K4] |
| Serving | Orca continuous batching 36.9x (GPT-3 175B) | A2.4 | [K5] |
| Serving | Continuous batching 10x to 20x vs dynamic batching | A2.4 | [K2] |
| Serving | DistServe 7.4x more requests or 12.6x tighter SLO | E3.5 | [K7] |
| Serving | Splitwise 1.4x throughput at 20% less cost | E3.5 | [K8] |
| Serving | Speculative decoding 2x to 3x (T5-XXL) | E3.4 | [K9] |
| Serving | FlashAttention 3x on GPT-2 at seq 1K | E3.3 | [K10] |
| Serving | Latency = TTFT + TPOT x output tokens; TPOT 100 ms = 10 tokens/s | A2.2 | [K2] |
| Serving | Llama2-70B, 4 to 8 GPUs cuts latency only 0.7x | E3.6 | [K2] |
| Training | Llama 3 405B: 15.6T tokens, 3.8e25 FLOPs, 41% MFU | A1.7 | [T2] |
| Training | 54 days: 466 interruptions, 419 unexpected, about 8.6 per day (derived) | E2.6 | [T2] |
| Training | Megatron 1T on 3,072 GPUs: 52% of peak | E2.4 | [T4] |
| Tuning | LoRA: 10,000x fewer trainable parameters, 3x less memory | A11.2 | [T7] |
| Tuning | QLoRA: 65B on one 48 GB GPU | A11.2 | [T8] |
| Vectors | 1536 dims float32 = 6,144 bytes per vector | A1.2 | [R1] |
| Vectors | PQ M=96, 8 bits = 96 bytes (derived) | A5.2 | [R2] |
| Vectors | pgvector defaults: m 16, ef_construction 64, ef_search 40 | A5.2 | [R5] |
| Retrieval | RRF k = 60 by default | A5.5 | [R10] |
| Retrieval | Contextual retrieval failure rate 5.7% to 1.9% (with BM25 and rerank) | A5.4 | [R8] |
| Retrieval | Rerank pattern: top 25, then top 3 | A5.6 | [R11] |
| Caching | Anthropic cache: write 1.25x (5 min) or 2x (1 h); reads 0.1x on standard models | A2.5 | [A2] |
| Limits | Opus 5.5 Start tier: 1,000 RPM, 2M ITPM, 400K OTPM | A3.6 | [A10] |
| Agents | Agents about 4x chat tokens; multi-agent about 15x | A6.9, A6.10 | [A6] |
| Agents | 95% per step, 10 steps = 60% (derived) | A0.3 | [A6] |
| Cost | $/M tokens = GPU $/h / (tokens/s x 3600) x 1e6 (derived) | A2.4 | [K2] |
| Systems | Michelangelo P95 under 5 ms (no Cassandra), under 10 ms (with) | E1.13 | [C6] |
| Systems | Radar decision under 100 ms; fraud about 1 in 1,000 | E1.12 | [C8] |
| Systems | Character.AI about 20,000 QPS, under 1 cent per hour of conversation | A14.1 | [C2] |

---

## 7. Reusable animation components (build first)

`CrossTrackLink` and `AiPriceTag` are plain content components (not animations) and carry no `Ai` animation logic. The others use the sketch primitives and `AnimFrame`. Pure functions of the step index. Logic in separate `.ts` files with node tests. Prefix `Ai` for animation components.

| Component | Purpose | Used by |
|---|---|---|
| `AiTokenStrip` | Text split into token chips with counts and cost | A1.1, A4.3, A9.2 |
| `AiEmbedSpace` | 2D scatter with distance picker and cluster labels | A1.2, A5.1 |
| `AiLayerStack` | Token passing through layers with FLOP counter | A1.3, A1.4 |
| `AiSampler` | Probability bars with temperature and top-p, seeded draws | A1.5, A3.3 |
| `AiMemoryBar` | Stacked GPU memory: weights, KV, activations, free | A2.1, E2.2, A2.3, A2.6 |
| `AiRoofline` | Roofline plot with a draggable operating point | A2.2, A2.3, A2.6 |
| `AiCostCalc` | Calculator: GPU price, throughput, utilization, goodput to $ per million tokens | A2.4, A2.7, A3.9, A9.2, E3.8 |
| `AiKvGrowth` | KV bar growing per generated token | A2.3, E3.2 |
| `AiBatchTimeline` | Static vs continuous batching lanes | A2.4, E3.5 |
| `AiBlockTable` | Paged blocks with block table and sharing | E3.2, A2.5 |
| `AiGpuGrid` | GPUs colored by parallel group, with comm links | E2.3, E2.4, E3.6 |
| `AiFunnel` | Candidate funnel with latency per stage | E1.5, A5.6, A13.x |
| `AiAnnGraph` | HNSW layered graph with greedy hops, filter greying | A5.2, A5.3 |
| `AiRankMerge` | Two ranked lists merged by RRF | A5.5, A5.6 |
| `AiTraceWaterfall` | Span waterfall for model calls and tools | A6.1, A9.1 |
| `AiAgentLoop` | Agent loop with injectable failure and budgets | A6.1, A7.2, A13.6 |
| `AiAgentGraph` | State, nodes, conditional edges, checkpoints, and interrupts on one agent graph | A6.3, A7.1, A7.2 |
| `AiJudgeLab` | Answer pair with order swap and length toggles | A8.4 |
| `AiChainReliability` | p^n chain with verifier and retry toggles | A0.3, A7.2 |
| `AiTrustMap` | Data-flow with trust boundaries and attack path | A10.1 to A10.4 |
| `AiBudgetCard` | Latency and cost budget that fills as choices are made | A0.2, A13.x |
| `CrossTrackLink` | Card that links an AI lesson to a Backend chapter (or the reverse). Shows the target title, track, and a one-line "what you already know" note. Builds the URL from the syllabus. Build fails if the target id is missing | A2.5, A5.2, A3.6, A13.x (see the overlap table) |
| `AiPriceTag` | Renders one price from `ai-prices.ts`: provider, model, price, "as of" date, source link. Shows a warning style when the date is older than 90 days | A1.1, A2.7, A5.4, A2.5, A9.2, A13.x |

`DesignBuild` and `DesignCompare` (already in `src/components/anim/DesignBuild.tsx`) drive all A13 builds. Build order inside the kit: `AiMemoryBar`, `AiRoofline`, `AiCostCalc`, `AiKvGrowth`, `AiBatchTimeline` first (A2 uses them), then the rest as each module starts.

---

## 8. Build order and model routing

### Order

**Phase 0: UI redesign and track shell.** This is the first build step. It ships before any AI lesson text.
- Redesign the site UI.
- Add the track shell: the hub at `/`, the two landing pages, the routes `/learn/backend/<id>/` and `/learn/ai/<id>/`, and the old-URL redirects (section 5).
- Add `ai-syllabus.ts` with **all AI lessons as "coming soon" stubs** (no `.mdx` yet), `ai-prices.ts`, `CrossTrackLink`, `AiPriceTag`, and the audit script changes.
- Build the five core kit components (they serve A2 first).
- Exit check: every backend lesson still opens at the new URL; every old URL redirects; every AI lesson shows as "Soon"; progress keys are intact.

**Phase 1 and later: writing modules.** Each phase replaces stubs with real lessons. The order is agent- and integration-first. The core path comes before any elective.
1. Phase 1: A0, A1, A2 (18 lessons). A0 (4) and A1 (7) are done. **Next: A2** (7 lessons). These set the vocabulary and numbers for all later work. Review with the user before more content.
2. Phase 2: A3, A4, A5 (27 lessons). The integration and context layer, then retrieval.
3. Phase 3: A6, A7 (21 lessons). Agent foundations, then agents in production. A6.3 (agents as graphs) and A7.1 (graph runtime) need the new `AiAgentGraph` component.
4. Phase 4: A8, A9, A10 (23 lessons). The eval, ops, and security spine.
5. Phase 5: A11, A12 (10 lessons).
6. Phase 6: A13, 9 deep cases in table order, one or two per batch. A13.1 can start after A3 and A9. A13.3 can start after A5. The agent cases (A13.4 to A13.9, all but the first three) start after A7. Each deep case is larger than a normal lesson. Budget more writer and review time for it.
7. Phase 7: A14 (6 teardowns). The two agent teardowns (A14.5, A14.6) use loaded primary sources only.
8. Phase 8 (optional): E1, E2, E3 (28 lessons). Write on demand. E3 comes first if a reader asks for serving depth. Do not block the core path on them.

### Routing

Follows the user's routing rule: the orchestrator decides and verifies; workers do bulk work.

| Stage | Model | Task |
|---|---|---|
| Research | Haiku 5.5 (`model: "haiku"`) | One agent per module. Output one fact sheet per lesson, under 700 words, every fact with a fetched URL, `UNVERIFIED` marks. Cover the open items in section 9 |
| Write | Sonnet 5.5 | One agent per 3 to 5 lessons, in parallel per module. Read `NEXT_LESSONS.md`, this plan entry, the fact sheet, two template lessons. Write MDX and components |
| Verify | Orchestrator (main model) | Type check, scratch build, page sweep, screenshots, number spot-check, duplicate-question check |
| Rerun | Stronger model | If a Haiku fact sheet is weak, rerun on a stronger model. Do not loop Haiku |

Rules for writers:
- Use this plan's numbers as given. Mark each as `~` when rough.
- **Research and verify any number not in the notes.** Cite a fetched URL. If you cannot verify it, say it without a number or drop it.
- Entries marked `UNVERIFIED` in this plan are not facts. Treat them as open research tasks.
- For each model failure example, run the prompt and keep the transcript with the model name and date.
- Prices come from `src/lib/ai-prices.ts` and render with `AiPriceTag`. Fetch the provider pricing page when you write. Every price shows provider, model, price, and an "as of YYYY-MM-DD" stamp with the source URL. Limits carry the page date.
- Where your lesson overlaps a Backend chapter, follow the overlap rule in section 2: 3 to 5 sentence summary, a `CrossTrackLink` card, then only the AI-specific part.
- Touch only your own lesson files and new `Ai*` components.
- Lessons link to Backend lessons with `/learn/backend/<id>/` and to AI lessons with `/learn/ai/<id>/` (no `ai/` prefix in the URL). Prefer `CrossTrackLink` for cross-track links. Never link forward to an unwritten lesson. Write the lesson number as plain text instead.

### Quarterly price-refresh task

Every quarter (January, April, July, October), the orchestrator runs one task:
1. Open each row of `ai-prices.ts`. Fetch its `sourceUrl`. Update `price` and `asOf`. If a model is retired, mark it and swap the lesson example to a current model.
2. Run the price check: refresh rows the check warns are older than 120 days; every dollar figure in a lesson has a row.
3. Re-run each lesson `Ballpark` node test that reads a price. Fix any changed answer.
4. List lessons whose worked example changed and review them.
Route: a Haiku 5.5 worker fetches and proposes row changes; the orchestrator checks them and commits.

### Verification

Same as `NEXT_LESSONS.md` section 6. Add: old backend URLs redirect to `/learn/backend/<id>/`; every `requires` is earlier in the combined flat order; one quiz per lesson passes `quiz-audit.py --strict` over both tracks; each `Ballpark` answer is checked by a node test.

---

## 9. Source keys and open items

### Source keys

Platforms (all loaded, see `1-platforms.md`):
- [P1] https://github.com/chiphuyen/aie-book/blob/main/ToC.md
- [P2] https://github.com/chiphuyen/dmls-book/blob/main/summary.md
- [P3] https://www.hellointerview.com/learn/ml-system-design/in-a-hurry/introduction
- [P4] https://bytebytego.com/courses/machine-learning-system-design-interview
- [P5] https://blog.bytebytego.com/p/our-new-book-generative-ai-system
- [P6] https://www.educative.io/courses/grokking-the-machine-learning-interview
- [P7] https://www.educative.io/courses/machine-learning-system-design/introduction
- [P8] https://maven.com/parlance-labs/evals
- [P9] https://fullstackdeeplearning.com/llm-bootcamp/spring-2023/
- [P10] https://cs336.stanford.edu/
- [P11] https://stanford-cs329s.github.io/
- [P12] https://karpathy.ai/zero-to-hero.html
- [P13] https://madewithml.com/
- [P14] https://eugeneyan.com/writing/llm-patterns/
- [P15] https://nanotron-ultrascale-playbook.static.hf.space/
- [P16] https://github.com/anthropics/anthropic-cookbook
- [P18] https://live.bytebytego.com/courses/ai-engineering
- [P19] https://maven.com/hyperskill/ai-engineer-bootcamp
- [P20] https://www.beri.net/learning/calmrocks-ai-engineer-notebooks (mirror page)

Inference and training (`2-inference-training.md`):
- [K1] https://kipp.ly/transformer-inference-arithmetic/
- [K2] https://www.databricks.com/blog/llm-inference-performance-engineering-best-practices
- [K3] https://vllm.ai/blog/2023-06-20-vllm
- [K4] https://arxiv.org/abs/2309.06180
- [K5] https://www.usenix.org/conference/osdi22/presentation/yu
- [K6] https://arxiv.org/abs/2308.16369
- [K7] https://arxiv.org/abs/2401.09670
- [K8] https://arxiv.org/abs/2311.18677
- [K9] https://arxiv.org/abs/2211.17192
- [K10] https://arxiv.org/abs/2205.14135
- [K11] https://arxiv.org/abs/2210.17323
- [K12] https://arxiv.org/abs/2306.00978
- [K13] https://arxiv.org/abs/2401.04088
- [K14] https://arxiv.org/abs/2312.07104
- [H1] https://www.nvidia.com/en-us/data-center/h100/
- [H2] https://www.nvidia.com/en-us/data-center/h200/
- [H3] https://nvidianews.nvidia.com/news/nvidia-blackwell-platform-arrives-to-power-a-new-era-of-computing
- [T1] https://arxiv.org/abs/2203.15556
- [T2] https://arxiv.org/html/2407.21783v3
- [T3] https://arxiv.org/html/1910.02054v3
- [T4] https://arxiv.org/abs/2104.04473
- [T5] https://arxiv.org/abs/2305.18290
- [T6] https://arxiv.org/abs/2501.12948
- [T7] https://arxiv.org/abs/2106.09685
- [T8] https://arxiv.org/abs/2305.14314
- [T10] https://arxiv.org/abs/2307.03172

Application layer (`3-application-layer.md`):
- [R1] https://developers.openai.com/api/docs/guides/embeddings
- [R2] https://github.com/facebookresearch/faiss/wiki/Faiss-indexes
- [R3] https://milvus.io/docs/index.md
- [R4] https://arxiv.org/abs/1603.09320
- [R5] https://github.com/pgvector/pgvector
- [R6] https://qdrant.tech/articles/filterable-hnsw/
- [R7] https://turbopuffer.com/docs
- [R8] https://www.anthropic.com/news/contextual-retrieval
- [R9] https://www.trychroma.com/research/evaluating-chunking
- [R10] https://www.elastic.co/docs/reference/elasticsearch/rest-apis/reciprocal-rank-fusion
- [R11] https://www.pinecone.io/learn/series/rag/rerankers/
- [R12] https://arxiv.org/abs/2004.12832
- [R13] https://arxiv.org/abs/2212.10496
- [R14] https://arxiv.org/abs/2404.16130
- [R15] https://docs.ragas.io/en/stable/concepts/metrics/available_metrics/
- [R16] https://ann-benchmarks.com/
- [A1] https://platform.claude.com/docs/en/build-with-claude/structured-outputs
- [A2] https://platform.claude.com/docs/en/build-with-claude/prompt-caching
- [A3] https://developers.openai.com/api/docs/guides/prompt-caching
- [A4] https://www.anthropic.com/engineering/writing-tools-for-agents
- [A5] https://www.anthropic.com/engineering/building-effective-agents
- [A6] https://www.anthropic.com/engineering/multi-agent-research-system
- [A7] https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents
- [A8] https://modelcontextprotocol.io/specification/2025-06-18
- [A9] https://docs.temporal.io/evaluate/why-temporal
- [A10] https://platform.claude.com/docs/en/api/rate-limits
- [A11] https://claude.com/blog/building-agents-with-the-claude-agent-sdk
- [E1] https://hamel.dev/blog/posts/evals/
- [E2] https://arxiv.org/abs/2306.05685
- [E3] https://arxiv.org/abs/2104.08758
- [S1] https://genai.owasp.org/llm-top-10/
- [S2] https://arxiv.org/abs/2302.12173
- [S3] https://simonwillison.net/2025/Jun/16/the-lethal-trifecta/
- [M1] https://developers.google.com/machine-learning/guides/rules-of-ml
- [M2] https://research.google/pubs/deep-neural-networks-for-youtube-recommendations/
- [OT] https://github.com/open-telemetry/semantic-conventions-genai

Case studies (`4-case-studies.md`):
- [C1] https://newsletter.pragmaticengineer.com/p/scaling-chatgpt
- [C2] https://blog.character.ai/optimizing-ai-inference-at-character-ai/
- [C3] https://github.blog/ai-and-ml/github-copilot/how-github-copilot-is-getting-better-at-understanding-your-code/
- [C4] https://cursor.com/blog/secure-codebase-indexing
- [C5] https://cursor.com/blog/instant-apply
- [C6] https://www.uber.com/en-US/blog/michelangelo-machine-learning-platform/
- [C7] https://arxiv.org/html/2209.07663v2
- [C8] https://stripe.dev/blog/how-we-built-it-stripe-radar
- [C9] https://www.designgurus.io/course-play/grokking-the-ai-system-design-interview/doc/6a5d83443af8a168c0d61da6

Case gaps (`5-case-gaps.md`):
- [G1] https://vespa.ai/perplexity/ (vendor case study)
- [G2] https://www.klarna.com/international/press/klarna-ai-assistant-handles-two-thirds-of-customer-service-chats-in-its-first-month/ (press release)
- [G3] https://fin.ai/ (vendor page, undated)
- [G4] https://arxiv.org/abs/2205.04507 (abstract only)
- [G5] https://arxiv.org/html/1906.00091v1 (DLRM)
- [G6] https://elevenlabs.io/blog/voice-agent-latency-optimization (vendor blog)
- [G7] https://blog.salad.com/stable-diffusion-gpu-benchmark-v1-4/ (vendor benchmark, Aug 2023)
- [G8] https://discord.com/blog/osprey-open-sourcing-our-rule-engine
- [G9] https://arxiv.org/abs/2208.03274 (abstract only)
- [G10] https://arxiv.org/abs/2312.06674 (abstract only)
- [G11] https://shopify.engineering/leveraging-multimodal-llms
- [G12] https://shopify.engineering/building-production-ready-agentic-systems
- [G13] https://airbnb.tech/ai-ml/listening-learning-and-helping-at-scale-how-machine-learning-transforms-airbnbs-voice-support-experience/
- [G14] https://airbnb.tech/ai-ml/eval-driven-development-lessons-from-evaluating-genai-at-scale/
- [G14b] https://www.linkedin.com/blog/engineering/generative-ai/musings-on-building-a-generative-ai-product
- [G15] https://bytebytego.com/courses/genai-system-design-interview/introduction-and-overview
- [G16] https://prachub.com/resources/generative-ai-system-design-interview-questions-rag-agents-evals-and-guardrails
- [G19] https://www.uber.com/en-CA/blog/query-gpt/ (Sep 2024)
- [G20] https://bird-bench.github.io/
- [G21] https://spider2-sql.github.io/
- [G22] https://modal.com/blog/flux-3x-faster (vendor blog, Jun 2025)
- [G23] https://www.snowflake.com/en/blog/engineering/real-time-text-to-sql-snowflake-intelligence/ (Nov 2025)
- [G24] https://ai.google.dev/gemini-api/docs/pricing (as of 2026-10-16)
- [G17] https://www.analyticsvidhya.com/blog/2026/06/system-design-for-ml-interviews-real-problems-solved/
- [G18] https://prachub.com/resources/machine-learning-system-design-interview-questions-ranking-recommendation-training-and-serving

In lesson text, `[OT]` means [OT].

### Open items: numbers and facts not sourced in the notes

Writers must research each before use.

- Chinchilla "about 20 tokens per parameter" rule. The notes have only the qualitative rule.
- Training FLOPs rule 6ND. Standard; not stated in a loaded page.
- Llama 3 70B KV head count (8) and head dim (128). Search summary only; HF config returned 401.
- B200 memory (180 vs 192 GB), B200 FP8 and BF16 peaks, MI300X figures.
- vLLM default block size. FlashAttention memory complexity. PaLM MFU value. Pipeline bubble formula.
- Prefix caching speedup numbers. Engine descriptions for vLLM, TensorRT-LLM, TGI.
- Tokenizer details and tokens-per-word ratios.
- DiskANN parameters and billion-scale results. HNSW recall curves and efSearch defaults. ScaNN numbers.
- Pinecone and Qdrant product facts.
- Freshness and incremental update cost; ACL patterns in enterprise RAG.
- Semantic cache risks.
- A/B test design for LLM features; power formulas; online learning details; drift metrics; feature store products.
- Pairwise vs pointwise judging evidence. MT-Bench bias magnitudes.
- Provider model-version and deprecation policy.
- OTel GenAI attribute names and status.
- ReAct, computer use, sandbox designs, memory architectures.
- PII handling patterns. Jailbreak taxonomy.
- VLM token counts. SDXL and Flux serving costs (only SD v1.4 numbers from [G7]). Video generation costs. LiveKit, Pipecat, and OpenAI Realtime latency budgets (ElevenLabs budget is loaded [G6]).
- New agent items without a loaded primary source: LangGraph or other graph-runtime docs, ReAct, Agent Skills spec, A2A spec, OAuth for agents, computer-use docs, user-simulation benchmarks, batch API discount and window, provider file and image docs, reinforcement fine-tuning product docs, extended-thinking docs. New cases A13.3, A13.6, A13.9 have no loaded primary source for a named system.
- Case-study primaries still missing: Glean and Notion ACL internals, DoorDash feature store, Netflix foundation model (403), YouTube paper full text, Instacart (403), OpenAI and Meta moderation blogs (403 and 404), Midjourney, a named LLM gateway design. Intercom Fin figures conflict (76% vendor claim vs 56% and 38 to 50% elsewhere); Klarna has no architecture detail.
- Vendor-sourced figures (Vespa, Fin, ElevenLabs, Salad, Klarna) are company claims. Lessons must label them so.
- Every price (API, GPU hour, embedding, STT, TTS) used in a worked example. Fetch it live, add a row to `ai-prices.ts` with provider, model, price, as-of date, and source URL. No assumed prices.
- Throughput figures in A2.4 and A2.7 examples (for example 2,000 tokens/s) must be measured or sourced, not assumed.
- `5-case-gaps.md` is merged into this plan.

### Decisions (2026-10-15)

1. **Routes.** Lessons live at `/learn/backend/<id>/` and `/learn/ai/<id>/`. Old `/learn/<id>/` URLs redirect to `/learn/backend/<id>/`. Backend ids do not change, so `localStorage` progress survives. AI ids carry the prefix `ai/` (content under `src/content/lessons/ai/`). Each track has a landing page. `/` is a track-picker hub. See section 5.
2. **Overlap.** An AI lesson does not re-teach a Backend topic (10.4 vector databases, 11.24 ChatGPT-style app, caching, rate limiting, queues, and others). It shows a 3 to 5 sentence summary and a `CrossTrackLink` card, then goes deeper on the AI-specific part only. See section 2 and section 7.
3. **Scope and rollout.** (Scope part superseded by decision 6.) All AI lessons ship first as "coming soon" stubs. Phase 0 is the UI redesign and track shell. Phase 1 and later write the modules. See section 8.
4. **Prices.** Quote live provider pricing. Each price shows provider, model, price, and an "as of YYYY-MM-DD" stamp with source URL. One central table, `src/lib/ai-prices.ts`. A quarterly refresh task. The "assumed price only" option is removed. See section 2 rule 11, section 5, and section 8.
5. **Case studies.** (Case list superseded by decision 6.) Quality over quantity. A13 has 12 deep cases in this order: video recommendation feed, ad click prediction, fraud detection, LLM gateway, ChatGPT-style assistant, LLM inference platform, enterprise RAG, code completion, customer support agent, voice agent, AI coding agent, deep research agent. The 10 dropped cases are Drill sections inside the nearest deep case. See A13 and section 4.

6. **2026-10-16: agent-first restructure; classic ML, training, deep inference are electives.** The core path is now Foundations (A0 to A2), Building with models (A3 to A5), Agents (A6 to A7), Quality and trust (A8 to A10), Customization and media (A11 to A12), and Practice (A13 to A14). Electives E1 (classic ML), E2 (training at scale), and E3 (inference deep dive) come last and are optional. Core is 119 lessons. Electives are 28. Total is 147. A13 now has 12 agent- and integration-first cases. The three classic ML cases move to E1 as capstones. Old drills move to the nearest new case or to an elective. A14 keeps Character.AI, Cursor, Anthropic multi-agent research, Perplexity, and LinkedIn, and adds two agent teardowns with loaded primary sources: Claude Agent SDK [A11] and Shopify Sidekick [G12]. Llama 3 training, Uber Michelangelo, Monolith, and Stripe Radar move to electives. A0 and A1 slugs do not change.

7. **2026-10-19: A13 cut from 12 to 9 deep cases; A14 from 8 to 6.** Test: a deep case needs a design axis no other case teaches and no A0 to A12 lesson already covers. Document extraction became a drill in A13.3, browser and computer-use a drill in A13.6, text-to-image a drill in A13.8 (with moderation). Workflow automation became a drill in A13.4; code review a drill in A13.6; text-to-SQL is new as A13.5. A14: Cursor index and apply merged; Anthropic research is now a teardown block inside A13.7. Core 114, total 142. Each deep case targets 4,000 to 5,000 words.

No blocking open questions remain.

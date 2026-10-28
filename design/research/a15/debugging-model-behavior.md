# Debugging Model Behavior: Primary-Source Findings (A15)

Format: fact, exact number, URL, page date. "Date not shown" means the page has no date. UNVERIFIED means the page could not be loaded or read.

Terms [mid]: logprobs = log of the probability the model gave a token.

## 1. Nondeterminism

- Thinking Machines post says the common "concurrency + floating point" explanation "is not entirely wrong, it doesn't reveal the full picture." Main cause: "the load (and thus batch-size) nondeterministically varies." URL: https://thinkingmachines.ai/blog/defeating-nondeterminism-in-llm-inference. Date: 2025-09-10. Author: Horace He with others.
- Experiment: Qwen/Qwen3-235B-A22B-Instruct-2507 (non-thinking), prompt "Tell me about Richard Feynman", temperature 0, 1,000 tokens. Result: 1,000 completions gave 80 unique outputs. Most common output appeared 78 times. URL: same. Date: 2025-09-10.
- Same experiment: completions matched for the first 102 tokens and diverged at token 103. Split: 992 continued "Queens, New York," 8 said "New York City". URL: same. Date: 2025-09-10.
- Same experiment: with batch-invariant kernels enabled, all 1,000 completions were identical. URL: same. Date: 2025-09-10.
- Fix cost: Qwen3-8B, one GPU, 1,000 sequences, 90-110 output tokens. Default vLLM 26 s. Unoptimized deterministic 55 s (about 112% slower). With improved attention kernel 42 s (about 62% slower). URL: same. Date: 2025-09-10.
- Matmul alone loses "about 20% performance compared to cuBLAS." Authors say they did not heavily optimize the kernels. URL: same. Date: 2025-09-10.
- Kernels made batch-invariant: RMSNorm, matrix multiplication, attention (split-KV reduction with fixed split size). URL: same. Date: 2025-09-10.
- Anthropic glossary, "Temperature": "Even with temperature set to 0, the results will not be fully deterministic, and identical inputs might produce different outputs across API calls." URL: https://platform.claude.com/docs/en/about-claude/glossary. Date not shown.
- OpenAI seed cookbook: "Determinism is not guaranteed." Also: "There is a small chance that responses differ even when request parameters and `system_fingerprint` match." URL: https://developers.openai.com/cookbook/examples/reproducible_outputs_with_the_seed_parameter. Date not shown (page says "This recipe is archived").
- OpenAI seed cookbook, system_fingerprint: "This fingerprint represents the backend configuration that the model runs with." Seed is "a best effort to sample deterministically." URL: same. Date not shown.
- OpenAI API reference (chat/create) for seed, logprobs, top_logprobs: UNVERIFIED (HTTP 403).

## 2. Logprobs

- OpenAI cookbook "Using logprobs for classification and Q&A evaluation." Purpose: classification confidence, and a Q&A check where the model outputs a `has_sufficient_context_for_answer` boolean and its logprobs are read as confidence. Stated aim: "reduce retrieval-based hallucinations." URL: https://developers.openai.com/cookbook/examples/using_logprobs. Date not shown (archived).
- Cookbook numbers: a headline classified "Art" at 97.23%, runner-up "Sports" at 1.39%. Dickens question answered "False" at 99.14%; Babbage question "True" at 99.59%. URL: same. Date not shown.
- Cookbook caveat: "confidence measures certainty in the classification, not whether the classification is correct." URL: same. Date not shown.
- top_logprobs values in cookbook examples: 2, 3, 5. Documented allowed range: UNVERIFIED (search sources conflict: 0-5 vs 1-20; official page not loaded).
- Anthropic Messages API: NO logprobs parameter or response field found. Checked 200,000 of 1,289,756 characters, including the Message response schema. URL: https://platform.claude.com/docs/en/api/messages (redirect from docs.anthropic.com). Date not shown. Rest of page not read, so treat as partial.
- Gemini: Google developer blog, Vertex AI. Config `response_logprobs=True`; `logprobs` accepts "1 to 20"; example uses `logprobs=3`. Results at `response.candidates[0].logprobs_result`. URL: https://developers.googleblog.com/en/unlock-gemini-reasoning-with-logprobs-on-vertex-ai/. Date: 2025-07-16. Only example model: gemini-2.5-flash.
- Gemini blog: "a logprob score closer to 0 indicates higher model confidence in its choice." URL: same. Date: 2025-07-16.
- Gemini official API reference and full model support list: UNVERIFIED.
- OpenAI model support for logprobs (reasoning models): UNVERIFIED (sources conflict; official page not loaded).

## 3. Tokenization bugs

- Strawberry: GPT-4 tokenizer splits "strawberry" into "str", "aw", "berry", with IDs [496, 675, 15717]. Blogger quote: "the LLM doesn't have access to individual characters, it just sees the tokens." URL: https://blog.legoktm.com/2024/08/10/how-many-rs-are-in-the-word-strawberry.html. Date: 2024-08-10.
- Strawberry results (same post, ChatGPT 4o): plain prompt answered 2 R's. Python prompt answered 3. Letters spaced out answered 3. URL: same. Date: 2024-08-10.
- Xu and Ma, "LLM The Genius Paradox" (NAACL 2025): tokenization is a popular conjecture. Quote: "we find conjectures about inherent deficiency of LLMs invalid." URL: https://arxiv.org/abs/2410.14166. Submitted 2024-10-18; revised 2025-02-06.
- Singh and Strouse, "Tokenization counts" (arXiv 2402.14903): abstract says "right-to-left tokenization (enforced by comma separating numbers at inference time) leads to largely improved performance." URL: https://arxiv.org/abs/2402.14903. Submitted 2024-02-22. Accuracy figures (GPT-3.5 75.6% to 97.8%; GPT-4 84.4% to 98.9%): UNVERIFIED (search summary only; full paper not read).
- Whitespace: John Cook blog, chess prompt "1. e4 e5 2. " (trailing space). Quote: "The trailing space is tokenized as an individual character, but the spaces in front of the e's are tokenized with the e's." URL: https://www.johndcook.com/blog/2025/03/09/practical-tokenization/. Date: 2025-03-09. Informal observation, not a controlled study.
- Partial-token paper (Xu et al., arXiv 2601.23223): UNVERIFIED (PDF text not readable).
- Glitch token, SolidGoldMagikarp: Rumbelow and mwatkins, "SolidGoldMagikarp (plus, prompt generation)." Post date 2023-02-05. At temperature 0, GPT-3 davinci-instruct-beta repeated ' SolidGoldMagikarp' as 'distribute'. URL: https://www.alignmentforum.org/posts/aPeJE8bSo6rAFoLqg/solidgoldmagikarp-plus-prompt-generation. (LessWrong URL did not load; Alignment Forum mirror did.)
- SolidGoldMagikarp numbers: candidate list of 141 weird tokens. Full GPT token set: 50,257 tokens. Models named: ChatGPT, davinci-instruct-beta, GPT-J, GPT-2 small, GPT2-xl. URL: same. Date: 2023-02-05.
- SolidGoldMagikarp III: repeat-the-string prompts gave "total failure." Working list: 140 tokens. URL: https://www.alignmentforum.org/posts/8viQEp8KBg2QSW4Yc/solidgoldmagikarp-iii-glitch-token-archaeology. Date: 2023-02-14.
- tiktoken README: "tiktoken is a fast BPE tokeniser for use with OpenAI's models." URL: https://github.com/openai/tiktoken. Date not shown.
- Anthropic token counting: endpoint `messages/count_tokens`. Quote: "The token count is an **estimate**." Counting is "free to use" (rate-limited). URL: https://platform.claude.com/docs/en/build-with-claude/token-counting. Date not shown.
- Anthropic tokenizer change: Claude 4.7 and later use a tokenizer producing "approximately 30 percent more tokens" for the same text. URL: same, and https://platform.claude.com/docs/en/about-claude/glossary. Date not shown.
- OpenAI tokenizer page (platform.openai.com/tokenizer): UNVERIFIED (HTTP 403).

## 4. Position effects

- Liu et al., "Lost in the Middle" (arXiv 2307.03172). Quote: "performance is often highest when relevant information occurs at the beginning or end of the input context." URL: https://arxiv.org/abs/2307.03172. Submitted 2023-07-06; v3 2023-11-20.
- Same abstract: "significantly degrades when models must access relevant information in the middle of long contexts," and this holds "even for explicitly long-context models." URL: same. Date: 2023-11-20 (v3).
- Abstract gives no numbers. Tasks: multi-document QA and key-value retrieval. "U-shaped" is a summary label, not the paper's word.

## 5. Error analysis (Husain, Shankar)

- Husain and Shankar, "AI Evals: Everything You Need to Know." Error analysis is "the most important activity in evals." Four steps: dataset, open coding, axial coding, refinement. URL: https://hamel.dev/blog/posts/evals-faq/. Page shows published 2026-09-18, modified 2026-09-21.
- Open coding: write "open-ended notes about traces." Start with "Review at least 30 traces yourself." URL: same. Date: 2026-09-18.
- Axial coding: "Categorize the open-ended notes into a 'failure taxonomy.'" Called "the most important step." URL: same. Date: 2026-09-18.
- Sample size: "We recommend reviewing at least 100 traces." Stop at "theoretical saturation." URL: same. Date: 2026-09-18.
- Husain, "Your AI product needs evals": "You are doing it wrong if you aren't looking at lots of data." Stop rule: "keep reading logs until you feel like you aren't learning anything new." URL: https://hamel.dev/blog/posts/evals/. Date: 2024-03-29. Does not mention open/axial coding.
- Shankar et al., "Who Validates the Validators?" (arXiv 2404.12272). Criteria drift: "users need criteria to grade outputs, but grading outputs helps users define criteria." URL: https://arxiv.org/abs/2404.12272. Submitted 2024-04-18.
- Original Shankar/Husain open-coding writeup: UNVERIFIED (not loaded).

## 6. Prompt ablation

- Tian Pan field guide: ablation is "removing or substituting components of a prompt one at a time to identify which part is responsible for the failure." URL: https://tianpan.co/blog/2026-04-15-debugging-llm-failures-field-guide. Date: 2026-04-15.
- Same guide: "few-shot examples are frequently the culprit," because "examples also reroute the model's reasoning." No numbers given. URL: same. Date: 2026-04-15.
- Latitude root-cause guide, "input ablation": "Reduce the prompt to its smallest form, then add parts back one at a time until the failure returns." URL: https://www.latitude.so/blog/llm-failure-modes-root-cause-analysis-guide. Date: 2026-06-13.
- Tian Pan "at least 50-100 examples" per variant: UNVERIFIED (not loaded).

## 7. Retrieval vs generation blame

- Latitude guide: "Change one layer at a time." Inject a "golden" document and rerun. Quote: "If the model answers correctly with it, retrieval was the problem." URL: https://www.latitude.so/blog/llm-failure-modes-root-cause-analysis-guide. Date: 2026-06-13.
- Ragas, Context Recall: "Context Recall measures how many of the relevant documents (or pieces of information) were successfully retrieved." Needs a reference: "calculating context recall always requires a reference to compare against." URL: https://docs.ragas.io/en/stable/concepts/metrics/available_metrics/context_recall/. Date: 2025-12-09.
- Anthropic, Contextual Retrieval. Metric: 1 minus recall@20. Baseline failure rate 5.7%. "Reranked Contextual Embedding and Contextual BM25 reduced the top-20-chunk retrieval failure rate by 67%" (down to 1.9%). Contextual Embeddings alone: 35% reduction (to 3.7%). URL: https://www.anthropic.com/news/contextual-retrieval. Date: 2024-09-19.

## 8. Field notes

- Hugging Face model card, "broken-model-fixed" (fixed copy of yunmorning/broken-model). Three root causes: (1) "The original model did not define a chat template"; (2) invalid `pad_token_id`, "which makes batching unsafe"; (3) "reasoning_effort is not a native Transformers generation parameter," so the field did nothing. URL: https://huggingface.co/syedahmedsoftware/broken-model-fixed/blob/main/README.md. Date not shown (commit "9 months ago"). No before/after scores.
- Legoktm strawberry post (see section 3). Surprise: the same model answered 2 R's, then 3 once asked to run Python. URL: https://blog.legoktm.com/2024/08/10/how-many-rs-are-in-the-word-strawberry.html. Date: 2024-08-10.
- Anthropic Contextual Retrieval (see section 7): reranking cut retrieval failure from 5.7% to 1.9%. URL: https://www.anthropic.com/news/contextual-retrieval. Date: 2024-09-19.
- Husain, Rechat case: "Rechat has hundreds of these unit tests." URL: https://hamel.dev/blog/posts/evals/. Date: 2024-03-29.
- Helicone guide (vendor): "We hear the same story from nearly every team: 'We shipped a broken tool call chain to prod. It took us 3 hours to trace the root cause.'" No company named. URL: https://www.helicone.ai/blog/complete-guide-to-debugging-llm-applications. Date: 2025-05-21.

## Unverified items (summary)

- OpenAI API reference (seed, logprobs, top_logprobs) and OpenAI tokenizer page: HTTP 403.
- top_logprobs allowed range and OpenAI logprobs model support: sources conflict.
- Anthropic temperature default and parameter table: not found in the portion read.
- Singh and Strouse accuracy numbers: search summary only.
- Partial-token paper (arXiv 2601.23223): PDF not readable.
- Gemini official reference and full model list.
- Original Shankar/Husain open-coding writeup.
- Tian Pan "50-100 examples" figure.

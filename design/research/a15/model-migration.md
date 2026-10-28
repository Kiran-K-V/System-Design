# Model Migration Playbook: Research Notes (a15)

Research date: 2026-10-28. Each bullet cites a page that was loaded. "Date" is the page date shown, or "not shown".

## 1. Deprecation and retirement policies

- Anthropic notice: "providing at least 60 days' notice before model retirement for publicly released models." Date: not shown. https://platform.claude.com/docs/en/about-claude/model-deprecations (docs.anthropic.com redirects here)
- Anthropic status terms: "Active", "Legacy", "Deprecated", "Retired". "Deprecated models are likely to be less reliable than active models." Same URL, not shown.
- Anthropic recent retirements: claude-opus-4-1-20250805 retired Aug 5, 2026 (notice Jun 5, 2026). claude-sonnet-4-20250514 and claude-opus-4-20250514 retired Jun 15, 2026 (notice Apr 14, 2026). claude-3-haiku-20240307 retired Apr 20, 2026 (notice Feb 19, 2026). Same URL, not shown.
- Anthropic open item: claude-sonnet-4-5-20250929 deprecated Sep 30, 2026, retirement Nov 30, 2026, replacement claude-sonnet-5-5. Same URL, entry dated 2026-09-30.
- OpenAI notice: GA models "At least 6 months". Specialized variants "At least 3 months". Preview models "much shorter notice, such as 2 weeks." https://developers.openai.com/api/docs/deprecations (platform.openai.com redirects here), not shown.
- OpenAI recent retirements: GPT-4 series announced 2026-10-14, shutdown Jan 14, 2027. GPT-5 and o3 snapshots announced 2026-06-11, shutdown Dec 11, 2026. chatgpt-4o-latest announced 2025-11-18, shutdown 2026-02-17. gpt-5-chat-latest shutdown Jul 23, 2026. Same URL.
- Google Gemini: listed dates are "earliest possible dates." "We will communicate the exact shutdown date to users with advance notice." No notice period in days is stated. Recent: gemini-2.0-flash shutdown Jun 1, 2026, replacement gemini-3.6-flash. gemini-3-pro-preview shutdown Mar 9, 2026. https://ai.google.dev/gemini-api/docs/deprecations, last updated 2026-10-22.
- Azure GA notice: "At least 60 days before retirement." Standard GA lifecycle is 18 months from launch. Anthropic, DeepSeek, Fireworks, and Mistral GA models follow a 12-month lifecycle. https://learn.microsoft.com/en-us/azure/foundry/openai/concepts/model-retirements, ms.date 2026-07-24.
- Azure: "Retirement dates aren't extendable." Retired models return "410 Gone." Same URL, 2026-07-24.
- Azure example: gpt-4o 2024-05-13 retires 2026-12-09 and auto-upgrades to gpt-5.6-sol on Standard. "Provisioned deployments are NOT auto-upgraded." Same URL, 2026-07-24.

## 2. Vendor migration guides

Anthropic:
- Haiku 5.5 guide: "Claude 4 and later models have a more concise, direct communication style and need explicit direction." https://platform.claude.com/docs/en/models/haiku-5-5/migration-guide, not shown.
- Haiku 5.5 guide: "A `thinking` value of `{"type": "enabled", "budget_tokens": N}` returns a 400 error." Same URL, not shown.
- Haiku 5.5 guide: prefill "rejects it with a 400 error, even with thinking turned off." Same URL, not shown.
- Best practices: "Claude's latest models are trained for precise instruction following and benefit from explicit direction to use specific tools." Example: "can you suggest some changes" may yield "suggestions rather than implementing them." https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices, not shown.
- Best practices: prefilled responses "are no longer supported starting with Claude 4.6 models." Requests return 400. Same URL, not shown.
- Haiku 5.5 prompting guide: "Existing Claude Haiku 4.5 prompts should perform well without changes." https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompting-claude-haiku-5-5, not shown.

OpenAI:
- GPT-5 guide: "sections of their prompt that had been effective with earlier models needed tuning" (Cursor's experience). "GPT-5 follows prompt instructions with surgical precision." https://developers.openai.com/api/docs/guides/gpt-5, not shown.
- GPT-5 guide: "Re-evaluate prompts for agentic persistence, tool preambles, and stopping conditions." Same URL, not shown.
- GPT-5.5 upgrade guide: "replace the model string first" and "prefer prompt-only upgrades when possible." https://developers.openai.com/api/docs/guides/upgrading-to-gpt-5p5, not shown.
- GPT-5.5 upgrade guide: the upgraded model "becomes too verbose, too dense, or hard to scan unless formatting is constrained." Same URL, not shown.
- GPT-5.5 upgrade guide: "Do not claim token savings without task-level validation." Same URL, not shown.
- Prompt optimizer: "Always evaluate and manually review optimized prompts before using them in production." "it's possible for the optimized prompt to perform worse than your original on specific inputs." https://developers.openai.com/api/docs/guides/prompt-optimizer, not shown.
- Prompt optimizer: Evals "will become read-only for existing users on October 31, 2026." Platform "scheduled to shut down on November 30, 2026." Same URL, not shown.

## 3. Silent behavior drift

- Chen, Zaharia, Zou (arXiv 2307.09009): GPT-4 prime-vs-composite accuracy fell from 84% (March 2023) to 51% (June 2023). "GPT-4 became less willing to answer sensitive questions and opinion survey questions in June than in March." Code formatting errors rose for both models. No exact figures given. https://arxiv.org/abs/2307.09009, submitted 18 Jul 2023, v3 31 Oct 2023.
- Ma, Yang, Kästner (arXiv 2311.11123): "LLM APIs are often updated silently and scheduled to be deprecated." https://arxiv.org/abs/2311.11123, submitted 18 Nov 2023, v2 6 Feb 2024. Numeric results: see UNVERIFIED.
- Anthropic docs: "infrastructure updates produce minor differences in observable behavior even when the model ID and weights have not changed." https://platform.claude.com/docs/en/about-claude/models/model-ids-and-versions, not shown.
- Anthropic postmortem: Sonnet 4 misrouted requests began at 0.8% of requests. At the worst hour (Aug 31, 2025), 16% of Sonnet 4 requests were affected. "The evaluations we ran simply didn't capture the degradation users were reporting." https://www.anthropic.com/engineering/a-postmortem-of-three-recent-issues, 2025-09-17.

## 4. Aliases vs pinned snapshots

- Anthropic: "Each Claude model ID identifies a pinned version of the model." 4.6-generation IDs are not aliases: "Anthropic does not update the weights or configuration of an existing model ID. When an updated version is available, it ships under a new model ID." https://platform.claude.com/docs/en/about-claude/models/model-ids-and-versions, not shown.
- Anthropic pre-4.6 aliases: for example `claude-sonnet-4-5` "point[s] to the most recent dated snapshot for that minor version." Same URL, not shown.
- Anthropic: "`claude-haiku-5-5` is a fixed model ID with no date suffix and no separate alias." https://platform.claude.com/docs/en/models/haiku-5-5/migration-guide, not shown.
- Google: a "latest" alias "will get hot-swapped with every new release of a specific model variation." Example: `gemini-flash-latest`. For breaking changes, "a 2-week notice will be provided through email." https://ai.google.dev/gemini-api/docs/models, 2026-10-22.
- OpenAI deprecations include "-latest" aliases, for example chatgpt-4o-latest (shutdown 2026-02-17) and gpt-5-chat-latest (shutdown 2026-07-23). https://developers.openai.com/api/docs/deprecations, not shown.
- Azure: `versionUpgradeOption` values are `OnceNewDefaultVersionAvailable`, `OnceCurrentVersionExpired`, and `NoAutoUpgrade` ("deployment stops working at retirement"). https://learn.microsoft.com/en-us/azure/foundry/openai/concepts/model-retirements, 2026-07-24.

## 5. Shadow, canary, and A/B rollout

- Microsoft Foundry: six phases, "Discover → Assess → Adapt → Validate → Roll out → Retire." https://learn.microsoft.com/en-us/azure/foundry/foundry-models/concepts/model-migration, ms.date 2026-08-19, updated 2026-08-26.
- Microsoft: "Replay unchanged before you tune. Run your current configuration on the target model without any changes." Same URL, 2026-08-19.
- Microsoft: "Run the identical set of evaluators against both source and target on the frozen dataset." Same URL, 2026-08-19.
- Microsoft: "When you can't canary, use shadow or mirror mode." Same URL, 2026-08-19.
- Microsoft: embedded teams "typically want about 30 days" for a rollback corridor. Same URL, 2026-08-19.
- Tian Pan (individual engineer, not a vendor), 2026-04-20: shadow mode "one to two weeks", then canary "5% → 25% → 50% → 100%", each step held "at least 4–6 hours." Rollback if error rate "above 5% (baseline under 1%)" or semantic quality "down more than 5 percentage points." These thresholds are the author's recommendations, not measured results. https://tianpan.co/blog/2026/04/20/llm-model-migration-production-playbook

## 6. Prompts tuned to old model quirks

- Not Diamond (vendor, 2025-09-30), Banking77 intent classification, 200-sample subset: GPT-4o with the original prompt 82.5%. Sonnet 4 with the same prompt 80%. Sonnet 4 with a rewritten prompt 89%. Manual rewriting "can take up to 40 hours." https://www.notdiamond.ai/blog/better-models-worse-results
- Anthropic Haiku 5.5 prompting guide: a blanket "search for any present-day factual question" instruction "made the model search on half of the prompts that needed no search. It didn't produce more correct answers." https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompting-claude-haiku-5-5, not shown.
- Tripathi et al. (Tursio), arXiv 2507.05573: "structured prompt migration can fully recover the application reliability" that "was lost due to model drift." Numbers are in the full paper (see UNVERIFIED). https://arxiv.org/abs/2507.05573, submitted 2025-07-08.

## 7. Tokenizer changes

- Anthropic Haiku 5.5 guide: "the same input text produces approximately 30 percent more tokens on Claude Haiku 5.5 than on Claude Haiku 4.5." https://platform.claude.com/docs/en/models/haiku-5-5/migration-guide, not shown.
- Anthropic Sonnet 5.5 guide: "about 30 percent more tokens" versus Sonnet 4.6, 4.5, and Haiku 4.5. https://platform.claude.com/docs/en/models/sonnet-5-5/migration-guide, not shown.
- Haiku 5.5 image cost: a 2,000 by 1,500 px image "costs about 2.5 times as many visual tokens on Claude Haiku 5.5 as on Claude Haiku 4.5." Same Haiku guide, not shown.
- Anthropic models overview: "1M tokens is roughly 555k words" on the current tokenizer, versus "about 750k words" for earlier models. https://platform.claude.com/docs/en/models/overview, not shown.
- Tian Pan (individual blog, 2026-04-20): "Claude can produce 5–15% more tokens than GPT-4 for identical English text." Secondary claim; the author does not cite a measurement. Same URL as section 5.

## 8. Field notes

Only one company-authored write-up with verified content was found.

- Tripathi et al. (Tursio), arXiv 2507.05573, 2025-07-08: a case study of successive GPT upgrades in an enterprise search product. See section 6 for the quote.
- Not company write-ups, but loaded and relevant: Tian Pan (section 5), Anthropic postmortem (section 3), Not Diamond (section 6).
- No company engineering blog with before-and-after eval, latency, or cost numbers was found. Searches for LinkedIn, Shopify, Notion, Intercom, Klarna, Airbnb, DoorDash, Pinterest, and Instacart returned no model-migration write-up. The target of 4 to 6 was not met.

## UNVERIFIED

- UNVERIFIED: OpenAI "Sycophancy in GPT-4o" post (https://openai.com/index/sycophancy-in-gpt-4o/). HTTP 403.
- UNVERIFIED: Ma et al. numbers (58.8% of combinations drop; 70.2% of those drop over 5%; simplest prompt drops in 75% of updates; few-shot in 45%; 87.9% of improving updates regress at least one case). Taken from a search snippet. PDF was binary and unreadable.
- UNVERIFIED: OpenAI's own alias and snapshot policy page. Not found. Section 4 uses only deprecation entries.
- UNVERIFIED: OpenAI tokenizer change note. Not found.
- UNVERIFIED: Tursio migration effort ("a couple of months" reduced to "a couple of weeks") and all Tursio figures. Full paper not loaded.
- UNVERIFIED: Company field notes. Target was 4 to 6 with numbers; 0 company-authored write-ups with numbers were verified.
- UNVERIFIED: Azure retirement schedule page (model-retirement-schedule). Not loaded; section 1 uses the lifecycle page only.

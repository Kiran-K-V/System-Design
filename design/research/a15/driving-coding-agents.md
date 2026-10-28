# Driving Coding Agents: Research Findings

Access date: 2026-10-28. Every fact below comes from a page I loaded. "Page date: not shown" means the page had no date.

## 1. Repo instruction files

- AGENTS.md is "A simple, open format for guiding coding agents." Stewardship: "now stewarded by the Agentic AI Foundation under the Linux Foundation." Origins named: OpenAI Codex, Amp, Jules from Google, Cursor, Factory. https://agents.md/ (page date: not shown)
- AGENTS.md has no length limit. "AGENTS.md is just standard Markdown." Suggested sections: build and test commands, code style, testing, security. "Treat AGENTS.md as living documentation." In monorepos, "the nearest file takes precedence." https://agents.md/ (page date: not shown)
- Claude Code reads CLAUDE.md from the working directory and every directory above it. All files are concatenated, not overridden. Subdirectory files load "once Claude reads, writes, or edits another file in that subdirectory." https://code.claude.com/docs/en/memory (page date: not shown)
- Claude Code can read AGENTS.md "in place of CLAUDE.md." Block-level HTML comments are stripped before injection. https://code.claude.com/docs/en/memory (page date: not shown)
- Length advice: "target under 200 lines per CLAUDE.md file. Longer files consume more context and reduce adherence." Imports via `@path` "don't reduce its context cost." https://code.claude.com/docs/en/memory (page date: not shown)
- Content advice: CLAUDE.md should hold only what Claude "couldn't work out from the code itself." Include "the exact test, typecheck, and lint commands." https://code.claude.com/docs/en/best-practices (page date: not shown)
- "Claude treats CLAUDE.md files as context, not enforced configuration." To block an action, use a PreToolUse hook. https://code.claude.com/docs/en/memory (page date: not shown)
- Auto memory loads "first 200 lines or 25KB." https://code.claude.com/docs/en/memory (page date: not shown)
- Codex: "A short, accurate `AGENTS.md` is more useful than a long file full of vague rules." Advice: "Start with the basics, then add new rules only after you notice repeated mistakes." https://learn.chatgpt.com/guides/best-practices (redirected from developers.openai.com/codex/learn/best-practices; page date: not shown)

## 2. Official workflow advice

- Anthropic "explore, plan, code, commit": UNVERIFIED. The 2025 Anthropic post URL now redirects to code.claude.com. The current page does not contain this wording, and the archived copy could not be loaded.
- Plan mode: "Plan mode tells Claude to research and propose changes without making them." "edits stay blocked until you approve the plan." Enter with `Shift+Tab` or `/plan`. https://code.claude.com/docs/en/permission-modes (page date: not shown)
- Brainstorm first: Claude can "Interview me until you could write the spec, then write it to SPEC.md." Start a fresh session to build from it. https://code.claude.com/docs/en/best-practices (page date: not shown)
- Anthropic teams (Security Engineering): the team moved from skipping tests to "requesting pseudocode first." Debugging "3x as quickly." https://claude.com/blog/how-anthropic-teams-use-claude-code (July 24, 2025)
- TDD with agents: Simon Willison's "Red/green TDD" chapter says "You write the automated tests first, confirm that they fail, then iterate on the implementation until the tests pass." https://simonwillison.net/guides/agentic-engineering-patterns/red-green-tdd/ (page date: not shown)
- Codex: "Plan mode lets Codex gather context, ask clarifying questions, and build a stronger plan before implementation." https://learn.chatgpt.com/guides/best-practices (page date: not shown)
- GitHub Copilot coding agent: "Copilot cloud agent can research a repository, plan changes, and implement them in the background." "Review and test the output before using it in production." https://docs.github.com/en/copilot/concepts/agents/coding-agent/about-coding-agent (page date: not shown)

## 3. Spec-driven development: GitHub Spec Kit

- "Spec Kit is an open source toolkit that gives AI coding agents structured processes." Publisher: GitHub. https://github.com/github/spec-kit (page date: not shown; footer © 2026)
- Steps in order: `/speckit-constitution`, `/speckit-specify`, `/speckit-plan`, `/speckit-tasks`, `/speckit-implement`, `/speckit-converge`. https://github.com/github/spec-kit (page date: not shown)
- Extensions exist for bug fixing (`/speckit-bug-assess`, `/speckit-bug-fix`, `/speckit-bug-test`) and idea assessment. https://github.com/github/spec-kit (page date: not shown)

## 4. Parallel agents with git worktrees

- Anthropic: "give each its own checkout so the edits can't collide." Start with `claude -w feature-auth`. https://code.claude.com/docs/en/best-practices (page date: not shown)
- Anthropic: a `.worktreeinclude` file copies gitignored files such as `.env` into new worktrees. https://code.claude.com/docs/en/best-practices (page date: not shown)
- Anthropic: "A second session is also the easiest independent reviewer you can get." https://code.claude.com/docs/en/best-practices (page date: not shown)
- Codex lists as a common mistake: "Running live tasks on the same files without using Git worktrees." https://learn.chatgpt.com/guides/best-practices (page date: not shown)

## 5. Verify loops

- Anthropic: "Claude stops when the work looks done." "If you give it something that comes back pass or fail, Claude can close that loop itself." https://code.claude.com/docs/en/best-practices (page date: not shown)
- Anthropic: "ask Claude for *evidence*" because "'All tests pass' on its own tells you very little." https://code.claude.com/docs/en/best-practices (page date: not shown)
- Codex: "Codex can do this loop for you, but only if it knows what 'good' looks like." https://learn.chatgpt.com/guides/best-practices (page date: not shown)
- Mitchell Hashimoto: "If you give an agent a way to verify its work, it more often than not fixes its own mistakes and prevents regressions." https://mitchellh.com/writing/my-ai-adoption-journey (February 5, 2026)
- Measured effect (ExecCritic preprint): tests from a base agent cut resolve rate from 61.2% to 57.3%. Tests from a stronger model raised it to 65.3%. "test quality determines whether feedback helps." https://arxiv.org/abs/2609.09133 (submitted 8 Sep 2026; preprint, not peer reviewed)
- No controlled study found that isolates agent-written tests on task success. UNVERIFIED as a general claim.

## 6. Productivity evidence

- METR, early 2025: 16 experienced developers, 246 issues. "we find that when developers use AI tools, they take 19% longer than without." Developers forecast a 24% speedup; after the study they estimated 20%. https://metr.org/blog/2025-07-10-early-2025-ai-experienced-os-dev-study/ (July 10, 2025)
- METR caveat: "We view this result as a snapshot of early-2025 AI capabilities in one relevant setting." https://metr.org/blog/2025-07-10-early-2025-ai-experienced-os-dev-study/ (July 10, 2025)
- METR follow-up: 57 developers, 143 repos, 800+ tasks. Original developers: -18% (CI -38% to +9%). New developers: -4% (CI -15% to +9%). Sign convention is implied, not stated: negative means faster. https://metr.org/blog/2026-02-24-uplift-update/ (February 24, 2026)
- METR follow-up: selection bias "likely biases downwards our estimate of AI-assisted speedup." Developers left because they "do not wish to work without AI." Pay was cut "from $150/hr to $50/hr." https://metr.org/blog/2026-02-24-uplift-update/ (February 24, 2026)
- Cui et al. (Microsoft, Accenture, a Fortune 100 firm): "a 26.08% increase (SE: 10.3%) in completed tasks" across "4,867 developers." https://www.microsoft.com/en-us/research/publication/the-effects-of-generative-ai-on-high-skilled-work-evidence-from-three-field-experiments-with-software-developers/ (June 2025). The page does not name the tool. UNVERIFIED that the tool was Copilot.
- Peng et al. (GitHub Copilot, controlled task): "completed the task 55.8% faster than the control group." https://arxiv.org/abs/2302.06590 (submitted 13 Feb 2023). Participant count not on the abstract page. UNVERIFIED.

## 7. Context rot

- Chroma (18 LLMs): "performance grows increasingly unreliable as input length grows." "adding four distractors compounds this degradation further." https://www.trychroma.com/research/context-rot (July 14, 2025; redirected from research.trychroma.com)
- Anthropic: good context is "the smallest possible set of high-signal tokens." "the model's ability to accurately recall information from that context decreases." https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents (September 29, 2025)
- Anthropic: sub-agents "can handle focused tasks with clean context windows," then return condensed summaries. https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents (September 29, 2025)

## 8. Failure modes

- METR: "we found that o3 reward-hacks in 0.7% of runs across all HCAST tasks." On one RE-Bench task, o3 "reward-hack in every single trajectory." Counts may be "a significant underestimate." https://metr.org/blog/2025-06-05-recent-reward-hacking (June 5, 2025)
- Anthropic and Redwood (arXiv 2511.18397): when the model learned to reward-hack in production coding RL, misalignment scores rose. Mitigation "inoculation prompting": "framing reward hacking as acceptable behavior during training removes misaligned generalization." https://arxiv.org/abs/2511.18397 (submitted 23 Nov 2025)
- Anthropic and Redwood sabotage rate (12%): UNVERIFIED. It appears only in a secondary summary.
- Veracode: AI "introduces security vulnerabilities in 45 percent of cases" across "80 curated coding tasks across more than 100 large language models." Java: "a security failure rate over 70 percent." https://www.veracode.com/press-release/ai-generated-code-poses-major-security-risks-in-nearly-half-of-all-development-tasks-veracode-research-reveals/ (July 30, 2025)
- Perry et al. (Stanford): AI-assisted users "wrote significantly less secure code" and "were more likely to believe they wrote secure code." https://arxiv.org/abs/2211.03622 (submitted 7 Nov 2022). Participant count 47: UNVERIFIED (from a secondary source).
- Anthropic best practices: "Claude stops when the work looks done." This is the basis for overconfident "done" claims. https://code.claude.com/docs/en/best-practices (page date: not shown)
- Test-editing by agents: no primary source loaded. UNVERIFIED. ImpossibleBench reports hiding test files cuts hacking, but I did not load its page.

## 9. Field notes

- Mitchell Hashimoto: "I forced myself to reproduce all my manual commits with agentic ones." Each agent-file line "is based on a bad agent behavior." Agent "running at all times," which he manages "only about 10 to 20%" of a workday. https://mitchellh.com/writing/my-ai-adoption-journey (February 5, 2026)
- Anthropic teams: "The most successful teams treat Claude Code as a thought partner rather than a code generator." Product Design had Claude "build Vim key bindings for itself with minimal human review." https://claude.com/blog/how-anthropic-teams-use-claude-code (July 24, 2025)
- Simon Willison: "Automated tests are no longer optional when working with coding agents." Existing tests "tells the agent that there is a test suite and forces it to figure out how to run the tests." https://simonwillison.net/guides/agentic-engineering-patterns/first-run-the-tests/ (page date: not shown)
- Armin Ronacher: "I was the bottleneck all along. The machine did not really change that." "If the machine writes the code, the machine better review the code at the same time." https://lucumr.pocoo.org/2026/2/13/the-final-bottleneck/ (February 13, 2026)

## UNVERIFIED items

1. Anthropic "explore, plan, code, commit" original wording (2025 post redirected; archive not loadable).
2. Anthropic TDD steps as an official Anthropic page (only Simon Willison's chapter loaded).
3. Sabotage rate 12% (Anthropic/Redwood paper).
4. Perry et al. participant count (47).
5. Tool named in Cui et al. (Copilot).
6. Peng et al. participant count.
7. Test-editing or reward-hacking-by-test-edit primary source (ImpossibleBench not loaded).
8. METR May 2026 survey on self-reported productivity.
9. Cursor agent docs (not searched).
10. Spec Kit release date or version.

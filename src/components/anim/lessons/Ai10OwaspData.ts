/** Data for lesson A10.7. Titles and controls come from the OWASP Top 10 for LLM Applications 2025 risk pages (read 2026-10-16). Tests are this lesson's own suggestions. */

export interface Entry {
  id: string;
  title: string;
  /** Node ids lit in the architecture picture. */
  lit: string[];
  /** One plain sentence: what goes wrong. */
  what: string;
  /** Three design controls, each a short plain phrase. */
  controls: [string, string, string];
  test: string;
  /** Lesson link (path under /learn/ai/) or empty. */
  lesson: string;
}

export const ENTRIES: Entry[] = [
  {
    id: 'LLM01',
    title: 'Prompt Injection',
    lit: ['user', 'model'],
    what: 'Text the model reads changes what it does.',
    controls: ['Model treated as an untrusted user', 'Output format checked by plain code', 'Human approval for high-risk actions'],
    test: 'Replay a saved set of poisoned documents. Fail if any tool call falls outside the allowed set.',
    lesson: 'a10-safety/prompt-injection',
  },
  {
    id: 'LLM02',
    title: 'Sensitive Information Disclosure',
    lit: ['app', 'user'],
    what: 'Personal or secret data reaches someone who should not see it.',
    controls: ['Data scrubbed before logs and training', 'Least-privilege access to data sources', 'Clear retention and deletion policy'],
    test: 'Plant fake personal data (canaries) in test traffic. Search logs, indexes, and replies for them.',
    lesson: 'a10-safety/pii-privacy',
  },
  {
    id: 'LLM03',
    title: 'Supply Chain',
    lit: ['supplier', 'model'],
    what: 'A model, adapter, library, or dataset you depend on is tampered with.',
    controls: ['Models from verifiable sources, with hashes', 'Inventory of every model and package', 'Supplier terms and security reviewed'],
    test: 'In the build, compare every model file hash with the inventory. Re-run your eval set when a model changes.',
    lesson: 'a9-llmops/versioning',
  },
  {
    id: 'LLM04',
    title: 'Data and Model Poisoning',
    lit: ['supplier', 'index'],
    what: 'Bad data in training, tuning, or indexing plants a flaw or a backdoor.',
    controls: ['Data origin tracked and versioned', 'Data vendors vetted', 'Behavior monitored and red-teamed'],
    test: 'Keep a set of trigger probes. Run it before and after every data change and compare.',
    lesson: 'a8-evals/golden-sets',
  },
  {
    id: 'LLM05',
    title: 'Improper Output Handling',
    lit: ['app', 'sink'],
    what: 'Model output is trusted by the next system, which then acts on it.',
    controls: ['Output treated as untrusted input', 'Encoding fitted to where it lands', 'Parameterized queries only'],
    test: 'Send replies that hold script tags, SQL, and path tricks to each sink. Pass only if all stay inert.',
    lesson: 'a9-llmops/guardrails-pipeline',
  },
  {
    id: 'LLM06',
    title: 'Excessive Agency',
    lit: ['tools'],
    what: 'The model can do more than its job needs, so one mistake does real damage.',
    controls: ['Fewest tools and narrowest functions', 'Calls run with the user\'s own scoped token', 'Human approval and server-side checks'],
    test: 'Call each tool with a token that lacks the scope. Expect a refusal from the tool API.',
    lesson: 'a10-safety/tool-permissions',
  },
  {
    id: 'LLM07',
    title: 'System Prompt Leakage',
    lit: ['app', 'model'],
    what: 'Hidden instructions are shown, and they held secrets or rules you relied on.',
    controls: ['No secrets in the prompt', 'Access rules enforced outside the model', 'Independent check on replies'],
    test: 'Run a secret scanner over prompt files in the build. Run extraction attempts against the live app.',
    lesson: '',
  },
  {
    id: 'LLM08',
    title: 'Vector and Embedding Weaknesses',
    lit: ['index'],
    what: 'The search index leaks across users or accepts poisoned documents.',
    controls: ['Permission-aware retrieval', 'Sources checked before indexing', 'Retrieval logged immutably'],
    test: 'Ask as user A for a known document of user B. Pass only if nothing comes back.',
    lesson: 'a5-rag/retrieval-permissions',
  },
  {
    id: 'LLM09',
    title: 'Misinformation',
    lit: ['model', 'user'],
    what: 'Confident wrong answers cause harm, including invented software packages.',
    controls: ['Answers grounded in trusted sources', 'Human review for high stakes', 'Packages and links checked to exist'],
    test: 'Score groundedness on a golden set after every change. Check each suggested package against the registry.',
    lesson: 'a5-rag/rag-evaluation',
  },
  {
    id: 'LLM10',
    title: 'Unbounded Consumption',
    lit: ['budget', 'app'],
    what: 'Heavy or endless use drains money or capacity, or copies the model.',
    controls: ['Input size limits and rate limits', 'Timeouts and per-user spend caps', 'Limited exposure of logprobs'],
    test: 'Load-test with oversized and looping inputs. Pass only if the cap stops spend at its limit.',
    lesson: 'a7-agents-prod/loop-control',
  },
];

export function coverage(checked: Record<string, boolean[]>) {
  const rows = ENTRIES.map((e) => {
    const c = checked[e.id] ?? [false, false, false];
    const done = c.filter(Boolean).length;
    return { id: e.id, title: e.title, done, open: e.controls.filter((_, i) => !c[i]) };
  });
  const total = rows.reduce((a, r) => a + r.done, 0);
  return { rows, total, openCount: ENTRIES.length * 3 - total };
}

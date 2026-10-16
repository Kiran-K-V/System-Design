/** Logic for lesson A10.1 (threat model). Pure functions, no React. The class-to-component mapping is the lesson author's reading of the OWASP list, not an OWASP table. */

export type Part = 'train' | 'index' | 'prompt' | 'model' | 'tools' | 'render' | 'meter';

export const PARTS: { id: Part; label: string }[] = [
  { id: 'train', label: 'Training data' },
  { id: 'prompt', label: 'System prompt' },
  { id: 'index', label: 'Vector index' },
  { id: 'model', label: 'Model + context' },
  { id: 'tools', label: 'Tools' },
  { id: 'render', label: 'Output renderer' },
  { id: 'meter', label: 'Usage meter' },
];

export interface OwaspClass {
  id: string;
  title: string;
  hits: Part[];
  /** How the risk reaches the system. */
  how: string;
}

/** Titles are the OWASP Top 10 for LLM Applications 2025 (genai.owasp.org/llm-top-10/). */
export const CLASSES: OwaspClass[] = [
  { id: 'LLM01', title: 'Prompt Injection', hits: ['model', 'index', 'tools'], how: 'Text from users, retrieved chunks, and tool results lands in the context and steers the model.' },
  { id: 'LLM02', title: 'Sensitive Information Disclosure', hits: ['model', 'index', 'render'], how: 'Private data enters the context from the index or tools, then leaves in the answer.' },
  { id: 'LLM03', title: 'Supply Chain', hits: ['train', 'model', 'tools'], how: 'A third-party model, dataset, package, or tool server brings in code or text you did not write.' },
  { id: 'LLM04', title: 'Data and Model Poisoning', hits: ['train', 'index'], how: 'Bad records in training data or in the retrieval index change what the model learns or retrieves.' },
  { id: 'LLM05', title: 'Improper Output Handling', hits: ['render', 'tools'], how: 'Model output is passed on unchecked: rendered as HTML, run as code, or used as a tool argument.' },
  { id: 'LLM06', title: 'Excessive Agency', hits: ['tools'], how: 'The agent holds more functions, permissions, or autonomy than the task needs.' },
  { id: 'LLM07', title: 'System Prompt Leakage', hits: ['prompt', 'render'], how: 'Secrets or rules placed in the system prompt come out in an answer.' },
  { id: 'LLM08', title: 'Vector and Embedding Weaknesses', hits: ['index'], how: 'Retrieval returns chunks the caller should not see, or chunks an attacker planted.' },
  { id: 'LLM09', title: 'Misinformation', hits: ['model', 'render'], how: 'The model states false content with confidence and the user acts on it.' },
  { id: 'LLM10', title: 'Unbounded Consumption', hits: ['model', 'meter'], how: 'Requests or agent loops use more tokens, calls, or money than you planned.' },
];

/** How many classes touch each part. */
export function hitCounts(): Record<Part, number> {
  const out = Object.fromEntries(PARTS.map((p) => [p.id, 0])) as Record<Part, number>;
  for (const c of CLASSES) for (const p of c.hits) out[p] += 1;
  return out;
}

/** Meta's Agents Rule of Two (2025-10-31): three properties, at most two per session. */
export const RULE_PROPS = 3;
export const combos = 2 ** RULE_PROPS;
/** Only the full set of all three is forbidden. */
export const allowedCombos = combos - 1;

/** Cost to screen one tool result with a small model, in dollars. Prices are per million tokens. */
export function screenCost(inTokens: number, outTokens: number, inPrice: number, outPrice: number): number {
  return (inTokens * inPrice + outTokens * outPrice) / 1e6;
}

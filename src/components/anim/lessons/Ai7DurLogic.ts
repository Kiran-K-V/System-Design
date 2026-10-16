/** Logic for the A7.1 durable-run widgets. Pure functions. Counts are for the illustrative 5-node run below. */

export const NODES = [
  { name: 'plan', llm: true },
  { name: 'search', llm: false },
  { name: 'summarize', llm: true },
  { name: 'draft', llm: true },
  { name: 'send email', llm: false, email: true },
] as const;

export type Mode = 'scratch' | 'resume' | 'replay';

/** Illustrative: 8,000 input and 1,000 output tokens per LLM node at Sonnet 5.5 list price ($2 and $10 per MTok). */
export const COST_PER_LLM_CALL = (8000 * 2 + 1000 * 10) / 1e6; // 0.026
export const BASE_LLM_CALLS = NODES.filter((n) => n.llm).length; // 3

export interface Opts {
  mode: Mode;
  /** Node (1 to 5) that is running when the worker dies. Ignored in replay mode. */
  crashAt: number;
  /** Only for node 5: the worker dies after the email left, before the checkpoint was written. */
  afterSend: boolean;
  /** The mail call carries an idempotency key, so the mail API drops a repeat. */
  idemKey: boolean;
}

export interface Out {
  llmCalls: number;
  extraLlm: number;
  extraCost: number;
  sends: number;
  delivered: number;
}

export function simulate(o: Opts): Out {
  let llm = 0;
  let sends = 0;
  const run = (from: number, to: number) => {
    for (let i = from; i <= to; i++) {
      if (NODES[i - 1].llm) llm++;
      if ('email' in NODES[i - 1]) sends++;
    }
  };
  if (o.mode === 'replay') {
    run(1, 5); // the first complete run
    run(3, 5); // replay from checkpoint 2
  } else {
    run(1, o.crashAt - 1); // finished nodes before the crash
    const n = NODES[o.crashAt - 1]; // the node in flight when the worker died
    if (n.llm) llm++;
    if ('email' in n && o.afterSend) sends++;
    run(o.mode === 'scratch' ? 1 : o.crashAt, 5);
  }
  const delivered = o.idemKey ? Math.min(sends, 1) : sends;
  const extraLlm = llm - BASE_LLM_CALLS;
  return { llmCalls: llm, extraLlm, extraCost: extraLlm * COST_PER_LLM_CALL, sends, delivered };
}

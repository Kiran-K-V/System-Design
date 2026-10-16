/** Logic for the tool-failure simulator in lesson A3.4. Pure functions, no React. The "model" behavior is scripted and illustrative. */

export type Outcome = 'ok' | 'instructive' | 'vague' | 'missing' | 'crash';

export interface Result {
  tool_use_id: string;
  content: string;
  is_error?: boolean;
}

export interface Round {
  /** Tool calls the model emitted in this round. */
  calls: { id: string; name: string; input: string }[];
  /** tool_result blocks your code sent back. Empty when it sent none. */
  results: Result[];
}

export interface Run {
  rounds: Round[];
  status: 'done' | 'gave_up' | 'http400' | 'crash';
  /** Calls to the model API that were served (not counting a rejected one). */
  modelCalls: number;
  final: string;
  note: string;
}

const PARIS = { id: 'toolu_01', name: 'get_weather', input: '{"city": "Paris"}' };
const TOKYO = { id: 'toolu_02', name: 'get_weather', input: '{"city": "Tokyo"}' };

/** cap = the most tool rounds your loop allows before it stops. */
export function simulate(outcome: Outcome, cap: number): Run {
  const okParis: Result = { tool_use_id: 'toolu_01', content: '18 C, clear' };
  if (outcome === 'ok') {
    return {
      rounds: [{ calls: [PARIS, TOKYO], results: [okParis, { tool_use_id: 'toolu_02', content: '24 C, cloudy' }] }],
      status: 'done',
      modelCalls: 2,
      final: 'Paris is 18 C and clear. Tokyo is 24 C and cloudy.',
      note: 'Two model calls: one to ask for the tools, one to write the answer.',
    };
  }
  if (outcome === 'instructive') {
    return {
      rounds: [{ calls: [PARIS, TOKYO], results: [okParis, { tool_use_id: 'toolu_02', content: 'Rate limit exceeded. Retry after 60 seconds.', is_error: true }] }],
      status: 'done',
      modelCalls: 2,
      final: 'Paris is 18 C and clear. I could not get Tokyo right now. The weather service asks for a 60-second wait.',
      note: 'The error text says what happened and what to do next, so the model can report it or plan a retry.',
    };
  }
  if (outcome === 'vague') {
    const rounds: Round[] = [];
    for (let r = 1; r <= cap; r++) {
      const err: Result = { tool_use_id: TOKYO.id, content: 'failed', is_error: true };
      rounds.push(r === 1 ? { calls: [PARIS, TOKYO], results: [okParis, err] } : { calls: [{ ...TOKYO, id: `toolu_0${r + 2}` }], results: [{ ...err, tool_use_id: `toolu_0${r + 2}` }] });
    }
    return {
      rounds,
      status: 'gave_up',
      modelCalls: cap,
      final: 'Stopped by your loop cap. Paris is 18 C. Tokyo failed.',
      note: 'The word "failed" gives no next step, so the scripted model calls the same tool again each round. Only your cap stops it. Real models may behave differently. The cap is the safety net.',
    };
  }
  if (outcome === 'missing') {
    return {
      rounds: [{ calls: [PARIS, TOKYO], results: [okParis] }],
      status: 'http400',
      modelCalls: 1,
      final: 'HTTP 400 from the API.',
      note: 'The model made two tool_use blocks, so the next message needs two tool_result blocks. The docs say a request with a tool_use id and no matching tool_result fails with a 400 ("tool_use ids were found without tool_result blocks immediately after").',
    };
  }
  return {
    rounds: [{ calls: [PARIS, TOKYO], results: [] }],
    status: 'crash',
    modelCalls: 1,
    final: 'HTTP 500 to your user.',
    note: 'The tool code threw and nothing caught it. The loop died with the conversation half done. Catch tool errors and send them back as results with is_error set to true.',
  };
}

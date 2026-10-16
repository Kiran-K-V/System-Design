/** Logic for the graph stepper in lesson A6.3. Pure functions, no React. Models a two-node agent graph: agent and tools. */

export type At = 'agent' | 'tools' | 'END';
export type Status = 'running' | 'done' | 'budget' | 'recursion';
export type Choice = 'call' | 'answer' | 'ok' | 'error';

export interface State {
  /** State key `messages`. Reducer: append. */
  messages: number;
  /** State key `steps`. Reducer: replace. Counts model calls. */
  steps: number;
  /** State key `errors`. Counts failed tool results. */
  errors: number;
  /** True when the last model reply asked for tools. */
  pending: boolean;
  /** Node runs so far. LangGraph calls a round of node runs a super-step. */
  supersteps: number;
  at: At;
  status: Status;
  log: string[];
}

export interface Config {
  /** Exit guard: stop when steps reaches this number and the model still wants tools. */
  max: number;
  /** When false, the router has no budget check. */
  guard: boolean;
  /** Last-resort cap on node runs, like recursion_limit. */
  limit: number;
}

export const initial = (): State => ({ messages: 1, steps: 0, errors: 0, pending: false, supersteps: 0, at: 'agent', status: 'running', log: ['START -> agent'] });

/** The conditional edge after the agent node. Reads state only. */
export function route(s: State, c: Config): At {
  if (!s.pending) return 'END';
  if (c.guard && s.steps >= c.max) return 'END';
  return 'tools';
}

/** Choices the user may pick at the current node. */
export function choices(s: State): Choice[] {
  if (s.status !== 'running') return [];
  return s.at === 'agent' ? ['call', 'answer'] : ['ok', 'error'];
}

/** Run the current node with the chosen outcome, then follow the outgoing edge. Returns a new state. */
export function step(s: State, choice: Choice, c: Config): State {
  if (s.status !== 'running' || !choices(s).includes(choice)) return s;
  const n: State = { ...s, log: [...s.log], supersteps: s.supersteps + 1 };
  if (s.at === 'agent') {
    n.steps = s.steps + 1;
    n.messages = s.messages + 1;
    n.pending = choice === 'call';
    n.log.push(`agent -> {messages: +1, steps: ${n.steps}}`);
    const next = route(n, c);
    n.at = next;
    if (next === 'END') {
      n.status = n.pending ? 'budget' : 'done';
      n.log.push(n.pending ? `route: tool calls present but steps ${n.steps} >= ${c.max} -> END (budget)` : 'route: no tool calls -> END');
    } else {
      n.log.push(`route: tool calls present, steps ${n.steps}${c.guard ? ` < ${c.max}` : ''} -> tools`);
    }
  } else {
    n.messages = s.messages + 1;
    if (choice === 'error') n.errors = s.errors + 1;
    n.at = 'agent';
    n.log.push(`tools -> {messages: +1${choice === 'error' ? ', errors: +1' : ''}}  then edge -> agent`);
  }
  if (n.status === 'running' && n.supersteps >= c.limit) {
    n.status = 'recursion';
    n.log.push(`GraphRecursionError: ${n.supersteps} node runs reached the limit of ${c.limit}`);
  }
  return n;
}

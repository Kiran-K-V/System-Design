/** Logic for lesson A10.4 (tool permissions). Pure functions, no React. The tools, actions, and token shapes are an illustrative support agent, not a real product. */

export type Action = 'read' | 'write' | 'delete' | 'send';

export const ACTIONS: Action[] = ['read', 'write', 'delete', 'send'];

export interface ToolRow {
  id: string;
  label: string;
  actions: Action[];
}

/** 13 cells in total. */
export const ROWS: ToolRow[] = [
  { id: 'tickets', label: 'Tickets', actions: ['read', 'write', 'delete'] },
  { id: 'billing', label: 'Billing', actions: ['read', 'write'] },
  { id: 'users', label: 'Users', actions: ['read', 'write', 'delete'] },
  { id: 'files', label: 'Files', actions: ['read', 'write', 'delete'] },
  { id: 'email', label: 'Email', actions: ['read', 'send'] },
];

export const key = (tool: string, action: Action) => `${tool}.${action}`;

export const ALL_CELLS: string[] = ROWS.flatMap((r) => r.actions.map((a) => key(r.id, a)));

/** The task: triage my open tickets. It needs three cells. */
export const TASK_CELLS = [key('tickets', 'read'), key('tickets', 'write'), key('email', 'send')];

/** What an ordinary support user may do in the product. */
export const USER_CELLS = [
  key('tickets', 'read'), key('tickets', 'write'),
  key('billing', 'read'),
  key('users', 'read'),
  key('files', 'read'), key('files', 'write'),
  key('email', 'read'), key('email', 'send'),
];

export type TokenKind = 'admin' | 'user' | 'task';
export type Gate = 'none' | 'writes' | 'writes-sends';

export const TOKENS: Record<TokenKind, string[]> = { admin: ALL_CELLS, user: USER_CELLS, task: TASK_CELLS };

export function gated(cell: string, gate: Gate): boolean {
  const action = cell.split('.')[1] as Action;
  if (gate === 'none') return false;
  if (action === 'write' || action === 'delete') return true;
  return gate === 'writes-sends' && action === 'send';
}

export interface Blast {
  granted: number;
  unattended: number;
  total: number;
  /** Worst class an injected instruction could run with no human in the loop. */
  worst: 'delete' | 'send' | 'write' | 'read' | 'none';
}

export function blast(token: TokenKind, gate: Gate): Blast {
  const cells = TOKENS[token];
  const free = cells.filter((c) => !gated(c, gate));
  const has = (a: Action) => free.some((c) => c.endsWith(`.${a}`));
  const worst = has('delete') ? 'delete' : has('send') ? 'send' : has('write') ? 'write' : has('read') ? 'read' : 'none';
  return { granted: cells.length, unattended: free.length, total: ALL_CELLS.length, worst };
}

/** Chance that at least one of n independent attempts gets past a filter that catches a fraction `catchRate`. */
export function breachChance(catchRate: number, attempts: number): number {
  return 1 - Math.pow(catchRate, attempts);
}

export type CellState = 'na' | 'granted' | 'ask' | 'removed' | 'blocked' | 'denied';

/** State of one cell on step i of the animation. */
export function cellState(step: number, tool: string, action: Action): CellState {
  const k = key(tool, action);
  if (!ALL_CELLS.includes(k)) return 'na';
  if (step === 0) return 'granted';
  if (step === 1) return ['tickets', 'email'].includes(tool) ? 'granted' : 'removed';
  const need = TASK_CELLS.includes(k);
  if (step === 2) return need ? 'granted' : 'removed';
  const base: CellState = need ? (action === 'read' ? 'granted' : 'ask') : 'removed';
  if (step === 3) return base;
  // Step 4: injected text asks for tickets.delete and billing.read. Both are outside the grant.
  if (step === 4) return k === key('tickets', 'delete') || k === key('billing', 'read') ? 'blocked' : base;
  // Step 5: injected text asks to send mail. A person sees the exact call and says no.
  return k === key('email', 'send') ? 'denied' : k === key('tickets', 'delete') || k === key('billing', 'read') ? 'blocked' : base;
}

export function grantedCount(step: number): number {
  let n = 0;
  for (const r of ROWS) for (const a of r.actions) {
    const s = cellState(step, r.id, a);
    if (s === 'granted' || s === 'ask' || s === 'denied') n++;
  }
  return n;
}

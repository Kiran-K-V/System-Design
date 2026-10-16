/** Logic for lesson A7.8 (agent identity). Pure functions, no React. The API, scopes, and ticket counts are illustrative. */

export type Scope = 'tickets:read' | 'tickets:write' | 'tickets:delete' | 'billing:read' | 'billing:refund' | 'users:admin';

export interface Op {
  name: string;
  scope: Scope;
}

/** Ten operations in a made-up support API. Each needs exactly one scope. */
export const OPS: Op[] = [
  { name: 'list_tickets', scope: 'tickets:read' },
  { name: 'get_ticket', scope: 'tickets:read' },
  { name: 'add_comment', scope: 'tickets:write' },
  { name: 'close_ticket', scope: 'tickets:write' },
  { name: 'delete_ticket', scope: 'tickets:delete' },
  { name: 'get_invoice', scope: 'billing:read' },
  { name: 'refund_payment', scope: 'billing:refund' },
  { name: 'list_users', scope: 'users:admin' },
  { name: 'reset_password', scope: 'users:admin' },
  { name: 'change_role', scope: 'users:admin' },
];

export const SCOPES: Scope[] = ['tickets:read', 'tickets:write', 'tickets:delete', 'billing:read', 'billing:refund', 'users:admin'];

export type Owner = 'shared' | 'user';

/** Illustrative data: 3 tenants with 4 tickets each. */
export const TENANTS = 3;
export const TICKETS_PER_TENANT = 4;

export interface Task {
  id: string;
  label: string;
  needs: string[];
}

export const TASKS: Task[] = [
  { id: 'summary', label: 'Summarize my open tickets', needs: ['list_tickets', 'get_ticket'] },
  { id: 'close', label: 'Close my resolved ticket', needs: ['get_ticket', 'add_comment', 'close_ticket'] },
];

export interface Blast {
  /** Operations the token allows. */
  ops: string[];
  /** Tickets the token can touch. */
  tickets: number;
  /** Operation and ticket pairs an attacker could use. */
  pairs: number;
  /** Allowed operations the task does not need. */
  excess: number;
  /** Operations the task needs but the token blocks. */
  missing: string[];
}

export function blast(scopes: Scope[], owner: Owner, task: Task): Blast {
  const set = new Set(scopes);
  const ops = OPS.filter((o) => set.has(o.scope)).map((o) => o.name);
  const tickets = owner === 'shared' ? TENANTS * TICKETS_PER_TENANT : TICKETS_PER_TENANT;
  const needs = new Set(task.needs);
  return {
    ops,
    tickets,
    pairs: ops.length * tickets,
    excess: ops.filter((o) => !needs.has(o)).length,
    missing: task.needs.filter((n) => !ops.includes(n)),
  };
}

export interface Token {
  aud: string;
  scopes: Scope[];
  sub: string;
  tenant: string;
}

export type Verdict = { ok: true } | { ok: false; status: 401 | 403; why: string };

/** What a resource server must check, in order: audience, scope, then tenant of the record. */
export function check(token: Token, me: string, needScope: Scope, recordTenant: string): Verdict {
  if (token.aud !== me) return { ok: false, status: 401, why: `audience is ${token.aud}, not ${me}` };
  if (!token.scopes.includes(needScope)) return { ok: false, status: 403, why: `scope ${needScope} missing` };
  if (token.tenant !== recordTenant) return { ok: false, status: 403, why: `record belongs to ${recordTenant}, token to ${token.tenant}` };
  return { ok: true };
}

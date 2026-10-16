import { useState } from 'react';
import CacheWidgetFrame, { Seg } from './CacheWidgetFrame';
import { blast, OPS, SCOPES, TASKS, TENANTS, TICKETS_PER_TENANT, type Owner, type Scope } from './Ai7IdLogic';

export default function Ai7IdScopePicker() {
  const [owner, setOwner] = useState<Owner>('user');
  const [scopes, setScopes] = useState<Scope[]>(['tickets:read']);
  const [taskId, setTaskId] = useState('summary');
  const task = TASKS.find((t) => t.id === taskId)!;
  const b = blast(scopes, owner, task);
  const toggle = (s: Scope) => setScopes((cur) => (cur.includes(s) ? cur.filter((x) => x !== s) : [...cur, s]));
  const needs = new Set(task.needs);
  const bad = b.excess > 0 || b.tickets > TICKETS_PER_TENANT;

  return (
    <CacheWidgetFrame title="Blast radius of a leaked token" hint="Illustrative API: 10 operations, 3 users, 4 tickets each.">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <Seg label="Task" value={taskId} options={TASKS.map((t) => ({ id: t.id, label: t.label }))} onChange={setTaskId} />
      </div>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <Seg
          label="Whose rights"
          value={owner}
          options={[
            { id: 'user', label: 'The calling user' },
            { id: 'shared', label: 'Shared service account' },
          ]}
          onChange={setOwner}
        />
      </div>
      <fieldset className="mb-4">
        <legend className="mb-1 text-xs text-muted">Scopes on the token</legend>
        <div className="flex flex-wrap gap-2">
          {SCOPES.map((s) => (
            <label key={s} className={`flex cursor-pointer items-center gap-1.5 rounded-md border px-2 py-1 font-mono text-[13px] ${scopes.includes(s) ? 'border-accent bg-accent-soft' : 'border-line'}`}>
              <input type="checkbox" checked={scopes.includes(s)} onChange={() => toggle(s)} className="accent-[var(--accent)]" />
              {s}
            </label>
          ))}
        </div>
      </fieldset>
      <div className="grid gap-3 text-sm sm:grid-cols-2" aria-live="polite">
        <div className="rounded-lg border border-line p-3">
          <p className="text-xs uppercase tracking-wide text-muted">Operations the token allows</p>
          <ul className="mt-2 grid grid-cols-1 gap-1 font-mono text-[13px]">
            {OPS.map((o) => {
              const allowed = b.ops.includes(o.name);
              const needed = needs.has(o.name);
              const color = allowed && !needed ? 'var(--bad)' : allowed ? 'var(--ok)' : needed ? 'var(--warn)' : 'var(--muted)';
              const tag = allowed && !needed ? 'not needed' : allowed ? 'needed' : needed ? 'needed, blocked' : 'blocked';
              return (
                <li key={o.name} className="flex justify-between gap-2" style={{ color }}>
                  <span>{o.name}</span>
                  <span>{tag}</span>
                </li>
              );
            })}
          </ul>
        </div>
        <div className="rounded-lg border p-3" style={{ borderColor: bad ? 'var(--bad)' : 'var(--ok)' }}>
          <p className="text-xs uppercase tracking-wide text-muted">If an attacker steals the token</p>
          <p className="mt-2 font-mono text-[13px]">
            {b.ops.length} operations x {b.tickets} tickets = <span className="font-semibold">{b.pairs}</span> pairs
          </p>
          <p className="mt-1 text-muted">
            {owner === 'shared' ? `Shared account reaches all ${TENANTS} users: ${TENANTS} x ${TICKETS_PER_TENANT} = ${b.tickets} tickets.` : `User token reaches one user: ${TICKETS_PER_TENANT} tickets.`}
          </p>
          <p className="mt-2">
            Allowed but not needed for this task: <span className="font-mono">{b.excess}</span>
          </p>
          {b.missing.length > 0 && <p className="mt-1" style={{ color: 'var(--warn)' }}>The task would fail: {b.missing.join(', ')} blocked.</p>}
          <p className="mt-2 text-muted">Smallest safe choice for this task: the calling user, with only the scopes the needed operations require.</p>
        </div>
      </div>
    </CacheWidgetFrame>
  );
}

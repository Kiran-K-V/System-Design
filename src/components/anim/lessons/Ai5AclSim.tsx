import { useState } from 'react';
import CacheWidgetFrame, { Seg } from './CacheWidgetFrame';
import { CHUNKS, USERS, canRead, search, type Mode, type Scope } from './Ai5AclMath';

/** Same query, three users. Toggle index scope and filter mode to see leaks, short lists and empty lists. */
export default function Ai5AclSim() {
  const [uid, setUid] = useState('Ana');
  const [scope, setScope] = useState<Scope>('shared');
  const [mode, setMode] = useState<Mode>('post');
  const [k, setK] = useState(4);
  const u = USERS.find((x) => x.id === uid)!;
  const r = search(u, scope, mode, k);
  const verdict =
    r.leaked.length > 0
      ? { t: `Leak: ${r.leaked.length} chunk${r.leaked.length > 1 ? 's' : ''} shown that ${u.id} cannot read.`, c: 'var(--bad)' }
      : r.shown.length === 0
        ? { t: 'Empty list. No leak, but the user gets no answer.', c: 'var(--warn)' }
        : r.shown.length < k && mode === 'post'
          ? { t: `Short list: ${r.shown.length} of ${k}. No leak in the chunks.`, c: 'var(--warn)' }
          : { t: 'Safe. Every shown chunk is readable.', c: 'var(--ok)' };

  return (
    <CacheWidgetFrame title="Same query, different users" hint='query: "salary bands for engineers" (illustrative data)'>
      <div className="grid gap-4 text-sm md:grid-cols-2">
        <div className="space-y-3">
          <div className="space-y-1">
            <div className="text-xs text-muted">User</div>
            <Seg label="User" value={uid} onChange={setUid} options={USERS.map((x) => ({ id: x.id, label: `${x.id} (${x.tenant}, ${x.groups.filter((g) => g !== 'all').join('')})` }))} />
          </div>
          <div className="space-y-1">
            <div className="text-xs text-muted">Index layout</div>
            <Seg label="Index layout" value={scope} onChange={setScope} options={[{ id: 'shared', label: 'Shared index' }, { id: 'per-tenant', label: 'Index per tenant' }]} />
          </div>
          <div className="space-y-1">
            <div className="text-xs text-muted">Permission check</div>
            <Seg label="Permission check" value={mode} onChange={setMode} options={[{ id: 'none', label: 'None' }, { id: 'post', label: 'Post-filter' }, { id: 'pre', label: 'Pre-filter' }]} />
          </div>
          <div>
            <label htmlFor="a59-k" className="mb-1 flex justify-between text-xs text-muted">
              <span>Results wanted (k)</span>
              <span className="tabular-nums text-fg">{k}</span>
            </label>
            <input id="a59-k" type="range" min={1} max={6} step={1} value={k} onChange={(e) => setK(+e.target.value)} className="w-full accent-[var(--accent)]" />
          </div>
          <p className="text-xs text-muted">Post-filter: take the top k, then drop what the user cannot read. Pre-filter: the permission test runs inside the search, so the top k come from readable chunks only.</p>
        </div>
        <div className="space-y-2">
          <div className="font-medium" data-testid="acl-verdict" style={{ color: verdict.c }}>{verdict.t}</div>
          <ul className="space-y-1" data-testid="acl-list">
            {r.shown.map((c) => (
              <li key={c.id} className="flex justify-between rounded-md border px-2 py-1" style={{ borderColor: canRead(u, c) ? 'var(--border)' : 'var(--bad)', background: canRead(u, c) ? 'transparent' : 'color-mix(in srgb, var(--bad) 15%, var(--bg))' }}>
                <span>{c.title}</span>
                <span className="tabular-nums text-muted">{c.score.toFixed(2)}</span>
              </li>
            ))}
            {r.shown.length === 0 && <li className="text-muted">(nothing)</li>}
          </ul>
          {mode === 'post' && (
            <p className="text-xs text-muted" data-testid="acl-count">
              The index found {r.scanned.length} chunks and the filter dropped {r.hiddenCount}. If the UI prints "{r.scanned.length} matches", the count leaks that hidden chunks exist.
            </p>
          )}
          <p className="text-xs text-muted">Chunks in this index: {scope === 'shared' ? CHUNKS.length : CHUNKS.filter((c) => c.tenant === u.tenant).length} of {CHUNKS.length}.</p>
        </div>
      </div>
    </CacheWidgetFrame>
  );
}

import { useState } from 'react';
import CacheWidgetFrame from './CacheWidgetFrame';
import { ENTRIES, coverage } from './Ai10OwaspData';

export default function Ai10OwaspAudit() {
  const [checked, setChecked] = useState<Record<string, boolean[]>>({});
  const toggle = (id: string, i: number) =>
    setChecked((cur) => {
      const row = [...(cur[id] ?? [false, false, false])];
      row[i] = !row[i];
      return { ...cur, [id]: row };
    });
  const cov = coverage(checked);
  const worst = [...cov.rows].sort((a, b) => a.done - b.done)[0];

  return (
    <CacheWidgetFrame title="Design audit" hint="Tick each control your design already has.">
      <div className="space-y-2">
        {ENTRIES.map((e) => {
          const row = checked[e.id] ?? [false, false, false];
          const done = row.filter(Boolean).length;
          return (
            <fieldset key={e.id} className="rounded-lg border border-line p-2.5">
              <legend className="px-1 text-[13px] font-medium">
                {e.id} {e.title} <span className="font-mono text-muted">{done}/3</span>
              </legend>
              <div className="flex flex-wrap gap-2">
                {e.controls.map((c, i) => (
                  <label key={c} className={`flex cursor-pointer items-center gap-1.5 rounded-md border px-2 py-1 text-[13px] ${row[i] ? 'border-accent bg-accent-soft' : 'border-line'}`}>
                    <input type="checkbox" checked={row[i]} onChange={() => toggle(e.id, i)} className="accent-[var(--accent)]" />
                    {c}
                  </label>
                ))}
              </div>
            </fieldset>
          );
        })}
      </div>
      <div className="mt-4 rounded-lg border p-3 text-sm" style={{ borderColor: cov.openCount === 0 ? 'var(--ok)' : 'var(--warn)' }} aria-live="polite">
        <p className="font-mono text-[13px]">
          {cov.total} of 30 controls in place · {cov.openCount} open
        </p>
        {cov.total === 0 ? (
          <p className="mt-1 text-muted">Tick what your design has. The list below shows the gaps.</p>
        ) : (
          <>
            <p className="mt-1">
              Thinnest cover: <span className="font-medium">{worst.id} {worst.title}</span> ({worst.done}/3).
            </p>
            <ul className="mt-2 list-disc space-y-0.5 pl-5 text-muted">
              {cov.rows.filter((r) => r.open.length > 0 && r.done < 3).slice(0, 6).map((r) => (
                <li key={r.id}>
                  <span className="text-fg">{r.id}</span>: {r.open.join('; ')}
                </li>
              ))}
            </ul>
          </>
        )}
        <p className="mt-2 text-muted">The audit counts controls. It does not rank risks. OWASP gives no frequency data and no pass mark, so decide which gaps matter from your own threat model.</p>
      </div>
    </CacheWidgetFrame>
  );
}

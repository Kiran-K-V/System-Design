import { useState } from 'react';
import CacheWidgetFrame, { Seg } from './CacheWidgetFrame';
import { CASES, VERSIONS, diffCases, gate, score, type GateRule } from './Ai4PromptMath';

/** Version picker: pass or fail per case for each prompt version, with the diff against the previous version and a release gate. Illustrative data. */
export default function Ai4PromptVersions() {
  const [idx, setIdx] = useState(3);
  const [rule, setRule] = useState<GateRule>('no-regress');
  const cur = VERSIONS[idx];
  const prev = idx > 0 ? VERSIONS[idx - 1] : null;
  const d = prev ? diffCases(prev, cur) : { fixed: [], broken: [] };
  const verdict = prev ? gate(prev, cur, rule) : true;
  const n = CASES.length;

  return (
    <CacheWidgetFrame title="Eval score per prompt version" hint="illustrative data: 8 cases, 5 versions">
      <div className="mb-3 flex flex-wrap items-center gap-3">
        <Seg label="Prompt version" value={idx} options={VERSIONS.map((v, i) => ({ id: i, label: v.id }))} onChange={setIdx} />
        <Seg label="Release gate" value={rule} options={[{ id: 'no-regress', label: 'Gate: no new failures' }, { id: 'score', label: 'Gate: total not lower' }]} onChange={setRule} />
      </div>
      <p className="mb-3 text-sm">
        <span className="font-mono">{cur.id}</span>: {cur.change}
      </p>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[420px] border-collapse text-sm">
          <thead>
            <tr className="text-left text-xs text-muted">
              <th className="py-1 pr-2 font-medium">Case</th>
              <th className="px-2 font-medium">{prev ? prev.id : 'none'}</th>
              <th className="px-2 font-medium">{cur.id}</th>
              <th className="px-2 font-medium">Change</th>
            </tr>
          </thead>
          <tbody>
            {CASES.map((c, i) => {
              const was = prev ? prev.pass[i] : null;
              const now = cur.pass[i];
              const fixed = d.fixed.includes(i);
              const broken = d.broken.includes(i);
              return (
                <tr key={c} className="border-t border-line">
                  <td className="py-1.5 pr-2">{c}</td>
                  <td className="px-2 font-mono text-xs text-muted">{was === null ? '-' : was ? 'pass' : 'fail'}</td>
                  <td className="px-2 font-mono text-xs" style={{ color: now ? 'var(--ok)' : 'var(--bad)' }}>{now ? 'pass' : 'fail'}</td>
                  <td className="px-2 font-mono text-xs" style={{ color: fixed ? 'var(--ok)' : broken ? 'var(--bad)' : 'var(--muted)' }}>
                    {fixed ? 'fixed' : broken ? 'broken' : ''}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="mt-3 grid gap-2 text-sm sm:grid-cols-3" aria-live="polite">
        <div className="rounded-lg border border-line p-2">
          <div className="text-xs text-muted">Score</div>
          <div data-testid="score" className="font-mono text-lg">{score(cur)} / {n}</div>
        </div>
        <div className="rounded-lg border border-line p-2">
          <div className="text-xs text-muted">Against {prev ? prev.id : 'nothing'}</div>
          <div data-testid="delta" className="font-mono text-lg">+{d.fixed.length} fixed, -{d.broken.length} broken</div>
        </div>
        <div className="rounded-lg border border-line p-2">
          <div className="text-xs text-muted">Gate</div>
          <div data-testid="gate" className="font-mono text-lg" style={{ color: verdict ? 'var(--ok)' : 'var(--bad)' }}>{verdict ? 'ship' : 'blocked'}</div>
        </div>
      </div>
    </CacheWidgetFrame>
  );
}

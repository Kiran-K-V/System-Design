import { useState } from 'react';
import CacheWidgetFrame, { Seg } from './CacheWidgetFrame';
import { CANDIDATES, CASES, average, bestAverage, leadersPerCase, paretoSet } from './Ai15OptLogic';

type Mode = 'best' | 'pareto';

const SHORT: Record<string, string> = { billing: 'bill', language: 'lang' };
const SCORES = CANDIDATES.map((c) => c.scores);

export default function Ai15OptPareto() {
  const [mode, setMode] = useState<Mode>('pareto');
  const leaders = leadersPerCase(SCORES);
  const best = bestAverage(SCORES);
  const pareto = paretoSet(SCORES);
  const kept = mode === 'best' ? [best] : pareto.kept;
  const prob = (k: number) => (mode === 'best' ? (k === best ? 1 : 0) : pareto.prob[k]);
  // A case is "only solved by one prompt" when exactly one candidate leads it and the lead is a pass.
  const unique = leaders.map((l, i) => (l.length === 1 && SCORES[l[0]][i] === 1 ? l[0] : -1));
  const lostCases = CASES.filter((_, i) => unique[i] >= 0 && !kept.includes(unique[i]));

  return (
    <CacheWidgetFrame title="What the search keeps" hint="Illustrative: four prompts, six dev cases, pass or fail.">
      <div className="mb-3">
        <Seg
          label="Keep rule"
          value={mode}
          options={[
            { id: 'best', label: 'Keep the best average' },
            { id: 'pareto', label: 'Keep a Pareto set' },
          ]}
          onChange={setMode}
        />
      </div>
      <div className="overflow-x-auto" aria-live="polite">
        <table className="w-full min-w-[460px] border-collapse text-[13px]">
          <thead>
            <tr className="text-left text-muted">
              <th className="py-1 pr-2 font-medium">Prompt</th>
              {CASES.map((c) => (
                <th key={c} className="px-0.5 py-1 text-center font-medium">
                  <span title={c}>{SHORT[c] ?? c}</span>
                </th>
              ))}
              <th className="px-1 py-1 text-right font-medium">Average</th>
              <th className="px-1 py-1 text-right font-medium">Odds</th>
            </tr>
          </thead>
          <tbody>
            {CANDIDATES.map((c, k) => {
              const isKept = kept.includes(k);
              return (
                <tr key={c.id} className={isKept ? '' : 'opacity-45'} style={{ borderTop: '1px solid var(--border)' }}>
                  <td className="py-1.5 pr-2">
                    <span className="font-mono">{c.id}</span> <span className="block text-[12px] leading-tight text-muted">{c.note}</span>
                  </td>
                  {c.scores.map((v, i) => {
                    const alone = unique[i] === k;
                    return (
                      <td key={i} className="px-0.5 py-1.5 text-center">
                        <span
                          className="inline-block min-w-[2.1rem] rounded px-0.5 py-0.5 text-[12px] font-mono"
                          style={{
                            background: v ? 'color-mix(in srgb, var(--ok) 22%, transparent)' : 'color-mix(in srgb, var(--bad) 14%, transparent)',
                            outline: alone ? '2px solid var(--accent)' : 'none',
                          }}
                        >
                          {v ? 'pass' : 'fail'}
                        </span>
                      </td>
                    );
                  })}
                  <td className="px-1 py-1.5 text-right font-mono tabular-nums">{Math.round(average(c.scores) * 100)}%</td>
                  <td className="px-1 py-1.5 text-right font-mono tabular-nums">{isKept ? `${Math.round(prob(k) * 100)}%` : 'out'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-[0.95rem] leading-relaxed">
        {mode === 'best' ? (
          <>
            Only <span className="font-mono">{CANDIDATES[best].id}</span> survives. Its average is the highest, so the search drops the rest.
            {lostCases.length > 0 && (
              <>
                {' '}
                Two prompts that solve a case no other prompt solves are thrown away: <strong>{lostCases.join(' and ')}</strong> (outlined). The next rewrite starts from one prompt and never sees how those cases were solved.
              </>
            )}
          </>
        ) : (
          <>
            A prompt stays if it is the best on at least one case and no other prompt beats it everywhere. <span className="font-mono">P0</span> is dropped because <span className="font-mono">P1</span> does at least as well on every case. The next parent is drawn at random. The odds column shows the weights: how many cases each prompt still leads. A dropped prompt shows "out". The outlined cells are cases that only one prompt solves.
          </>
        )}
      </p>
    </CacheWidgetFrame>
  );
}

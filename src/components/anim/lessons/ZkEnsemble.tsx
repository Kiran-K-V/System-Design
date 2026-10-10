import { useState } from 'react';
import CacheWidgetFrame, { Seg } from './CacheWidgetFrame';
import { canWrite, majority, tolerated } from './zkQuorum';

/** Click servers to crash and restart them. Writes need a majority of the whole ensemble. */
export default function ZkEnsemble() {
  const [n, setN] = useState(5);
  const [down, setDown] = useState<boolean[]>(() => Array(7).fill(false));

  const downCount = down.slice(0, n).filter(Boolean).length;
  const up = n - downCount;
  const ok = canWrite(n, up);

  return (
    <CacheWidgetFrame title="Ensemble quorum" hint="Click a server to crash or restart it">
      <div className="mb-3 flex flex-wrap items-center gap-3">
        <span className="text-xs text-muted">Ensemble size</span>
        <Seg
          label="Ensemble size"
          value={n}
          options={[3, 4, 5, 6, 7].map((v) => ({ id: v, label: String(v) }))}
          onChange={(v) => {
            setN(v);
            setDown(Array(7).fill(false));
          }}
        />
      </div>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-7">
        {Array.from({ length: n }, (_, i) => (
          <button
            key={i}
            type="button"
            aria-pressed={down[i]}
            onClick={() => setDown((d) => d.map((v, k) => (k === i ? !v : v)))}
            className={`rounded-lg border px-2 py-3 text-sm ${down[i] ? 'border-bad bg-bad/10 text-bad line-through' : 'border-ok bg-ok/10 text-ok'}`}
          >
            Server {i + 1}
            <span className="block text-xs no-underline">{down[i] ? 'down' : 'up'}</span>
          </button>
        ))}
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <div className="rounded-lg border border-line bg-surface p-2.5">
          <div className="text-xs text-muted">Servers up</div>
          <div className="text-lg font-semibold tabular-nums">{up} of {n}</div>
        </div>
        <div className="rounded-lg border border-line bg-surface p-2.5">
          <div className="text-xs text-muted">Majority needed</div>
          <div className="text-lg font-semibold tabular-nums">{majority(n)}</div>
        </div>
        <div className="rounded-lg border border-line bg-surface p-2.5">
          <div className="text-xs text-muted">Failures tolerated</div>
          <div className="text-lg font-semibold tabular-nums">{tolerated(n)}</div>
        </div>
        <div className="rounded-lg border border-line bg-surface p-2.5">
          <div className="text-xs text-muted">Writes</div>
          <div className={`text-lg font-semibold ${ok ? 'text-ok' : 'text-bad'}`}>{ok ? 'accepted' : 'blocked'}</div>
        </div>
      </div>
      <p className="mt-3 text-sm text-muted">Try 4 and 5. Crash two servers in each. Four servers tolerate 1 failure, the same as 3, so the fourth server adds cost and no safety.</p>
    </CacheWidgetFrame>
  );
}

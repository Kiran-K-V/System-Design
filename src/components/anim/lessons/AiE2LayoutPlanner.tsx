import { useState } from 'react';
import CacheWidgetFrame, { Seg } from './CacheWidgetFrame';
import { bubbleOverIdeal, checkLayout } from './AiE2ParLogic';

const PRESETS = [
  { id: 'l8k', label: 'Llama 3 405B, 8K GPUs', tp: 8, cp: 1, pp: 16, dp: 64 },
  { id: 'l16k', label: 'Llama 3 405B, 16K GPUs', tp: 8, cp: 1, pp: 16, dp: 128 },
  { id: 'l131', label: 'Llama 3 405B, 131K context', tp: 8, cp: 16, pp: 16, dp: 8 },
  { id: 'bad', label: 'TP 16 (what not to do)', tp: 16, cp: 1, pp: 8, dp: 128 },
];
const DEG = [1, 2, 4, 8, 16, 32, 64, 128];

function Pick({ label, value, onChange, opts }: { label: string; value: number; onChange: (v: number) => void; opts: number[] }) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-8 text-xs text-muted">{label}</span>
      <Seg label={label} value={value} onChange={onChange} options={opts.map((v) => ({ id: v, label: String(v) }))} />
    </div>
  );
}

export default function AiE2LayoutPlanner() {
  const [tp, setTp] = useState(8);
  const [cp, setCp] = useState(1);
  const [pp, setPp] = useState(16);
  const [dp, setDp] = useState(128);
  const [m, setM] = useState(16);
  const r = checkLayout({ tp, cp, pp, dp }, 8);
  const bubble = bubbleOverIdeal(pp, m);

  return (
    <CacheWidgetFrame title="Layout planner" hint="8 GPUs per node, as in the Llama 3 cluster">
      <div className="mb-3 flex flex-wrap gap-2">
        {PRESETS.map((p0) => (
          <button
            key={p0.id}
            type="button"
            className="rounded-md border border-line px-2.5 py-1.5 text-xs text-muted hover:bg-surface"
            onClick={() => {
              setTp(p0.tp);
              setCp(p0.cp);
              setPp(p0.pp);
              setDp(p0.dp);
            }}
          >
            {p0.label}
          </button>
        ))}
      </div>
      <div className="space-y-2">
        <Pick label="TP" value={tp} onChange={setTp} opts={DEG.slice(0, 6)} />
        <Pick label="CP" value={cp} onChange={setCp} opts={DEG.slice(0, 6)} />
        <Pick label="PP" value={pp} onChange={setPp} opts={DEG.slice(0, 6)} />
        <Pick label="DP" value={dp} onChange={setDp} opts={DEG} />
        <label htmlFor="lp-m" className="flex items-center gap-2 text-xs">
          <span className="w-8 text-muted">m</span>
          <input id="lp-m" type="range" min={1} max={64} value={m} onChange={(e) => setM(+e.target.value)} className="flex-1 accent-[var(--accent)]" />
          <span className="w-8 tabular-nums">{m}</span>
        </label>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
        <div className="rounded-lg border border-line bg-surface p-2.5">
          <div className="text-xs text-muted">GPUs (TP x CP x PP x DP)</div>
          <div className="text-lg font-semibold tabular-nums" data-testid="lp-gpus">{r.gpus.toLocaleString('en-US')}</div>
          <div className="text-xs text-muted">{r.nodes.toLocaleString('en-US')} nodes</div>
        </div>
        <div className="rounded-lg border border-line bg-surface p-2.5">
          <div className="text-xs text-muted">Tensor group inside a node?</div>
          <div className={`text-lg font-semibold ${r.tpInNode ? 'text-ok' : 'text-bad'}`} data-testid="lp-tp">{r.tpInNode ? 'yes' : 'no'}</div>
        </div>
        <div className="rounded-lg border border-line bg-surface p-2.5">
          <div className="text-xs text-muted">Pipeline bubble, (PP-1)/m</div>
          <div className="text-lg font-semibold tabular-nums text-warn" data-testid="lp-bubble">{(bubble * 100).toFixed(0)}%</div>
        </div>
      </div>
      <p className="mt-3 text-sm" data-testid="lp-note">{r.note}</p>
      <p className="mt-2 text-xs text-muted">
        The four layouts are rows of the parallelism table in the Llama 3 paper (the last is our own bad example). The paper does not state the micro-batch count m for these runs, so the bubble figure uses the slider value and is illustrative. The planner checks only GPU count and tensor-group placement. It does not check memory.
      </p>
    </CacheWidgetFrame>
  );
}

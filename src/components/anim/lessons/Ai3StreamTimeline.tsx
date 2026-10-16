import { useState } from 'react';
import CacheWidgetFrame from './CacheWidgetFrame';
import { cancelAt, timeline } from './Ai3StreamMath';

function Slider({ id, label, value, min, max, step, shown, onChange }: { id: string; label: string; value: number; min: number; max: number; step: number; shown: string; onChange: (v: number) => void }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1 flex justify-between text-xs text-muted">
        <span>{label}</span>
        <span className="tabular-nums text-fg">{shown}</span>
      </label>
      <input id={id} type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(+e.target.value)} className="w-full accent-[var(--accent)]" />
    </div>
  );
}

export default function Ai3StreamTimeline() {
  const [n, setN] = useState(500);
  const [tps, setTps] = useState(40);
  const [ttft, setTtft] = useState(0.5);
  const [leave, setLeave] = useState(5);
  const tl = timeline(n, tps, ttft);
  const c = cancelAt(n, tps, ttft, Math.min(leave, tl.done));
  const scale = 100 / tl.done;
  const pct = (s: number) => `${Math.min(100, s * scale)}%`;

  return (
    <CacheWidgetFrame title="Blocking against streaming" hint="Your numbers. Output speed and TTFT are assumptions.">
      <div className="grid gap-4 text-sm md:grid-cols-[15rem_1fr]">
        <div className="space-y-3">
          <Slider id="ai3-n" label="Output tokens" value={n} min={50} max={2000} step={50} shown={String(n)} onChange={setN} />
          <Slider id="ai3-tps" label="Speed after first token" value={tps} min={10} max={100} step={5} shown={`${tps} tokens/s`} onChange={setTps} />
          <Slider id="ai3-ttft" label="TTFT" value={ttft} min={0.2} max={3} step={0.1} shown={`${ttft.toFixed(1)} s`} onChange={setTtft} />
          <Slider id="ai3-leave" label="User leaves at" value={leave} min={0} max={30} step={0.5} shown={`${leave.toFixed(1)} s`} onChange={setLeave} />
        </div>
        <div>
          <div className="space-y-4" role="img" aria-label="Timeline of a blocking reply and a streamed reply">
            <div>
              <p className="mb-1 text-xs text-muted">Blocking: the user sees nothing, then everything</p>
              <div className="relative h-6 rounded-sm" style={{ background: 'color-mix(in srgb, var(--muted) 12%, var(--bg))' }}>
                <div className="absolute inset-y-0 left-0 rounded-sm" style={{ width: pct(tl.blockingFirst), background: 'color-mix(in srgb, var(--bad) 35%, var(--bg))' }} />
              </div>
              <p className="mt-1 font-mono text-xs">first text at {tl.blockingFirst.toFixed(1)} s</p>
            </div>
            <div>
              <p className="mb-1 text-xs text-muted">Streaming: text appears from TTFT on</p>
              <div className="relative h-6 rounded-sm" style={{ background: 'color-mix(in srgb, var(--muted) 12%, var(--bg))' }}>
                <div className="absolute inset-y-0 left-0 rounded-sm" style={{ width: pct(tl.streamFirst), background: 'color-mix(in srgb, var(--warn) 40%, var(--bg))' }} />
                <div className="absolute inset-y-0 rounded-sm" style={{ left: pct(tl.streamFirst), width: `calc(${pct(tl.done)} - ${pct(tl.streamFirst)})`, background: 'var(--accent)', opacity: 0.85 }} />
              </div>
              <p className="mt-1 font-mono text-xs">first text at {tl.streamFirst.toFixed(1)} s, last token at {tl.done.toFixed(1)} s</p>
            </div>
          </div>
          <p className="mt-4 text-sm">
            The total is the same: <span className="font-mono">{tl.done.toFixed(1)} s</span> ({ttft.toFixed(1)} + {n} / {tps}). Streaming changes when the user first sees text, from{' '}
            <span className="font-mono">{tl.blockingFirst.toFixed(1)} s</span> to <span className="font-mono">{tl.streamFirst.toFixed(1)} s</span>.
          </p>
          <div className="mt-3 rounded-lg border border-line p-3 text-sm">
            <p className="text-xs uppercase tracking-wide text-muted">User leaves at {Math.min(leave, tl.done).toFixed(1)} s</p>
            <p className="mt-1">
              If the server stops when you disconnect: <span className="font-mono">{c.generated}</span> tokens generated, <span className="font-mono">{c.saved}</span> never generated.
            </p>
            <p className="mt-1 text-muted">If the server does not stop: all {n} tokens are generated for nobody. Test your provider. The docs I read do not say which it does.</p>
          </div>
        </div>
      </div>
    </CacheWidgetFrame>
  );
}

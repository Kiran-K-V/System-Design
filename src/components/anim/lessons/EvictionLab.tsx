import { useMemo, useState } from 'react';
import CacheWidgetFrame, { Seg } from './CacheWidgetFrame';
import { hitRate, parseTrace, simulate, type Policy } from './cacheSim';

const PRESETS = [
  { id: 'hot', label: 'Hot keys', text: 'A B A C A B D A B A E A B C A D A B A F', note: 'A and B are popular, the rest are one-offs. Frequency and recency both help.' },
  { id: 'scan', label: 'Scan', text: 'A B A B A B X1 X2 X3 X4 A B A B A B', note: 'A one-time scan (X1..X4) flushes LRU and FIFO. LFU keeps the hot keys.' },
  { id: 'shift', label: 'Shift', text: 'A B A B A B A B A B C D C D C D C D C D', note: 'The hot set changes from A,B to C,D. Old counts trap LFU. LRU adapts.' },
  { id: 'loop', label: 'Loop', text: 'A B C D A B C D A B C D A B C D', note: 'A cycle of 4 keys, bigger than a 3-key cache. Every policy gets 0 hits. Raise capacity to 4 and all three jump to 75%.' },
];

const POLICIES: { id: Policy; name: string; rule: string }[] = [
  { id: 'lru', name: 'LRU', rule: 'evict the least recently used' },
  { id: 'lfu', name: 'LFU', rule: 'evict the least often used' },
  { id: 'fifo', name: 'FIFO', rule: 'evict the oldest arrival' },
];

export default function EvictionLab() {
  const [preset, setPreset] = useState('scan');
  const [text, setText] = useState(PRESETS[1].text);
  const [cap, setCap] = useState(3);
  const [k, setK] = useState(0);
  const trace = useMemo(() => parseTrace(text), [text]);
  const kk = Math.min(k, trace.length);
  const note = PRESETS.find((p) => p.id === preset)?.note;

  const pick = (id: string) => {
    setPreset(id);
    setText(PRESETS.find((p) => p.id === id)!.text);
    setCap(3);
    setK(0);
  };

  return (
    <CacheWidgetFrame
      title="Eviction lab: one access trace, three policies"
      hint="same trace, same capacity"
      caption={
        <>
          Pick <b>Scan</b> and press <b>Run all</b>: LFU wins. Pick <b>Shift</b>: LFU loses badly. Pick <b>Loop</b>: all three fail until the cache grows to 4. No policy is best for every trace. Type your
          own keys (letters or words, split by spaces) to test an idea. Capacity is in keys, and every key has the same size here.
        </>
      }
    >
      <div className="flex flex-wrap items-center gap-3">
        <Seg value={preset} options={PRESETS.map((p) => ({ id: p.id, label: p.label }))} onChange={pick} label="Access trace" />
        <label className="flex items-center gap-2 text-sm">
          Capacity
          <input
            type="range"
            min={2}
            max={5}
            step={1}
            value={cap}
            onChange={(e) => setCap(+e.target.value)}
            className="w-24 accent-[var(--accent)]"
            aria-label="Cache capacity in keys"
          />
          <span className="w-4 font-mono tabular-nums">{cap}</span>
        </label>
      </div>
      {note && <p className="mt-2 text-sm text-muted">{note}</p>}

      <label className="mt-3 block text-sm">
        <span className="text-muted">Access trace (edit freely, max 80 keys)</span>
        <input
          type="text"
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            setPreset('custom');
            setK(0);
          }}
          className="mt-1 w-full rounded-md border border-line bg-bg px-2 py-1.5 font-mono text-sm"
        />
      </label>

      <div className="mt-3 flex flex-wrap gap-1" aria-label="Trace progress">
        {trace.map((key, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setK(i + 1)}
            title={`Run up to access ${i + 1}`}
            className={`min-w-8 rounded border px-1.5 py-0.5 font-mono text-sm ${
              i === kk - 1 ? 'border-accent bg-accent text-white' : i < kk ? 'border-line bg-surface' : 'border-line text-muted'
            }`}
          >
            {key}
          </button>
        ))}
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" onClick={() => setK(Math.max(0, kk - 1))} disabled={kk === 0} className="h-8 rounded-md border border-line px-3 text-sm hover:bg-surface disabled:opacity-40">
          Back
        </button>
        <button type="button" onClick={() => setK(Math.min(trace.length, kk + 1))} disabled={kk >= trace.length} className="h-8 rounded-md bg-accent px-3 text-sm font-medium text-white hover:opacity-90 disabled:opacity-40">
          Next access
        </button>
        <button type="button" onClick={() => setK(trace.length)} className="h-8 rounded-md border border-line px-3 text-sm hover:bg-surface">
          Run all
        </button>
        <button type="button" onClick={() => setK(0)} className="h-8 rounded-md border border-line px-3 text-sm hover:bg-surface">
          Reset
        </button>
        <span className="ml-auto self-center text-sm text-muted tabular-nums">
          access {kk} / {trace.length}
        </span>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        {POLICIES.map((p) => {
          const s = simulate(p.id, trace, cap, kk);
          const full = hitRate(simulate(p.id, trace, cap, trace.length));
          const slots = Array.from({ length: cap }, (_, i) => s.cache[i] ?? null);
          return (
            <div key={p.id} className="rounded-lg border border-line p-3">
              <div className="flex flex-wrap items-baseline justify-between gap-x-2">
                <span className="text-base font-semibold">{p.name}</span>
                <span className="text-xs text-muted">{p.rule}</span>
              </div>
              <ul className="mt-2 space-y-1.5" aria-label={`${p.name} cache contents`}>
                {slots.map((e, i) => {
                  const isLast = e && s.last && e.key === s.last.key;
                  return (
                    <li
                      key={i}
                      className={`flex h-9 items-center justify-between rounded-md border px-2 font-mono text-sm ${
                        e ? (isLast ? (s.last!.hit ? 'border-ok bg-ok/10' : 'border-accent bg-accent-soft') : 'border-line') : 'border-dashed border-line text-muted'
                      }`}
                    >
                      <span>{e ? e.key : 'empty'}</span>
                      <span className="text-xs text-muted">
                        {e ? (p.id === 'lfu' ? `used ${e.freq}x` : p.id === 'lru' ? (i === 0 ? 'newest use' : i === cap - 1 ? 'evict next' : '') : i === 0 ? 'newest' : i === cap - 1 ? 'oldest' : '') : ''}
                      </span>
                    </li>
                  );
                })}
              </ul>
              <div className="mt-2 h-5 text-sm">
                {s.last &&
                  (s.last.hit ? (
                    <span className="text-ok">{s.last.key}: hit</span>
                  ) : (
                    <span className="text-warn">
                      {s.last.key}: miss{s.last.evicted ? `, evicted ${s.last.evicted}` : ''}
                    </span>
                  ))}
              </div>
              <div className="mt-1 flex items-end justify-between">
                <div>
                  <div className="text-2xl font-semibold tabular-nums">{kk ? `${Math.round(hitRate(s) * 100)}%` : '–'}</div>
                  <div className="text-xs text-muted">
                    hit rate so far ({s.hits}/{kk})
                  </div>
                </div>
                <div className="text-right text-xs text-muted">
                  full trace
                  <div className="text-sm font-medium text-fg tabular-nums">{Math.round(full * 100)}%</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </CacheWidgetFrame>
  );
}

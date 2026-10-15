import { useState } from 'react';
import CacheWidgetFrame from './CacheWidgetFrame';
import { Card, Slider } from './AdvKit';
import { Bloom, bloomFp, bloomOptimalK, bloomPositions, observedFp } from './bigStructs';

/** Live Bloom filter. Hashing is FNV-1a with double hashing, in bigStructs.ts. Probes "probe-0" to "probe-199" are never added. */
const START = ['apple', 'plum'];

function make(m: number, k: number, items: string[]) {
  const b = new Bloom(m, k);
  items.forEach((x) => b.add(x));
  return b;
}

export default function BigBloomLab() {
  const [m, setM] = useState(64);
  const [k, setK] = useState(3);
  const [items, setItems] = useState<string[]>(START);
  const [text, setText] = useState('');
  const [answer, setAnswer] = useState<{ item: string; yes: boolean; real: boolean } | null>(null);
  const [probe, setProbe] = useState<number | null>(null);

  const b = make(m, k, items);
  const n = items.length;
  const lit = answer ? bloomPositions(answer.item, k, m) : [];
  const theory = bloomFp(n, m, k);
  const kopt = n > 0 ? bloomOptimalK(n, m) : 0;
  const clean = text.trim().toLowerCase();

  const add = () => {
    if (!clean || items.includes(clean)) return;
    setItems([...items, clean]);
    setAnswer(null);
    setProbe(null);
    setText('');
  };
  const ask = () => {
    if (!clean) return;
    setAnswer({ item: clean, yes: b.has(clean), real: items.includes(clean) });
    setProbe(null);
  };
  const addMany = () => {
    const next = [...items];
    for (let i = 0; next.length < items.length + 10; i++) {
      const w = `item-${items.length + i}`;
      if (!next.includes(w)) next.push(w);
    }
    setItems(next);
    setAnswer(null);
    setProbe(null);
  };
  const reset = () => {
    setItems(START);
    setAnswer(null);
    setProbe(null);
  };

  return (
    <CacheWidgetFrame title="Try a Bloom filter" hint="add words, ask about words, change m and k">
      <div className="grid gap-4 text-sm md:grid-cols-[16rem_1fr]">
        <div className="space-y-3">
          <Slider id="bf-m" label="Bits (m)" value={m} min={16} max={256} step={8} onChange={(v) => { setM(v); setAnswer(null); setProbe(null); }} show={String(m)} />
          <Slider id="bf-k" label="Hash functions (k)" value={k} min={1} max={8} onChange={(v) => { setK(v); setAnswer(null); setProbe(null); }} show={String(k)} />
          <div>
            <label htmlFor="bf-word" className="mb-1 block text-xs text-muted">Word</label>
            <input id="bf-word" value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && add()} className="w-full rounded-md border border-line bg-bg px-2 py-1.5" placeholder="e.g. pear" />
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={add} className="rounded-md bg-accent px-3 py-1.5 text-xs font-medium text-white">Add</button>
            <button type="button" onClick={ask} className="rounded-md border border-line px-3 py-1.5 text-xs">Is it in?</button>
            <button type="button" onClick={addMany} className="rounded-md border border-line px-3 py-1.5 text-xs">Add 10 more</button>
            <button type="button" onClick={() => setProbe(observedFp(b))} className="rounded-md border border-line px-3 py-1.5 text-xs">Test 200 unseen</button>
            <button type="button" onClick={reset} className="rounded-md border border-line px-3 py-1.5 text-xs">Reset</button>
          </div>
        </div>
        <div>
          <div className="flex flex-wrap gap-[3px]" role="img" aria-label={`Bit array of ${m} bits, ${b.setBits} set`}>
            {b.bits.map((on, i) => (
              <span
                key={i}
                className={`grid h-5 w-5 place-items-center rounded-[4px] border text-[10px] tabular-nums ${on ? 'bg-ok/30' : 'bg-surface'} ${lit.includes(i) ? 'border-accent ring-1 ring-accent' : 'border-line'}`}
              >
                {on ? 1 : 0}
              </span>
            ))}
          </div>
          <p className="mt-3 min-h-[2.5rem] text-[0.95rem]" aria-live="polite">
            {answer ? (
              <>
                <b>{answer.item}</b>:{' '}
                {!answer.yes ? <span className="text-ok">definitely not present</span> : answer.real ? <span className="text-ok">possibly present (it was added)</span> : <span className="text-bad">possibly present, but it was never added: a false positive</span>}
              </>
            ) : (
              <span className="text-muted">Items added: {items.length > 12 ? `${items.slice(0, 12).join(', ')} and ${items.length - 12} more` : items.join(', ')}</span>
            )}
          </p>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            <Card title="Bits set" value={`${b.setBits} of ${m}`} note={`n = ${n} items, k = ${k}`} />
            <Card title="Expected false positives" value={`${(theory * 100).toFixed(theory < 0.1 ? 2 : 1)}%`} note="(1 − e^(−kn/m))^k" tone={theory > 0.05 ? 'bad' : 'ok'} />
            <Card title="Best k for this n and m" value={kopt.toFixed(2)} note="(m / n) × ln 2" />
            <Card title="Measured on 200 unseen words" value={probe === null ? 'press the button' : `${(probe * 100).toFixed(1)}%`} note="Small samples are noisy." />
          </div>
        </div>
      </div>
    </CacheWidgetFrame>
  );
}

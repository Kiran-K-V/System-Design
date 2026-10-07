import { useEffect, useRef, useState } from 'react';
import { animate } from 'motion/react';

const SECONDS_PER_DAY = 86_400;

const SIZES = [
  { label: '100 B (a row of IDs)', bytes: 100 },
  { label: '1 KB (a tweet + metadata)', bytes: 1_000 },
  { label: '10 KB (a JSON document)', bytes: 10_000 },
  { label: '200 KB (a compressed photo)', bytes: 200_000 },
  { label: '5 MB (a short video clip)', bytes: 5_000_000 },
];

interface Inputs {
  dauMillions: number;
  writesPerUser: number;
  readsPerWrite: number;
  bytes: number;
  peak: number;
  years: number;
  replicas: number;
}

const DEFAULTS: Inputs = { dauMillions: 100, writesPerUser: 2, readsPerWrite: 100, bytes: 1_000, peak: 3, years: 5, replicas: 3 };

function si(n: number) {
  const units: [number, string][] = [
    [1e12, 'T'],
    [1e9, 'B'],
    [1e6, 'M'],
    [1e3, 'K'],
  ];
  for (const [v, u] of units) if (n >= v) return `${(n / v).toFixed(n / v < 10 ? 1 : 0)}${u}`;
  return n.toFixed(n < 10 ? 1 : 0);
}

function bytes(n: number) {
  const units: [number, string][] = [
    [1e15, 'PB'],
    [1e12, 'TB'],
    [1e9, 'GB'],
    [1e6, 'MB'],
    [1e3, 'KB'],
  ];
  for (const [v, u] of units) if (n >= v) return `${(n / v).toFixed(n / v < 10 ? 1 : 0)} ${u}`;
  return `${Math.round(n)} B`;
}

/** Counts from the previous value to the new one, so changes are easy to see. */
function Count({ value, format }: { value: number; format: (n: number) => string }) {
  const [shown, setShown] = useState(value);
  const from = useRef(value);
  useEffect(() => {
    const controls = animate(from.current, value, {
      duration: 0.5,
      ease: 'easeOut',
      onUpdate: (v) => {
        from.current = v;
        setShown(v);
      },
    });
    return () => controls.stop();
  }, [value]);
  return <>{format(shown)}</>;
}

// Thresholds match lesson 1.5 (Numbers to Know).
function verdictWrites(qps: number) {
  if (qps < 5_000) return { tone: 'text-ok', text: 'One database primary handles this.' };
  if (qps < 15_000) return { tone: 'text-warn', text: 'Near one node’s limit. Batch, or plan to shard.' };
  return { tone: 'text-bad', text: 'Beyond one node. Shard, or use a write-optimized store.' };
}

function verdictReads(qps: number) {
  if (qps < 10_000) return { tone: 'text-ok', text: 'One database, plus replicas for safety.' };
  if (qps < 100_000) return { tone: 'text-warn', text: 'Read replicas and a cache.' };
  return { tone: 'text-bad', text: 'Cache (and CDN) in front. The DB must not see most reads.' };
}

function verdictStorage(total: number) {
  if (total < 10e12) return { tone: 'text-ok', text: 'Fits on one database node.' };
  if (total < 100e12) return { tone: 'text-warn', text: 'Shard across a few nodes.' };
  return { tone: 'text-bad', text: 'Shard widely, or move blobs to object storage.' };
}

export default function EstimationCalc() {
  const [v, setV] = useState<Inputs>(DEFAULTS);
  const set = (k: keyof Inputs) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setV((p) => ({ ...p, [k]: +e.target.value }));

  const writesPerDay = v.dauMillions * 1e6 * v.writesPerUser;
  const writeQps = writesPerDay / SECONDS_PER_DAY;
  const readQps = writeQps * v.readsPerWrite;
  const peakWrite = writeQps * v.peak;
  const peakRead = readQps * v.peak;
  const perDay = writesPerDay * v.bytes;
  const total = perDay * 365 * v.years * v.replicas;
  const egress = peakRead * v.bytes;

  const rows = [
    { label: 'Writes / second (avg)', value: writeQps, fmt: si, work: `${si(writesPerDay)} / 86,400 s` },
    { label: 'Writes / second (peak)', value: peakWrite, fmt: si, work: `avg × ${v.peak}`, verdict: verdictWrites(peakWrite) },
    { label: 'Reads / second (peak)', value: peakRead, fmt: si, work: `peak writes × ${v.readsPerWrite}`, verdict: verdictReads(peakRead) },
    { label: 'New data / day', value: perDay, fmt: bytes, work: `${si(writesPerDay)} × ${bytes(v.bytes)}` },
    {
      label: `Total storage (${v.years} yr, ×${v.replicas})`,
      value: total,
      fmt: bytes,
      work: `per day × 365 × ${v.years} × ${v.replicas}`,
      verdict: verdictStorage(total),
    },
    { label: 'Read bandwidth (peak)', value: egress, fmt: (n: number) => `${bytes(n)}/s`, work: 'peak reads × size' },
  ];

  return (
    <figure className="not-prose my-8 overflow-hidden rounded-xl border border-line bg-bg shadow-[0_1px_2px_rgb(0_0_0/0.04)]">
      <div className="border-b border-line bg-surface px-4 py-2 text-sm font-medium">Estimation calculator</div>
      <div className="grid gap-6 p-4 md:grid-cols-[16rem_1fr]">
        <div className="space-y-3 text-sm">
          <Field label="Daily active users" value={`${v.dauMillions}M`}>
            <input type="range" min={1} max={1000} step={1} value={v.dauMillions} onChange={set('dauMillions')} className="w-full accent-[var(--accent)]" />
          </Field>
          <Field label="Writes per user per day" value={String(v.writesPerUser)}>
            <input type="range" min={0.1} max={50} step={0.1} value={v.writesPerUser} onChange={set('writesPerUser')} className="w-full accent-[var(--accent)]" />
          </Field>
          <Field label="Reads per write" value={`${v.readsPerWrite}:1`}>
            <input type="range" min={1} max={1000} step={1} value={v.readsPerWrite} onChange={set('readsPerWrite')} className="w-full accent-[var(--accent)]" />
          </Field>
          <Field label="Size of one write">
            <select value={v.bytes} onChange={set('bytes')} className="mt-1 w-full rounded-md border border-line bg-bg px-2 py-1">
              {SIZES.map((s) => (
                <option key={s.bytes} value={s.bytes}>
                  {s.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Peak ÷ average" value={`${v.peak}x`}>
            <input type="range" min={1} max={10} step={0.5} value={v.peak} onChange={set('peak')} className="w-full accent-[var(--accent)]" />
          </Field>
          <Field label="Keep data for" value={`${v.years} yr`}>
            <input type="range" min={1} max={10} step={1} value={v.years} onChange={set('years')} className="w-full accent-[var(--accent)]" />
          </Field>
          <Field label="Copies (replication)" value={`×${v.replicas}`}>
            <input type="range" min={1} max={5} step={1} value={v.replicas} onChange={set('replicas')} className="w-full accent-[var(--accent)]" />
          </Field>
          <button type="button" onClick={() => setV(DEFAULTS)} className="text-xs text-accent hover:underline">
            Reset to example
          </button>
        </div>

        <div className="divide-y divide-line">
          {rows.map((r) => (
            <div key={r.label} className="py-2.5">
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-sm">{r.label}</span>
                <span className="font-mono text-lg font-semibold tabular-nums">
                  <Count value={r.value} format={r.fmt} />
                </span>
              </div>
              <div className="flex items-baseline justify-between gap-3 text-xs">
                <span className="font-mono text-muted">{r.work}</span>
                {r.verdict && <span className={`text-right ${r.verdict.tone}`}>{r.verdict.text}</span>}
              </div>
            </div>
          ))}
        </div>
      </div>
      <figcaption className="border-t border-line px-4 py-3 text-[0.95rem] leading-relaxed">
        Move the sliders. Notice which inputs change the design: read ratio decides caching, write rate decides
        sharding, and object size decides whether data belongs in a database at all.
      </figcaption>
    </figure>
  );
}

function Field({ label, value, children }: { label: string; value?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="flex justify-between">
        <span>{label}</span>
        {value && <span className="font-mono tabular-nums">{value}</span>}
      </span>
      {children}
    </label>
  );
}

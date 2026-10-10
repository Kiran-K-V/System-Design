import { useState } from 'react';
import CacheWidgetFrame, { Seg } from './CacheWidgetFrame';
import { PARTITION_RCU, PARTITION_WCU, plan, readUnits, writeUnits, type ReadMode, type WriteMode } from './ddbCapacity';

const SIZES = [0.5, 1, 2, 4, 8, 16, 100];

function Slider({ id, label, value, min, max, step = 1, onChange, show }: { id: string; label: string; value: number; min: number; max: number; step?: number; onChange: (v: number) => void; show: string }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1 flex justify-between text-xs text-muted">
        <span>{label}</span>
        <span className="tabular-nums text-fg">{show}</span>
      </label>
      <input id={id} type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(+e.target.value)} className="w-full accent-[var(--accent)]" />
    </div>
  );
}

function Card({ title, value, note, tone }: { title: string; value: string; note?: string; tone?: 'bad' | 'ok' }) {
  return (
    <div className="rounded-lg border border-line bg-surface p-2.5">
      <div className="text-xs text-muted">{title}</div>
      <div className={`text-lg font-semibold tabular-nums ${tone === 'bad' ? 'text-bad' : tone === 'ok' ? 'text-ok' : ''}`}>{value}</div>
      {note && <div className="text-xs text-muted">{note}</div>}
    </div>
  );
}

const fmt = (n: number) => n.toLocaleString('en-US');
const kb = (n: number) => (n < 1 ? `${n * 1024} bytes` : `${n} KB`);

export default function DdbCapacity() {
  const [sizeIdx, setSizeIdx] = useState(1);
  const [reads, setReads] = useState(2000);
  const [writes, setWrites] = useState(500);
  const [rmode, setRmode] = useState<ReadMode>('eventual');
  const [wmode, setWmode] = useState<WriteMode>('standard');
  const size = SIZES[sizeIdx];
  const p = plan(size, reads, rmode, writes, wmode);
  const perRead = readUnits(size, rmode);
  const perWrite = writeUnits(size, wmode);
  const hotOver = writes > p.hotKeyWritesPerSec;

  return (
    <CacheWidgetFrame title="Capacity units and the hot-key ceiling" hint="item size, request rate, consistency">
      <div className="grid gap-4 text-sm md:grid-cols-[16rem_1fr]">
        <div className="space-y-3">
          <Slider id="ddb-size" label="Item size" value={sizeIdx} min={0} max={SIZES.length - 1} onChange={setSizeIdx} show={kb(size)} />
          <Slider id="ddb-reads" label="Reads per second" value={reads} min={0} max={20000} step={100} onChange={setReads} show={fmt(reads)} />
          <Slider id="ddb-writes" label="Writes per second" value={writes} min={0} max={5000} step={50} onChange={setWrites} show={fmt(writes)} />
          <div>
            <div className="mb-1 text-xs text-muted">Read type</div>
            <Seg
              label="Read type"
              value={rmode}
              onChange={setRmode}
              options={[
                { id: 'eventual', label: 'Eventual' },
                { id: 'strong', label: 'Strong' },
                { id: 'transactional', label: 'Transaction' },
              ]}
            />
          </div>
          <div>
            <div className="mb-1 text-xs text-muted">Write type</div>
            <Seg
              label="Write type"
              value={wmode}
              onChange={setWmode}
              options={[
                { id: 'standard', label: 'Standard' },
                { id: 'transactional', label: 'Transaction' },
              ]}
            />
          </div>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          <Card title="Read units per read" value={String(perRead)} note="Size rounds up to the next 4 KB." />
          <Card title="Write units per write" value={String(perWrite)} note="Size rounds up to the next 1 KB." />
          <Card title="Read capacity needed" value={`${fmt(p.rcu)} per second`} />
          <Card title="Write capacity needed" value={`${fmt(p.wcu)} per second`} />
          <Card
            title="Partitions needed, if keys spread evenly"
            value={`at least ${p.minPartitions}`}
            note={`One partition is designed for ${fmt(PARTITION_RCU)} read units and ${fmt(PARTITION_WCU)} write units per second.`}
          />
          <Card
            title="One hot key: writes per second it can take"
            value={fmt(p.hotKeyWritesPerSec)}
            tone={hotOver ? 'bad' : 'ok'}
            note={hotOver ? `Your ${fmt(writes)} writes per second would throttle if they all hit one key.` : 'Your write rate fits on one key.'}
          />
        </div>
      </div>
    </CacheWidgetFrame>
  );
}

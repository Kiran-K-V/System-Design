import { useState } from 'react';
import CacheWidgetFrame from './CacheWidgetFrame';
import { fmtDuration, fresh } from './Ai5FreshMath';

function Slider({ id, label, value, min, max, step, onChange, fmt }: { id: string; label: string; value: number; min: number; max: number; step: number; onChange: (v: number) => void; fmt?: (v: number) => string }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1 flex justify-between text-xs text-muted">
        <span>{label}</span>
        <span className="tabular-nums text-fg">{fmt ? fmt(value) : value.toLocaleString('en-US')}</span>
      </label>
      <input id={id} type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(+e.target.value)} className="w-full accent-[var(--accent)]" />
    </div>
  );
}

/** Staleness calculator: steady lag, burst drain time, and full re-embed time. */
export default function Ai5FreshCalc() {
  const [docs, setDocs] = useState(5);
  const [cpd, setCpd] = useState(8);
  const [embed, setEmbed] = useState(100);
  const [cdc, setCdc] = useState(2);
  const [commit, setCommit] = useState(1);
  const [burst, setBurst] = useState(10000);
  const [corpus, setCorpus] = useState(50);

  const o = fresh({ docsPerSec: docs, chunksPerDoc: cpd, embedPerSec: embed, cdcLagSec: cdc, commitSec: commit, burstDocs: burst, corpusChunks: corpus * 1e6 });
  const card = 'rounded-lg border border-line bg-surface p-2.5';

  return (
    <CacheWidgetFrame title="Staleness calculator" hint="your assumptions, not measured values">
      <div className="grid gap-4 text-sm md:grid-cols-2">
        <div className="space-y-3">
          <Slider id="a58-docs" label="Changed documents per second" value={docs} min={1} max={50} step={1} onChange={setDocs} />
          <Slider id="a58-cpd" label="Chunks re-embedded per changed document" value={cpd} min={1} max={40} step={1} onChange={setCpd} />
          <Slider id="a58-emb" label="Embedding throughput (chunks per second)" value={embed} min={10} max={500} step={10} onChange={setEmbed} />
          <Slider id="a58-cdc" label="CDC delay (seconds)" value={cdc} min={0} max={30} step={1} onChange={setCdc} />
          <Slider id="a58-com" label="Upsert to searchable (seconds)" value={commit} min={0} max={30} step={1} onChange={setCommit} />
          <Slider id="a58-bur" label="Burst size (documents at once)" value={burst} min={100} max={100000} step={100} onChange={setBurst} />
          <Slider id="a58-cor" label="Corpus size (million chunks)" value={corpus} min={1} max={500} step={1} onChange={setCorpus} />
        </div>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div className={card}>
              <div className="text-xs text-muted">Arrival / capacity</div>
              <div className="text-lg font-semibold tabular-nums" data-testid="fr-util" style={{ color: o.stable ? 'var(--ok)' : 'var(--bad)' }}>{o.arrival} / {embed} ({Math.round(o.utilization * 100)}%)</div>
            </div>
            <div className={card}>
              <div className="text-xs text-muted">Lag of one quiet change</div>
              <div className="text-lg font-semibold tabular-nums" data-testid="fr-idle">{fmtDuration(o.idleLagSec)}</div>
            </div>
            <div className={card}>
              <div className="text-xs text-muted">Burst drain time</div>
              <div className="text-lg font-semibold tabular-nums" data-testid="fr-burst" style={{ color: o.burstDrainSec > 300 ? 'var(--warn)' : 'var(--fg)' }}>{fmtDuration(o.burstDrainSec)}</div>
            </div>
            <div className={card}>
              <div className="text-xs text-muted">Full re-embed</div>
              <div className="text-lg font-semibold tabular-nums" data-testid="fr-reembed">{fmtDuration(o.reembedSec)}</div>
            </div>
          </div>
          <p className="text-sm leading-relaxed">
            {o.stable
              ? `Normal traffic uses ${Math.round(o.utilization * 100)}% of the pipeline. A burst of ${burst.toLocaleString('en-US')} documents adds ${(burst * cpd).toLocaleString('en-US')} chunks. They drain at the spare ${embed - o.arrival} chunks per second, so the last document is stale for about ${fmtDuration(o.burstWorstLagSec)}.`
              : 'Arrivals are at or above capacity. The queue never drains and staleness grows without limit. Add embedding capacity or shed load.'}
          </p>
          <p className="text-xs text-muted">Model: lag of a quiet change = CDC delay + chunks / throughput + commit delay. Burst drain = burst chunks / (throughput - arrival). Re-embed = corpus / throughput, assuming the same capacity.</p>
        </div>
      </div>
    </CacheWidgetFrame>
  );
}

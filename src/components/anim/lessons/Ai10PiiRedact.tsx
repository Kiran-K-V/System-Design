import { useState, type ReactNode } from 'react';
import CacheWidgetFrame, { Seg } from './CacheWidgetFrame';
import { DETECTORS, SAMPLES, detect, redact, score, type DetectorId, type Operator } from './Ai10PiiLogic';

const OPS: { id: Operator; label: string }[] = [
  { id: 'label', label: 'Type label' },
  { id: 'mask', label: 'Mask' },
  { id: 'pseudonym', label: 'Stable pseudonym' },
];

export default function Ai10PiiRedact() {
  const [sampleId, setSampleId] = useState(SAMPLES[0].id);
  const [on, setOn] = useState<DetectorId[]>(['email', 'phone', 'card', 'ssn']);
  const [op, setOp] = useState<Operator>('label');
  const sample = SAMPLES.find((s) => s.id === sampleId)!;
  const spans = detect(sample.text, on);
  const sc = score(sample, spans);
  const toggle = (d: DetectorId) => setOn((cur) => (cur.includes(d) ? cur.filter((x) => x !== d) : [...cur, d]));

  // Highlight the original: green = caught, red = missed personal item, yellow = false alarm.
  const parts: ReactNode[] = [];
  const marks = [
    ...spans.map((s) => ({ start: s.start, end: s.end, tone: sc.falseAlarms.includes(sample.text.slice(s.start, s.end)) ? 'var(--warn)' : 'var(--ok)' })),
    ...sample.truth
      .filter((t) => sc.leaked.some((l) => l.value === t.value))
      .map((t) => ({ start: sample.text.indexOf(t.value), end: sample.text.indexOf(t.value) + t.value.length, tone: 'var(--bad)' })),
  ].sort((a, b) => a.start - b.start);
  let at = 0;
  marks.forEach((m, i) => {
    parts.push(<span key={`t${i}`}>{sample.text.slice(at, m.start)}</span>);
    parts.push(
      <span key={`m${i}`} className="rounded px-0.5" style={{ background: `color-mix(in srgb, ${m.tone} 25%, var(--bg))`, outline: `1px solid ${m.tone}` }}>
        {sample.text.slice(m.start, m.end)}
      </span>,
    );
    at = m.end;
  });
  parts.push(<span key="tail">{sample.text.slice(at)}</span>);

  return (
    <CacheWidgetFrame title="Redaction demo" hint="A toy detector on made-up text. Real tools use trained models.">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <Seg label="Text" value={sampleId} options={SAMPLES.map((s) => ({ id: s.id, label: s.label }))} onChange={setSampleId} />
        <Seg label="Replace with" value={op} options={OPS} onChange={setOp} />
      </div>
      <fieldset className="mb-4">
        <legend className="mb-1 text-xs text-muted">Detectors switched on</legend>
        <div className="flex flex-wrap gap-2">
          {DETECTORS.map((d) => (
            <label key={d.id} className={`flex cursor-pointer items-center gap-1.5 rounded-md border px-2 py-1 text-[13px] ${on.includes(d.id) ? 'border-accent bg-accent-soft' : 'border-line'}`}>
              <input type="checkbox" checked={on.includes(d.id)} onChange={() => toggle(d.id)} className="accent-[var(--accent)]" />
              {d.label}
            </label>
          ))}
        </div>
      </fieldset>
      <div className="space-y-3 text-sm" aria-live="polite">
        <div className="rounded-lg border border-line p-3">
          <p className="text-xs uppercase tracking-wide text-muted">Original (green caught, red missed, yellow false alarm)</p>
          <p className="mt-2 leading-relaxed">{parts}</p>
        </div>
        <div className="rounded-lg border border-line bg-surface p-3">
          <p className="text-xs uppercase tracking-wide text-muted">What you would log</p>
          <p className="mt-2 break-words font-mono text-[13px] leading-relaxed">{redact(sample.text, spans, op)}</p>
        </div>
        <div className="rounded-lg border p-3" style={{ borderColor: sc.leaked.length ? 'var(--bad)' : 'var(--ok)' }}>
          <p className="font-mono text-[13px]">
            caught {sc.caught} of {sc.total} personal items (recall {Math.round(sc.recall * 100)}%) · false alarms {sc.falseAlarms.length}
          </p>
          {sc.leaked.length > 0 && <p className="mt-1" style={{ color: 'var(--bad)' }}>Leaked into the log: {sc.leaked.map((l) => `${l.value} (${l.kind.toLowerCase()})`).join(', ')}</p>}
          {sc.falseAlarms.length > 0 && <p className="mt-1" style={{ color: 'var(--warn)' }}>Hid something harmless: {sc.falseAlarms.join(', ')}</p>}
          {op === 'pseudonym' && <p className="mt-1 text-muted">The same value always gets the same pseudonym, so you can still count and join without seeing the data.</p>}
        </div>
        <p className="text-muted">Recall means the share of real personal items the detector caught. The demo scores against a list of items that I marked by hand. In production you do not have that list, so you plant fake items (canaries) in test traffic and check the logs.</p>
      </div>
    </CacheWidgetFrame>
  );
}

import { useState } from 'react';
import CacheWidgetFrame, { Seg } from './CacheWidgetFrame';
import { pick, type Load, type Start, type Threat } from './Ai7BoxLogic';

export default function Ai7BoxPicker() {
  const [threat, setThreat] = useState<Threat>('model');
  const [load, setLoad] = useState<Load>('scripts');
  const [gpu, setGpu] = useState(false);
  const [start, setStart] = useState<Start>('fast');
  const p = pick(threat, load, gpu, start);

  return (
    <CacheWidgetFrame title="Sandbox picker" hint="A rule of thumb from vendor docs, not a security audit.">
      <div className="mb-3 flex flex-wrap gap-2">
        <Seg label="Who writes the code" value={threat} options={[{ id: 'trusted', label: 'Your own code' }, { id: 'model', label: 'Model-written, your users' }, { id: 'hostile', label: 'Untrusted tenants' }]} onChange={setThreat} />
      </div>
      <div className="mb-3 flex flex-wrap gap-2">
        <Seg label="Workload" value={load} options={[{ id: 'scripts', label: 'Short scripts' }, { id: 'syscalls', label: 'System-call heavy' }, { id: 'fulllinux', label: 'Needs full Linux' }]} onChange={setLoad} />
      </div>
      <div className="mb-4 flex flex-wrap gap-2">
        <Seg label="GPU" value={gpu ? 1 : 0} options={[{ id: 0, label: 'No GPU' }, { id: 1, label: 'Needs GPU' }]} onChange={(v) => setGpu(v === 1)} />
        <Seg label="Start budget" value={start} options={[{ id: 'fast', label: 'Interactive (under 1 s)' }, { id: 'slow', label: 'Seconds are fine' }]} onChange={setStart} />
      </div>
      <div className="space-y-3 text-sm" aria-live="polite">
        <div className="rounded-lg border p-3" style={{ borderColor: 'var(--accent)' }}>
          <p className="text-xs uppercase tracking-wide text-muted">Pick</p>
          <p className="mt-1 font-medium">{p.choice}</p>
        </div>
        <ul className="list-disc space-y-1 pl-5">
          {p.why.map((w) => (
            <li key={w}>{w}</li>
          ))}
        </ul>
        <p className="text-muted">
          <span className="text-fg">Cost to watch: </span>
          {p.watch}
        </p>
      </div>
    </CacheWidgetFrame>
  );
}

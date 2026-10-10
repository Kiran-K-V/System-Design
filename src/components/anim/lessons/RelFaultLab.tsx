import { useState } from 'react';
import CacheWidgetFrame, { Seg } from './CacheWidgetFrame';
import FlowDiagram, { type FlowEdge, type FlowNode, type FlowNote, type Tone } from '../FlowDiagram';
import { CAPACITY_QPS, DEMAND_QPS, evaluate, type Fault, type Phase } from './relFaults';

const FAULTS: { id: Fault; label: string }[] = [
  { id: 'none', label: 'No fault' },
  { id: 'crash', label: 'Crash' },
  { id: 'slow', label: 'Slow node' },
  { id: 'partition', label: 'Partition' },
  { id: 'gray', label: 'Gray failure' },
];

const PHASES: { id: Phase; label: string }[] = [
  { id: 'before', label: 'Before the LB reacts' },
  { id: 'after', label: 'After the LB reacts' },
];

const S3_SUB: Record<Fault, string> = {
  none: 'healthy',
  crash: 'crashed',
  slow: 'answers in 3 s',
  partition: 'cut off from LB',
  gray: '30% of calls fail',
};

const S3_TONE: Record<Fault, Tone> = { none: 'ok', crash: 'bad', slow: 'warn', partition: 'warn', gray: 'warn' };

export default function RelFaultLab() {
  const [fault, setFault] = useState<Fault>('gray');
  const [phase, setPhase] = useState<Phase>('after');
  const v = evaluate(fault, phase);

  const ys = [40, 112, 184, 256];
  const nodes: FlowNode[] = [
    { id: 'client', x: 70, y: 148, w: 100, h: 52, label: 'Users' },
    { id: 'lb', x: 270, y: 148, w: 110, h: 52, label: 'LB', sub: 'health probe' },
    ...ys.map((y, k): FlowNode => {
      const isS3 = k === 2;
      const out = isS3 && !v.inPool;
      return {
        id: `s${k + 1}`,
        x: 560,
        y,
        w: 160,
        h: 58,
        label: `S${k + 1}`,
        sub: isS3 ? S3_SUB[fault] : fault === 'none' ? 'healthy' : `${v.loadPct}% load`,
        tone: isS3 ? (out ? 'muted' : S3_TONE[fault]) : fault === 'none' ? 'ok' : 'ok',
        shape: out ? 'dashed' : 'box',
      };
    }),
  ];
  const edges: FlowEdge[] = [
    { from: 'client', to: 'lb' },
    ...ys.map((_, k): FlowEdge => {
      const isS3 = k === 2;
      if (isS3 && fault === 'partition') return { from: 'lb', to: 's3', dashed: true, tone: 'bad', label: 'cut' };
      if (isS3 && !v.inPool) return { from: 'lb', to: 's3', dashed: true, tone: 'muted' };
      return { from: 'lb', to: `s${k + 1}` };
    }),
  ];
  const notes: FlowNote[] = [{ x: 270, y: 306, anchor: 'middle', text: `Demand ${DEMAND_QPS.toLocaleString('en-US')} per s, capacity ${CAPACITY_QPS.toLocaleString('en-US')} per server`, size: 14 }];

  return (
    <CacheWidgetFrame
      title="Fault injector: one server, five possible lives"
      hint="Example numbers. Round robin, 4 servers."
      caption={
        <>
          The health check and the users do not always see the same thing. A crash is easy: the probe fails and the LB removes the server. A slow node and a gray failure pass the probe while users get errors.
          A partition can cut the LB off from a server that is still running. Model: requests are shared equally, each server can do 1,000 per second, a request to a slow server takes 3 s against a 1 s client timeout,
          and a gray server fails 30% of the calls it gets. The probe is a shallow <code>/health</code> check.
        </>
      }
    >
      <div className="flex flex-wrap gap-3">
        <Seg label="Fault on S3" value={fault} options={FAULTS} onChange={setFault} />
        <Seg label="When" value={phase} options={PHASES} onChange={setPhase} />
      </div>
      <div className="mt-3">
        <FlowDiagram width={720} height={330} nodes={nodes} edges={edges} notes={notes} label="Load balancer and four servers, S3 has the selected fault" />
      </div>
      <div className="mt-2 grid gap-3 sm:grid-cols-2">
        <div className="rounded-lg border border-line p-3 text-sm">
          <div className="text-xs font-medium uppercase tracking-wide text-muted">What the health check sees</div>
          <div className={`mt-1 font-semibold ${v.detector === 'fails' ? 'text-bad' : 'text-ok'}`}>Probe {v.detector}</div>
          <p className="m-0 mt-1 leading-snug">{v.detectorText}</p>
        </div>
        <div className="rounded-lg border border-line p-3 text-sm">
          <div className="text-xs font-medium uppercase tracking-wide text-muted">What users see</div>
          <div className={`mt-1 font-semibold ${v.errorPct > 0 ? 'text-bad' : 'text-ok'}`}>{v.errorPct}% of requests fail</div>
          <p className="m-0 mt-1 leading-snug">{v.usersText}</p>
        </div>
      </div>
      <div className="mt-3 grid grid-cols-3 gap-3 text-center">
        <Stat label="Error rate" value={`${v.errorPct}%`} tone={v.errorPct === 0 ? 'ok' : 'bad'} />
        <Stat label="p99 latency" value={`${v.p99Ms.toLocaleString('en-US')} ms`} tone={v.p99Ms > 100 ? 'bad' : 'ok'} />
        <Stat label="Load on each pool server" value={`${v.loadPct}%`} tone={v.loadPct > 100 ? 'bad' : v.loadPct > 85 ? 'warn' : 'ok'} />
      </div>
    </CacheWidgetFrame>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone: 'ok' | 'warn' | 'bad' }) {
  return (
    <div className="rounded-lg border border-line px-2 py-2">
      <div className={`text-lg font-semibold tabular-nums ${tone === 'ok' ? 'text-ok' : tone === 'warn' ? 'text-warn' : 'text-bad'}`}>{value}</div>
      <div className="text-xs text-muted">{label}</div>
    </div>
  );
}

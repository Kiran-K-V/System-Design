import { useState } from 'react';
import CacheWidgetFrame, { Seg } from './CacheWidgetFrame';
import FlowDiagram, { type FlowEdge, type FlowNode, type Tone } from '../FlowDiagram';

type Scenario = 'prompt' | 'route' | 'slice' | 'none';

interface Info {
  label: string;
  /** Node ids on the path, in order. */
  path: string[];
  title: string;
  actions: string[];
}

const SCENARIOS: Record<Scenario, Info> = {
  prompt: {
    label: 'We shipped prompt v13',
    path: ['start', 'q1', 'a1'],
    title: 'Roll back the prompt',
    actions: ['Point the live label back at v12. This is your own change, so it is fast and safe.', 'Run the eval set on v12 and v13 to confirm v13 caused it.', 'Fix v13 offline. Ship it again through a canary.'],
  },
  route: {
    label: 'The provider changed something',
    path: ['start', 'q1', 'q2', 'a2'],
    title: 'Route away or pin',
    actions: ['Send traffic to the backup provider or the pinned older model. It must already pass your eval set.', 'Open a ticket with the provider and give request ids.', 'Keep the old route ready until the provider confirms a fix.'],
  },
  slice: {
    label: 'Only one platform is bad',
    path: ['start', 'q1', 'q2', 'q3', 'a3'],
    title: 'Diff that one slice',
    actions: ['Pull 20 traces from the bad slice and 20 from a good one.', 'Compare model id, route, settings, and prompt version side by side.', 'Take the bad slice out of rotation while you look.'],
  },
  none: {
    label: 'Nothing we know of changed',
    path: ['start', 'q1', 'q2', 'q3', 'a4'],
    title: 'Replay the eval set',
    actions: ['Run the frozen eval set now and compare with the last good run.', 'Read 50 recent traces. Look at new topics, new users, and new input length.', 'If the eval set is fine but users complain, your eval set is missing the new traffic. Add it.'],
  },
};

const NODES: { id: string; x: number; y: number; w: number; h: number; label: string; sub?: string; action?: boolean }[] = [
  { id: 'start', x: 120, y: 40, w: 190, h: 52, label: 'Answers got worse' },
  { id: 'q1', x: 120, y: 130, w: 210, h: 60, label: 'Our release?', sub: 'prompt, tools, settings' },
  { id: 'q2', x: 120, y: 226, w: 210, h: 60, label: 'Provider change?', sub: 'model id, route, notice' },
  { id: 'q3', x: 120, y: 322, w: 210, h: 60, label: 'One slice only?', sub: 'platform, route, tenant' },
  { id: 'a1', x: 520, y: 130, w: 220, h: 60, label: 'Roll back version', action: true },
  { id: 'a2', x: 520, y: 226, w: 220, h: 60, label: 'Route away or pin', action: true },
  { id: 'a3', x: 520, y: 322, w: 220, h: 60, label: 'Diff that slice', action: true },
  { id: 'a4', x: 330, y: 400, w: 220, h: 52, label: 'Replay eval set', action: true },
];

const EDGES: { from: string; to: string; label?: string }[] = [
  { from: 'start', to: 'q1' },
  { from: 'q1', to: 'a1', label: 'yes' },
  { from: 'q1', to: 'q2', label: 'no' },
  { from: 'q2', to: 'a2', label: 'yes' },
  { from: 'q2', to: 'q3', label: 'no' },
  { from: 'q3', to: 'a3', label: 'yes' },
  { from: 'q3', to: 'a4', label: 'no' },
];

export default function Ai9IncTriage() {
  const [sc, setSc] = useState<Scenario>('route');
  const info = SCENARIOS[sc];
  const onPath = new Set(info.path);
  const last = info.path[info.path.length - 1];

  const nodes: FlowNode[] = NODES.map((n) => {
    let tone: Tone = 'muted';
    if (onPath.has(n.id)) tone = n.id === last ? 'ok' : 'accent';
    return { id: n.id, x: n.x, y: n.y, w: n.w, h: n.h, label: n.label, sub: n.sub, tone };
  });
  const edges: FlowEdge[] = EDGES.map((e) => {
    const hot = onPath.has(e.from) && onPath.has(e.to) && info.path.indexOf(e.to) === info.path.indexOf(e.from) + 1;
    return { from: e.from, to: e.to, label: e.label, tone: hot ? 'accent' : 'muted', dashed: !hot, labelAt: [e.label === 'no' ? 22 : 0, e.label === 'no' ? 0 : -16] };
  });

  return (
    <CacheWidgetFrame title="Triage: from symptom to first action" hint="Pick what you found. The path lights up.">
      <div className="mb-3">
        <Seg
          label="What you found"
          value={sc}
          options={(Object.keys(SCENARIOS) as Scenario[]).map((k) => ({ id: k, label: SCENARIOS[k].label }))}
          onChange={setSc}
        />
      </div>
      <FlowDiagram width={720} height={440} nodes={nodes} edges={edges} active={[last]} label={`Decision path for: ${info.label}. First action: ${info.title}.`} />
      <div className="mt-3 rounded-lg border border-line p-3 text-sm" aria-live="polite">
        <p className="text-xs uppercase tracking-wide text-muted">First action: {info.title}</p>
        <ol className="mt-2 list-decimal space-y-1 pl-5">
          {info.actions.map((a) => (
            <li key={a}>{a}</li>
          ))}
        </ol>
      </div>
    </CacheWidgetFrame>
  );
}

import AnimFrame from '../AnimFrame';
import FlowDiagram, { type FlowEdge, type FlowNode } from '../FlowDiagram';
import { ENTRIES } from './Ai10OwaspData';

const NODES: FlowNode[] = [
  { id: 'user', x: 70, y: 170, w: 100, h: 44, label: 'User' },
  { id: 'app', x: 240, y: 170, w: 120, h: 44, label: 'App server' },
  { id: 'model', x: 430, y: 70, w: 120, h: 44, label: 'Model' },
  { id: 'tools', x: 430, y: 170, w: 120, h: 44, label: 'Tools' },
  { id: 'index', x: 430, y: 270, w: 130, h: 52, label: 'Search index', shape: 'db' },
  { id: 'sink', x: 240, y: 290, w: 140, h: 44, label: 'Browser or DB' },
  { id: 'supplier', x: 630, y: 70, w: 130, h: 44, label: 'Model supplier', shape: 'dashed' },
  { id: 'budget', x: 70, y: 290, w: 120, h: 44, label: 'Spend cap', shape: 'dashed' },
];

const EDGES: FlowEdge[] = [
  { from: 'user', to: 'app', head: 'both' },
  { from: 'app', to: 'model', head: 'both' },
  { from: 'app', to: 'tools', head: 'both' },
  { from: 'app', to: 'index', head: 'both' },
  { from: 'app', to: 'sink' },
  { from: 'supplier', to: 'model' },
  { from: 'budget', to: 'app', dashed: true },
];

const INTRO = 'Here is one reference design for a small AI app. A user talks to an app server. The server calls a model, runs tools, and searches an index. Replies go to a browser or a database. A supplier provides the model. A spend cap guards cost. Step through the ten risks and watch which box each one lives in.';

const steps = [
  { caption: INTRO, active: [] as string[], head: 'Reference design' },
  ...ENTRIES.map((e) => ({
    caption: `${e.id} ${e.title}. ${e.what} Design control: ${e.controls[0].toLowerCase()}. Test: ${e.test.charAt(0).toLowerCase()}${e.test.slice(1)}`,
    active: e.lit,
    head: `${e.id} ${e.title}`,
  })),
];

export default function Ai10OwaspMap() {
  return (
    <AnimFrame title="The ten risks on one reference design" steps={steps} interval={5600}>
      {(i, s) => (
        <FlowDiagram
          width={720}
          height={340}
          nodes={NODES}
          edges={EDGES}
          active={s.active}
          stepKey={i}
          notes={[{ x: 20, y: 22, text: s.head, size: 18, tone: i === 0 ? 'muted' : 'accent' }]}
          label={s.head}
        />
      )}
    </AnimFrame>
  );
}

import { useState } from 'react';
import FlowDiagram, { type FlowEdge, type FlowNode } from '../FlowDiagram';
import CacheWidgetFrame, { Seg } from './CacheWidgetFrame';
import { CHANGES, redoes, type Part } from './AiE1RetrievalLogic';

const NODES: FlowNode[] = [
  { id: 'user', x: 100, y: 80, w: 130, h: 60, label: 'User tower', sub: 'at request' },
  { id: 'index', x: 290, y: 80, w: 150, h: 70, label: 'ANN index', sub: 'item vectors', shape: 'db' },
  { id: 'ranker', x: 480, y: 80, w: 110, h: 60, label: 'Ranker' },
  { id: 'rerank', x: 630, y: 80, w: 110, h: 60, label: 'Re-rank' },
  { id: 'catalog', x: 100, y: 250, w: 130, h: 60, label: 'Item catalogue' },
  { id: 'item', x: 290, y: 250, w: 130, h: 60, label: 'Item tower', sub: 'offline' },
  { id: 'store', x: 480, y: 250, w: 130, h: 64, label: 'Feature store', shape: 'db' },
];
const EDGES: FlowEdge[] = [
  { from: 'user', to: 'index', label: 'query vector' },
  { from: 'index', to: 'ranker', label: '~1,000' },
  { from: 'ranker', to: 'rerank', label: '~100' },
  { from: 'catalog', to: 'item' },
  { from: 'item', to: 'index', label: 'vectors' },
  { from: 'store', to: 'ranker', label: 'features' },
];

/** Pick a change. The parts that must run again light up. The rest stay as they are. */
export default function AiE1TwoTower() {
  const [id, setId] = useState('new-item');
  const redo = new Set<Part>(redoes(id));
  const nodes = NODES.map((n) => ({ ...n, tone: redo.has(n.id as Part) ? ('warn' as const) : ('muted' as const) }));
  const change = CHANGES.find((c) => c.id === id)!;
  const names = NODES.filter((n) => redo.has(n.id as Part)).map((n) => n.label);

  return (
    <CacheWidgetFrame title="What runs again?" hint="Pick a change in the world">
      <Seg label="Change" value={id} onChange={setId} options={CHANGES.map((c) => ({ id: c.id, label: c.label }))} />
      <div className="mt-3">
        <FlowDiagram width={720} height={330} nodes={nodes} edges={EDGES} active={[...redo]} label={`Parts that run again: ${names.join(', ')}`} />
      </div>
      <p className="mt-2 text-sm" aria-live="polite">
        <span className="font-medium">{`Runs again: ${names.join(', ')}. `}</span>
        {change.note}
      </p>
    </CacheWidgetFrame>
  );
}

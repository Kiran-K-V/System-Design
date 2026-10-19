import { DesignCompare, type CompareVariant } from '../DesignBuild';
import type { FlowEdge, FlowNode } from '../FlowDiagram';

/** One duplicate webhook, two handlers: a naive one and one that dedupes by event id. */

const nodes = (handler: string, sub: string, withSeen: boolean): FlowNode[] => [
  { id: 'src', x: 100, y: 110, w: 130, label: 'Mail system', sub: 'sends events' },
  { id: 'h', x: 360, y: 110, w: 140, label: handler, sub },
  ...(withSeen ? [{ id: 'seen', x: 360, y: 250, w: 140, h: 80, label: 'Seen events', sub: 'unique event id', shape: 'db' as const }] : []),
  { id: 'out', x: 625, y: 110, w: 130, label: 'Inbox', sub: 'auto-replies' },
];

const edges = (withSeen: boolean): FlowEdge[] => [
  { from: 'src', to: 'h', label: 'event', labelAt: [0, -18] },
  { from: 'h', to: 'out', label: 'reply', labelAt: [0, -18] },
  ...(withSeen ? [{ from: 'h', to: 'seen', label: 'insert', labelAt: [34, 0] as [number, number], dashed: true }] : []),
];

const variants: CompareVariant[] = [
  {
    id: 'naive',
    label: 'Naive: run on every delivery',
    nodes: nodes('Handler', 'slow, then 200', false),
    edges: edges(false),
    steps: [
      { notes: [{ x: 625, y: 172, text: 'replies: 0', anchor: 'middle', size: 18, tone: 'muted' }], caption: 'The mail system delivers event e-77 (a new support email). The handler reads it, runs the model, sends the reply, and only then returns 200.', packets: [{ from: 'src', to: 'h', label: 'e-77' }], active: ['h'] },
      { notes: [{ x: 625, y: 172, text: 'replies: 1', anchor: 'middle', size: 18, tone: 'ok' }], caption: 'The reply goes out. The model call was slow, so the 200 is still on its way.', packets: [{ from: 'h', to: 'out', label: 'reply' }], tones: { out: 'ok' } },
      { notes: [{ x: 625, y: 172, text: 'replies: 1', anchor: 'middle', size: 18, tone: 'warn' }], caption: 'The sender saw no answer inside its timeout, so it sends e-77 again. Delivery is at least once: the same event can arrive twice. Same id, same body.', packets: [{ from: 'src', to: 'h', label: 'e-77 again' }], tones: { src: 'warn' }, active: ['h'] },
      { notes: [{ x: 625, y: 172, text: 'replies: 2', anchor: 'middle', size: 18, tone: 'bad' }], caption: 'The handler has no memory of e-77, so it runs the whole flow again. The customer gets two auto-replies, and the second may differ, because a model does not repeat itself.', packets: [{ from: 'h', to: 'out', label: 'reply' }], tones: { out: 'bad', h: 'bad' } },
    ],
  },
  {
    id: 'dedupe',
    label: 'Better: insert id, then 200',
    nodes: nodes('Handler', 'insert, queue, 200', true),
    edges: edges(true),
    steps: [
      { notes: [{ x: 625, y: 172, text: 'replies: 0', anchor: 'middle', size: 18, tone: 'muted' }], caption: 'Same event e-77. This handler first inserts the event id into a table with a unique key. It does nothing slow itself.', packets: [{ from: 'src', to: 'h', label: 'e-77' }], active: ['h'] },
      { notes: [{ x: 625, y: 172, text: 'replies: 0', anchor: 'middle', size: 18, tone: 'accent' }], caption: 'The insert succeeds, so e-77 is new. The handler puts the work on a queue and returns 200 at once. A worker does the slow part later.', packets: [{ from: 'h', to: 'seen', label: 'insert e-77' }], active: ['seen'] },
      { notes: [{ x: 625, y: 172, text: 'replies: 1', anchor: 'middle', size: 18, tone: 'ok' }], caption: 'The worker runs the model and sends one reply. It tags the send with the event id, so a worker that crashes and retries cannot send twice either.', packets: [{ from: 'h', to: 'out', label: 'reply' }], tones: { out: 'ok' } },
      { notes: [{ x: 625, y: 172, text: 'replies: 1', anchor: 'middle', size: 18, tone: 'ok' }], caption: 'The sender delivers e-77 again. The insert fails on the unique key. The handler returns 200 and stops. Delivering twice changes nothing.', packets: [{ from: 'src', to: 'h', label: 'e-77 again' }, { from: 'h', to: 'seen', label: 'exists', delay: 0.9 }], tones: { seen: 'ok' } },
    ],
  },
];

export default function Ai13SupportDupe() {
  return <DesignCompare title="Duplicate webhook" prompt="Handler:" variants={variants} height={320} label="A duplicate webhook delivery handled by a naive handler and by a handler that dedupes by event id" />;
}

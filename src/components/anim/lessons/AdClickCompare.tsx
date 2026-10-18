import { DesignCompare, type CompareVariant } from '../DesignBuild';
import type { FlowEdge, FlowNode } from '../FlowDiagram';

/** One Flink restart, two sinks: an additive write and an upsert. */

const nodes = (sink: string): FlowNode[] => [
  { id: 'kafka', x: 100, y: 110, w: 130, label: 'Kafka', sub: 'replayable', h: 80, shape: 'db' },
  { id: 'flink', x: 360, y: 110, w: 140, label: 'Flink task', sub: 'window 12:01' },
  { id: 'ckpt', x: 360, y: 250, w: 140, label: 'Checkpoint', sub: 'offsets + state', h: 80, shape: 'db' },
  { id: 'sink', x: 625, y: 110, w: 140, label: sink, sub: 'ad 7, 12:01', h: 80, shape: 'db' },
];

const edges: FlowEdge[] = [
  { from: 'kafka', to: 'flink', label: 'events' },
  { from: 'flink', to: 'sink', label: 'result', labelAt: [0, -18] },
  { from: 'flink', to: 'ckpt', label: 'snapshot', labelAt: [38, 0], dashed: true },
];

const variants: CompareVariant[] = [
  {
    id: 'add',
    label: 'Naive: add to a counter',
    nodes: nodes('Counter'),
    edges,
    steps: [
      { notes: [{ x: 625, y: 172, text: 'value: 0', anchor: 'middle', size: 18, tone: 'muted' }], caption: 'Window 12:01 for ad 7 holds 40 clicks. The last checkpoint was taken before these events. The sink is a counter and each result is applied as "count = count + result".', active: ['flink'] },
      { notes: [{ x: 625, y: 172, text: 'value: 40', anchor: 'middle', size: 18, tone: 'ok' }], caption: 'The window closes and Flink emits 40. The sink adds it: the counter reads 40. The next checkpoint has not finished yet.', packets: [{ from: 'flink', to: 'sink', label: '+40' }], tones: { sink: 'ok' } },
      { notes: [{ x: 625, y: 172, text: 'value: 40', anchor: 'middle', size: 18, tone: 'ok' }], caption: 'The Flink task crashes before the next checkpoint completes. The sink already holds the 40. Flink cannot know that.', tones: { flink: 'bad', sink: 'ok' } },
      { notes: [{ x: 625, y: 172, text: 'value: 40', anchor: 'middle', size: 18, tone: 'ok' }], caption: 'Flink restores state from the older checkpoint and replays the same events from Kafka. The window closes again and emits 40 again.', packets: [{ from: 'ckpt', to: 'flink', label: 'restore' }, { from: 'kafka', to: 'flink', label: 'replay', delay: 0.9 }], active: ['flink'] },
      { notes: [{ x: 625, y: 172, text: 'value: 80', anchor: 'middle', size: 18, tone: 'bad' }], caption: 'The sink adds again. The counter reads 80 and the real answer is 40. Flink counted the state once. The output still has a duplicate, because the sink was not idempotent.', packets: [{ from: 'flink', to: 'sink', label: '+40' }], tones: { sink: 'bad' } },
    ],
  },
  {
    id: 'upsert',
    label: 'Better: upsert by key',
    nodes: nodes('Minute row'),
    edges,
    steps: [
      { notes: [{ x: 625, y: 172, text: 'value: none', anchor: 'middle', size: 18, tone: 'muted' }], caption: 'Same situation. This time the sink stores one row per (ad id, minute). Each write says "set the value to the full count", not "add".', active: ['flink'] },
      { notes: [{ x: 625, y: 172, text: 'value: 40', anchor: 'middle', size: 18, tone: 'ok' }], caption: 'The window closes and Flink emits (ad 7, 12:01, 40). The sink sets the row to 40.', packets: [{ from: 'flink', to: 'sink', label: 'set 40' }], tones: { sink: 'ok' } },
      { notes: [{ x: 625, y: 172, text: 'value: 40', anchor: 'middle', size: 18, tone: 'ok' }], caption: 'The same crash happens. The row already holds 40.', tones: { flink: 'bad', sink: 'ok' } },
      { notes: [{ x: 625, y: 172, text: 'value: 40', anchor: 'middle', size: 18, tone: 'ok' }], caption: 'Flink restores the checkpoint and replays. The replay sees the same events, so the window closes with the same count: 40.', packets: [{ from: 'ckpt', to: 'flink', label: 'restore' }, { from: 'kafka', to: 'flink', label: 'replay', delay: 0.9 }], active: ['flink'] },
      { notes: [{ x: 625, y: 172, text: 'value: 40', anchor: 'middle', size: 18, tone: 'ok' }], caption: 'The sink sets the row to 40 again. Nothing changes. Replay is harmless because writing the same value twice changes nothing. The remaining risk is late events: they change the true count, so the batch job recounts them.', packets: [{ from: 'flink', to: 'sink', label: 'set 40' }], tones: { sink: 'ok' } },
    ],
  },
];

export default function AdClickCompare() {
  return <DesignCompare title="Restart and replay" prompt="Sink:" variants={variants} height={320} label="A Flink restart with an additive sink and an upsert sink" />;
}

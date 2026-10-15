import { DesignCompare, type CompareVariant } from '../DesignBuild';
import type { FlowEdge, FlowNode } from '../FlowDiagram';

/** One worker crash, two claim rules. */

const nodes = (): FlowNode[] => [
  { id: 'queue', x: 100, y: 120, w: 130, label: 'Ready queue', sub: 'job 42' },
  { id: 'w1', x: 340, y: 120, w: 130, label: 'Worker 1' },
  { id: 'store', x: 600, y: 120, w: 150, label: 'Job state', sub: 'run 42', h: 80, shape: 'db' },
  { id: 'w2', x: 340, y: 270, w: 130, label: 'Worker 2' },
];

const edges: FlowEdge[] = [
  { from: 'queue', to: 'w1', label: 'take' },
  { from: 'w1', to: 'store', label: 'state', labelAt: [0, -18] },
  { from: 'queue', to: 'w2', label: 'retry?', labelAt: [-16, 20], dashed: true },
];

const variants: CompareVariant[] = [
  {
    id: 'first',
    label: 'Naive: mark done first',
    nodes: nodes(),
    edges,
    steps: [
      { notes: [{ x: 600, y: 172, text: 'state: waiting', anchor: 'middle', size: 16, tone: 'muted' }, { x: 340, y: 322, text: 'idle', anchor: 'middle', size: 16, tone: 'muted' }], caption: 'Job 42 is due. It sends an invoice email. The rule: take the job, mark it done so nobody else runs it, then do the work.', active: ['queue'] },
      { notes: [{ x: 600, y: 172, text: 'state: done', anchor: 'middle', size: 16, tone: 'ok' }, { x: 340, y: 172, text: 'running', anchor: 'middle', size: 16, tone: 'accent' }, { x: 340, y: 322, text: 'idle', anchor: 'middle', size: 16, tone: 'muted' }], caption: 'Worker 1 takes the job and marks it done in the same moment.', packets: [{ from: 'queue', to: 'w1', label: 'job 42' }, { from: 'w1', to: 'store', label: 'done', delay: 0.9 }], tones: { store: 'ok' } },
      { notes: [{ x: 600, y: 172, text: 'state: done', anchor: 'middle', size: 16, tone: 'ok' }, { x: 340, y: 172, text: 'crashed', anchor: 'middle', size: 16, tone: 'bad' }, { x: 340, y: 322, text: 'idle', anchor: 'middle', size: 16, tone: 'muted' }], caption: 'Worker 1 crashes before it sends the email. The job state says done.', tones: { w1: 'bad', store: 'ok' } },
      { notes: [{ x: 600, y: 172, text: 'state: done, never ran', anchor: 'middle', size: 16, tone: 'bad' }, { x: 340, y: 172, text: 'crashed', anchor: 'middle', size: 16, tone: 'bad' }, { x: 340, y: 322, text: 'idle', anchor: 'middle', size: 16, tone: 'muted' }], caption: 'Nothing will ever run job 42 again. The queue is empty and the state says done. The job is lost without any error. This is at-most-once execution.', tones: { w1: 'bad', store: 'bad', w2: 'muted' } },
    ],
  },
  {
    id: 'lease',
    label: 'Better: lease and heartbeat',
    nodes: nodes(),
    edges,
    steps: [
      { notes: [{ x: 600, y: 172, text: 'state: waiting', anchor: 'middle', size: 16, tone: 'muted' }, { x: 340, y: 322, text: 'idle', anchor: 'middle', size: 16, tone: 'muted' }], caption: 'Same job. The new rule: claim the job with a lease of 30 seconds, do the work, and only then mark it done. The worker renews the lease while it works.', active: ['queue'] },
      { notes: [{ x: 600, y: 172, text: 'state: running, lease 30 s', anchor: 'middle', size: 16, tone: 'warn' }, { x: 340, y: 172, text: 'running', anchor: 'middle', size: 16, tone: 'accent' }, { x: 340, y: 322, text: 'idle', anchor: 'middle', size: 16, tone: 'muted' }], caption: 'Worker 1 takes the job and records a lease that ends in 30 seconds. State: running.', packets: [{ from: 'queue', to: 'w1', label: 'job 42' }, { from: 'w1', to: 'store', label: 'lease 30 s', delay: 0.9 }], tones: { store: 'warn' } },
      { notes: [{ x: 600, y: 172, text: 'lease: about 25 s left', anchor: 'middle', size: 16, tone: 'warn' }, { x: 340, y: 172, text: 'crashed', anchor: 'middle', size: 16, tone: 'bad' }, { x: 340, y: 322, text: 'idle', anchor: 'middle', size: 16, tone: 'muted' }], caption: 'Worker 1 crashes. It stops its heartbeats. The lease has about 30 seconds left and nobody renews it.', tones: { w1: 'bad', store: 'warn' } },
      { notes: [{ x: 600, y: 172, text: 'lease expired, retry', anchor: 'middle', size: 16, tone: 'warn' }, { x: 340, y: 172, text: 'crashed', anchor: 'middle', size: 16, tone: 'bad' }, { x: 340, y: 322, text: 'claims job: attempt 2', anchor: 'middle', size: 16, tone: 'accent' }], caption: 'The lease expires. The job is visible again and Worker 2 claims it with a new lease. This is at-least-once execution.', packets: [{ from: 'queue', to: 'w2', label: 'job 42' }], tones: { w1: 'bad', w2: 'ok', store: 'warn' }, active: ['w2'] },
      { notes: [{ x: 600, y: 172, text: 'state: done', anchor: 'middle', size: 16, tone: 'ok' }, { x: 340, y: 172, text: 'crashed', anchor: 'middle', size: 16, tone: 'bad' }, { x: 340, y: 322, text: 'finished', anchor: 'middle', size: 16, tone: 'ok' }], caption: 'Worker 2 finishes and marks the job done. The price: if Worker 1 had sent the email before it crashed, the email goes out twice. The task itself must be safe to repeat (idempotent).', packets: [{ from: 'w2', to: 'store', label: 'done' }], tones: { w1: 'bad', w2: 'ok', store: 'ok' } },
    ],
  },
];

export default function JobSchedulerCompare() {
  return <DesignCompare title="A worker crash" prompt="Claim rule:" variants={variants} height={350} label="A worker crash under mark-done-first and under lease and heartbeat" />;
}

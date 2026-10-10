import AnimFrame from '../AnimFrame';
import AsyncQueueViz, { type QMsg, type QWorker, type QMeter } from './AsyncQueueViz';

/** One worker, an ordered queue, and a limit of 3 receives (maxReceiveCount = 3). M is a poison message. */

interface Step {
  caption: string;
  buffer: QMsg[];
  worker: QWorker;
  meter: QMeter;
  dlq: QMsg[];
  activeWorker?: boolean;
  activeProducer?: boolean;
}

const g = (label: string): QMsg => ({ label });
const M = (extra: Partial<QMsg> = {}): QMsg => ({ label: 'M', tone: 'bad', ...extra });
const meter = (lag: number, tries: number | null, tone: QMeter['tone']): QMeter => ({
  label: tries === null ? `lag: ${lag} messages` : `lag: ${lag} messages · M tried ${tries} of 3`,
  fill: lag / 12,
  tone,
});

const steps: Step[] = [
  {
    caption:
      'A producer sends a message M and then good messages a to d. M is a poison message: its payload is broken, so every attempt to process it fails. One worker reads in order. The queue allows 3 receives per message (SQS calls this maxReceiveCount).',
    buffer: [M(), g('a'), g('b'), g('c'), g('d')],
    worker: { label: 'Worker', state: 'idle' },
    meter: meter(5, 0, 'ok'),
    dlq: [],
    activeProducer: true,
  },
  {
    caption: 'The worker receives M for the first time. Processing throws an error. The worker does not delete M, so M will come back when its visibility timeout ends.',
    buffer: [M({ hidden: true }), g('a'), g('b'), g('c'), g('d')],
    worker: { label: 'Worker', state: 'busy', msg: M() },
    meter: meter(5, 1, 'warn'),
    dlq: [],
    activeWorker: true,
  },
  {
    caption:
      'M is visible again, at the front. Receive number 2 fails the same way. Retrying a poison message cannot help, because the payload never changes. Behind it, a to d wait and new messages arrive. Lag grows.',
    buffer: [M(), g('a'), g('b'), g('c'), g('d'), g('e'), g('f')],
    worker: { label: 'Worker', state: 'busy', msg: M() },
    meter: meter(7, 2, 'warn'),
    dlq: [],
    activeWorker: true,
    activeProducer: true,
  },
  {
    caption:
      'Receive number 3 fails. M has now used its 3 receives, so the queue moves it to the dead-letter queue (DLQ) by itself. The worker never sees M again. An alarm on the DLQ size tells a person that something broke.',
    buffer: [g('a'), g('b'), g('c'), g('d'), g('e'), g('f'), g('g')],
    worker: { label: 'Worker', state: 'idle' },
    meter: meter(7, null, 'warn'),
    dlq: [M()],
  },
  {
    caption: 'The line moves again. The worker clears a to d at normal speed and lag falls. One bad message cost 3 attempts, not a stuck queue.',
    buffer: [g('e'), g('f'), g('g')],
    worker: { label: 'Worker', state: 'busy', msg: g('d') },
    meter: meter(3, null, 'ok'),
    dlq: [M()],
    activeWorker: true,
  },
  {
    caption:
      'An engineer reads M in the DLQ, finds the bug in the parser, and ships a fix. Then the engineer redrives: the queue moves M from the DLQ back to the source queue. The DLQ did not fix anything. It kept M safe until a fix existed.',
    buffer: [M({ tone: 'ok' }), g('e'), g('f'), g('g')],
    worker: { label: 'Worker', state: 'idle' },
    meter: meter(4, null, 'ok'),
    dlq: [],
  },
  {
    caption: 'The fixed worker processes M and deletes it. Lag is back to zero and the DLQ is empty. Receive limit, DLQ, alarm, and redrive: that is the whole loop.',
    buffer: [],
    worker: { label: 'Worker', state: 'busy', msg: M({ tone: 'ok' }) },
    meter: meter(0, null, 'ok'),
    dlq: [],
    activeWorker: true,
  },
];

export default function AsyncPoisonWalk() {
  return (
    <AnimFrame title="A poison message, retries, and the dead-letter queue" steps={steps} interval={4200}>
      {(_, s) => (
        <AsyncQueueViz
          trayLabel="Orders queue"
          buffer={s.buffer}
          workers={[s.worker]}
          meter={s.meter}
          dlq={{ items: s.dlq }}
          activeWorker={s.activeWorker ? 0 : undefined}
          activeProducer={s.activeProducer}
          label="A queue with one worker. A message that always fails moves to a dead-letter queue after three receives."
        />
      )}
    </AnimFrame>
  );
}

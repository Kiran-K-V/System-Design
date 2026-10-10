import AnimFrame from '../AnimFrame';
import AsyncQueueViz, { type QMsg, type QWorker, type QMeter } from './AsyncQueueViz';

interface Step {
  caption: string;
  buffer: QMsg[];
  workers: QWorker[];
  meter: QMeter;
  activeWorker?: number;
  activeProducer?: boolean;
}

const m = (label: string, extra: Partial<QMsg> = {}): QMsg => ({ label, ...extra });
const idle = (n: number): QWorker => ({ label: `Worker ${n}`, state: 'idle' });
const none: QMeter = { label: 'visibility timer: not running', fill: 0, tone: 'muted' };

const steps: Step[] = [
  {
    caption:
      'A producer adds three messages, A, B, and C. A queue stores them in a buffer. Workers take messages from the head. The producer does not wait for any worker.',
    buffer: [m('A'), m('B'), m('C')],
    workers: [idle(1), idle(2)],
    meter: none,
    activeProducer: true,
  },
  {
    caption:
      'Worker 1 receives A and worker 2 receives B. Receiving does not delete a message. The queue hides it for the visibility timeout, 30 seconds by default in SQS, and starts a timer. A hidden message is drawn dashed.',
    buffer: [m('A', { hidden: true }), m('B', { hidden: true }), m('C')],
    workers: [{ label: 'Worker 1', state: 'busy', msg: m('A', { tone: 'accent' }) }, { label: 'Worker 2', state: 'busy', msg: m('B', { tone: 'accent' }) }],
    meter: { label: 'timer for A: 30 s left', fill: 1, tone: 'warn' },
    activeWorker: 0,
  },
  {
    caption:
      'Worker 2 finishes B and deletes it. Delete is the real acknowledgement. Worker 1 crashes in the middle of A. It never deletes A. The queue cannot tell a crash from slow work, so it only waits for the timer.',
    buffer: [m('A', { hidden: true }), m('C')],
    workers: [{ label: 'Worker 1', state: 'down' }, idle(2)],
    meter: { label: 'timer for A: 12 s left', fill: 0.4, tone: 'warn' },
  },
  {
    caption:
      'The timer reaches zero. A turns visible again. Nobody told the queue that worker 1 failed. The timeout alone brought A back. This is why a queue gives "at least once" delivery: a message can be handed out more than once.',
    buffer: [m('A', { tone: 'warn' }), m('C')],
    workers: [{ label: 'Worker 1', state: 'down' }, idle(2)],
    meter: { label: 'timeout reached: A is visible again', fill: 0, tone: 'muted' },
  },
  {
    caption:
      'Worker 2 receives A. A is hidden again, with a new 30 second timer. Worker 1 may have done half of the job before it crashed. So the job must be safe to run again (lesson 3.4).',
    buffer: [m('A', { hidden: true }), m('C')],
    workers: [{ label: 'Worker 1', state: 'down' }, { label: 'Worker 2', state: 'busy', msg: m('A', { tone: 'accent' }) }],
    meter: { label: 'timer for A: 30 s left', fill: 1, tone: 'warn' },
    activeWorker: 1,
  },
  {
    caption:
      'Worker 2 finishes A and deletes it. Now A is gone for good. Only C remains. Pick the timeout longer than your slowest job, because a shorter one hands the same message to a second worker while the first still runs it.',
    buffer: [m('C')],
    workers: [{ label: 'Worker 1', state: 'down' }, idle(2)],
    meter: { label: 'A deleted. Nothing hidden.', fill: 0, tone: 'ok' },
  },
];

export default function AsyncVisibilityWalk() {
  return (
    <AnimFrame title="A worker crashes: the visibility timeout returns the message" steps={steps} interval={3600}>
      {(_, s) => (
        <AsyncQueueViz
          buffer={s.buffer}
          workers={s.workers}
          meter={s.meter}
          activeWorker={s.activeWorker}
          activeProducer={s.activeProducer}
          label="Queue with two workers. Worker 1 crashes and its message returns after the visibility timeout."
        />
      )}
    </AnimFrame>
  );
}

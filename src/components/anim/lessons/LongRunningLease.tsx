import AnimFrame from '../AnimFrame';
import AsyncQueueViz, { type QMeter, type QMsg, type QWorker } from './AsyncQueueViz';

interface Step {
  caption: string;
  buffer: QMsg[];
  workers: QWorker[];
  meter: QMeter;
  activeWorker?: number;
  activeProducer?: boolean;
  note?: string;
}

const m = (label: string, extra: Partial<QMsg> = {}): QMsg => ({ label, ...extra });
const idle = (n: string): QWorker => ({ label: `Worker ${n}`, state: 'idle' });
const busy = (n: string, job: string): QWorker => ({ label: `Worker ${n}`, state: 'busy', msg: m(job, { tone: 'accent' }) });
const none: QMeter = { label: 'lease: no job leased', fill: 0, tone: 'muted' };

const steps: Step[] = [
  { caption: 'A client posts a request that needs minutes of work. The API stores a job record (QUEUED), puts job 1 on the queue, and replies at once with 202 Accepted and a job id. The client does not hold a connection open for the work.', buffer: [m('J1')], workers: [idle('A'), idle('B')], meter: none, activeProducer: true, note: 'API: 202 + id' },
  { caption: 'Worker A receives J1. The queue hides J1 and starts a lease: a time limit after which J1 returns to the queue. The numbers here are illustrative (SQS defaults to a 30 second visibility timeout). The job record becomes RUNNING.', buffer: [m('J1', { hidden: true })], workers: [busy('A', 'J1'), idle('B')], meter: { label: 'lease: 30 s left', fill: 1, tone: 'warn' }, activeWorker: 0 },
  { caption: 'A is alive and still working, so it renews the lease. This is a heartbeat. SQS has no heartbeat call: you extend the visibility timeout with ChangeMessageVisibility. Temporal has a real Activity Heartbeat. The effect is the same: a live worker keeps its claim.', buffer: [m('J1', { hidden: true })], workers: [busy('A', 'J1'), idle('B')], meter: { label: 'renewed: 30 s left', fill: 1, tone: 'ok' }, activeWorker: 0 },
  { caption: 'A heartbeats again and saves a checkpoint: "rows 1 to 4000 done". A heartbeat can carry progress, so a later attempt can resume instead of starting over. The client sees progress 40% when it asks for status.', buffer: [m('J1', { hidden: true })], workers: [busy('A', 'J1'), idle('B')], meter: { label: 'renewed: 30 s left', fill: 1, tone: 'ok' }, activeWorker: 0 },
  { caption: 'Worker A crashes. It cannot send a goodbye. The queue only sees that heartbeats stopped. The lease timer runs down. The job record still says RUNNING, and nobody has been told anything is wrong.', buffer: [m('J1', { hidden: true })], workers: [{ label: 'Worker A', state: 'down' }, idle('B')], meter: { label: 'no heartbeat: 12 s left', fill: 0.4, tone: 'bad' } },
  { caption: 'The lease expires. J1 becomes visible again. The queue could not tell a crash from slow work, so a short lease gives fast recovery but risks double work, and a long lease gives slow recovery.', buffer: [m('J1', { tone: 'warn' })], workers: [{ label: 'Worker A', state: 'down' }, idle('B')], meter: { label: 'lease expired: J1 is visible', fill: 0, tone: 'muted' } },
  { caption: 'Worker B receives J1 as attempt 2 and takes a new lease. It reads the checkpoint and resumes after row 4000. A may have done part of the work before it died, or even finished the last effect. So every effect must be safe to repeat (lessons 3.4 and 6.3).', buffer: [m('J1', { hidden: true })], workers: [{ label: 'Worker A', state: 'down' }, busy('B', 'J1')], meter: { label: 'new lease: 30 s left', fill: 1, tone: 'warn' }, activeWorker: 1 },
  { caption: 'B finishes. It writes the result, sets the job record to SUCCEEDED, and deletes J1 from the queue. The delete is the real acknowledgement. If B had crashed after the effect but before the delete, J1 would come back once more, and the idempotency key would turn the repeat into a no-op.', buffer: [], workers: [{ label: 'Worker A', state: 'down' }, idle('B')], meter: { label: 'J1 deleted: job SUCCEEDED', fill: 0, tone: 'ok' } },
];

export default function LongRunningLease() {
  return (
    <AnimFrame title="A worker leases a job, heartbeats, dies, and the job is reassigned" steps={steps} interval={5200}>
      {(_, s) => (
        <AsyncQueueViz
          buffer={s.buffer}
          workers={s.workers}
          meter={s.meter}
          activeWorker={s.activeWorker}
          activeProducer={s.activeProducer}
          producerNote={s.note}
          label="A job enters a queue. Worker A leases it and heartbeats, then crashes. The lease expires and worker B finishes the job."
        />
      )}
    </AnimFrame>
  );
}

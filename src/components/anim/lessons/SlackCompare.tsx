import { DesignCompare, type CompareVariant } from '../DesignBuild';

const before: CompareVariant = {
  id: 'before',
  label: 'Before',
  nodes: [
    { id: 'web', x: 90, y: 150, w: 110, h: 56, label: 'Web app' },
    { id: 'redis', x: 340, y: 150, w: 150, h: 80, shape: 'db', label: 'Redis', sub: 'RAM only' },
    { id: 'workers', x: 600, y: 150, w: 130, h: 56, label: 'Workers' },
  ],
  edges: [
    { from: 'web', to: 'redis', label: 'enqueue' },
    { from: 'workers', to: 'redis', label: 'dequeue' },
  ],
  steps: [
    { caption: 'The web app hashes a job ID to pick a Redis host and enqueues the job. Worker pools poll Redis, run the job, and move on.', packets: [{ from: 'web', to: 'redis', label: 'job' }], active: ['redis'] },
    { caption: 'Database contention makes jobs run slowly. Jobs arrive faster than they finish, so the queue grows in memory.', tones: { redis: 'warn' }, active: ['redis'], notes: [{ x: 340, y: 235, text: 'queue grows in RAM', anchor: 'middle', tone: 'warn' }] },
    { caption: 'Redis reaches its maximum configured memory. New jobs cannot be enqueued.', tones: { redis: 'bad' }, packets: [{ from: 'web', to: 'redis', label: 'job', tone: 'bad' }], notes: [{ x: 340, y: 235, text: 'full: enqueue fails', anchor: 'middle', tone: 'bad' }] },
    { caption: 'Worse, dequeuing a job also needed a little free memory. Even after the database recovered, the queue stayed locked and recovery was manual.', tones: { redis: 'bad', workers: 'bad' }, packets: [{ from: 'workers', to: 'redis', tone: 'bad' }], notes: [{ x: 340, y: 235, text: 'dequeue needs memory too', anchor: 'middle', tone: 'bad' }] },
  ],
};

const after: CompareVariant = {
  id: 'after',
  label: 'After',
  nodes: [
    { id: 'web', x: 90, y: 80, w: 110, h: 56, label: 'Web app' },
    { id: 'gate', x: 280, y: 80, w: 130, h: 56, label: 'Kafkagate' },
    { id: 'kafka', x: 540, y: 80, w: 150, h: 80, shape: 'db', label: 'Kafka', sub: 'durable log' },
    { id: 'relay', x: 540, y: 225, w: 130, h: 56, label: 'JQRelay' },
    { id: 'redis', x: 310, y: 225, w: 130, h: 80, shape: 'db', label: 'Redis' },
    { id: 'workers', x: 90, y: 225, w: 110, h: 56, label: 'Workers' },
  ],
  edges: [
    { from: 'web', to: 'gate' },
    { from: 'gate', to: 'kafka' },
    { from: 'kafka', to: 'relay' },
    { from: 'relay', to: 'redis' },
    { from: 'workers', to: 'redis' },
  ],
  steps: [
    { caption: 'The web app now POSTs the job to Kafkagate, a stateless Go service. It writes to Kafka and waits only for the partition leader to acknowledge.', packets: [{ from: 'web', to: 'gate', label: 'job' }, { from: 'gate', to: 'kafka', label: 'job', delay: 0.9 }], active: ['kafka'], tones: { kafka: 'ok' } },
    { caption: 'Kafka keeps jobs on disk, with 3 replicas and 2 days of retention. A spike lands in the log, not in Redis memory.', active: ['kafka'], tones: { kafka: 'ok' }, notes: [{ x: 620, y: 150, text: 'backlog is on disk', anchor: 'middle', tone: 'ok' }] },
    { caption: 'JQRelay reads each topic and writes jobs into Redis at a rate operators can tune. It advances the Kafka offset only after the Redis write succeeds.', packets: [{ from: 'kafka', to: 'relay', label: 'job' }, { from: 'relay', to: 'redis', label: 'job', delay: 0.9 }], active: ['relay'], tones: { relay: 'ok' } },
    { caption: 'Workers still pull from Redis exactly as before, so the old enqueue and dequeue interfaces did not have to change.', packets: [{ from: 'redis', to: 'workers', label: 'job' }], active: ['workers'], tones: { relay: 'ok', redis: 'ok' } },
    { caption: 'If Redis is down, the relay retries and the offset stops moving. Jobs pile up in Kafka instead of being refused at the front door.', tones: { redis: 'bad', relay: 'warn', kafka: 'ok' }, active: ['relay'], notes: [{ x: 620, y: 150, text: 'backlog waits in Kafka', anchor: 'middle', tone: 'ok' }] },
  ],
};

export default function SlackCompare() {
  return (
    <DesignCompare
      title="Slack job queue"
      prompt="Design:"
      variants={[before, after]}
      height={310}
      label="Before, the web app enqueued straight into Redis memory. After, jobs go through Kafkagate into Kafka, and JQRelay moves them into Redis at a controlled rate."
    />
  );
}

import DesignBuild, { type BuildEdge, type BuildGroup, type BuildNode, type BuildStep } from '../DesignBuild';

/** Job scheduler: the design grows one requirement at a time. */

const nodes: BuildNode[] = [
  { id: 'client', x: 80, y: 90, w: 110, label: 'Client', step: 0 },
  { id: 'api', x: 225, y: 90, w: 110, label: 'Job API', step: 0 },
  { id: 'store', x: 370, y: 90, w: 110, label: 'Job store', sub: 'next_run_at', h: 80, shape: 'db', step: 0 },
  { id: 'sched', x: 515, y: 90, w: 110, label: 'Scheduler', sub: 'bucket scan', step: 2 },
  { id: 'etcd', x: 650, y: 90, w: 100, label: 'etcd', sub: 'shard owner', step: 6 },
  { id: 'queue', x: 515, y: 220, w: 110, label: 'Ready queue', step: 3 },
  { id: 'workers', x: 370, y: 350, w: 110, label: 'Workers', sub: 'claim + renew', step: 4 },
];

const edges: BuildEdge[] = [
  { from: 'client', to: 'api', step: 0 },
  { from: 'api', to: 'store', head: 'both', step: 0 },
  { from: 'store', to: 'sched', step: 2 },
  { from: 'sched', to: 'queue', label: 'at due time', labelAt: [48, 0], step: 3 },
  { from: 'queue', to: 'workers', label: 'claim', labelAt: [30, 0], step: 4 },
  { from: 'workers', to: 'store', label: 'result', labelAt: [-30, 0], step: 5 },
  { from: 'sched', to: 'etcd', step: 6 },
];

const groups: BuildGroup[] = [{ x: 296, y: 22, w: 290, h: 130, label: 'one shard: store slice + scheduler', step: 7 }];

const steps: BuildStep[] = [
  { req: 'FR1: schedule a job', caption: 'A client posts a job: the task to run, its parameters, and a schedule (now, a time, or a repeat rule such as every day at 10:00). The API stores it with a computed next_run_at time. For a repeating job this is the first time only.', packets: [{ from: 'client', to: 'api', label: 'job' }, { from: 'api', to: 'store', label: 'insert', delay: 0.9 }] },
  { req: 'FR2: see job status', caption: 'No new box. Status is a read of the same store: the job row plus the latest run row. The workers will keep it up to date.', active: ['store'] },
  { req: 'NFR: start within 2 s of due', caption: 'A scheduler scans the store for jobs due in the next minute. It reads one time bucket once, ahead of time, instead of polling the whole table every second.', packets: [{ from: 'store', to: 'sched', label: 'bucket' }] },
  { req: 'NFR: start within 2 s of due', caption: 'The scheduler holds the bucket in memory, sorted by time. When a job becomes due it creates a run row, moves a repeating job to its next time in the same transaction (all writes happen or none do), and pushes the run onto the ready queue (lesson 6.1).', packets: [{ from: 'sched', to: 'queue', label: 'due' }] },
  { req: 'NFR: run every due job at least once', caption: 'Workers take a job from the queue and claim it with a lease: a time-limited right to run it. A worker that is still alive renews the lease with heartbeats.', packets: [{ from: 'queue', to: 'workers', label: 'job' }] },
  { req: 'FR2: see job status', caption: 'When a run ends, the worker writes the result into the run row. Status readers see it. The schedule was already moved forward by the scheduler, so a slow run does not shift the next one.', packets: [{ from: 'workers', to: 'store', label: 'done' }] },
  { req: 'NFR: no single point of failure', caption: 'Several scheduler processes run. A small coordination service such as etcd (lesson 8.8) hands out one lease per shard, so exactly one scheduler owns each shard at a time. If it dies, another takes over.', packets: [{ from: 'sched', to: 'etcd', label: 'lease' }] },
  { req: 'NFR: 10,000 jobs per second', caption: 'Split the job store by job id into shards. Each shard has its own scheduler and its own share of the bucket. Workers and the queue scale by adding machines.', active: ['store', 'sched'] },
];

export default function JobSchedulerBuild() {
  return <DesignBuild title="Job scheduler, built up" steps={steps} nodes={nodes} edges={edges} groups={groups} height={400} label="Job scheduler architecture growing from API and job store to sharded schedulers and workers" />;
}

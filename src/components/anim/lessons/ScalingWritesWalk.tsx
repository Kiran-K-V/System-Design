import AnimFrame from '../AnimFrame';
import FlowDiagram, { type FlowEdge, type FlowNode, type FlowNote, type FlowPacket, type Tone } from '../FlowDiagram';

/** One write burst, from "straight into the database" to batching, sharding, and key salting. */

interface Step {
  caption: string;
  note: string;
  noteTone?: Tone;
  nodes: FlowNode[];
  edges: FlowEdge[];
  packets?: FlowPacket[];
  active?: string[];
}

const clients: FlowNode = { id: 'clients', x: 55, y: 150, w: 90, h: 50, label: 'Clients' };
const api: FlowNode = { id: 'api', x: 175, y: 150, w: 90, h: 50, label: 'API' };
const queue: FlowNode = { id: 'queue', x: 325, y: 150, w: 120, h: 50, label: 'Queue' };
const worker: FlowNode = { id: 'worker', x: 475, y: 150, w: 100, h: 60, label: 'Batch\nworker' };
const lone: FlowNode = { id: 'db', x: 635, y: 150, w: 110, h: 80, label: 'Database', shape: 'db' };
const shard = (n: number, tone?: Tone, sub?: string): FlowNode => ({ id: `s${n}`, x: 635, y: 50 + n * 100, w: 110, h: 76, label: `Shard ${n + 1}`, sub, shape: 'db', tone });

const direct = (tone?: Tone): FlowEdge[] => [{ from: 'clients', to: 'api' }, { from: 'api', to: 'db', tone, bend: 0 }];
const buffered: FlowEdge[] = [
  { from: 'clients', to: 'api' },
  { from: 'api', to: 'queue', label: 'ack', labelAt: [0, -16] },
  { from: 'queue', to: 'worker' },
];

const steps: Step[] = [
  {
    caption: 'A sale starts. Writes arrive at 30,000 per second for a short time. One primary takes ~10,000 simple writes per second (lesson 1.5 gives 5K to 20K). Writes queue up inside the database, latency climbs, and clients time out.',
    note: '30K/s burst, 10K/s ceiling',
    noteTone: 'bad',
    nodes: [clients, api, { ...lone, tone: 'bad' }],
    edges: direct('bad'),
    packets: [{ from: 'api', to: 'db', tone: 'bad' }],
    active: ['db'],
  },
  {
    caption: 'Write-behind through a queue (lesson 6.1). The API appends the write to a durable queue and answers at once. A worker drains the queue at the database\'s pace. The burst becomes a backlog, not an outage. The ack now means "accepted", not "stored".',
    note: 'queue absorbs the burst',
    nodes: [clients, api, { ...queue, tone: 'warn', sub: 'backlog grows' }, worker, lone],
    edges: [...buffered, { from: 'worker', to: 'db' }],
    packets: [{ from: 'api', to: 'queue', tone: 'ok' }],
    active: ['queue'],
  },
  {
    caption: 'Batching. Each commit has a fixed cost (flush to disk) plus a small cost per row. The worker groups 100 rows into one transaction, so the fixed cost is paid once per 100 rows. In the lab below, 1 row per commit gives 10K rows/s and batches of 100 give ~48K rows/s. The per-row cost sets the new ceiling.',
    note: 'one commit, 100 rows',
    nodes: [clients, api, queue, { ...worker, label: 'Worker', sub: 'batch of 100', tone: 'ok' }, lone],
    edges: [...buffered, { from: 'worker', to: 'db', label: 'commit', labelAt: [-4, -26] }],
    packets: [{ from: 'worker', to: 'db', tone: 'ok' }],
    active: ['worker'],
  },
  {
    caption: 'The costs of write-behind. A reader who looks right after the write finds nothing, because the row is still in the queue. If the queue is not durable, a crash loses acknowledged writes. And the backlog must drain: if the average write rate exceeds drain speed, the queue grows forever.',
    note: 'accepted is not readable yet',
    noteTone: 'warn',
    nodes: [{ ...clients, sub: 'reads now' }, api, { ...queue, sub: 'row still here' }, worker, { ...lone, tone: 'bad', sub: 'not there yet' }],
    edges: [...buffered, { from: 'worker', to: 'db' }, { from: 'api', to: 'db', dashed: true, tone: 'bad', bend: 70, label: 'read: miss', labelAt: [0, 22] }],
    active: ['db'],
  },
  {
    caption: 'Sharding (lesson 4.7). One database cannot take sustained writes above its ceiling, so split the key space. The worker hashes the key and sends each row to one of 3 shards. With evenly spread keys the cluster takes about 3 times the writes. Writes to different shards never touch.',
    note: 'hash(key) picks the shard',
    nodes: [clients, api, queue, worker, shard(0, 'ok'), shard(1, 'ok'), shard(2, 'ok')],
    edges: [...buffered, { from: 'worker', to: 's0' }, { from: 'worker', to: 's1' }, { from: 'worker', to: 's2' }],
    packets: [
      { from: 'worker', to: 's0', tone: 'ok' },
      { from: 'worker', to: 's1', tone: 'ok', delay: 0.15 },
      { from: 'worker', to: 's2', tone: 'ok', delay: 0.3 },
    ],
    active: ['s0', 's1', 's2'],
  },
  {
    caption: 'A hot partition. One key, say a live match counter, takes 60% of all writes. Hashing sends every write for that key to the same shard. That shard saturates while the other two idle. Adding shards does not help, because the key still maps to one.',
    note: 'one key, one shard: 60% of writes',
    noteTone: 'bad',
    nodes: [clients, api, queue, worker, shard(0, 'bad', '60% of writes'), shard(1, undefined, '20%'), shard(2, undefined, '20%')],
    edges: [...buffered, { from: 'worker', to: 's0', tone: 'bad', label: 'hot key', labelAt: [-44, 10] }, { from: 'worker', to: 's1' }, { from: 'worker', to: 's2' }],
    packets: [
      { from: 'worker', to: 's0', tone: 'bad' },
      { from: 'worker', to: 's0', tone: 'bad', delay: 0.25 },
    ],
    active: ['s0'],
  },
  {
    caption: 'Key salting. Write to hot#0, hot#1, hot#2 instead of hot, picking the suffix at random or by a calculation. The same key now spreads over all three shards. DynamoDB\'s guide describes this. The price: to read the whole key you query every suffix and merge, so reads cost 3 lookups.',
    note: 'hot#0, hot#1, hot#2 spread the key',
    noteTone: 'ok',
    nodes: [clients, api, queue, worker, shard(0, 'ok', 'hot#0'), shard(1, 'ok', 'hot#1'), shard(2, 'ok', 'hot#2')],
    edges: [...buffered, { from: 'worker', to: 's0' }, { from: 'worker', to: 's1' }, { from: 'worker', to: 's2' }],
    packets: [
      { from: 'worker', to: 's0', tone: 'ok' },
      { from: 'worker', to: 's1', tone: 'ok', delay: 0.15 },
      { from: 'worker', to: 's2', tone: 'ok', delay: 0.3 },
    ],
    active: ['s0', 's1', 's2'],
  },
];

export default function ScalingWritesWalk() {
  return (
    <AnimFrame title="Scaling writes: a burst meets the database" steps={steps} interval={5600}>
      {(i, s) => (
        <FlowDiagram
          width={720}
          height={310}
          nodes={s.nodes}
          edges={s.edges}
          notes={[{ x: 360, y: 14, text: s.note, anchor: 'middle', size: 16, tone: s.noteTone } as FlowNote]}
          packets={s.packets}
          active={s.active}
          stepKey={i}
          label="Clients and an API write through a queue and a batching worker into one database, then three shards."
        />
      )}
    </AnimFrame>
  );
}

import AnimFrame from '../AnimFrame';
import FlowDiagram, { type FlowEdge, type FlowGroup, type FlowNode, type FlowNote, type FlowPacket } from '../FlowDiagram';

type Stage = 'one' | 'range' | 'lookup' | 'hash' | 'directory' | 'replicas';

interface Step {
  caption: string;
  stage: Stage;
  active: string[];
  packets: FlowPacket[];
}

const steps: Step[] = [
  {
    caption: 'One primary database holds the whole users table: 30 TB and 40,000 writes per second. One node handles about 10 TB and 5K–20K writes per second comfortably. Two limits are broken at once, and replicas cannot help: every replica must still apply every write.',
    stage: 'one',
    active: ['db'],
    packets: [],
  },
  {
    caption: 'Split the table by rows. Choose a shard key, here user_id. Range sharding gives each shard a contiguous range of ids. A router sits in front. Each shard holds a third of the data and sees a third of the writes.',
    stage: 'range',
    active: ['router', 's1', 's2', 's3'],
    packets: [],
  },
  {
    caption: 'A request for user 1,500,000 arrives. The router compares the key with the ranges and sends it to shard 2 only. One shard answers. A scan of ids 1,400,000 to 1,600,000 also stays on one or two shards.',
    stage: 'lookup',
    active: ['client', 'router', 's2'],
    packets: [
      { from: 'client', to: 'router', label: 'user 1.5M' },
      { from: 'router', to: 's2', delay: 0.9 },
    ],
  },
  {
    caption: 'Hash sharding: shard = hash(user_id) mod number-of-shards. Neighboring ids scatter over all shards. Load spreads evenly, even if one range of ids is busy. The price: a range scan must ask every shard.',
    stage: 'hash',
    active: ['router', 's1', 's2', 's3'],
    packets: [
      { from: 'router', to: 's1', label: 'id 7' },
      { from: 'router', to: 's2', label: 'id 8', delay: 0.15 },
      { from: 'router', to: 's3', label: 'id 9', delay: 0.3 },
    ],
  },
  {
    caption: 'Directory sharding: a lookup table maps each key (or key group) to a shard. Any placement is possible. You can move one hot key to its own shard. The price: the directory is a new service, on the path of every request, and it must never be wrong.',
    stage: 'directory',
    active: ['router', 'dir'],
    packets: [{ from: 'router', to: 'dir' }],
  },
  {
    caption: 'Sharding and replication work together. Each shard is itself a small replicated group: one leader and followers. Sharding spreads writes and data. Replication keeps each shard alive when a machine fails.',
    stage: 'replicas',
    active: ['s1', 's2', 's3', 'r1', 'r2', 'r3'],
    packets: [],
  },
];

const rangeText: Record<string, string> = { s1: 'ids\n1 – 1M', s2: 'ids\n1M – 2M', s3: 'ids\n2M – 3M' };
const hashText: Record<string, string> = { s1: 'hash(id)\nmod 3 = 0', s2: 'hash(id)\nmod 3 = 1', s3: 'hash(id)\nmod 3 = 2' };
const dirText: Record<string, string> = { s1: 'any keys\nthe table says', s2: 'hot key 42\nalone', s3: 'any keys\nthe table says' };

export default function ShardSplit() {
  return (
    <AnimFrame title="Split one table across shards" steps={steps} interval={3200}>
      {(_, s) => {
        const one = s.stage === 'one';
        const text = s.stage === 'hash' ? hashText : s.stage === 'directory' ? dirText : rangeText;
        const nodes: FlowNode[] = [{ id: 'client', x: 70, y: 175, w: 100, h: 56, label: 'App', sub: 'servers' }];
        const edges: FlowEdge[] = [];
        const notes: FlowNote[] = [];
        const groups: FlowGroup[] = [];

        if (one) {
          nodes.push({ id: 'db', x: 400, y: 175, w: 150, h: 120, shape: 'db', label: 'users', sub: '30 TB', tone: 'bad' });
          edges.push({ from: 'client', to: 'db', label: '40K writes/s', tone: 'bad', labelAt: [0, -18] });
          notes.push({ x: 540, y: 120, text: 'too big for\none disk', tone: 'bad' }, { x: 540, y: 230, text: 'too many writes\nfor one primary', tone: 'bad' });
        } else {
          nodes.push({ id: 'router', x: 250, y: 175, w: 120, h: 60, label: 'Router', sub: 'knows the map' });
          edges.push({ from: 'client', to: 'router' });
          const ys: Record<string, number> = { s1: 60, s2: 175, s3: 290 };
          for (const id of ['s1', 's2', 's3']) {
            nodes.push({ id, x: 560, y: ys[id], w: 130, h: 82, shape: 'db', label: `Shard ${id[1]}`, sub: text[id].replace('\n', ' ') });
            edges.push({ from: 'router', to: id });
          }
          if (s.stage === 'directory') {
            nodes.push({ id: 'dir', x: 250, y: 50, w: 140, h: 56, shape: 'dashed', label: 'Directory', sub: 'key → shard' });
            edges.push({ from: 'router', to: 'dir', head: 'both' });
            notes.push({ x: 330, y: 20, text: 'one more thing to run', anchor: 'start' });
          }
          if (s.stage === 'replicas') {
            for (const [i, id] of ['s1', 's2', 's3'].entries()) {
              const y = ys[id];
              nodes.push({ id: `r${i + 1}`, x: 790, y, w: 110, h: 70, shape: 'db', label: 'follower', sub: `copy of ${i + 1}`, tone: 'ok' });
              edges.push({ from: id, to: `r${i + 1}`, dashed: true, tone: 'ok', label: 'replicate', labelAt: [0, -14] });
              groups.push({ x: 425, y: y - 52, w: 435, h: 104, label: `group ${i + 1}` });
            }
          }
        }
        return (
          <FlowDiagram
            width={900}
            height={350}
            nodes={nodes}
            edges={edges}
            notes={notes}
            groups={groups}
            active={s.active}
            packets={s.packets}
            stepKey={s.stage}
            label="A table split into three shards behind a router"
          />
        );
      }}
    </AnimFrame>
  );
}

import AnimFrame from '../AnimFrame';
import FlowDiagram, { type FlowEdge, type FlowNode, type FlowNote, type FlowPacket } from '../FlowDiagram';
import { HandText, SketchSvg } from '../sketch';

type Stage = 'key' | 'all' | 'slow' | 'tail' | 'index';

interface Step {
  caption: string;
  stage: Stage;
}

const steps: Step[] = [
  { caption: 'Query 1: "orders for user 42". The table is sharded by user_id. The router hashes 42, finds shard 2, and asks only that shard. One shard, one round trip, about 5 ms.', stage: 'key' },
  { caption: 'Query 2: "all orders over $500 today". The amount is not the shard key. The router cannot tell which shards hold matches, so it sends the query to every shard. This is scatter.', stage: 'all' },
  { caption: 'Each shard answers by itself. Three take 4 to 6 ms. Shard 4 is busy and takes 38 ms. The router must wait for the last reply before it can merge. This is gather. The query takes about 38 ms, not 5 ms.', stage: 'slow' },
  { caption: 'This gets worse with more shards. Say each shard is slow on 1% of requests. Ask 10 shards, and 9.6% of queries hit at least one slow shard. Ask 100 shards, and 63% do. The fan-out query is slow far more often than any one shard.', stage: 'tail' },
  { caption: 'A common fix: build a second, sharded copy keyed by amount (a global secondary index). The query now asks one index shard, then fetches from the 2 data shards that match. The price: every write updates two places.', stage: 'index' },
];

const SY = [50, 135, 220, 305];

function diagram(stage: Exclude<Stage, 'tail'>) {
  const nodes: FlowNode[] = [
    { id: 'client', x: 65, y: 178, w: 96, h: 56, label: 'App' },
    { id: 'router', x: 245, y: 178, w: 120, h: 60, label: 'Router' },
  ];
  const edges: FlowEdge[] = [{ from: 'client', to: 'router' }];
  const notes: FlowNote[] = [];
  let packets: FlowPacket[] = [];
  let active: string[] = ['router'];
  const times = ['4 ms', '5 ms', '6 ms', '38 ms'];
  const shardX = stage === 'index' ? 640 : 600;
  SY.forEach((y, i) => {
    const id = `s${i + 1}`;
    nodes.push({
      id,
      x: shardX,
      y,
      w: 130,
      h: 64,
      shape: 'db',
      label: `Shard ${i + 1}`,
      sub: stage === 'slow' ? times[i] : undefined,
      tone: stage === 'slow' && i === 3 ? 'bad' : stage === 'key' && i !== 1 ? 'muted' : 'default',
    });
  });

  if (stage === 'key') {
    edges.push({ from: 'router', to: 's2' });
    packets = [
      { from: 'client', to: 'router', label: 'user 42' },
      { from: 'router', to: 's2', delay: 0.9 },
    ];
    active = ['router', 's2'];
    notes.push({ x: 700, y: 135, text: 'only shard 2\nis asked', anchor: 'start' });
  } else if (stage === 'all') {
    for (let i = 1; i <= 4; i++) edges.push({ from: 'router', to: `s${i}` });
    packets = [
      { from: 'client', to: 'router', label: 'amount>500' },
      ...[1, 2, 3, 4].map((i) => ({ from: 'router', to: `s${i}`, delay: 0.9 })),
    ];
    active = ['router', 's1', 's2', 's3', 's4'];
    notes.push({ x: 700, y: 178, text: 'every shard\nis asked', anchor: 'start' });
  } else if (stage === 'slow') {
    for (let i = 1; i <= 4; i++) edges.push({ from: 'router', to: `s${i}`, head: 'both' });
    packets = [1, 2, 3, 4].map((i) => ({ from: `s${i}`, to: 'router', tone: i === 4 ? 'bad' : 'ok' }) as FlowPacket);
    active = ['router'];
    notes.push({ x: 700, y: 178, text: 'router waits\nfor the slowest', anchor: 'start', tone: 'bad' });
  } else {
    nodes.push({ id: 'idx', x: 245, y: 60, w: 150, h: 60, shape: 'dashed', label: 'Index', sub: 'amount → shard' });
    edges.push({ from: 'router', to: 'idx', head: 'both' }, { from: 'router', to: 's1' }, { from: 'router', to: 's3' });
    nodes.forEach((n) => {
      if (n.id === 's2' || n.id === 's4') n.tone = 'muted';
    });
    packets = [
      { from: 'router', to: 'idx', label: 'amount>500' },
      { from: 'router', to: 's1', delay: 1 },
      { from: 'router', to: 's3', delay: 1 },
    ];
    active = ['router', 'idx', 's1', 's3'];
    notes.push({ x: 705, y: 178, text: 'only the shards\nwith matches', anchor: 'start' });
  }
  return { nodes, edges, notes, packets, active };
}

function TailBars() {
  const rows = [
    { n: 1, p: 1 },
    { n: 10, p: (1 - 0.99 ** 10) * 100 },
    { n: 100, p: (1 - 0.99 ** 100) * 100 },
  ];
  return (
    <SketchSvg width={900} height={350} label="Chance that a fan-out query hits at least one slow shard">
      <HandText x={450} y={30} size={17}>
        Chance a query waits on at least one slow shard (each shard slow 1% of the time)
      </HandText>
      {rows.map((r, i) => {
        const y = 80 + i * 84;
        const w = (r.p / 100) * 560;
        return (
          <g key={r.n}>
            <HandText x={150} y={y + 22} size={17} anchor="end">{`${r.n} shard${r.n > 1 ? 's' : ''}`}</HandText>
            <rect x={170} y={y} width={560} height={44} rx={6} fill="var(--surface)" />
            <rect x={170} y={y} width={Math.max(4, w)} height={44} rx={6} fill="var(--bad)" opacity={0.75} />
            <HandText x={180 + Math.max(4, w)} y={y + 22} size={18} weight={700} anchor="start">{`${r.p.toFixed(1)}%`}</HandText>
          </g>
        );
      })}
      <HandText x={450} y={336} size={14} color="var(--muted)">
        formula: 1 − 0.99ⁿ
      </HandText>
    </SketchSvg>
  );
}

export default function ScatterGather() {
  return (
    <AnimFrame title="A query that does not use the shard key" steps={steps} interval={3200}>
      {(_, s) => {
        if (s.stage === 'tail') return <TailBars />;
        const d = diagram(s.stage);
        return <FlowDiagram width={900} height={350} nodes={d.nodes} edges={d.edges} notes={d.notes} packets={d.packets} active={d.active} stepKey={s.stage} label="Router sending a query to shards" />;
      }}
    </AnimFrame>
  );
}

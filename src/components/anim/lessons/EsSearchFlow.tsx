import AnimFrame from '../AnimFrame';
import FlowDiagram, { type FlowEdge, type FlowNode, type FlowNote, type FlowPacket, type Tone } from '../FlowDiagram';

interface Step {
  caption: string;
  coord: { sub?: string; tone?: Tone };
  shards: [string | undefined, string | undefined, string | undefined];
  shardTone?: [Tone | undefined, Tone | undefined, Tone | undefined];
  active: string[];
  packets: FlowPacket[];
  note: string;
  noteTone?: Tone;
}

const S1 = 'a 9.1 · b 4.0 · c 3.2';
const S2 = 'd 8.4 · e 7.7 · f 2.1';
const S3 = 'g 6.0 · h 5.5 · i 1.0';

const steps: Step[] = [
  {
    caption: 'An index called products has three primary shards. Each shard is a self-contained Lucene index with its own inverted index (lesson 4.3). Every document belongs to exactly one primary shard. Replica copies, not drawn, hold the same data and serve reads. A search request arrives at any node. That node becomes the coordinating node.',
    coord: {},
    shards: [undefined, undefined, undefined],
    active: ['coord'],
    packets: [{ from: 'client', to: 'coord', label: 'search' }],
    note: 'ask for the top 3 matches',
  },
  {
    caption: 'Query phase, step 1: the coordinator sends the query to one copy of every shard. The matching documents could be on any shard, because the shard was chosen by the document ID, not by what the document says. So the request goes to all of them.',
    coord: {},
    shards: [undefined, undefined, undefined],
    active: ['coord'],
    packets: [
      { from: 'coord', to: 's1', label: 'query' },
      { from: 'coord', to: 's2', label: 'query', delay: 0.1 },
      { from: 'coord', to: 's3', label: 'query', delay: 0.2 },
    ],
    note: 'fan out to every shard',
  },
  {
    caption: 'Query phase, step 2: each shard searches its own documents and scores them. It sends back only the IDs and scores of its best hits, not the documents themselves. The lists are small, so the network cost stays low.',
    coord: {},
    shards: [S1, S2, S3],
    active: ['s1', 's2', 's3'],
    packets: [
      { from: 's1', to: 'coord', label: 'ids', tone: 'ok' },
      { from: 's2', to: 'coord', label: 'ids', tone: 'ok', delay: 0.1 },
      { from: 's3', to: 'coord', label: 'ids', tone: 'ok', delay: 0.2 },
    ],
    note: 'each shard returns id + score',
  },
  {
    caption: 'The coordinator merges the three lists and keeps the global top 3: a 9.1, d 8.4, e 7.7. Shard 3 had nothing in the top 3. The search is only as fast as the slowest shard, because the merge needs every list.',
    coord: { sub: 'top 3: a · d · e', tone: 'ok' },
    shards: [S1, S2, S3],
    shardTone: [undefined, undefined, 'muted'],
    active: ['coord'],
    packets: [],
    note: 'merge, keep the global top 3',
    noteTone: 'ok',
  },
  {
    caption: 'Fetch phase: the coordinator asks only the shards that hold a winner for the document bodies (the _source field). Shard 1 is asked for a. Shard 2 is asked for d and e. Shard 3 is not contacted again.',
    coord: { sub: 'top 3: a · d · e' },
    shards: [S1, S2, S3],
    shardTone: [undefined, undefined, 'muted'],
    active: ['coord'],
    packets: [
      { from: 'coord', to: 's1', label: 'a' },
      { from: 'coord', to: 's2', label: 'd, e', delay: 0.1 },
    ],
    note: 'fetch only the winners',
  },
  {
    caption: 'The coordinator assembles the three full documents in score order and replies to the client. Two round trips to the shards happened: one to find, one to fetch. Fetching only the winners keeps the second trip small.',
    coord: { sub: 'a · d · e', tone: 'ok' },
    shards: [S1, S2, S3],
    shardTone: [undefined, undefined, 'muted'],
    active: ['coord'],
    packets: [{ from: 'coord', to: 'client', label: '3 docs', tone: 'ok' }],
    note: 'reply with full documents',
    noteTone: 'ok',
  },
  {
    caption: 'One catch. Each shard scored its documents with its own local statistics, such as how rare a word is inside that shard. Scores from different shards are then compared. The search type query_then_fetch does exactly this, and is usually faster but less accurate. dfs_query_then_fetch first collects global statistics, which is usually slower but more accurate.',
    coord: {},
    shards: [S1, S2, S3],
    active: [],
    packets: [],
    note: 'local scores, merged globally',
    noteTone: 'warn',
  },
];

const edges: FlowEdge[] = [
  { from: 'client', to: 'coord', head: 'both' },
  { from: 'coord', to: 's1', head: 'both' },
  { from: 'coord', to: 's2', head: 'both' },
  { from: 'coord', to: 's3', head: 'both' },
];

export default function EsSearchFlow() {
  return (
    <AnimFrame title="A search fans out to shards and the scores merge" steps={steps} interval={4600}>
      {(i, s) => {
        const nodes: FlowNode[] = [
          { id: 'client', x: 50, y: 150, w: 80, h: 56, label: 'Client' },
          { id: 'coord', x: 210, y: 150, w: 150, h: 72, label: 'Coordinator', sub: s.coord.sub, tone: s.coord.tone },
          ...[0, 1, 2].map((k) => ({
            id: `s${k + 1}`,
            x: 535,
            y: 55 + k * 95,
            w: 230,
            h: 68,
            label: `Shard ${k + 1}`,
            sub: s.shards[k],
            tone: s.shardTone?.[k],
          })),
        ];
        const notes: FlowNote[] = [{ x: 210, y: 296, text: s.note, anchor: 'middle', tone: s.noteTone }];
        return (
          <FlowDiagram
            width={680}
            height={310}
            nodes={nodes}
            edges={edges}
            notes={notes}
            active={s.active}
            packets={s.packets}
            stepKey={i}
            label="A coordinating node sending a search to three shards, merging their top hits, then fetching the winning documents"
          />
        );
      }}
    </AnimFrame>
  );
}

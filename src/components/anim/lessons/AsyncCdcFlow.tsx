import AnimFrame from '../AnimFrame';
import FlowDiagram, { type FlowEdge, type FlowNode, type FlowNote, type FlowPacket, type Tone } from '../FlowDiagram';

/** A row change flows from the database log to a stream, then to a search index and a cache. */

interface Step {
  caption: string;
  active: string[];
  packets: FlowPacket[];
  db: string;
  connector: string;
  stream: string;
  search: string;
  cache: string;
  tones?: Partial<Record<string, Tone>>;
  note?: FlowNote;
}

const steps: Step[] = [
  {
    caption:
      'A product has price 10. Postgres is the source of truth. A search index and a cache hold copies of the product. The application will write only to Postgres. The CDC connector keeps the other two current.',
    active: [],
    packets: [],
    db: 'price 10',
    connector: 'at LSN 40',
    stream: 'empty',
    search: 'price 10',
    cache: 'price 10',
  },
  {
    caption: 'The app runs one UPDATE and commits: price becomes 9. One transaction, one write, one place. The app knows nothing about search or the cache.',
    active: ['app', 'db'],
    packets: [{ from: 'app', to: 'db', label: 'price=9' }],
    db: 'price 9',
    connector: 'at LSN 40',
    stream: 'empty',
    search: 'price 10',
    cache: 'price 10',
  },
  {
    caption:
      'The database already writes every committed change to its write-ahead log (lesson 4.2). That log feeds replicas (lesson 4.6). The change sits in the log at position LSN 41. We add no extra write.',
    active: ['db'],
    packets: [],
    db: 'WAL: LSN 41',
    connector: 'at LSN 40',
    stream: 'empty',
    search: 'price 10',
    cache: 'price 10',
  },
  {
    caption:
      'The connector reads the log through a replication slot, the way a replica would. A slot is a bookmark the database keeps for a reader, so it does not delete log the reader still needs. The connector turns the change into an event.',
    active: ['connector'],
    packets: [{ from: 'db', to: 'connector', label: 'LSN 41' }],
    db: 'WAL: LSN 41',
    connector: 'read LSN 41',
    stream: 'empty',
    search: 'price 10',
    cache: 'price 10',
  },
  {
    caption: 'The connector publishes the event to a stream, by default one topic per table. It then records LSN 41 as its position. Events appear in commit order.',
    active: ['stream'],
    packets: [{ from: 'connector', to: 'stream', label: 'price=9' }],
    db: 'WAL: LSN 41',
    connector: 'saved LSN 41',
    stream: 'event 1',
    search: 'price 10',
    cache: 'price 10',
  },
  {
    caption:
      'Two independent consumers read the stream. One updates the search index. The other deletes the cache key (lesson 5.5). A new consumer, such as analytics, can join later with no change to the app or the database.',
    active: ['search', 'cache'],
    packets: [
      { from: 'stream', to: 'search', label: 'price=9' },
      { from: 'stream', to: 'cache', label: 'del', delay: 0.15 },
    ],
    db: 'WAL: LSN 41',
    connector: 'saved LSN 41',
    stream: 'event 1',
    search: 'price 9',
    cache: 'key deleted',
  },
  {
    caption:
      'Now a failure. The app writes price=8 (LSN 42). The connector publishes the event, then crashes before it saves LSN 42. The stream holds event 2. The connector’s saved position still says 41.',
    active: ['connector'],
    packets: [{ from: 'connector', to: 'stream', label: 'price=8' }],
    db: 'WAL: LSN 42',
    connector: 'crashed',
    stream: 'event 2',
    search: 'price 8',
    cache: 'key deleted',
    tones: { connector: 'bad' },
  },
  {
    caption:
      'The connector restarts and resumes from its saved position, LSN 41. It reads LSN 42 again and publishes event 2 again. A crash can cause a repeat, so treat this as at-least-once. Setting the price to 8 twice is harmless. Consumers must be idempotent (lesson 6.3).',
    active: ['connector', 'stream'],
    packets: [{ from: 'connector', to: 'stream', label: 'price=8' }],
    db: 'WAL: LSN 42',
    connector: 'resumed at 41',
    stream: 'event 2 twice',
    search: 'price 8',
    cache: 'key deleted',
    tones: { stream: 'warn' },
  },
];

const edges: FlowEdge[] = [
  { from: 'app', to: 'db' },
  { from: 'db', to: 'connector', label: 'reads log', labelAt: [0, -18] },
  { from: 'connector', to: 'stream' },
  { from: 'stream', to: 'search' },
  { from: 'stream', to: 'cache' },
];

export default function AsyncCdcFlow() {
  return (
    <AnimFrame title="Change data capture: from the log to the stream" steps={steps} interval={4200}>
      {(i, s) => {
        const nodes: FlowNode[] = [
          { id: 'app', x: 84, y: 70, w: 112, h: 60, label: 'App', sub: 'writes once' },
          { id: 'db', x: 262, y: 70, w: 128, h: 80, shape: 'db', label: 'Postgres', sub: s.db },
          { id: 'connector', x: 448, y: 70, w: 126, h: 60, label: 'Connector', sub: s.connector, tone: s.tones?.connector },
          { id: 'stream', x: 640, y: 70, w: 116, h: 60, label: 'Stream', sub: s.stream, tone: s.tones?.stream },
          { id: 'search', x: 500, y: 214, w: 128, h: 60, label: 'Search index', sub: s.search },
          { id: 'cache', x: 650, y: 214, w: 108, h: 60, label: 'Cache', sub: s.cache },
        ];
        return <FlowDiagram width={720} height={270} nodes={nodes} edges={edges} active={s.active} packets={s.packets} stepKey={i} label="A row change flows from the Postgres log through a connector to a stream, then to a search index and a cache" />;
      }}
    </AnimFrame>
  );
}

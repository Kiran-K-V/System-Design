import { DesignCompare, type CompareVariant } from '../DesignBuild';

const before: CompareVariant = {
  id: 'before',
  label: 'Before',
  nodes: [
    { id: 'users', x: 80, y: 150, w: 110, h: 56, label: 'Users' },
    { id: 'api', x: 290, y: 150, w: 140, h: 56, label: 'API monolith' },
    { id: 'cass', x: 560, y: 150, w: 150, h: 80, shape: 'db', label: 'Cassandra', sub: '177 nodes' },
  ],
  edges: [
    { from: 'users', to: 'api' },
    { from: 'api', to: 'cass' },
  ],
  steps: [
    { caption: 'A busy channel. Many users open it and ask for the same recent messages at the same moment.', packets: [{ from: 'users', to: 'api', label: '5 reads' }] },
    { caption: 'Each request becomes its own read. Five users asking for one row means five reads on the database.', packets: [{ from: 'api', to: 'cass', label: '5 reads' }], active: ['cass'], tones: { cass: 'warn' } },
    {
      caption: 'Many concurrent reads can hotspot one partition. The post says a hot partition frequently hurt latency across the whole cluster, not only for that channel.',
      active: ['cass'],
      tones: { cass: 'bad' },
      notes: [{ x: 560, y: 250, text: 'hot partition slows every query', anchor: 'middle', tone: 'bad' }],
    },
    {
      caption: 'The Java garbage collector adds latency spikes. To compact a lagging node, operators took it out of rotation. The team called this the gossip dance.',
      active: ['cass'],
      tones: { cass: 'bad' },
      notes: [{ x: 560, y: 250, text: 'GC pauses and compaction debt', anchor: 'middle', tone: 'bad' }],
    },
  ],
};

const after: CompareVariant = {
  id: 'after',
  label: 'After',
  nodes: [
    { id: 'users', x: 70, y: 150, w: 100, h: 56, label: 'Users' },
    { id: 'api', x: 235, y: 150, w: 130, h: 56, label: 'API monolith' },
    { id: 'ds', x: 410, y: 150, w: 130, h: 64, label: 'Data services', sub: 'Rust' },
    { id: 'scylla', x: 610, y: 150, w: 140, h: 80, shape: 'db', label: 'ScyllaDB', sub: '72 nodes' },
  ],
  edges: [
    { from: 'users', to: 'api' },
    { from: 'api', to: 'ds' },
    { from: 'ds', to: 'scylla' },
  ],
  steps: [
    { caption: 'The same busy channel. Five users ask for the same recent messages.', packets: [{ from: 'users', to: 'api', label: '5 reads' }] },
    { caption: 'The monolith calls a data service. Consistent hash routing sends every request for one channel to the same service instance.', packets: [{ from: 'api', to: 'ds', label: '5 reads' }], active: ['ds'] },
    {
      caption: 'The service keeps one query in flight per row. Four of the five requests wait on the first one. This is request coalescing.',
      active: ['ds'],
      packets: [{ from: 'ds', to: 'scylla', label: '1 read' }],
      tones: { ds: 'ok' },
    },
    {
      caption: 'One answer comes back and fans out to all five callers. The database saw one read, not five.',
      active: ['ds'],
      packets: [{ from: 'scylla', to: 'ds' }],
      tones: { ds: 'ok', scylla: 'ok' },
      notes: [{ x: 410, y: 250, text: 'one query, five answers', anchor: 'middle', tone: 'ok' }],
    },
  ],
};

export default function DiscordCompare() {
  return (
    <DesignCompare
      title="Discord message reads"
      prompt="Design:"
      variants={[before, after]}
      height={290}
      label="A busy channel's reads hit Cassandra directly before, and pass through a Rust data service that coalesces them into one query after."
    />
  );
}

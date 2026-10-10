import AnimFrame from '../AnimFrame';
import FlowDiagram, { type FlowEdge, type FlowNode, type FlowPacket, type Tone } from '../FlowDiagram';

interface Step {
  caption: string;
  src: [string, Tone?];
  op: [string, Tone?];
  sink: [string, Tone?];
  storage: [string, Tone?];
  extra?: FlowEdge[];
  packets?: FlowPacket[];
  active: string;
}

const steps: Step[] = [
  {
    caption:
      'A Flink job: a source reads a Kafka partition, a keyed operator keeps a running total in local state, and a sink writes results. The state lives in the operator, next to the code. If this machine dies, that state is gone. Checkpoints exist to fix that.',
    src: ['offset 120'],
    op: ['total 410'],
    sink: ['wrote 410'],
    storage: ['checkpoint 4 done'],
    active: 'src',
  },
  {
    caption:
      'The checkpoint coordinator starts checkpoint 5. The source saves its offset (120) and puts a numbered barrier into the stream. The barrier flows with the data. Everything before it belongs to checkpoint 5. Everything after it does not.',
    src: ['saved offset 120', 'accent'],
    op: ['total 410'],
    sink: ['wrote 410'],
    storage: ['checkpoint 4 done'],
    extra: [
      { from: 'coord', to: 'src', dashed: true, tone: 'accent' },
      { from: 'src', to: 'store', tone: 'accent', label: 'offset 120', labelAt: [-46, 6] },
    ],
    packets: [{ from: 'src', to: 'op', label: 'barrier 5' }],
    active: 'src',
  },
  {
    caption:
      'The barrier reaches the operator. It has handled every event before the barrier and none after. It writes its state (total 410) to durable storage and keeps working. A real snapshot runs in the background, so the stream does not stop. An operator with two inputs waits until the barrier arrives on both. That wait is barrier alignment.',
    src: ['offset 125'],
    op: ['snapshot: total 410', 'accent'],
    sink: ['wrote 410'],
    storage: ['checkpoint 4 done'],
    extra: [{ from: 'op', to: 'store', tone: 'accent', label: 'state 410', labelAt: [48, 0] }],
    packets: [{ from: 'op', to: 'sink', label: 'barrier 5' }],
    active: 'op',
  },
  {
    caption: 'The barrier reaches the sink. The sink confirms to the coordinator. All tasks have saved their part, so checkpoint 5 is complete: source offset 120 plus operator state 410, which match each other.',
    src: ['offset 128'],
    op: ['total 450'],
    sink: ['acked 5', 'accent'],
    storage: ['checkpoint 5 done', 'ok'],
    extra: [{ from: 'sink', to: 'coord', dashed: true, tone: 'ok' }],
    active: 'sink',
  },
  {
    caption: 'The job runs on. The source reaches offset 135. The operator total is now 530. The sink has written 530. The newest checkpoint is still 5, which holds offset 120 and total 410.',
    src: ['offset 135'],
    op: ['total 530'],
    sink: ['wrote 530'],
    storage: ['checkpoint 5 done', 'ok'],
    active: 'op',
  },
  {
    caption: 'The machine running the operator crashes. Its in-memory total is gone. The source and sink are still alive but their positions no longer match any saved state.',
    src: ['offset 135', 'warn'],
    op: ['crashed', 'bad'],
    sink: ['wrote 530', 'warn'],
    storage: ['checkpoint 5 done', 'ok'],
    active: 'op',
  },
  {
    caption: 'The coordinator restarts the job from checkpoint 5. The operator loads total 410 from storage. The source rewinds to offset 120. The source can rewind because Kafka keeps the log, so Flink needs a replayable source. Events 121 to 135 will be read again.',
    src: ['rewound to 120', 'accent'],
    op: ['restored 410', 'accent'],
    sink: ['wrote 530', 'warn'],
    storage: ['checkpoint 5 done', 'ok'],
    extra: [
      { from: 'store', to: 'op', tone: 'ok', label: 'load state', labelAt: [50, 0] },
      { from: 'store', to: 'src', tone: 'ok', label: 'load offset', labelAt: [-50, 0] },
    ],
    active: 'op',
  },
  {
    caption:
      'The operator replays 121 to 135 and reaches total 530 again. The state counted each event exactly once. The sink saw events 121 to 135 twice. Flink gives end-to-end exactly-once only when the sink is transactional (commit on checkpoint) or idempotent (same write, same result).',
    src: ['offset 135'],
    op: ['total 530', 'ok'],
    sink: ['wrote 530 again', 'warn'],
    storage: ['checkpoint 5 done', 'ok'],
    active: 'sink',
  },
];

export default function FlinkCheckpoint() {
  return (
    <AnimFrame title="Flink: checkpoint barrier, crash, and restore" steps={steps} interval={5000}>
      {(i, s) => {
        const nodes: FlowNode[] = [
          { id: 'coord', x: 360, y: 46, w: 210, h: 44, label: 'Coordinator', tone: 'default' },
          { id: 'src', x: 100, y: 150, w: 150, label: 'Source', sub: s.src[0], tone: s.src[1] ?? 'default' },
          { id: 'op', x: 360, y: 150, w: 170, label: 'Operator', sub: s.op[0], tone: s.op[1] ?? 'default' },
          { id: 'sink', x: 620, y: 150, w: 150, label: 'Sink', sub: s.sink[0], tone: s.sink[1] ?? 'default' },
          { id: 'store', x: 360, y: 274, w: 210, h: 88, label: 'Storage', sub: s.storage[0], shape: 'db', tone: s.storage[1] ?? 'default' },
        ];
        const edges: FlowEdge[] = [{ from: 'src', to: 'op' }, { from: 'op', to: 'sink' }, ...(s.extra ?? [])];
        return <FlowDiagram width={720} height={336} nodes={nodes} edges={edges} packets={s.packets} active={[s.active]} stepKey={i} travel={1.1} label="A Flink pipeline with a checkpoint barrier moving from the source to the sink" />;
      }}
    </AnimFrame>
  );
}

import AnimFrame from '../AnimFrame';
import FlowDiagram, { type FlowNote, type FlowPacket, type Tone } from '../FlowDiagram';

interface S {
  caption: string;
  packets?: FlowPacket[];
  active?: string[];
  tones?: Record<string, Tone>;
  notes?: FlowNote[];
  edgeA?: boolean;
  edgeB?: boolean;
}

const STEPS: S[] = [
  { caption: 'Relay A holds the Consul lock for topic T. Only the lock holder relays this topic, so one relay owns all its partitions. The last committed offset is 102.', tones: { relayA: 'ok', relayB: 'muted' }, active: ['relayA'], edgeA: true, notes: [{ x: 40, y: 270, text: 'committed offset: 102' }] },
  { caption: 'A reads the job at offset 103 and writes it to Redis. Then A crashes before it commits the offset.', packets: [{ from: 'relayA', to: 'redis', label: 'job 103' }], tones: { relayA: 'bad', relayB: 'muted' }, active: ['redis'], edgeA: true, notes: [{ x: 40, y: 270, text: 'committed offset: still 102' }] },
  { caption: 'The lock is released. Our reading: Consul drops a lock when its holder\'s session ends. Redis already holds job 103.', tones: { relayA: 'bad', relayB: 'warn' }, active: ['consul'], edgeB: true, notes: [{ x: 40, y: 270, text: 'committed offset: 102' }] },
  { caption: 'Relay B takes the lock for topic T and resumes from the last committed offset, 102. Nothing is skipped.', packets: [{ from: 'kafka', to: 'relayB', label: 'from 103' }], tones: { relayA: 'bad', relayB: 'ok' }, active: ['relayB'], edgeB: true, notes: [{ x: 40, y: 270, text: 'committed offset: 102' }] },
  { caption: 'B reads job 103 again and writes it to Redis. The job is now in Redis twice. Our reading: delivery is at-least-once, so workers must tolerate duplicates.', packets: [{ from: 'relayB', to: 'redis', label: 'job 103' }], tones: { relayA: 'bad', relayB: 'ok', redis: 'warn' }, active: ['redis'], edgeB: true, notes: [{ x: 40, y: 270, text: 'committed offset: 103' }] },
];

export default function SlackRelay() {
  return (
    <AnimFrame title="Relay failover" steps={STEPS} interval={3800}>
      {(i, s) => (
        <FlowDiagram
          width={720}
          height={300}
          label="Two relays compete for a Consul lock on one topic. When the holder crashes after a Redis write but before an offset commit, the new holder replays one job."
          nodes={[
            { id: 'kafka', x: 110, y: 120, w: 140, h: 80, shape: 'db', label: 'Kafka', sub: 'topic T' },
            { id: 'relayA', x: 340, y: 70, w: 120, h: 56, label: 'Relay A', tone: s.tones?.relayA },
            { id: 'relayB', x: 340, y: 210, w: 120, h: 56, label: 'Relay B', tone: s.tones?.relayB },
            { id: 'redis', x: 600, y: 70, w: 120, h: 80, shape: 'db', label: 'Redis', tone: s.tones?.redis },
            { id: 'consul', x: 600, y: 210, w: 130, h: 56, label: 'Consul lock', tone: s.tones?.consul },
          ]}
          edges={[
            { from: 'kafka', to: 'relayA' },
            { from: 'kafka', to: 'relayB', dashed: true },
            { from: 'relayA', to: 'redis' },
            { from: 'relayA', to: 'consul', dashed: !s.edgeA, tone: s.edgeA ? 'ok' : 'muted' },
            { from: 'relayB', to: 'consul', dashed: !s.edgeB, tone: s.edgeB ? 'ok' : 'muted' },
          ]}
          notes={s.notes}
          active={s.active}
          packets={s.packets}
          stepKey={i}
        />
      )}
    </AnimFrame>
  );
}

import AnimFrame from '../AnimFrame';
import { HandText, SketchSvg, TEXT_SIZES } from '../sketch';
import { Arc, Arr, Cell, Panel, tv, type TT } from './TechParts';

interface Broker {
  label: string;
  sub: string;
  tone?: TT;
  down?: boolean;
  /** Space-separated offsets. A trailing * means committed. */
  log: string;
}

interface Step {
  caption: string;
  msg: string;
  brokers: [Broker, Broker, Broker];
  producer: string;
  isr: string;
  isrTone?: TT;
  /** send: producer to leader. ack: leader to producer. rejected: failed send. fetch: followers (by index) pull from the leader. */
  flow?: 'send' | 'ack' | 'rejected';
  fetch?: number[];
}

const X = [260, 430, 600];
const BY = 120;
const CY = 200;

const b = (label: string, sub: string, log: string, tone?: TT): Broker => ({ label, sub, log, tone });
const dead = (label: string, log: string): Broker => ({ label, sub: 'down', log, tone: 'bad', down: true });

const steps: Step[] = [
  {
    caption:
      'One partition, three replicas on three brokers. B1 is the leader. The leader and the followers that keep up form the in-sync replica set (ISR). Offsets 0 and 1 are on all three copies and committed. The topic uses acks=all and min.insync.replicas=2.',
    msg: 'Partition 0: replication factor 3, min.insync.replicas = 2',
    brokers: [b('B1 leader', 'in ISR', '0* 1*', 'accent'), b('B2', 'in ISR', '0* 1*'), b('B3', 'in ISR', '0* 1*')],
    producer: 'idle',
    isr: 'ISR = {B1, B2, B3}',
  },
  {
    caption: 'The producer sends message m2 to the leader of partition 0. The leader appends it as offset 2. It is not committed yet. With acks=all the leader will not answer until the whole ISR has it.',
    msg: 'Producer to B1: m2',
    brokers: [b('B1 leader', 'in ISR', '0* 1* 2', 'accent'), b('B2', 'in ISR', '0* 1*'), b('B3', 'in ISR', '0* 1*')],
    producer: 'waiting for ack',
    isr: 'ISR = {B1, B2, B3}',
    flow: 'send',
  },
  {
    caption: 'Followers pull. Each follower sends a fetch request to the leader and appends what comes back. B2 and B3 now hold offset 2. Replication is the same fetch protocol that consumers use.',
    msg: 'B2 and B3 fetch m2 from B1',
    brokers: [b('B1 leader', 'in ISR', '0* 1* 2', 'accent'), b('B2', 'in ISR', '0* 1* 2'), b('B3', 'in ISR', '0* 1* 2')],
    producer: 'waiting for ack',
    isr: 'ISR = {B1, B2, B3}',
    fetch: [1, 2],
  },
  {
    caption: 'Every member of the ISR has offset 2, so the leader marks it committed and sends the ack. Only committed messages are visible to consumers. Latency of one write is the slowest ISR member, not the average.',
    msg: 'B1 to producer: ack for m2',
    brokers: [b('B1 leader', 'in ISR', '0* 1* 2*', 'accent'), b('B2', 'in ISR', '0* 1* 2*'), b('B3', 'in ISR', '0* 1* 2*')],
    producer: 'got ack',
    isr: 'ISR = {B1, B2, B3}',
    isrTone: 'ok',
    flow: 'ack',
  },
  {
    caption: 'B3 stops fetching (slow disk or a bad link). The producer sends m3. B1 and B2 store it. B3 is still in the ISR, so the leader cannot commit m3 and the producer keeps waiting. A slow member stalls acks=all writes.',
    msg: 'Producer sends m3. B3 is not fetching.',
    brokers: [b('B1 leader', 'in ISR', '0* 1* 2* 3', 'accent'), b('B2', 'in ISR', '0* 1* 2* 3'), b('B3', 'lagging', '0* 1* 2*', 'warn')],
    producer: 'waiting for ack',
    isr: 'ISR = {B1, B2, B3}',
    isrTone: 'warn',
    flow: 'send',
  },
  {
    caption:
      'B3 has not caught up within replica.lag.time.max.ms (default 30 seconds), so the leader removes it from the ISR. The ISR is now {B1, B2}. That is still at least min.insync.replicas, so m3 commits and the producer gets its ack. B3 can rejoin after it catches up.',
    msg: 'B1 shrinks the ISR. m3 is committed.',
    brokers: [b('B1 leader', 'in ISR', '0* 1* 2* 3*', 'accent'), b('B2', 'in ISR', '0* 1* 2* 3*'), b('B3', 'out of ISR', '0* 1* 2*', 'warn')],
    producer: 'got ack',
    isr: 'ISR = {B1, B2}  (2 is enough)',
    isrTone: 'ok',
    flow: 'ack',
  },
  {
    caption:
      'B2 crashes and leaves the ISR. The ISR is {B1}: size 1, below min.insync.replicas of 2. The leader now rejects writes from acks=all producers (a NotEnoughReplicas error). The system picks "no write" over "a write held by one machine".',
    msg: 'Producer sends m4. B1 rejects it.',
    brokers: [b('B1 leader', 'in ISR', '0* 1* 2* 3*', 'accent'), dead('B2', '0* 1* 2* 3*'), b('B3', 'out of ISR', '0* 1* 2*', 'warn')],
    producer: 'write failed',
    isr: 'ISR = {B1}  (below 2: writes refused)',
    isrTone: 'bad',
    flow: 'rejected',
  },
  {
    caption:
      'B1 crashes too. B3 is alive but not in the ISR and misses m3. By default (unclean.leader.election.enable=false) the controller will not make B3 the leader. The partition is offline until B1 or B2 returns. No acknowledged message is lost. If you turned unclean election on, B3 would lead and m3 would be gone.',
    msg: 'No ISR member is alive. Partition offline.',
    brokers: [dead('B1', '0* 1* 2* 3*'), dead('B2', '0* 1* 2* 3*'), b('B3', 'out of ISR', '0* 1* 2*', 'warn')],
    producer: 'no leader',
    isr: 'Partition offline: safe, but unavailable',
    isrTone: 'bad',
  },
];

function Log({ cx, log, sk, down }: { cx: number; log: string; sk: string; down?: boolean }) {
  const entries = log.split(' ');
  return (
    <g opacity={down ? 0.55 : 1}>
      {[0, 1, 2, 3].map((k) => {
        const e = entries[k];
        const x = cx - 51 + k * 34;
        if (!e) return <Cell key={k} cx={x} cy={CY} label="" tone="muted" dashed sk={`${sk}-e${k}`} />;
        const committed = e.endsWith('*');
        return <Cell key={k} cx={x} cy={CY} label={e.replace('*', '')} tone={committed ? 'ok' : 'warn'} dashed={!committed} sk={`${sk}-${k}`} />;
      })}
    </g>
  );
}

export default function KafkaIsr() {
  return (
    <AnimFrame title="Kafka: acks=all, the ISR, and a leader failure" steps={steps} interval={4800}>
      {(i, s) => (
        <SketchSvg width={720} height={330} label="One Kafka partition on three brokers with the producer and the in-sync replica set">
          <HandText x={360} y={18} size={TEXT_SIZES.label} color="var(--accent)">
            {s.msg}
          </HandText>
          {s.fetch?.map((f) => (
            <Arc key={f} from={[X[f] - 20, BY - 36]} to={[X[0] + 20, BY - 36]} lift={f === 1 ? -18 : -36} tone="accent" label={f === 1 ? '' : 'fetch'} sk={`fetch-${i}-${f}`} />
          ))}
          <Panel cx={75} cy={BY} w={110} label="Producer" sub={s.producer} tone={s.flow === 'rejected' ? 'bad' : 'fg'} sk="kp" />
          {s.flow === 'send' && <Arr from={[134, BY - 10]} to={[190, BY - 10]} tone="accent" sk={`send-${i}`} />}
          {s.flow === 'ack' && <Arr from={[190, BY + 14]} to={[134, BY + 14]} tone="ok" sk={`ack-${i}`} />}
          {s.flow === 'rejected' && <Arr from={[134, BY + 14]} to={[190, BY + 14]} tone="bad" dashed sk={`rej-${i}`} />}
          {s.brokers.map((br, k) => (
            <g key={k}>
              <Panel cx={X[k]} cy={BY} w={130} label={br.label} sub={br.sub} tone={br.tone} dashed={br.down} strong={k === 0 && !br.down} sk={`kb-${k}`} />
              <Log cx={X[k]} log={br.log} sk={`klog-${k}`} down={br.down} />
            </g>
          ))}
          <HandText x={360} y={262} size={TEXT_SIZES.heading} color={tv(s.isrTone)}>
            {s.isr}
          </HandText>
          <HandText x={360} y={300} size={TEXT_SIZES.note} color="var(--muted)">
            Cells are offsets in the partition log. Green = committed. Dashed = stored but not committed.
          </HandText>
        </SketchSvg>
      )}
    </AnimFrame>
  );
}

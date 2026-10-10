import AnimFrame from '../AnimFrame';
import { TONE, type Tone } from '../FlowDiagram';
import { HandText, SketchBox, SketchSvg, TEXT_SIZES, seedOf } from '../sketch';

/** One command from one client. `zone` says where the chip is on this step. */
type Zone = 'new' | 'wait' | 'run' | 'done';

interface Chip {
  id: string;
  cmd: string;
  zone: Zone;
  tone: Tone;
}

interface Step {
  caption: string;
  chips: Chip[];
  /** Text inside the thread box when idle or busy. */
  thread: string;
  threadTone: Tone;
}

const chip = (id: string, cmd: string, zone: Zone, tone: Tone = 'default'): Chip => ({ id, cmd, zone, tone });

const steps: Step[] = [
  {
    caption: 'Redis runs commands on one thread. Clients connect over TCP. A client sends a command, and the server reads it into a queue. Five commands from five clients arrive at nearly the same moment. A: ZADD, B: GET, C: KEYS *, D: GET, E: ZADD. The thread is idle.',
    chips: [chip('A', 'ZADD', 'wait'), chip('B', 'GET', 'wait'), chip('C', 'KEYS *', 'wait'), chip('D', 'GET', 'wait'), chip('E', 'ZADD', 'wait')],
    thread: 'idle',
    threadTone: 'muted',
  },
  {
    caption: 'The thread takes the first command, A, and runs it to the end. Nothing else touches the data meanwhile, so ZADD cannot be seen half done. Every single command is atomic for free. No lock is needed.',
    chips: [chip('A', 'ZADD', 'run', 'accent'), chip('B', 'GET', 'wait'), chip('C', 'KEYS *', 'wait'), chip('D', 'GET', 'wait'), chip('E', 'ZADD', 'wait')],
    thread: 'running A',
    threadTone: 'accent',
  },
  {
    caption: 'A is done. B is next. GET and ZADD touch memory only, so each one is quick. The thread then moves on at once to the next waiting command.',
    chips: [chip('A', 'ZADD', 'done', 'ok'), chip('B', 'GET', 'run', 'accent'), chip('C', 'KEYS *', 'wait'), chip('D', 'GET', 'wait'), chip('E', 'ZADD', 'wait')],
    thread: 'running B',
    threadTone: 'accent',
  },
  {
    caption: 'Now C runs KEYS *. It walks every key in the database, so its cost grows with the number of keys. While it runs, the thread can do nothing else. D and E are fine commands, but they must wait. Their client sees a slow reply even though its own command is cheap.',
    chips: [chip('A', 'ZADD', 'done', 'ok'), chip('B', 'GET', 'done', 'ok'), chip('C', 'KEYS *', 'run', 'bad'), chip('D', 'GET', 'wait', 'warn'), chip('E', 'ZADD', 'wait', 'warn')],
    thread: 'running C (slow)',
    threadTone: 'bad',
  },
  {
    caption: 'C finishes. D and E run quickly, one after the other. The slow command delayed everyone behind it. This is head-of-line blocking. One O(N) command on a big keyspace can stall every client.',
    chips: [chip('A', 'ZADD', 'done', 'ok'), chip('B', 'GET', 'done', 'ok'), chip('C', 'KEYS *', 'done', 'warn'), chip('D', 'GET', 'done', 'warn'), chip('E', 'ZADD', 'run', 'accent')],
    thread: 'running E',
    threadTone: 'accent',
  },
  {
    caption: 'The fix is to never run a long command. SCAN walks the keys in small slices. Each call returns a cursor, and each call is short. Other clients get a turn between the slices. Pipelining solves a different cost: it sends many commands in one network round trip, so the thread spends less time on socket reads and writes.',
    chips: [chip('A', 'ZADD', 'done', 'ok'), chip('B', 'GET', 'done', 'ok'), chip('C', 'SCAN 0', 'done', 'ok'), chip('D', 'GET', 'done', 'ok'), chip('E', 'ZADD', 'done', 'ok')],
    thread: 'idle',
    threadTone: 'muted',
  },
];

const CW = 84;
const CH = 44;

export default function RedisEventLoop() {
  return (
    <AnimFrame title="One thread, one command at a time" steps={steps} interval={4200}>
      {(_i, s) => {
        const waiting = s.chips.filter((c) => c.zone === 'wait');
        const done = s.chips.filter((c) => c.zone === 'done');
        const running = s.chips.find((c) => c.zone === 'run');
        const pos = (c: Chip): [number, number] => {
          if (c.zone === 'run') return [560, 112];
          if (c.zone === 'wait') return [52 + waiting.indexOf(c) * 90, 112];
          return [52 + done.indexOf(c) * 90, 262];
        };
        return (
          <SketchSvg width={680} height={318} label="Five commands waiting in a queue, one running on the single thread, and finished commands below">
            <HandText x={16} y={30} size={TEXT_SIZES.heading} anchor="start">Waiting, in arrival order</HandText>
            <HandText x={16} y={192} size={TEXT_SIZES.heading} anchor="start">Finished</HandText>
            <SketchBox cx={560} cy={112} w={150} h={104} r={12} seed={seedOf('rthread')} dashed stroke={TONE[s.threadTone]} strokeWidth={s.threadTone === 'muted' ? 1.4 : 2.2} />
            <HandText x={560} y={52} size={TEXT_SIZES.heading}>Command thread</HandText>
            {!running && (
              <HandText x={560} y={112} size={TEXT_SIZES.label} color="var(--muted)">idle</HandText>
            )}
            <HandText x={560} y={176} size={TEXT_SIZES.note} color={TONE[s.threadTone]}>{s.thread}</HandText>
            {s.chips.map((c) => {
              const [cx, cy] = pos(c);
              const color = TONE[c.tone];
              return (
                <g key={c.id}>
                  <SketchBox cx={cx} cy={cy} w={CW} h={CH} r={8} seed={seedOf(`rchip${c.id}`)} stroke={color} fill={c.tone === 'default' ? 'var(--surface)' : color} strokeWidth={c.zone === 'run' ? 2.2 : 1.4} />
                  <HandText x={cx} y={cy} size={TEXT_SIZES.note} mono>{`${c.id} ${c.cmd}`}</HandText>
                </g>
              );
            })}
            {waiting.length === 0 && (
              <HandText x={170} y={112} size={TEXT_SIZES.label} color="var(--muted)">queue empty</HandText>
            )}
            {done.length === 0 && (
              <HandText x={100} y={262} size={TEXT_SIZES.label} color="var(--muted)">none yet</HandText>
            )}
          </SketchSvg>
        );
      }}
    </AnimFrame>
  );
}

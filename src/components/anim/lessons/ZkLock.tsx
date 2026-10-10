import AnimFrame from '../AnimFrame';
import { HandText, SketchSvg, TEXT_SIZES } from '../sketch';
import { Arr, Panel, tv, type TT } from './TechParts';

interface Client {
  sub: string;
  tone?: TT;
}
interface ZNode {
  label: string;
  tone?: TT;
  dashed?: boolean;
  hidden?: boolean;
  note?: string;
  noteTone?: TT;
}
interface Step {
  caption: string;
  msg: string;
  clients: [Client, Client, Client];
  nodes: [ZNode, ZNode, ZNode];
  create?: boolean;
  /** Watch arrows: [watcher row, watched row, tone]. */
  watch?: [number, number, TT][];
}

const ROW = [120, 210, 300];
const NAMES = ['Client A', 'Client B', 'Client C'];

const steps: Step[] = [
  {
    caption:
      'Three clients want the lock for job 7. The lock is a znode (a node in ZooKeeper’s tree) at /locks/job7. Nobody holds it. Each client will add its own child node. The child is ephemeral (ZooKeeper deletes it when the client session ends) and sequential (ZooKeeper appends an increasing number).',
    msg: 'Three clients want /locks/job7.',
    clients: [{ sub: 'wants lock' }, { sub: 'wants lock' }, { sub: 'wants lock' }],
    nodes: [{ label: '', hidden: true }, { label: '', hidden: true }, { label: '', hidden: true }],
  },
  {
    caption: 'Each client creates its child. ZooKeeper orders the writes through its leader and numbers them: 0001 for A, 0002 for B, 0003 for C. The number is the client’s place in the queue.',
    msg: 'Each client creates an ephemeral sequential znode.',
    clients: [{ sub: 'created', tone: 'accent' }, { sub: 'created' }, { sub: 'created' }],
    nodes: [{ label: 'lock-0001' }, { label: 'lock-0002' }, { label: 'lock-0003' }],
    create: true,
  },
  {
    caption:
      'Each client lists the children. The client with the lowest number holds the lock. That is A. B and C wait. B does not watch the parent. It watches only the node just before its own (0001). C watches 0002. When one node goes away, only one client wakes up. That avoids a herd of retries.',
    msg: 'A has the lowest number: A holds the lock.',
    clients: [{ sub: 'holds lock', tone: 'ok' }, { sub: 'waiting' }, { sub: 'waiting' }],
    nodes: [{ label: 'lock-0001', tone: 'ok' }, { label: 'lock-0002' }, { label: 'lock-0003' }],
    watch: [[1, 0, 'muted'], [2, 1, 'muted']],
  },
  {
    caption:
      'A’s machine freezes. It stops sending heartbeats. ZooKeeper keeps A’s node, because the session has not expired yet. The session timeout is a trade-off. A short timeout frees the lock fast but fires false alarms on a slow network. A long timeout is stable but leaves the lock stuck longer.',
    msg: 'A stops sending heartbeats.',
    clients: [{ sub: 'frozen', tone: 'bad' }, { sub: 'waiting' }, { sub: 'waiting' }],
    nodes: [{ label: 'lock-0001', tone: 'warn', note: 'session timer running', noteTone: 'warn' }, { label: 'lock-0002' }, { label: 'lock-0003' }],
    watch: [[1, 0, 'muted'], [2, 1, 'muted']],
  },
  {
    caption: 'The session times out. ZooKeeper ends A’s session and deletes its ephemeral node. B’s watch on 0001 fires. C’s watch is on 0002, so C hears nothing. A watch is a one-time trigger: it fires once and is then removed.',
    msg: 'Session expired. lock-0001 is deleted.',
    clients: [{ sub: 'session expired', tone: 'bad' }, { sub: 'watch fired', tone: 'accent' }, { sub: 'waiting' }],
    nodes: [{ label: 'lock-0001', tone: 'bad', dashed: true, note: 'deleted', noteTone: 'bad' }, { label: 'lock-0002' }, { label: 'lock-0003' }],
    watch: [[1, 0, 'accent'], [2, 1, 'muted']],
  },
  {
    caption: 'B lists the children again. Its node, 0002, is now the lowest. B holds the lock. The lock moved from A to B with no extra messages from C and no human action. B now watches nothing, and C still watches B.',
    msg: 'B has the lowest number: B holds the lock.',
    clients: [{ sub: 'gone', tone: 'bad' }, { sub: 'holds lock', tone: 'ok' }, { sub: 'waiting' }],
    nodes: [{ label: 'lock-0001', hidden: true }, { label: 'lock-0002', tone: 'ok' }, { label: 'lock-0003' }],
    watch: [[2, 1, 'muted']],
  },
  {
    caption:
      'Danger. A may not be dead. It may have paused for a long garbage collection, and wakes up believing it still holds the lock. The lock service cannot reach into A. The fix is a fencing token (lesson 4.6): A sends its number, 1, with every write. The resource has seen 2 from B, so it rejects A.',
    msg: 'A wakes up and writes with token 1.',
    clients: [{ sub: 'stale, token 1', tone: 'warn' }, { sub: 'holds lock', tone: 'ok' }, { sub: 'waiting' }],
    nodes: [{ label: 'lock-0001', hidden: true, note: 'A’s write: refused', noteTone: 'bad' }, { label: 'lock-0002', tone: 'ok', note: 'resource saw token 2', noteTone: 'ok' }, { label: 'lock-0003' }],
    watch: [[2, 1, 'muted']],
  },
];

export default function ZkLock() {
  return (
    <AnimFrame title="ZooKeeper: an ephemeral-node lock freed by session expiry" steps={steps} interval={5200}>
      {(i, s) => (
        <SketchSvg width={720} height={370} label="Three clients, their znodes under /locks/job7, and the watches between them">
          <HandText x={360} y={18} size={TEXT_SIZES.label} color="var(--accent)">
            {s.msg}
          </HandText>
          <HandText x={380} y={56} size={TEXT_SIZES.heading} color="var(--muted)">
            /locks/job7
          </HandText>
          {ROW.map((cy, k) => (
            <g key={k}>
              <Panel cx={90} cy={cy} w={120} label={NAMES[k]} sub={s.clients[k].sub} tone={s.clients[k].tone} dashed={s.clients[k].tone === 'bad'} sk={`zc${k}`} />
              {s.nodes[k].hidden ? (
                <Panel cx={380} cy={cy} w={170} label="" tone="muted" dashed sk={`zn-empty${k}`} />
              ) : (
                <Panel cx={380} cy={cy} w={170} label={s.nodes[k].label} tone={s.nodes[k].tone} dashed={s.nodes[k].dashed} sk={`zn${k}`} />
              )}
              {s.create && <Arr from={[154, cy]} to={[290, cy]} tone={k === 0 ? 'accent' : 'muted'} sk={`zcr${i}-${k}`} />}
              {s.nodes[k].note && (
                <HandText x={480} y={cy} size={TEXT_SIZES.note} anchor="start" color={tv(s.nodes[k].noteTone)}>
                  {s.nodes[k].note!}
                </HandText>
              )}
            </g>
          ))}
          {s.watch?.map(([from, to, tone]) => (
            <g key={`${from}-${to}`}>
              <Arr from={[380, ROW[from] - 28]} to={[380, ROW[to] + 28]} tone={tone} dashed sk={`zw${i}-${from}`} />
              <HandText x={392} y={(ROW[from] + ROW[to]) / 2} size={TEXT_SIZES.note} anchor="start" color={tv(tone)}>
                {tone === 'accent' ? 'watch fires' : 'watch'}
              </HandText>
            </g>
          ))}
        </SketchSvg>
      )}
    </AnimFrame>
  );
}

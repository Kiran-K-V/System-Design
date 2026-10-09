import AnimFrame from '../AnimFrame';
import { HandText, SketchArrow, SketchBox, SketchSvg, seedOf } from '../sketch';

type Role = 'follower' | 'candidate' | 'leader';
type Tone = 'ok' | 'warn' | 'bad' | 'muted';

interface NodeState {
  role: Role;
  term: number;
  /** Log entries as space-separated terms. A trailing * marks a committed entry. Example: "2* 2". */
  log: string;
  badge?: string;
  badgeTone?: Tone;
  down?: boolean;
}

interface Arrows {
  from: number;
  to: number[];
  tone?: Tone;
}

interface Step {
  caption: string;
  msg: string;
  nodes: NodeState[];
  arrows?: Arrows[];
}

const X = [72, 216, 360, 504, 648];
const NODE_Y = 150;
const TOP = NODE_Y - 34;

const f = (term: number, log = '', badge?: string, badgeTone?: Tone): NodeState => ({ role: 'follower', term, log, badge, badgeTone });
const down = (term: number, log = '', badge = 'crashed'): NodeState => ({ role: 'follower', term, log, badge, badgeTone: 'bad', down: true });

const steps: Step[] = [
  {
    caption:
      'Five servers start as followers in term 1. A follower waits for heartbeats from a leader. None arrive, so each runs a random election timer. The Raft paper gives 150–300 ms as an example range. The numbers under each server are example timers. S2 has the shortest.',
    msg: 'No leader yet. Each server has a random election timer (ms).',
    nodes: [f(1, '', 'timer 210'), f(1, '', 'timer 160'), f(1, '', 'timer 230'), f(1, '', 'timer 270'), f(1, '', 'timer 290')],
  },
  {
    caption: 'S2’s timer fires first. It becomes a candidate, adds one to its term (now 2), and votes for itself.',
    msg: 'S2 times out and starts an election.',
    nodes: [f(1), { role: 'candidate', term: 2, log: '', badge: 'voted for self', badgeTone: 'warn' }, f(1), f(1), f(1)],
  },
  {
    caption: 'S2 asks every other server for its vote in term 2. A server votes for at most one candidate per term, first come first served.',
    msg: 'S2 to all: RequestVote (term 2)',
    nodes: [f(1), { role: 'candidate', term: 2, log: '', badge: 'voted for self', badgeTone: 'warn' }, f(1), f(1), f(1)],
    arrows: [{ from: 1, to: [0, 2, 3, 4] }],
  },
  {
    caption:
      'S1 and S3 grant their votes and move to term 2. S2 now holds 3 votes out of 5: its own, S1, and S3. Three is a majority, so S2 does not wait for S4 or S5.',
    msg: 'S1 and S3 to S2: vote granted',
    nodes: [f(2, '', 'voted S2', 'ok'), { role: 'candidate', term: 2, log: '', badge: '3 of 5 votes', badgeTone: 'ok' }, f(2, '', 'voted S2', 'ok'), f(1), f(1)],
    arrows: [{ from: 0, to: [1], tone: 'ok' }, { from: 2, to: [1], tone: 'ok' }],
  },
  {
    caption:
      'S2 becomes leader of term 2 and sends a heartbeat at once. A heartbeat is an AppendEntries message with no entries. Followers reset their timers, so nobody else starts an election. Two leaders in one term are impossible: two majorities share a server, and that server votes once per term.',
    msg: 'S2 to all: AppendEntries (heartbeat, term 2)',
    nodes: [f(2), { role: 'leader', term: 2, log: '', badge: 'leader', badgeTone: 'ok' }, f(2), f(2), f(2)],
    arrows: [{ from: 1, to: [0, 2, 3, 4] }],
  },
  {
    caption:
      'A client sends x = 5 to the leader. The leader appends it to its own log as entry 1 in term 2. The entry is not committed. The leader will not apply it or answer the client until a majority has stored it.',
    msg: 'client to S2: x = 5',
    nodes: [f(2), { role: 'leader', term: 2, log: '2', badge: 'appended, not committed', badgeTone: 'warn' }, f(2), f(2), f(2)],
  },
  {
    caption:
      'S5 has crashed. The leader still sends entry 1 to everyone. It reaches S1, S3, and S4. Each writes it to its log and acknowledges. The cluster lost a server and keeps working.',
    msg: 'S2 to all: AppendEntries (entry 1, term 2)',
    nodes: [f(2, '2', 'ack', 'ok'), { role: 'leader', term: 2, log: '2', badge: 'leader', badgeTone: 'ok' }, f(2, '2', 'ack', 'ok'), f(2, '2', 'ack', 'ok'), down(2)],
    arrows: [{ from: 1, to: [0, 2, 3] }],
  },
  {
    caption:
      'The leader counts copies: itself, S1, S3, and S4. A majority of 5 is 3, so entry 1 is committed. The leader applies it and answers the client. The client waited for the second-fastest acknowledgement (leader plus two is 3), not for the slowest server.',
    msg: 'Entry 1 is on a majority: committed. S2 answers the client.',
    nodes: [f(2, '2'), { role: 'leader', term: 2, log: '2*', badge: 'committed, OK sent', badgeTone: 'ok' }, f(2, '2'), f(2, '2'), down(2)],
    arrows: [{ from: 0, to: [1], tone: 'ok' }, { from: 2, to: [1], tone: 'ok' }],
  },
  {
    caption: 'The next heartbeat carries the leader’s commit index. Followers mark entry 1 committed and apply it. All live servers now hold the same committed log.',
    msg: 'S2 to all: heartbeat (commit index 1)',
    nodes: [f(2, '2*'), { role: 'leader', term: 2, log: '2*', badge: 'leader', badgeTone: 'ok' }, f(2, '2*'), f(2, '2*'), down(2)],
    arrows: [{ from: 1, to: [0, 2, 3] }],
  },
  {
    caption:
      'The leader’s machine dies. Two of five servers are now down: S2 and S5. The rest stop receiving heartbeats, and their timers run down. Writes stop until a new leader exists. In Raft the outage lasts about one election timeout.',
    msg: 'S2 crashed. Heartbeats stop.',
    nodes: [f(2, '2*', 'timer 230'), down(2, '2*'), f(2, '2*', 'timer 250'), f(2, '2*', 'timer 190'), down(2)],
  },
  {
    caption:
      'S4’s timer is shortest. It becomes a candidate in term 3 and asks for votes. The request also states its last log entry: index 1, term 2. A voter refuses a candidate whose log is less up to date than its own. That rule is what keeps committed entries safe.',
    msg: 'S4 to all: RequestVote (term 3, last entry: index 1, term 2)',
    nodes: [f(2, '2*'), down(2, '2*'), f(2, '2*'), { role: 'candidate', term: 3, log: '2*', badge: 'voted for self', badgeTone: 'warn' }, down(2)],
    arrows: [{ from: 3, to: [0, 2] }],
  },
  {
    caption:
      'S1 and S3 check that S4’s log is at least as up to date as theirs, then vote yes. S4 has 3 votes out of 5 and wins term 3 with only three servers alive. Five servers tolerate two failures. Entry 1 survives because every majority overlaps the majority that stored it.',
    msg: 'S1 and S3 to S4: vote granted. S4 is leader of term 3.',
    nodes: [f(3, '2*', 'voted S4', 'ok'), down(2, '2*'), f(3, '2*', 'voted S4', 'ok'), { role: 'leader', term: 3, log: '2*', badge: 'leader', badgeTone: 'ok' }, down(2)],
    arrows: [{ from: 0, to: [3], tone: 'ok' }, { from: 2, to: [3], tone: 'ok' }],
  },
  {
    caption:
      'S2 and S5 restart. S2 still believes term 2, but the first message from S4 carries term 3, so S2 steps down and follows. S5 has an empty log, so S4 sends it entry 1. A follower’s log always ends up matching the leader’s.',
    msg: 'S4 to S2 and S5: AppendEntries (term 3, catch up)',
    nodes: [f(3, '2*'), f(3, '2*', 'stepped down', 'warn'), f(3, '2*'), { role: 'leader', term: 3, log: '2*', badge: 'leader', badgeTone: 'ok' }, f(3, '2*', 'log copied', 'ok')],
    arrows: [{ from: 3, to: [1, 4] }],
  },
];

const toneColor = (t?: Tone) => (t === 'ok' ? 'var(--ok)' : t === 'warn' ? 'var(--warn)' : t === 'bad' ? 'var(--bad)' : t === 'muted' ? 'var(--muted)' : 'var(--fg)');

function Node({ i, s }: { i: number; s: NodeState }) {
  const cx = X[i];
  const stroke = s.down ? 'var(--bad)' : s.role === 'leader' ? 'var(--accent)' : s.role === 'candidate' ? 'var(--warn)' : 'var(--fg)';
  const entries = s.log ? s.log.split(' ') : [];
  return (
    <g opacity={s.down ? 0.6 : 1}>
      <SketchBox cx={cx} cy={NODE_Y} w={124} h={68} seed={seedOf(`raft-${i}`)} stroke={stroke} strokeWidth={s.role === 'leader' ? 2.4 : 1.4} dashed={s.down} fill={s.role === 'leader' ? 'var(--accent-soft)' : undefined} fillStyle="solid" />
      <HandText x={cx} y={NODE_Y - 12} size={18} weight={700}>
        {`S${i + 1}`}
      </HandText>
      <HandText x={cx} y={NODE_Y + 14} size={14} color="var(--muted)">
        {s.down ? 'down' : `${s.role} · term ${s.term}`}
      </HandText>
      {s.badge && (
        <HandText x={cx} y={NODE_Y + 56} size={14} color={toneColor(s.badgeTone)} weight={700}>
          {s.badge}
        </HandText>
      )}
      {[0, 1, 2].map((k) => {
        const e = entries[k];
        const bx = cx - 30 + k * 30;
        const by = NODE_Y + 98;
        if (!e) return <SketchBox key={k} cx={bx} cy={by} w={26} h={26} r={4} seed={seedOf(`slot-${i}-${k}`)} stroke="var(--muted)" dashed strokeWidth={1} />;
        const committed = e.endsWith('*');
        return (
          <g key={k}>
            <SketchBox cx={bx} cy={by} w={26} h={26} r={4} seed={seedOf(`ent-${i}-${k}`)} stroke={committed ? 'var(--ok)' : 'var(--warn)'} fill={committed ? 'var(--ok)' : undefined} fillStyle="solid" dashed={!committed} />
            <HandText x={bx} y={by + 1} size={14} weight={700} color={committed ? '#fff' : 'var(--fg)'}>
              {e.replace('*', '')}
            </HandText>
          </g>
        );
      })}
    </g>
  );
}

function Arcs({ a, idx }: { a: Arrows; idx: number }) {
  const color = toneColor(a.tone ?? 'muted');
  const accent = a.tone ? color : 'var(--accent)';
  return (
    <g>
      {a.to.map((t) => {
        const d = Math.abs(t - a.from);
        const h = 14 + 18 * d;
        const x1 = X[a.from] + (t > a.from ? 8 : -8);
        const x2 = X[t] + (t > a.from ? -8 : 8);
        return <SketchArrow key={`${idx}-${t}`} points={[[x1, TOP], [(x1 + x2) / 2, TOP - h], [x2, TOP]]} stroke={accent} strokeWidth={1.8} seed={seedOf(`arc-${a.from}-${t}`)} />;
      })}
    </g>
  );
}

export default function RaftWalk() {
  return (
    <AnimFrame title="Raft: an election, a commit, a leader crash" steps={steps} interval={4600}>
      {(i, s) => (
        <SketchSvg width={720} height={330} label="Five Raft servers with their roles, terms, and logs">
          <HandText x={360} y={16} size={16} weight={700} color="var(--accent)">
            {s.msg}
          </HandText>
          {s.arrows?.map((a, k) => <Arcs key={`${i}-${k}`} a={a} idx={k} />)}
          {s.nodes.map((n, k) => (
            <Node key={k} i={k} s={n} />
          ))}
          <HandText x={360} y={296} size={14} color="var(--muted)">
            {'Boxes under a server are its log, one per entry, with the term inside. Green = committed. Dashed = not yet.'}
          </HandText>
        </SketchSvg>
      )}
    </AnimFrame>
  );
}

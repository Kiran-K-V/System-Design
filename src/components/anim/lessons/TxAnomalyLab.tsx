import { useState } from 'react';
import AnimFrame from '../AnimFrame';
import { TONE, type Tone } from '../FlowDiagram';
import { HandText, SketchArrow, SketchBox, SketchSvg, seedOf } from '../sketch';

/** Two transactions interleave on one database. Each tab replays one anomaly, then the same schedule at a stronger isolation level. */

interface Ev {
  lane: 1 | 2;
  /** Text in the transaction box. Lines split on "\n". */
  text: string;
  /** Text in the database cell. */
  db: string;
  /** Arrow points to the database (write) or from it (read). */
  dir: 'w' | 'r';
  tone?: Tone;
  dashed?: boolean;
  /** Caption shown when this event is the newest one. */
  caption: string;
}

interface Run {
  level: string;
  levelTone: Tone;
  events: Ev[];
  intro: string;
  verdict: string;
}

interface Scenario {
  id: string;
  tab: string;
  bad: Run;
  fix: Run;
}

const SCENARIOS: Scenario[] = [
  {
    id: 'dirty',
    tab: 'Dirty read',
    bad: {
      level: 'Read uncommitted (the SQL standard allows this)',
      levelTone: 'bad',
      intro: 'Alice has a balance of 100. T1 will change it and then cancel. T2 will read it in between. A dirty read means reading data that another transaction wrote but has not committed.',
      events: [
        { lane: 1, text: 'UPDATE balance = 0', db: 'balance = 0\n(uncommitted)', dir: 'w', dashed: true, caption: 'T1 writes balance = 0. It has not committed. The write exists in the database, but it is not final.' },
        { lane: 2, text: 'SELECT balance\n-> 0', db: 'returns 0', dir: 'r', tone: 'bad', caption: 'T2 reads and gets 0. It read a value that T1 has not committed. This is the dirty read.' },
        { lane: 1, text: 'ROLLBACK', db: 'balance = 100\n(restored)', dir: 'w', caption: 'T1 cancels. The balance goes back to 100. The value 0 never became real.' },
        { lane: 2, text: 'Rejects payment:\n"balance is 0"', db: 'T2 acted on a\nvalue that never\nexisted', dir: 'w', tone: 'bad', caption: 'T2 already acted on the 0. It refused a payment that Alice could afford. Nothing in the database is wrong now, but the decision was.' },
      ],
      verdict: 'T2 decided from data that was rolled back.',
    },
    fix: {
      level: 'Read committed',
      levelTone: 'ok',
      intro: 'Same schedule at Read committed. The rule: a query sees only data that was committed before the query started. Read committed is the default in PostgreSQL. PostgreSQL does not implement dirty reads at all.',
      events: [
        { lane: 1, text: 'UPDATE balance = 0', db: 'balance = 0\n(uncommitted)', dir: 'w', dashed: true, caption: 'T1 writes balance = 0, uncommitted. Same as before.' },
        { lane: 2, text: 'SELECT balance\n-> 100', db: 'returns 100\n(last committed)', dir: 'r', tone: 'ok', caption: 'T2 reads and gets 100, the last committed value. The database hides T1\'s pending write. How it hides it is the next section.' },
        { lane: 1, text: 'ROLLBACK', db: 'balance = 100', dir: 'w', caption: 'T1 cancels. Nothing changed from T2\'s point of view.' },
        { lane: 2, text: 'Accepts payment', db: 'consistent', dir: 'w', tone: 'ok', caption: 'T2 made its decision from committed data. Correct.' },
      ],
      verdict: 'T2 never saw T1\'s pending write.',
    },
  },
  {
    id: 'nonrep',
    tab: 'Non-repeatable read',
    bad: {
      level: 'Read committed',
      levelTone: 'bad',
      intro: 'T1 builds a report. It reads Alice\'s balance twice in one transaction. T2 changes the balance in between. A non-repeatable read means the same query returns different values inside one transaction.',
      events: [
        { lane: 1, text: 'SELECT balance\n-> 100', db: 'returns 100', dir: 'r', caption: 'T1 reads 100 and starts working with it.' },
        { lane: 2, text: 'UPDATE balance = 50\nCOMMIT', db: 'balance = 50\n(committed)', dir: 'w', caption: 'T2 sets the balance to 50 and commits. This is a legal committed change.' },
        { lane: 1, text: 'SELECT balance\n-> 50', db: 'returns 50', dir: 'r', tone: 'bad', caption: 'T1 reads the same row again and gets 50. At Read committed each query takes a new snapshot, so it sees T2\'s commit. T1\'s report now mixes two states of the world.' },
      ],
      verdict: 'The same query gave 100, then 50, inside one transaction.',
    },
    fix: {
      level: 'Repeatable read',
      levelTone: 'ok',
      intro: 'Same schedule at Repeatable read. The rule: the transaction takes one snapshot at its first query and uses it until the end.',
      events: [
        { lane: 1, text: 'SELECT balance\n-> 100', db: 'returns 100\n(snapshot taken)', dir: 'r', caption: 'T1 reads 100. Its snapshot is fixed here.' },
        { lane: 2, text: 'UPDATE balance = 50\nCOMMIT', db: 'balance = 50\n(committed)', dir: 'w', caption: 'T2 commits balance = 50. It writes a new version. It does not touch the version T1 reads.' },
        { lane: 1, text: 'SELECT balance\n-> 100', db: 'returns 100\n(from snapshot)', dir: 'r', tone: 'ok', caption: 'T1 reads again and still gets 100. Every read in T1 sees the same snapshot. T1 will not see 50 until it starts a new transaction.' },
      ],
      verdict: 'Both reads agree.',
    },
  },
  {
    id: 'lost',
    tab: 'Lost update',
    bad: {
      level: 'Read committed',
      levelTone: 'bad',
      intro: 'Alice\'s balance is 100. T1 adds 50. T2 adds 20. The right answer is 170. Both transactions read the balance, add in the application, and write the sum back. This pattern is called read-modify-write.',
      events: [
        { lane: 1, text: 'SELECT balance\n-> 100', db: 'returns 100', dir: 'r', caption: 'T1 reads 100. It will write back 100 + 50.' },
        { lane: 2, text: 'SELECT balance\n-> 100', db: 'returns 100', dir: 'r', caption: 'T2 reads 100 too. It does not know T1 is also working on this row.' },
        { lane: 1, text: 'UPDATE balance = 150\nCOMMIT', db: 'balance = 150\n(committed)', dir: 'w', caption: 'T1 writes 150 and commits.' },
        { lane: 2, text: 'UPDATE balance = 120\nCOMMIT', db: 'balance = 120\n(committed)', dir: 'w', tone: 'bad', caption: 'T2 writes 100 + 20 = 120 and commits. It overwrites T1\'s work. Each transaction was correct alone. Together they lost T1\'s +50.' },
      ],
      verdict: 'Final balance 120. It should be 170.',
    },
    fix: {
      level: 'Repeatable read (PostgreSQL)',
      levelTone: 'ok',
      intro: 'Same schedule at Repeatable read. PostgreSQL detects that T2 tries to change a row that changed after T2\'s snapshot. The database stops T2 instead of letting it overwrite. An atomic UPDATE (balance = balance + 20) or SELECT ... FOR UPDATE also avoids the problem at Read committed.',
      events: [
        { lane: 1, text: 'SELECT balance\n-> 100', db: 'returns 100', dir: 'r', caption: 'T1 reads 100.' },
        { lane: 2, text: 'SELECT balance\n-> 100', db: 'returns 100', dir: 'r', caption: 'T2 reads 100. Its snapshot is fixed.' },
        { lane: 1, text: 'UPDATE balance = 150\nCOMMIT', db: 'balance = 150\n(committed)', dir: 'w', caption: 'T1 writes 150 and commits.' },
        { lane: 2, text: 'UPDATE balance = 120', db: 'ERROR: could not\nserialize access', dir: 'w', tone: 'bad', caption: 'T2 tries to write. The row changed since T2\'s snapshot, so PostgreSQL rolls T2 back with "could not serialize access due to concurrent update". The application must retry the whole transaction.' },
        { lane: 2, text: 'retry: read 150,\nwrite 170, COMMIT', db: 'balance = 170\n(committed)', dir: 'w', tone: 'ok', caption: 'T2 retries from the start. It reads 150, writes 170, and commits. Both updates survive.' },
      ],
      verdict: 'Final balance 170. The cost: T2 had to retry.',
    },
  },
  {
    id: 'skew',
    tab: 'Write skew',
    bad: {
      level: 'Repeatable read',
      levelTone: 'bad',
      intro: 'Rule: at least one doctor must stay on call. Alice and Bob are both on call. Each wants to go off call. Each checks first that the other is still on call. This is a rule across two rows, and the two transactions write different rows.',
      events: [
        { lane: 1, text: 'SELECT count(on call)\n-> 2', db: 'returns 2', dir: 'r', caption: 'T1 (Alice) counts doctors on call. It gets 2, so it may leave.' },
        { lane: 2, text: 'SELECT count(on call)\n-> 2', db: 'returns 2', dir: 'r', caption: 'T2 (Bob) counts too. It also gets 2. Both snapshots are valid.' },
        { lane: 1, text: 'Alice off call\nCOMMIT', db: 'on call:\nBob only', dir: 'w', caption: 'T1 sets Alice off call and commits. It wrote the Alice row.' },
        { lane: 2, text: 'Bob off call\nCOMMIT', db: 'on call:\nnobody', dir: 'w', tone: 'bad', caption: 'T2 sets Bob off call and commits. It wrote the Bob row, a different row. There is no write conflict, so the database allows it. The rule is broken.' },
      ],
      verdict: 'Nobody is on call. Each transaction was valid in its own snapshot.',
    },
    fix: {
      level: 'Serializable',
      levelTone: 'ok',
      intro: 'Same schedule at Serializable. The database promises the result equals some one-at-a-time order. PostgreSQL tracks what each transaction read and wrote, and aborts one when no one-at-a-time order can explain the result.',
      events: [
        { lane: 1, text: 'SELECT count(on call)\n-> 2', db: 'returns 2', dir: 'r', caption: 'T1 counts: 2.' },
        { lane: 2, text: 'SELECT count(on call)\n-> 2', db: 'returns 2', dir: 'r', caption: 'T2 counts: 2. The database records that both read the same set.' },
        { lane: 1, text: 'Alice off call\nCOMMIT', db: 'on call:\nBob only', dir: 'w', caption: 'T1 commits.' },
        { lane: 2, text: 'Bob off call\nCOMMIT', db: 'ERROR: could not\nserialize access', dir: 'w', tone: 'bad', caption: 'T2 tries to commit. If T1 had run first, T2 would have counted 1 and refused. No one-at-a-time order gives T2\'s result, so PostgreSQL aborts T2 with "could not serialize access due to read/write dependencies".' },
        { lane: 2, text: 'retry: count -> 1\nstay on call', db: 'on call:\nBob only', dir: 'r', tone: 'ok', caption: 'T2 retries. It counts 1 and stays on call. The rule holds.' },
      ],
      verdict: 'The rule holds. The cost: one transaction retried.',
    },
  },
];

interface TxStep {
  caption: string;
  run: Run;
  shown: number;
  banner?: string;
}

function stepsFor(s: Scenario): TxStep[] {
  const out: TxStep[] = [];
  for (const run of [s.bad, s.fix]) {
    out.push({ caption: run.intro, run, shown: 0 });
    run.events.forEach((e, i) => out.push({ caption: e.caption, run, shown: i + 1 }));
    out.push({ caption: `${run.verdict} ${run === s.bad ? 'Next step: the same schedule at a stronger isolation level.' : ''}`.trim(), run, shown: run.events.length, banner: run.verdict });
  }
  return out;
}

const COL = { 1: 118, db: 350, 2: 582 } as const;
const ROW0 = 128;
const ROW = 54;
const H = 408;

function Diagram({ step }: { step: TxStep }) {
  const { run, shown, banner } = step;
  const lifeBottom = ROW0 + ROW * 5 - 20;
  return (
    <SketchSvg width={700} height={H} label={`Two transactions on one database at isolation level ${run.level}`}>
      <HandText x={350} y={16} size={15} weight={700} color={TONE[run.levelTone]}>
        {`Isolation level: ${run.level}`}
      </HandText>
      {([1, 'db', 2] as const).map((c) => (
        <g key={c}>
          <SketchBox cx={COL[c]} cy={62} w={c === 'db' ? 150 : 230} h={38} r={8} seed={seedOf(`head${c}`)} fill="var(--surface)" fillStyle="solid" />
          <HandText x={COL[c]} y={62} size={16} weight={700}>
            {c === 'db' ? 'Database' : `Transaction ${c}`}
          </HandText>
          <SketchArrow points={[[COL[c], 84], [COL[c], lifeBottom]]} head="none" dashed stroke="var(--muted)" strokeWidth={1} seed={seedOf(`life${c}`)} />
        </g>
      ))}
      {run.events.slice(0, shown).map((e, i) => {
        const y = ROW0 + i * ROW;
        const latest = i === shown - 1;
        const color = e.tone ? TONE[e.tone] : latest ? 'var(--accent)' : 'var(--fg)';
        const lx = COL[e.lane];
        const edge = e.lane === 1 ? lx + 115 : lx - 115;
        const dbEdge = e.lane === 1 ? COL.db - 75 : COL.db + 75;
        const pts: [number, number][] = e.dir === 'w' ? [[edge + (e.lane === 1 ? 3 : -3), y], [dbEdge, y]] : [[dbEdge, y], [edge + (e.lane === 1 ? 3 : -3), y]];
        return (
          <g key={i}>
            <SketchBox cx={lx} cy={y} w={230} h={44} r={8} seed={seedOf(`ev${run.level}${i}`)} stroke={color} strokeWidth={latest ? 2.2 : 1.4} fill="var(--bg)" fillStyle="solid" />
            <HandText x={lx} y={y} size={14}>
              {e.text}
            </HandText>
            <SketchArrow points={pts} stroke={color} seed={seedOf(`ar${run.level}${i}`)} />
            <SketchBox cx={COL.db} cy={y} w={150} h={e.db.split('\n').length > 2 ? 52 : 44} r={8} seed={seedOf(`db${run.level}${i}`)} stroke={color} dashed={e.dashed} fill="var(--surface)" fillStyle="solid" />
            <HandText x={COL.db} y={y} size={14} color={e.tone ? TONE[e.tone] : undefined}>
              {e.db}
            </HandText>
          </g>
        );
      })}
      {banner && (
        <HandText x={350} y={H - 22} size={16} weight={700} color={TONE[run.levelTone]} halo>
          {banner}
        </HandText>
      )}
    </SketchSvg>
  );
}

export default function TxAnomalyLab() {
  const [id, setId] = useState(SCENARIOS[0].id);
  const scenario = SCENARIOS.find((s) => s.id === id)!;
  return (
    <div>
      <div className="not-prose mb-[-1.25rem] mt-8 flex flex-wrap gap-2" role="tablist" aria-label="Anomaly">
        {SCENARIOS.map((s) => (
          <button
            key={s.id}
            type="button"
            role="tab"
            aria-selected={s.id === id}
            onClick={() => setId(s.id)}
            className={`rounded-md border px-3 py-1.5 text-sm ${s.id === id ? 'border-accent bg-accent text-white' : 'border-line hover:bg-surface'}`}
          >
            {s.tab}
          </button>
        ))}
      </div>
      <AnimFrame key={id} title={`Anomaly: ${scenario.tab}. Bad run, then the fix.`} steps={stepsFor(scenario)} interval={3400}>
        {(_, step) => <Diagram step={step} />}
      </AnimFrame>
    </div>
  );
}

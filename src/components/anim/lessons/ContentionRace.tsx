import { useState } from 'react';
import AnimFrame from '../AnimFrame';
import { HandText, SketchSvg, TEXT_SIZES } from '../sketch';
import { Arr, Panel, type TT } from './TechParts';
import { Seg } from './CacheWidgetFrame';
import { SCRIPTS, run, type Frame, type Strategy, type Who } from './contentionRace';

/** The last seat, raced under five strategies. The state on screen is computed by contentionRace.ts. */

interface Line {
  caption: string;
  /** Text on the arrow of this step. */
  arrow?: string;
}

const INTRO = 'Seat 12A has one place left. Buyers A and B both press "Book" at the same moment. Two web servers handle them, so nothing orders the two requests. Step through to see what each strategy does with the same race.';

const LINES: Record<Strategy, Line[]> = {
  none: [
    { caption: 'A reads the seat row: 1 left.', arrow: 'read' },
    { caption: 'B reads the same row before A has written anything. B also sees 1 left.', arrow: 'read' },
    { caption: 'A writes "seats = 1 - 1 = 0" and gets "booked".', arrow: 'seats = 0' },
    { caption: 'B writes "seats = 1 - 1 = 0" too, from its out-of-date read, and also gets "booked". Two tickets for one seat. This is a lost update: B\'s write ignored A\'s.', arrow: 'seats = 0' },
  ],
  lock: [
    { caption: 'A runs SELECT ... FOR UPDATE, which locks the seat row and reads it. The database locks it and returns seats = 1.', arrow: 'FOR UPDATE' },
    { caption: 'B runs the same statement. The row is locked, so B waits. The PostgreSQL docs say other transactions that try to lock or change those rows wait until the first one ends.', arrow: 'FOR UPDATE' },
    { caption: 'A, still holding the lock, sets seats = 0 and records the booking.', arrow: 'seats = 0' },
    { caption: 'A commits. The lock is released. B\'s statement now completes and returns the committed row: seats = 0.', arrow: 'commit' },
    { caption: 'B sees no seat left and tells the user "sold out". Exactly one booking. The price: B waited, and every buyer of this row queues behind the lock holder.', arrow: 'sold out' },
    { caption: 'B ends its transaction. Keep these transactions short. A lock held across a slow call (a payment gateway) blocks everyone behind it.', arrow: 'release' },
  ],
  version: [
    { caption: 'A reads the row with its version: seats = 1, version = 1. No lock is taken.', arrow: 'read v1' },
    { caption: 'B reads the same row: seats = 1, version = 1.', arrow: 'read v1' },
    { caption: 'A writes "set seats = 0, version = 2 WHERE version = 1". One row matches. Booked.', arrow: 'WHERE v = 1' },
    { caption: 'B sends the same update, "WHERE version = 1". The version is now 2, so zero rows match. B knows it lost, re-reads, finds no seat, and answers "sold out". Under real load B would retry from the top.', arrow: 'WHERE v = 1' },
  ],
  hold: [
    { caption: 'A picks seat 12A. The server writes a hold on it with an expiry time, say 5 minutes. The hold is a write that only one buyer can win.', arrow: 'hold 5 min' },
    { caption: 'B picks the same seat and is refused: "someone is holding this seat". B can choose another seat or wait. Nobody is stuck behind a lock.', arrow: 'hold' },
    { caption: 'A leaves checkout without paying. When the hold expires (a TTL, which is a time to live, or an expiry check on read) the seat is free again. Something must do this, or abandoned holds would hide seats forever.', arrow: 'TTL ends' },
    { caption: 'B tries again and wins the hold.', arrow: 'hold 5 min' },
    { caption: 'B pays inside the window and confirms. The hold becomes a booking. If B had paid after the hold expired, the confirm would fail unless it re-checks the seat.', arrow: 'confirm' },
  ],
  queue: [
    { caption: 'A\'s request does not touch the seat. It is appended to a queue (the Queues lesson) that is keyed by seat, so every request for 12A lands in one place.', arrow: 'enqueue' },
    { caption: 'B\'s request is appended behind A\'s. The order is now fixed, and it was decided by one component, not by a race.', arrow: 'enqueue' },
    { caption: 'One worker takes the oldest request, A, checks the seat, and books it. Because only one worker handles this seat, there is no concurrent writer to collide with.', arrow: 'book' },
    { caption: 'The worker takes B\'s request. The seat is gone, so B gets "sold out". The price: the answer comes back through the queue, so the user waits, and one slow request delays those behind it.', arrow: 'book' },
  ],
};

const NAMES: Record<Strategy, string> = { none: 'No control', lock: 'Row lock', version: 'Version check', hold: 'Hold with TTL', queue: 'Queue' };

function status(strategy: Strategy, f: Frame | null, who: Who): { sub: string; tone: TT } {
  if (!f) return { sub: 'wants 12A', tone: 'fg' };
  const db = f.db;
  const refusedText = strategy === 'hold' ? 'seat is held' : strategy === 'version' ? 'lost, must retry' : 'sold out';
  const justRefused = 'who' in f.op && f.op.who === who && f.result === 'refused';
  if (strategy === 'hold' && who === 'A' && db.expired) return { sub: 'walked away', tone: 'muted' };
  if (db.sold.includes(who)) return { sub: 'booked', tone: db.sold.length > 1 ? 'bad' : 'ok' };
  if (justRefused) return { sub: refusedText, tone: 'bad' };
  if (db.waiting === who) return { sub: 'waiting', tone: 'warn' };
  if (db.lock === who) return { sub: 'holds lock', tone: 'accent' };
  if (db.hold === who) return { sub: 'holds seat', tone: 'accent' };
  if (db.queue.includes(who)) return { sub: 'in queue', tone: 'warn' };
  if (db.refused.includes(who)) return { sub: strategy === 'hold' ? 'turned away' : refusedText, tone: 'bad' };
  const s = f.seen[who];
  return { sub: s ? `saw ${s.seats} left` : 'wants 12A', tone: 'fg' };
}

const initialDb: Frame['db'] = { seats: 1, version: 1, lock: null, hold: null, sold: [], refused: [], expired: false, waiting: null, queue: [] };

function Scene({ strategy, frame, arrow }: { strategy: Strategy; frame: Frame | null; arrow?: string }) {
  const db = frame?.db ?? initialDb;
  const q = strategy === 'queue';
  const dbX = q ? 445 : 360;
  const a = status(strategy, frame, 'A');
  const b = status(strategy, frame, 'B');
  const who = frame && 'who' in frame.op ? (frame.op.who as Who) : null;
  const tone: TT = !frame ? 'muted' : db.sold.length > 1 ? 'bad' : frame.result === 'ok' ? 'ok' : frame.result === 'refused' ? 'bad' : frame.result === 'waiting' ? 'warn' : 'accent';
  const hub = q ? 255 : dbX - 95;
  const extra =
    strategy === 'lock' ? `lock: ${db.lock ?? 'free'}` : strategy === 'hold' ? `hold: ${db.hold ?? 'none'}` : strategy === 'version' ? `version ${db.version}` : '';
  const oversold = db.sold.length > 1;
  const out = db.sold.length ? `${db.sold.join(' and ')}` : 'nobody';
  return (
    <SketchSvg width={720} height={320} label="Buyers A and B race for one seat. The database row and the booking result change at each step.">
      <Panel cx={85} cy={85} w={120} label="Buyer A" sub={a.sub} tone={a.tone} strong={who === 'A'} sk="cra" />
      <Panel cx={85} cy={235} w={120} label="Buyer B" sub={b.sub} tone={b.tone} strong={who === 'B'} sk="crb" />
      {q && <Panel cx={255} cy={160} w={110} label="Queue" sub={db.queue.length ? db.queue.join(', ') : 'empty'} tone={db.queue.length ? 'warn' : 'muted'} sk="crq" />}
      <Panel cx={dbX} cy={160} w={q ? 150 : 170} label="Seat 12A" sub={`seats ${db.seats}`} tone={oversold ? 'bad' : db.seats === 0 ? 'ok' : 'fg'} strong sk="crdb" />
      {extra && <HandText x={dbX} y={212} size={TEXT_SIZES.note} color="var(--muted)">{extra}</HandText>}
      <Panel cx={640} cy={160} w={130} label="Booked by" sub={out} tone={oversold ? 'bad' : db.sold.length ? 'ok' : 'muted'} dashed={!db.sold.length} sk="cro" />
      {frame && oversold && <HandText x={640} y={210} size={TEXT_SIZES.note} color="var(--bad)">oversold</HandText>}
      {!q && <Arr from={[148, 98]} to={[hub, 140]} tone={who === 'A' ? tone : 'muted'} dashed={who !== 'A'} label={who === 'A' ? arrow : undefined} labelDy={-24} sk="cra1" />}
      {!q && <Arr from={[148, 222]} to={[hub, 182]} tone={who === 'B' ? tone : 'muted'} dashed={who !== 'B'} label={who === 'B' ? arrow : undefined} labelDy={26} sk="crb1" />}
      {q && <Arr from={[148, 98]} to={[198, 140]} tone={who === 'A' && frame?.op.op === 'enqueue' ? 'accent' : 'muted'} dashed label={who === 'A' && frame?.op.op === 'enqueue' ? arrow : undefined} labelDy={-24} sk="cra2" />}
      {q && <Arr from={[148, 222]} to={[198, 182]} tone={who === 'B' && frame?.op.op === 'enqueue' ? 'accent' : 'muted'} dashed label={who === 'B' && frame?.op.op === 'enqueue' ? arrow : undefined} labelDy={26} sk="crb2" />}
      {q && <Arr from={[312, 160]} to={[368, 160]} tone={frame?.op.op === 'process' ? tone : 'muted'} dashed={frame?.op.op !== 'process'} label={frame?.op.op === 'process' ? arrow : undefined} sk="crp" />}
      <Arr from={[q ? 526 : 451, 160]} to={[572, 160]} tone={db.sold.length ? (oversold ? 'bad' : 'ok') : 'muted'} dashed={!db.sold.length} sk="crout" />
    </SketchSvg>
  );
}

export default function ContentionRace() {
  const [strategy, setStrategy] = useState<Strategy>('none');
  const frames = run(SCRIPTS[strategy]);
  const steps = [{ caption: INTRO }, ...LINES[strategy].map((l) => ({ caption: l.caption }))];
  return (
    <div>
      <div className="not-prose mt-8 flex flex-wrap items-center gap-3 text-xs text-muted">
        <span>Strategy</span>
        <Seg label="Strategy" value={strategy} onChange={setStrategy} options={(Object.keys(NAMES) as Strategy[]).map((s) => ({ id: s, label: NAMES[s] }))} />
      </div>
      <AnimFrame key={strategy} title={`The last seat: ${NAMES[strategy].toLowerCase()}`} steps={steps} interval={5200}>
        {(i) => <Scene strategy={strategy} frame={i === 0 ? null : frames[i - 1]} arrow={i === 0 ? undefined : LINES[strategy][i - 1].arrow} />}
      </AnimFrame>
    </div>
  );
}

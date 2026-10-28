import AnimFrame from '../AnimFrame';
import { HandText, SketchArrow, SketchBox, SketchSvg, TEXT_SIZES, seedOf } from '../sketch';
import { KV_SLOTS, MAX_BS, REQS, schedule, type Snap } from './AiE3BatchLogic';

const SNAPS = schedule();
const byId = (id: string) => REQS.find((r) => r.id === id)!;

interface Step {
  caption: string;
  /** Index into SNAPS, or -1 for the state before iteration 1. */
  at: number;
  focus?: string;
}

const steps: Step[] = [
  {
    caption:
      'Four requests, a batch limit of 3, and 12 slots of KV memory (one slot holds one token of keys and values). The scheduler books a request\'s max_tokens in slots when the request joins: A books 6, B 4, C 6, D 4. It gets control back after every iteration, not after every request. D arrives later.',
    at: -1,
  },
  {
    caption:
      'Iteration 1. The scheduler admits A and B in arrival order: 10 of 12 slots are booked. C needs 6 and only 2 are free, so C stays in the queue. A batch slot is empty, but memory is full, so memory is the gate. The engine runs one iteration and A and B each make a token.',
    at: 0,
    focus: 'C',
  },
  {
    caption: 'Iteration 2. Same batch. B makes its last token and leaves at once, and its 4 slots are free again. In a static batch, B would sit and wait for A. Here the client already has its answer.',
    at: 1,
    focus: 'B',
  },
  {
    caption:
      'Iteration 3. Free memory is now 6 slots, and C needs 6, so C joins between two iterations. Its 3 prompt tokens run in this same iteration, beside A\'s one decode token. D has arrived, but it needs 4 and none are free.',
    at: 2,
    focus: 'C',
  },
  {
    caption: 'Iteration 4. A makes its fourth token and returns. Its 6 slots are released. D still waits, because the 4 slots it needs were not free when this iteration was scheduled.',
    at: 3,
    focus: 'A',
  },
  {
    caption: 'Iteration 5. D is admitted: 6 slots are free and it needs 4. C produces its last token and returns. D\'s prompt runs in this iteration beside C\'s decode token.',
    at: 4,
    focus: 'D',
  },
  {
    caption: 'Iteration 6. D is the only request left. It makes its last token and returns. The whole stream took 6 iterations, with the batch changing at almost every one of them.',
    at: 5,
    focus: 'D',
  },
];

const ROWS = [92, 148, 204];
const CELL = 36;
const BAR_X = 132;
const BAR_Y = 334;

function Chip({ cx, cy, w, label, stroke, active, seed }: { cx: number; cy: number; w: number; label: string; stroke: string; active?: boolean; seed: string }) {
  return (
    <g>
      <SketchBox cx={cx} cy={cy} w={w} h={44} r={8} seed={seedOf(seed)} stroke={stroke} strokeWidth={active ? 2.2 : 1.4} fill={active ? stroke : undefined} />
      <HandText x={cx} y={cy + 1} size={TEXT_SIZES.label} color="var(--fg)">
        {label}
      </HandText>
    </g>
  );
}

function Scene({ snap, focus }: { snap: Snap | null; focus?: string }) {
  const waiting = snap ? snap.waiting : ['A', 'B', 'C'];
  const running = snap ? snap.running : [];
  const done = snap ? [...snap.done, ...snap.finished] : [];
  const reservedNow = running.reduce((s, r) => s + byId(r.id).maxTokens, 0);
  let x = BAR_X;
  return (
    <>
      <HandText x={110} y={34} size={TEXT_SIZES.heading} color="var(--muted)">Waiting</HandText>
      <HandText x={372} y={34} size={TEXT_SIZES.heading} color="var(--muted)">{`Running (limit ${MAX_BS})`}</HandText>
      <HandText x={620} y={34} size={TEXT_SIZES.heading} color="var(--muted)">Returned</HandText>

      {waiting.slice(0, 3).map((id, i) => (
        <Chip key={id} cx={110} cy={ROWS[i]} w={120} label={`${id}  books ${byId(id).maxTokens}`} stroke={id === focus ? 'var(--accent)' : 'var(--muted)'} active={id === focus} seed={`w-${id}`} />
      ))}
      {Array.from({ length: MAX_BS }, (_, i) => {
        const r = running[i];
        if (!r) return <SketchBox key={i} cx={372} cy={ROWS[i]} w={220} h={44} r={8} seed={seedOf(`slot-${i}`)} stroke="var(--muted)" dashed />;
        const q = byId(r.id);
        const label = `${r.id}: ${r.first ? 'prompt, ' : 'token '}${r.made} of ${q.out}`;
        const leaving = snap!.finished.includes(r.id);
        return <Chip key={`${r.id}-${i}`} cx={372} cy={ROWS[i]} w={220} label={label} stroke={r.id === focus ? 'var(--accent)' : leaving ? 'var(--ok)' : 'var(--muted)'} active={r.id === focus} seed={`run-${r.id}`} />;
      })}
      {done.slice(0, 4).map((id, i) => (
        <Chip key={id} cx={620} cy={92 + i * 46} w={90} label={id} stroke="var(--ok)" seed={`done-${id}`} />
      ))}
      <SketchArrow points={[[176, 148], [254, 148]]} stroke="var(--muted)" seed={seedOf('a1')} />
      <SketchArrow points={[[488, 148], [566, 148]]} stroke="var(--muted)" seed={seedOf('a2')} />
      <HandText x={372} y={262} size={TEXT_SIZES.note} color="var(--muted)">
        {snap ? 'the engine runs ONE iteration for this batch' : 'no iteration has run yet'}
      </HandText>

      <HandText x={24} y={BAR_Y - 40} anchor="start" size={TEXT_SIZES.heading} color="var(--muted)">{`KV slots booked: ${snap ? reservedNow : 0} of ${KV_SLOTS}`}</HandText>
      {Array.from({ length: KV_SLOTS }, (_, i) => (
        <SketchBox key={i} cx={BAR_X + i * CELL + CELL / 2} cy={BAR_Y} w={CELL - 3} h={34} r={6} seed={seedOf(`cell-${i}`)} stroke="var(--border)" />
      ))}
      {running.map((r) => {
        const n = byId(r.id).maxTokens;
        const w = n * CELL - 3;
        const cx = x + (n * CELL) / 2;
        x += n * CELL;
        return (
          <g key={r.id}>
            <SketchBox cx={cx} cy={BAR_Y} w={w} h={34} r={6} seed={seedOf(`seg-${r.id}`)} stroke="var(--ok)" fill="var(--ok)" />
            <HandText x={cx} y={BAR_Y + 1} size={TEXT_SIZES.label} color="var(--fg)">{`${r.id} books ${n}`}</HandText>
          </g>
        );
      })}
      {snap?.blocked && (
        <HandText x={24} y={BAR_Y + 44} anchor="start" size={TEXT_SIZES.label} color="var(--bad)">
          {`${snap.blocked.id} needs ${snap.blocked.need} slots, ${snap.blocked.free} free: it waits.`}
        </HandText>
      )}
    </>
  );
}

export default function AiE3SchedLoop() {
  return (
    <AnimFrame title="Iteration-level scheduling, four requests" steps={steps} interval={6500}>
      {(i) => (
        <SketchSvg width={720} height={400} label="A scheduler admits requests into a running batch before each iteration and returns finished requests after each iteration, limited by booked KV memory">
          <Scene snap={steps[i].at >= 0 ? SNAPS[steps[i].at] : null} focus={steps[i].focus} />
        </SketchSvg>
      )}
    </AnimFrame>
  );
}

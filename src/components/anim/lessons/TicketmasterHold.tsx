import { DesignCompare, type CompareVariant } from '../DesignBuild';

const nodes = [
  { id: 'a', x: 90, y: 80, w: 120, h: 56, label: 'Fan A' },
  { id: 'b', x: 90, y: 260, w: 120, h: 56, label: 'Fan B' },
  { id: 'seat', x: 480, y: 170, w: 160, h: 80, label: 'Seat 12A', shape: 'db' as const },
];
const edges = [
  { from: 'a', to: 'seat' },
  { from: 'b', to: 'seat' },
];
const state = (text: string, tone: 'accent' | 'ok' | 'bad' | 'warn' | 'muted' = 'accent') => [{ x: 480, y: 250, text, anchor: 'middle' as const, tone }];

const naive: CompareVariant = {
  id: 'naive',
  label: 'Naive: read then write',
  nodes,
  edges,
  steps: [
    { caption: 'Seat 12A is available. Two fans click it in the same second.', notes: state('available') },
    { caption: 'Fan A runs SELECT. The row says available. Fan B runs the same SELECT a moment later. It also says available.', packets: [{ from: 'a', to: 'seat' }, { from: 'b', to: 'seat', delay: 0.5 }], notes: state('available'), tones: { a: 'warn', b: 'warn' } },
    { caption: 'A runs UPDATE to held by A. B runs UPDATE to held by B. Nothing stopped B, because the UPDATE did not re-check the status. B overwrites A.', packets: [{ from: 'a', to: 'seat' }, { from: 'b', to: 'seat', delay: 0.5 }], notes: state('held by B', 'bad'), tones: { a: 'bad', b: 'bad', seat: 'bad' } },
    { caption: 'Both fans see "seat held for you". Both enter their card. One of them will be told, too late, that the seat is gone.', notes: state('two holders', 'bad'), tones: { a: 'bad', b: 'bad', seat: 'bad' } },
  ],
};

const better: CompareVariant = {
  id: 'better',
  label: 'Better: conditional hold',
  nodes,
  edges,
  steps: [
    { caption: 'Same start. The hold is one statement. It sets held_by and hold_expires_at, but only WHERE status is available, or held with an expired time.', notes: state('available') },
    { caption: 'Fan A\'s statement runs first. It matches the row, sets the hold for 10 minutes, and reports 1 row changed. A has the seat.', packets: [{ from: 'a', to: 'seat' }], notes: state('held by A, 10 min', 'ok'), tones: { a: 'ok', seat: 'ok' } },
    { caption: 'Fan B\'s statement runs next. The row is held and not expired, so the WHERE clause fails. 0 rows changed. B is told "seat taken" at once.', packets: [{ from: 'b', to: 'seat', tone: 'bad' }], notes: state('held by A, 10 min', 'ok'), tones: { a: 'ok', b: 'warn', seat: 'ok' } },
    { caption: 'A abandons the checkout. No job runs. Ten minutes later hold_expires_at is in the past, so the same statement matches again. The expiry is implicit.', notes: state('expired, free again', 'muted'), tones: { seat: 'muted' } },
    { caption: 'B tries again and wins. At payment time the confirm step checks "still held by me, not expired" before it marks the seat sold.', packets: [{ from: 'b', to: 'seat' }], notes: state('held by B', 'ok'), tones: { b: 'ok', seat: 'ok' } },
  ],
};

export default function TicketmasterHold() {
  return (
    <DesignCompare
      title="Two fans, one seat"
      prompt="Claiming a seat:"
      variants={[naive, better]}
      height={330}
      label="Two fans click the same seat. A read then write lets both hold it. A single conditional update with an expiry time lets only one."
    />
  );
}

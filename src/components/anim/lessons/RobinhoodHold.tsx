import { DesignCompare, type CompareVariant } from '../DesignBuild';

const nodes = [
  { id: 'a', x: 90, y: 80, w: 130, h: 56, label: 'Order A', sub: 'buy $800' },
  { id: 'b', x: 90, y: 260, w: 130, h: 56, label: 'Order B', sub: 'buy $800' },
  { id: 'svc', x: 340, y: 170, w: 140, h: 56, label: 'Order service' },
  { id: 'acct', x: 610, y: 170, w: 130, h: 90, label: 'Account', shape: 'db' as const, sub: 'buying power' },
];
const edges = [
  { from: 'a', to: 'svc' },
  { from: 'b', to: 'svc' },
  { from: 'svc', to: 'acct' },
];

const naive: CompareVariant = {
  id: 'readwrite',
  label: 'Naive: read, then write',
  nodes,
  edges,
  steps: [
    { caption: 'Two orders of $800 arrive together. The account has $1,000 of buying power, enough for one of them.', active: ['a', 'b'] },
    { caption: 'The service handles each order on its own thread. Both read the balance, and both see $1,000.', packets: [{ from: 'svc', to: 'acct' }, { from: 'acct', to: 'svc', delay: 0.6 }], notes: [{ x: 610, y: 260, text: 'both read $1,000', size: 14 }] },
    { caption: 'Each thread checks 800 <= 1,000 and passes. Neither sees the other. Each then runs power = power - 800.', tones: { a: 'ok', b: 'ok' }, active: ['svc'] },
    { caption: 'Both orders go to the exchange. The account ends at 1,000 - 800 - 800 = -$600. The check was right when it ran, but the data changed before the write. This is a check-then-act race, one of the anomalies in lesson 4.4.', tones: { acct: 'bad', a: 'bad', b: 'bad' }, notes: [{ x: 610, y: 260, text: 'power = -$600', size: 14, tone: 'bad' }] },
  ],
};

const hold: CompareVariant = {
  id: 'hold',
  label: 'Better: conditional hold',
  nodes,
  edges,
  steps: [
    { caption: 'Same two orders of $800, same $1,000 of buying power.', active: ['a', 'b'] },
    { caption: 'The check and the write become one statement: subtract 800 where power >= 800. The database runs the two statements one after the other on the same row.', packets: [{ from: 'a', to: 'svc' }, { from: 'svc', to: 'acct', delay: 0.5 }], active: ['acct'] },
    { caption: 'Order A changes one row. Power is now $200, and a $800 hold is recorded for A. A goes on to the exchange.', tones: { a: 'ok', acct: 'ok' }, notes: [{ x: 610, y: 260, text: 'power $200, hold A', size: 14, tone: 'ok' }] },
    { caption: 'Order B finds 200 < 800, so the statement changes zero rows. The service rejects B before it reaches the exchange. If A is cancelled later, its hold is released and power returns to $1,000.', tones: { b: 'bad', a: 'ok', acct: 'ok' }, packets: [{ from: 'b', to: 'svc', tone: 'bad' }] },
  ],
};

export default function RobinhoodHold() {
  return (
    <DesignCompare
      title="Two orders, one balance"
      prompt="Design:"
      variants={[naive, hold]}
      height={340}
      label="Comparison of two simultaneous orders against one account: a read-then-write design that overdraws and a conditional hold that rejects the second order."
    />
  );
}

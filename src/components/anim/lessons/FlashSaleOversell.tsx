import { DesignCompare, type CompareVariant } from '../DesignBuild';

const nodes = [
  { id: 'a', x: 90, y: 80, w: 130, h: 56, label: 'Buyer A' },
  { id: 'b', x: 90, y: 260, w: 130, h: 56, label: 'Buyer B' },
  { id: 'api', x: 340, y: 170, w: 130, h: 56, label: 'Sale API' },
  { id: 'redis', x: 610, y: 170, w: 130, h: 80, label: 'Stock counter', shape: 'db' as const, sub: 'last unit' },
];
const edges = [
  { from: 'a', to: 'api' },
  { from: 'b', to: 'api' },
  { from: 'api', to: 'redis' },
];

const naive: CompareVariant = {
  id: 'getset',
  label: 'Naive: GET, check, SET',
  nodes,
  edges,
  steps: [
    { caption: 'One unit is left. Buyer A and buyer B press reserve in the same millisecond.', active: ['a', 'b'] },
    { caption: 'Each request does GET stock. Both get the answer 1, because neither has written yet.', packets: [{ from: 'api', to: 'redis' }, { from: 'redis', to: 'api', delay: 0.6 }], notes: [{ x: 610, y: 240, text: 'both read 1', size: 14 }] },
    { caption: 'Each sees 1 > 0 and sets the stock to 0. Each writes a reservation row. Two buyers now hold the one unit.', tones: { a: 'ok', b: 'ok', redis: 'bad' }, notes: [{ x: 610, y: 240, text: 'stock 0, two winners', size: 14, tone: 'bad' }] },
    { caption: 'One buyer will be told, after paying, that the item is gone. With 10 million users and 10,000 units, this race happens on almost every unit.', tones: { a: 'ok', b: 'bad', redis: 'bad' } },
  ],
};

const decr: CompareVariant = {
  id: 'decr',
  label: 'Better: atomic DECR',
  nodes,
  edges,
  steps: [
    { caption: 'Same start: one unit left, two buyers at the same moment.', active: ['a', 'b'] },
    { caption: 'The API sends DECR stock, which means subtract 1 and return the new value. Redis runs commands one at a time, so the two decrements are ordered. A is first.', packets: [{ from: 'a', to: 'api' }, { from: 'api', to: 'redis', delay: 0.5 }], active: ['redis'] },
    { caption: 'A gets 0 back. The result is not below zero, so A holds a unit. The API writes the reservation.', tones: { a: 'ok', redis: 'ok' }, notes: [{ x: 610, y: 240, text: 'A: result 0, win', size: 14, tone: 'ok' }] },
    { caption: 'B gets -1 back. A negative result means there was nothing to take. The API sends INCR (add 1) to put the 1 back, and tells B the item is sold out. No second reservation exists.', tones: { b: 'bad', a: 'ok', redis: 'ok' }, packets: [{ from: 'b', to: 'api', tone: 'bad' }], notes: [{ x: 610, y: 240, text: 'B: result -1, INCR back', size: 14, tone: 'warn' }] },
  ],
};

export default function FlashSaleOversell() {
  return (
    <DesignCompare
      title="The last unit"
      prompt="Design:"
      variants={[naive, decr]}
      height={320}
      label="Comparison of two buyers racing for the last unit: a read-check-write design that sells it twice and an atomic decrement that sells it once."
    />
  );
}

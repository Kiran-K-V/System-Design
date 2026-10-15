import { DesignCompare, type CompareVariant } from '../DesignBuild';

const before: CompareVariant = {
  id: 'before',
  label: 'Before',
  nodes: [
    { id: 'buyer', x: 80, y: 150, w: 110, h: 56, label: 'Checkout' },
    { id: 'redis', x: 380, y: 80, w: 160, h: 80, shape: 'db', label: 'Redis', sub: 'quantity key' },
    { id: 'mysql', x: 380, y: 225, w: 160, h: 80, shape: 'db', label: 'MySQL', sub: 'inventory ledger' },
  ],
  edges: [
    { from: 'buyer', to: 'redis', label: 'DECR' },
    { from: 'buyer', to: 'mysql', label: 'claim' },
  ],
  steps: [
    { caption: 'A buyer reaches checkout. Each item has one quantity key in Redis. Reserving a unit runs DECR on that key. Releasing runs INCR.', packets: [{ from: 'buyer', to: 'redis', label: 'DECR' }], active: ['redis'], tones: { redis: 'ok' } },
    { caption: 'Claiming the unit at purchase must update MySQL and clean up Redis. The post says those two operations could not be wrapped in one atomic step.', packets: [{ from: 'buyer', to: 'mysql', label: 'claim' }], active: ['mysql'] },
    {
      caption: 'Two stores means two sources of truth. Our reading: a failure between the two writes leaves Redis and the ledger disagreeing. Redis also had no notion of multiple locations and needed its own cluster.',
      tones: { redis: 'warn', mysql: 'warn' },
      notes: [{ x: 380, y: 160, text: 'not atomic', anchor: 'middle', tone: 'bad' }],
    },
  ],
};

const after: CompareVariant = {
  id: 'after',
  label: 'After',
  nodes: [
    { id: 'a', x: 80, y: 90, w: 110, h: 56, label: 'Buyer A' },
    { id: 'b', x: 80, y: 220, w: 110, h: 56, label: 'Buyer B' },
    { id: 'pool', x: 400, y: 90, w: 190, h: 80, shape: 'db', label: 'Pool of rows', sub: 'at most 1,000' },
    { id: 'ledger', x: 400, y: 225, w: 190, h: 80, shape: 'db', label: 'Inventory ledger', sub: 'same MySQL' },
  ],
  edges: [
    { from: 'a', to: 'pool' },
    { from: 'b', to: 'pool' },
    { from: 'ledger', to: 'pool', label: 'refill', dashed: true, labelAt: [40, 0] },
  ],
  steps: [
    { caption: 'Stock is a row per unit, in a bounded pool. Buyer A starts a transaction and locks one available row.', packets: [{ from: 'a', to: 'pool', label: 'lock row 17' }], active: ['pool'], tones: { a: 'ok' } },
    { caption: 'Buyer B runs the same query with SKIP LOCKED. MySQL skips row 17 and returns another row. B does not queue behind A.', packets: [{ from: 'b', to: 'pool', label: 'row 18' }], active: ['pool'], tones: { a: 'ok', b: 'ok' } },
    {
      caption: 'If the pool runs dry, the reserve path triggers a refill from the ledger. A lock lets only one transaction refill at a time. Other reserves wait for it.',
      packets: [{ from: 'ledger', to: 'pool', label: 'refill' }],
      active: ['ledger'],
      tones: { pool: 'warn' },
    },
    {
      caption: 'Reserve and ledger live in one database, so one ACID transaction covers both. The cap keeps the pool small: 50,000 units over 10 locations would otherwise be 500,000 rows.',
      tones: { pool: 'ok', ledger: 'ok' },
      active: ['pool', 'ledger'],
    },
  ],
};

export default function ShopifyCompare() {
  return (
    <DesignCompare
      title="Shopify inventory reservations"
      prompt="Design:"
      variants={[before, after]}
      height={310}
      label="Before, reservations were Redis counters beside a MySQL ledger. After, reservations are rows in a bounded pool in MySQL, claimed with SKIP LOCKED in one transaction with the ledger."
    />
  );
}

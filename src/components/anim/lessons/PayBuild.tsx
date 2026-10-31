import DesignBuild, { type BuildEdge, type BuildGroup, type BuildNode, type BuildStep } from '../DesignBuild';

const nodes: BuildNode[] = [
  { id: 'merchant', x: 55, y: 200, w: 90, h: 56, label: 'Merchant', step: 0 },
  { id: 'api', x: 210, y: 200, w: 120, h: 60, label: 'Payment API', step: 0 },
  { id: 'pay', x: 385, y: 105, w: 110, h: 70, label: 'Payments', shape: 'db', step: 0 },
  { id: 'idem', x: 210, y: 80, w: 210, h: 56, label: 'Idempotency store', step: 1 },
  { id: 'adapter', x: 530, y: 200, w: 110, h: 56, label: 'PSP adapter', step: 2 },
  { id: 'psp', x: 665, y: 200, w: 80, h: 56, label: 'PSP', shape: 'dashed', step: 2 },
  { id: 'ledger', x: 385, y: 295, w: 110, h: 70, label: 'Ledger', shape: 'db', step: 3 },
  { id: 'hook', x: 530, y: 345, w: 120, h: 56, label: 'Webhooks', step: 4 },
  { id: 'recon', x: 210, y: 345, w: 130, h: 56, label: 'Reconciler', step: 5 },
];

const edges: BuildEdge[] = [
  { from: 'merchant', to: 'api', step: 0 },
  { from: 'api', to: 'pay', step: 0 },
  { from: 'api', to: 'idem', step: 1 },
  { from: 'api', to: 'adapter', step: 2 },
  { from: 'adapter', to: 'psp', step: 2 },
  { from: 'api', to: 'ledger', step: 3 },
  { from: 'psp', to: 'hook', step: 4, bend: 40 },
  { from: 'hook', to: 'pay', step: 4 },
  { from: 'recon', to: 'ledger', step: 5 },
];

const groups: BuildGroup[] = [{ x: 320, y: 48, w: 130, h: 300, label: 'One transaction', step: 3 }];

const steps: BuildStep[] = [
  {
    req: 'FR1: start a payment',
    caption: 'The merchant asks to charge an amount. The payment API writes a row with status pending before it does anything else. Money is stored as an integer count of the smallest unit (cents) plus a currency, never as a float.',
    packets: [{ from: 'merchant', to: 'api', label: 'POST' }, { from: 'api', to: 'pay', label: 'pending', delay: 0.9 }],
  },
  {
    req: 'NFR: never charge twice',
    caption: 'The request carries an idempotency key (the Idempotency lesson). The API saves key and response. A retry with the same key gets the saved response and does not start a second charge.',
    packets: [{ from: 'api', to: 'idem', label: 'key seen?' }],
  },
  {
    req: 'FR2: pay by card',
    caption: 'The card number goes from the browser straight to the payment service provider (PSP), such as Stripe. We only hold a token. The adapter calls the PSP charge API with the same idempotency key, so a retry cannot double-charge there either.',
    packets: [{ from: 'api', to: 'adapter', label: 'charge' }, { from: 'adapter', to: 'psp', label: 'key K', delay: 0.9 }],
  },
  {
    req: 'NFR: every cent is auditable',
    caption: 'A state change writes ledger rows in the same database transaction. A ledger is an add-only list of money movements, and the debits and credits of each payment add up to the same total as the payment row (the Transactions and Isolation lesson). Either both commit or neither does. A balance is the sum of its rows, never a number edited in place.',
    packets: [{ from: 'api', to: 'ledger', label: 'entries' }],
  },
  {
    req: 'FR3: merchant sees the status',
    caption: 'The PSP reports the final result with a webhook, a call from the PSP to us. The handler checks the signature, drops an event id it has seen, applies a forward-only state change, and answers 200 fast. The merchant reads the status from our table.',
    packets: [{ from: 'psp', to: 'hook', label: 'event' }, { from: 'hook', to: 'pay', label: 'succeeded', delay: 0.9 }],
  },
  {
    req: 'NFR: the books are exact',
    caption: 'A daily job compares the PSP settlement report with our ledger and flags every mismatch. Webhooks can be lost and code has bugs, so this is the last line of defense.',
    packets: [{ from: 'recon', to: 'ledger', label: 'vs PSP report' }],
  },
];

export default function PayBuild() {
  return (
    <DesignBuild
      title="Payment system, built requirement by requirement"
      nodes={nodes}
      edges={edges}
      groups={groups}
      steps={steps}
      height={400}
      label="High-level design of a payment system that grows from a merchant, a payment API, and a payments table to include an idempotency store, a PSP adapter and the PSP, a ledger in the same transaction, a webhook receiver, and a reconciler."
    />
  );
}

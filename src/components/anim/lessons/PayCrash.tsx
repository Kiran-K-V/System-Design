import { DesignCompare, type CompareVariant } from '../DesignBuild';

const nodes: CompareVariant['nodes'] = [
  { id: 'svc', x: 115, y: 170, w: 150, h: 64, label: 'Payment service' },
  { id: 'psp', x: 400, y: 80, w: 100, h: 60, label: 'PSP', shape: 'dashed' },
  { id: 'db', x: 400, y: 260, w: 150, h: 80, label: 'Payments DB', shape: 'db' },
];
const edges: CompareVariant['edges'] = [
  { from: 'svc', to: 'psp' },
  { from: 'svc', to: 'db' },
];

const naive: CompareVariant = {
  id: 'naive',
  label: 'Naive: charge, then record',
  nodes,
  edges: [{ from: 'svc', to: 'psp' }, { from: 'svc', to: 'db' }],
  steps: [
    { caption: 'The service charges the PSP first. It plans to write the payment row after the PSP answers.', packets: [{ from: 'svc', to: 'psp', label: 'charge' }], active: ['svc'] },
    { caption: 'The PSP charges the card. The customer is now out of money. Our database knows nothing about it.', tones: { psp: 'ok' }, notes: [{ x: 470, y: 86, text: 'card charges: 1', tone: 'ok' }] },
    { caption: 'The service crashes before the database write. The response was lost. No row exists.', tones: { svc: 'bad', psp: 'ok' }, notes: [{ x: 470, y: 86, text: 'card charges: 1', tone: 'ok' }] },
    { caption: 'The merchant sees a timeout and retries. The service has no record, so it charges again. The customer pays twice, and there is no row for either charge.', packets: [{ from: 'svc', to: 'psp', label: 'charge', tone: 'bad' }], tones: { svc: 'warn', psp: 'bad', db: 'bad' }, notes: [{ x: 470, y: 86, text: 'card charges: 2', tone: 'bad' }] },
  ],
};

const safe: CompareVariant = {
  id: 'safe',
  label: 'Better: pending first, same key',
  nodes,
  edges,
  steps: [
    { caption: 'The service first writes a payment row with status pending and a fresh idempotency key K. The row exists before any money moves.', packets: [{ from: 'svc', to: 'db', label: 'pending, K' }], tones: { db: 'warn' } },
    { caption: 'The service calls the PSP with key K. The PSP charges the card once and remembers K.', packets: [{ from: 'svc', to: 'psp', label: 'charge, K' }], tones: { psp: 'ok' }, notes: [{ x: 470, y: 86, text: 'card charges: 1', tone: 'ok' }] },
    { caption: 'The service crashes before it updates the row. The row still says pending, so we know a charge may have happened.', tones: { svc: 'bad', psp: 'ok', db: 'warn' }, notes: [{ x: 470, y: 86, text: 'card charges: 1', tone: 'ok' }] },
    { caption: 'On retry, or when a recovery job finds the old pending row, the service sends the same call with the same key K. The PSP does not charge again. It returns the result of the first call.', packets: [{ from: 'svc', to: 'psp', label: 'charge, K' }, { from: 'psp', to: 'svc', label: 'same result', tone: 'ok', delay: 0.9 }], tones: { svc: 'ok', psp: 'ok', db: 'warn' }, notes: [{ x: 470, y: 86, text: 'card charges: 1', tone: 'ok' }] },
    { caption: 'The service marks the row succeeded and writes the ledger entries in one transaction. Whatever the crash point, the customer is charged once and we have a record. A webhook with the result can confirm it later.', packets: [{ from: 'svc', to: 'db', label: 'succeeded' }], tones: { svc: 'ok', psp: 'ok', db: 'ok' }, notes: [{ x: 470, y: 86, text: 'card charges: 1', tone: 'ok' }] },
  ],
};

export default function PayCrash() {
  return (
    <DesignCompare
      title="A crash after the PSP call"
      prompt="Order of work:"
      variants={[naive, safe]}
      height={300}
      label="Two designs for a payment service that crashes after calling the PSP. Charging first double-charges on retry. Writing a pending row first and reusing one idempotency key charges once."
    />
  );
}

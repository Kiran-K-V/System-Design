import AnimFrame from '../AnimFrame';
import FlowDiagram, { type FlowEdge, type FlowNode, type FlowPacket, type Tone } from '../FlowDiagram';

interface Step {
  caption: string;
  active: string[];
  packets: FlowPacket[];
  order: string;
  pay: string;
  inv: string;
  tones?: Partial<Record<'order' | 'pay' | 'inv', Tone>>;
  note?: string;
}

const steps: Step[] = [
  { caption: 'An order needs three things: an order record, a card charge, and a stock reservation. Each belongs to its own service, and each service owns its own database. One database transaction cannot span all three. A saga runs three local transactions, one per service, linked by events.', active: [], packets: [], order: 'no order', pay: 'no charge', inv: 'stock: 1 left' },
  { caption: 'Step 1. Order writes the row as PENDING in its own transaction. It then publishes "order created". The order is not final yet.', active: ['order'], packets: [{ from: 'order', to: 'pay' }], order: 'PENDING', pay: 'no charge', inv: 'stock: 1 left' },
  { caption: 'Step 2. Payment charges the card and commits its own transaction. It publishes "payment done". That charge is real money and it is already committed. No lock is held.', active: ['pay'], packets: [{ from: 'pay', to: 'inv' }], order: 'PENDING', pay: 'charged $40', inv: 'stock: 1 left', tones: { pay: 'ok' } },
  { caption: 'Step 3 fails. Inventory finds that another order took the last item. Its local transaction aborts. Nothing rolls back by itself, because steps 1 and 2 are committed in other databases.', active: ['inv'], packets: [], order: 'PENDING', pay: 'charged $40', inv: 'out of stock', tones: { pay: 'ok', inv: 'bad' }, note: 'For now, an order is PENDING with money taken. Readers can see this middle state.' },
  { caption: 'Inventory publishes "stock failed". The saga now runs backwards. Each earlier step needs a compensating action that undoes its effect in business terms.', active: ['inv'], packets: [{ from: 'inv', to: 'pay', tone: 'bad' }], order: 'PENDING', pay: 'charged $40', inv: 'out of stock', tones: { pay: 'ok', inv: 'bad' } },
  { caption: 'Payment runs its compensation: a refund. It is a new transaction, not an erase of the old one. The charge stays in the history, followed by a refund. The refund must be safe to retry (the Idempotency lesson).', active: ['pay'], packets: [], order: 'PENDING', pay: 'refunded $40', inv: 'out of stock', tones: { pay: 'warn', inv: 'bad' } },
  { caption: 'Payment publishes "payment refunded". Order receives it and runs its own compensation.', active: ['pay'], packets: [{ from: 'pay', to: 'order', tone: 'warn' }], order: 'PENDING', pay: 'refunded $40', inv: 'out of stock', tones: { pay: 'warn', inv: 'bad' } },
  { caption: 'Order marks the row CANCELLED. The saga ended in a consistent state: no order, no net charge, no stock taken. The price is that the system was briefly inconsistent, and that someone had to write the refund and cancel code.', active: ['order'], packets: [], order: 'CANCELLED', pay: 'refunded $40', inv: 'out of stock', tones: { order: 'ok', pay: 'muted', inv: 'muted' } },
];

const EDGES: FlowEdge[] = [
  { from: 'order', to: 'pay', head: 'both' },
  { from: 'pay', to: 'inv', head: 'both' },
];

export default function MultiStepSaga() {
  return (
    <AnimFrame title="A saga: step 3 fails and the earlier steps are compensated" steps={steps} interval={5200}>
      {(i, s) => {
        const nodes: FlowNode[] = [
          { id: 'order', x: 85, y: 80, w: 140, h: 70, label: 'Order', sub: s.order, tone: s.tones?.order },
          { id: 'pay', x: 360, y: 80, w: 140, h: 70, label: 'Payment', sub: s.pay, tone: s.tones?.pay },
          { id: 'inv', x: 635, y: 80, w: 140, h: 70, label: 'Inventory', sub: s.inv, tone: s.tones?.inv },
        ];
        return (
          <FlowDiagram
            width={720}
            height={s.note ? 190 : 160}
            nodes={nodes}
            edges={EDGES}
            notes={s.note ? [{ x: 360, y: 160, text: s.note, anchor: 'middle', tone: 'warn' }] : undefined}
            packets={s.packets}
            active={s.active}
            stepKey={i}
            label="Order, payment, and inventory services each commit a local transaction. Inventory fails, and payment and order run compensating actions."
          />
        );
      }}
    </AnimFrame>
  );
}

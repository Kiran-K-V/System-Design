import AnimFrame from '../AnimFrame';
import FlowDiagram, { type FlowEdge, type FlowNode, type FlowPacket, type Tone } from '../FlowDiagram';

/**
 * mode "dual": the app writes to the database and then to the broker. A crash between the two loses the event.
 * mode "outbox": the app writes the order and an outbox row in one transaction. A relay publishes the row later.
 */

type Mode = 'dual' | 'outbox';

interface Step {
  caption: string;
  active: string[];
  packets: FlowPacket[];
  db: string;
  extra?: string;
  tones?: Partial<Record<string, Tone>>;
  relay?: string;
  broker?: string;
}

const DUAL: Step[] = [
  { caption: 'The app takes an order. Two things must happen: save the order in the database, and tell the rest of the system with an "order placed" event on a broker.', active: ['app'], packets: [], db: 'no order', broker: 'empty' },
  { caption: 'Step 1: the app commits the order to the database. The order is now real and durable.', active: ['app', 'db'], packets: [{ from: 'app', to: 'db', label: 'order 7' }], db: 'order 7', broker: 'empty' },
  { caption: 'The app process crashes right here, before step 2. The database and the broker are two separate systems, and no transaction covers both.', active: ['app'], packets: [], db: 'order 7', broker: 'empty', tones: { app: 'bad' } },
  { caption: 'The event was never sent. Order 7 exists. No email goes out, no stock is reserved, and no log shows a problem. Swapping the order of the steps only moves the failure: a published event for an order that never committed. Retrying does not help once the process is gone.', active: ['broker'], packets: [], db: 'order 7', broker: 'no event', tones: { app: 'bad', broker: 'bad' } },
];

const OUTBOX: Step[] = [
  { caption: 'The app takes an order. This time the database has two tables: orders and outbox. The outbox holds events that still need to be sent.', active: ['app'], packets: [], db: 'empty', relay: 'idle', broker: 'empty' },
  { caption: 'One transaction inserts the order row and an outbox row "order placed" together. Both are in the same database, so one commit covers both. If the app crashes before the commit, neither row exists.', active: ['app', 'db'], packets: [{ from: 'app', to: 'db', label: 'order+event' }], db: 'order 7 + event', relay: 'idle', broker: 'empty' },
  { caption: 'The relay finds the new outbox row. It can poll the table, or tail the database log with change data capture (lesson 6.5). The event exists if and only if the order does.', active: ['relay'], packets: [{ from: 'db', to: 'relay', label: 'event 7' }], db: 'order 7 + event', relay: 'read event 7', broker: 'empty' },
  { caption: 'The relay publishes event 7 to the broker. Even if the broker is down, the row waits in the table and the relay retries. No event is lost.', active: ['broker'], packets: [{ from: 'relay', to: 'broker', label: 'event 7' }], db: 'order 7 + event', relay: 'sent event 7', broker: 'event 7' },
  { caption: 'The relay crashes before it marks the row as sent. On restart it sends event 7 again. The broker holds it twice. So the outbox is at-least-once, and consumers must be idempotent, for example by the event id (lesson 6.3). Old outbox rows also need a cleanup job.', active: ['relay', 'broker'], packets: [{ from: 'relay', to: 'broker', label: 'event 7' }], db: 'order 7 + event', relay: 'sent twice', broker: 'event 7 twice', tones: { relay: 'warn', broker: 'warn' } },
];

export default function AsyncOutboxWalk({ mode }: { mode: Mode }) {
  const script = mode === 'dual' ? DUAL : OUTBOX;
  const edges: FlowEdge[] =
    mode === 'dual'
      ? [{ from: 'app', to: 'db', label: '1' }, { from: 'app', to: 'broker', label: '2' }]
      : [{ from: 'app', to: 'db' }, { from: 'db', to: 'relay' }, { from: 'relay', to: 'broker' }];
  return (
    <AnimFrame title={mode === 'dual' ? 'Dual write: a crash between two writes' : 'Outbox: one transaction, then a relay'} steps={script} interval={4200}>
      {(i, s) => {
        const nodes: FlowNode[] =
          mode === 'dual'
            ? [
                { id: 'app', x: 110, y: 120, w: 130, h: 60, label: 'App', tone: s.tones?.app },
                { id: 'db', x: 430, y: 52, w: 160, h: 80, shape: 'db', label: 'Database', sub: s.db },
                { id: 'broker', x: 430, y: 196, w: 160, h: 60, label: 'Broker', sub: s.broker, tone: s.tones?.broker },
              ]
            : [
                { id: 'app', x: 76, y: 100, w: 104, h: 60, label: 'App' },
                { id: 'db', x: 258, y: 100, w: 150, h: 84, shape: 'db', label: 'Database', sub: s.db },
                { id: 'relay', x: 454, y: 100, w: 112, h: 60, label: 'Relay', sub: s.relay, tone: s.tones?.relay },
                { id: 'broker', x: 636, y: 100, w: 112, h: 60, label: 'Broker', sub: s.broker, tone: s.tones?.broker },
              ];
        return <FlowDiagram width={720} height={mode === 'dual' ? 250 : 200} nodes={nodes} edges={edges} active={s.active} packets={s.packets} stepKey={i} label={mode === 'dual' ? 'An app writes to a database and then a broker. A crash between them loses the event.' : 'An app writes an order and an outbox row in one transaction. A relay publishes the outbox row to a broker.'} />;
      }}
    </AnimFrame>
  );
}

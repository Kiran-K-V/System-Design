import DesignBuild, { type BuildEdge, type BuildNode, type BuildStep } from '../DesignBuild';

const nodes: BuildNode[] = [
  { id: 'feed', x: 70, y: 70, w: 100, h: 60, label: 'Market\nfeed', step: 0 },
  { id: 'cons', x: 210, y: 70, w: 100, h: 60, label: 'Feed\nreader', step: 0 },
  { id: 'cache', x: 210, y: 190, w: 100, h: 70, label: 'Quote\ncache', shape: 'db', step: 0 },
  { id: 'topics', x: 360, y: 70, w: 100, h: 60, label: 'Channel\nper stock', step: 1 },
  { id: 'gate', x: 505, y: 70, w: 100, h: 60, label: 'Push\ngateway', step: 1 },
  { id: 'app', x: 650, y: 70, w: 80, h: 56, label: 'App', step: 1 },
  { id: 'order', x: 505, y: 250, w: 100, h: 60, label: 'Order\nservice', step: 2 },
  { id: 'db', x: 340, y: 250, w: 110, h: 80, label: 'Orders,\nholds', shape: 'db', step: 2 },
  { id: 'xgw', x: 505, y: 380, w: 110, h: 60, label: 'Exchange\ngateway', step: 3 },
  { id: 'ex', x: 650, y: 380, w: 90, h: 56, label: 'Exchange', step: 3 },
  { id: 'fill', x: 340, y: 380, w: 100, h: 60, label: 'Fill\nprocessor', step: 4 },
  { id: 'audit', x: 150, y: 345, w: 100, h: 70, label: 'Audit\nlog', shape: 'db', step: 5 },
];

const edges: BuildEdge[] = [
  { from: 'feed', to: 'cons', step: 0 },
  { from: 'cons', to: 'cache', step: 0 },
  { from: 'cons', to: 'topics', step: 1 },
  { from: 'topics', to: 'gate', step: 1 },
  { from: 'gate', to: 'app', step: 1 },
  { from: 'app', to: 'order', step: 2 },
  { from: 'order', to: 'db', step: 2 },
  { from: 'order', to: 'xgw', step: 3 },
  { from: 'xgw', to: 'ex', step: 3, head: 'both' },
  { from: 'xgw', to: 'fill', step: 4 },
  { from: 'fill', to: 'db', step: 4 },
  { from: 'db', to: 'audit', step: 5 },
];

const steps: BuildStep[] = [
  {
    req: 'FR1: see live prices',
    caption: 'A feed reader takes the exchange trade feed and keeps the latest price of each symbol in a cache. A plain request for one quote reads the cache. Nothing is stored per tick.',
    packets: [{ from: 'feed', to: 'cons' }, { from: 'cons', to: 'cache', delay: 0.5 }],
  },
  {
    req: 'FR1: push, do not poll',
    caption: 'Each stock symbol gets its own channel. A push gateway holds the app sessions and sends a symbol only to sessions that watch it, at most once per second. This is the pattern of the Real-time Updates lesson, applied to prices.',
    packets: [{ from: 'cons', to: 'topics' }, { from: 'topics', to: 'gate', delay: 0.5 }, { from: 'gate', to: 'app', delay: 1 }],
  },
  {
    req: 'FR2: place an order',
    caption: 'The order service checks the request and then does one database transaction. It places a hold on buying power and stores the order as new. Only then does it go further. The deep dive shows why the hold comes first.',
    packets: [{ from: 'app', to: 'order' }, { from: 'order', to: 'db', delay: 0.5 }],
  },
  {
    req: 'FR2: reach the exchange',
    caption: 'A gateway is the only part that talks to the exchange. It sends the order and receives acknowledgements and fills. It keeps the exchange order id on the order, so a retry can look before it resends.',
    packets: [{ from: 'order', to: 'xgw' }, { from: 'xgw', to: 'ex', delay: 0.5 }],
  },
  {
    req: 'FR3: show order status',
    caption: 'Fills arrive later, out of our control. A fill processor applies each one to the order state, the position, and the cash, in one transaction. The app reads the state from the same database.',
    packets: [{ from: 'xgw', to: 'fill' }, { from: 'fill', to: 'db', delay: 0.5 }],
  },
  {
    req: 'NFR: full history',
    caption: 'Every state change is also appended to an audit log that nobody edits. When a customer asks what happened to an order, the log answers.',
  },
];

export default function RobinhoodBuild() {
  return (
    <DesignBuild
      title="Trading app, built requirement by requirement"
      nodes={nodes}
      edges={edges}
      steps={steps}
      height={440}
      label="High-level design of a trading app: a feed reader, quote cache, symbol topics and push gateway for prices, and an order service, orders database, exchange gateway, fill processor and audit log for orders."
    />
  );
}

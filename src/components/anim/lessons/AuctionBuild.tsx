import DesignBuild, { type BuildEdge, type BuildNode, type BuildStep } from '../DesignBuild';

const nodes: BuildNode[] = [
  { id: 'seller', x: 55, y: 80, w: 90, h: 56, label: 'Seller', step: 0 },
  { id: 'svc', x: 215, y: 200, w: 140, h: 60, label: 'Auction service', step: 0 },
  { id: 'db', x: 400, y: 100, w: 130, h: 70, label: 'Auctions', shape: 'db', step: 0 },
  { id: 'bidder', x: 55, y: 200, w: 90, h: 56, label: 'Bidder', step: 1 },
  { id: 'bidlog', x: 400, y: 215, w: 130, h: 70, label: 'Bid log', shape: 'db', step: 2 },
  { id: 'viewer', x: 55, y: 330, w: 90, h: 56, label: 'Viewer', step: 3 },
  { id: 'pubsub', x: 410, y: 330, w: 140, h: 56, label: 'Pub/sub', sub: 'channel per auction', step: 4 },
  { id: 'gw', x: 215, y: 340, w: 140, h: 60, label: 'Gateway', sub: 'WebSockets', step: 4 },
  { id: 'timer', x: 590, y: 100, w: 130, h: 60, label: 'End timer', sub: 'delay queue', step: 5 },
];

const edges: BuildEdge[] = [
  { from: 'seller', to: 'svc', step: 0 },
  { from: 'svc', to: 'db', step: 0 },
  { from: 'bidder', to: 'svc', step: 1 },
  { from: 'svc', to: 'bidlog', step: 2 },
  { from: 'viewer', to: 'svc', step: 3, bend: -30 },
  { from: 'svc', to: 'pubsub', step: 4, bend: -30 },
  { from: 'pubsub', to: 'gw', step: 4 },
  { from: 'gw', to: 'viewer', step: 4 },
  { from: 'timer', to: 'db', step: 5 },
];

const steps: BuildStep[] = [
  {
    req: 'FR1: post an item',
    caption: 'A seller posts an item with a start price and an end time. The auction service writes one row to the auctions table. The row also holds the current highest bid and a status.',
    packets: [{ from: 'seller', to: 'svc', label: 'create' }, { from: 'svc', to: 'db', label: 'row', delay: 0.9 }],
  },
  {
    req: 'FR2: place a higher bid',
    caption: 'A bid is a conditional update on the auction row: change the highest bid only if the new amount is higher and the auction is open. The database decides who wins when two bids race. Deep dive below.',
    packets: [{ from: 'bidder', to: 'svc', label: 'bid 120' }, { from: 'svc', to: 'db', label: 'if higher', delay: 0.9 }],
  },
  {
    req: 'NFR: no accepted bid is lost',
    caption: 'Each accepted bid is also appended to a bid log, in the same transaction (lesson 4.4). The auction row keeps only the latest bid. The log keeps all of them, so the history is complete and a dispute can be settled.',
    packets: [{ from: 'svc', to: 'bidlog', label: 'append' }],
  },
  {
    req: 'FR3: view an auction',
    caption: 'A viewer asks for the auction and gets the current highest bid. Reads are far more common than bids, so this path can use a replica or a short cache (lessons 4.6 and 5.3) when a few seconds of lag is acceptable.',
    packets: [{ from: 'viewer', to: 'svc', label: 'GET' }],
  },
  {
    req: 'NFR: new bid shown within ~1 s',
    caption: 'After a bid is accepted, the service publishes it to a channel for that auction. Gateway servers hold the viewers WebSockets and push the new bid out (lesson 9.3). No viewer has to poll.',
    packets: [{ from: 'svc', to: 'pubsub', label: 'new high' }, { from: 'pubsub', to: 'gw', label: 'push', delay: 0.9 }, { from: 'gw', to: 'viewer', label: '120', delay: 1.8 }],
  },
  {
    req: 'FR1: the auction must end',
    caption: 'When an auction is created, the service also schedules a close event for its end time. The server clock decides, never the phone. When the event fires, the timer closes the auction with a conditional update.',
    packets: [{ from: 'timer', to: 'db', label: 'close' }],
  },
];

export default function AuctionBuild() {
  return (
    <DesignBuild
      title="Online auction, built requirement by requirement"
      nodes={nodes}
      edges={edges}
      steps={steps}
      height={400}
      label="High-level design of an online auction that grows from a seller, an auction service, and an auctions table to include bidders, a bid log, viewers, a pub/sub channel and WebSocket gateway, and an end timer."
    />
  );
}

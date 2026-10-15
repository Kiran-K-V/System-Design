import { DesignCompare, type CompareVariant, } from '../DesignBuild';

const nodes: CompareVariant['nodes'] = [
  { id: 'a', x: 70, y: 90, w: 110, h: 56, label: 'Bidder A', sub: 'bids 101' },
  { id: 'b', x: 70, y: 250, w: 110, h: 56, label: 'Bidder B', sub: 'bids 102' },
  { id: 'svc', x: 300, y: 170, w: 140, h: 60, label: 'Bid service' },
  { id: 'db', x: 560, y: 170, w: 140, h: 80, label: 'Auction row', shape: 'db' },
];
const edges: CompareVariant['edges'] = [
  { from: 'a', to: 'svc' },
  { from: 'b', to: 'svc' },
  { from: 'svc', to: 'db' },
];

const naive: CompareVariant = {
  id: 'naive',
  label: 'Naive: read, compare, write',
  nodes,
  edges,
  steps: [
    { caption: 'The auction row says highest = 100. The service handles a bid in three separate steps: read the row, compare in code, write the new value.', active: ['svc'], notes: [{ x: 500, y: 250, text: 'row: highest = 100', size: 14 }] },
    { caption: 'A bids 101 and B bids 102 at nearly the same moment. Two service threads each read highest = 100. Both see that their bid is higher.', packets: [{ from: 'svc', to: 'db', label: 'read 100' }], tones: { a: 'warn', b: 'warn' }, notes: [{ x: 500, y: 250, text: 'row: highest = 100', size: 14 }] },
    { caption: 'B writes 102 first. Then A writes 101. A write does not check what is there now, so it overwrites 102 with 101.', packets: [{ from: 'svc', to: 'db', label: '102', tone: 'ok' }, { from: 'svc', to: 'db', label: '101', tone: 'bad', delay: 0.9 }], tones: { db: 'bad' }, notes: [{ x: 500, y: 250, text: 'row: highest = 101', size: 14, tone: 'bad' }] },
    { caption: 'Both bidders were told "accepted". The row says 101. B holds an accepted bid of 102 that is not the highest. The auction can now sell for less than a bid it accepted.', tones: { a: 'warn', b: 'bad', db: 'bad' }, notes: [{ x: 500, y: 250, text: 'row: highest = 101', size: 14, tone: 'bad' }] },
  ],
};

const cas: CompareVariant = {
  id: 'cas',
  label: 'Better: conditional update',
  nodes,
  edges,
  steps: [
    { caption: 'The service sends one statement: UPDATE auctions SET highest = :amount WHERE id = :id AND highest < :amount AND status = open. The check and the write are one atomic step inside the database.', active: ['db'], notes: [{ x: 500, y: 250, text: 'row: highest = 100', size: 14 }] },
    { caption: 'B arrives first. The row says 100 and 102 is higher, so one row changes. The row now says 102.', packets: [{ from: 'b', to: 'svc', label: '102' }, { from: 'svc', to: 'db', label: 'if > 100', delay: 0.9 }], tones: { b: 'ok', db: 'ok' }, notes: [{ x: 500, y: 250, text: 'row: highest = 102', size: 14, tone: 'ok' }] },
    { caption: 'A arrives second with 101. The condition highest < 101 is now false because the row says 102. The statement changes 0 rows.', packets: [{ from: 'a', to: 'svc', label: '101' }, { from: 'svc', to: 'db', label: 'if > 102', tone: 'bad', delay: 0.9 }], tones: { a: 'bad', b: 'ok', db: 'ok' }, notes: [{ x: 500, y: 250, text: 'row: highest = 102', size: 14, tone: 'ok' }] },
    { caption: 'The service sees 0 rows and answers A with 409 "outbid", with the current high so A can bid again. No lock was held across a network call, and no bid was both accepted and lost.', tones: { a: 'warn', b: 'ok', db: 'ok' }, notes: [{ x: 500, y: 250, text: 'row: highest = 102', size: 14, tone: 'ok' }] },
  ],
};

export default function AuctionRace() {
  return (
    <DesignCompare
      title="Two bids at the same moment"
      prompt="Bid handling:"
      variants={[naive, cas]}
      height={330}
      label="Two designs for handling simultaneous bids. Read, compare, write lets a lower bid overwrite a higher one. A conditional update rejects the lower bid."
    />
  );
}

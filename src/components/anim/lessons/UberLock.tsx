import { DesignCompare, type CompareVariant } from '../DesignBuild';

const W = 120;
const H = 56;

const naive: CompareVariant = {
  id: 'naive',
  label: 'Naive: read status, then write',
  nodes: [
    { id: 'a', x: 80, y: 80, w: W, h: H, label: 'Matcher A' },
    { id: 'b', x: 80, y: 220, w: W, h: H, label: 'Matcher B' },
    { id: 'row', x: 330, y: 150, w: 130, h: 90, shape: 'db', label: 'Driver 17', sub: 'status: free' },
    { id: 'app', x: 590, y: 80, w: W, h: H, label: 'Driver app' },
  ],
  edges: [
    { from: 'a', to: 'row' },
    { from: 'b', to: 'row' },
    { from: 'a', to: 'app' },
    { from: 'b', to: 'app', bend: -40 },
  ],
  steps: [
    { caption: 'Two riders request rides at the same moment. Two matchers pick the same nearest driver.', active: ['a', 'b'] },
    {
      caption: 'Both read the driver row. Both see "free". The read and the later write are two separate steps, so nothing stops the second reader.',
      packets: [{ from: 'a', to: 'row', label: 'read' }, { from: 'b', to: 'row', label: 'read' }],
      active: ['row'],
    },
    {
      caption: 'Both write "offered" and both send an offer. The database accepted two valid writes. It cannot know they conflict.',
      packets: [{ from: 'a', to: 'app', label: 'offer' }, { from: 'b', to: 'app', label: 'offer' }],
      tones: { row: 'bad', app: 'bad' },
      active: ['app'],
    },
  ],
};

const better: CompareVariant = {
  id: 'better',
  label: 'Better: lock with a time limit',
  nodes: [
    { id: 'a', x: 80, y: 80, w: W, h: H, label: 'Matcher A' },
    { id: 'b', x: 80, y: 220, w: W, h: H, label: 'Matcher B' },
    { id: 'lock', x: 330, y: 150, w: 140, h: 90, shape: 'db', label: 'Lock', sub: 'driver:17, TTL 10 s' },
    { id: 'app', x: 590, y: 80, w: W, h: H, label: 'Driver app' },
    { id: 'next', x: 590, y: 220, w: W, h: H, label: 'Next driver' },
  ],
  edges: [
    { from: 'a', to: 'lock' },
    { from: 'b', to: 'lock' },
    { from: 'a', to: 'app' },
    { from: 'b', to: 'next' },
  ],
  steps: [
    { caption: 'The same two matchers pick the same driver. Each now tries to create one key, only if it does not exist (SET with NX and a 10 second expiry).', packets: [{ from: 'a', to: 'lock', label: 'SET NX' }, { from: 'b', to: 'lock', label: 'SET NX' }], active: ['lock'] },
    {
      caption: 'Redis runs one command at a time (lesson 8.2). One SET wins. The other fails right away. There is no gap between check and write.',
      tones: { a: 'ok', b: 'warn', lock: 'ok' },
      active: ['lock'],
    },
    {
      caption: 'Matcher A sends the offer. Matcher B moves on to the next nearest driver instead of waiting.',
      packets: [{ from: 'a', to: 'app', label: 'offer' }, { from: 'b', to: 'next', label: 'try', delay: 0.4 }],
      tones: { a: 'ok', b: 'warn' },
      active: ['app'],
    },
    {
      caption: 'Matcher A crashes before it sees an answer. The key has a time limit, so it expires in 10 seconds and driver 17 can be offered rides again. This is a lease: a lock that ends by itself.',
      tones: { a: 'bad', lock: 'muted' },
      active: ['lock'],
    },
  ],
};

export default function UberLock() {
  return <DesignCompare title="Driver assignment" prompt="Design:" variants={[naive, better]} height={290} label="Two matchers racing for one driver, with and without a time-limited lock" />;
}

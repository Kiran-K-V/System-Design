import DesignBuild, { type BuildEdge, type BuildNode, type BuildStep } from '../DesignBuild';

const nodes: BuildNode[] = [
  { id: 'client', x: 70, y: 190, w: 90, h: 56, label: 'Traveller', step: 0 },
  { id: 'avail', x: 270, y: 60, w: 150, h: 60, label: 'Availability\nservice', step: 0 },
  { id: 'inv', x: 520, y: 60, w: 130, h: 70, label: 'Leg inventory', shape: 'db', step: 0 },
  { id: 'book', x: 300, y: 190, w: 140, h: 56, label: 'Booking service', step: 1 },
  { id: 'wl', x: 520, y: 190, w: 120, h: 70, label: 'Waitlist', shape: 'db', step: 2 },
  { id: 'promo', x: 650, y: 115, w: 100, h: 56, label: 'Promoter', step: 3 },
  { id: 'chart', x: 650, y: 290, w: 90, h: 56, label: 'Chart\njob', step: 4 },
  { id: 'room', x: 100, y: 330, w: 130, h: 56, label: 'Admission\nqueue', step: 5 },
  { id: 'guard', x: 300, y: 330, w: 130, h: 56, label: 'Bot and\nlimit checks', step: 6 },
];

const edges: BuildEdge[] = [
  { from: 'client', to: 'avail', step: 0 },
  { from: 'avail', to: 'inv', step: 0 },
  { from: 'client', to: 'book', step: 1 },
  { from: 'book', to: 'inv', step: 1 },
  { from: 'book', to: 'wl', step: 2 },
  { from: 'promo', to: 'wl', step: 3 },
  { from: 'promo', to: 'inv', step: 3 },
  { from: 'chart', to: 'wl', step: 4 },
  { from: 'client', to: 'room', step: 5 },
  { from: 'room', to: 'guard', step: 6 },
  { from: 'guard', to: 'book', step: 6 },
];

const steps: BuildStep[] = [
  {
    req: 'FR1: see seats for a trip',
    caption: 'A traveller asks for seats from one station to another, on a date, in a class. The availability service reads the leg inventory: for each seat, which legs are free. A seat counts only if every leg of the trip is free. This path only reads, so a slightly old answer is fine.',
    packets: [{ from: 'client', to: 'avail' }, { from: 'avail', to: 'inv', delay: 0.5 }],
  },
  {
    req: 'FR2: book a trip',
    caption: 'Booking claims every leg of the trip on one seat, all or nothing, with a conditional write like the hold in the Ticketmaster lesson. The unit that is sold is a range of legs. The deep dive shows why.',
    packets: [{ from: 'client', to: 'book' }, { from: 'book', to: 'inv', delay: 0.5 }],
  },
  {
    req: 'FR2: no seat? waitlist',
    caption: 'When no seat is free on every leg, the booking joins a waitlist. Each entry keeps its trip and a number that fixes its place in line. The entry is a promise to move up if a seat appears.',
    packets: [{ from: 'book', to: 'wl' }],
  },
  {
    req: 'FR3: cancel and promote',
    caption: 'A cancellation frees legs. A promoter then picks the first waitlist entry that fits the freed legs and confirms it. Freeing the seat and confirming the entry are one atomic step, and the order is fixed.',
    packets: [{ from: 'promo', to: 'inv' }, { from: 'promo', to: 'wl', delay: 0.5 }],
  },
  {
    req: 'FR4: freeze the list',
    caption: 'Some hours before departure a chart job freezes the list of who travels. Waitlisted entries that never got a seat are dropped. After this point a cancel is a refund claim, not a promotion.',
    packets: [{ from: 'chart', to: 'wl' }],
  },
  {
    req: 'NFR: a fixed-time spike',
    caption: 'The opening time is public, so the crowd arrives at that second. An admission queue, the same idea as the waiting room in the flash sale lesson, lets people through at a rate booking can take.',
    packets: [{ from: 'client', to: 'room' }],
  },
  {
    req: 'NFR: bots and fairness',
    caption: 'Admitted requests pass checks before they reach booking: a verified account, a human check, and a cap per user. Scripts that open many sessions are the main threat on opening day.',
    packets: [{ from: 'room', to: 'guard' }, { from: 'guard', to: 'book', delay: 0.5 }],
  },
];

export default function IrctcBuild() {
  return (
    <DesignBuild
      title="Train booking, built requirement by requirement"
      nodes={nodes}
      edges={edges}
      steps={steps}
      height={400}
      label="A design that fits the requirements for train booking: availability service, leg inventory, booking service, waitlist, promoter, chart job, admission queue, and bot and limit checks."
    />
  );
}

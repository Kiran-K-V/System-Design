import DesignBuild, { type BuildEdge, type BuildNode, type BuildStep } from '../DesignBuild';

const nodes: BuildNode[] = [
  { id: 'users', x: 62, y: 200, w: 84, h: 56, label: 'Users', step: 0 },
  { id: 'cdn', x: 200, y: 200, w: 90, h: 60, label: 'CDN\ncache', step: 0 },
  { id: 'api', x: 350, y: 200, w: 100, h: 60, label: 'Sale\nAPI', step: 1 },
  { id: 'redis', x: 520, y: 80, w: 110, h: 70, label: 'Stock\ncounter', shape: 'db', step: 1 },
  { id: 'resv', x: 520, y: 200, w: 130, h: 70, label: 'Reservations', shape: 'db', step: 1 },
  { id: 'pay', x: 350, y: 335, w: 100, h: 56, label: 'Payment', step: 2 },
  { id: 'psp', x: 200, y: 335, w: 90, h: 60, label: 'Card\nbank', step: 2 },
  { id: 'orders', x: 520, y: 335, w: 110, h: 70, label: 'Orders', shape: 'db', step: 2 },
  { id: 'sweep', x: 350, y: 70, w: 100, h: 60, label: 'Expiry\nsweeper', step: 3 },
  { id: 'wait', x: 200, y: 70, w: 100, h: 60, label: 'Waiting\nroom', step: 4 },
  { id: 'recon', x: 660, y: 140, w: 96, h: 60, label: 'Counter\nchecker', step: 5 },
];

const edges: BuildEdge[] = [
  { from: 'users', to: 'cdn', step: 0 },
  { from: 'cdn', to: 'api', step: 1 },
  { from: 'api', to: 'redis', step: 1 },
  { from: 'api', to: 'resv', step: 1 },
  { from: 'users', to: 'pay', step: 2 },
  { from: 'pay', to: 'psp', step: 2 },
  { from: 'pay', to: 'orders', step: 2 },
  { from: 'pay', to: 'resv', step: 2 },
  { from: 'sweep', to: 'redis', step: 3 },
  { from: 'sweep', to: 'resv', step: 3 },
  { from: 'wait', to: 'api', step: 4 },
  { from: 'orders', to: 'recon', step: 5 },
  { from: 'recon', to: 'redis', step: 5 },
];

const steps: BuildStep[] = [
  {
    req: 'FR1: see item and stock',
    caption: 'The sale page is the same for everyone, so a CDN serves it (the CDN and Proxies lesson). A sold-out flag is cached for about a second. Millions of page views never reach our servers.',
    packets: [{ from: 'users', to: 'cdn' }],
  },
  {
    req: 'FR2: reserve one unit',
    caption: 'The stock lives in one counter in Redis, set to 10,000 before the sale. A reserve call subtracts 1 from it in one atomic step, which nothing can interrupt. If the result is zero or more, the user wins a unit and a reservation row is written with an expiry time. The deep dive shows why this must be one atomic step.',
    packets: [{ from: 'cdn', to: 'api' }, { from: 'api', to: 'redis', delay: 0.5 }, { from: 'api', to: 'resv', delay: 1 }],
  },
  {
    req: 'FR3: pay for it',
    caption: 'Payment takes seconds. No lock is held while it runs, because the reservation already holds the unit. On success, the service writes an order and marks the reservation paid.',
    packets: [{ from: 'users', to: 'pay' }, { from: 'pay', to: 'psp', delay: 0.5 }, { from: 'pay', to: 'orders', delay: 1 }],
  },
  {
    req: 'NFR: no permanent holds',
    caption: 'A sweeper finds reservations past their expiry. For each one it marks the row expired and adds 1 back to the counter. A unit abandoned at checkout goes back on sale.',
    packets: [{ from: 'sweep', to: 'resv' }, { from: 'sweep', to: 'redis', delay: 0.5 }],
  },
  {
    req: 'NFR: survive the burst',
    caption: 'A waiting room admits users to the Sale API at a fixed rate and gives each a signed token. Everyone else waits on a static page. The API and the counter see a rate we chose, not the rate the crowd chose.',
    packets: [{ from: 'wait', to: 'api' }],
  },
  {
    req: 'NFR: zero oversell',
    caption: 'Redis can lose its last writes after a failover. A checker job (a reconciler) counts paid orders and live reservations in the database, and sets the counter to stock minus that sum. The database is the record. The counter is a fast copy.',
    packets: [{ from: 'orders', to: 'recon' }, { from: 'recon', to: 'redis', delay: 0.5 }],
  },
];

export default function FlashSaleBuild() {
  return (
    <DesignBuild
      title="Flash sale, built requirement by requirement"
      nodes={nodes}
      edges={edges}
      steps={steps}
      height={480}
      label="High-level design of a flash sale: a CDN, a sale API with a Redis stock counter and reservation table, payment and orders, an expiry sweeper, a waiting room, and a reconciler."
    />
  );
}

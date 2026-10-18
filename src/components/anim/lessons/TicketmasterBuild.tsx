import DesignBuild, { type BuildEdge, type BuildNode, type BuildStep } from '../DesignBuild';

const nodes: BuildNode[] = [
  { id: 'client', x: 70, y: 170, w: 90, h: 56, label: 'Client', step: 0 },
  { id: 'evsvc', x: 270, y: 60, w: 140, h: 56, label: 'Event service', step: 0 },
  { id: 'evdb', x: 500, y: 60, w: 120, h: 70, label: 'Events DB', shape: 'db', step: 0 },
  { id: 'index', x: 500, y: 175, w: 120, h: 56, label: 'Search index', step: 1 },
  { id: 'cache', x: 270, y: 175, w: 100, h: 50, label: 'Cache', step: 2 },
  { id: 'room', x: 110, y: 310, w: 125, h: 50, label: 'Waiting room', step: 5 },
  { id: 'bsvc', x: 300, y: 310, w: 140, h: 56, label: 'Booking service', step: 3 },
  { id: 'seats', x: 500, y: 310, w: 120, h: 70, label: 'Seats DB', shape: 'db', step: 3 },
  { id: 'feed', x: 660, y: 175, w: 100, h: 50, label: 'Seat feed', step: 6 },
];

const edges: BuildEdge[] = [
  { from: 'client', to: 'evsvc', step: 0 },
  { from: 'evsvc', to: 'evdb', step: 0 },
  { from: 'evsvc', to: 'index', step: 1 },
  { from: 'evdb', to: 'index', step: 1, dashed: true, label: 'copies changes', labelAt: [30, 0] },
  { from: 'evsvc', to: 'cache', step: 2 },
  { from: 'client', to: 'bsvc', step: 3 },
  { from: 'bsvc', to: 'seats', step: 3 },
  { from: 'client', to: 'room', step: 5 },
  { from: 'room', to: 'bsvc', step: 5 },
  { from: 'seats', to: 'feed', step: 6 },
];

const steps: BuildStep[] = [
  {
    req: 'FR1: view events',
    caption: 'The simplest start. The event service reads event and venue data from a database. This path only reads, so staleness of a few seconds is fine.',
    packets: [{ from: 'client', to: 'evsvc' }],
  },
  {
    req: 'FR2: search events',
    caption: 'Search by name, city, or date needs a search index, a store built to find text fast (lesson 8.5). A feed of database changes copies each event change into it (lesson 6.5). The index can lag, because a new event can wait a moment.',
  },
  {
    req: 'NFR: reads outnumber writes',
    caption: 'Event pages and popular searches barely change, so a cache answers most of them (lesson 5.3). The booking path stays away from this cache.',
  },
  {
    req: 'FR3: book a ticket',
    caption: 'Booking gets its own service and its own seat table. Every seat has a status: available, held, or sold. This is the one place where two users can fight over the same row.',
    packets: [{ from: 'client', to: 'bsvc' }],
  },
  {
    req: 'NFR: never double-book',
    caption: 'No new box. A hold is one conditional update on the seat row, with an expiry time. It either wins the seat or learns it is gone. The deep dive shows how.',
    active: ['seats'],
  },
  {
    req: 'NFR: a hot event',
    caption: 'When 10 million fans arrive for one show, a virtual waiting room lets a few in at a time. Booking traffic stays bounded, whatever the crowd does.',
    packets: [{ from: 'client', to: 'room' }],
  },
  {
    req: 'NFR: a live seat map',
    caption: 'Seat changes are pushed to every viewer over a one-way live connection (lesson 2.5), so a fan does not click a seat that is already gone. The seat map is a hint. The hold step decides.',
    packets: [{ from: 'seats', to: 'feed' }],
  },
];

export default function TicketmasterBuild() {
  return (
    <DesignBuild
      title="Ticket booking, built requirement by requirement"
      nodes={nodes}
      edges={edges}
      steps={steps}
      height={380}
      label="Design of a ticket booking system. Event and search paths read from a database, a search index, and a cache. Booking uses its own service and seat table behind a waiting room, and a seat feed streams updates."
    />
  );
}

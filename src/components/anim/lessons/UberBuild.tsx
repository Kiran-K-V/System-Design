import DesignBuild, { type BuildEdge, type BuildNode, type BuildStep } from '../DesignBuild';

const W = 120;
const H = 56;

const nodes: BuildNode[] = [
  { id: 'rider', x: 80, y: 70, w: W, h: H, label: 'Rider app', step: 0 },
  { id: 'gw', x: 240, y: 70, w: W, h: H, label: 'Entry gateway', step: 0 },
  { id: 'fare', x: 400, y: 70, w: W, h: H, label: 'Fare service', step: 0 },
  { id: 'route', x: 560, y: 70, w: W, h: H, label: 'Routing API', shape: 'dashed', step: 0 },
  { id: 'lock', x: 80, y: 190, w: W, h: H, label: 'Driver lock', sub: 'expires in 10 s', step: 5 },
  { id: 'match', x: 240, y: 190, w: W, h: H, label: 'Matching', step: 3 },
  { id: 'ride', x: 400, y: 190, w: W, h: H, label: 'Ride service', step: 1 },
  { id: 'ridedb', x: 560, y: 190, w: 110, h: 88, shape: 'db', label: 'Ride DB', step: 1 },
  { id: 'geo', x: 240, y: 335, w: 110, h: 88, shape: 'db', label: 'Geo index', sub: 'Redis', step: 2 },
  { id: 'loc', x: 400, y: 335, w: W, h: H, label: 'Location svc', step: 2 },
  { id: 'driver', x: 560, y: 335, w: W, h: H, label: 'Driver app', step: 2 },
];

const edges: BuildEdge[] = [
  { from: 'rider', to: 'gw', step: 0 },
  { from: 'gw', to: 'fare', step: 0 },
  { from: 'fare', to: 'route', step: 0 },
  { from: 'gw', to: 'ride', step: 1 },
  { from: 'ride', to: 'ridedb', step: 1 },
  { from: 'driver', to: 'loc', step: 2 },
  { from: 'loc', to: 'geo', step: 2 },
  { from: 'ride', to: 'match', step: 3 },
  { from: 'match', to: 'geo', step: 3 },
  { from: 'match', to: 'driver', step: 4 },
  { from: 'match', to: 'lock', step: 5 },
];

const steps: BuildStep[] = [
  {
    req: 'FR1: estimate the fare',
    caption: 'The rider sends pickup and destination. The fare service asks a routing source for distance and time, then prices the trip and stores a Fare the rider can accept.',
    packets: [{ from: 'rider', to: 'gw', label: 'A to B' }, { from: 'gw', to: 'fare', delay: 0.9 }, { from: 'fare', to: 'route', delay: 1.8 }],
  },
  {
    req: 'FR2: request a ride',
    caption: 'The rider accepts the fare. The ride service saves a Ride in state "requested" in a normal database (the PostgreSQL lesson). Rides are few compared with location pings, so a database is fine here.',
    packets: [{ from: 'gw', to: 'ride', label: 'fareId' }, { from: 'ride', to: 'ridedb', label: 'save', delay: 0.9 }],
  },
  {
    req: 'FR3: know where drivers are',
    caption: 'Every driver app sends its position every few seconds. The location service writes it to an in-memory geo index. This is the high-rate write path, so it skips the ride database.',
    packets: [{ from: 'driver', to: 'loc', label: 'lat, long' }, { from: 'loc', to: 'geo', delay: 0.9 }],
  },
  {
    req: 'FR3: find nearby drivers',
    caption: 'The matching service takes a new Ride and asks the geo index for free drivers within a radius, nearest first. This is proximity search (the Proximity Search lesson).',
    packets: [{ from: 'ride', to: 'match', label: 'ride' }, { from: 'match', to: 'geo', label: 'radius?', delay: 0.9 }],
  },
  {
    req: 'FR4: driver accepts or declines',
    caption: 'Matching offers the ride to the nearest driver and waits up to about 10 seconds. A decline or a timeout moves on to the next driver in the list.',
    packets: [{ from: 'match', to: 'driver', label: 'offer' }],
  },
  {
    req: 'NFR: never double-assign a driver',
    caption: 'Before an offer, matching takes a lock on the driver with a time limit. Two matchers cannot both hold it. If one crashes, the lock expires and the driver is free again.',
    packets: [{ from: 'match', to: 'lock', label: 'lock if free' }],
  },
];

export default function UberBuild() {
  return <DesignBuild title="Uber: build it requirement by requirement" steps={steps} nodes={nodes} edges={edges} height={400} label="Ride hailing architecture growing from fare estimate to matching with a driver lock" />;
}

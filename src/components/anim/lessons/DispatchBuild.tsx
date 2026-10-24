import DesignBuild, { type BuildEdge, type BuildNode, type BuildStep } from '../DesignBuild';

const W = 132;
const H = 56;
const Y0 = 70;
const Y1 = 190;
const Y2 = 310;
const Y3 = 430;

const nodes: BuildNode[] = [
  { id: 'cust', x: 90, y: Y1, w: W, h: H, label: 'Customer', step: 0 },
  { id: 'gw', x: 258, y: Y1, w: W, h: H, label: 'Gateway', step: 0 },
  { id: 'order', x: 426, y: Y1, w: W, h: H, label: 'Order service', step: 0 },
  { id: 'orderdb', x: 594, y: Y1, w: 110, h: 88, shape: 'db', label: 'Order DB', step: 0 },
  { id: 'rest', x: 90, y: Y2, w: W, h: H, label: 'Restaurant', step: 1 },
  { id: 'fpt', x: 594, y: Y2, w: W, h: H, label: 'Prep model', sub: 'predicts FPT', step: 1 },
  { id: 'batch', x: 426, y: Y2, w: W, h: H, label: 'Batch window', sub: 'holds orders', step: 2 },
  { id: 'match', x: 258, y: Y2, w: W, h: H, label: 'Matching', step: 2 },
  { id: 'geo', x: 90, y: Y3, w: 110, h: 88, shape: 'db', label: 'Rider index', sub: 'latest spots', step: 3 },
  { id: 'loc', x: 258, y: Y3, w: W, h: H, label: 'Location svc', step: 3 },
  { id: 'rider', x: 426, y: Y3, w: W, h: H, label: 'Rider app', step: 3 },
  { id: 'timer', x: 594, y: Y3, w: W, h: H, label: 'Timer', sub: 'pickup call', step: 4 },
  { id: 'eta', x: 426, y: Y0, w: W, h: H, label: 'ETA service', step: 5 },
  { id: 'gate', x: 258, y: Y0, w: 140, h: H, label: 'Serviceability', sub: 'can we keep it?', step: 6 },
];

const edges: BuildEdge[] = [
  { from: 'cust', to: 'gw', step: 0 },
  { from: 'gw', to: 'order', step: 0 },
  { from: 'order', to: 'orderdb', step: 0 },
  { from: 'order', to: 'rest', step: 1 },
  { from: 'order', to: 'fpt', step: 1 },
  { from: 'order', to: 'batch', step: 2 },
  { from: 'fpt', to: 'batch', step: 2 },
  { from: 'batch', to: 'match', step: 2 },
  { from: 'rider', to: 'loc', step: 3 },
  { from: 'loc', to: 'geo', step: 3 },
  { from: 'match', to: 'geo', step: 3 },
  { from: 'match', to: 'timer', step: 4 },
  { from: 'fpt', to: 'timer', step: 4 },
  { from: 'timer', to: 'rider', step: 4 },
  { from: 'order', to: 'eta', step: 5 },
  { from: 'gw', to: 'gate', step: 6 },
  { from: 'gate', to: 'eta', step: 6 },
];

const steps: BuildStep[] = [
  {
    req: 'FR1: place an order',
    caption: 'The customer picks a restaurant and dishes, and the order service saves an Order in state "placed". Finding restaurants is a search problem, so it sits below the line (see the Yelp lesson).',
    packets: [{ from: 'cust', to: 'gw', label: 'order' }, { from: 'gw', to: 'order', delay: 0.9 }, { from: 'order', to: 'orderdb', label: 'save', delay: 1.8 }],
  },
  {
    req: 'FR2: restaurant accepts, prep is predicted',
    caption: 'The order goes to the restaurant app. At the same time, a model predicts the food preparation time (FPT) for this kitchen right now. This is the new part. Every later step uses that prediction.',
    packets: [{ from: 'order', to: 'rest', label: 'new order' }, { from: 'order', to: 'fpt', label: 'FPT?', delay: 0.9 }],
  },
  {
    req: 'FR3: pick a rider, together with other orders',
    caption: 'The dispatch window holds new orders for a short time. Then matching solves one problem for all orders and all free riders in the window, instead of one order at a time.',
    packets: [{ from: 'order', to: 'batch', label: 'order' }, { from: 'fpt', to: 'batch', label: 'ready time', delay: 0.9 }, { from: 'batch', to: 'match', delay: 1.8 }],
  },
  {
    req: 'FR3: know where riders are',
    caption: 'Rider apps send their position all the time. Only the latest spot matters, so it goes to an in-memory index, as in the Uber lesson. Matching reads free riders from it.',
    packets: [{ from: 'rider', to: 'loc', label: 'lat, long' }, { from: 'loc', to: 'geo', delay: 0.9 }, { from: 'match', to: 'geo', label: 'free riders?', delay: 1.8 }],
  },
  {
    req: 'FR4: rider arrives as food is ready',
    caption: 'Matching picks a rider now, but the pickup request goes out later. The timer waits until the predicted ready time minus the rider travel time. The rider then reaches the restaurant as the food is packed.',
    packets: [{ from: 'match', to: 'timer', label: 'rider + order' }, { from: 'fpt', to: 'timer', label: 'ready at', delay: 0.9 }, { from: 'timer', to: 'rider', label: 'go now', delay: 1.8 }],
  },
  {
    req: 'FR5: show an ETA',
    caption: 'The ETA service builds the time from parts: wait for a rider, rider travel to the restaurant, food preparation, and travel to the customer. The customer app shows this number and refreshes it as parts change.',
    packets: [{ from: 'order', to: 'eta', label: 'parts' }],
  },
  {
    req: 'NFR: never promise what we cannot keep',
    caption: 'Before an order is accepted, a serviceability check compares open orders with free riders in that area. If the answer is no, the app shows a longer ETA or stops new orders there. It does this before the customer pays.',
    packets: [{ from: 'gw', to: 'gate' }, { from: 'gate', to: 'eta', delay: 0.9 }],
  },
];

export default function DispatchBuild() {
  return <DesignBuild title="Food delivery dispatch: build it requirement by requirement" steps={steps} nodes={nodes} edges={edges} height={510} label="A food delivery design that fits the requirements, growing from placing an order to a serviceability check" />;
}

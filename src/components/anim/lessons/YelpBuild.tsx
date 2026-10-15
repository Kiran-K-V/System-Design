import DesignBuild, { type BuildEdge, type BuildNode, type BuildStep } from '../DesignBuild';

const W = 120;
const H = 56;

const nodes: BuildNode[] = [
  { id: 'client', x: 80, y: 70, w: W, h: H, label: 'Client', step: 0 },
  { id: 'api', x: 240, y: 70, w: W, h: H, label: 'API', step: 0 },
  { id: 'search', x: 400, y: 70, w: W, h: H, label: 'Search svc', step: 0 },
  { id: 'index', x: 560, y: 70, w: 120, h: 88, shape: 'db', label: 'Search index', sub: 'text + geo', step: 0 },
  { id: 'bizdb', x: 560, y: 205, w: 120, h: 88, shape: 'db', label: 'Business DB', sub: 'avg rating', step: 1 },
  { id: 'biz', x: 400, y: 205, w: W, h: H, label: 'Business svc', step: 2 },
  { id: 'revdb', x: 400, y: 340, w: 120, h: 88, shape: 'db', label: 'Review DB', sub: 'by business', step: 2 },
  { id: 'rev', x: 240, y: 340, w: W, h: H, label: 'Review svc', step: 3 },
];

const edges: BuildEdge[] = [
  { from: 'client', to: 'api', step: 0 },
  { from: 'api', to: 'search', step: 0 },
  { from: 'search', to: 'index', step: 0 },
  { from: 'bizdb', to: 'index', label: 'CDC', labelAt: [30, 0], step: 1 },
  { from: 'api', to: 'biz', step: 2 },
  { from: 'biz', to: 'bizdb', step: 2 },
  { from: 'biz', to: 'revdb', step: 2 },
  { from: 'api', to: 'rev', step: 3 },
  { from: 'rev', to: 'revdb', step: 3 },
  { from: 'rev', to: 'bizdb', step: 3 },
];

const steps: BuildStep[] = [
  {
    req: 'FR1: search by name, place, category',
    caption: 'A search goes to a search index (lesson 8.5) that holds each business with a text field, a category, and a location. One query mixes all three filters. The database is not asked.',
    packets: [{ from: 'client', to: 'api', label: 'pizza near me' }, { from: 'api', to: 'search', delay: 0.9 }, { from: 'search', to: 'index', delay: 1.8 }],
  },
  {
    req: 'FR1: keep the index fed',
    caption: 'The business database stays the source of truth. A change feed (lesson 6.5) copies each change into the index. The index may lag a little. Eventual consistency is acceptable here.',
    packets: [{ from: 'bizdb', to: 'index', label: 'change' }],
  },
  {
    req: 'FR2: view a business and its reviews',
    caption: 'A business page reads one business row, which already holds the average rating, and a page of reviews for that business. No averaging happens at read time.',
    packets: [{ from: 'api', to: 'biz', label: 'GET' }, { from: 'biz', to: 'bizdb', delay: 0.9 }, { from: 'biz', to: 'revdb', delay: 0.9 }],
  },
  {
    req: 'FR3: leave a review',
    caption: 'The review service inserts the review and, in the same transaction, adds to the business row: count up by 1 and sum up by the stars. The same write enforces one review per user per business.',
    packets: [{ from: 'api', to: 'rev', label: 'POST' }, { from: 'rev', to: 'revdb', label: 'insert', delay: 0.9 }, { from: 'rev', to: 'bizdb', label: '+1, +stars', delay: 0.9 }],
  },
];

export default function YelpBuild() {
  return <DesignBuild title="Yelp: build it requirement by requirement" steps={steps} nodes={nodes} edges={edges} height={410} label="Business search architecture growing from a search index to reviews with a stored rating" />;
}

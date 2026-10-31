import { DesignCompare, type CompareVariant } from '../DesignBuild';

const W = 120;
const H = 56;

const avgRead: CompareVariant = {
  id: 'read',
  label: 'Average at read time',
  nodes: [
    { id: 'reader', x: 90, y: 150, w: W, h: H, label: 'Reader' },
    { id: 'svc', x: 280, y: 150, w: W, h: H, label: 'Business svc' },
    { id: 'rev', x: 500, y: 150, w: 150, h: 90, shape: 'db', label: 'Review table', sub: '80,000 rows here' },
  ],
  edges: [
    { from: 'reader', to: 'svc' },
    { from: 'svc', to: 'rev' },
  ],
  steps: [
    { caption: 'A reader opens a popular business with 80,000 reviews.', packets: [{ from: 'reader', to: 'svc', label: 'GET' }], active: ['reader'] },
    {
      caption: 'The service runs AVG(rating) over every review of that business, on every page view. Work grows with the number of reviews, and popular pages are the most read.',
      packets: [{ from: 'svc', to: 'rev', label: 'AVG' }],
      tones: { rev: 'warn' },
      active: ['rev'],
    },
    {
      caption: 'A hot page now does an 80,000-row aggregate per view. The read-heavy path pays the cost again and again. Store the answer instead.',
      tones: { rev: 'bad' },
      active: ['rev'],
    },
  ],
};

const racy: CompareVariant = {
  id: 'racy',
  label: 'Stored average, read then write',
  nodes: [
    { id: 'a', x: 80, y: 70, w: W, h: H, label: 'Writer A', sub: 'gives 5 stars' },
    { id: 'b', x: 80, y: 230, w: W, h: H, label: 'Writer B', sub: 'gives 1 star' },
    { id: 'row', x: 400, y: 150, w: 170, h: 90, shape: 'db', label: 'Business row', sub: 'avg and count' },
  ],
  edges: [
    { from: 'a', to: 'row' },
    { from: 'b', to: 'row' },
  ],
  steps: [
    {
      caption: 'The row says average 4.00 from 10 reviews. Two people post at the same moment.',
      notes: [{ x: 330, y: 265, text: 'row: avg 4.00, count 10', anchor: 'middle' }],
      active: ['row'],
    },
    {
      caption: 'Both read the row first. A computes (4.00 x 10 + 5) / 11 = 4.09. B computes (4.00 x 10 + 1) / 11 = 3.73. Each worked from the same old numbers.',
      packets: [{ from: 'row', to: 'a', label: '4.00, 10' }, { from: 'row', to: 'b', label: '4.00, 10' }],
      notes: [{ x: 330, y: 265, text: 'A will write 4.09, B will write 3.73', anchor: 'middle' }],
      active: ['a', 'b'],
    },
    {
      caption: 'Both write back. The last writer wins, so the row ends at avg 3.73 and count 11. The right answer is 46 / 12 = 3.83 with count 12. One review has vanished from the average.',
      packets: [{ from: 'a', to: 'row', label: '4.09' }, { from: 'b', to: 'row', label: '3.73', delay: 0.5 }],
      tones: { row: 'bad' },
      notes: [{ x: 330, y: 265, text: 'row: avg 3.73, count 11 (lost update)', anchor: 'middle', tone: 'bad' }],
      active: ['row'],
    },
  ],
};

const atomic: CompareVariant = {
  id: 'atomic',
  label: 'Sum and count, one atomic update',
  nodes: [
    { id: 'a', x: 80, y: 70, w: W, h: H, label: 'Writer A', sub: 'gives 5 stars' },
    { id: 'b', x: 80, y: 230, w: W, h: H, label: 'Writer B', sub: 'gives 1 star' },
    { id: 'row', x: 400, y: 150, w: 170, h: 90, shape: 'db', label: 'Business row', sub: 'sum and count' },
  ],
  edges: [
    { from: 'a', to: 'row' },
    { from: 'b', to: 'row' },
  ],
  steps: [
    {
      caption: 'The row stores sum 40 and count 10, not the average. The average is sum / count when someone reads.',
      notes: [{ x: 330, y: 265, text: 'row: sum 40, count 10 (avg 4.00)', anchor: 'middle' }],
      active: ['row'],
    },
    {
      caption: 'Each writer sends a relative update: sum = sum + stars, count = count + 1. It carries no old value, so it cannot be stale.',
      packets: [{ from: 'a', to: 'row', label: '+5, +1' }, { from: 'b', to: 'row', label: '+1, +1' }],
      active: ['row'],
    },
    {
      caption: 'The database takes a row lock for each update (the Transactions and Isolation lesson), so the two run one after the other. Result: sum 46, count 12. The average is 46 / 12 = 3.83. Both reviews count.',
      tones: { row: 'ok', a: 'ok', b: 'ok' },
      notes: [{ x: 330, y: 265, text: 'row: sum 46, count 12 (avg 3.83)', anchor: 'middle', tone: 'ok' }],
      active: ['row'],
    },
  ],
};

export default function YelpRating() {
  return <DesignCompare title="Average rating" prompt="Design:" variants={[avgRead, racy, atomic]} height={300} label="Three ways to keep a business average rating: at read time, stored with a race, and stored atomically" />;
}

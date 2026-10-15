import { useState } from 'react';
import CacheWidgetFrame, { Seg } from './CacheWidgetFrame';
import { CAP, cappedRows, uncappedRows } from './shopifyRows';

const UNITS = [
  { id: 500, label: '500' },
  { id: 5_000, label: '5,000' },
  { id: 50_000, label: '50,000' },
  { id: 500_000, label: '500,000' },
];
const LOCS = [
  { id: 1, label: '1' },
  { id: 10, label: '10' },
  { id: 100, label: '100' },
];

function Card({ title, value, tone, note }: { title: string; value: string; tone?: 'ok' | 'bad'; note?: string }) {
  return (
    <div className="rounded-lg border border-line bg-surface p-2.5">
      <div className="text-xs text-muted">{title}</div>
      <div className={`text-lg font-semibold tabular-nums ${tone === 'bad' ? 'text-bad' : tone === 'ok' ? 'text-ok' : ''}`}>{value}</div>
      {note && <div className="text-xs text-muted">{note}</div>}
    </div>
  );
}

/** Row count of a row-per-unit design, with and without the 1,000-row pool cap. */
export default function ShopifyRows() {
  const [units, setUnits] = useState(50_000);
  const [locs, setLocs] = useState(10);
  const full = uncappedRows(units, locs);
  const capped = cappedRows(units, locs);
  return (
    <CacheWidgetFrame title="How many rows does the pool hold?" hint="Follows the arithmetic in Shopify's post. Cap: 1,000 per item/location pair.">
      <div className="space-y-3">
        <div>
          <div className="mb-1 text-xs text-muted">Units in stock at each location</div>
          <Seg label="Units per location" value={units} options={UNITS} onChange={setUnits} />
        </div>
        <div>
          <div className="mb-1 text-xs text-muted">Locations</div>
          <Seg label="Locations" value={locs} options={LOCS} onChange={setLocs} />
        </div>
      </div>
      <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
        <Card title="Row per unit, no cap" value={full.toLocaleString('en-US')} tone={full > capped ? 'bad' : undefined} />
        <Card title={`With the ${CAP.toLocaleString('en-US')} cap`} value={capped.toLocaleString('en-US')} tone="ok" />
        <Card title="Rows saved" value={full === capped ? 'none' : `${Math.round((1 - capped / full) * 1000) / 10}%`} note={full === capped ? 'Stock is already under the cap' : 'The ledger holds the rest of the units'} />
      </div>
      <p className="mt-3 text-sm text-muted">The pool refills from the ledger when it runs low, so a smaller pool costs more refills. The post sized the cap from observed peak reservation rates. It gives no refill timing.</p>
    </CacheWidgetFrame>
  );
}

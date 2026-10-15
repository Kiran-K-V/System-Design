import { useState } from 'react';
import CacheWidgetFrame, { Seg } from './CacheWidgetFrame';
import { BUCKET_DAYS, LIMIT_MB, maxDays, partitionMB } from './discordBucket';

const RATES = [
  { id: 100, label: '100' },
  { id: 5_000, label: '5,000' },
  { id: 100_000, label: '100,000' },
  { id: 1_000_000, label: '1,000,000' },
];
const SIZES = [
  { id: 200, label: '200 B' },
  { id: 500, label: '500 B' },
  { id: 1000, label: '1,000 B' },
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

/** Pick a channel's message rate and size. See how big one 10-day partition gets. */
export default function DiscordBucket() {
  const [rate, setRate] = useState(5_000);
  const [bytes, setBytes] = useState(500);
  const mb = partitionMB(rate, bytes);
  const over = mb > LIMIT_MB;
  const days = maxDays(rate, bytes);
  return (
    <CacheWidgetFrame title="One channel, one 10-day bucket" hint="Our model with made-up message sizes. Discord's own bucket target was under 100 MB.">
      <div className="space-y-3">
        <div>
          <div className="mb-1 text-xs text-muted">Messages per day in one channel</div>
          <Seg label="Messages per day" value={rate} options={RATES} onChange={setRate} />
        </div>
        <div>
          <div className="mb-1 text-xs text-muted">Average stored size of one message (an assumption)</div>
          <Seg label="Bytes per message" value={bytes} options={SIZES} onChange={setBytes} />
        </div>
      </div>
      <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
        <Card title={`Partition size at ${BUCKET_DAYS} days`} value={`${+mb.toFixed(2)} MB`} tone={over ? 'bad' : 'ok'} note={over ? `Over the ${LIMIT_MB} MB target` : `Under the ${LIMIT_MB} MB target`} />
        <Card title="Longest bucket under the target" value={days >= 1 ? `${days} ${days === 1 ? 'day' : 'days'}` : 'under 1 day'} note={`${LIMIT_MB} MB / (rate x size)`} />
        <Card title="Messages in one bucket" value={(rate * BUCKET_DAYS).toLocaleString('en-US')} note="rate x 10 days" />
      </div>
      <p className="mt-3 text-sm text-muted">
        A fixed 10-day bucket suits most channels. A very busy channel would need a shorter bucket. This model ignores compression, indexes, and replicas, so it only shows the shape of the problem.
      </p>
    </CacheWidgetFrame>
  );
}

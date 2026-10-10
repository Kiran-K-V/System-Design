import { useState } from 'react';
import CacheWidgetFrame, { Seg } from './CacheWidgetFrame';
import { GIB, MAX_OBJECT, MIB, SINGLE_PUT_MAX, TIB, check, fmt, minPartFor } from './blobParts';

const SIZES = [
  { id: 200 * MIB, label: '200 MiB' },
  { id: 5 * GIB, label: '5 GiB' },
  { id: 100 * GIB, label: '100 GiB' },
  { id: 1 * TIB, label: '1 TiB' },
  { id: 40 * TIB, label: '40 TiB' },
  { id: 50 * TIB, label: '50 TiB' },
];
const PARTS = [
  { id: 5 * MIB, label: '5 MiB' },
  { id: 16 * MIB, label: '16 MiB' },
  { id: 100 * MIB, label: '100 MiB' },
  { id: 1 * GIB, label: '1 GiB' },
  { id: 5 * GIB, label: '5 GiB' },
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

/** Pick a file size and a part size. See which S3 multipart limit you hit. */
export default function BlobPartCalc() {
  const [size, setSize] = useState(5 * GIB);
  const [part, setPart] = useState(100 * MIB);
  const r = check(size, part);
  const minPart = minPartFor(size);

  return (
    <CacheWidgetFrame title="Multipart upload planner" hint="Amazon S3 limits: 10,000 parts, 5 MiB to 5 GiB each">
      <div className="space-y-3">
        <div>
          <div className="mb-1 text-xs text-muted">File size</div>
          <Seg label="File size" value={size} options={SIZES} onChange={setSize} />
        </div>
        <div>
          <div className="mb-1 text-xs text-muted">Part size</div>
          <Seg label="Part size" value={part} options={PARTS} onChange={setPart} />
        </div>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Card title="Parts" value={r.parts.toLocaleString('en-US')} tone={r.parts > 10000 ? 'bad' : undefined} />
        <Card title="Result" value={r.ok ? 'Valid' : 'Rejected'} tone={r.ok ? 'ok' : 'bad'} note={r.ok ? undefined : r.reason} />
        <Card title="Smallest part that fits" value={fmt(minPart)} note={size > MAX_OBJECT ? 'No part size fits' : 'file size / 10,000, at least 5 MiB'} />
        <Card title="Resent if one part fails" value={fmt(Math.min(part, size))} note={`${((Math.min(part, size) / size) * 100).toFixed(2)}% of the file`} />
      </div>
      <p className="mt-3 text-sm text-muted">
        {size <= SINGLE_PUT_MAX ? 'This file fits in one PUT (5 GB limit), but AWS suggests multipart from about 100 MB for speed and for retrying only the failed part.' : 'This file is above the 5 GB single-PUT limit, so multipart is required.'} Largest object: 10,000 parts × 5 GiB = {fmt(MAX_OBJECT)}.
      </p>
    </CacheWidgetFrame>
  );
}

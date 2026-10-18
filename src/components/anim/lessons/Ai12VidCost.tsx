import { useState } from 'react';
import CacheWidgetFrame from './CacheWidgetFrame';
import { OFFERS, pricePerSecond } from './Ai12VidMath';

/** Clip price calculator from public list prices (as of 2026-10-18). */
export default function Ai12VidCost() {
  const [id, setId] = useState(OFFERS[0].id);
  const offer = OFFERS.find((o) => o.id === id) ?? OFFERS[0];
  const [res, setRes] = useState('720p');
  const resolution = offer.resolutions.includes(res) ? res : offer.resolutions[0];
  const durs = offer.durations(resolution);
  const [dur, setDur] = useState(8);
  const seconds = durs.includes(dur) ? dur : durs[durs.length - 1];
  const usd = offer.price(resolution, seconds);
  const perSec = pricePerSecond(usd, seconds);
  const many = usd * 1000;

  return (
    <CacheWidgetFrame title="What does one clip cost?" hint="List prices, as of 2026-10-18">
      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <div>
          <label htmlFor="vc-model" className="mb-1 block text-xs text-muted">Model</label>
          <select id="vc-model" value={id} onChange={(e) => setId(e.target.value)} className="w-full rounded-lg border border-line bg-bg px-2 py-2 text-sm">
            {OFFERS.map((o) => (
              <option key={o.id} value={o.id}>{o.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="vc-res" className="mb-1 block text-xs text-muted">Resolution</label>
          <select id="vc-res" value={resolution} onChange={(e) => setRes(e.target.value)} className="w-full rounded-lg border border-line bg-bg px-2 py-2 text-sm">
            {offer.resolutions.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="vc-dur" className="mb-1 block text-xs text-muted">Length</label>
          <select id="vc-dur" value={seconds} onChange={(e) => setDur(+e.target.value)} className="w-full rounded-lg border border-line bg-bg px-2 py-2 text-sm">
            {durs.map((d) => (
              <option key={d} value={d}>{d} s</option>
            ))}
          </select>
        </div>
      </div>
      <div className="grid gap-3 text-sm sm:grid-cols-3" aria-live="polite">
        <div className="rounded-lg border border-line p-3">
          <p className="text-xs uppercase tracking-wide text-muted">One clip</p>
          <p className="mt-1 font-mono text-lg">{`$${usd.toFixed(2)}`}</p>
        </div>
        <div className="rounded-lg border border-line p-3">
          <p className="text-xs uppercase tracking-wide text-muted">Per second of video</p>
          <p className="mt-1 font-mono text-lg">{`$${perSec.toFixed(2)}`}</p>
        </div>
        <div className="rounded-lg border border-line p-3">
          <p className="text-xs uppercase tracking-wide text-muted">1,000 clips</p>
          <p className="mt-1 font-mono text-lg">{`$${Math.round(many).toLocaleString('en-US')}`}</p>
        </div>
      </div>
      <p className="mt-3 text-sm text-muted">
        {offer.note} Model: price x seconds for per-second prices, the listed clip price for per-video prices. Blocked Veo clips are not charged, and the widget does not model retries or failed jobs.
      </p>
    </CacheWidgetFrame>
  );
}

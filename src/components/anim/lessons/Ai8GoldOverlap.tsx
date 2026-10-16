import { useState } from 'react';
import CacheWidgetFrame from './CacheWidgetFrame';
import { overlap } from './Ai8GoldMath';

// Illustrative texts. The corpus stands for a page that ended up in a training set.
export const CORPUS =
  'Homework help forum. Q: A train leaves the station at noon and travels 60 miles per hour for three hours. How far does it go? A: 180 miles. Another one. A bakery uses 2 cups of flour per egg, so six eggs need twelve cups of flour.';

export const ITEMS: { label: string; text: string; note: string }[] = [
  { label: 'Test item A', text: 'A train leaves the station at noon and travels 60 miles per hour for three hours. How far does it go?', note: 'copied word for word' },
  { label: 'Test item B', text: 'A recipe needs two cups of flour for every egg. How much flour do six eggs need?', note: 'same problem, new words' },
  { label: 'Test item C', text: 'A tank holds 40 liters and leaks 3 liters per hour. How long until it is empty?', note: 'never seen' },
];

export default function Ai8GoldOverlap() {
  const [n, setN] = useState(8);

  return (
    <CacheWidgetFrame title="Overlap checker" hint="Illustrative texts. Same idea as a real contamination scan.">
      <div className="mb-3">
        <label htmlFor="a8g-n" className="mb-1 flex justify-between text-xs text-muted">
          <span>Match length n (words in a row)</span>
          <span className="tabular-nums text-fg">{n}</span>
        </label>
        <input id="a8g-n" type="range" min={2} max={13} step={1} value={n} onChange={(e) => setN(+e.target.value)} className="w-full accent-[var(--accent)]" />
      </div>
      <p className="mb-3 rounded-lg border border-line bg-surface p-3 text-sm">
        <span className="text-xs uppercase tracking-wide text-muted">Text the model trained on</span>
        <br />
        {CORPUS}
      </p>
      <div className="space-y-3 text-sm" aria-live="polite">
        {ITEMS.map((it) => {
          const o = overlap(it.text, CORPUS, n);
          return (
            <div key={it.label} className="rounded-lg border p-3" style={{ borderColor: o.flagged ? 'var(--bad)' : 'var(--border)' }}>
              <p className="flex flex-wrap justify-between gap-2 text-xs text-muted">
                <span>{it.label} ({it.note})</span>
                <span className="font-mono" style={{ color: o.flagged ? 'var(--bad)' : 'var(--ok)' }}>
                  {o.flagged ? 'FLAGGED' : 'clean'} · {o.hits} of {o.total} matches
                </span>
              </p>
              <p className="mt-1 leading-relaxed">
                {o.words.map((w, i) => (
                  <span key={i} style={o.covered[i] ? { background: 'color-mix(in srgb, var(--bad) 22%, transparent)' } : undefined}>
                    {w}{' '}
                  </span>
                ))}
              </p>
            </div>
          );
        })}
      </div>
      <p className="mt-3 text-sm text-muted">
        Rule: an item is flagged when any run of n words also appears in the training text. Shaded words sit inside a match. Slide n down and item B starts to match by chance. Slide n up and item B slips through, although it is the same problem in new words.
      </p>
    </CacheWidgetFrame>
  );
}

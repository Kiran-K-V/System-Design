import { useState } from 'react';
import CacheWidgetFrame, { Seg } from './CacheWidgetFrame';
import { ASPECTS, compare, sizeFor } from './Ai12VlmMath';

/** Input prices, USD per million tokens, from the Anthropic pricing page as of 2026-10-18 (Haiku 4.5: the vision page example). */
const PRICES = [
  { id: 0.1, label: '$0.10 (Haiku 5.5)' },
  { id: 1, label: '$1 (Haiku 4.5)' },
  { id: 2, label: '$2 (Sonnet 5.5)' },
  { id: 4, label: '$4 (Opus 5.5)' },
];

const fmtMoney = (v: number) => (v >= 1 ? `$${v.toFixed(2)}` : `$${v.toFixed(3)}`);
const fmtInt = (v: number) => Math.round(v).toLocaleString('en-US');

/** Slider: long edge of the upload vs tokens and cost per 1,000 images, under three counting rules. */
export default function Ai12VlmResCost() {
  const [edge, setEdge] = useState(1000);
  const [aspect, setAspect] = useState<(typeof ASPECTS)[number]['id']>('square');
  const [price, setPrice] = useState(2);
  const ratio = ASPECTS.find((a) => a.id === aspect)!.ratio;
  const [w, h] = sizeFor(edge, ratio);
  const rows = compare(w, h, price);
  const max = Math.max(...rows.map((r) => r.tokens), 1);

  return (
    <CacheWidgetFrame title="Resolution against cost" hint="Same image, three counting rules, one price per million tokens">
      <div className="mb-4 grid gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor="a12-edge" className="mb-1 flex justify-between text-xs text-muted">
            <span>Long edge of the image you upload</span>
            <span className="tabular-nums text-fg">{`${w} x ${h} px`}</span>
          </label>
          <input id="a12-edge" type="range" min={256} max={3840} step={16} value={edge} onChange={(e) => setEdge(+e.target.value)} className="w-full accent-[var(--accent)]" />
        </div>
        <div className="flex flex-col gap-2">
          <Seg label="Shape" value={aspect} onChange={setAspect} options={ASPECTS.map((a) => ({ id: a.id, label: a.label }))} />
          <Seg label="Price per million input tokens" value={price} onChange={setPrice} options={PRICES} />
        </div>
      </div>
      <div className="space-y-3" aria-live="polite">
        {rows.map((r) => {
          const capped = r.tokens < r.uncapped;
          return (
            <div key={r.id} className="rounded-lg border border-line p-3">
              <div className="flex flex-wrap items-baseline justify-between gap-2 text-sm">
                <span>{r.label}</span>
                <span className="font-mono tabular-nums">{`${fmtInt(r.tokens)} tokens  |  ${fmtMoney(r.perThousand)} per 1,000 images`}</span>
              </div>
              <div className="mt-2 h-2 w-full rounded bg-surface">
                <div className="h-2 rounded" style={{ width: `${(r.tokens / max) * 100}%`, background: capped ? 'var(--warn)' : 'var(--accent)' }} />
              </div>
              {capped && (
                <p className="mt-1 text-xs text-muted">{`Capped: resized to ${r.resized[0]} x ${r.resized[1]} px. Without the cap it would be ${fmtInt(r.uncapped)} tokens. The extra pixels are thrown away.`}</p>
              )}
            </div>
          );
        })}
      </div>
      <p className="mt-3 text-sm text-muted">
        Model: Anthropic rows use ceil(w / 28) x ceil(h / 28) after the resize cap (1568 px and 1568 tokens, or 2576 px and 4784 tokens). The OpenAI row follows the tile rule for gpt-4o and gpt-4.1: fit in 2048 px, shortest side to 768 px, 512 px tiles, 85 base tokens plus 170 per tile. All rows use the price you pick, so only the token counts differ. Prices are input prices only. Check each provider before you copy a number.
      </p>
    </CacheWidgetFrame>
  );
}

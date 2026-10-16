import { useState } from 'react';
import CacheWidgetFrame from './CacheWidgetFrame';
import { IMAGE_MODELS, TIERS, imageCost } from './Ai3FileMath';

const PRESETS = [
  { label: '1000 x 1000', w: 1000, h: 1000 },
  { label: '1920 x 1080 screenshot', w: 1920, h: 1080 },
  { label: '1240 x 1754 invoice scan', w: 1240, h: 1754 },
  { label: '3840 x 2160 (4K)', w: 3840, h: 2160 },
];

const fmtMoney = (v: number) => (v >= 100 ? `$${Math.round(v).toLocaleString('en-US')}` : v >= 1 ? `$${v.toFixed(2)}` : `$${v.toFixed(4)}`);
const fmtInt = (v: number) => Math.round(v).toLocaleString('en-US');

const VW = 360;
const VH = 240;

/** Image token calculator. Formula: ceil(w/28) x ceil(h/28), after the tier's downscale. */
export default function Ai3FileCalc() {
  const [w, setW] = useState(1920);
  const [h, setH] = useState(1080);
  const [modelId, setModelId] = useState('opus55');
  const [pct, setPct] = useState(100);
  const [count, setCount] = useState(1000);

  const m = IMAGE_MODELS.find((x) => x.id === modelId)!;
  const tier = TIERS.find((t) => t.id === m.tier)!;
  const sw = Math.max(1, Math.round((w * pct) / 100));
  const sh = Math.max(1, Math.round((h * pct) / 100));
  const orig = imageCost(w, h, tier, m.price);
  const c = imageCost(sw, sh, tier, m.price);
  const [rw, rh] = c.resized;
  const cols = Math.ceil(rw / 28);
  const rows = Math.ceil(rh / 28);
  const k = Math.min((VW - 20) / (cols * 28), (VH - 20) / (rows * 28));
  const gw = cols * 28 * k;
  const gh = rows * 28 * k;
  const gx = (VW - gw) / 2;
  const gy = (VH - gh) / 2;
  const imgW = rw * k;
  const imgH = rh * k;

  return (
    <CacheWidgetFrame title="Image token calculator" hint={`input price as of 2026-10-16`}>
      <div className="grid gap-4 text-sm md:grid-cols-2">
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {PRESETS.map((p) => (
              <button
                key={p.label}
                type="button"
                onClick={() => {
                  setW(p.w);
                  setH(p.h);
                }}
                className="rounded-md border border-line px-2.5 py-1.5 text-xs hover:bg-surface"
              >
                {p.label}
              </button>
            ))}
          </div>
          <div>
            <label htmlFor="a3f-w" className="mb-1 flex justify-between text-xs text-muted">
              <span>Width (px)</span>
              <span className="tabular-nums text-fg">{w}</span>
            </label>
            <input id="a3f-w" type="range" min={100} max={4000} step={4} value={w} onChange={(e) => setW(+e.target.value)} className="w-full accent-[var(--accent)]" />
          </div>
          <div>
            <label htmlFor="a3f-h" className="mb-1 flex justify-between text-xs text-muted">
              <span>Height (px)</span>
              <span className="tabular-nums text-fg">{h}</span>
            </label>
            <input id="a3f-h" type="range" min={100} max={4000} step={4} value={h} onChange={(e) => setH(+e.target.value)} className="w-full accent-[var(--accent)]" />
          </div>
          <div>
            <label htmlFor="a3f-p" className="mb-1 flex justify-between text-xs text-muted">
              <span>You downscale before upload</span>
              <span className="tabular-nums text-fg">{pct}% ({sw} x {sh})</span>
            </label>
            <input id="a3f-p" type="range" min={10} max={100} step={5} value={pct} onChange={(e) => setPct(+e.target.value)} className="w-full accent-[var(--accent)]" />
          </div>
          <div>
            <label htmlFor="a3f-m" className="mb-1 block text-xs text-muted">Model (input price per 1M tokens)</label>
            <select id="a3f-m" value={modelId} onChange={(e) => setModelId(e.target.value)} className="w-full rounded-md border border-line bg-bg px-2 py-1.5 text-sm">
              {IMAGE_MODELS.map((x) => (
                <option key={x.id} value={x.id}>{x.name} (${x.price})</option>
              ))}
            </select>
            <p className="mt-1 text-xs text-muted">{tier.label}</p>
          </div>
          <div>
            <label htmlFor="a3f-n" className="mb-1 flex justify-between text-xs text-muted">
              <span>Number of images</span>
              <span className="tabular-nums text-fg">{fmtInt(count)}</span>
            </label>
            <input id="a3f-n" type="range" min={1} max={100000} step={1} value={count} onChange={(e) => setCount(+e.target.value)} className="w-full accent-[var(--accent)]" />
          </div>
        </div>
        <div className="space-y-3">
          <svg viewBox={`0 0 ${VW} ${VH}`} className="h-auto w-full rounded-lg border border-line bg-surface" role="img" aria-label={`The image as Claude sees it, ${cols} by ${rows} patches of 28 pixels`}>
            <rect x={gx} y={gy} width={imgW} height={imgH} fill="var(--accent-soft)" stroke="var(--accent)" strokeWidth={1.5} />
            {Array.from({ length: cols + 1 }, (_, i) => (
              <line key={`c${i}`} x1={gx + i * 28 * k} x2={gx + i * 28 * k} y1={gy} y2={gy + gh} stroke="var(--border)" strokeWidth={0.8} />
            ))}
            {Array.from({ length: rows + 1 }, (_, i) => (
              <line key={`r${i}`} x1={gx} x2={gx + gw} y1={gy + i * 28 * k} y2={gy + i * 28 * k} stroke="var(--border)" strokeWidth={0.8} />
            ))}
          </svg>
          <p className="text-xs text-muted">Each cell is one 28 x 28 patch, one token. The shaded area is the image. The padding in the last row and column holds no content.</p>
          <div className="grid gap-2 sm:grid-cols-3">
            <div className="rounded-lg border border-line bg-surface p-2.5">
              <div className="text-xs text-muted">Patches</div>
              <div className="text-sm font-semibold tabular-nums" data-testid="a3f-grid">{cols} x {rows}</div>
            </div>
            <div className="rounded-lg border border-line bg-surface p-2.5">
              <div className="text-xs text-muted">Tokens per image</div>
              <div className="text-lg font-semibold tabular-nums" style={{ color: 'var(--accent)' }} data-testid="a3f-tokens">{fmtInt(c.tokens)}</div>
            </div>
            <div className="rounded-lg border border-line bg-surface p-2.5">
              <div className="text-xs text-muted">Cost per image</div>
              <div className="text-lg font-semibold tabular-nums" data-testid="a3f-each">{fmtMoney(c.dollarsEach)}</div>
            </div>
          </div>
          <div className="rounded-lg border border-line bg-surface p-2.5">
            <div className="text-xs text-muted">{fmtInt(count)} images</div>
            <div className="text-lg font-semibold tabular-nums" style={{ color: 'var(--warn)' }} data-testid="a3f-total">{fmtMoney(c.dollarsEach * count)}</div>
            <div className="text-xs text-muted">{fmtInt(c.tokens * count)} input tokens</div>
          </div>
          <p className="text-xs leading-relaxed text-muted" data-testid="a3f-note">
            {c.wasResized
              ? `The tier downscales ${sw} x ${sh} to ${rw} x ${rh} before it counts patches. Without the cap it would be ${fmtInt(c.rawTokens)} tokens.`
              : `${sw} x ${sh} fits the tier limits, so Claude does not resize it.`}{' '}
            {pct < 100 ? `Your downscale saves ${fmtInt(orig.tokens - c.tokens)} tokens per image against sending the original.` : ''}
          </p>
        </div>
      </div>
    </CacheWidgetFrame>
  );
}

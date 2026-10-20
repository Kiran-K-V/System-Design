import { useState } from 'react';
import CacheWidgetFrame from './CacheWidgetFrame';
import { HandText, SketchArrow, SketchBox, SketchSvg, TEXT_SIZES, seedOf } from '../sketch';
import {
  CLASSES,
  DEFAULTS,
  errorAfter,
  rawRate,
  residualFraction,
  retryError,
  retryExtraCalls,
  type ParserSetup,
} from './Ai14LinkedinMath';

const ALL_ON = Object.fromEntries(CLASSES.map((c) => [c.id, true])) as Record<string, boolean>;

// Log axis from 0.001% to 100%.
const LO = Math.log10(0.00001);
const HI = Math.log10(1);
const X0 = 250;
const X1 = 690;
const px = (rate: number) => X0 + ((Math.log10(Math.max(rate, 1e-5)) - LO) / (HI - LO)) * (X1 - X0);
const TICKS = [0.00001, 0.0001, 0.001, 0.01, 0.1, 1];

const pct = (r: number) => {
  const p = r * 100;
  if (p >= 10) return `${p.toFixed(0)}%`;
  if (p >= 1) return `${p.toFixed(1)}%`;
  if (p >= 0.1) return `${p.toFixed(2)}%`;
  if (p >= 0.001) return `${p.toFixed(3)}%`;
  return `${p.toFixed(4)}%`;
};
const oneIn = (r: number) => (r <= 0 ? 'never' : `1 in ${Number((1 / r).toPrecision(2)).toLocaleString('en-US')}`);

function Bar({ rate, y, tone, label }: { rate: number; y: number; tone: string; label: string }) {
  const w = Math.max(px(rate) - X0, 6);
  return (
    <g>
      <HandText x={X0 - 12} y={y} anchor="end" size={TEXT_SIZES.label} color="var(--fg)">
        {label}
      </HandText>
      <SketchBox cx={X0 + w / 2} cy={y} w={w} h={28} r={6} seed={seedOf(`pb${label}`)} stroke={tone} fill={tone} strokeWidth={1.4} />
    </g>
  );
}

/** Defensive-parser simulator. Illustrative model: the page gives only the before (about 10%) and after (about 0.01%). */
export default function Ai14LinkedinParser() {
  const [malformedPct, setMalformedPct] = useState(10);
  const [enabled, setEnabled] = useState<Record<string, boolean>>(ALL_ON);
  const [unseenPct, setUnseenPct] = useState(0.05);
  const [hints, setHints] = useState(false);
  const [retries, setRetries] = useState(1);

  const s: ParserSetup = {
    malformed: malformedPct / 100,
    enabled,
    unseen: unseenPct / 100,
    quality: DEFAULTS.quality,
    hints,
  };
  const before = rawRate(s);
  const after = errorAfter(s);
  const residual = residualFraction(s);
  const rErr = retryError(s.malformed, retries);
  const rExtra = retryExtraCalls(s.malformed, retries);
  const failsPer100k = Math.round(after * 100000);
  const nOn = CLASSES.filter((c) => enabled[c.id]).length;

  return (
    <CacheWidgetFrame title="Defensive parser: errors before and after" hint="Illustrative model. Change the sliders.">
      <fieldset className="mb-3">
        <legend className="mb-1.5 text-sm text-muted">Patches switched on (each fixes one kind of mistake):</legend>
        <div className="grid gap-1.5 sm:grid-cols-2">
          {CLASSES.map((c) => (
            <label key={c.id} className="flex items-start gap-2 text-sm">
              <input
                type="checkbox"
                checked={!!enabled[c.id]}
                onChange={(e) => setEnabled({ ...enabled, [c.id]: e.target.checked })}
                className="mt-1 accent-[var(--accent)]"
              />
              <span>
                {c.label} <span className="text-muted">({c.weight}% of known mistakes)</span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="mb-3 grid gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor="a14p-m" className="mb-1 flex justify-between text-xs text-muted">
            <span>Share of outputs that are malformed</span>
            <span className="tabular-nums text-fg">{malformedPct}%</span>
          </label>
          <input id="a14p-m" type="range" min={1} max={20} step={1} value={malformedPct} onChange={(e) => setMalformedPct(+e.target.value)} className="w-full accent-[var(--accent)]" />
        </div>
        <div>
          <label htmlFor="a14p-u" className="mb-1 flex justify-between text-xs text-muted">
            <span>Mistakes nobody has seen yet (no patch exists)</span>
            <span className="tabular-nums text-fg">{unseenPct}% of mistakes</span>
          </label>
          <input id="a14p-u" type="range" min={0} max={5} step={0.05} value={unseenPct} onChange={(e) => setUnseenPct(+e.target.value)} className="w-full accent-[var(--accent)]" />
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={hints} onChange={(e) => setHints(e.target.checked)} className="accent-[var(--accent)]" />
          Add prompt hints (cut malformed outputs by 30%, assumed)
        </label>
        <div>
          <label htmlFor="a14p-r" className="mb-1 flex justify-between text-xs text-muted">
            <span>Compare: re-prompt up to this many times</span>
            <span className="tabular-nums text-fg">{retries}</span>
          </label>
          <input id="a14p-r" type="range" min={0} max={3} step={1} value={retries} onChange={(e) => setRetries(+e.target.value)} className="w-full accent-[var(--accent)]" />
        </div>
      </div>

      <div className="rounded-lg border p-3" style={{ borderColor: after <= 0.0002 ? 'var(--ok)' : 'var(--warn)' }} aria-live="polite">
        <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm sm:grid-cols-4">
          <div>
            <dt className="text-xs text-muted">Before the parser</dt>
            <dd className="font-semibold tabular-nums" data-testid="pp-before">{pct(before)}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted">After the parser</dt>
            <dd className="font-semibold tabular-nums" style={{ color: after <= 0.0002 ? 'var(--ok)' : 'var(--bad)' }} data-testid="pp-after">{pct(after)}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted">Mistakes left unfixed</dt>
            <dd className="font-semibold tabular-nums" data-testid="pp-resid">{(residual * 100).toFixed(2)}%</dd>
          </div>
          <div>
            <dt className="text-xs text-muted">Failed calls per 100,000</dt>
            <dd className="font-semibold tabular-nums" data-testid="pp-100k">{failsPer100k.toLocaleString('en-US')}</dd>
          </div>
        </dl>

        <div className="mt-3">
          <SketchSvg width={720} height={226} label="Log-scale bars: error rate before the parser, after the parser, and after re-prompting instead">
            {TICKS.map((t) => (
              <g key={t}>
                <SketchArrow points={[[px(t), 24], [px(t), 168]]} head="none" dashed stroke="var(--border)" seed={seedOf(`tk${t}`)} />
                <HandText x={px(t)} y={186} size={TEXT_SIZES.label} mono color="var(--muted)">
                  {t >= 0.01 ? `${t * 100}%` : `${(t * 100).toFixed(3).replace(/0+$/, '')}%`}
                </HandText>
              </g>
            ))}
            <Bar rate={before} y={48} tone="var(--bad)" label="No parser" />
            <Bar rate={after} y={92} tone="var(--ok)" label="Defensive parser" />
            <Bar rate={rErr} y={136} tone="var(--warn)" label={`Re-prompt x${retries}`} />
            <HandText x={X1} y={210} anchor="end" size={TEXT_SIZES.label} color="var(--muted)">
              share of calls that fail (log scale, each tick is 10x)
            </HandText>
          </SketchSvg>
        </div>
        <p className="mt-2 text-sm" data-testid="pp-note">
          After the parser, the failure rate is {oneIn(after)} calls ({nOn} of {CLASSES.length} patches on). Re-prompting up to {retries}{' '}
          {retries === 1 ? 'time' : 'times'} gives {pct(rErr)} if retries fail independently, and adds {(rExtra * 100).toFixed(1)}% more model calls. The parser adds no calls.
        </p>
      </div>
      <p className="mt-3 text-sm text-muted">
        Model, all illustrative except the 10% start and the 0.01% result that LinkedIn states. The mix of mistakes, the 99.95% chance that a patch repairs a case of its kind, and the 30% effect of hints are our assumptions. The share of mistakes left after the parser is the unseen share plus the repair misses on the patched kinds. The error rate after the parser is the malformed rate times that share. The retry line assumes every retry fails independently, which is optimistic, because the same prompt tends to cause the same mistake again.
      </p>
    </CacheWidgetFrame>
  );
}

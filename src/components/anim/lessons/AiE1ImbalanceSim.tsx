import { useState } from 'react';
import CacheWidgetFrame from './CacheWidgetFrame';
import { PAYMENTS, alwaysNo, confusion, metrics } from './AiE1ImbalanceLogic';

const pct = (x: number) => `${(x * 100).toFixed(1)}%`;

function Row({ name, acc, prec, rec, tone }: { name: string; acc: number; prec: number; rec: number; tone: string }) {
  return (
    <tr className="border-t border-line">
      <td className="py-1.5 pr-2" style={{ color: tone }}>{name}</td>
      <td className="py-1.5 pr-2 tabular-nums">{pct(acc)}</td>
      <td className="py-1.5 pr-2 tabular-nums">{pct(prec)}</td>
      <td className="py-1.5 tabular-nums">{pct(rec)}</td>
    </tr>
  );
}

/** Imbalance simulator. All rates are illustrative inputs. */
export default function AiE1ImbalanceSim() {
  const [rate, setRate] = useState(1);
  const [recall, setRecall] = useState(80);
  const [fpr, setFpr] = useState(1);
  const dumb = confusion(rate, 0, 0);
  const real = confusion(rate, recall / 100, fpr / 100);
  const md = metrics(alwaysNo(rate));
  const mr = metrics(real);
  return (
    <CacheWidgetFrame title="Accuracy on rare fraud" hint={`${PAYMENTS.toLocaleString('en-US')} payments, illustrative`}>
      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <label className="text-xs text-muted">
          <span className="flex justify-between"><span>Frauds per 1,000 payments</span><span className="tabular-nums text-fg">{rate}</span></span>
          <input type="range" min={1} max={100} value={rate} onChange={(e) => setRate(+e.target.value)} className="w-full accent-[var(--accent)]" />
        </label>
        <label className="text-xs text-muted">
          <span className="flex justify-between"><span>Model catches (recall)</span><span className="tabular-nums text-fg">{recall}%</span></span>
          <input type="range" min={0} max={100} value={recall} onChange={(e) => setRecall(+e.target.value)} className="w-full accent-[var(--accent)]" />
        </label>
        <label className="text-xs text-muted">
          <span className="flex justify-between"><span>Good payments wrongly flagged</span><span className="tabular-nums text-fg">{fpr}%</span></span>
          <input type="range" min={0} max={20} value={fpr} onChange={(e) => setFpr(+e.target.value)} className="w-full accent-[var(--accent)]" />
        </label>
      </div>
      <div className="overflow-x-auto" aria-live="polite">
        <table className="w-full min-w-[420px] text-sm">
          <thead className="text-left text-xs text-muted">
            <tr><th className="pb-1 pr-2 font-normal">Model</th><th className="pb-1 pr-2 font-normal">Accuracy</th><th className="pb-1 pr-2 font-normal">Precision</th><th className="pb-1 font-normal">Recall</th></tr>
          </thead>
          <tbody>
            <Row name="Always says not fraud" acc={md.accuracy} prec={md.precision} rec={md.recall} tone="var(--muted)" />
            <Row name="Your model" acc={mr.accuracy} prec={mr.precision} rec={mr.recall} tone="var(--accent)" />
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-sm">
        Of {dumb.fn.toLocaleString('en-US')} frauds, the always-no model misses all {dumb.fn.toLocaleString('en-US')}. Your model catches {real.tp.toLocaleString('en-US')} and flags {real.fp.toLocaleString('en-US')} good payments.
      </p>
      <p className="mt-2 text-sm text-muted">
        Precision is the share of flagged payments that are really fraud. Recall is the share of frauds that get flagged. Move the first slider up: the always-no model loses accuracy, which shows that accuracy only measures how rare fraud is.
      </p>
    </CacheWidgetFrame>
  );
}

import { useState } from 'react';
import CacheWidgetFrame from './CacheWidgetFrame';
import { LINT_BLOCKS, lintCost, MIN_CACHEABLE, type LintBlock } from './Ai4CacheMath';

const BAD = [0, 1, 2, 3, 4, 5, 6].map((i) => LINT_BLOCKS[i]);
const money = (n: number) => `$${n.toFixed(4)}`;

/** Drag (or use the arrows) to reorder the prompt. The cached prefix ends at the first block that changes between requests. */
export default function Ai4CacheLinter() {
  const [order, setOrder] = useState<LintBlock[]>(BAD);
  const [drag, setDrag] = useState<number | null>(null);
  const res = lintCost(order);
  let acc = 0;
  let broken = false;
  const flags = order.map((b) => {
    if (!b.stable) broken = true;
    const inPrefix = !broken && res.hit > 0;
    acc += b.tokens;
    return { inPrefix, upto: acc };
  });

  const move = (from: number, to: number) => {
    if (to < 0 || to >= order.length || from === to) return;
    const next = order.slice();
    const [x] = next.splice(from, 1);
    next.splice(to, 0, x);
    setOrder(next);
  };
  const sorted = () => setOrder([...order.filter((b) => b.stable), ...order.filter((b) => !b.stable)]);

  return (
    <CacheWidgetFrame title="Layout linter" hint="Sonnet 5.5, steady traffic, breakpoint at the end of the stable prefix">
      <div className="mb-3 flex flex-wrap gap-2 text-xs">
        <button type="button" onClick={sorted} className="rounded-md border border-line px-2.5 py-1.5 hover:bg-surface">Sort: stable first</button>
        <button type="button" onClick={() => setOrder(BAD)} className="rounded-md border border-line px-2.5 py-1.5 hover:bg-surface">Reset</button>
        <button type="button" onClick={() => setOrder(order.slice().sort((a, b) => b.tokens - a.tokens))} className="rounded-md border border-line px-2.5 py-1.5 hover:bg-surface">Sort: biggest first</button>
      </div>
      <ol className="space-y-1.5" aria-label="Prompt blocks, first to last">
        {order.map((b, i) => (
          <li
            key={b.id}
            draggable
            onDragStart={() => setDrag(i)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => {
              if (drag !== null) move(drag, i);
              setDrag(null);
            }}
            data-testid={`blk-${b.id}`}
            data-cached={flags[i].inPrefix ? '1' : '0'}
            className={`flex cursor-grab items-center gap-2 rounded-lg border px-3 py-2 text-sm ${flags[i].inPrefix ? 'border-ok bg-ok/10' : b.stable ? 'border-line bg-surface' : 'border-warn bg-warn/10'}`}
          >
            <span className="w-5 text-xs tabular-nums text-muted">{i + 1}</span>
            <span className="min-w-0 flex-1">
              <span className="font-medium">{b.label}</span>
              <span className="ml-2 text-xs text-muted">{b.note}</span>
            </span>
            <span className="font-mono text-xs tabular-nums text-muted">{b.tokens.toLocaleString('en-US')} tok</span>
            <span className={`w-20 text-right text-xs ${flags[i].inPrefix ? 'text-ok' : 'text-muted'}`}>{flags[i].inPrefix ? 'cache hit' : 'full price'}</span>
            <span className="flex">
              <button type="button" aria-label={`Move ${b.label} up`} onClick={() => move(i, i - 1)} className="px-1.5 text-muted hover:text-fg">↑</button>
              <button type="button" aria-label={`Move ${b.label} down`} onClick={() => move(i, i + 1)} className="px-1.5 text-muted hover:text-fg">↓</button>
            </span>
          </li>
        ))}
      </ol>
      <div className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
        <div className="rounded-lg border border-line bg-surface p-2.5">
          <div className="text-xs text-muted">Cached prefix</div>
          <div className="text-lg font-semibold tabular-nums" data-testid="lint-hit">{res.hit.toLocaleString('en-US')} tok</div>
          <div className="text-xs text-muted" data-testid="lint-share">{(res.hitShare * 100).toFixed(1)}% of {res.total.toLocaleString('en-US')}</div>
        </div>
        <div className="rounded-lg border border-line bg-surface p-2.5">
          <div className="text-xs text-muted">Input cost per request</div>
          <div className="text-lg font-semibold tabular-nums" data-testid="lint-cost">{money(res.cost)}</div>
          <div className="text-xs text-muted">no caching: {money(res.uncached)}</div>
        </div>
        <div className="rounded-lg border border-line bg-surface p-2.5">
          <div className="text-xs text-muted">Per 1,000 requests</div>
          <div className="text-lg font-semibold tabular-nums" data-testid="lint-1k">{`$${(res.cost * 1000).toFixed(2)}`}</div>
          <div className="text-xs text-muted">no caching: {`$${(res.uncached * 1000).toFixed(2)}`}</div>
        </div>
      </div>
      <p className="mt-3 text-xs leading-relaxed text-muted">
        Model: the cached prefix is every block before the first block that differs between requests, and it must reach {MIN_CACHEABLE} tokens. A hit costs $0.10 per million tokens, anything else $2. Cache writes and the 5-minute expiry are left out, so this is the cost once traffic is steady. Amber rows differ between requests.
      </p>
    </CacheWidgetFrame>
  );
}

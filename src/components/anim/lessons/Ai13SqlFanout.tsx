import { useState } from 'react';
import CacheWidgetFrame, { Seg } from './CacheWidgetFrame';

type Mode = 'base' | 'naive' | 'fix';

const ORDERS = [
  { id: 'o1', amount: 10 },
  { id: 'o2', amount: 10 },
  { id: 'o3', amount: 10 },
];
const PAYMENTS = [
  { id: 'p1', order: 'o1', method: 'card', amount: 6 },
  { id: 'p2', order: 'o1', method: 'gift', amount: 4 },
  { id: 'p3', order: 'o2', method: 'card', amount: 5 },
  { id: 'p4', order: 'o2', method: 'gift', amount: 5 },
  { id: 'p5', order: 'o3', method: 'card', amount: 7 },
  { id: 'p6', order: 'o3', method: 'gift', amount: 3 },
];

const SQL: Record<Mode, string> = {
  base: 'SELECT SUM(amount) FROM orders',
  naive: 'SELECT SUM(o.amount)\nFROM orders o JOIN payments p ON p.order_id = o.order_id',
  fix: 'SELECT SUM(o.amount)\nFROM orders o\nJOIN (SELECT order_id, SUM(amount) AS paid\n      FROM payments GROUP BY order_id) p\n  ON p.order_id = o.order_id',
};

/** Real rows, real sums: the join repeats each order row once per payment. */
export default function Ai13SqlFanout() {
  const [mode, setMode] = useState<Mode>('base');
  const rows =
    mode === 'naive'
      ? PAYMENTS.map((p) => ({ key: p.id, a: p.order, b: ORDERS.find((o) => o.id === p.order)!.amount, c: p.id }))
      : mode === 'fix'
        ? ORDERS.map((o) => ({ key: o.id, a: o.id, b: o.amount, c: `paid ${PAYMENTS.filter((p) => p.order === o.id).reduce((s, p) => s + p.amount, 0)}` }))
        : ORDERS.map((o) => ({ key: o.id, a: o.id, b: o.amount, c: '' }));
  const total = rows.reduce((s, r) => s + r.b, 0);
  const wrong = total !== 30;
  const tone = wrong ? 'var(--bad)' : 'var(--ok)';
  return (
    <CacheWidgetFrame title="A join that repeats rows" hint="Three orders, two payments each">
      <div className="mb-3 flex flex-wrap items-center gap-3 text-xs">
        <Seg
          label="Query"
          value={mode}
          options={[
            { id: 'base', label: 'Orders alone' },
            { id: 'naive', label: 'Join payments' },
            { id: 'fix', label: 'Fix: sum payments first' },
          ]}
          onChange={setMode}
        />
      </div>
      <pre className="mb-3 overflow-x-auto rounded-lg bg-surface p-3 font-mono text-[13px] leading-relaxed" data-testid="fo-sql">{SQL[mode]}</pre>
      <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm tabular-nums">
            <thead className="text-xs text-muted">
              <tr>
                <th className="py-1 pr-4 font-normal">order</th>
                <th className="py-1 pr-4 font-normal">o.amount</th>
                <th className="py-1 font-normal">{mode === 'naive' ? 'payment row' : mode === 'fix' ? 'one row per order' : ''}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.key} className="border-t border-line">
                  <td className="py-1 pr-4">{r.a}</td>
                  <td className="py-1 pr-4">{r.b}</td>
                  <td className="py-1 text-muted">{r.c}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="rounded-lg border p-3 text-center" style={{ borderColor: tone }} aria-live="polite">
          <div className="text-xs text-muted">SUM of order amounts</div>
          <div className="text-3xl font-semibold tabular-nums" style={{ color: tone }} data-testid="fo-total">{total}</div>
          <div className="text-xs text-muted" data-testid="fo-verdict">{wrong ? `wrong: true total is 30, rows ${rows.length}` : `correct, rows ${rows.length}`}</div>
        </div>
      </div>
      <p className="mt-3 text-sm text-muted">
        The join pairs each order with each of its payments, so an order with two payments appears twice and its amount is summed twice. Both queries are valid SQL and both run without an error. Only one is right.
      </p>
    </CacheWidgetFrame>
  );
}

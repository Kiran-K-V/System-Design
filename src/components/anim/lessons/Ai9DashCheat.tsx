/** Static cheat sheet. Each card names one metric, its unit, what it catches, and what it cannot see. */
interface Card {
  name: string;
  unit: string;
  catches: string;
  blind: string;
}

const CARDS: Card[] = [
  { name: 'TTFT p95', unit: 'seconds', catches: 'Queueing, long prompts, slow start of a stream', blind: 'Slow pace after the first token' },
  { name: 'TPOT p95', unit: 'ms per token', catches: 'Overloaded batches, slow decode, memory pressure', blind: 'Long waits before the first token' },
  { name: 'Good requests', unit: 'requests per second', catches: 'Throughput that rises while users suffer', blind: 'Wrong answers that are fast' },
  { name: 'Cache hit rate', unit: 'percent of input tokens', catches: 'A silent cache loss that doubles cost', blind: 'Answer quality' },
  { name: 'Errors by type', unit: 'count per type', catches: 'Rate limits, overload, spend caps, mid-stream failures', blind: 'Wrong answers sent with status 200' },
  { name: 'Backup share', unit: 'percent of traffic', catches: 'A failover nobody noticed', blind: 'Whether the backup answers well' },
  { name: 'Steps per run', unit: 'count, p95', catches: 'Agent loops and stuck runs', blind: 'Runs that are short and wrong' },
  { name: 'Queue depth', unit: 'waiting requests', catches: 'Saturation before TTFT breaks', blind: 'Which request type is the cause' },
  { name: 'MBU', unit: 'percent of peak bandwidth', catches: 'How close a self-hosted decode is to its real limit', blind: 'Queueing and prompt length' },
  { name: 'Budget burn', unit: 'rate vs even spend', catches: 'A loop or a leak that spends the month in days', blind: 'Cheap waste that stays under the line' },
];

export default function Ai9DashCheat() {
  return (
    <figure className="not-prose my-8 rounded-xl border border-line bg-bg p-3 sm:p-4">
      <figcaption className="mb-3 text-sm font-medium">Metric cheat sheet: what each number can and cannot see</figcaption>
      <div className="grid gap-3 sm:grid-cols-2">
        {CARDS.map((c) => (
          <div key={c.name} className="rounded-lg border border-line bg-surface p-3 text-sm">
            <div className="flex items-baseline justify-between gap-2">
              <span className="font-semibold">{c.name}</span>
              <span className="font-mono text-xs text-muted">{c.unit}</span>
            </div>
            <p className="mt-2">
              <span className="text-xs uppercase tracking-wide" style={{ color: 'var(--ok)' }}>Catches </span>
              {c.catches}
            </p>
            <p className="mt-1">
              <span className="text-xs uppercase tracking-wide" style={{ color: 'var(--bad)' }}>Blind to </span>
              {c.blind}
            </p>
          </div>
        ))}
      </div>
    </figure>
  );
}

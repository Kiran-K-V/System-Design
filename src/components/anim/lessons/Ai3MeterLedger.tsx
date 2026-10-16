import AnimFrame from '../AnimFrame';
import { HandText, SketchBox, SketchSvg, seedOf } from '../sketch';
import { PRICES, lineCosts, type Usage } from './Ai3MeterMath';

const P = PRICES.find((p) => p.id === 'sonnet')!;
const WARM: Usage = { input_tokens: 1000, output_tokens: 500, cache_creation_input_tokens: 0, cache_read_input_tokens: 8000 };
const COLD: Usage = { input_tokens: 1000, output_tokens: 500, cache_creation_input_tokens: 8000, cache_read_input_tokens: 0 };

interface Step {
  caption: string;
  usage: Usage;
  /** Rows shown: 0 = none, 1..4 = rows in order, 5 = total as well. */
  rows: number;
  active: number;
}

const steps: Step[] = [
  {
    caption:
      'One response from Sonnet 5.5 carries a usage object. These four counters are what the provider bills. This call hit a warm cache: 8,000 prompt tokens were read from it. Meter from these numbers, never from your own token estimate.',
    usage: WARM,
    rows: 0,
    active: -1,
  },
  {
    caption: 'Row 1: input_tokens. Only 1,000 tokens were new, and they pay the full input price of $2 per million. 1,000 x $2 / 1,000,000 = $0.0020.',
    usage: WARM,
    rows: 1,
    active: 0,
  },
  {
    caption: 'Row 2: cache_read_input_tokens. 8,000 cached tokens pay the cache-read price, $0.10 per million. That is 5% of the input price. 8,000 x $0.10 / 1,000,000 = $0.0008.',
    usage: WARM,
    rows: 2,
    active: 1,
  },
  {
    caption: 'Row 4: output_tokens. Output is priced highest, $10 per million. 500 x $10 / 1,000,000 = $0.0050. This one row is 64% of the bill. Row 3, cache_creation_input_tokens, is zero because nothing was written this time.',
    usage: WARM,
    rows: 4,
    active: 3,
  },
  {
    caption: 'The sum is $0.0078 for this request. Tag it with tenant, feature, and run id, and write one ledger row. Totals per tenant are sums of these rows.',
    usage: WARM,
    rows: 5,
    active: 4,
  },
  {
    caption:
      'The same request on the first, cold call. The 8,000 tokens are written to the cache at $2.50 per million (the 5-minute write price, 1.25 times input), so the row is $0.0200 and the total is $0.0270. That is 3.5 times the warm call. A cost estimate that ignores cache writes is too low on cold calls.',
    usage: COLD,
    rows: 5,
    active: 2,
  },
];

const BAR_X = 410;
const BAR_W = 220;
const usd = (v: number) => `$${v.toFixed(4)}`;
const n = (v: number) => v.toLocaleString('en-US');

export default function Ai3MeterLedger() {
  return (
    <AnimFrame title="Cost ledger for one Sonnet 5.5 request" steps={steps} interval={5200}>
      {(i, s) => {
        const c = lineCosts(s.usage, P);
        const MAX = Math.max(c.input, c.cacheRead, c.cacheWrite, c.output);
        const u = s.usage;
        const rows = [
          { label: 'Input', tok: u.input_tokens, rate: P.input, amt: c.input, color: 'var(--accent)' },
          { label: 'Cache read', tok: u.cache_read_input_tokens, rate: P.cacheRead, amt: c.cacheRead, color: 'var(--ok)' },
          { label: 'Cache write', tok: u.cache_creation_input_tokens, rate: P.cacheWrite, amt: c.cacheWrite, color: 'var(--warn)' },
          { label: 'Output', tok: u.output_tokens, rate: P.output, amt: c.output, color: 'var(--purple)' },
        ];
        const json = [
          `input_tokens: ${n(u.input_tokens)}`,
          `output_tokens: ${n(u.output_tokens)}`,
          `cache_creation_input_tokens: ${n(u.cache_creation_input_tokens)}`,
          `cache_read_input_tokens: ${n(u.cache_read_input_tokens)}`,
        ];
        return (
          <SketchSvg width={720} height={430} label="A ledger turns the four usage counters of one response into dollars">
            <SketchBox cx={250} cy={79} w={440} h={126} r={8} seed={seedOf('usage')} stroke="var(--muted)" />
            <HandText x={40} y={34} size={14} anchor="start" color="var(--muted)">usage</HandText>
            {json.map((line, k) => (
              <HandText key={k} x={40} y={58 + k * 22} size={14} anchor="start" mono color={s.rows === 0 ? 'var(--accent)' : 'var(--fg)'}>
                {line}
              </HandText>
            ))}
            <HandText x={500} y={79} size={14} anchor="start" color="var(--muted)">{i === 5 ? 'cold call' : 'warm call'}</HandText>
            {s.rows > 0 && <HandText x={150} y={162} size={14} anchor="start" color="var(--muted)">tokens x dollars per 1M tokens</HandText>}
            {rows.map((r, k) => {
              const shown = s.rows > k;
              const y = 190 + k * 46;
              if (!shown) return null;
              const isActive = s.active === k;
              const w = Math.max(r.amt > 0 ? 3 : 0, (r.amt / MAX) * BAR_W);
              return (
                <g key={r.label}>
                  <HandText x={24} y={y} size={16} anchor="start" color={isActive ? 'var(--accent)' : 'var(--fg)'}>{r.label}</HandText>
                  <HandText x={150} y={y} size={14} anchor="start" mono color="var(--muted)">{`${n(r.tok)} x $${r.rate.toFixed(2)}`}</HandText>
                  {w > 0 && <SketchBox cx={BAR_X + w / 2} cy={y} w={w} h={24} r={6} seed={seedOf(`bar${k}`)} stroke={r.color} fill={r.color} strokeWidth={isActive ? 2.2 : 1.4} />}
                  <HandText x={696} y={y} size={14} anchor="end" mono color={isActive ? 'var(--accent)' : 'var(--fg)'}>{usd(r.amt)}</HandText>
                </g>
              );
            })}
            {s.rows >= 5 && (
              <g>
                <HandText x={24} y={386} size={18} anchor="start" color="var(--accent)">Total</HandText>
                <HandText x={696} y={386} size={18} anchor="end" mono color="var(--accent)">{usd(c.total)}</HandText>
              </g>
            )}
          </SketchSvg>
        );
      }}
    </AnimFrame>
  );
}

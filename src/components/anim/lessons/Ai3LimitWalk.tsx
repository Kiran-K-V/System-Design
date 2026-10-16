import AnimFrame from '../AnimFrame';
import { HandText, SketchBox, SketchSvg, TEXT_SIZES, seedOf } from '../sketch';

type Tone = 'idle' | 'active' | 'ok' | 'bad' | 'warn';
interface Step {
  caption: string;
  /** Remaining fraction of each bucket: requests, input tokens, output tokens. */
  rem: [number, number, number];
  labels: [string, string, string];
  bind?: 0 | 1 | 2;
  outcome: string;
  tone: Tone;
}

// Start tier, Opus 5.5: 1,000 RPM, 2,000,000 ITPM, 400,000 OTPM. Each request: 4,000 input tokens, 500 output tokens.
const steps: Step[] = [
  {
    caption: 'Three buckets, all full. These are the Start tier limits for Opus 5.5 on the rate limits page: 1,000 requests, 2,000,000 input tokens, and 400,000 output tokens per minute. Each bucket refills continuously, not at the minute mark.',
    rem: [1, 1, 1], labels: ['1,000', '2.0M', '400K'], outcome: 'idle', tone: 'idle',
  },
  {
    caption: '300 requests arrive at the same moment. Each has 4,000 uncached input tokens and returns 500 output tokens. They use 300 requests, 1.2M input tokens, and 150K output tokens. All pass. A burst is fine while the buckets hold tokens.',
    rem: [0.7, 0.4, 0.625], labels: ['700', '0.8M', '250K'], outcome: '300 x 200 OK', tone: 'ok',
  },
  {
    caption: '200 more arrive. They need 800K input tokens, exactly what is left, so they pass. Request 501 finds the input bucket empty and gets 429 with a retry-after header. Requests and output still have room. Input tokens are the binding limit.',
    rem: [0.5, 0, 0.375], labels: ['500', '0', '150K'], bind: 1, outcome: '501st: 429 + retry-after', tone: 'bad',
  },
  {
    caption: 'The input bucket refills at 2,000,000 / 60, about 33,000 tokens a second. After 12 seconds it holds about 400K tokens, room for about 100 more requests. Waiting for the header value works. Retrying sooner fails again.',
    rem: [0.7, 0.2, 0.575], labels: ['700', '0.4M', '230K'], outcome: 'wait, then 200 OK', tone: 'ok',
  },
  {
    caption: 'Start again with full buckets, and cache the shared prompt. 80% of each input, 3,200 of 4,000 tokens, is a cache read. Cache reads do not count toward ITPM on this model. Only 800 count, so 2M of ITPM fits 2,500 requests. Output now binds: 400K / 500 = 800 requests a minute, up from 500.',
    rem: [0.2, 0.68, 0], labels: ['200', '1.36M', '0'], bind: 2, outcome: '800 requests, then 429', tone: 'warn',
  },
  {
    caption: 'A different 429. The organization reached its monthly spend cap. The error code is enforced_spend_limit_reached and there is no retry-after header. Every request fails until the first of the month. Stop retrying, alert a person, and fail fast or switch provider.',
    rem: [1, 1, 1], labels: ['full', 'full', 'full'], outcome: '429, no retry-after, do not retry', tone: 'bad',
  },
];

const col = (t: Tone) => (t === 'active' ? 'var(--accent)' : t === 'ok' ? 'var(--ok)' : t === 'bad' ? 'var(--bad)' : t === 'warn' ? 'var(--warn)' : 'var(--muted)');
const NAMES = ['Requests', 'Input tokens', 'Output tokens'];
const TRACK = 440;
const X0 = 150;

export default function Ai3LimitWalk() {
  return (
    <AnimFrame title="Three token buckets, one 429" steps={steps}>
      {(i, s) => {
        const spend = i === steps.length - 1;
        return (
          <SketchSvg width={720} height={280} label={`Rate limit buckets. ${NAMES.map((n, k) => `${n} ${s.labels[k]}`).join(', ')}. ${s.outcome}`}>
            {NAMES.map((n, k) => {
              const cy = 50 + k * 62;
              const f = spend ? 1 : s.rem[k];
              const bound = s.bind === k;
              const tone = spend ? 'var(--muted)' : bound ? 'var(--bad)' : 'var(--accent)';
              const w = Math.max(f * TRACK, 4);
              return (
                <g key={n}>
                  <HandText x={20} y={cy} size={TEXT_SIZES.label} anchor="start">{n}</HandText>
                  <SketchBox cx={X0 + TRACK / 2} cy={cy} w={TRACK} h={34} r={6} seed={seedOf(`trk${k}`)} stroke="var(--muted)" dashed />
                  <SketchBox cx={X0 + w / 2} cy={cy} w={w} h={34} r={6} seed={seedOf(`fill${k}${i}`)} stroke={tone} fill={f > 0 ? tone : undefined} strokeWidth={bound ? 2.2 : 1.4} />
                  <HandText x={X0 + TRACK + 14} y={cy} size={TEXT_SIZES.label} anchor="start" color={bound ? 'var(--bad)' : 'var(--fg)'} mono>{s.labels[k]}</HandText>
                </g>
              );
            })}
            <SketchBox cx={360} cy={238} w={440} h={44} r={8} seed={seedOf(`out${i}`)} stroke={col(s.tone)} fill={s.tone === 'idle' ? undefined : col(s.tone)} strokeWidth={2.2} />
            <HandText x={360} y={238} size={TEXT_SIZES.label}>{s.outcome}</HandText>
          </SketchSvg>
        );
      }}
    </AnimFrame>
  );
}

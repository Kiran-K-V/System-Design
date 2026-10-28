import AnimFrame from '../AnimFrame';
import { HandText, SketchArrow, SketchBox, SketchSvg, TEXT_SIZES, seedOf } from '../sketch';

// Illustrative trace of one streamed request, in milliseconds.
const QUEUE_END = 250;
const FIRST = 850;
const GAP = 100;
const N = 8;
const END = FIRST + GAP * (N - 1); // 1550
const X0 = 60;
const PX = 600 / END;
const x = (ms: number) => X0 + ms * PX;
const tokenAt = (i: number) => FIRST + GAP * i;

interface Step {
  caption: string;
  upTo: number; // ms drawn so far
  mark?: 'queue' | 'ttft' | 'tpot' | 'e2e';
}

const steps: Step[] = [
  { caption: 'A user sends a prompt. The clock starts on the client at 0 ms. The server answers by streaming tokens, so there are two clocks to read, not one. (The numbers in this trace are made up for the picture.)', upTo: 0 },
  { caption: 'The engine is busy, so the request waits in its queue for 250 ms. A waiting request has no GPU work yet, but the user already feels it: this wait is part of time to first token.', upTo: QUEUE_END, mark: 'queue' },
  { caption: 'Prefill: the engine reads the whole prompt in one pass and builds the KV cache. It takes 600 ms here. Nothing is shown to the user during this time.', upTo: FIRST - 1 },
  { caption: 'The first token appears at 850 ms. That span, from send to first token, is TTFT: queue wait plus prefill. Long prompts and a long queue both push it up.', upTo: FIRST, mark: 'ttft' },
  { caption: 'Decode: one token about every 100 ms. That gap is TPOT, time per output token. A TPOT of 100 ms is 10 tokens per second for this user, which is faster than most people read. The gap is the same for each token only when the batch is steady.', upTo: END - GAP, mark: 'tpot' },
  { caption: 'The last token lands at 1,550 ms. Whole-request time is close to TTFT plus TPOT times the number of tokens. A chat product cares about TTFT (does it feel alive?) and TPOT (does it read smoothly?). A batch job cares about neither.', upTo: END, mark: 'e2e' },
];

export default function AiE3TraceMarks() {
  return (
    <AnimFrame title="One request, two clocks: TTFT and TPOT" steps={steps} interval={5500}>
      {(_i, s) => {
        const t = s.upTo;
        const showQ = t >= QUEUE_END;
        const showP = t >= QUEUE_END + 1;
        const toks = Array.from({ length: N }, (_, k) => k).filter((k) => tokenAt(k) <= t);
        return (
          <SketchSvg width={720} height={376} label="Timeline of one streamed request with queue, prefill, first token and later tokens">
            <HandText x={24} y={34} anchor="start" size={TEXT_SIZES.heading} color="var(--fg)">Server side</HandText>
            {showQ && <SketchBox cx={(x(0) + x(QUEUE_END)) / 2} cy={84} w={x(QUEUE_END) - x(0) - 3} h={44} r={8} seed={seedOf('e3t-q')} stroke="var(--warn)" fill="var(--warn)" dashed />}
            {showQ && <HandText x={(x(0) + x(QUEUE_END)) / 2} y={84} size={TEXT_SIZES.label} color="var(--fg)">queue</HandText>}
            {showP && <SketchBox cx={(x(QUEUE_END) + x(Math.min(t, FIRST - 1))) / 2 + 1} cy={84} w={Math.max(8, x(Math.min(t, FIRST - 1)) - x(QUEUE_END) - 3)} h={44} r={8} seed={seedOf('e3t-p')} stroke="var(--accent)" fill="var(--accent)" />}
            {t >= FIRST - 1 && <HandText x={(x(QUEUE_END) + x(FIRST)) / 2} y={84} size={TEXT_SIZES.label} color="var(--fg)">prefill</HandText>}
            {t >= FIRST && <SketchBox cx={(x(FIRST) + x(t)) / 2 + 20} cy={84} w={Math.max(8, x(t) - x(FIRST) + 40 - 3)} h={44} r={8} seed={seedOf('e3t-d')} stroke="var(--ok)" fill="var(--ok)" />}
            {t >= FIRST + 300 && <HandText x={(x(FIRST) + x(t)) / 2 + 20} y={84} size={TEXT_SIZES.label} color="var(--fg)">decode</HandText>}

            <HandText x={24} y={150} anchor="start" size={TEXT_SIZES.heading} color="var(--fg)">What the user sees</HandText>
            {toks.map((k) => (
              <SketchBox key={k} cx={x(tokenAt(k))} cy={196} w={30} h={30} r={6} seed={seedOf(`e3t-tok-${k}`)} stroke={k === 0 && s.mark === 'ttft' ? 'var(--accent)' : 'var(--ok)'} fill={k === 0 && s.mark === 'ttft' ? 'var(--accent)' : 'var(--ok)'} />
            ))}
            {toks.length > 0 && <HandText x={x(FIRST)} y={226} size={TEXT_SIZES.note} color="var(--muted)">token 1</HandText>}

            <line x1={x(0)} x2={x(END)} y1={250} y2={250} stroke="var(--border)" strokeWidth={1.4} />
            {[0, 500, 1000, 1500].map((ms) => (
              <HandText key={ms} x={x(ms)} y={266} size={TEXT_SIZES.note} mono color="var(--muted)">{`${ms} ms`}</HandText>
            ))}

            {s.mark === 'queue' && <HandText x={(x(0) + x(QUEUE_END)) / 2 + 60} y={310} size={TEXT_SIZES.label} color="var(--warn)">waiting: counts toward TTFT</HandText>}
            {(s.mark === 'ttft' || s.mark === 'tpot' || s.mark === 'e2e') && (
              <>
                <SketchArrow points={[[x(0), 296], [x(FIRST), 296]]} head="both" seed={seedOf('e3t-a1')} stroke={s.mark === 'ttft' ? 'var(--accent)' : 'var(--muted)'} strokeWidth={s.mark === 'ttft' ? 2.2 : 1.4} />
                <HandText x={x(FIRST / 2)} y={320} size={TEXT_SIZES.label} color={s.mark === 'ttft' ? 'var(--accent)' : 'var(--muted)'}>TTFT 850 ms</HandText>
              </>
            )}
            {(s.mark === 'tpot' || s.mark === 'e2e') && (
              <>
                <SketchArrow points={[[x(tokenAt(2)), 296], [x(tokenAt(3)), 296]]} head="both" seed={seedOf('e3t-a2')} stroke={s.mark === 'tpot' ? 'var(--accent)' : 'var(--muted)'} strokeWidth={s.mark === 'tpot' ? 2.2 : 1.4} />
                <HandText x={x(tokenAt(2.5))} y={320} size={TEXT_SIZES.label} color={s.mark === 'tpot' ? 'var(--accent)' : 'var(--muted)'}>TPOT 100 ms</HandText>
              </>
            )}
            {s.mark === 'e2e' && (
              <>
                <SketchArrow points={[[x(0), 344], [x(END), 344]]} head="both" seed={seedOf('e3t-a3')} stroke="var(--accent)" strokeWidth={2.2} />
                <HandText x={x(END / 2)} y={364} size={TEXT_SIZES.note} color="var(--accent)">whole request 1,550 ms</HandText>
              </>
            )}
          </SketchSvg>
        );
      }}
    </AnimFrame>
  );
}

import AnimFrame from '../AnimFrame';
import { HandText, SketchArrow, SketchBox, SketchSvg, TEXT_SIZES, seedOf } from '../sketch';

/** Illustrative timings, except the output guard model: Cloudflare says a hosted Llama Guard 3 8B check adds "approximately 500 milliseconds". */
const NODES = [
  { id: 'ir', label: 'Input\nrules', ms: 2 },
  { id: 'ig', label: 'Input\nguard', ms: 40 },
  { id: 'mm', label: 'Main\nmodel', ms: 0 },
  { id: 'or', label: 'Output\nrules', ms: 1 },
  { id: 'og', label: 'Output\nguard', ms: 500 },
];

interface Step {
  caption: string;
  /** Index of the active node, or -1 before the request starts. */
  active: number;
  blocked?: boolean;
}

const steps: Step[] = [
  { caption: 'A request arrives. Five stages sit on its path. The two input stages run before the main model. The two output stages run after it. The guard time budget for this product is 600 ms.', active: -1 },
  { caption: 'Input rules run first. They are plain code: a length limit, a regex for card numbers, an allow list of file types. Cost: about 2 ms. Nothing here needs a model.', active: 0 },
  { caption: 'The input guard is a small classifier model. It scores the text for abuse or injection. Cost: about 40 ms in this example. It passes the request, so the main model may run.', active: 1 },
  { caption: 'The main model writes the answer. Its time is not guard time, so the bar does not move. All 42 ms spent so far was the price of not trusting the input.', active: 2 },
  { caption: 'Output rules check the shape of the answer: valid JSON, no leaked internal ids, no banned words. Cost: about 1 ms. Cheap checks first means a bad answer is often stopped here.', active: 3 },
  { caption: 'The output guard is a hosted guard model. Cloudflare says such a check typically adds about 500 ms. Total guard time is now 543 ms, close to the 600 ms budget. One stage cost more than all the others together.', active: 4 },
  { caption: 'A different request: the input guard flags it. The pipeline stops there. The main model and the output stages never run, so a blocked request costs 42 ms and no model tokens.', active: 1, blocked: true },
];

const X0 = 24;
const BW = 112;
const GAP = 28;
const TRACK = 640;
const MAX_MS = 700;

function cumMs(active: number, blocked?: boolean): number {
  let t = 0;
  for (let i = 0; i <= active; i++) t += NODES[i].ms;
  return blocked ? 42 : t;
}

export default function Ai9GuardPipe() {
  return (
    <AnimFrame title="A request through four guard stages, with timers" steps={steps} interval={5000}>
      {(_, s) => {
        const cum = s.active < 0 ? 0 : cumMs(s.active, s.blocked);
        const w = Math.max((cum / MAX_MS) * TRACK, 4);
        const tone = s.blocked ? 'var(--bad)' : cum > 540 ? 'var(--warn)' : 'var(--accent)';
        return (
          <SketchSvg width={720} height={300} label={`Guard time so far: ${cum} milliseconds.`}>
            {NODES.map((n, i) => {
              const cx = X0 + BW / 2 + i * (BW + GAP);
              const on = s.active === i;
              const done = s.active > i && !s.blocked;
              const skipped = s.blocked && i > 1;
              const stroke = on ? (s.blocked ? 'var(--bad)' : 'var(--accent)') : done ? 'var(--ok)' : 'var(--muted)';
              return (
                <g key={n.id}>
                  <SketchBox cx={cx} cy={70} w={BW} h={60} r={8} seed={seedOf(`gp${n.id}`)} stroke={stroke} fill={on ? stroke : undefined} dashed={skipped} strokeWidth={on ? 2.2 : 1.4} />
                  <HandText x={cx} y={70} size={TEXT_SIZES.label} color={skipped ? 'var(--muted)' : 'var(--fg)'}>
                    {n.label}
                  </HandText>
                  <HandText x={cx} y={116} size={TEXT_SIZES.note} mono color={on || done ? 'var(--fg)' : 'var(--muted)'}>
                    {n.id === 'mm' ? 'not guard time' : `${n.ms} ms`}
                  </HandText>
                  {i < NODES.length - 1 && <SketchArrow points={[[cx + BW / 2 + 4, 70], [cx + BW / 2 + GAP - 4, 70]]} seed={seedOf(`gpa${i}`)} stroke="var(--muted)" dashed={skipped} />}
                </g>
              );
            })}
            <HandText x={X0} y={170} anchor="start" size={TEXT_SIZES.label}>
              Guard time so far
            </HandText>
            <SketchBox cx={X0 + TRACK / 2} cy={208} w={TRACK} h={30} r={6} seed={seedOf('gptrack')} stroke="var(--muted)" dashed />
            <SketchBox cx={X0 + w / 2} cy={208} w={w} h={30} r={6} seed={seedOf(`gpbar${cum}`)} stroke={tone} fill={tone} strokeWidth={2.2} />
            <SketchBox cx={X0 + (600 / MAX_MS) * TRACK} cy={208} w={2} h={44} r={1} seed={seedOf('gpbud')} stroke="var(--bad)" />
            <HandText x={X0 + (600 / MAX_MS) * TRACK} y={246} size={TEXT_SIZES.note} color="var(--bad)">
              budget 600 ms
            </HandText>
            <HandText x={X0} y={246} anchor="start" size={TEXT_SIZES.label} mono color={tone}>
              {`${cum} ms${s.blocked ? '  blocked, model skipped' : ''}`}
            </HandText>
          </SketchSvg>
        );
      }}
    </AnimFrame>
  );
}

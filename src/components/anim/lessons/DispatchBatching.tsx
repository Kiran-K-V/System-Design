import AnimFrame from '../AnimFrame';
import { HandText, SketchArrow, SketchBox, SketchEllipse, SketchSvg, TEXT_SIZES, seedOf, type Pt } from '../sketch';

type Tone = 'accent' | 'ok' | 'bad' | 'warn' | 'muted';
const COLOR: Record<Tone, string> = {
  accent: 'var(--accent)',
  ok: 'var(--ok)',
  bad: 'var(--bad)',
  warn: 'var(--warn)',
  muted: 'var(--muted)',
};

const POS = {
  a: [300, 150] as Pt,
  b: [620, 250] as Pt,
  o1: [430, 175] as Pt,
  o2: [160, 110] as Pt,
  o3: [520, 100] as Pt,
};

interface Line {
  pts: Pt[];
  tone: Tone;
  dashed?: boolean;
}

interface Scene {
  caption: string;
  tones: Partial<Record<keyof typeof POS, Tone>>;
  lines: Line[];
  notes?: { x: number; y: number; text: string; tone: Tone }[];
  /** Orders that have not arrived yet are drawn dashed. */
  hidden?: (keyof typeof POS)[];
}

const AB: Pt[] = [
  [POS.a[0] + 38, POS.a[1] - 4],
  [POS.o1[0] - 44, POS.o1[1] - 6],
];

const scenes: Scene[] = [
  {
    caption: 'Two riders (circles) are free. Three orders (boxes) will arrive one after another. Orders 1 and 3 come from restaurants that are close to each other. Rider A is close to orders 1 and 2.',
    tones: {},
    lines: [],
    hidden: ['o1', 'o2', 'o3'],
  },
  {
    caption: 'Greedy, step 1. Order 1 arrives. The nearest free rider is A, so A takes it. This looks right.',
    tones: { o1: 'accent', a: 'ok' },
    lines: [{ pts: AB, tone: 'ok' }],
    hidden: ['o2', 'o3'],
  },
  {
    caption: 'Greedy, step 2. Order 2 arrives. Rider A is busy. Only rider B is free, and B is very far from this restaurant. The long path is the price of the first choice.',
    tones: { o1: 'ok', o2: 'accent', a: 'ok', b: 'bad' },
    lines: [
      { pts: AB, tone: 'ok' },
      { pts: [[POS.b[0] - 36, POS.b[1] + 8], [400, 292], [POS.o2[0] + 6, POS.o2[1] + 26]], tone: 'bad' },
    ],
    hidden: ['o3'],
  },
  {
    caption: 'Greedy, step 3. Order 3 arrives. Both riders are busy, so it waits. Its restaurant is next to order 1, but rider A has already left.',
    tones: { o1: 'ok', o2: 'ok', o3: 'warn', a: 'ok', b: 'bad' },
    lines: [
      { pts: AB, tone: 'ok' },
      { pts: [[POS.b[0] - 36, POS.b[1] + 8], [400, 292], [POS.o2[0] + 6, POS.o2[1] + 26]], tone: 'bad' },
    ],
    notes: [{ x: POS.o3[0], y: POS.o3[1] - 40, text: 'no rider free', tone: 'warn' }],
  },
  {
    caption: 'Each greedy choice was the best one at that moment. Together they gave one very long ride, one stranded order, and cold food waiting for a rider.',
    tones: { o1: 'ok', o2: 'bad', o3: 'bad', a: 'ok', b: 'bad' },
    lines: [
      { pts: AB, tone: 'ok' },
      { pts: [[POS.b[0] - 36, POS.b[1] + 8], [400, 292], [POS.o2[0] + 6, POS.o2[1] + 26]], tone: 'bad' },
    ],
    notes: [{ x: 360, y: 24, text: 'Greedy: much waiting overall', tone: 'bad' }],
  },
  {
    caption: 'Batched, step 1. Now the system holds new orders for a short window before it decides. All three orders are on the table at once, and both riders are still free.',
    tones: { o1: 'accent', o2: 'accent', o3: 'accent' },
    lines: [],
    notes: [{ x: 360, y: 24, text: 'Wait a short window, then decide together', tone: 'accent' }],
  },
  {
    caption: 'Batched, step 2. One matching problem: rider A takes order 2, which is close. Rider B takes orders 1 and 3 together as one batch, because those restaurants are neighbors. Nobody is stranded.',
    tones: { o1: 'ok', o2: 'ok', o3: 'ok', a: 'ok', b: 'ok' },
    lines: [
      { pts: [[POS.a[0] - 38, POS.a[1] - 14], [POS.o2[0] + 40, POS.o2[1] + 16]], tone: 'ok' },
      { pts: [[POS.b[0] - 36, POS.b[1] - 14], [POS.o1[0] + 40, POS.o1[1] + 14]], tone: 'ok' },
      { pts: [[POS.o1[0] + 30, POS.o1[1] - 20], [POS.o3[0] - 30, POS.o3[1] + 18]], tone: 'ok', dashed: true },
    ],
    notes: [{ x: 360, y: 24, text: 'Batched: less waiting overall', tone: 'ok' }],
  },
  {
    caption: 'The trade. Order 1 waited a little for the window to close, so its first step is slightly later. In return, the total wait for all customers is shorter and no restaurant keeps food waiting for a far rider.',
    tones: { o1: 'warn', o2: 'ok', o3: 'ok', a: 'ok', b: 'ok' },
    lines: [
      { pts: [[POS.a[0] - 38, POS.a[1] - 14], [POS.o2[0] + 40, POS.o2[1] + 16]], tone: 'ok' },
      { pts: [[POS.b[0] - 36, POS.b[1] - 14], [POS.o1[0] + 40, POS.o1[1] + 14]], tone: 'ok' },
      { pts: [[POS.o1[0] + 30, POS.o1[1] - 20], [POS.o3[0] - 30, POS.o3[1] + 18]], tone: 'ok', dashed: true },
    ],
    notes: [
      { x: 360, y: 24, text: 'A short delay bought a better result', tone: 'ok' },
      { x: POS.o1[0] - 40, y: POS.o1[1] + 62, text: 'waited for the window', tone: 'warn' },
    ],
  },
];

const steps = scenes.map((s) => ({ caption: s.caption }));

const NAMES: Record<keyof typeof POS, string> = { a: 'Rider A', b: 'Rider B', o1: 'Order 1', o2: 'Order 2', o3: 'Order 3' };

export default function DispatchBatching() {
  return (
    <AnimFrame title="Greedy assignment versus a batched window" steps={steps} interval={4200}>
      {(i) => {
        const s = scenes[i];
        return (
          <SketchSvg width={720} height={320} label="Three orders and two riders on a small map. Greedy assignment leaves one rider on a long trip and one order waiting. A batched window pairs them with less waiting.">
            {s.lines.map((l, k) => (
              <SketchArrow key={`l${i}-${k}`} points={l.pts} stroke={COLOR[l.tone]} strokeWidth={2.2} dashed={l.dashed} seed={seedOf(`dispatch-line-${i}-${k}`)} />
            ))}
            {(Object.keys(POS) as (keyof typeof POS)[]).map((id) => {
              const [x, y] = POS[id];
              const tone = s.tones[id] ?? 'muted';
              const rider = id === 'a' || id === 'b';
              const hidden = s.hidden?.includes(id);
              const common = { fill: tone === 'muted' ? 'var(--surface)' : COLOR[tone], stroke: COLOR[tone], strokeWidth: tone === 'accent' ? 2.2 : 1.4 };
              return (
                <g key={id} opacity={hidden ? 0.55 : 1}>
                  {rider ? (
                    <SketchEllipse cx={x} cy={y} w={76} h={46} seed={seedOf(`dispatch-${id}`)} {...common} />
                  ) : (
                    <SketchBox cx={x} cy={y} w={82} h={38} r={8} seed={seedOf(`dispatch-${id}`)} dashed={hidden} {...common} />
                  )}
                  <HandText x={x} y={y} size={TEXT_SIZES.label}>
                    {NAMES[id]}
                  </HandText>
                </g>
              );
            })}
            {(s.notes ?? []).map((n) => (
              <HandText key={n.text} x={n.x} y={n.y} size={TEXT_SIZES.heading} color={COLOR[n.tone]}>
                {n.text}
              </HandText>
            ))}
          </SketchSvg>
        );
      }}
    </AnimFrame>
  );
}

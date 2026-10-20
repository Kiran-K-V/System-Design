import AnimFrame from '../AnimFrame';
import { HandText, SketchArrow, SketchBox, SketchSvg, STROKE, TEXT_SIZES, seedOf } from '../sketch';
import { prefixCost } from './Ai14SidekickMath';

/**
 * Two prompt layouts, one rule change. All token sizes are illustrative.
 * Prices: Claude Sonnet 5.5, as of 2026-10-20 (platform.claude.com/docs/en/about-claude/pricing): read $0.10, 5-minute write $2.50 per million tokens.
 */

type Tone = 'ok' | 'bad' | 'warn' | 'accent' | 'muted';
type Block = { label: string; tag: string; tone: Tone };
interface Step {
  caption: string;
  left: Block[];
  right: Block[];
  note?: { left?: string; right?: string };
  store?: Tone;
  arrow?: boolean;
}

const L_COST = prefixCost(15000, 10000);
const R_COST = prefixCost(20000, 0);
const money = (v: number) => `$${v.toFixed(4)}`;

const STEPS: Step[] = [
  {
    caption: 'Request 1. Both designs send tool schemas, system rules, and history, then the new turn. The provider stores the prefix, which is everything before the new turn. Our token sizes are illustrative. The giant prompt holds every rule (6,000 tokens). The just-in-time prompt holds only core behavior (1,000).',
    left: [
      { label: 'Tools, 15,000', tag: 'written', tone: 'warn' },
      { label: 'All rules, 6,000', tag: 'written', tone: 'warn' },
      { label: 'History, 4,000', tag: 'written', tone: 'warn' },
      { label: 'New turn', tag: 'billed', tone: 'accent' },
    ],
    right: [
      { label: 'Tools, 15,000', tag: 'written', tone: 'warn' },
      { label: 'Core rules, 1,000', tag: 'written', tone: 'warn' },
      { label: 'History, 4,000', tag: 'written', tone: 'warn' },
      { label: 'New turn', tag: 'billed', tone: 'accent' },
    ],
  },
  {
    caption: 'A rule changes, for example a beta flag turns on a feature that needs new guidance. The giant prompt must edit its system block. The just-in-time design edits an instruction store instead. Nothing in the stored prefix changes.',
    left: [
      { label: 'Tools, 15,000', tag: 'same', tone: 'muted' },
      { label: 'All rules, 6,000', tag: 'edited', tone: 'warn' },
      { label: 'History, 4,000', tag: 'same', tone: 'muted' },
      { label: 'New turn', tag: 'waits', tone: 'muted' },
    ],
    right: [
      { label: 'Tools, 15,000', tag: 'same', tone: 'muted' },
      { label: 'Core rules, 1,000', tag: 'same', tone: 'muted' },
      { label: 'History, 4,000', tag: 'same', tone: 'muted' },
      { label: 'New turn', tag: 'waits', tone: 'muted' },
    ],
    store: 'warn',
  },
  {
    caption: 'Request 2, giant prompt. The tool block still matches, so it is a cache hit. The system block differs, so the match stops there. The system block and the history after it are written again at the write price. Cost of the prefix: 15,000 x $0.10 plus 10,000 x $2.50, per million, which is $0.0265.',
    left: [
      { label: 'Tools, 15,000', tag: 'hit', tone: 'ok' },
      { label: 'All rules, 6,000', tag: 'miss', tone: 'bad' },
      { label: 'History, 4,000', tag: 'miss', tone: 'bad' },
      { label: 'New turn', tag: 'billed', tone: 'accent' },
    ],
    right: [
      { label: 'Tools, 15,000', tag: '', tone: 'muted' },
      { label: 'Core rules, 1,000', tag: '', tone: 'muted' },
      { label: 'History, 4,000', tag: '', tone: 'muted' },
      { label: 'New turn', tag: '', tone: 'muted' },
    ],
    note: { left: `prefix ${money(L_COST)}` },
  },
  {
    caption: 'Request 2, just-in-time. The prefix is byte for byte the same, so all 20,000 tokens are hits at the read price: 20,000 x $0.10 per million is $0.0020. The new rule arrives inside the tool result, at the tail, where no cache entry exists yet. The model sees it exactly when it calls that tool.',
    left: [
      { label: 'Tools, 15,000', tag: '', tone: 'muted' },
      { label: 'All rules, 6,000', tag: '', tone: 'muted' },
      { label: 'History, 4,000', tag: '', tone: 'muted' },
      { label: 'New turn', tag: '', tone: 'muted' },
    ],
    right: [
      { label: 'Tools, 15,000', tag: 'hit', tone: 'ok' },
      { label: 'Core rules, 1,000', tag: 'hit', tone: 'ok' },
      { label: 'History, 4,000', tag: 'hit', tone: 'ok' },
      { label: 'Tool result + rule', tag: 'new', tone: 'accent' },
    ],
    store: 'accent',
    arrow: true,
    note: { right: `prefix ${money(R_COST)}` },
  },
  {
    caption: `Make the change happen on every request, as with the post's examples: beta flags, model versions, page context. The giant prompt then misses from the system block on each request: 1,000 requests cost about $${(L_COST * 1000).toFixed(2)} of prefix. The just-in-time design costs about $${(R_COST * 1000).toFixed(2)}, which is ${(L_COST / R_COST).toFixed(1)} times less. Our reading, with assumed sizes. The post gives no cache numbers.`,
    left: [
      { label: 'Tools, 15,000', tag: 'hit', tone: 'ok' },
      { label: 'All rules, 6,000', tag: 'miss', tone: 'bad' },
      { label: 'History, 4,000', tag: 'miss', tone: 'bad' },
      { label: 'New turn', tag: 'billed', tone: 'accent' },
    ],
    right: [
      { label: 'Tools, 15,000', tag: 'hit', tone: 'ok' },
      { label: 'Core rules, 1,000', tag: 'hit', tone: 'ok' },
      { label: 'History, 4,000', tag: 'hit', tone: 'ok' },
      { label: 'Tool result + rule', tag: 'new', tone: 'accent' },
    ],
    note: { left: `1,000 requests: $${(L_COST * 1000).toFixed(2)}`, right: `1,000 requests: $${(R_COST * 1000).toFixed(2)}` },
    store: 'accent',
  },
];

const COLOR: Record<Tone, string> = { ok: 'var(--ok)', bad: 'var(--bad)', warn: 'var(--warn)', accent: 'var(--accent)', muted: 'var(--border)' };
const ROWS = [78, 130, 182, 234];
const LX = 184;
const RX = 536;
const W = 320;

function Column({ cx, title, blocks, seed }: { cx: number; title: string; blocks: Block[]; seed: string }) {
  return (
    <g>
      <HandText x={cx} y={30} size={TEXT_SIZES.heading}>{title}</HandText>
      {blocks.map((b, k) => (
        <g key={k}>
          <SketchBox cx={cx} cy={ROWS[k]} w={W} h={44} r={8} seed={seedOf(`${seed}-${k}`)} fill={b.tone === 'muted' ? 'var(--surface)' : COLOR[b.tone]} stroke={COLOR[b.tone]} strokeWidth={b.tone === 'accent' ? STROKE.emphasis : STROKE.normal} />
          <HandText x={cx - W / 2 + 14} y={ROWS[k]} size={TEXT_SIZES.label} anchor="start" color={b.tone === 'muted' ? 'var(--muted)' : 'var(--fg)'}>{b.label}</HandText>
          {b.tag && <HandText x={cx + W / 2 - 14} y={ROWS[k]} size={TEXT_SIZES.note} anchor="end" mono color={b.tone === 'muted' ? 'var(--muted)' : COLOR[b.tone]}>{b.tag}</HandText>}
        </g>
      ))}
    </g>
  );
}

export default function Ai14SidekickJit() {
  return (
    <AnimFrame title="One rule change, two prompt layouts" steps={STEPS}>
      {(_i, s) => (
        <SketchSvg width={720} height={380} label="A giant system prompt and a just-in-time design, compared on cache hits after one rule change">
          <Column cx={LX} title="Giant system prompt" blocks={s.left} seed="giant" />
          <Column cx={RX} title="Just-in-time rules" blocks={s.right} seed="jit" />
          <HandText x={LX} y={296} size={TEXT_SIZES.label} mono color="var(--fg)">{s.note?.left ?? ''}</HandText>
          <HandText x={RX} y={296} size={TEXT_SIZES.label} mono color="var(--fg)">{s.note?.right ?? ''}</HandText>
          {s.store && (
            <g>
              <SketchBox cx={RX} cy={346} w={220} h={44} r={8} seed={seedOf('store')} fill={COLOR[s.store]} stroke={COLOR[s.store]} dashed />
              <HandText x={RX} y={346} size={TEXT_SIZES.label}>Instruction store</HandText>
              {s.arrow && <SketchArrow points={[[RX + 94, 318], [RX + 94, 262]]} seed={seedOf('store-arrow')} stroke="var(--accent)" strokeWidth={STROKE.emphasis} />}
            </g>
          )}
        </SketchSvg>
      )}
    </AnimFrame>
  );
}

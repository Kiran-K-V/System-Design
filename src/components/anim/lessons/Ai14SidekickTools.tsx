import AnimFrame from '../AnimFrame';
import { HandText, SketchArrow, SketchBox, SketchSvg, STROKE, TEXT_SIZES, seedOf } from '../sketch';
import { schemaTokens, toolPairs } from './Ai14SidekickMath';

/**
 * Tool count against the three tiers in Shopify's post, plus a meter for tool-schema tokens.
 * The tiers are the post's. The axis end (80), the 300 tokens per schema, and 10 calls per task are our illustrative choices.
 */

const TOKENS_PER_SCHEMA = 300;
const CALLS_PER_TASK = 10;
const AXIS_MAX = 80;
const X0 = 40;
const PX_PER_TOOL = 8; // 80 tools = 640 px, so the tier bar and the token meter share one scale

const TIERS = [
  { from: 0, to: 20, label: 'Easy to debug', range: '0 to 20', tone: 'var(--ok)', seed: 'tier-a' },
  { from: 20, to: 50, label: 'Boundaries blur', range: '20 to 50', tone: 'var(--warn)', seed: 'tier-b' },
  { from: 50, to: 80, label: 'Hard to reason about', range: '50+', tone: 'var(--bad)', seed: 'tier-c' },
] as const;

const tierOf = (n: number) => (n <= 20 ? 0 : n <= 50 ? 1 : 2);

const STEPS = [
  { tools: 10, caption: 'Ten tools. Company claim, 0 to 20 tools: "Clear boundaries, easy to debug, straightforward behavior". Our reading: ten schemas at an assumed 300 tokens are 3,000 tokens on every call, and there are only 45 pairs of tools that could be confused.' },
  { tools: 20, caption: 'Twenty tools, the edge of the first tier. 6,000 schema tokens per call, 190 pairs. The post gives ranges, not a sharp line, so treat 20 as "start watching", not as a cliff.' },
  { tools: 35, caption: 'Thirty-five tools. Company claim, 20 to 50 tools: "Boundaries become unclear, tool combinations start causing unexpected outcomes". Our reading: 595 pairs, and the schema cost is up to 10,500 tokens on every call.' },
  { tools: 50, caption: 'Fifty tools, the edge of the second tier. 15,000 tokens per call. Over a 10-call task that is 150,000 tokens of schemas alone, before any user text.' },
  { tools: 70, caption: 'Seventy tools. Company claim, 50+: "Multiple ways to accomplish the same task, system becomes difficult to reason about". Our reading: 2,415 pairs, 21,000 tokens per call, 210,000 over a 10-call task.' },
];

const fmt = (n: number) => n.toLocaleString('en-US');

export default function Ai14SidekickTools() {
  return (
    <AnimFrame title="Tool count, debuggability, and schema tokens" steps={STEPS}>
      {(i) => {
        const { tools } = STEPS[i];
        const active = tierOf(tools);
        const mx = X0 + tools * PX_PER_TOOL;
        const tokens = schemaTokens(tools, TOKENS_PER_SCHEMA);
        const meterW = Math.max(6, tools * PX_PER_TOOL);
        return (
          <SketchSvg width={720} height={400} label={`Tool count ${tools} on the three tiers of the Shopify post, with ${fmt(tokens)} schema tokens per call`}>
            <HandText x={X0} y={20} size={TEXT_SIZES.heading} anchor="start">The post's three tiers</HandText>
            <HandText x={mx} y={52} size={TEXT_SIZES.label} color="var(--accent)">{`${tools} tools`}</HandText>
            <SketchArrow points={[[mx, 64], [mx, 88]]} seed={seedOf('marker')} stroke="var(--accent)" strokeWidth={STROKE.emphasis} />
            {TIERS.map((t, k) => {
              const w = (t.to - t.from) * PX_PER_TOOL;
              const cx = X0 + t.from * PX_PER_TOOL + w / 2;
              const on = k === active;
              return (
                <g key={t.seed}>
                  <SketchBox cx={cx} cy={120} w={w - 6} h={60} r={8} seed={seedOf(t.seed)} fill={t.tone} stroke={on ? t.tone : 'var(--border)'} strokeWidth={on ? STROKE.emphasis : STROKE.normal} />
                  <HandText x={cx} y={120} size={TEXT_SIZES.label} color={on ? 'var(--fg)' : 'var(--muted)'}>{`${t.range}\n${t.label}`}</HandText>
                </g>
              );
            })}
            <HandText x={X0} y={166} size={TEXT_SIZES.note} anchor="start" color="var(--muted)">0</HandText>
            <HandText x={X0 + 20 * PX_PER_TOOL} y={166} size={TEXT_SIZES.note} color="var(--muted)">20</HandText>
            <HandText x={X0 + 50 * PX_PER_TOOL} y={166} size={TEXT_SIZES.note} color="var(--muted)">50</HandText>
            <HandText x={X0 + AXIS_MAX * PX_PER_TOOL} y={166} size={TEXT_SIZES.note} anchor="end" color="var(--muted)">80 (our axis end)</HandText>

            <HandText x={X0} y={206} size={TEXT_SIZES.heading} anchor="start">{`Schema tokens on every call (${TOKENS_PER_SCHEMA} per tool, illustrative)`}</HandText>
            <SketchBox cx={X0 + (AXIS_MAX * PX_PER_TOOL) / 2} cy={248} w={AXIS_MAX * PX_PER_TOOL} h={34} r={6} seed={seedOf('track')} stroke="var(--border)" dashed />
            <SketchBox cx={X0 + meterW / 2} cy={248} w={meterW} h={34} r={6} seed={seedOf(`fill-${tools}`)} fill="var(--accent)" stroke="var(--accent)" />
            <HandText x={X0} y={284} size={TEXT_SIZES.note} anchor="start" color="var(--muted)">0</HandText>
            <HandText x={X0 + AXIS_MAX * PX_PER_TOOL} y={284} size={TEXT_SIZES.note} anchor="end" color="var(--muted)">{`${fmt(schemaTokens(AXIS_MAX, TOKENS_PER_SCHEMA))} tokens`}</HandText>

            <HandText x={X0} y={320} size={TEXT_SIZES.label} anchor="start" mono>{`${tools} x ${TOKENS_PER_SCHEMA} = ${fmt(tokens)} tokens per call`}</HandText>
            <HandText x={X0} y={348} size={TEXT_SIZES.label} anchor="start" mono>{`x ${CALLS_PER_TASK} calls = ${fmt(tokens * CALLS_PER_TASK)} tokens per task`}</HandText>
            <HandText x={X0} y={376} size={TEXT_SIZES.label} anchor="start" mono>{`${fmt(toolPairs(tools))} pairs of tools to tell apart`}</HandText>
          </SketchSvg>
        );
      }}
    </AnimFrame>
  );
}

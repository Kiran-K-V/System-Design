import AnimFrame from '../AnimFrame';
import { HandText, SketchArrow, SketchBox, SketchSvg, TEXT_SIZES, seedOf } from '../sketch';
import { AGENT_RATIO, CHAT_TOKENS, MULTI_RATIO } from './Ai7MultiMath';

// Only the 15x total comes from Anthropic. The split across lead and subagents is illustrative.
const LEAD_PLAN = 10_000;
const PER_SUB = 30_000;
const LEAD_MERGE = 20_000;
const TOTAL = LEAD_PLAN + 4 * PER_SUB + LEAD_MERGE; // 150,000

const k = (n: number) => `${Math.round(n / 1000)}K`;

type Phase = 'ask' | 'plan' | 'spawn' | 'work' | 'return' | 'merge';
interface Step {
  caption: string;
  phase: Phase;
  tokens: number;
}

const steps: Step[] = [
  {
    caption: `A broad question: "compare four vector databases on cost, limits, and hosting". One chat turn is about ${k(CHAT_TOKENS)} tokens here (our example). Anthropic reports that agents use about ${AGENT_RATIO}x chat tokens, and multi-agent systems about ${MULTI_RATIO}x. The meter will end at ${MULTI_RATIO} x ${k(CHAT_TOKENS)} = ${k(TOTAL)}.`,
    phase: 'ask',
    tokens: 0,
  },
  {
    caption: `The lead agent plans. It splits the question into four independent parts. Illustrative cost: ${k(LEAD_PLAN)} tokens.`,
    phase: 'plan',
    tokens: LEAD_PLAN,
  },
  {
    caption: 'The lead spawns four subagents in parallel. Anthropic says each needs an objective, an output format, guidance on tools and sources, and clear task boundaries. Each subagent starts with a fresh context: it sees its brief, not the lead\'s conversation.',
    phase: 'spawn',
    tokens: LEAD_PLAN,
  },
  {
    caption: `The subagents search and read at the same time. Each burns its own context: ${k(PER_SUB)} tokens each is our illustrative figure, 4 x ${k(PER_SUB)} = ${k(4 * PER_SUB)}. Wall-clock time is about that of the slowest one, not the sum of four. Tokens add up, time does not.`,
    phase: 'work',
    tokens: LEAD_PLAN + 4 * PER_SUB,
  },
  {
    caption: 'In the Claude Agent SDK, a subagent starts fresh and only its final response returns to the parent. Here each returns a short answer. The raw pages it read stay in its own context and are thrown away. This compression is the main benefit: the lead sees four summaries, not four hundred pages.',
    phase: 'return',
    tokens: LEAD_PLAN + 4 * PER_SUB,
  },
  {
    caption: `The lead merges the four summaries into one answer. Illustrative cost: ${k(LEAD_MERGE)}. Total: ${k(TOTAL)}, which is ${MULTI_RATIO}x one chat turn and ${(TOTAL / (CHAT_TOKENS * AGENT_RATIO)).toFixed(2)}x a single agent at ${AGENT_RATIO}x. You paid for speed and breadth with tokens.`,
    phase: 'merge',
    tokens: TOTAL,
  },
];

const SUB_X = [105, 275, 445, 615];
const BAR_X = 80;
const BAR_W = 560;
const SCALE = 160_000;

export default function Ai7MultiFan() {
  return (
    <AnimFrame title="A lead agent fans out to four subagents" steps={steps} interval={5200}>
      {(i, s) => {
        const leadActive = s.phase === 'plan' || s.phase === 'merge' || s.phase === 'ask';
        const subActive = s.phase === 'work' || s.phase === 'spawn';
        const w = (s.tokens / SCALE) * BAR_W;
        return (
          <SketchSvg width={720} height={380} label={`Step ${i + 1}: ${s.phase}`}>
            <SketchBox cx={360} cy={44} w={190} h={52} r={8} seed={seedOf('mf-lead')} stroke={leadActive ? 'var(--accent)' : 'var(--fg)'} strokeWidth={leadActive ? 2.2 : 1.4} fill={leadActive ? 'var(--accent-soft)' : undefined} />
            <HandText x={360} y={44} size={TEXT_SIZES.label}>Lead agent</HandText>
            {SUB_X.map((x, n) => {
              const shown = i >= 2;
              const done = s.phase === 'return' || s.phase === 'merge';
              const tone = !shown ? 'var(--muted)' : done ? 'var(--ok)' : subActive ? 'var(--accent)' : 'var(--fg)';
              return (
                <g key={n}>
                  <SketchBox cx={x} cy={170} w={140} h={60} r={8} seed={seedOf(`mf-sub${n}`)} stroke={tone} strokeWidth={subActive && s.phase === 'work' ? 2.2 : 1.4} fill={shown ? tone : undefined} dashed={!shown} />
                  <HandText x={x} y={170} size={TEXT_SIZES.label} color={shown ? 'var(--fg)' : 'var(--muted)'}>{`Subagent ${n + 1}\n${shown ? 'own context' : 'not started'}`}</HandText>
                  {shown && s.phase !== 'return' && s.phase !== 'merge' && (
                    <SketchArrow points={[[360 + (x - 360) * 0.45, 72], [x, 138]]} seed={seedOf(`mf-dn${n}`)} stroke="var(--accent)" />
                  )}
                  {(s.phase === 'return' || s.phase === 'merge') && (
                    <SketchArrow points={[[x, 138], [360 + (x - 360) * 0.45, 74]]} seed={seedOf(`mf-up${n}`)} stroke="var(--ok)" />
                  )}
                </g>
              );
            })}
            <HandText x={30} y={252} anchor="start" size={TEXT_SIZES.note} color="var(--muted)">tokens used (illustrative split, 15x total from Anthropic)</HandText>
            <SketchBox cx={BAR_X + BAR_W / 2} cy={286} w={BAR_W} h={26} r={6} seed={seedOf('mf-track')} stroke="var(--muted)" dashed />
            {s.tokens > 0 && <SketchBox cx={BAR_X + w / 2} cy={286} w={Math.max(8, w)} h={26} r={6} seed={seedOf(`mf-fill${i}`)} stroke="var(--accent)" fill="var(--accent)" strokeWidth={2.2} />}
            {[
              { t: CHAT_TOKENS, l: '1 chat', dy: 22 },
              { t: CHAT_TOKENS * AGENT_RATIO, l: 'agent 4x', dy: 22 },
              { t: TOTAL, l: 'multi 15x', dy: 22 },
            ].map((m) => (
              <g key={m.l}>
                <SketchArrow points={[[BAR_X + (m.t / SCALE) * BAR_W, 318], [BAR_X + (m.t / SCALE) * BAR_W, 304]]} seed={seedOf(`mf-m${m.l}`)} stroke="var(--muted)" head="end" />
                <HandText x={BAR_X + (m.t / SCALE) * BAR_W} y={318 + m.dy} size={TEXT_SIZES.note} color="var(--muted)">{m.l}</HandText>
              </g>
            ))}
            <HandText x={360} y={366} size={TEXT_SIZES.label} mono color="var(--fg)">{`${s.tokens.toLocaleString('en-US')} tokens so far`}</HandText>
          </SketchSvg>
        );
      }}
    </AnimFrame>
  );
}

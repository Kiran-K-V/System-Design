import AnimFrame from '../AnimFrame';
import { HandText, SketchArrow, SketchBox, SketchSvg, TEXT_SIZES, seedOf } from '../sketch';

/** Parent and three subagents. Token sizes are illustrative, except the 1,000-2,000 summary range from Anthropic. */
const PX = 0.005; // pixels per token: 100K tokens = 500 px
const COLS = [30, 260, 490];
const SUB_W = 200;

interface Step {
  caption: string;
  parent: number;
  subs: number[];
  /** Window state of each subagent: grow, summary, or gone. */
  phase: 'idle' | 'brief' | 'grow' | 'done' | 'gone' | 'ghost';
}
const steps: Step[] = [
  { phase: 'idle', parent: 8000, subs: [0, 0, 0], caption: 'The parent agent holds 8,000 tokens. The user wants three independent topics researched: auth, billing, and search. Done in one window, each topic would add its tool results to the same history.' },
  { phase: 'brief', parent: 8000, subs: [3500, 3500, 3500], caption: 'The parent starts three subagents in one turn. Each gets a fresh window with its own system prompt and tool definitions, plus a short brief. The brief is all it knows. It does not see the parent history. Illustrative start size: 3,500 tokens.' },
  { phase: 'grow', parent: 8000, subs: [18500, 18500, 18500], caption: 'Each subagent searches and reads files. Its tool results pile up in its own window, and the three run at the same time. The parent window does not change. Midway: 18,500 tokens each.' },
  { phase: 'grow', parent: 8000, subs: [33500, 33500, 33500], caption: 'After 10 calls each, a subagent holds 33,500 tokens: 3,500 + 10 x 3,000. Anthropic says this exploration "might use tens of thousands of tokens or more".' },
  { phase: 'done', parent: 8000, subs: [1500, 1500, 1500], caption: 'Each subagent writes a final message of about 1,500 tokens. Anthropic puts a typical summary at 1,000 to 2,000. Only this message goes back to the parent. Every intermediate tool call and result stays inside the subagent.' },
  { phase: 'gone', parent: 12500, subs: [0, 0, 0], caption: 'The three windows are gone. The parent adds the three summaries: 8,000 + 3 x 1,500 = 12,500 tokens. It can now write the answer.' },
  { phase: 'ghost', parent: 12500, subs: [0, 0, 0], caption: 'One agent doing all three topics would hold 8,000 + 30 x 3,000 = 98,000 tokens at the end (dashed). The parent holds 12,500. The cost: more total work and a brief that must be good, since a subagent cannot ask the parent what it meant.' },
];

export default function Ai6SubWalk() {
  return (
    <AnimFrame title="A parent, three subagents, and what comes back" steps={steps} interval={4600}>
      {(i, s) => {
        const pw = s.parent * PX;
        return (
          <SketchSvg width={720} height={330} label={`Step ${i + 1}`}>
            <HandText x={30} y={22} anchor="start" size={TEXT_SIZES.heading}>
              Parent agent
            </HandText>
            <HandText x={690} y={22} anchor="end" size={TEXT_SIZES.label} mono color="var(--accent)">
              {`${s.parent.toLocaleString('en-US')} tokens`}
            </HandText>
            <SketchBox cx={30 + pw / 2} cy={62} w={Math.max(pw, 6)} h={34} r={6} seed={seedOf('sw-par')} fill="var(--accent)" stroke="var(--accent)" />
            {s.phase === 'ghost' && (
              <SketchBox cx={30 + (98000 * PX) / 2} cy={62} w={98000 * PX} h={42} r={8} seed={seedOf('sw-ghost')} stroke="var(--muted)" dashed />
            )}
            {s.phase === 'ghost' && (
              <HandText x={30 + 98000 * PX} y={96} anchor="end" size={TEXT_SIZES.note} color="var(--muted)">
                one agent: 98,000
              </HandText>
            )}
            {s.phase !== 'idle' && s.phase !== 'gone' && s.phase !== 'ghost' &&
              COLS.map((x, n) => (
                <SketchArrow key={n} points={s.phase === 'done' ? [[x + SUB_W / 2, 170], [x + SUB_W / 2, 100]] : [[x + SUB_W / 2, 100], [x + SUB_W / 2, 170]]} head="end" seed={seedOf(`sw-a${n}`)} stroke={s.phase === 'done' ? 'var(--ok)' : 'var(--accent)'} />
              ))}
            {s.phase !== 'gone' && s.phase !== 'ghost' &&
              COLS.map((x, n) => (
                <g key={n}>
                  <HandText x={x} y={190} anchor="start" size={TEXT_SIZES.label} color={s.phase === 'idle' ? 'var(--muted)' : 'var(--fg)'}>
                    {`Subagent ${n + 1}`}
                  </HandText>
                  {s.phase !== 'idle' && (
                    <HandText x={x + SUB_W} y={190} anchor="end" size={TEXT_SIZES.note} mono color={s.phase === 'done' ? 'var(--ok)' : 'var(--accent)'}>
                      {`${s.subs[n].toLocaleString('en-US')}`}
                    </HandText>
                  )}
                  <SketchBox cx={x + SUB_W / 2} cy={225} w={SUB_W} h={30} r={6} seed={seedOf(`sw-f${n}`)} stroke="var(--muted)" dashed={s.phase === 'idle'} />
                  {s.phase !== 'idle' && (
                    <SketchBox cx={x + (s.subs[n] * PX) / 2} cy={225} w={Math.max(s.subs[n] * PX - 1, 6)} h={22} r={5} seed={seedOf(`sw-s${n}`)} fill={s.phase === 'done' ? 'var(--ok)' : 'var(--accent)'} stroke={s.phase === 'done' ? 'var(--ok)' : 'var(--accent)'} />
                  )}
                </g>
              ))}
            {(s.phase === 'gone' || s.phase === 'ghost') && (
              <HandText x={30} y={185} anchor="start" size={TEXT_SIZES.label} color="var(--muted)">
                Subagent windows discarded. 3 summaries kept.
              </HandText>
            )}
            <HandText x={30} y={290} anchor="start" size={TEXT_SIZES.note} color="var(--muted)">
              Bar length = tokens. Sizes are illustrative.
            </HandText>
          </SketchSvg>
        );
      }}
    </AnimFrame>
  );
}

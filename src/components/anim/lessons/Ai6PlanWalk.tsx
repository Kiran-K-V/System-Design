import AnimFrame from '../AnimFrame';
import { HandText, SketchArrow, SketchBox, SketchSvg, TEXT_SIZES, seedOf } from '../sketch';

/** A scripted, illustrative run: add a coupon field to a checkout page. */
type C = 'pending' | 'active' | 'done' | 'failed' | 'dropped';
const COLOR: Record<C, string> = { pending: 'var(--muted)', active: 'var(--accent)', done: 'var(--ok)', failed: 'var(--bad)', dropped: 'var(--muted)' };
const WORD: Record<C, string> = { pending: 'pending', active: 'running', done: 'verified', failed: 'failed', dropped: 'dropped' };

const V1 = ['Find code', 'Edit API', 'Edit UI', 'Add tests', 'Run tests', 'Open PR'];
const V2 = ['Find code', 'Edit API', 'Fix import', 'Edit UI', 'Add tests', 'Run tests', 'Open PR'];

interface S {
  caption: string;
  v1?: C[];
  v2?: C[];
  status: string;
}

const P = 'pending' as const, A = 'active' as const, D = 'done' as const, F = 'failed' as const, X = 'dropped' as const;

const STEPS: S[] = [
  { caption: 'Task: add a coupon field to the checkout page. Before it acts, the planner model writes the steps. The plan has no tool calls yet. It is a list the agent keeps in state.', status: 'no plan yet' },
  { caption: 'The planner writes plan v1 with 6 steps. This one call uses the strong model. The plan goes into state and is shown to the model every turn, so a long task does not drift.', v1: [P, P, P, P, P, P], status: 'plan v1: 0 of 6 verified' },
  { caption: 'An executor runs step 1, then step 2. Each step ends with a check, such as a test or a file diff. Only a passed check marks a step verified. Step 3 starts.', v1: [D, D, A, P, P, P], status: 'plan v1: 2 of 6 verified' },
  { caption: 'Step 3 fails. The build breaks on a missing import that the plan did not foresee. A rigid plan would now retry the same step or stop. The failure is a signal to replan, not only to retry.', v1: [D, D, F, P, P, P], status: 'plan v1: step 3 failed' },
  { caption: 'The replanner sees the plan and the results so far. It keeps the verified steps 1 and 2 and drops the rest. It writes plan v2 with a new step, Fix import. This is the second use of the strong model.', v1: [D, D, X, X, X, X], v2: [D, D, P, P, P, P, P], status: 'plan v2: 2 of 7 verified' },
  { caption: 'The executor runs plan v2. Fix import passes its check. Edit UI and Add tests pass. Run tests starts. Cheaper models can serve as executors, because each step is small and the plan already says what to do.', v1: [D, D, X, X, X, X], v2: [D, D, D, D, D, A, P], status: 'plan v2: 5 of 7 verified' },
  { caption: 'The last check before "done": compare state to the plan. All 7 steps are verified, and the test run passed. If the agent had said "done" after step 2, this check would have caught it. Done means every step has a passed check.', v1: [D, D, X, X, X, X], v2: [D, D, D, D, D, D, D], status: 'plan v2: 7 of 7 verified, done' },
];

const X0 = 62;
const GAP = 99;

function Row({ y, labels, states, title, tag }: { y: number; labels: string[]; states: C[]; title: string; tag: string }) {
  return (
    <g>
      <HandText x={20} y={y - 52} size={TEXT_SIZES.heading} anchor="start" color="var(--muted)">{title}</HandText>
      {labels.map((l, k) => {
        const st = states[k];
        const c = COLOR[st];
        const cx = X0 + k * GAP;
        return (
          <g key={`${tag}${k}`}>
            <SketchBox cx={cx} cy={y} w={90} h={60} r={8} seed={seedOf(`pw-${tag}${k}`)} stroke={c} fill={st === 'pending' || st === 'dropped' ? undefined : c} dashed={st === 'pending' || st === 'dropped'} strokeWidth={st === 'active' || st === 'failed' ? 2.2 : 1.4} />
            <HandText x={cx} y={y - 10} size={TEXT_SIZES.note} color={st === 'dropped' ? 'var(--muted)' : 'var(--fg)'}>{l}</HandText>
            <HandText x={cx} y={y + 14} size={TEXT_SIZES.note} color={c}>{WORD[st]}</HandText>
          </g>
        );
      })}
    </g>
  );
}

export default function Ai6PlanWalk() {
  return (
    <AnimFrame title="Plan, execute, fail, replan" steps={STEPS} interval={5600}>
      {(i, s) => (
        <SketchSvg width={720} height={330} label={`Step ${i + 1}: ${s.status}`}>
          {s.v1 ? <Row y={90} labels={V1} states={s.v1} title="Plan v1" tag="a" /> : <HandText x={360} y={90} size={TEXT_SIZES.label} color="var(--muted)">(no plan yet)</HandText>}
          {s.v2 && (
            <>
              <SketchArrow points={[[360, 128], [360, 168]]} stroke="var(--accent)" strokeWidth={2.2} seed={seedOf('pw-replan')} />
              <HandText x={452} y={148} size={TEXT_SIZES.note} color="var(--accent)">replan on failure</HandText>
              <Row y={238} labels={V2} states={s.v2} title="Plan v2" tag="b" />
            </>
          )}
          <HandText x={360} y={308} size={TEXT_SIZES.label} mono color="var(--fg)">{s.status}</HandText>
        </SketchSvg>
      )}
    </AnimFrame>
  );
}

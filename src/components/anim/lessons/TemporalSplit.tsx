import { HandText, SketchCylinder, SketchSvg, TEXT_SIZES, seedOf } from '../sketch';
import { Arr, Panel } from './TechParts';

const WF = ['Runs again on every replay', 'Same history, same commands', 'No clock, random, or direct I/O', 'Waits, loops, branches, timers'];
const ACT = ['Calls APIs, databases, files', 'Retried by default', 'May run more than once', 'So make the effect idempotent'];
const HIST = ['Ordered and durable', 'The input to every replay'];

/** Static infographic: what belongs in a workflow, what belongs in an activity, and the history between them. */
export default function TemporalSplit() {
  return (
    <figure className="not-prose my-8 overflow-hidden rounded-xl border border-line bg-bg px-2 py-4 sm:px-4">
      <SketchSvg width={720} height={270} label="Workflow code and activities both write to the event history. Workflow code must be deterministic. Activities may do side effects.">
        <Panel cx={110} cy={50} w={180} label="Workflow code" tone="accent" strong sk="ts-wf" />
        <Panel cx={610} cy={50} w={180} label="Activity" tone="warn" strong sk="ts-act" />
        <SketchCylinder cx={360} cy={50} w={150} h={70} seed={seedOf('ts-hist')} />
        <HandText x={360} y={52} size={TEXT_SIZES.label}>
          Event history
        </HandText>
        <Arr from={[206, 50]} to={[276, 50]} tone="accent" label="commands" sk="ts-a1" />
        <Arr from={[514, 50]} to={[444, 50]} tone="warn" label="results" sk="ts-a2" />
        {WF.map((t, k) => (
          <HandText key={t} x={30} y={120 + k * 26} size={TEXT_SIZES.note} anchor="start" color={k < 2 ? 'var(--fg)' : 'var(--muted)'}>
            {t}
          </HandText>
        ))}
        {HIST.map((t, k) => (
          <HandText key={t} x={360} y={120 + k * 26} size={TEXT_SIZES.note} color="var(--fg)">
            {t}
          </HandText>
        ))}
        {ACT.map((t, k) => (
          <HandText key={t} x={510} y={120 + k * 26} size={TEXT_SIZES.note} anchor="start" color={k < 2 ? 'var(--fg)' : 'var(--muted)'}>
            {t}
          </HandText>
        ))}
        <HandText x={360} y={240} size={TEXT_SIZES.note} color="var(--muted)">
          The workflow decides. The activity does. The history remembers.
        </HandText>
      </SketchSvg>
    </figure>
  );
}

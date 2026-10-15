import { HandText, SketchSvg, TEXT_SIZES } from '../sketch';
import { Arr, Panel } from './TechParts';

/** Static infographic: orchestration (one coordinator tells each service what to run) against choreography (services react to events). */
export default function MultiStepStyles() {
  return (
    <figure className="not-prose my-8 overflow-hidden rounded-xl border border-line bg-bg px-2 py-4 sm:px-4">
      <SketchSvg width={720} height={290} label="Orchestration: one orchestrator commands three services. Choreography: three services publish and react to events on a shared bus.">
        <HandText x={170} y={20} size={TEXT_SIZES.heading}>
          Orchestration
        </HandText>
        <HandText x={550} y={20} size={TEXT_SIZES.heading}>
          Choreography
        </HandText>
        <Panel cx={170} cy={70} w={150} label="Orchestrator" tone="accent" strong sk="ms-orch" />
        <Arr from={[130, 94]} to={[60, 156]} tone="accent" sk="ms-o1" />
        <Arr from={[170, 94]} to={[170, 156]} tone="accent" sk="ms-o2" />
        <Arr from={[210, 94]} to={[280, 156]} tone="accent" sk="ms-o3" />
        <Panel cx={60} cy={180} w={100} label="Order" sk="ms-s1" />
        <Panel cx={170} cy={180} w={100} label="Payment" sk="ms-s2" />
        <Panel cx={280} cy={180} w={100} label="Stock" sk="ms-s3" />
        <Panel cx={550} cy={70} w={320} label="Event bus" tone="warn" strong sk="ms-bus" />
        <Arr from={[450, 156]} to={[450, 100]} tone="muted" sk="ms-c1" />
        <Arr from={[550, 156]} to={[550, 100]} tone="muted" sk="ms-c2" />
        <Arr from={[650, 156]} to={[650, 100]} tone="muted" sk="ms-c3" />
        <Panel cx={450} cy={180} w={100} label="Order" sk="ms-t1" />
        <Panel cx={550} cy={180} w={100} label="Payment" sk="ms-t2" />
        <Panel cx={650} cy={180} w={100} label="Stock" sk="ms-t3" />
        <HandText x={170} y={240} size={TEXT_SIZES.note} color="var(--muted)">
          {'The flow lives in one place.\nThe orchestrator needs durable state.'}
        </HandText>
        <HandText x={550} y={240} size={TEXT_SIZES.note} color="var(--muted)">
          {'No single owner of the flow.\nHard to see the whole order of steps.'}
        </HandText>
      </SketchSvg>
    </figure>
  );
}

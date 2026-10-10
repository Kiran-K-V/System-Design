import AnimFrame from '../AnimFrame';
import { HandText, SketchSvg, TEXT_SIZES } from '../sketch';
import { Arr, Panel, type TT } from './TechParts';

const EVENTS = ['1 workflow started', '2 charge scheduled', '3 charge completed', '4 reserve scheduled', '5 reserve completed', '6 ship scheduled'];
const CODE = ['charge card', 'reserve stock', 'ship order'];
const LINE_Y = [140, 214, 288];
const EV_Y = [112, 160, 208, 256, 304, 352];

interface Step {
  caption: string;
  msg: string;
  worker: string;
  workerTone: TT;
  workerDashed?: boolean;
  /** Number of history events that exist. */
  events: number;
  /** Event index drawn as new (accent). */
  newEvent?: number;
  lines: [TT, TT, TT];
  /** Code to show, if the code was changed. */
  code?: [string, string, string];
  /** Arrow from a code line to a history event. */
  link?: { line: number; event: number; tone: TT };
  badEvent?: number;
}

const steps: Step[] = [
  {
    caption:
      'A workflow is ordinary code with three steps. Each step is an activity: a call to the outside world, like a payment API. The server keeps an event history for this workflow. The history is the source of truth. Worker A runs the code. Worker A keeps nothing that the history does not also hold.',
    msg: 'Worker A starts the workflow. History has 1 event.',
    worker: 'Worker A: running',
    workerTone: 'accent',
    events: 1,
    lines: ['fg', 'fg', 'fg'],
  },
  {
    caption: 'The code reaches charge card. It does not call the payment API itself. It emits a command: schedule activity "charge". The server records that as event 2. An activity worker will pick the task up.',
    msg: 'Code step 1 emits a command. Event 2 is written.',
    worker: 'Worker A: running',
    workerTone: 'accent',
    events: 2,
    newEvent: 1,
    lines: ['accent', 'fg', 'fg'],
    link: { line: 0, event: 1, tone: 'accent' },
  },
  {
    caption: 'The charge activity finishes. Its result goes into the history as event 3, before anything else happens. The payment is now done and recorded once.',
    msg: 'Activity result is saved as event 3.',
    worker: 'Worker A: running',
    workerTone: 'accent',
    events: 3,
    newEvent: 2,
    lines: ['ok', 'fg', 'fg'],
    link: { line: 0, event: 2, tone: 'ok' },
  },
  {
    caption: 'The code resumes with the recorded result and reaches reserve stock. It emits a second command. The server writes event 4.',
    msg: 'Code step 2 emits a command. Event 4 is written.',
    worker: 'Worker A: running',
    workerTone: 'accent',
    events: 4,
    newEvent: 3,
    lines: ['ok', 'accent', 'fg'],
    link: { line: 1, event: 3, tone: 'accent' },
  },
  {
    caption:
      'Worker A crashes. Its memory is gone: the position in the code and every local variable. The history is on the server and survives. The reserve activity runs on another worker and finishes, so event 5 is recorded. The server does not detect the crash by itself. It notices when a workflow task is not answered in time and hands it to another worker.',
    msg: 'Worker A crashes. Event 5 arrives from an activity worker.',
    worker: 'Worker A: crashed',
    workerTone: 'bad',
    workerDashed: true,
    events: 5,
    newEvent: 4,
    lines: ['muted', 'muted', 'muted'],
  },
  {
    caption: 'Worker B gets a workflow task with the full history. It runs the code from the top. Step 1 emits "schedule charge". The SDK compares it with events 2 and 3. They match, so it returns the saved result and does not call the payment API again.',
    msg: 'Worker B replays step 1 from the history.',
    worker: 'Worker B: replaying',
    workerTone: 'accent',
    events: 5,
    lines: ['accent', 'fg', 'fg'],
    link: { line: 0, event: 2, tone: 'ok' },
  },
  {
    caption: 'Step 2 emits "schedule reserve". Events 4 and 5 match and give the saved result. The code has rebuilt the exact state that Worker A had before it crashed. Replay used only the history.',
    msg: 'Worker B replays step 2 from the history.',
    worker: 'Worker B: replaying',
    workerTone: 'accent',
    events: 5,
    lines: ['ok', 'accent', 'fg'],
    link: { line: 1, event: 4, tone: 'ok' },
  },
  {
    caption: 'Step 3 emits "schedule ship". No event in the history matches it, so this command is new. The server writes event 6. Replay is over and the workflow runs live again. The customer was charged once.',
    msg: 'Step 3 has no event: a new command. Event 6 is written.',
    worker: 'Worker B: running',
    workerTone: 'accent',
    events: 6,
    newEvent: 5,
    lines: ['ok', 'ok', 'accent'],
    link: { line: 2, event: 5, tone: 'accent' },
  },
  {
    caption:
      'Now suppose someone deploys code that reserves stock before it charges. Replay emits "schedule reserve" first. The history says event 2 is "charge scheduled". They differ, so the SDK raises a non-determinism error and the workflow stops. A stopped workflow is safer than one that charges twice or skips a step. This is why workflow code must be deterministic, and why changes need versioning.',
    msg: 'Changed code does not match the history.',
    worker: 'Worker B: non-determinism error',
    workerTone: 'bad',
    events: 6,
    lines: ['bad', 'fg', 'fg'],
    code: ['reserve stock', 'charge card', 'ship order'],
    link: { line: 0, event: 1, tone: 'bad' },
    badEvent: 1,
  },
];

export default function TemporalReplay() {
  return (
    <AnimFrame title="Temporal: history replay after a worker crash" steps={steps} interval={5400}>
      {(i, s) => (
        <SketchSvg width={720} height={400} label="Workflow code on the left, the event history on the right, and a worker that crashes and is replaced">
          <HandText x={360} y={18} size={TEXT_SIZES.label} color="var(--accent)">
            {s.msg}
          </HandText>
          <Panel cx={120} cy={62} w={200} label={s.worker} tone={s.workerTone} dashed={s.workerDashed} sk="tw-worker" />
          {CODE.map((label, k) => (
            <Panel key={k} cx={120} cy={LINE_Y[k]} w={190} label={(s.code ?? CODE)[k] ?? label} tone={s.lines[k]} dashed={s.lines[k] === 'muted'} sk={`tc${k}`} />
          ))}
          <HandText x={120} y={340} size={TEXT_SIZES.note} color="var(--muted)">
            {'Workflow code (in worker memory)'}
          </HandText>
          <HandText x={540} y={74} size={TEXT_SIZES.heading} color="var(--muted)">
            Event history (on the server)
          </HandText>
          {EVENTS.map((label, k) =>
            k < s.events ? (
              <Panel key={k} cx={540} cy={EV_Y[k]} w={290} h={40} label={label} tone={s.badEvent === k ? 'bad' : s.newEvent === k ? 'accent' : 'ok'} sk={`th${k}`} />
            ) : (
              <Panel key={k} cx={540} cy={EV_Y[k]} w={290} h={40} label="" tone="muted" dashed sk={`th-empty${k}`} />
            ),
          )}
          {s.link && <Arr from={[220, LINE_Y[s.link.line]]} to={[390, EV_Y[s.link.event]]} tone={s.link.tone} dashed={s.link.tone === 'bad'} sk={`tl-${i}`} />}
        </SketchSvg>
      )}
    </AnimFrame>
  );
}

import AnimFrame from '../AnimFrame';
import { HandText, SketchArrow, SketchBox, SketchSvg, TEXT_SIZES, seedOf } from '../sketch';

type Id = 'submit' | 'queued' | 'boot' | 'run' | 'ckpt' | 'wait' | 'pr' | 'notify';

const POS: Record<Id, [number, number, string]> = {
  submit: [100, 66, 'Submit'],
  queued: [267, 66, 'Queued'],
  boot: [433, 66, 'Boot sandbox'],
  run: [600, 66, 'Running'],
  ckpt: [600, 166, 'Checkpoint'],
  wait: [433, 166, 'Waiting'],
  pr: [267, 166, 'Open PR'],
  notify: [100, 166, 'Notify'],
};
const ORDER: Id[] = ['submit', 'queued', 'boot', 'run', 'ckpt', 'wait', 'pr', 'notify'];

interface Step {
  caption: string;
  at: Id;
  status: string;
  sandbox: string;
}

const steps: Step[] = [
  {
    caption: 'A client posts the task. The API stores it, returns a run id at once, and closes the request. No HTTP connection stays open for the minutes the agent will need. The client keeps the id to poll or subscribe.',
    at: 'submit',
    status: 'queued',
    sandbox: 'none',
  },
  {
    caption: 'The run waits in its tenant\'s queue. A scheduler takes the next run by fair share, so one tenant\'s burst cannot starve the others, and only while the tenant is under its concurrency limit.',
    at: 'queued',
    status: 'queued',
    sandbox: 'none',
  },
  {
    caption: 'A worker claims the run and boots a fresh sandbox for it: clone the repo, install dependencies, inject a short-lived secret. One sandbox per run keeps runs apart and lets you throw it away after. Boot time is billed time with no agent work in it.',
    at: 'boot',
    status: 'running',
    sandbox: 'booting',
  },
  {
    caption: 'The agent loop runs: model call, tool call, model call. Each step is written to a trace and sent as an event, so a client that subscribed sees progress and does not think the run is frozen. A cost cap and a step cap bound the run.',
    at: 'run',
    status: 'running',
    sandbox: 'held',
  },
  {
    caption: 'After each step the runtime saves state. If the worker dies now, another worker restores the last checkpoint and goes on instead of starting over. This needs idempotent tools, because the step after the checkpoint may run twice (lesson A7.1).',
    at: 'ckpt',
    status: 'running',
    sandbox: 'held',
  },
  {
    caption: 'The agent needs a human decision, for example approval for a risky change. The run parks with status "waiting". State goes to durable storage. The sandbox can be freed, because a person may answer in 5 minutes or 5 hours. Answering resumes the run, possibly on a new sandbox.',
    at: 'wait',
    status: 'waiting for input',
    sandbox: 'released',
  },
  {
    caption: 'The work is done. The agent\'s output is a pull request, not a direct push to main. A person reviews and merges. Claude Code on the web, Codex cloud, and Cursor cloud agents all end in a branch or PR that a human reads.',
    at: 'pr',
    status: 'done',
    sandbox: 'released',
  },
  {
    caption: 'The run stores its result and trace under the run id, then notifies: a webhook, a chat message, or an email. Nobody has to watch. The sandbox is gone; the trace stays for debugging and for cost review.',
    at: 'notify',
    status: 'done, notified',
    sandbox: 'destroyed',
  },
];

export default function Ai7BgLife() {
  return (
    <AnimFrame title="Life of a background agent run" steps={steps} interval={5200}>
      {(i, s) => {
        const idx = ORDER.indexOf(s.at);
        return (
          <SketchSvg width={720} height={290} label={`Step ${i + 1}: ${POS[s.at][2]}`}>
            {ORDER.map((id, n) => {
              const [x, y, label] = POS[id];
              const active = n === idx;
              const past = n < idx;
              const tone = active ? 'var(--accent)' : past ? 'var(--ok)' : 'var(--muted)';
              const optional = id === 'wait';
              return (
                <g key={id}>
                  <SketchBox cx={x} cy={y} w={136} h={52} r={8} seed={seedOf(`bg-${id}`)} stroke={tone} strokeWidth={active ? 2.2 : 1.4} fill={active || past ? tone : undefined} dashed={optional && !active && !past} />
                  <HandText x={x} y={y} size={TEXT_SIZES.label} color={active || past ? 'var(--fg)' : 'var(--muted)'}>{label}</HandText>
                </g>
              );
            })}
            {[
              [[168, 66], [199, 66]],
              [[335, 66], [365, 66]],
              [[501, 66], [532, 66]],
              [[600, 92], [600, 140]],
              [[532, 166], [501, 166]],
              [[365, 166], [335, 166]],
              [[199, 166], [168, 166]],
            ].map((pts, n) => (
              <SketchArrow key={n} points={pts as [number, number][]} seed={seedOf(`bg-a${n}`)} stroke={n < idx ? 'var(--ok)' : 'var(--muted)'} />
            ))}
            <HandText x={360} y={236} size={TEXT_SIZES.label} mono color="var(--fg)">{`status: ${s.status}`}</HandText>
            <HandText x={360} y={264} size={TEXT_SIZES.label} mono color={s.sandbox === 'held' || s.sandbox === 'booting' ? 'var(--warn)' : 'var(--muted)'}>{`sandbox: ${s.sandbox}`}</HandText>
          </SketchSvg>
        );
      }}
    </AnimFrame>
  );
}

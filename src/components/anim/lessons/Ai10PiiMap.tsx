import AnimFrame from '../AnimFrame';
import { HandText, SketchArrow, SketchBox, SketchSvg, TEXT_SIZES, seedOf } from '../sketch';

/** Where one chat message lands. Retention notes come from the provider pages named in the lesson (read 2026-10-16). */
interface Store {
  id: string;
  label: string;
  note: string;
}

const STORES: Store[] = [
  { id: 'db', label: 'App database', note: 'you decide' },
  { id: 'logs', label: 'App logs', note: 'your log rules' },
  { id: 'trace', label: 'Trace store', note: 'if content capture is on' },
  { id: 'provider', label: 'Provider log', note: 'up to 30 days' },
  { id: 'cache', label: 'Prompt cache', note: 'up to 24 hours' },
  { id: 'index', label: 'Vector index', note: 'until you delete it' },
  { id: 'files', label: 'Provider files', note: 'until deleted' },
  { id: 'backup', label: 'Backups', note: 'your schedule' },
];

interface Step {
  caption: string;
  /** Number of stores revealed (they hold the message). */
  shown: number;
  /** Final step: deletion request done on the app database only. */
  deleted?: boolean;
}

const steps: Step[] = [
  { shown: 0, caption: 'A user writes: "My email is jane@example.com, please cancel my order." The message holds personal data. Nothing is stored yet. Follow it through your system.' },
  { shown: 1, caption: 'First copy: your app saves the chat in its own database, so the user can see the history. This is the copy everyone remembers. You control it fully.' },
  { shown: 2, caption: 'Second copy: a request logger writes the body into your app logs, to help with debugging. Nobody decided to keep the email. A log line did it.' },
  { shown: 3, caption: 'Third copy: your tracing tool records each model call. A trace is a record of what your software did during one request. OpenTelemetry, an open standard for traces, keeps message text off by default and warns that it is likely to hold personal data. Many teams turn it on to debug.' },
  { shown: 4, caption: 'Fourth copy: the model provider keeps the request in its own safety log. OpenAI says it keeps abuse logs for up to 30 days. Anthropic says it deletes API inputs and outputs within 30 days. You cannot edit this copy.' },
  { shown: 5, caption: 'Fifth copy: the provider may keep a prompt cache, a saved shortcut of the prompt so the next call is cheaper. OpenAI documents that this can be stored for up to 24 hours. It is data too.' },
  { shown: 6, caption: 'Sixth copy: your retrieval system splits the chat into pieces and stores each piece as a list of numbers, so it can search them later. This store is the vector index. The numbers can be turned back into text, so it counts as personal data.' },
  { shown: 7, caption: 'Seventh copy: if you upload the chat as a file, for example for a bulk job or to train a model further on your own examples, the provider stores that file until you delete it. The OpenAI zero data retention option, a contract that stops it from storing your content, does not cover these file endpoints.' },
  { shown: 8, caption: 'Eighth copy: your own backups copy the database and the logs. Each backup repeats every store above that you back up.' },
  { shown: 8, deleted: true, caption: 'Now the user asks you to delete their data. A developer deletes the row in the app database. One store of eight is clean. Seven copies remain, and some will be there for weeks. A real deletion plan lists every store first.' },
];

const X_STORE = 400;
const ROW0 = 52;
const ROW_STEP = 50;

export default function Ai10PiiMap() {
  return (
    <AnimFrame title="One message, eight copies" steps={steps} interval={4600}>
      {(i, s) => {
        const msgY = ROW0 + (7 * ROW_STEP) / 2;
        return (
          <SketchSvg width={720} height={440} label={`Step ${i + 1}: ${s.shown} of 8 stores hold the message`}>
            <SketchBox cx={105} cy={msgY} w={150} h={60} r={8} seed={seedOf('pii-msg')} stroke="var(--accent)" fill="var(--accent)" strokeWidth={2.2} />
            <HandText x={105} y={msgY} size={TEXT_SIZES.label}>{'User message\nwith an email'}</HandText>
            {STORES.map((st, k) => {
              const y = ROW0 + k * ROW_STEP;
              const revealed = k < s.shown;
              const current = !s.deleted && k === s.shown - 1;
              const tone = s.deleted ? (k === 0 ? 'var(--ok)' : 'var(--bad)') : current ? 'var(--accent)' : revealed ? 'var(--warn)' : 'var(--muted)';
              return (
                <g key={st.id}>
                  {revealed && (
                    <SketchArrow points={[[185, msgY + (y - msgY) * 0.12], [284, y]]} stroke={current ? 'var(--accent)' : 'var(--muted)'} seed={seedOf(`pii-a-${st.id}`)} />
                  )}
                  <SketchBox cx={X_STORE} cy={y} w={210} h={40} r={8} seed={seedOf(`pii-s-${st.id}`)} stroke={tone} fill={revealed ? tone : undefined} dashed={!revealed} strokeWidth={current ? 2.2 : 1.4} />
                  <HandText x={X_STORE} y={y} size={TEXT_SIZES.label} color={revealed ? 'var(--fg)' : 'var(--muted)'}>{st.label}</HandText>
                  <HandText x={X_STORE + 118} y={y} anchor="start" size={TEXT_SIZES.note} color={s.deleted ? (k === 0 ? 'var(--ok)' : 'var(--bad)') : 'var(--muted)'}>
                    {s.deleted ? (k === 0 ? 'deleted' : 'still there') : st.note}
                  </HandText>
                </g>
              );
            })}
          </SketchSvg>
        );
      }}
    </AnimFrame>
  );
}

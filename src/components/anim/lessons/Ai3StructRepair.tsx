import { useState } from 'react';
import CacheWidgetFrame, { Seg } from './CacheWidgetFrame';
import { repairMessage, validate } from './Ai3StructLogic';

/** Illustrative broken replies for a ticket classifier. The validator is real code; the "model" repair replies are scripted. */
interface Case {
  id: string;
  name: string;
  ticket: string;
  text: string;
  stop: string;
  /** Scripted replies to successive repair messages. Empty when a repair loop is the wrong tool. */
  repairs: { text: string; stop: string }[];
  note: string;
}

const T1 = 'Ticket: "Thanks, the fix worked."';
const CASES: Case[] = [
  { id: 'enum', name: 'Label not in the list', ticket: T1, text: '{"label":"happy","urgent":false}', stop: 'end_turn', repairs: [{ text: '{"label":"neutral","urgent":false}', stop: 'end_turn' }], note: 'Prompt-only JSON. With constrained decoding this case cannot happen.' },
  { id: 'prose', name: 'Prose around the JSON', ticket: T1, text: 'Sure! Here is the JSON: {"label":"neutral","urgent":false}', stop: 'end_turn', repairs: [{ text: '{"label":"neutral","urgent":false}', stop: 'end_turn' }], note: 'Prompt-only JSON. A strict parser rejects it. With constrained decoding the reply starts with "{".' },
  { id: 'missing', name: 'Missing field', ticket: T1, text: '{"label":"neutral"}', stop: 'end_turn', repairs: [{ text: '{"label":"neutral","urgent":false}', stop: 'end_turn' }], note: 'A required field is gone. Constrained decoding with "required" prevents it.' },
  { id: 'type', name: 'Wrong type', ticket: T1, text: '{"label":"neutral","urgent":"no"}', stop: 'end_turn', repairs: [{ text: '{"label":"neutral","urgent":false}', stop: 'end_turn' }], note: 'A string where a boolean belongs. Constrained decoding prevents it.' },
  { id: 'trunc', name: 'Cut at max_tokens', ticket: T1, text: '{"label":"neutr', stop: 'max_tokens', repairs: [{ text: '{"label":"neutral","urgent":false}', stop: 'end_turn' }], note: 'Constrained decoding does not prevent this. The fix is a higher max_tokens, not a repair prompt. The scripted retry here uses a higher cap.' },
  { id: 'refusal', name: 'Refusal', ticket: 'Ticket: (content the model declines to process)', text: "I can't help with that.", stop: 'refusal', repairs: [], note: 'A repair prompt will not help. Route to a fallback model or a human, and count it.' },
  { id: 'wrong', name: 'Valid, wrong content', ticket: 'Ticket: "Someone hacked my account and moved $2,000. Call me NOW."', text: '{"label":"neutral","urgent":false}', stop: 'end_turn', repairs: [], note: 'The shape is perfect and the answer is wrong. No schema catches this. You need an eval or a second check.' },
];

const btn = 'rounded-md border border-line px-2.5 py-1.5 text-xs hover:bg-surface disabled:opacity-40';

export default function Ai3StructRepair() {
  const [id, setId] = useState('enum');
  const [attempts, setAttempts] = useState(0);
  const c = CASES.find((x) => x.id === id)!;
  const first = validate(c.text, c.stop);
  const shown = [{ text: c.text, stop: c.stop }, ...c.repairs.slice(0, attempts)];
  const last = shown[shown.length - 1];
  const lastV = validate(last.text, last.stop);
  const canRepair = !first.ok && c.repairs.length > attempts && !lastV.ok;

  return (
    <CacheWidgetFrame title="Validate and repair" hint="Schema: label is negative, neutral or mixed. urgent is a boolean. Both required. No extra keys.">
      <div className="mb-3">
        <Seg
          label="Reply to test"
          value={id}
          options={CASES.map((x) => ({ id: x.id, label: x.name }))}
          onChange={(v) => {
            setId(v);
            setAttempts(0);
          }}
        />
      </div>
      <p className="mb-2 text-sm text-muted">{c.ticket}</p>
      <div className="space-y-3 text-sm" aria-live="polite">
        {shown.map((a, i) => {
          const v = validate(a.text, a.stop);
          return (
            <div key={i} className="rounded-lg border p-3" style={{ borderColor: v.ok ? (id === 'wrong' ? 'var(--warn)' : 'var(--ok)') : 'var(--bad)' }}>
              <p className="text-xs uppercase tracking-wide text-muted">
                {i === 0 ? 'First reply' : `Repair attempt ${i}`} · stop_reason: {a.stop}
              </p>
              <pre className="mt-1 overflow-x-auto font-mono text-[13px]">{a.text}</pre>
              <p className="mt-1" style={{ color: v.ok ? 'var(--ok)' : 'var(--bad)' }}>
                {v.ok ? 'Passes the schema check.' : v.errors.join(' ')}
              </p>
              {i > 0 && v.ok && <p className="text-muted">Repaired after {i} extra call{i > 1 ? 's' : ''}, so this request cost {i + 1} calls.</p>}
            </div>
          );
        })}
        {canRepair && (
          <div className="rounded-lg bg-surface p-3">
            <p className="text-xs uppercase tracking-wide text-muted">Message your code sends back</p>
            <p className="mt-1 font-mono text-[13px]">{c.stop === 'max_tokens' ? 'Same request again with max_tokens raised.' : repairMessage(lastV.errors)}</p>
            <button type="button" className={`${btn} mt-2`} onClick={() => setAttempts(attempts + 1)}>
              Send repair
            </button>
          </div>
        )}
        {first.ok && id === 'wrong' && <p style={{ color: 'var(--warn)' }}>The check passed, so no repair runs. {c.note}</p>}
        {!first.ok && c.repairs.length === 0 && <p style={{ color: 'var(--bad)' }}>No repair loop. {c.note}</p>}
        {!first.ok && c.repairs.length > 0 && <p className="text-muted">{c.note}</p>}
      </div>
    </CacheWidgetFrame>
  );
}

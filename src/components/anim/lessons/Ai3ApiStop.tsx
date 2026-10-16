import { useState } from 'react';
import CacheWidgetFrame, { Seg } from './CacheWidgetFrame';

interface Reason {
  id: string;
  meaning: string;
  /** What the naive handler (checks only the HTTP status) shows the user. Illustrative text. */
  naive: string;
  naiveBad: boolean;
  /** What a handler that reads stop_reason does. */
  right: string;
}

/** Meanings are quoted from the Anthropic "Handling stop reasons" page (fetched 2026-10-16). The text the user sees is illustrative. */
const REASONS: Reason[] = [
  { id: 'end_turn', meaning: 'Claude finished its response naturally.', naive: 'The three causes are a cold cache, a long prompt, and a busy server.', naiveBad: false, right: 'Parse the content and show it. This is the normal path.' },
  { id: 'max_tokens', meaning: 'The response reached your max_tokens limit.', naive: 'The three causes are: 1) a cold cache, 2) a long prompt, 3) a', naiveBad: true, right: 'The text is cut. Raise max_tokens or continue the reply. If you asked for JSON, do not parse it.' },
  { id: 'stop_sequence', meaning: 'Claude emitted one of your stop_sequences.', naive: 'Answer: 42', naiveBad: false, right: 'Expected when you set stop_sequences. The response field "stop_sequence" says which one matched.' },
  { id: 'tool_use', meaning: 'Claude is calling a tool.', naive: 'I will look that up.', naiveBad: true, right: 'Run each tool_use block, send tool_result blocks back, and call again (lesson A3.4).' },
  { id: 'pause_turn', meaning: 'A server-tool loop reached its iteration limit.', naive: 'Let me search for that.', naiveBad: true, right: 'Add the assistant content to messages as it is and call again so the model can continue.' },
  { id: 'refusal', meaning: 'Claude declined to respond.', naive: '(empty, then a JSON parse error)', naiveBad: true, right: 'HTTP 200, not an error. Read stop_details and retry on a fallback model, or show a refusal message.' },
  { id: 'model_context_window_exceeded', meaning: "The response filled the model's context window.", naive: 'The report concludes that the main risk is', naiveBad: true, right: 'Treat the response as truncated. Shorten the input or the history.' },
];

export default function Ai3ApiStop() {
  const [id, setId] = useState('max_tokens');
  const [mode, setMode] = useState<'naive' | 'checked'>('naive');
  const r = REASONS.find((x) => x.id === id)!;
  const bad = mode === 'naive' && r.naiveBad;

  return (
    <CacheWidgetFrame title="Stop-reason explorer" hint="Pick what the API returned. See what two handlers do with it.">
      <div className="mb-3 flex flex-wrap gap-2">
        <Seg label="stop_reason" value={id} options={REASONS.map((x) => ({ id: x.id, label: x.id }))} onChange={setId} />
      </div>
      <div className="mb-3 flex flex-wrap gap-2">
        <Seg
          label="Handler"
          value={mode}
          options={[
            { id: 'naive', label: 'Checks HTTP status only' },
            { id: 'checked', label: 'Reads stop_reason' },
          ]}
          onChange={setMode}
        />
      </div>
      <pre className="mb-3 overflow-x-auto rounded-lg bg-surface p-3 font-mono text-[13px] leading-relaxed">
        {`HTTP 200\n"stop_reason": "${r.id}"\n// ${r.meaning}`}
      </pre>
      <div className="rounded-lg border p-3 text-sm" style={{ borderColor: bad ? 'var(--bad)' : mode === 'checked' ? 'var(--ok)' : 'var(--border)' }} aria-live="polite">
        {mode === 'naive' ? (
          <>
            <p className="text-xs uppercase tracking-wide text-muted">The user sees (illustrative)</p>
            <p className="mt-1 font-mono">{r.naive}</p>
            <p className="mt-2" style={{ color: bad ? 'var(--bad)' : 'var(--ok)' }}>
              {bad ? 'Wrong. The call succeeded at the HTTP level, so this code treats a partial or empty reply as the final answer.' : 'Fine here. The reply is complete, so a handler that ignores stop_reason still works.'}
            </p>
          </>
        ) : (
          <>
            <p className="text-xs uppercase tracking-wide text-muted">The handler does</p>
            <p className="mt-1" style={{ color: 'var(--ok)' }}>{r.right}</p>
          </>
        )}
      </div>
    </CacheWidgetFrame>
  );
}

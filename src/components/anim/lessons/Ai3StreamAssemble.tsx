import { useState } from 'react';
import CacheWidgetFrame from './CacheWidgetFrame';
import { CHUNKS, closePartial, tryParse } from './Ai3StreamMath';

const btn = 'rounded-md border border-line px-2.5 py-1.5 text-xs hover:bg-surface disabled:opacity-40';

export default function Ai3StreamAssemble() {
  const [n, setN] = useState(0);
  const [cut, setCut] = useState(false);
  const buf = CHUNKS.slice(0, n).join('');
  const done = n === CHUNKS.length && !cut;
  const strict = tryParse(buf);
  const loose = n > 0 ? tryParse(closePartial(buf)) : null;

  return (
    <CacheWidgetFrame title="Chunk assembler" hint="A tool call streams as partial_json strings">
      <div className="mb-3 flex flex-wrap gap-2">
        <button type="button" className={btn} disabled={n >= CHUNKS.length || cut} onClick={() => setN(n + 1)}>
          Next delta
        </button>
        <button type="button" className={btn} disabled={n === 0 || n >= CHUNKS.length || cut} onClick={() => setCut(true)}>
          Drop the connection
        </button>
        <button
          type="button"
          className={btn}
          onClick={() => {
            setN(0);
            setCut(false);
          }}
        >
          Reset
        </button>
      </div>
      <div className="space-y-3 text-sm" aria-live="polite">
        <div>
          <p className="text-xs uppercase tracking-wide text-muted">Events so far ({n} input_json_delta{n === 1 ? '' : 's'}{done ? ', then content_block_stop' : ''}{cut ? ', then nothing' : ''})</p>
          <pre className="mt-1 overflow-x-auto rounded-lg bg-surface p-3 font-mono text-[13px] leading-relaxed">
            {CHUNKS.slice(0, n).map((c, i) => `partial_json #${i + 1}: ${JSON.stringify(c)}`).join('\n') || '(no events yet)'}
          </pre>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-muted">Buffer</p>
          <pre className="mt-1 overflow-x-auto rounded-lg bg-surface p-3 font-mono text-[13px]">{buf || '(empty)'}</pre>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <div className="rounded-lg border p-3" style={{ borderColor: n === 0 ? 'var(--border)' : strict.ok ? 'var(--ok)' : 'var(--bad)' }}>
            <p className="text-xs uppercase tracking-wide text-muted">JSON.parse(buffer)</p>
            <p className="mt-1 font-mono text-[13px]" style={{ color: n === 0 ? undefined : strict.ok ? 'var(--ok)' : 'var(--bad)' }}>
              {n === 0 ? '-' : strict.ok ? JSON.stringify(strict.value) : 'throws: not valid JSON yet'}
            </p>
          </div>
          <div className="rounded-lg border p-3" style={{ borderColor: loose && !done ? 'var(--warn)' : 'var(--border)' }}>
            <p className="text-xs uppercase tracking-wide text-muted">Partial parser (closes the open string)</p>
            <p className="mt-1 font-mono text-[13px]" style={{ color: loose && !done ? 'var(--warn)' : undefined }}>
              {loose ? (loose.ok ? JSON.stringify(loose.value) : 'cannot repair') : '-'}
            </p>
            {loose && !done && <p className="mt-1 text-xs text-muted">Parses, but the value is still growing. Do not run the tool on this.</p>}
          </div>
        </div>
        <p style={{ color: done ? 'var(--ok)' : cut ? 'var(--bad)' : 'var(--muted)' }}>
          {done
            ? 'content_block_stop arrived. The JSON is complete. Parse once and run the tool.'
            : cut
              ? 'The stream died before content_block_stop. The input is incomplete. Do not run the tool. Retry the whole request.'
              : 'Waiting. Keep appending. Act only on content_block_stop.'}
        </p>
      </div>
    </CacheWidgetFrame>
  );
}

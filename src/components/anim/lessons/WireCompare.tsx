import { useState } from 'react';
import { WidgetFrame } from '../data-kit';
import { encodeUser, hex, jsonBytes, totalBytes, type Piece } from './protoWire';

/**
 * Live byte layout of one message in protobuf and in JSON.
 * message User { int32 id = <n>; string name = 2; bool active = 3; }
 * The encoder follows protobuf.dev/programming-guides/encoding. proto3 omits fields that hold their default value.
 */

const KIND_STYLE: Record<Piece['kind'], { bg: string; label: string }> = {
  tag: { bg: 'var(--accent)', label: 'tag' },
  len: { bg: 'var(--warn)', label: 'length' },
  value: { bg: 'var(--ok)', label: 'value' },
};

export default function WireCompare() {
  const [id, setId] = useState(150);
  const [name, setName] = useState('Ada');
  const [active, setActive] = useState(true);
  const [idField, setIdField] = useState(1);

  const safeId = Number.isFinite(id) ? Math.min(Math.max(Math.trunc(id), 0), 2_147_483_647) : 0;
  const msg = { id: safeId, name, active };
  const pb = encodeUser(msg, idField);
  const pbSize = totalBytes(pb);
  const js = jsonBytes(msg);
  const jsText = JSON.stringify({ id: safeId, name, active });
  const ratio = pbSize === 0 ? null : js.length / pbSize;

  return (
    <figure className="not-prose my-8 overflow-hidden rounded-xl border border-line bg-bg shadow-[0_1px_2px_rgb(0_0_0/0.04)]">
      <div className="border-b border-line bg-surface px-4 py-2 text-sm font-medium">Same message, two encodings</div>
      <div className="space-y-4 p-4">
        <pre className="overflow-x-auto rounded-lg bg-surface px-3 py-2 font-mono text-sm leading-relaxed">{`message User {\n  int32  id     = ${idField};\n  string name   = 2;\n  bool   active = 3;\n}`}</pre>
        <div className="grid gap-3 sm:grid-cols-4">
          <label className="block text-sm">
            <span className="text-muted">id (0 to 2,147,483,647)</span>
            <input type="number" min={0} max={2147483647} value={id} onChange={(e) => setId(+e.target.value)} className="mt-1 w-full rounded-md border border-line bg-bg px-2 py-1 font-mono" />
          </label>
          <label className="block text-sm">
            <span className="text-muted">name</span>
            <input type="text" value={name} maxLength={24} onChange={(e) => setName(e.target.value)} className="mt-1 w-full rounded-md border border-line bg-bg px-2 py-1 font-mono" />
          </label>
          <label className="block text-sm">
            <span className="text-muted">field number of id</span>
            <select value={idField} onChange={(e) => setIdField(+e.target.value)} className="mt-1 w-full rounded-md border border-line bg-bg px-2 py-1 font-mono">
              {[1, 15, 16, 2047].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </label>
          <label className="flex items-end gap-2 pb-1 text-sm">
            <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} className="accent-[var(--accent)]" />
            <span>active</span>
          </label>
        </div>

        <div>
          <div className="flex items-baseline justify-between text-sm">
            <span className="font-medium">Protobuf</span>
            <span className="font-mono tabular-nums font-semibold" data-testid="pb-size">{pbSize} bytes</span>
          </div>
          <div className="mt-1 flex flex-wrap gap-1" aria-label="Protobuf bytes">
            {pb.length === 0 && <span className="text-sm text-muted">empty message (all fields hold defaults)</span>}
            {pb.map((p, pi) => (
              <span key={pi} className="inline-flex overflow-hidden rounded border border-line text-xs" title={`${p.field} ${KIND_STYLE[p.kind].label}`}>
                {p.bytes.map((b, bi) => (
                  <span key={bi} className="px-1.5 py-1 font-mono text-white" style={{ background: KIND_STYLE[p.kind].bg }}>
                    {hex(b)}
                  </span>
                ))}
                <span className="bg-surface px-1.5 py-1 text-muted">{p.field} {KIND_STYLE[p.kind].label}</span>
              </span>
            ))}
          </div>
        </div>

        <div>
          <div className="flex items-baseline justify-between text-sm">
            <span className="font-medium">JSON (compact)</span>
            <span className="font-mono tabular-nums font-semibold" data-testid="json-size">{js.length} bytes</span>
          </div>
          <pre className="mt-1 overflow-x-auto whitespace-pre-wrap break-all rounded bg-surface px-3 py-2 font-mono text-sm">{jsText}</pre>
        </div>
      </div>
      <p className="border-t border-line px-4 py-3 text-[0.95rem] leading-relaxed">
        {ratio === null
          ? 'Every field holds its default, so protobuf writes nothing at all.'
          : `JSON is ${ratio.toFixed(1)}x larger here. Protobuf sends numbers, not names. Try id = 0 (the field disappears), a long name (the text costs the same in both), or field number 16 (the tag grows to 2 bytes).`}
      </p>
    </figure>
  );
}

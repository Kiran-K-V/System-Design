import { useState } from 'react';
import CacheWidgetFrame, { Seg } from './CacheWidgetFrame';
import { META, compare } from './Ai6SkillMath';

const n0 = (n: number) => n.toLocaleString('en-US');
const usd = (n: number) => `$${n < 10 ? n.toFixed(2) : n.toFixed(0)}`;

/** Everything in the system prompt versus skills with progressive disclosure. Our model, illustrative sizes. */
export default function Ai6SkillSim() {
  const [n, setN] = useState(30);
  const [body, setBody] = useState(1300);
  const [used, setUsed] = useState(1);
  const [ref, setRef] = useState(0);
  const [cached, setCached] = useState(false);

  const r = compare({ n, body, used: Math.min(used, n), ref, requests: 1000, cached });
  const pct = Math.round((1 - r.skillTokens / r.allTokens) * 100);

  const slider = (id: string, label: string, val: string, min: number, max: number, st: number, v: number, set: (x: number) => void) => (
    <div>
      <label htmlFor={id} className="mb-1 flex justify-between text-xs text-muted">
        <span>{label}</span>
        <span className="tabular-nums text-fg">{val}</span>
      </label>
      <input id={id} type="range" min={min} max={max} step={st} value={v} onChange={(e) => set(+e.target.value)} className="w-full accent-[var(--accent)]" />
    </div>
  );

  return (
    <CacheWidgetFrame title="Skills versus one big prompt" hint="our model, sizes illustrative, Sonnet 5.5 input price">
      <div className="grid gap-4 text-sm md:grid-cols-2">
        <div className="space-y-3">
          {slider('a611-n', 'Installed skills (procedures)', String(n), 1, 100, 1, n, setN)}
          {slider('a611-body', 'Tokens per procedure', n0(body), 200, 6000, 100, body, setBody)}
          {slider('a611-used', 'Skills the request uses', String(Math.min(used, n)), 0, 5, 1, used, setUsed)}
          {slider('a611-ref', 'Extra reference tokens per used skill', n0(ref), 0, 8000, 500, ref, setRef)}
          <Seg
            label="Prompt cache"
            value={cached ? 'on' : 'off'}
            options={[
              { id: 'off', label: 'No cache' },
              { id: 'on', label: 'Stable prefix cached (0.05x)' },
            ]}
            onChange={(v) => setCached(v === 'on')}
          />
        </div>
        <div className="space-y-2" aria-live="polite">
          <div className="rounded-lg border border-line p-3">
            <div className="text-xs text-muted">Everything in the system prompt</div>
            <div data-testid="all" className="font-mono text-sm">{n0(r.allTokens)} tokens per request · {usd(r.allCost)} per 1,000</div>
          </div>
          <div className="rounded-lg border border-line p-3">
            <div className="text-xs text-muted">Skills: {n} x {META} tokens of metadata, plus the bodies used</div>
            <div data-testid="skills" className="font-mono text-sm">{n0(r.skillTokens)} tokens per request · {usd(r.skillCost)} per 1,000</div>
          </div>
          <div className="rounded-lg border border-line p-3">
            <div className="text-xs text-muted">Window space saved</div>
            <div data-testid="saved" className="font-mono text-xl">{pct}%</div>
          </div>
          {body > 5000 && <p className="text-xs" style={{ color: 'var(--warn)' }}>The spec recommends a SKILL.md body under 5,000 tokens. Split the rest into reference files.</p>}
        </div>
      </div>
      <p className="mt-3 text-xs text-muted">
        Model: metadata is {META} tokens per skill (the spec's "about 100 tokens"). A used skill adds its body, plus references if any. Prices count input tokens only and ignore cache writes. With the cache on, the dollar gap shrinks a lot, but the window space and attention gap does not.
      </p>
    </CacheWidgetFrame>
  );
}

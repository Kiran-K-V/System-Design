import { useState } from 'react';
import CacheWidgetFrame from './CacheWidgetFrame';
import { CASCADED, S2S, total, type Stage } from './Ai3RtMath';

function Slider({ id, label, value, max, onChange }: { id: string; label: string; value: number; max: number; onChange: (v: number) => void }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1 flex justify-between text-xs text-muted">
        <span>{label}</span>
        <span className="tabular-nums text-fg">{value} ms</span>
      </label>
      <input id={id} type="range" min={0} max={max} step={50} value={value} onChange={(e) => onChange(+e.target.value)} className="w-full accent-[var(--accent)]" />
    </div>
  );
}

const COLORS = ['var(--accent)', 'var(--warn)', 'var(--ok)', 'var(--fg)', 'var(--muted)'];

function Bars({ title, stages, ms, scale, id }: { title: string; stages: Stage[]; ms: number[]; scale: number; id: string }) {
  let start = 0;
  const t = total(ms);
  return (
    <div className="rounded-lg border border-line bg-surface p-3" data-testid={id}>
      <div className="mb-2 flex justify-between text-sm">
        <span className="font-medium">{title}</span>
        <span className="font-semibold tabular-nums" data-testid={`${id}-total`}>{t} ms</span>
      </div>
      <div className="relative h-5 rounded bg-line" role="img" aria-label={`${title}: ${t} milliseconds in total`}>
        {stages.map((s, k) => {
          const left = (start / scale) * 100;
          const w = (ms[k] / scale) * 100;
          start += ms[k];
          return <div key={s.id} className="absolute h-full" style={{ left: `${left}%`, width: `${w}%`, background: COLORS[k % COLORS.length], opacity: k === 3 ? 0.55 : 0.85 }} title={`${s.label}: ${ms[k]} ms`} />;
        })}
      </div>
      <ul className="mt-2 space-y-1 text-xs text-muted">
        {stages.map((s, k) => (
          <li key={s.id} className="flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-2.5 shrink-0 rounded-sm" style={{ background: COLORS[k % COLORS.length], opacity: k === 3 ? 0.55 : 1 }} />
            {s.label}: <span className="tabular-nums text-fg">{ms[k]} ms</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Latency budget for one voice turn, cascaded against speech-to-speech. All stage times are editable and illustrative. */
export default function Ai3RtBudget() {
  const [wait, setWait] = useState(500);
  const [net, setNet] = useState(100);
  const [stt, setStt] = useState(200);
  const [llm, setLlm] = useState(400);
  const [tts, setTts] = useState(250);
  const [model, setModel] = useState(500);

  const casc = [wait, stt, llm, tts, net];
  const s2s = [wait, model, net];
  const scale = Math.max(total(casc), total(s2s), 1000) * 1.05;
  const diff = total(casc) - total(s2s);

  return (
    <CacheWidgetFrame title="Latency budget: cascaded against speech-to-speech" hint="every default is illustrative, not measured">
      <div className="grid gap-4 text-sm md:grid-cols-[17rem_1fr]">
        <div className="space-y-3">
          <Slider id="a3r-wait" label="Turn end wait (both)" value={wait} max={1500} onChange={setWait} />
          <Slider id="a3r-net" label="Network (both)" value={net} max={600} onChange={setNet} />
          <Slider id="a3r-stt" label="Speech to text, final" value={stt} max={1000} onChange={setStt} />
          <Slider id="a3r-llm" label="LLM first token" value={llm} max={2000} onChange={setLlm} />
          <Slider id="a3r-tts" label="Text to speech, first audio" value={tts} max={1000} onChange={setTts} />
          <Slider id="a3r-model" label="Speech model, first audio" value={model} max={2000} onChange={setModel} />
        </div>
        <div className="space-y-3">
          <Bars id="casc" title="Cascaded: STT, LLM, TTS" stages={CASCADED} ms={casc} scale={scale} />
          <Bars id="s2s" title="Speech to speech" stages={S2S} ms={s2s} scale={scale} />
          <p className="text-xs leading-relaxed text-muted" data-testid="diff">
            {diff > 0 ? `With these numbers speech to speech is ${diff} ms faster.` : diff < 0 ? `With these numbers the cascade is ${-diff} ms faster.` : 'With these numbers both take the same time.'} The time from the end of user speech to the first audio is the sum of the stages. Streaming each stage into the next (start TTS on the first LLM tokens) shortens a real cascade. This model does not include that overlap.
          </p>
        </div>
      </div>
    </CacheWidgetFrame>
  );
}

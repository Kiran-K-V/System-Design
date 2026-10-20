import { useState } from 'react';
import CacheWidgetFrame, { Seg } from './CacheWidgetFrame';
import { HandText, SketchArrow, SketchSvg, TEXT_SIZES, seedOf } from '../sketch';
import {
  TARGET_P50,
  TARGET_P95,
  callCutRate,
  cutRate,
  llmCallsPerTurn,
  maxSilenceForP50,
  p50,
  p95,
  type Setup,
} from './Ai13VoiceEndpointMath';

const X0 = 70;
const X1 = 690;
const T_MIN = 100;
const T_MAX = 1500;
const Y_TOP = 24;
const Y_BOT = 184;
const Y_MAX = 0.6;
const px = (t: number) => X0 + ((t - T_MIN) / (T_MAX - T_MIN)) * (X1 - X0);
const py = (c: number) => Y_BOT - (Math.min(c, Y_MAX) / Y_MAX) * (Y_BOT - Y_TOP);
const pct = (n: number, d = 1) => `${(n * 100).toFixed(d)}%`;
const fmt = (n: number) => n.toLocaleString('en-US');

/** Endpointing slider: silence threshold against time to first audio and the rate of cutting the user off. Illustrative model. */
export default function Ai13VoiceEndpoint() {
  const [silenceMs, setSilenceMs] = useState(700);
  const [turnModel, setTurnModel] = useState(false);
  const [speculate, setSpeculate] = useState(false);
  const s: Setup = { silenceMs, turnModel, speculate };
  const a = p50(s);
  const b = p95(s);
  const cut = cutRate(s);
  const call10 = callCutRate(cut, 10);
  const calls = llmCallsPerTurn(s);
  const limit = maxSilenceForP50(turnModel, speculate);
  const okA = a <= TARGET_P50;
  const okB = b <= TARGET_P95;

  const pts: string[] = [];
  for (let t = T_MIN; t <= T_MAX; t += 20) pts.push(`${px(t)},${py(cutRate({ silenceMs: t, turnModel, speculate }))}`);

  return (
    <CacheWidgetFrame title="Endpointing: the silence threshold" hint="Illustrative pause model. Move the slider.">
      <div className="mb-3 flex flex-wrap items-center gap-3">
        <span className="text-sm text-muted">Turn decision:</span>
        <Seg
          label="Turn decision"
          value={turnModel ? 'model' : 'timer'}
          options={[
            { id: 'timer', label: 'Silence timer only' },
            { id: 'model', label: 'Timer plus turn model' },
          ]}
          onChange={(v) => setTurnModel(v === 'model')}
        />
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={speculate} onChange={(e) => setSpeculate(e.target.checked)} className="accent-[var(--accent)]" />
          Start the LLM early (speculative)
        </label>
      </div>
      <div className="mb-4">
        <label htmlFor="a13e-t" className="mb-1 flex justify-between text-xs text-muted">
          <span>Silence threshold: how long the caller must be quiet before the turn ends</span>
          <span className="tabular-nums text-fg">{silenceMs} ms</span>
        </label>
        <input id="a13e-t" type="range" min={100} max={1500} step={20} value={silenceMs} onChange={(e) => setSilenceMs(+e.target.value)} className="w-full accent-[var(--accent)]" />
      </div>

      <div className="rounded-lg border p-3" style={{ borderColor: okA && okB ? 'var(--ok)' : 'var(--warn)' }} aria-live="polite">
        <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm sm:grid-cols-5">
          <div>
            <dt className="text-xs text-muted">P50 first audio (target 800)</dt>
            <dd className="font-semibold tabular-nums" style={{ color: okA ? 'var(--ok)' : 'var(--bad)' }} data-testid="ep-p50">{fmt(a)} ms</dd>
          </div>
          <div>
            <dt className="text-xs text-muted">P95 first audio (target 1,500)</dt>
            <dd className="font-semibold tabular-nums" style={{ color: okB ? 'var(--ok)' : 'var(--bad)' }} data-testid="ep-p95">{fmt(b)} ms</dd>
          </div>
          <div>
            <dt className="text-xs text-muted">Turns where we cut the caller off</dt>
            <dd className="font-semibold tabular-nums" data-testid="ep-cut">{pct(cut)}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted">10-turn calls with at least one cut-off</dt>
            <dd className="font-semibold tabular-nums" data-testid="ep-call">{pct(call10, 0)}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted">LLM calls per turn</dt>
            <dd className="font-semibold tabular-nums" data-testid="ep-llm">{calls.toFixed(2)}</dd>
          </div>
        </dl>

        <div className="mt-3">
          <SketchSvg width={720} height={236} label="Share of turns cut off against the silence threshold, with the largest threshold that still meets the P50 target">
            <SketchArrow points={[[X0, Y_BOT], [X1 + 10, Y_BOT]]} head="none" seed={seedOf('ep-x')} stroke="var(--muted)" />
            <SketchArrow points={[[X0, Y_BOT], [X0, Y_TOP - 8]]} head="none" seed={seedOf('ep-y')} stroke="var(--muted)" />
            {[0, 0.2, 0.4, 0.6].map((c) => (
              <HandText key={c} x={X0 - 8} y={py(c)} anchor="end" size={TEXT_SIZES.label} mono color="var(--muted)">
                {`${Math.round(c * 100)}%`}
              </HandText>
            ))}
            {[100, 500, 900, 1300].map((t) => (
              <HandText key={t} x={px(t)} y={Y_BOT + 16} size={TEXT_SIZES.label} mono color="var(--muted)">
                {String(t)}
              </HandText>
            ))}
            <HandText x={X1} y={Y_BOT + 40} anchor="end" size={TEXT_SIZES.label} color="var(--muted)">
              silence threshold, ms
            </HandText>
            <HandText x={X0 + 6} y={Y_TOP - 14} anchor="start" size={TEXT_SIZES.label} color="var(--muted)">
              turns where the caller is cut off
            </HandText>
            <polyline points={pts.join(' ')} fill="none" stroke="var(--fg)" strokeWidth={2.2} strokeLinejoin="round" />
            {limit >= T_MIN && (
              <>
                <SketchArrow points={[[px(limit), Y_BOT], [px(limit), Y_TOP]]} head="none" dashed stroke="var(--ok)" seed={seedOf('ep-lim')} />
                <HandText x={px(limit) + 8} y={Y_TOP + 16} anchor="start" size={TEXT_SIZES.label} color="var(--ok)">
                  {`P50 target met up to ${limit} ms`}
                </HandText>
              </>
            )}
            <circle cx={px(silenceMs)} cy={py(cut)} r={7} fill="var(--accent)" />
          </SketchSvg>
        </div>
      </div>
      <p className="mt-3 text-sm text-muted">
        Model, all illustrative: a turn has 1.5 pauses on average, and pause lengths follow an exponential spread with a 220 ms mean, so the share of pauses longer than T is e^(-T/220). A turn is cut off when at least one pause outlasts T. The turn model recognises 70% of mid-turn pauses as unfinished and adds 50 ms. Speculative mode starts STT, LLM, and TTS work after 100 ms of silence and keeps the result if the turn really ended. Stage times are the ElevenLabs P50 and P95 values; the P95 sum is a planning shortcut.
      </p>
    </CacheWidgetFrame>
  );
}

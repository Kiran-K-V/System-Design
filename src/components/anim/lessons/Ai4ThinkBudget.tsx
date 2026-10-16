import { useState } from 'react';
import CacheWidgetFrame, { Seg } from './CacheWidgetFrame';
import { HandText, SketchArrow, SketchEllipse, SketchSvg, TEXT_SIZES, seedOf } from '../sketch';
import { ILLUS, OUT_PRICE, decodeSeconds, illusAccuracy, illusKnee, outputCost, type ModelKey } from './Ai4ThinkMath';

const MODELS: { id: ModelKey; label: string }[] = [
  { id: 'haiku', label: 'Haiku 5.5 ($0.50/M out)' },
  { id: 'sonnet', label: 'Sonnet 5.5 ($10/M out)' },
  { id: 'opus', label: 'Opus 5.5 ($20/M out)' },
];
const ANS = 300;
const X0 = 60;
const X1 = 690;
const MAXT = 32000;
const px = (t: number) => X0 + (t / MAXT) * (X1 - X0);
const py = (a: number) => 220 - ((a - 30) / 60) * 180;

export default function Ai4ThinkBudget() {
  const [think, setThink] = useState(8000);
  const [model, setModel] = useState<ModelKey>('sonnet');
  const [calls, setCalls] = useState(1000);
  const lat = decodeSeconds(think + ANS);
  const first = decodeSeconds(think);
  const cost = outputCost(think + ANS, OUT_PRICE[model]);
  const acc = illusAccuracy(think);
  const knee = illusKnee();
  const pts: [number, number][] = [];
  for (let t = 0; t <= MAXT; t += 1000) pts.push([px(t), py(illusAccuracy(t))]);

  return (
    <CacheWidgetFrame title="Thinking budget explorer" hint="latency and cost are arithmetic; the accuracy curve is made up">
      <div className="mb-3 flex flex-wrap items-center gap-3">
        <Seg label="Model" value={model} options={MODELS} onChange={setModel} />
        <Seg label="Calls per day" value={calls} options={[100, 1000, 10000].map((c) => ({ id: c, label: `${c.toLocaleString('en-US')} calls/day` }))} onChange={setCalls} />
      </div>
      <label htmlFor="ai4-think" className="mb-1 flex justify-between text-xs text-muted">
        <span>Thinking tokens per call</span>
        <span className="tabular-nums text-fg" data-testid="think-n">{think.toLocaleString('en-US')}</span>
      </label>
      <input id="ai4-think" type="range" min={0} max={MAXT} step={500} value={think} onChange={(e) => setThink(+e.target.value)} className="mb-3 w-full accent-[var(--accent)]" />
      <div className="grid gap-3 text-sm sm:grid-cols-4">
        <div className="rounded-lg border border-line bg-surface p-2.5">
          <div className="text-xs text-muted">Wait for first answer token</div>
          <div className="text-lg font-semibold tabular-nums" data-testid="think-first">{first.toFixed(0)} s</div>
        </div>
        <div className="rounded-lg border border-line bg-surface p-2.5">
          <div className="text-xs text-muted">Total decode time</div>
          <div className="text-lg font-semibold tabular-nums" data-testid="think-lat">{lat.toFixed(0)} s</div>
        </div>
        <div className="rounded-lg border border-line bg-surface p-2.5">
          <div className="text-xs text-muted">Output cost per call</div>
          <div className="text-lg font-semibold tabular-nums" data-testid="think-cost">{`$${cost.toFixed(4)}`}</div>
        </div>
        <div className="rounded-lg border border-line bg-surface p-2.5">
          <div className="text-xs text-muted">Per day at {calls.toLocaleString('en-US')} calls</div>
          <div className="text-lg font-semibold tabular-nums" data-testid="think-day">{`$${(cost * calls).toFixed(2)}`}</div>
        </div>
      </div>
      <div className="mt-3">
        <SketchSvg width={720} height={290} label="Illustrative accuracy against thinking tokens">
          <SketchArrow points={[[X0, 220], [X1, 220]]} head="none" seed={seedOf('tb-x')} stroke="var(--muted)" />
          <SketchArrow points={[[X0, 220], [X0, 30]]} head="none" seed={seedOf('tb-y')} stroke="var(--muted)" />
          {[0, 8000, 16000, 24000, 32000].map((t) => (
            <HandText key={t} x={px(t)} y={240} size={TEXT_SIZES.note} mono color="var(--muted)">{t === 0 ? '0' : `${t / 1000}K`}</HandText>
          ))}
          <HandText x={(X0 + X1) / 2} y={268} size={TEXT_SIZES.note} color="var(--muted)">thinking tokens per call</HandText>
          <HandText x={X0 + 8} y={24} anchor="start" size={TEXT_SIZES.note} color="var(--warn)">ILLUSTRATIVE shape, not data. Measure your own set.</HandText>
          <SketchArrow points={pts} head="none" seed={seedOf('tb-curve')} stroke="var(--accent)" strokeWidth={2.2} />
          <SketchArrow points={[[px(knee), 220], [px(knee), 60]]} head="none" dashed seed={seedOf('tb-knee')} stroke="var(--ok)" />
          <HandText x={px(knee) + 8} y={80} anchor="start" size={TEXT_SIZES.note} color="var(--ok)">{`knee ~${(knee / 1000).toFixed(1)}K`}</HandText>
          <SketchEllipse cx={px(think)} cy={py(acc)} w={14} h={14} seed={seedOf('tb-dot')} fill="var(--accent)" stroke="var(--accent)" />
        </SketchSvg>
      </div>
      <p className="mt-1 text-xs leading-relaxed text-muted">
        Latency is thinking plus {ANS} answer tokens at 20 ms per token (assumed; the prompt-processing wait is not drawn). Cost is output tokens only, at the price shown, as of 2026-10-16; input cost is extra. The curve is a saturating shape with made-up constants (floor {ILLUS.floor}%, ceiling {ILLUS.ceil}%, scale {ILLUS.tau} tokens). It shows the idea of diminishing returns. No paper we read gives accuracy against thinking tokens for a current model, so we draw none. The model at this point scores {acc.toFixed(0)}% on the made-up curve.
      </p>
    </CacheWidgetFrame>
  );
}

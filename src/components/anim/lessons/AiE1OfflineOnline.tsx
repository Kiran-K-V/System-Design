import { useState } from 'react';
import CacheWidgetFrame, { Seg } from './CacheWidgetFrame';
import { HandText, SketchArrow, SketchEllipse, SketchSvg, TEXT_SIZES, seedOf } from '../sketch';
import { EXPERIMENTS, NOISE, outcome, summary, winners } from './AiE1MetricsLogic';

const X0 = 90;
const X1 = 680;
const Y0 = 300;
const Y1 = 30;
const XR = 3.2; // offline range -XR..XR (percent)
const YR = 1.4;
const px = (v: number) => X0 + ((v + XR) / (2 * XR)) * (X1 - X0);
const py = (v: number) => Y0 - ((v + YR) / (2 * YR)) * (Y0 - Y1);
const COLOR = { win: 'var(--ok)', loss: 'var(--bad)', flat: 'var(--muted)' } as const;

/** Fourteen past experiments (illustrative): offline gain against online effect. */
export default function AiE1OfflineOnline() {
  const [view, setView] = useState<'all' | 'winners'>('all');
  const list = view === 'all' ? EXPERIMENTS : winners(1.0);
  const s = summary(list);
  return (
    <CacheWidgetFrame title="Offline gain against online effect" hint="14 past experiments. Illustrative data.">
      <Seg label="Which experiments" value={view} onChange={setView} options={[{ id: 'all', label: 'All experiments' }, { id: 'winners', label: 'Only big offline winners' }]} />
      <div className="mt-3">
        <SketchSvg width={720} height={350} label="Scatter of offline gain against online effect for past experiments. The points are spread widely, so the link is weak.">
          <SketchArrow points={[[X0, Y0 + 10], [X1 + 10, Y0 + 10]]} seed={seedOf('e16-ax')} stroke="var(--muted)" />
          <SketchArrow points={[[X0 - 10, Y0], [X0 - 10, Y1 - 10]]} seed={seedOf('e16-ay')} stroke="var(--muted)" />
          <SketchArrow points={[[X0, py(0)], [X1, py(0)]]} seed={seedOf('e16-z')} stroke="var(--border)" dashed head="none" />
          <HandText x={(X0 + X1) / 2} y={338} size={TEXT_SIZES.note} color="var(--muted)">offline gain (percent)</HandText>
          <HandText x={X1} y={py(NOISE) - 10} anchor="end" size={TEXT_SIZES.note} color="var(--ok)">online win above this line</HandText>
          <SketchArrow points={[[X0, py(NOISE)], [X1, py(NOISE)]]} seed={seedOf('e16-n1')} stroke="var(--ok)" dashed head="none" />
          <SketchArrow points={[[X0, py(-NOISE)], [X1, py(-NOISE)]]} seed={seedOf('e16-n2')} stroke="var(--bad)" dashed head="none" />
          <HandText x={26} y={Y1 + 150} size={TEXT_SIZES.note} color="var(--muted)">{'online\neffect'}</HandText>
          {EXPERIMENTS.map((e) => {
            const shown = list.includes(e);
            return (
              <g key={e.id} opacity={shown ? 1 : 0.15}>
                <SketchEllipse cx={px(e.offline)} cy={py(e.online)} w={16} h={16} seed={seedOf(`e16-${e.id}`)} stroke={COLOR[outcome(e)]} fill={COLOR[outcome(e)]} />
              </g>
            );
          })}
        </SketchSvg>
      </div>
      <p className="text-sm" aria-live="polite">
        {`${s.n} experiments: ${s.win} won online, ${s.flat} were flat inside the noise band, ${s.loss} lost. Correlation between offline and online: ${s.r.toFixed(2)}.`}
      </p>
      <p className="mt-1 text-xs text-muted">Illustrative data, not from a real company. The band of plus or minus {NOISE} percent stands for noise in the online test. 1.0 is a perfect line, 0 is no link.</p>
    </CacheWidgetFrame>
  );
}

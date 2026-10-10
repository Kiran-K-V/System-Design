import { useState } from 'react';
import CacheWidgetFrame from './CacheWidgetFrame';
import { HandText, SketchArrow, SketchBox, SketchSvg, TEXT_SIZES, seedOf } from '../sketch';
import { assign, stats } from './kafkaGroups';

function Slider({ id, label, value, min, max, onChange }: { id: string; label: string; value: number; min: number; max: number; onChange: (v: number) => void }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1 flex justify-between text-xs text-muted">
        <span>{label}</span>
        <span className="tabular-nums text-fg">{value}</span>
      </label>
      <input id={id} type="range" min={min} max={max} step={1} value={value} onChange={(e) => onChange(+e.target.value)} className="w-full accent-[var(--accent)]" />
    </div>
  );
}

function Card({ title, value, tone }: { title: string; value: string; tone?: 'ok' | 'warn' }) {
  return (
    <div className="rounded-lg border border-line bg-surface p-2.5">
      <div className="text-xs text-muted">{title}</div>
      <div className={`text-lg font-semibold tabular-nums ${tone === 'warn' ? 'text-warn' : tone === 'ok' ? 'text-ok' : ''}`}>{value}</div>
    </div>
  );
}

const W = 720;
const px = (i: number, n: number) => {
  const pitch = Math.min(64, (W - 48) / n);
  return W / 2 + (i - (n - 1) / 2) * pitch;
};

export default function KafkaGroups() {
  const [p, setP] = useState(6);
  const [c, setC] = useState(3);
  const owner = assign(p, c);
  const st = stats(p, c);
  const pitchP = Math.min(64, (W - 48) / p);
  const pitchC = Math.min(64, (W - 48) / c);

  return (
    <CacheWidgetFrame title="Partitions and a consumer group" hint="One partition goes to one consumer of a group">
      <div className="mb-3 grid gap-4 sm:grid-cols-2">
        <Slider id="kg-p" label="Partitions in the topic" value={p} min={1} max={12} onChange={setP} />
        <Slider id="kg-c" label="Consumers in the group" value={c} min={1} max={12} onChange={setC} />
      </div>
      <SketchSvg width={W} height={230} label={`${p} partitions shared by ${c} consumers`}>
        <HandText x={W / 2} y={16} size={TEXT_SIZES.note} color="var(--muted)">
          Partitions
        </HandText>
        {Array.from({ length: p }, (_, i) => (
          <g key={`p${i}`}>
            <SketchBox cx={px(i, p)} cy={50} w={pitchP - 8} h={36} r={6} seed={seedOf(`kgp${i}`)} />
            <HandText x={px(i, p)} y={51} size={TEXT_SIZES.label}>{`P${i}`}</HandText>
          </g>
        ))}
        {owner.flatMap((ps, ci) =>
          ps.map((pi) => (
            <SketchArrow key={`l${pi}`} points={[[px(pi, p), 72], [px(ci, c), 156]]} stroke="var(--muted)" seed={seedOf(`kgl${pi}`)} />
          )),
        )}
        {owner.map((ps, ci) => {
          const idle = ps.length === 0;
          return (
            <g key={`c${ci}`}>
              <SketchBox cx={px(ci, c)} cy={180} w={pitchC - 8} h={44} r={8} seed={seedOf(`kgc${ci}`)} stroke={idle ? 'var(--warn)' : 'var(--fg)'} dashed={idle} fill={idle ? 'var(--warn)' : undefined} fillStyle="solid" />
              <HandText x={px(ci, c)} y={181} size={TEXT_SIZES.label}>{`C${ci}`}</HandText>
            </g>
          );
        })}
        <HandText x={W / 2} y={218} size={TEXT_SIZES.note} color="var(--muted)">
          Consumers of one group
        </HandText>
      </SketchSvg>
      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Card title="Consumers doing work" value={`${st.busy} of ${c}`} tone={st.idle ? 'warn' : 'ok'} />
        <Card title="Idle consumers" value={String(st.idle)} tone={st.idle ? 'warn' : undefined} />
        <Card title="Most partitions on one consumer" value={String(st.maxLoad)} />
        <Card title="Speed-up over one consumer" value={`${st.speedup.toFixed(1)}x`} />
      </div>
      <p className="mt-3 text-sm text-muted">
        Assumes every partition has equal load. A second consumer group would read the same partitions on its own, with its own committed offsets.
      </p>
    </CacheWidgetFrame>
  );
}

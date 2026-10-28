import { useState } from 'react';
import CacheWidgetFrame, { Seg } from './CacheWidgetFrame';
import { DIMS, EXAMPLE, TABLE4, coords, group, product, GPUS_PER_SERVER, type Dim } from './AiE2FourDLogic';

const NAMES: Record<Dim, string> = {
  TP: 'Tensor group: splits each weight matrix',
  CP: 'Context group: splits the input text',
  PP: 'Pipeline group: splits the layers',
  DP: 'Data group: GPUs that see different data and sync each step',
};

/** The paper's 16-GPU example of 4D parallelism, plus its three real configurations. Paper claims only; reading labelled. */
export default function AiE2FourDGrid() {
  const [dim, setDim] = useState<Dim>('TP');
  const [pick, setPick] = useState(0);
  const [row, setRow] = useState('b');
  const mates = group(pick, dim);
  const c = coords(pick);
  const t = TABLE4.find((r) => r.id === row)!;
  const n = product(EXAMPLE);
  // Column order: tp fastest, then cp, then pp. Row = dp.
  const cells = Array.from({ length: n }, (_, k) => k);

  return (
    <CacheWidgetFrame title="4D layout: who shares a group" hint="Paper example, 16 GPUs. Pick a GPU and a group type.">
      <div className="mb-3 flex flex-wrap items-center gap-3">
        <span className="text-sm text-muted">Group type:</span>
        <Seg label="Group type" value={dim} options={DIMS.map((d) => ({ id: d, label: d }))} onChange={setDim} />
      </div>
      <p className="mb-2 text-sm text-muted">{NAMES[dim]}. Click a GPU.</p>
      <div className="grid grid-cols-8 gap-1.5 sm:gap-2" role="group" aria-label="16 GPUs of the paper example">
        {cells.map((id) => {
          const sel = id === pick;
          const mate = mates.includes(id);
          return (
            <button
              key={id}
              type="button"
              aria-pressed={sel}
              aria-label={`GPU ${id}`}
              onClick={() => setPick(id)}
              className="rounded-md border py-2 text-center text-[13px] tabular-nums sm:py-3 sm:text-sm"
              style={{
                borderColor: sel ? 'var(--accent)' : mate ? 'var(--ok)' : 'var(--border)',
                background: sel ? 'color-mix(in srgb, var(--accent) 22%, transparent)' : mate ? 'color-mix(in srgb, var(--ok) 20%, transparent)' : 'transparent',
                borderWidth: sel ? 2 : 1,
              }}
            >
              {id}
            </button>
          );
        })}
      </div>
      <p className="mt-3 text-sm" aria-live="polite">
        GPU {pick} sits at position [TP {c.TP}, CP {c.CP}, PP {c.PP}, DP {c.DP}]. Its {dim} group is GPUs {mates.join(' and ')}. In this example every group has {mates.length} GPUs. A failure of GPU {pick} stops all {n}, because every GPU waits for every other at the end of a step.
      </p>

      <div className="mt-5 border-t border-line pt-4">
        <div className="mb-3 flex flex-wrap items-center gap-3">
          <span className="text-sm text-muted">Llama 3 405B configuration (from the paper):</span>
          <Seg label="Configuration" value={row} options={TABLE4.map((r) => ({ id: r.id, label: r.label }))} onChange={setRow} />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[13px] sm:text-sm">
            <tbody>
              {[
                ['Tensor, context, pipeline, data', `${t.tp} x ${t.cp} x ${t.pp} x ${t.dp} = ${product(t).toLocaleString('en-US')}${product(t) === t.gpus ? ' GPUs (matches)' : ' (does not match)'}`],
                ['Sequence length', t.seqLen.toLocaleString('en-US')],
                ['Batch size per data group', String(t.batchPerDp)],
                ['Tokens per batch', t.tokensPerBatch],
                ['TFLOPs per GPU', String(t.tflops)],
                ['BF16 model FLOPs utilization', `${t.mfu}%`],
                ['Servers in one tensor group (our reading)', `${Math.ceil(t.tp / GPUS_PER_SERVER)}`],
              ].map(([k, v]) => (
                <tr key={k} className="border-b border-line/60">
                  <td className="py-1.5 pr-2 text-muted">{k}</td>
                  <td className="py-1.5 tabular-nums">{v}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </CacheWidgetFrame>
  );
}

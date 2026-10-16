import { useState } from 'react';
import CacheWidgetFrame, { Seg } from './CacheWidgetFrame';
import { GPUS, MODELS, PRECISIONS, bytesRatio, cardsNeeded, freeGB, weightGB } from './Ai2QuantMath';

const W = 720;
const H = 230;
const L = 110;
const R = 24;

/** Weight size per precision for one model, against the memory of 1 to 8 cards. */
export default function Ai2QuantPick() {
  const [mid, setMid] = useState('l70');
  const [gid, setGid] = useState('h100');
  const [cards, setCards] = useState(1);
  const [pid, setPid] = useState('int4');

  const m = MODELS.find((x) => x.id === mid)!;
  const g = GPUS.find((x) => x.id === gid)!;
  const p = PRECISIONS.find((x) => x.id === pid)!;
  const mem = g.gb * cards;
  const bf = weightGB(m.paramsB, 2);
  const axis = Math.max(mem, bf) * 1.1;
  const px = (gb: number) => L + (gb / axis) * (W - L - R);
  const gb = weightGB(m.paramsB, p.bytes);
  const need = cardsNeeded(gb, g.gb);
  const free = freeGB(gb, g.gb, cards);
  const needBf = cardsNeeded(bf, g.gb);

  return (
    <CacheWidgetFrame title="Weights by precision against GPU memory" hint="weights only, no KV cache, 1 GB = 1e9 bytes">
      <div className="grid gap-4 text-sm">
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label htmlFor="a26-model" className="mb-1 block text-xs text-muted">Model (total parameters)</label>
            <select id="a26-model" value={mid} onChange={(e) => setMid(e.target.value)} className="w-full rounded-md border border-line bg-bg px-2 py-1.5 text-sm">
              {MODELS.map((x) => (
                <option key={x.id} value={x.id}>{x.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="a26-gpu" className="mb-1 block text-xs text-muted">GPU</label>
            <select id="a26-gpu" value={gid} onChange={(e) => setGid(e.target.value)} className="w-full rounded-md border border-line bg-bg px-2 py-1.5 text-sm">
              {GPUS.map((x) => (
                <option key={x.id} value={x.id}>{x.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="a26-cards" className="mb-1 flex justify-between text-xs text-muted">
              <span>Cards in the node</span>
              <span className="tabular-nums text-fg">{cards} = {mem} GB</span>
            </label>
            <input id="a26-cards" type="range" min={1} max={8} step={1} value={cards} onChange={(e) => setCards(+e.target.value)} className="w-full accent-[var(--accent)]" />
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-xs text-muted">Precision to inspect</span>
            <Seg label="Precision" value={pid} onChange={setPid} options={PRECISIONS.map((x) => ({ id: x.id, label: x.label }))} />
          </div>
        </div>
        <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label="Weight size for each precision against total GPU memory">
          {PRECISIONS.map((x, k) => {
            const v = weightGB(m.paramsB, x.bytes);
            const y = 20 + k * 46;
            const over = v > mem;
            const sel = x.id === pid;
            return (
              <g key={x.id}>
                <text x={L - 10} y={y + 22} textAnchor="end" fontSize={14} fill={sel ? 'var(--fg)' : 'var(--muted)'}>{x.label}</text>
                <rect x={L} y={y} width={Math.max(2, px(v) - L)} height={30} rx={6} fill={over ? 'var(--bad)' : 'var(--ok)'} fillOpacity={0.25} stroke={over ? 'var(--bad)' : 'var(--ok)'} strokeWidth={sel ? 2.2 : 1.4} />
                <text x={px(v) + 8 > W - R - 80 ? L + 10 : px(v) + 8} y={y + 20} fontSize={14} fill="var(--fg)" style={{ fontFamily: 'var(--font-mono)' }}>{Math.round(v * 10) / 10} GB</text>
              </g>
            );
          })}
          <line x1={px(mem)} x2={px(mem)} y1={8} y2={H - 28} stroke="var(--accent)" strokeWidth={2.2} strokeDasharray="6 5" />
          <text x={px(mem)} y={H - 8} textAnchor="end" fontSize={14} fill="var(--accent)">{cards} x {g.gb} GB = {mem} GB</text>
        </svg>
        <div className="grid gap-2 sm:grid-cols-4">
          <div className="rounded-lg border border-line bg-surface p-2.5">
            <div className="text-xs text-muted">{p.label} weights</div>
            <div className="text-lg font-semibold tabular-nums">{Math.round(gb * 10) / 10} GB</div>
          </div>
          <div className="rounded-lg border border-line bg-surface p-2.5">
            <div className="text-xs text-muted">Cards needed (weights only)</div>
            <div className="text-lg font-semibold tabular-nums">{need}</div>
          </div>
          <div className="rounded-lg border border-line bg-surface p-2.5">
            <div className="text-xs text-muted">Left for KV and activations</div>
            <div className="text-lg font-semibold tabular-nums" style={{ color: free < 0 ? 'var(--bad)' : 'var(--ok)' }}>{free < 0 ? 'does not fit' : `${Math.round(free * 10) / 10} GB`}</div>
          </div>
          <div className="rounded-lg border border-line bg-surface p-2.5">
            <div className="text-xs text-muted">Bytes read per decode step</div>
            <div className="text-lg font-semibold tabular-nums">{bytesRatio(2, p.bytes)}x fewer than BF16</div>
          </div>
        </div>
        <p className="text-xs leading-relaxed text-muted">
          BF16 needs {needBf} card{needBf === 1 ? '' : 's'} for this model; {p.label} needs {need}. The last tile is an upper bound on the decode speedup in a memory-bound step, since time follows bytes read. It ignores dequantization work and KV reads. Quality: this tool cannot tell you. Run your eval at each precision.
        </p>
      </div>
    </CacheWidgetFrame>
  );
}

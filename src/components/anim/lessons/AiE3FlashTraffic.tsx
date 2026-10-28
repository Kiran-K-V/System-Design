import { useState } from 'react';
import { blocks, flashScoreStore, flashTraffic, naiveScoreStore, naiveTraffic } from './AiE3FlashLogic';

const LENGTHS = [512, 1024, 2048, 4096, 8192, 16384, 32768, 65536, 131072];
const HEADS = [64, 128];
const SRAMS = [25600, 51200, 102400, 204800];
const BYTES = 2;

function human(bytes: number): string {
  const u = ['B', 'KB', 'MB', 'GB', 'TB'];
  let i = 0;
  let v = bytes;
  while (v >= 1000 && i < u.length - 1) {
    v /= 1000;
    i++;
  }
  return `${v >= 100 ? v.toFixed(0) : v >= 10 ? v.toFixed(1) : v.toFixed(2)} ${u[i]}`;
}

function Row({ label, a, b, aTid, bTid, max }: { label: string; a: number; b: number; aTid: string; bTid: string; max: number }) {
  const w = (v: number) => `${Math.max(1, (100 * Math.log10(Math.max(v, 1))) / Math.log10(max))}%`;
  return (
    <div>
      <div className="mb-1 text-xs font-medium">{label}</div>
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <div className="h-4 rounded-sm" style={{ width: w(a), background: 'color-mix(in srgb, var(--warn) 55%, var(--bg))' }} />
          <span className="text-xs tabular-nums" data-testid={aTid}>{human(a)}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-4 rounded-sm" style={{ width: w(b), background: 'color-mix(in srgb, var(--ok) 55%, var(--bg))' }} />
          <span className="text-xs tabular-nums" data-testid={bTid}>{human(b)}</span>
        </div>
      </div>
    </div>
  );
}

export default function AiE3FlashTraffic() {
  const [ni, setNi] = useState(3);
  const [di, setDi] = useState(0);
  const [si, setSi] = useState(1);
  const N = LENGTHS[ni];
  const d = HEADS[di];
  const M = SRAMS[si];
  const nt = naiveTraffic(N, d) * BYTES;
  const ft = flashTraffic(N, d, M) * BYTES;
  const ns = naiveScoreStore(N) * BYTES;
  const fs = flashScoreStore(N) * BYTES;
  const max = 1e13;
  return (
    <div className="not-prose my-8 rounded-2xl border border-line bg-surface/40 p-4 text-sm" data-testid="e3-flash-traffic">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <span className="text-[15px] font-semibold">One attention head: how much goes through HBM</span>
        <span className="text-xs text-muted">illustrative model, not a benchmark</span>
      </div>
      <p className="mb-3 text-xs text-muted">
        The model counts the memory reads and writes in the two algorithms of the FlashAttention paper, for the forward pass of one head, in 16-bit numbers. It leaves out masking, dropout and the backward pass. The bars use a log scale, so each gridline is 10 times more. Amber is standard attention, green is FlashAttention.
      </p>
      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label htmlFor="e3ft-n" className="mb-1 flex justify-between text-xs text-muted"><span>Sequence length</span><span className="tabular-nums text-fg" data-testid="e3ft-n">{N.toLocaleString('en-US')}</span></label>
          <input id="e3ft-n" type="range" min={0} max={LENGTHS.length - 1} step={1} value={ni} onChange={(e) => setNi(+e.target.value)} className="w-full accent-[var(--accent)]" />
        </div>
        <div>
          <label htmlFor="e3ft-d" className="mb-1 flex justify-between text-xs text-muted"><span>Head width</span><span className="tabular-nums text-fg" data-testid="e3ft-d">{d}</span></label>
          <input id="e3ft-d" type="range" min={0} max={HEADS.length - 1} step={1} value={di} onChange={(e) => setDi(+e.target.value)} className="w-full accent-[var(--accent)]" />
        </div>
        <div>
          <label htmlFor="e3ft-m" className="mb-1 flex justify-between text-xs text-muted"><span>SRAM for one tile (numbers)</span><span className="tabular-nums text-fg" data-testid="e3ft-m">{M.toLocaleString('en-US')}</span></label>
          <input id="e3ft-m" type="range" min={0} max={SRAMS.length - 1} step={1} value={si} onChange={(e) => setSi(+e.target.value)} className="w-full accent-[var(--accent)]" />
        </div>
      </div>
      <div className="mt-4 space-y-4">
        <Row label="Score matrix kept in HBM at one time" a={ns} b={fs} aTid="e3ft-ns" bTid="e3ft-fs" max={max} />
        <Row label="Total HBM reads and writes" a={nt} b={ft} aTid="e3ft-nt" bTid="e3ft-ft" max={max} />
      </div>
      <p className="mt-3 text-xs text-muted">
        Standard attention moves <span className="tabular-nums text-fg" data-testid="e3ft-ratio">{(nt / ft).toFixed(1)}x</span> as much as FlashAttention here. The tile is {blocks(M, d).Bc.toLocaleString('en-US')} keys wide. The stored score matrix drops from the square of the length to a few numbers per row. The traffic ratio does not grow with length: it depends on how big a tile the SRAM can hold compared with the head width.
      </p>
    </div>
  );
}

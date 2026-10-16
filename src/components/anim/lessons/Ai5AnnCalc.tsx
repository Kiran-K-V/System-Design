import { useState } from 'react';
import CacheWidgetFrame, { Seg } from './CacheWidgetFrame';
import { type IndexKind, bytesPerVector, fmtBytes, ivfWork, totalBytes } from './Ai5AnnMath';

const num = (v: number) => Math.round(v).toLocaleString('en-US');

/** Index memory and per-query work for N vectors. No recall numbers: recall must be measured on your data. */
export default function Ai5AnnCalc() {
  const [kind, setKind] = useState<IndexKind>('flat');
  const [logN, setLogN] = useState(9);
  const [d, setD] = useState(1536);
  const [pqM, setPqM] = useState(96);
  const [nbits, setNbits] = useState(8);
  const [hM, setHM] = useState(16);
  const [nlist, setNlist] = useState(128);
  const [nprobe, setNprobe] = useState(8);

  const n = Math.round(Math.pow(10, logN));
  const p = { kind, d, pqM, nbits, hnswM: hM };
  const bpv = bytesPerVector(p);
  const total = totalBytes(n, p);
  const flat = totalBytes(n, { ...p, kind: 'flat' });
  const pqBad = kind === 'pq' && d % pqM !== 0;
  const work = ivfWork(n, nlist, nprobe);

  return (
    <CacheWidgetFrame title="Index memory calculator" hint="FAISS wiki formulas">
      <div className="grid gap-4 text-sm md:grid-cols-2">
        <div className="space-y-3">
          <Seg
            label="Index type"
            value={kind}
            onChange={setKind}
            options={[
              { id: 'flat', label: 'Flat' },
              { id: 'ivfflat', label: 'IVFFlat' },
              { id: 'pq', label: 'PQ' },
              { id: 'hnsw', label: 'HNSW' },
            ]}
          />
          <div>
            <label htmlFor="a5a-n" className="mb-1 flex justify-between text-xs text-muted"><span>Vectors (N)</span><span className="tabular-nums text-fg">{num(n)}</span></label>
            <input id="a5a-n" type="range" min={5} max={10} step={0.05} value={logN} onChange={(e) => setLogN(+e.target.value)} className="w-full accent-[var(--accent)]" />
          </div>
          <div>
            <label htmlFor="a5a-d" className="mb-1 flex justify-between text-xs text-muted"><span>Dimensions (d)</span><span className="tabular-nums text-fg">{d}</span></label>
            <input id="a5a-d" type="range" min={128} max={3072} step={128} value={d} onChange={(e) => setD(+e.target.value)} className="w-full accent-[var(--accent)]" />
          </div>
          {kind === 'pq' && (
            <>
              <div>
                <label htmlFor="a5a-m" className="mb-1 flex justify-between text-xs text-muted"><span>PQ sub-vectors (M)</span><span className="tabular-nums text-fg">{pqM}</span></label>
                <input id="a5a-m" type="range" min={8} max={384} step={8} value={pqM} onChange={(e) => setPqM(+e.target.value)} className="w-full accent-[var(--accent)]" />
              </div>
              <Seg label="Bits per code" value={nbits} onChange={setNbits} options={[{ id: 8, label: '8 bits' }, { id: 12, label: '12 bits' }, { id: 16, label: '16 bits' }]} />
            </>
          )}
          {kind === 'hnsw' && (
            <div>
              <label htmlFor="a5a-hm" className="mb-1 flex justify-between text-xs text-muted"><span>HNSW M (links per node)</span><span className="tabular-nums text-fg">{hM}</span></label>
              <input id="a5a-hm" type="range" min={4} max={64} step={4} value={hM} onChange={(e) => setHM(+e.target.value)} className="w-full accent-[var(--accent)]" />
            </div>
          )}
          {kind === 'ivfflat' && (
            <>
              <div>
                <label htmlFor="a5a-nl" className="mb-1 flex justify-between text-xs text-muted"><span>nlist (clusters)</span><span className="tabular-nums text-fg">{num(nlist)}</span></label>
                <input id="a5a-nl" type="range" min={32} max={65536} step={32} value={nlist} onChange={(e) => setNlist(+e.target.value)} className="w-full accent-[var(--accent)]" />
              </div>
              <div>
                <label htmlFor="a5a-np" className="mb-1 flex justify-between text-xs text-muted"><span>nprobe (clusters scanned)</span><span className="tabular-nums text-fg">{nprobe}</span></label>
                <input id="a5a-np" type="range" min={1} max={256} step={1} value={nprobe} onChange={(e) => setNprobe(+e.target.value)} className="w-full accent-[var(--accent)]" />
              </div>
            </>
          )}
        </div>
        <div className="space-y-3">
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="rounded-lg border border-line bg-surface p-2.5">
              <div className="text-xs text-muted">Bytes per vector</div>
              <div className="text-lg font-semibold tabular-nums" data-testid="a5a-bpv">{num(bpv)}</div>
            </div>
            <div className="rounded-lg border border-line bg-surface p-2.5">
              <div className="text-xs text-muted">Total memory</div>
              <div className="text-lg font-semibold tabular-nums" style={{ color: 'var(--warn)' }} data-testid="a5a-total">{fmtBytes(total)}</div>
            </div>
          </div>
          <div className="rounded-lg border border-line bg-surface p-2.5">
            <div className="text-xs text-muted">Against flat float32</div>
            <div className="text-lg font-semibold tabular-nums" data-testid="a5a-ratio">{(flat / total).toFixed(2)}x {flat >= total ? 'smaller' : 'larger'}</div>
          </div>
          {kind === 'ivfflat' && (
            <div className="rounded-lg border border-line bg-surface p-2.5">
              <div className="text-xs text-muted">Distance checks per query</div>
              <div className="text-lg font-semibold tabular-nums" data-testid="a5a-work">{num(work)} <span className="text-sm font-normal text-muted">({((work / n) * 100).toFixed(2)}% of N)</span></div>
            </div>
          )}
          {pqBad && <p className="text-xs" style={{ color: 'var(--bad)' }}>d must divide evenly by M for PQ. {d} / {pqM} is not a whole number.</p>}
          <p className="text-xs leading-relaxed text-muted">
            Memory is per-vector bytes times N. It leaves out the PQ codebooks, the centroids, and any copy of the full vectors you keep for re-scoring. IVF work assumes equal-size lists. No recall is shown: recall at a given nprobe or efSearch depends on your data, so measure it.
          </p>
        </div>
      </div>
    </CacheWidgetFrame>
  );
}

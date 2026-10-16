/** Index memory and work formulas. Memory: FAISS wiki "Faiss indexes" bytes per vector. Pure functions. */

export type IndexKind = 'flat' | 'ivfflat' | 'pq' | 'hnsw';

export interface IndexParams {
  kind: IndexKind;
  d: number;
  /** PQ sub-vectors. */
  pqM: number;
  /** PQ bits per sub-vector code (FAISS: 8, 12 or 16). */
  nbits: number;
  /** HNSW links per node. */
  hnswM: number;
}

/** Bytes per vector. HNSW takes the FAISS term x as 1 (the page does not define x). */
export function bytesPerVector(p: IndexParams): number {
  switch (p.kind) {
    case 'flat':
      return 4 * p.d;
    case 'ivfflat':
      return 4 * p.d + 8;
    case 'pq':
      return Math.ceil((p.pqM * p.nbits) / 8);
    case 'hnsw':
      return 4 * p.d + p.hnswM * 2 * 4;
  }
}

export const totalBytes = (n: number, p: IndexParams) => n * bytesPerVector(p);

/** Vectors compared per query for IVF, assuming equal-size lists: nlist centroid checks plus nprobe lists. */
export function ivfWork(n: number, nlist: number, nprobe: number) {
  return nlist + (nprobe * n) / nlist;
}

export const fmtBytes = (b: number) =>
  b >= 1e12 ? `${(b / 1e12).toFixed(2)} TB` : b >= 1e9 ? `${(b / 1e9).toFixed(1)} GB` : `${(b / 1e6).toFixed(1)} MB`;

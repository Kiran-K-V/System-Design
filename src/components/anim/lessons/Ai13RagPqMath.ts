/**
 * Product quantization arithmetic for the visual search drill in lesson A13.3. Pure functions.
 * Formulas: FAISS wiki, flat PQ bytes per vector = ceil(M x nbits / 8); IVFADC adds 8 bytes (the vector id).
 * nlist and nprobe are ILLUSTRATIVE.
 */

export const N = 500_000_000;
export const DIM = 512;
export const M = 64;
export const NBITS = 8;
export const NLIST = 262_144;
export const NPROBE = 32;

export const codeBytes = (m = M, nbits = NBITS): number => Math.ceil((m * nbits) / 8);
export const ivfBytes = (m = M, nbits = NBITS): number => codeBytes(m, nbits) + 8;
export const rawBytes = (dim = DIM): number => dim * 4;

export const codesTotal = (n = N): number => n * codeBytes();
export const indexTotal = (n = N): number => n * ivfBytes();
export const rawTotal = (n = N): number => n * rawBytes();

export const subDims = (dim = DIM, m = M): number => dim / m;
export const tableCells = (m = M, nbits = NBITS): number => m * 2 ** nbits;
export const perCell = (n = N, nlist = NLIST): number => n / nlist;
export const candidates = (n = N, nlist = NLIST, nprobe = NPROBE): number => Math.round(perCell(n, nlist) * nprobe);
export const lookups = (c = candidates(), m = M): number => c * m;
export const coarseCentroidBytes = (nlist = NLIST, dim = DIM): number => nlist * dim * 4;
export const codebookBytes = (m = M, nbits = NBITS, dim = DIM): number => m * 2 ** nbits * subDims(dim, m) * 4;

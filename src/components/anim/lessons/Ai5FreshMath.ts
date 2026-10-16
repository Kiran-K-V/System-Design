/** Freshness arithmetic for lesson A5.8. Pure functions. All inputs are the learner's own assumptions. */

export interface FreshIn {
  /** Documents changed per second, steady state. */
  docsPerSec: number;
  /** Chunks that must be re-embedded per changed document. */
  chunksPerDoc: number;
  /** Embedding throughput of the pipeline, chunks per second. */
  embedPerSec: number;
  /** Fixed delay from commit to the CDC event reaching the pipeline, seconds. */
  cdcLagSec: number;
  /** Delay from upsert call to searchable (batching, commit, refresh), seconds. */
  commitSec: number;
  /** Size of a one-off burst of changed documents. */
  burstDocs: number;
  /** Chunks in the whole corpus, for a full re-embed. */
  corpusChunks: number;
}

export interface FreshOut {
  arrival: number; // chunks per second
  utilization: number; // arrival / capacity
  stable: boolean;
  /** Lag of one isolated change: cdc + its own embedding time + commit. */
  idleLagSec: number;
  /** Seconds to drain the burst while normal traffic keeps arriving. Infinity if not stable. */
  burstDrainSec: number;
  /** Worst freshness lag a document sees in the burst: idle lag + drain time. */
  burstWorstLagSec: number;
  /** Seconds to re-embed the corpus with the whole pipeline capacity. */
  reembedSec: number;
}

export function fresh(i: FreshIn): FreshOut {
  const arrival = i.docsPerSec * i.chunksPerDoc;
  const utilization = arrival / i.embedPerSec;
  const stable = arrival < i.embedPerSec;
  const idleLagSec = i.cdcLagSec + i.chunksPerDoc / i.embedPerSec + i.commitSec;
  const burstChunks = i.burstDocs * i.chunksPerDoc;
  const burstDrainSec = stable ? burstChunks / (i.embedPerSec - arrival) : Infinity;
  return {
    arrival,
    utilization,
    stable,
    idleLagSec,
    burstDrainSec,
    burstWorstLagSec: idleLagSec + burstDrainSec,
    reembedSec: i.corpusChunks / i.embedPerSec,
  };
}

export function fmtDuration(sec: number): string {
  if (!isFinite(sec)) return 'never (queue grows)';
  if (sec < 1) return `${sec.toFixed(2)} s`;
  if (sec < 90) return `${sec.toFixed(1)} s`;
  if (sec < 5400) return `${(sec / 60).toFixed(1)} min`;
  if (sec < 172800) return `${(sec / 3600).toFixed(1)} h`;
  return `${(sec / 86400).toFixed(1)} days`;
}

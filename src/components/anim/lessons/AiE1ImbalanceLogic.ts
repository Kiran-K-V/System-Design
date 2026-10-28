/** Logic for the E1.2 imbalance simulator. Pure functions. All inputs are illustrative. */

export const PAYMENTS = 100000;

export interface Confusion {
  tp: number;
  fn: number;
  fp: number;
  tn: number;
}

/** Confusion counts for `n` payments. `perThousand` frauds per 1,000 payments, `recall` share of frauds caught, `fpr` share of good payments flagged. */
export function confusion(perThousand: number, recall: number, fpr: number, n = PAYMENTS): Confusion {
  const frauds = Math.round((n * perThousand) / 1000);
  const good = n - frauds;
  const tp = Math.round(frauds * recall);
  const fp = Math.round(good * fpr);
  return { tp, fn: frauds - tp, fp, tn: good - fp };
}

export interface Metrics {
  accuracy: number;
  precision: number;
  recall: number;
}

export function metrics(c: Confusion): Metrics {
  const total = c.tp + c.fn + c.fp + c.tn;
  return {
    accuracy: (c.tp + c.tn) / total,
    precision: c.tp + c.fp === 0 ? 0 : c.tp / (c.tp + c.fp),
    recall: c.tp + c.fn === 0 ? 0 : c.tp / (c.tp + c.fn),
  };
}

/** The model that says "not fraud" every time. */
export function alwaysNo(perThousand: number, n = PAYMENTS): Confusion {
  return confusion(perThousand, 0, 0, n);
}

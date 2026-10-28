import DesignBuild, { type BuildEdge, type BuildNode, type BuildStep } from '../DesignBuild';

/** Ad click prediction: the serving and learning design grows one requirement at a time. */

const nodes: BuildNode[] = [
  { id: 'auction', x: 90, y: 70, w: 120, label: 'Auction', sub: 'ranks by bid x pCTR', step: 0 },
  { id: 'fs', x: 250, y: 70, w: 130, h: 80, label: 'Feature store', sub: 'online reads', shape: 'db', step: 1 },
  { id: 'model', x: 410, y: 70, w: 130, label: 'CTR model', sub: 'sparse + dense', step: 1 },
  { id: 'calib', x: 590, y: 70, w: 130, label: 'Calibration', sub: 'per segment', step: 2 },
  { id: 'logs', x: 590, y: 200, w: 130, h: 80, label: 'Impression log', sub: 'with request id', shape: 'db', step: 3 },
  { id: 'clicks', x: 590, y: 330, w: 130, label: 'Click stream', sub: 'late arrivals', step: 3 },
  { id: 'joiner', x: 410, y: 265, w: 130, label: 'Label joiner', sub: 'waits, then labels', step: 4 },
  { id: 'trainer', x: 250, y: 265, w: 130, label: 'Trainer', sub: 'minute-level sync', step: 5 },
  { id: 'guard', x: 90, y: 265, w: 120, label: 'Rollout gate', sub: 'shadow, canary', step: 6 },
  { id: 'mon', x: 90, y: 400, w: 120, label: 'Calibration monitor', step: 7 },
];

const edges: BuildEdge[] = [
  { from: 'auction', to: 'fs', step: 1 },
  { from: 'fs', to: 'model', step: 1 },
  { from: 'model', to: 'calib', step: 2 },
  { from: 'calib', to: 'logs', label: 'log pCTR', labelAt: [-46, 0], step: 3 },
  { from: 'clicks', to: 'joiner', step: 4 },
  { from: 'logs', to: 'joiner', step: 4 },
  { from: 'joiner', to: 'trainer', label: 'examples', labelAt: [0, -14], step: 5 },
  { from: 'trainer', to: 'guard', step: 6 },
  { from: 'guard', to: 'model', step: 6 },
  { from: 'logs', to: 'mon', step: 7 },
];

const steps: BuildStep[] = [
  { req: 'FR1: rank ads by expected value', caption: 'The auction asks for a click probability for each candidate ad. It ranks by bid times that probability. This lesson builds the box that answers it.', active: ['auction'] },
  { req: 'FR1: a score in a few ms', caption: 'The model reads features for the user, the ad, and the page from an online feature store. The model has embedding tables for sparse IDs and a small network for dense numbers.', packets: [{ from: 'auction', to: 'fs', label: 'ids' }, { from: 'fs', to: 'model', label: 'features', delay: 0.9 }] },
  { req: 'NFR: the number must be a true probability', caption: 'A calibration layer fixes the raw score before the auction sees it. It is fitted per segment (country, device, ad format). The auction prices from this number, so a bias here is a pricing error.', packets: [{ from: 'model', to: 'calib', label: 'raw' }] },
  { req: 'FR2: learn from clicks', caption: 'Every served impression is logged with a request id and the features used, including the prediction. Clicks arrive later in a separate stream, from minutes to days after the impression.', packets: [{ from: 'calib', to: 'logs', label: 'impression' }] },
  { req: 'NFR: labels must be right', caption: 'The joiner pairs each click with its impression by request id. It waits for a window before it labels an impression as no click. A short window labels late clicks as misses. A long window delays learning.', packets: [{ from: 'clicks', to: 'joiner', label: 'click' }, { from: 'logs', to: 'joiner', label: 'view', delay: 0.9 }] },
  { req: 'NFR: stay fresh', caption: 'The trainer learns from the joined stream and pushes the changed embedding rows to serving every few minutes. Dense layers move slowly and sync less often.', packets: [{ from: 'joiner', to: 'trainer', label: 'examples' }] },
  { req: 'NFR: a deploy must not hurt revenue', caption: 'A new model goes through a gate: shadow (scores logged, not used), then a small canary, with calibration and revenue as the gates. Rollback is one switch to the old model.', packets: [{ from: 'trainer', to: 'guard', label: 'candidate' }] },
  { req: 'NFR: catch drift in hours', caption: 'No new path for traffic. A monitor compares predicted and observed click rates per segment as labels mature. It pages when a segment drifts, and it can trip the rollback.', active: ['mon'] },
];

export default function AiE1AdBuild() {
  return <DesignBuild title="Ad click prediction, built up" steps={steps} nodes={nodes} edges={edges} height={470} label="Ad click prediction architecture growing from auction to calibration monitoring" />;
}

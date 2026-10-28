import DesignBuild, { type BuildEdge, type BuildNode, type BuildStep } from '../DesignBuild';

/** Real-time fraud scoring: the high-level design grows one requirement at a time. */

const nodes: BuildNode[] = [
  { id: 'pay', x: 90, y: 70, w: 120, label: 'Payment', step: 0 },
  { id: 'api', x: 250, y: 70, w: 130, label: 'Scoring API', sub: 'one call, one deadline', step: 0 },
  { id: 'model', x: 420, y: 70, w: 130, label: 'Model', sub: 'score 0 to 99', step: 0 },
  { id: 'fs', x: 420, y: 200, w: 130, h: 80, label: 'Online features', sub: 'velocity, history', shape: 'db', step: 1 },
  { id: 'rules', x: 590, y: 200, w: 130, label: 'Rules layer', sub: 'edited in minutes', step: 2 },
  { id: 'dec', x: 590, y: 70, w: 130, label: 'Decision', sub: 'allow, 3DS, review, block', step: 2 },
  { id: 'log', x: 250, y: 330, w: 130, h: 80, label: 'Decision log', sub: 'features as served', shape: 'db', step: 3 },
  { id: 'labels', x: 90, y: 330, w: 120, label: 'Labels', sub: 'weeks late', step: 4 },
  { id: 'train', x: 420, y: 330, w: 130, label: 'Retrain', sub: 'matured data only', step: 4 },
  { id: 'why', x: 590, y: 330, w: 130, label: 'Reason codes', sub: 'top features', step: 5 },
  { id: 'fb', x: 250, y: 200, w: 130, label: 'Fallback rules', sub: 'if scorer is down', shape: 'dashed', step: 6 },
];

const edges: BuildEdge[] = [
  { from: 'pay', to: 'api', step: 0 },
  { from: 'api', to: 'model', step: 0 },
  { from: 'fs', to: 'model', step: 1 },
  { from: 'model', to: 'dec', step: 2 },
  { from: 'rules', to: 'dec', step: 2 },
  { from: 'model', to: 'log', step: 3 },
  { from: 'labels', to: 'train', step: 4 },
  { from: 'log', to: 'train', step: 4 },
  { from: 'dec', to: 'why', step: 5 },
  { from: 'api', to: 'fb', dashed: true, step: 6 },
];

const steps: BuildStep[] = [
  { req: 'FR1: score every payment live', caption: 'A payment arrives and the scoring API calls the model. The caller waits, so the whole call has one deadline of under 100 ms, and the API owns it.', packets: [{ from: 'pay', to: 'api', label: 'payment' }, { from: 'api', to: 'model', label: 'score?', delay: 0.9 }] },
  { req: 'NFR: decide within 100 ms', caption: 'The model needs history, such as how many cards this IP used in the last hour. That history sits in an online feature store, so the read is one key lookup and not a query over raw data.', packets: [{ from: 'fs', to: 'model', label: 'features' }] },
  { req: 'FR2: turn a score into an action', caption: 'A policy maps the score to allow, ask for 3DS, send to review, or block. A rules layer sits beside the model so analysts can react to a new attack in minutes without a retrain.', packets: [{ from: 'model', to: 'dec', label: 'score' }, { from: 'rules', to: 'dec', label: 'rule hit', delay: 0.9 }] },
  { req: 'FR3: learn from outcomes', caption: 'Every decision is logged with the exact feature values the model saw. Training later reads this log, not a recomputed copy, so training and serving cannot disagree.', packets: [{ from: 'model', to: 'log', label: 'features and score' }] },
  { req: 'NFR: truth arrives late', caption: 'Chargebacks and review outcomes arrive days to months later. Retraining joins them to the log and trains only on payments old enough to be labeled. Recent payments wait.', packets: [{ from: 'labels', to: 'train', label: 'chargebacks' }, { from: 'log', to: 'train', label: 'rows', delay: 0.9 }] },
  { req: 'FR4: explain a decline', caption: 'The system keeps the top features that raised the score. A merchant sees why a payment was declined and can fix its data or write an allow rule.', packets: [{ from: 'dec', to: 'why', label: 'top features' }] },
  { req: 'NFR: survive a feature outage', caption: 'If the feature store or model is late, the API does not hang. It falls back to a small set of fixed rules. The team chooses in advance whether the fallback leans open or closed.', packets: [{ from: 'api', to: 'fb', label: 'timeout' }] },
];

export default function AiE1FraudBuild() {
  return <DesignBuild title="Real-time fraud scoring, built up" steps={steps} nodes={nodes} edges={edges} height={400} label="Fraud scoring architecture growing from a scoring call to a fallback path" />;
}

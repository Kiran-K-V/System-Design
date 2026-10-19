import DesignBuild, { type BuildEdge, type BuildNode, type BuildStep } from '../DesignBuild';

/** LLM gateway: the high-level design grows one requirement at a time. */

const nodes: BuildNode[] = [
  { id: 'apps', x: 80, y: 110, w: 120, label: 'Team apps', sub: 'many keys', step: 0 },
  { id: 'gw', x: 250, y: 110, w: 130, label: 'Gateway', sub: 'auth, alias', step: 0 },
  { id: 'quota', x: 250, y: 255, w: 130, h: 80, label: 'Quota store', sub: 'buckets per team', shape: 'db', step: 1 },
  { id: 'router', x: 440, y: 110, w: 130, label: 'Router', sub: 'order, budget', step: 2 },
  { id: 'pa', x: 640, y: 60, w: 120, label: 'Provider A', step: 2 },
  { id: 'pb', x: 640, y: 160, w: 120, label: 'Provider B', sub: 'fallback', step: 2 },
  { id: 'cache', x: 440, y: 255, w: 130, h: 80, label: 'Cache', sub: 'tenant in key', shape: 'db', step: 3 },
  { id: 'ledger', x: 250, y: 390, w: 130, h: 80, label: 'Ledger', sub: 'usage by tag', shape: 'db', step: 4 },
  { id: 'budget', x: 440, y: 390, w: 130, label: 'Budgets', sub: 'alert, cut off', step: 5 },
  { id: 'evals', x: 640, y: 270, w: 120, label: 'Eval gate', sub: 'route table', step: 6 },
  { id: 'invoice', x: 640, y: 390, w: 120, label: 'Invoices', sub: 'monthly', shape: 'dashed', step: 7 },
];

const edges: BuildEdge[] = [
  { from: 'apps', to: 'gw', step: 0 },
  { from: 'gw', to: 'quota', label: 'take', labelAt: [-28, 0], step: 1 },
  { from: 'gw', to: 'router', step: 2 },
  { from: 'router', to: 'pa', step: 2 },
  { from: 'router', to: 'pb', dashed: true, step: 2 },
  { from: 'gw', to: 'cache', label: 'look up', labelAt: [18, 22], step: 3 },
  { from: 'gw', to: 'ledger', step: 4 },
  { from: 'ledger', to: 'budget', step: 5 },
  { from: 'budget', to: 'quota', label: 'cap', labelAt: [-22, 0], step: 5 },
  { from: 'evals', to: 'router', label: 'weights', labelAt: [40, 8], step: 6 },
  { from: 'invoice', to: 'ledger', label: 'reconcile', labelAt: [0, 18], dashed: true, step: 7 },
];

const steps: BuildStep[] = [
  { req: 'FR1: one front door for every team', caption: 'Every team calls one internal API with its own gateway key. The gateway checks the key and maps an alias such as chat-main to a real model. Only the gateway holds provider keys (lesson A3.8).', packets: [{ from: 'apps', to: 'gw', label: 'request' }] },
  { req: 'NFR: no tenant starves another', caption: 'Before any provider call, the gateway takes tokens from the team bucket. The bucket holds the team share of the provider limit. A team over its share gets a 429 from the gateway and the provider never sees the call. Deep dive 1.', packets: [{ from: 'gw', to: 'quota', label: 'reserve' }] },
  { req: 'NFR: fail over within 5 seconds', caption: 'The router picks the target and sends the call. On a failure that another provider can fix, it moves to the fallback, inside a retry budget. Deep dive 3.', packets: [{ from: 'gw', to: 'router', label: 'call' }, { from: 'router', to: 'pa', label: 'send', delay: 0.9 }] },
  { req: 'FR2: lower cost on repeats', caption: 'An exact-match cache answers a repeated request with no provider call. The tenant id is part of the key, so one team can never be served another team’s answer.', packets: [{ from: 'gw', to: 'cache', label: 'key' }] },
  { req: 'NFR: spend per team is exact', caption: 'After the call, the gateway writes one ledger row from the provider usage fields: team, feature, model, token classes, dollars. It never estimates when the real count is in the response. Deep dive 3 and the drill.', packets: [{ from: 'gw', to: 'ledger', label: 'usage' }] },
  { req: 'FR3: budgets and chargeback', caption: 'A budget service reads the ledger. At 80% of a team budget it alerts. At 100% it lowers that team’s bucket to zero, so one team is cut off and the others keep running.', packets: [{ from: 'ledger', to: 'budget', label: 'spend' }, { from: 'budget', to: 'quota', label: 'cap', delay: 0.9 }] },
  { req: 'NFR: quality holds after a route change', caption: 'The route table lives in data, owned by the eval gate. A cheaper model enters a route only after it clears the quality bar on that task, and its traffic share ramps in steps. Deep dive 2.', packets: [{ from: 'evals', to: 'router', label: 'weights' }] },
  { req: 'NFR: spend is exact', caption: 'Each month the ledger total is compared with the provider invoice. A gap above the tolerance is a finding: traffic that bypassed the gateway, or a price that changed. No new box serves users here.', packets: [{ from: 'invoice', to: 'ledger', label: 'compare' }] },
];

export default function Ai13GatewayBuild() {
  return <DesignBuild title="LLM gateway, built up" steps={steps} nodes={nodes} edges={edges} height={460} label="LLM gateway architecture growing from one front door to quotas, routing, cache, ledger, budgets, eval gate, and invoice reconciliation" />;
}

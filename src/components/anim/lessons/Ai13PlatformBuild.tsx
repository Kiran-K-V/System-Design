import DesignBuild, { type BuildEdge, type BuildNode, type BuildStep } from '../DesignBuild';

/** Multi-tenant agent platform: the high-level design grows one requirement at a time. */

const nodes: BuildNode[] = [
  { id: 'tenant', x: 90, y: 90, w: 120, label: 'Tenant', sub: 'builds agents', step: 0 },
  { id: 'cp', x: 250, y: 90, w: 130, label: 'Control plane', sub: 'agent versions', step: 0 },
  { id: 'queue', x: 250, y: 215, w: 130, label: 'Run queues', sub: 'one per tenant', step: 1 },
  { id: 'workers', x: 410, y: 215, w: 130, label: 'Run workers', sub: 'durable runs', step: 1 },
  { id: 'model', x: 590, y: 215, w: 130, label: 'Model gateway', sub: 'keys, quota', step: 1 },
  { id: 'registry', x: 410, y: 90, w: 130, label: 'Tool registry', sub: 'vetted, pinned', step: 2 },
  { id: 'market', x: 590, y: 90, w: 130, label: 'Publishers', sub: 'strangers', shape: 'dashed', step: 2 },
  { id: 'tgw', x: 410, y: 340, w: 130, label: 'Tool gateway', sub: 'auth, scope, audit', step: 3 },
  { id: 'vault', x: 250, y: 340, w: 130, h: 80, label: 'Vault', sub: 'tenant grants', shape: 'db', step: 3 },
  { id: 'tools', x: 590, y: 450, w: 130, label: 'Tool servers', sub: 'MCP', step: 3 },
  { id: 'sandbox', x: 410, y: 450, w: 130, label: 'Sandboxes', sub: 'microVM per run', step: 4 },
  { id: 'meter', x: 590, y: 340, w: 130, h: 80, label: 'Meter', sub: 'ledger per tenant', shape: 'db', step: 5 },
  { id: 'kill', x: 250, y: 450, w: 130, label: 'Kill switch', sub: 'tenant, tool version', step: 6 },
];

const edges: BuildEdge[] = [
  { from: 'tenant', to: 'cp', step: 0 },
  { from: 'cp', to: 'queue', label: 'submit', labelAt: [-34, 0], step: 1 },
  { from: 'queue', to: 'workers', step: 1 },
  { from: 'workers', to: 'model', step: 1 },
  { from: 'cp', to: 'registry', step: 2 },
  { from: 'market', to: 'registry', step: 2 },
  { from: 'workers', to: 'tgw', step: 3 },
  { from: 'tgw', to: 'vault', step: 3 },
  { from: 'tgw', to: 'tools', step: 3 },
  { from: 'tgw', to: 'sandbox', step: 4 },
  { from: 'tgw', to: 'meter', step: 5 },
  { from: 'model', to: 'meter', step: 5 },
  { from: 'kill', to: 'tgw', step: 6 },
];

const steps: BuildStep[] = [
  { req: 'FR1: tenants define agents', caption: 'A tenant edits an agent in the control plane. The control plane stores each change as a numbered config version: prompt, model, tool list. It never runs an agent. This split is the base of the design (control plane and data plane).', packets: [{ from: 'tenant', to: 'cp' }] },
  { req: 'FR2: run agents on shared workers', caption: 'A run request goes into that tenant queue. Workers take runs by fair share, run the agent loop as a durable run, and call models through the model gateway (lessons A7.1, A7.7, A13.1). This is the data plane. Workers hold no tenant secret.', packets: [{ from: 'cp', to: 'queue' }, { from: 'queue', to: 'workers', delay: 0.9 }, { from: 'workers', to: 'model', delay: 1.8 }] },
  { req: 'FR3: install tools from a marketplace', caption: 'Strangers publish tool servers. The registry holds a tool only after vetting, and it records each version by content hash. A tenant installs a pinned version, never "latest". Deep dive 2.', packets: [{ from: 'market', to: 'registry' }, { from: 'cp', to: 'registry', delay: 0.9 }] },
  { req: 'NFR: zero cross-tenant access', caption: 'Workers never call a tool server directly. The tool gateway checks the pinned version, takes the tenant grant from the vault, calls the tool with that token, and writes an audit row. The agent never sees a token. Deep dives 1 and 3.', packets: [{ from: 'workers', to: 'tgw', label: 'tool call' }, { from: 'tgw', to: 'vault', delay: 0.9 }, { from: 'tgw', to: 'tools', delay: 1.8 }] },
  { req: 'FR4: run tenant code safely', caption: 'A code tool runs in its own microVM, made for this run and destroyed after it. It has no ambient credentials and a network allow list (lesson A7.4). The gateway starts it and reads its result.', packets: [{ from: 'tgw', to: 'sandbox', label: 'start' }] },
  { req: 'NFR: exact cost per tenant', caption: 'The tool gateway and the model gateway each write one usage line per call, tagged with tenant and run. The ledger is ours, so it works hours before the provider cost report, which is daily. Design point on cost.', packets: [{ from: 'tgw', to: 'meter' }, { from: 'model', to: 'meter', delay: 0.9 }] },
  { req: 'NFR: an incident path', caption: 'A flag per tenant, per tool version, and per connection sits in a store that the gateway reads every few seconds. One flip stops a bad tool version for every tenant. Design point on the kill switch.', packets: [{ from: 'kill', to: 'tgw', tone: 'bad' }] },
];

export default function Ai13PlatformBuild() {
  return <DesignBuild title="Agent platform, built up" steps={steps} nodes={nodes} edges={edges} height={500} label="Agent platform growing from a control plane to run queues, a tool registry, a tool gateway with a vault, sandboxes, a meter, and a kill switch" />;
}

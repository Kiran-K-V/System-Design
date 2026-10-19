import DesignBuild, { type BuildEdge, type BuildNode, type BuildStep } from '../DesignBuild';

/** Customer support agent: the high-level design grows one requirement at a time. */

const nodes: BuildNode[] = [
  { id: 'cust', x: 90, y: 70, w: 120, label: 'Customer', step: 0 },
  { id: 'gw', x: 250, y: 70, w: 130, label: 'Inbound gateway', sub: 'dedupe by id', step: 0 },
  { id: 'router', x: 410, y: 70, w: 130, label: 'Intent router', sub: 'small model', step: 1 },
  { id: 'rag', x: 590, y: 70, w: 130, label: 'Policy answer', sub: 'RAG, cited', step: 1 },
  { id: 'kb', x: 590, y: 200, w: 130, h: 80, label: 'Policy index', sub: 'approved docs', shape: 'db', step: 1 },
  { id: 'agent', x: 410, y: 200, w: 130, label: 'Action agent', sub: 'bounded loop', step: 2 },
  { id: 'tools', x: 410, y: 330, w: 130, label: 'Tool gateway', sub: 'tiers and limits', step: 2 },
  { id: 'orders', x: 590, y: 330, w: 130, label: 'Order and pay', sub: "customer's token", step: 2 },
  { id: 'audit', x: 250, y: 330, w: 130, h: 80, label: 'Action log', sub: 'idempotency keys', shape: 'db', step: 3 },
  { id: 'queue', x: 250, y: 200, w: 130, label: 'Handoff queue', sub: 'summary attached', step: 4 },
  { id: 'human', x: 90, y: 200, w: 120, label: 'Human agent', step: 4 },
  { id: 'review', x: 90, y: 330, w: 120, label: 'Action audit', sub: 'sampled', step: 6 },
];

const edges: BuildEdge[] = [
  { from: 'cust', to: 'gw', head: 'both', step: 0 },
  { from: 'gw', to: 'router', step: 1 },
  { from: 'router', to: 'rag', step: 1 },
  { from: 'rag', to: 'kb', step: 1 },
  { from: 'router', to: 'agent', step: 2 },
  { from: 'agent', to: 'tools', step: 2 },
  { from: 'tools', to: 'orders', step: 2 },
  { from: 'tools', to: 'audit', step: 3 },
  { from: 'router', to: 'queue', label: 'unsure', labelAt: [-30, -6], step: 4 },
  { from: 'tools', to: 'queue', label: 'approve', labelAt: [-18, 22], step: 4 },
  { from: 'queue', to: 'human', step: 4 },
  { from: 'audit', to: 'review', step: 6 },
];

const steps: BuildStep[] = [
  { req: 'FR0: take each message once', caption: 'A message arrives from chat or the helpdesk. The gateway records its event id and drops a repeat, so a retried webhook never starts a second run.', packets: [{ from: 'cust', to: 'gw', label: 'message' }] },
  { req: 'FR1: answer policy questions', caption: 'A small model labels the intent. Policy questions go down a fixed workflow: retrieve from approved documents, answer, cite the document. No tools, no loop, no money risk.', packets: [{ from: 'gw', to: 'router', label: 'text' }, { from: 'router', to: 'rag', label: 'policy', delay: 0.9 }] },
  { req: 'FR2: look up and change an order', caption: 'Order questions go to a bounded agent. It never touches a system itself. Every call passes the tool gateway, which carries the customer’s own token, not a shared admin key.', packets: [{ from: 'router', to: 'agent', label: 'order' }, { from: 'agent', to: 'tools', label: 'call', delay: 0.9 }] },
  { req: 'FR3: act within the action budget', caption: 'The gateway checks each call in code: tier, amount, caps, and the facts in the order record. It writes an idempotency key and the result to the action log before it reports success.', packets: [{ from: 'tools', to: 'audit', label: 'log' }] },
  { req: 'FR4: hand off to a person', caption: 'Two things feed the queue: a router that is unsure, and a gateway that holds a tier-2 action for approval. The person sees a summary and the proposed call, not a cold start.', packets: [{ from: 'router', to: 'queue', label: 'unsure' }, { from: 'queue', to: 'human', label: 'summary', delay: 0.9 }] },
  { req: 'NFR: ticket text is untrusted', caption: 'No new box. The ticket is data, never instructions. The agent has no tool that sends data out, and the gateway takes amounts and targets from the order record, not from the message.', active: ['tools'] },
  { req: 'NFR: count wrong actions', caption: 'People review a sample of the action log, and every action above a dollar limit. The wrong-action rate sits beside the resolution rate on the dashboard.', packets: [{ from: 'audit', to: 'review', label: 'sample' }] },
];

export default function Ai13SupportBuild() {
  return <DesignBuild title="Customer support agent, built up" steps={steps} nodes={nodes} edges={edges} height={400} label="Customer support agent architecture growing from gateway to action audit" />;
}

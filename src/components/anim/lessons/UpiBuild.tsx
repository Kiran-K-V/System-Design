import DesignBuild, { type BuildEdge, type BuildNode, type BuildStep } from '../DesignBuild';

const nodes: BuildNode[] = [
  { id: 'app', x: 75, y: 110, w: 110, h: 56, label: 'Payer app', step: 0 },
  { id: 'ppsp', x: 225, y: 110, w: 110, h: 56, label: 'Payer PSP', step: 0 },
  { id: 'switch', x: 385, y: 200, w: 130, h: 64, label: 'NPCI switch', step: 0 },
  { id: 'remit', x: 590, y: 100, w: 130, h: 56, label: 'Payer bank', step: 1 },
  { id: 'bene', x: 590, y: 300, w: 130, h: 56, label: 'Payee bank', step: 2 },
  { id: 'bpsp', x: 225, y: 300, w: 110, h: 56, label: 'Payee PSP', step: 3 },
  { id: 'settle', x: 385, y: 360, w: 150, h: 44, label: 'Settlement', shape: 'dashed', step: 5 },
];

const edges: BuildEdge[] = [
  { from: 'app', to: 'ppsp', step: 0 },
  { from: 'ppsp', to: 'switch', step: 0 },
  { from: 'switch', to: 'remit', step: 1 },
  { from: 'switch', to: 'bene', step: 2 },
  { from: 'switch', to: 'bpsp', step: 3 },
  { from: 'settle', to: 'switch', step: 5 },
];

const steps: BuildStep[] = [
  {
    req: 'FR1: pay to an address',
    caption: 'You type a payee address such as ravi@okbank and an amount. The payer app hands it to its PSP, the company that holds the app\'s link to the network. The PSP forwards it to one shared switch run by NPCI. Every app and bank has one connection, to this switch.',
    packets: [{ from: 'app', to: 'ppsp', label: 'pay ravi@' }, { from: 'ppsp', to: 'switch', label: 'request', delay: 0.9 }],
  },
  {
    req: 'FR2: debit the payer',
    caption: 'Leg one. The switch asks the payer\'s bank to take the money out of your account. You approved this with your UPI PIN on your phone. The bank checks the PIN and the balance, then answers yes or no.',
    packets: [{ from: 'switch', to: 'remit', label: 'debit' }, { from: 'remit', to: 'switch', label: 'debited', delay: 0.9, tone: 'ok' }],
  },
  {
    req: 'FR2: credit the payee',
    caption: 'Leg two. Only after the debit succeeds, the switch asks the payee\'s bank to add the money. The switch holds the two legs together. Neither bank talks to the other.',
    packets: [{ from: 'switch', to: 'bene', label: 'credit' }, { from: 'bene', to: 'switch', label: 'credited', delay: 0.9, tone: 'ok' }],
  },
  {
    req: 'FR3: both sides see the result',
    caption: 'The switch sends the final result back through the payee\'s PSP and the payer\'s PSP. Both apps show it. The payer app only displays what the network tells it. It never decides on its own.',
    packets: [{ from: 'switch', to: 'bpsp', label: 'success' }],
  },
  {
    req: 'NFR: no answer is not a no',
    caption: 'If a bank is silent, the switch asks it for the status of the same transaction. It does not start a new debit. A silent bank may already have moved the money. The next section walks through this.',
    packets: [{ from: 'switch', to: 'remit', label: 'status?' }],
    active: ['remit'],
  },
  {
    req: 'NFR: the books are exact',
    caption: 'The customer sees instant success, but banks do not move real money between themselves one payment at a time. Money moves later, in batches, and each bank checks the switch\'s report against its own records. That check is reconciliation.',
    packets: [{ from: 'settle', to: 'switch', label: 'reports' }],
  },
];

export default function UpiBuild() {
  return (
    <DesignBuild
      title="UPI payment, built requirement by requirement"
      nodes={nodes}
      edges={edges}
      steps={steps}
      height={410}
      label="High-level design of a UPI payment: a payer app and its PSP connect to one NPCI switch, which debits the payer's bank, credits the payee's bank, tells the payee's PSP, and later settles and reconciles."
    />
  );
}

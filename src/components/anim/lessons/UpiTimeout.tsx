import { DesignCompare, type CompareVariant } from '../DesignBuild';

const nodes: CompareVariant['nodes'] = [
  { id: 'app', x: 70, y: 170, w: 100, h: 56, label: 'Payer app' },
  { id: 'psp', x: 215, y: 170, w: 100, h: 56, label: 'Payer PSP' },
  { id: 'sw', x: 370, y: 170, w: 120, h: 60, label: 'NPCI switch' },
  { id: 'rem', x: 590, y: 80, w: 130, h: 56, label: 'Payer bank' },
  { id: 'ben', x: 590, y: 260, w: 130, h: 56, label: 'Payee bank' },
];
const edges: CompareVariant['edges'] = [
  { from: 'app', to: 'psp' },
  { from: 'psp', to: 'sw' },
  { from: 'sw', to: 'rem' },
  { from: 'sw', to: 'ben' },
];

const naive: CompareVariant = {
  id: 'naive',
  label: 'Naive: the app guesses',
  nodes,
  edges,
  steps: [
    { caption: 'The payer taps Pay. The request travels from the app through the PSP and the switch to the payer\'s bank.', packets: [{ from: 'app', to: 'psp', label: 'pay' }, { from: 'psp', to: 'sw', label: 'pay', delay: 0.8 }, { from: 'sw', to: 'rem', label: 'debit', delay: 1.6 }], active: ['app'] },
    { caption: 'The payer\'s bank takes the money out. Its answer is lost on the way back, so the switch hears nothing.', tones: { rem: 'ok', sw: 'warn' }, notes: [{ x: 470, y: 40, text: 'debited: 1', tone: 'ok' }] },
    { caption: 'The app waits, hears nothing, and decides the payment failed. It shows a red Failed screen. But the money has already left the account.', tones: { app: 'bad', rem: 'ok', sw: 'warn' }, notes: [{ x: 470, y: 40, text: 'debited: 1', tone: 'ok' }] },
    { caption: 'The user sees Failed and taps Pay again. This is a new payment, so the bank debits a second time. The customer has paid twice and the payee got nothing.', packets: [{ from: 'sw', to: 'rem', tone: 'bad' }], tones: { app: 'bad', rem: 'bad', sw: 'warn' }, notes: [{ x: 470, y: 40, text: 'debited: 2', tone: 'bad' }] },
  ],
};

const correct: CompareVariant = {
  id: 'correct',
  label: 'Correct: status check, then reversal',
  nodes,
  edges,
  steps: [
    { caption: 'Same start. The payer taps Pay, and the request reaches the payer\'s bank as a debit. Every request carries a transaction id that stays the same for this payment.', packets: [{ from: 'app', to: 'psp', label: 'pay' }, { from: 'psp', to: 'sw', label: 'pay', delay: 0.8 }, { from: 'sw', to: 'rem', label: 'debit', delay: 1.6 }], active: ['app'] },
    { caption: 'The bank debits the money. Its answer is lost, so the switch hears nothing.', tones: { rem: 'ok', sw: 'warn' }, notes: [{ x: 470, y: 40, text: 'debited: 1', tone: 'ok' }] },
    { caption: 'The app shows Pending, not Failed, and sends nothing new. The state is unknown, and a new debit could double-charge.', tones: { app: 'warn', rem: 'ok', sw: 'warn' }, notes: [{ x: 470, y: 40, text: 'debited: 1', tone: 'ok' }] },
    { caption: 'The network asks the payer\'s bank for the status of the same transaction id. The bank answers that it did debit. Now the state is known.', packets: [{ from: 'sw', to: 'rem', label: 'status?' }, { from: 'rem', to: 'sw', label: 'debited', tone: 'ok', delay: 0.9 }], tones: { app: 'warn', rem: 'ok', sw: 'accent' }, notes: [{ x: 470, y: 40, text: 'debited: 1', tone: 'ok' }] },
    { caption: 'Now the credit leg. If it works, the payee is paid and every screen turns to success. Here we follow the bad branch: the payee\'s bank cannot credit the money.', packets: [{ from: 'sw', to: 'ben', label: 'credit' }], tones: { app: 'warn', rem: 'ok', ben: 'bad', sw: 'warn' }, notes: [{ x: 470, y: 40, text: 'debited: 1', tone: 'ok' }] },
    { caption: 'The money is sent back with an automatic reversal. The payer\'s account is whole again, and the app now shows Failed, because the network said so. The customer did not have to do anything.', packets: [{ from: 'sw', to: 'rem', label: 'reverse', tone: 'ok' }], tones: { app: 'bad', rem: 'ok', ben: 'bad', sw: 'ok' }, notes: [{ x: 470, y: 40, text: 'net debit: 0', tone: 'ok' }] },
  ],
};

export default function UpiTimeout() {
  return (
    <DesignCompare
      title="A debit with no answer"
      prompt="Payer app:"
      variants={[naive, correct]}
      height={330}
      label="Two designs for a UPI debit whose answer is lost. A naive app shows Failed and the user pays twice. The correct design shows Pending, asks for the status of the same transaction, and reverses if the credit fails."
    />
  );
}

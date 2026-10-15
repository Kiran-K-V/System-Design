import { DesignCompare, type CompareVariant } from '../DesignBuild';

const fifo: CompareVariant = {
  id: 'fifo',
  label: 'Naive: one FIFO queue',
  nodes: [
    { id: 'camp', x: 85, y: 90, w: 130, h: 60, label: 'Campaign', sub: '3M messages' },
    { id: 'otp', x: 85, y: 250, w: 130, h: 60, label: 'Login code', sub: '1 message' },
    { id: 'q', x: 320, y: 170, w: 130, h: 64, label: 'One queue', sub: 'first in, first out' },
    { id: 'w', x: 520, y: 170, w: 110, h: 56, label: 'SMS pool' },
    { id: 'p', x: 660, y: 170, w: 100, h: 56, label: 'SMS vendor' },
  ],
  edges: [
    { from: 'camp', to: 'q' },
    { from: 'otp', to: 'q' },
    { from: 'q', to: 'w' },
    { from: 'w', to: 'p' },
  ],
  steps: [
    { caption: 'A marketing campaign starts. It adds 3,000,000 SMS messages to the one shared queue.', packets: [{ from: 'camp', to: 'q', label: '3M' }], tones: { q: 'warn' } },
    { caption: 'A user asks for a login code. The code goes to the back of the same queue, behind 3,000,000 messages.', packets: [{ from: 'otp', to: 'q', label: 'code' }], tones: { q: 'warn', otp: 'warn' } },
    { caption: 'The pool sends at most 5,000 messages per second, the vendor limit we assume. Time to reach the code: 3,000,000 / 5,000 = 600 seconds.', active: ['w'], tones: { q: 'bad', otp: 'bad' } },
    { caption: 'The code arrives after 10 minutes. Most login codes expire sooner. The user retries, which adds more messages. Urgent traffic was starved by bulk traffic.', tones: { otp: 'bad', p: 'bad' } },
  ],
};

const lanes: CompareVariant = {
  id: 'lanes',
  label: 'Better: lanes and caps',
  nodes: [
    { id: 'camp', x: 85, y: 80, w: 130, h: 60, label: 'Campaign', sub: '3M messages' },
    { id: 'otp', x: 85, y: 270, w: 130, h: 60, label: 'Login code', sub: '1 message' },
    { id: 'bulk', x: 310, y: 100, w: 130, h: 56, label: 'Bulk lane' },
    { id: 'urgent', x: 310, y: 250, w: 130, h: 56, label: 'Urgent lane' },
    { id: 'bw', x: 510, y: 100, w: 110, h: 60, label: 'Bulk pool', sub: 'cap 4,500/s' },
    { id: 'uw', x: 510, y: 250, w: 110, h: 60, label: 'Urgent pool', sub: 'cap 500/s' },
    { id: 'p', x: 665, y: 175, w: 90, h: 56, label: 'Vendor' },
  ],
  edges: [
    { from: 'camp', to: 'bulk' },
    { from: 'otp', to: 'urgent' },
    { from: 'bulk', to: 'bw' },
    { from: 'urgent', to: 'uw' },
    { from: 'bw', to: 'p' },
    { from: 'uw', to: 'p' },
  ],
  steps: [
    { caption: 'There are two lanes and two worker pools. The pools share the vendor limit of 5,000 messages per second: bulk may use 4,500, urgent keeps 500 in reserve.', active: ['bulk', 'urgent'] },
    { caption: 'The campaign adds 3,000,000 messages. They all go to the bulk lane.', packets: [{ from: 'camp', to: 'bulk', label: '3M' }], tones: { bulk: 'warn' } },
    { caption: 'A login code arrives. It goes to its own lane, which is empty, so it is at the front.', packets: [{ from: 'otp', to: 'urgent', label: 'code' }], tones: { urgent: 'ok' } },
    { caption: 'The urgent pool sends the code at once, in well under a second. The campaign drains at 4,500 per second: 3,000,000 / 4,500 = about 667 seconds. That is 11% slower than before. We paid that to protect urgent traffic.', packets: [{ from: 'uw', to: 'p', label: 'code', tone: 'ok' }], tones: { uw: 'ok', urgent: 'ok', otp: 'ok', bw: 'warn' } },
  ],
};

export default function NotifLanes() {
  return (
    <DesignCompare
      title="A campaign meets a login code"
      prompt="Queue design:"
      variants={[fifo, lanes]}
      height={340}
      label="Two designs for sending a campaign and a login code. With one FIFO queue the code waits 600 seconds. With separate lanes and worker caps the code is sent at once."
    />
  );
}

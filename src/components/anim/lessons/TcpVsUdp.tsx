import AnimFrame from '../AnimFrame';
import SequenceDiagram, { type SeqMessage } from '../SequenceDiagram';

const tcp: SeqMessage[] = [
  { from: 'Sender', to: 'Receiver', label: 'data 1' },
  { from: 'Receiver', to: 'Sender', label: 'ACK 1', tone: 'ok' },
  { from: 'Sender', to: 'Receiver', label: 'data 2', lost: true, tone: 'bad' },
  { from: 'Sender', to: 'Receiver', label: 'data 3' },
  { from: 'Receiver', to: 'Sender', label: 'ACK 1 (again)', tone: 'warn' },
  { from: 'Sender', to: 'Receiver', label: 'data 2 (resend)', tone: 'warn' },
  { from: 'Receiver', to: 'Sender', label: 'ACK 3', tone: 'ok' },
  { from: 'Receiver', to: 'Receiver', label: 'app gets 1, 2, 3', note: true, tone: 'ok' },
];

const udp: SeqMessage[] = [
  { from: 'Sender', to: 'Receiver', label: 'datagram 1' },
  { from: 'Sender', to: 'Receiver', label: 'datagram 2', lost: true, tone: 'bad' },
  { from: 'Sender', to: 'Receiver', label: 'datagram 3' },
  { from: 'Receiver', to: 'Receiver', label: 'app gets 1, 3', note: true, tone: 'warn' },
];

// [tcp messages shown, udp messages shown]
const shown: [number, number][] = [
  [0, 0],
  [1, 1],
  [2, 1],
  [3, 2],
  [4, 3],
  [5, 3],
  [6, 3],
  [7, 3],
  [8, 4],
];

const steps = [
  { caption: 'Same job on both sides: send 3 messages, and the network drops message 2. TCP is on the left. UDP is on the right.' },
  { caption: 'Message 1 goes out. TCP and UDP both just send it. UDP has no handshake, so it needed no round trip first.' },
  { caption: 'TCP receives message 1 and sends an ACK. UDP sends nothing back. The UDP sender never learns whether anything arrived.' },
  { caption: 'Message 2 is lost in both. Neither network reports the loss. Only the protocol on top decides what happens next.' },
  { caption: 'Message 3 arrives in both. The UDP receiver has 1 and 3 and does not know 2 existed, unless the app added its own numbers.' },
  { caption: 'TCP sees a gap. The receiver says "ACK 1" again: still waiting for 2. Three of these duplicates tell the sender to resend now.' },
  { caption: 'TCP resends message 2. UDP still has nothing to do.' },
  { caption: 'The TCP receiver now has 2 and 3, and acknowledges up to 3.' },
  { caption: 'Result. TCP delivered everything in order, but message 3 waited for message 2 to be resent. UDP delivered what arrived, with no delay and no guarantee. That is the whole trade.' },
];

export default function TcpVsUdp() {
  return (
    <AnimFrame title="Message 2 is lost: TCP vs UDP" steps={steps} interval={2600}>
      {(i) => (
        <div className="grid gap-2 sm:grid-cols-2 sm:gap-4">
          <div>
            <p className="text-center text-sm font-semibold">TCP</p>
            <SequenceDiagram actors={['Sender', 'Receiver']} messages={tcp} visible={shown[i][0]} width={310} />
          </div>
          <div>
            <p className="text-center text-sm font-semibold">UDP</p>
            <SequenceDiagram actors={['Sender', 'Receiver']} messages={udp} visible={shown[i][1]} width={310} />
          </div>
        </div>
      )}
    </AnimFrame>
  );
}

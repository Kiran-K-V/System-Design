import AnimFrame from '../AnimFrame';
import SequenceDiagram, { type SeqMessage } from '../SequenceDiagram';

const messages: SeqMessage[] = [
  { from: 'Client', to: 'Server', label: 'SYN  seq=x' },
  { from: 'Server', to: 'Client', label: 'SYN-ACK  seq=y, ack=x+1' },
  { from: 'Client', to: 'Server', label: 'ACK  ack=y+1', tone: 'ok' },
  { from: 'Client', to: 'Server', label: 'segment 1' },
  { from: 'Server', to: 'Client', label: 'ACK 1', tone: 'ok' },
  { from: 'Client', to: 'Server', label: 'segment 2', lost: true, tone: 'bad' },
  { from: 'Client', to: 'Client', label: 'no ACK, timer fires', note: true, tone: 'warn' },
  { from: 'Client', to: 'Server', label: 'segment 2 (again)', tone: 'warn' },
  { from: 'Server', to: 'Client', label: 'ACK 2', tone: 'ok' },
];

const steps = [
  { caption: 'A client wants to send bytes to a server over TCP. Before any data moves, both sides must agree on starting sequence numbers. Nothing is sent yet.' },
  { caption: 'SYN. The client picks a random starting sequence number x and says "I want to talk". This takes half a round trip to arrive.' },
  { caption: 'SYN-ACK. The server picks its own number y and confirms it saw x by answering ack = x+1. Now the client knows the server is alive and reachable.' },
  { caption: 'ACK. The client confirms y. The connection is open after 1 full round trip. The client may put its first data on this same packet. This cost is why connection reuse matters.' },
  { caption: 'The client sends segment 1. A segment is one chunk of the byte stream, at most ~1,460 bytes of payload on Ethernet.' },
  { caption: 'The server acknowledges it. TCP numbers every byte. An ACK says "I have everything up to here", so the sender can free that data.' },
  { caption: 'The client sends segment 2. A router drops it (a full queue, or a bad link). The network gives no error. The packet just vanishes.' },
  { caption: 'The client waits for an ACK. None comes. A retransmission timer fires. RFC 6298 sets the floor of this timer at 1 second. That is 2,000 times a same-data-center round trip.' },
  { caption: 'TCP sends the same segment again. The app never saw the loss. It only saw the data arrive late.' },
  { caption: 'The server acknowledges segment 2. Reliable delivery works, and it cost one extra timer wait. In practice, 3 duplicate ACKs trigger a faster resend (RFC 5681), but the cost is still at least one extra round trip.' },
];

export default function TcpHandshake() {
  return (
    <AnimFrame title="TCP: open a connection, lose a packet, recover" steps={steps} interval={2800}>
      {(i) => <SequenceDiagram actors={['Client', 'Server']} messages={messages} visible={i === 0 ? 0 : i} width={640} />}
    </AnimFrame>
  );
}

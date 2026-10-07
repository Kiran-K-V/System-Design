import AnimFrame from '../AnimFrame';
import SequenceDiagram, { type SeqMessage } from '../SequenceDiagram';

const messages: SeqMessage[] = [
  { from: 'Client', to: 'Server', label: 'SYN' },
  { from: 'Server', to: 'Client', label: 'SYN-ACK' },
  { from: 'Client', to: 'Client', label: 'RTT 1 spent: TCP open', note: true, tone: 'warn' },
  { from: 'Client', to: 'Server', label: 'ACK + ClientHello + key share' },
  { from: 'Server', to: 'Client', label: 'ServerHello + certificate + Finished', tone: 'ok' },
  { from: 'Client', to: 'Client', label: 'RTT 2 spent: keys agreed', note: true, tone: 'warn' },
  { from: 'Client', to: 'Server', label: 'Finished + GET /  (encrypted)' },
  { from: 'Server', to: 'Client', label: '200 OK  (encrypted)', tone: 'ok' },
  { from: 'Client', to: 'Client', label: 'RTT 3 spent: first byte', note: true, tone: 'ok' },
];

const steps = [
  { caption: 'A client opens an HTTPS connection to a new server. Two handshakes must finish before the first byte of the page: TCP, then TLS 1.3. Watch the round trips add up.' },
  { caption: 'TCP SYN leaves the client (lesson 2.1).' },
  { caption: 'SYN-ACK returns. The client now knows the server is up.' },
  { caption: '1 round trip is gone and no TLS has happened. Everything so far is plain TCP.' },
  { caption: 'The client sends the ACK and, right behind it, the TLS ClientHello. The hello lists the cipher suites it supports and carries its half of a key exchange (a "key share"). TLS 1.3 sends the key share at once, which saves a round trip.' },
  { caption: 'The server replies with its half of the key exchange, its certificate (proof of identity, signed by a CA the client trusts), and a Finished message. All of this after ServerHello is already encrypted (RFC 8446).' },
  { caption: 'Round trip 2 is gone. The client checked the certificate and derived the keys. TLS 1.2 needed two round trips here, so it would still be mid-handshake.' },
  { caption: 'The client sends its own Finished and, in the same flight, the encrypted HTTP request. No extra wait for the request.' },
  { caption: 'The server answers. The first byte arrives.' },
  { caption: 'Total: 3 round trips to the first byte of a brand-new HTTPS request: 1 for TCP, 1 for TLS, 1 for the request. At 100 ms RTT that is 300 ms. A reused connection pays only the last one.' },
];

export default function TlsHandshake() {
  return (
    <AnimFrame title="New HTTPS connection: TCP + TLS 1.3 + request" steps={steps} interval={2800}>
      {(i) => <SequenceDiagram actors={['Client', 'Server']} messages={messages} visible={i} width={640} />}
    </AnimFrame>
  );
}

import DesignBuild, { type BuildEdge, type BuildNode, type BuildStep } from '../DesignBuild';

const nodes: BuildNode[] = [
  { id: 'alice', x: 70, y: 90, w: 100, h: 44, label: 'Alice', step: 0 },
  { id: 'bob', x: 70, y: 240, w: 100, h: 44, label: 'Bob', step: 0 },
  { id: 'gw1', x: 250, y: 165, w: 134, h: 60, label: 'Chat server A', sub: 'holds sockets', step: 0 },
  { id: 'reg', x: 390, y: 50, w: 134, h: 76, label: 'Session map', sub: 'user to server', shape: 'db', step: 1 },
  { id: 'gw2', x: 480, y: 165, w: 134, h: 60, label: 'Chat server B', sub: 'holds sockets', step: 1 },
  { id: 'cara', x: 655, y: 165, w: 90, h: 44, label: 'Cara', step: 1 },
  { id: 'store', x: 250, y: 345, w: 134, h: 80, label: 'Message store', sub: 'by chat id', shape: 'db', step: 2 },
  { id: 'inbox', x: 480, y: 345, w: 134, h: 80, label: 'Inbox', sub: 'per device', shape: 'db', step: 4 },
  { id: 'members', x: 650, y: 50, w: 134, h: 76, label: 'Chat members', sub: 'up to 100', shape: 'db', step: 5 },
];

const edges: BuildEdge[] = [
  { from: 'alice', to: 'gw1', step: 0, label: 'send', labelAt: [-4, -14] },
  { from: 'gw1', to: 'bob', step: 0, label: 'push', labelAt: [-4, 14] },
  { from: 'gw1', to: 'reg', step: 1, label: 'where is Cara?', labelAt: [-70, -8] },
  { from: 'gw1', to: 'gw2', step: 1, label: 'forward', labelAt: [0, -16] },
  { from: 'gw2', to: 'cara', step: 1, label: 'push', labelAt: [0, -16] },
  { from: 'gw1', to: 'store', step: 2, label: 'save first', labelAt: [-52, 0] },
  { from: 'gw2', to: 'gw1', step: 3, label: 'ack', bend: 34, labelAt: [0, 22], dashed: true },
  { from: 'gw1', to: 'inbox', step: 4, label: 'no socket: queue', labelAt: [92, -6] },
  { from: 'gw1', to: 'members', step: 5, label: 'who is in chat?', labelAt: [-20, -30] },
];

const steps: BuildStep[] = [
  {
    req: 'FR1: send and receive a message',
    caption:
      'Start with one chat server. Alice and Bob each hold a WebSocket to it. The server keeps a map from user to socket in memory. Alice sends a frame, the server looks up Bob, and it writes the frame to Bob’s socket. This works until one machine cannot hold every socket.',
    packets: [{ from: 'alice', to: 'gw1' }, { from: 'gw1', to: 'bob', delay: 0.9 }],
  },
  {
    req: 'FR1: reach users on other servers',
    caption:
      'A second server holds Cara’s socket. Server A cannot see it. So every server writes “user X is on server Y” into a shared session map, and refreshes it with each heartbeat. Server A looks Cara up, then forwards the message to server B, which writes it to her socket.',
    packets: [{ from: 'gw1', to: 'reg' }, { from: 'gw1', to: 'gw2', delay: 0.9 }, { from: 'gw2', to: 'cara', delay: 1.8 }],
  },
  {
    req: 'FR2: delivery state, step 1 (sent)',
    caption:
      'Before anything else, server A saves the message in the store. Only then does it tell Alice “sent” (one tick). If the server died one line earlier, Alice would see no ack and retry with the same client message id. The id lets the server drop the duplicate.',
    packets: [{ from: 'gw1', to: 'store' }, { from: 'gw1', to: 'alice', delay: 0.9 }],
  },
  {
    req: 'FR2: delivery state, step 2 (delivered, read)',
    caption:
      'Cara’s phone acks every pushed message. The ack travels back to server A, which updates the receipt and tells Alice “delivered” (two ticks). A later ack from Cara’s app, when she opens the chat, becomes “read”. Each state is an ack from a different place.',
    packets: [{ from: 'cara', to: 'gw2' }, { from: 'gw2', to: 'gw1', delay: 0.9 }, { from: 'gw1', to: 'alice', delay: 1.8 }],
  },
  {
    req: 'FR3: deliver to offline users',
    caption:
      'If the session map has no entry for the recipient, nothing is pushed. The server leaves the message in that device’s inbox instead. When the phone reconnects, it says which sequence number it saw last, and the server replays everything after it. The inbox entry is deleted after the ack.',
    packets: [{ from: 'gw1', to: 'inbox' }],
  },
  {
    req: 'FR4: group chats',
    caption:
      'For a group, server A reads the member list and treats the message as one delivery per member. Online members get a push through their server. Offline members get an inbox entry. The sender’s work stays at one write, no matter how many members the group has.',
    packets: [{ from: 'gw1', to: 'members' }, { from: 'members', to: 'gw1', delay: 0.9 }],
  },
];

export default function WhatsappBuild() {
  return (
    <DesignBuild
      title="WhatsApp: the design grows one requirement at a time"
      steps={steps}
      nodes={nodes}
      edges={edges}
      height={400}
      label="Clients, two chat servers, a session map, a message store, an inbox, and a member list"
    />
  );
}

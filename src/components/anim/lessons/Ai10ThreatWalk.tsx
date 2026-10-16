import AnimFrame from '../AnimFrame';
import { HandText, SketchArrow, SketchBox, SketchSvg, TEXT_SIZES, seedOf } from '../sketch';

/** Data-flow diagram of an illustrative support bot. Trust boundaries light up one crossing at a time. */
type Tone = 'idle' | 'accent' | 'ok' | 'warn' | 'bad';
const COLOR: Record<Tone, string> = { idle: 'var(--muted)', accent: 'var(--accent)', ok: 'var(--ok)', warn: 'var(--warn)', bad: 'var(--bad)' };

interface Step {
  caption: string;
  /** Tone per node id. Missing means idle. */
  nodes: Record<string, Tone>;
  /** Tone per arrow id. Missing means idle. */
  arrows?: Record<string, Tone>;
  /** Gate marks on arrows (final step). */
  gates?: boolean;
}

const IN = [
  { id: 'chat', label: 'Customer chat', y: 70 },
  { id: 'ticket', label: 'Ticket text', y: 130 },
  { id: 'web', label: 'Fetched web page', y: 190 },
  { id: 'file', label: 'Email attachment', y: 250 },
];
const OUT = [
  { id: 'read', label: 'Read tickets', y: 70 },
  { id: 'refund', label: 'Refund API', y: 130 },
  { id: 'send', label: 'Send email', y: 190 },
  { id: 'ui', label: 'Chat UI', y: 250 },
];

const STEPS: Step[] = [
  {
    caption: 'A support bot reads tickets, answers customers, and can issue refunds. Assets: customer records, refund money, and the company name. Actors: customers, an outsider who can write a ticket or send an email, and your own staff. Only the two assets are lit here. Nothing is wrong yet.',
    nodes: { read: 'warn', refund: 'warn' },
  },
  {
    caption: 'Entry point 1: the customer chat. This is the one everybody lists. It is also the one you can rate-limit, log, and tie to a logged-in user.',
    nodes: { chat: 'accent' },
    arrows: { chat: 'accent' },
  },
  {
    caption: 'Entry point 2: ticket text. The bot reads the whole ticket, and the ticket was written by a customer, possibly one who wants the bot to misbehave. This is a different author from the user who is chatting.',
    nodes: { ticket: 'accent' },
    arrows: { ticket: 'accent' },
  },
  {
    caption: 'Entry point 3: a web page the bot fetches, such as a help-center article or a link in a ticket. Whoever controls that page controls these tokens. Nobody on your team wrote them.',
    nodes: { web: 'accent' },
    arrows: { web: 'accent' },
  },
  {
    caption: 'Entry point 4: an email attachment. Files are text once they are parsed. Any text the model reads is an entry point, so every file type the bot can open counts.',
    nodes: { file: 'accent' },
    arrows: { file: 'accent' },
  },
  {
    caption: 'All four land in one context. There is no inner boundary: the model has no field that says "this line is data" and "this line is a command". It reads one stream of tokens. This is why the boundary must sit outside the model.',
    nodes: { chat: 'bad', ticket: 'bad', web: 'bad', file: 'bad', model: 'accent' },
    arrows: { chat: 'bad', ticket: 'bad', web: 'bad', file: 'bad' },
  },
  {
    caption: 'Exit points: every tool call leaves the model. The refund call moves money. The email call sends data to a person you did not choose. The read call is the path for data to come back in. Each tool is an exit as well as an entry, so each one needs its own boundary.',
    nodes: { model: 'idle', refund: 'accent', send: 'warn', read: 'warn' },
    arrows: { refund: 'accent', send: 'warn', read: 'warn' },
  },
  {
    caption: 'One more exit: the chat window itself. If it renders an image or link from the model\'s answer, the browser sends a request to whatever host the answer names. The EchoLeak attack on Microsoft 365 Copilot used this path.',
    nodes: { ui: 'accent' },
    arrows: { ui: 'accent' },
  },
  {
    caption: 'The fix is a boundary at every crossing, in code and not in the prompt. Mark each input as untrusted. Put a deterministic gate on each tool call: allowed tool, allowed arguments, allowed destination. Check the output before it renders.',
    nodes: { model: 'idle', chat: 'ok', ticket: 'ok', web: 'ok', file: 'ok', read: 'ok', refund: 'ok', send: 'ok', ui: 'ok' },
    arrows: { chat: 'ok', ticket: 'ok', web: 'ok', file: 'ok', read: 'ok', refund: 'ok', send: 'ok', ui: 'ok' },
    gates: true,
  },
];

const tone = (t?: Tone) => COLOR[t ?? 'idle'];

export default function Ai10ThreatWalk() {
  return (
    <AnimFrame title="Entry points and exits of a support bot" steps={STEPS} interval={5200}>
      {(_, s) => (
        <SketchSvg width={720} height={320} label="Data-flow diagram: four untrusted text sources feed one model, which calls four exits.">
          <SketchBox cx={120} cy={160} w={200} h={250} r={10} seed={seedOf('tw-gl')} stroke="var(--muted)" dashed />
          <HandText x={120} y={14} size={TEXT_SIZES.heading} color="var(--muted)">Text in</HandText>
          <SketchBox cx={600} cy={160} w={200} h={250} r={10} seed={seedOf('tw-gr')} stroke="var(--muted)" dashed />
          <HandText x={600} y={14} size={TEXT_SIZES.heading} color="var(--muted)">Actions and output</HandText>
          {IN.map((n) => (
            <g key={n.id}>
              <SketchArrow points={[[226, n.y], [289, n.y]]} stroke={tone(s.arrows?.[n.id])} strokeWidth={s.arrows?.[n.id] === 'accent' ? 2.2 : 1.4} seed={seedOf(`tw-a${n.id}`)} />
              <SketchBox cx={120} cy={n.y} w={170} h={44} r={8} seed={seedOf(`tw-n${n.id}`)} stroke={tone(s.nodes[n.id])} fill={s.nodes[n.id] && s.nodes[n.id] !== 'idle' ? tone(s.nodes[n.id]) : undefined} strokeWidth={s.nodes[n.id] === 'accent' ? 2.2 : 1.4} />
              <HandText x={120} y={n.y} size={TEXT_SIZES.label}>{n.label}</HandText>
              {s.gates && <HandText x={257} y={n.y - 16} size={TEXT_SIZES.note} color="var(--ok)">tag</HandText>}
            </g>
          ))}
          <SketchBox cx={360} cy={160} w={130} h={200} r={10} seed={seedOf('tw-m')} stroke={tone(s.nodes.model)} fill={s.nodes.model === 'accent' ? 'var(--accent)' : undefined} strokeWidth={s.nodes.model === 'accent' ? 2.2 : 1.4} />
          <HandText x={360} y={160} size={TEXT_SIZES.label}>{'Model\n+ context'}</HandText>
          {OUT.map((n) => (
            <g key={n.id}>
              <SketchArrow points={[[431, n.y], [494, n.y]]} stroke={tone(s.arrows?.[n.id])} strokeWidth={s.arrows?.[n.id] === 'accent' ? 2.2 : 1.4} seed={seedOf(`tw-b${n.id}`)} />
              <SketchBox cx={600} cy={n.y} w={170} h={44} r={8} seed={seedOf(`tw-o${n.id}`)} stroke={tone(s.nodes[n.id])} fill={s.nodes[n.id] && s.nodes[n.id] !== 'idle' ? tone(s.nodes[n.id]) : undefined} strokeWidth={s.nodes[n.id] === 'accent' ? 2.2 : 1.4} />
              <HandText x={600} y={n.y} size={TEXT_SIZES.label}>{n.label}</HandText>
              {s.gates && <HandText x={462} y={n.y - 16} size={TEXT_SIZES.note} color="var(--ok)">gate</HandText>}
            </g>
          ))}
        </SketchSvg>
      )}
    </AnimFrame>
  );
}

import AnimFrame from '../AnimFrame';
import { HandText, SketchArrow, SketchBox, SketchEllipse, SketchSvg, TEXT_SIZES, seedOf } from '../sketch';

/** Attack shape follows Willison's lethal trifecta (2025-06-16) and the EchoLeak case (CVE-2025-32711). Names are illustrative. */
type LegState = 'idle' | 'on' | 'cut';
type Out = 'idle' | 'leak' | 'safe';

interface Step {
  caption: string;
  a: LegState;
  b: LegState;
  c: LegState;
  /** Which leg is newly active this step. */
  now?: 'a' | 'b' | 'c' | 'out';
  out: Out;
}

const steps: Step[] = [
  {
    caption: 'An agent design has three kinds of capability. Alone, each is normal and useful. An agent that reads untrusted text but has no secrets and no outbound path has nothing to steal and nowhere to send it.',
    a: 'idle', b: 'idle', c: 'idle', out: 'idle',
  },
  {
    caption: 'Leg A: untrusted content. The agent reads text an attacker can write: an inbound email, a web page, a ticket. The model cannot reliably tell that text apart from your instructions. So the attacker\'s words now sit in the context.',
    a: 'on', b: 'idle', c: 'idle', now: 'a', out: 'idle',
  },
  {
    caption: 'Leg B: private data. The same agent can read the inbox, files, or a database. This is usually the whole point of the tool. The attacker still cannot see any of it. Two legs are not yet a breach.',
    a: 'on', b: 'on', c: 'idle', now: 'b', out: 'idle',
  },
  {
    caption: 'Leg C: external communication. The agent can send mail, make a web request, or render an image. Any of these can carry text out. Now all three legs are present in one session, and the attack path is complete.',
    a: 'on', b: 'on', c: 'on', now: 'c', out: 'idle',
  },
  {
    caption: 'The attack. The planted text says: read the private data, put it in the address of an image, and show that image. The client fetches the image on its own. The data reaches the attacker\'s server with no click. A real attack on Microsoft 365 Copilot worked this way.',
    a: 'on', b: 'on', c: 'on', now: 'out', out: 'leak',
  },
  {
    caption: 'Fix 1: cut leg C. Block outbound requests to unknown hosts and stop rendering images from outside hosts. The attacker text still arrives and the agent can still read the data, but it cannot leave.',
    a: 'on', b: 'on', c: 'cut', out: 'safe',
  },
  {
    caption: 'Fix 2: cut leg A. Process mail only from senders you trust. The agent keeps its secrets and its send path, but no attacker text reaches it. A trusted-sender list is the usual cut for an email bot.',
    a: 'cut', b: 'on', c: 'on', out: 'safe',
  },
  {
    caption: 'Fix 3: cut leg B. Run the task that reads untrusted pages in a separate session that holds no private data. The injection can still steer the agent, but there is nothing worth taking.',
    a: 'on', b: 'cut', c: 'on', out: 'safe',
  },
];

const stroke = (s: LegState, now: boolean, out: Out) => (s === 'cut' ? 'var(--muted)' : out === 'leak' && s === 'on' ? 'var(--bad)' : now ? 'var(--accent)' : s === 'on' ? 'var(--fg)' : 'var(--muted)');
const fill = (s: LegState, now: boolean, out: Out) => (s === 'cut' ? undefined : out === 'leak' && s === 'on' ? 'var(--bad)' : now ? 'var(--accent)' : undefined);
const arrowTone = (s: LegState, out: Out) => (s === 'cut' ? 'var(--muted)' : out === 'leak' ? 'var(--bad)' : s === 'on' ? 'var(--accent)' : 'var(--muted)');

export default function Ai10TriVenn() {
  return (
    <AnimFrame title="Three legs, one attack path, three ways to close it" steps={steps} interval={5200}>
      {(_, s) => {
        const leak = s.out === 'leak';
        return (
          <SketchSvg width={720} height={330} label="An agent with three legs: untrusted content, private data, and external communication.">
            {/* leg A */}
            <SketchEllipse cx={110} cy={110} w={190} h={100} seed={seedOf('tvA')} stroke={stroke(s.a, s.now === 'a', s.out)} fill={fill(s.a, s.now === 'a', s.out)} strokeWidth={s.now === 'a' ? 2.2 : 1.4} dashed={s.a === 'cut' || s.a === 'idle'} />
            <HandText x={110} y={110} size={TEXT_SIZES.label} color={s.a === 'cut' ? 'var(--muted)' : 'var(--fg)'}>
              {'A  Untrusted\ncontent'}
            </HandText>
            <HandText x={110} y={178} size={TEXT_SIZES.note} color="var(--muted)">
              {s.a === 'cut' ? 'trusted senders only' : 'email, web page'}
            </HandText>
            {/* leg B */}
            <SketchEllipse cx={610} cy={110} w={190} h={100} seed={seedOf('tvB')} stroke={stroke(s.b, s.now === 'b', s.out)} fill={fill(s.b, s.now === 'b', s.out)} strokeWidth={s.now === 'b' ? 2.2 : 1.4} dashed={s.b === 'cut' || s.b === 'idle'} />
            <HandText x={610} y={110} size={TEXT_SIZES.label} color={s.b === 'cut' ? 'var(--muted)' : 'var(--fg)'}>
              {'B  Private\ndata'}
            </HandText>
            <HandText x={610} y={178} size={TEXT_SIZES.note} color="var(--muted)">
              {s.b === 'cut' ? 'none in this session' : 'inbox, files'}
            </HandText>
            {/* agent */}
            <SketchBox cx={360} cy={110} w={120} h={60} r={8} seed={seedOf('tvAgent')} stroke="var(--fg)" strokeWidth={1.4} />
            <HandText x={360} y={110} size={TEXT_SIZES.label}>
              Agent
            </HandText>
            {/* leg C */}
            <SketchEllipse cx={360} cy={270} w={230} h={80} seed={seedOf('tvC')} stroke={stroke(s.c, s.now === 'c', s.out)} fill={fill(s.c, s.now === 'c', s.out)} strokeWidth={s.now === 'c' ? 2.2 : 1.4} dashed={s.c === 'cut' || s.c === 'idle'} />
            <HandText x={360} y={270} size={TEXT_SIZES.label} color={s.c === 'cut' ? 'var(--muted)' : 'var(--fg)'}>
              {'C  External\ncommunication'}
            </HandText>
            {/* arrows */}
            <SketchArrow seed={seedOf('riVear1')} points={[[206, 110], [294, 110]]} stroke={arrowTone(s.a, s.out)} strokeWidth={s.a === 'on' ? 2.2 : 1.4} dashed={s.a !== 'on'} />
            <SketchArrow seed={seedOf('riVear2')} points={[[426, 110], [514, 110]]} head="both" stroke={arrowTone(s.b, s.out)} strokeWidth={s.b === 'on' ? 2.2 : 1.4} dashed={s.b !== 'on'} />
            <SketchArrow seed={seedOf('riVear3')} points={[[360, 146], [360, 226]]} stroke={arrowTone(s.c, s.out)} strokeWidth={s.c === 'on' ? 2.2 : 1.4} dashed={s.c !== 'on'} />
            {/* attacker server */}
            <SketchArrow seed={seedOf('riVear4')} points={[[480, 270], [548, 270]]} stroke={leak ? 'var(--bad)' : s.out === 'safe' ? 'var(--ok)' : 'var(--muted)'} strokeWidth={leak ? 2.2 : 1.4} dashed={!leak} />
            <SketchBox cx={630} cy={270} w={140} h={60} r={8} seed={seedOf('tvAtk')} stroke={leak ? 'var(--bad)' : s.out === 'safe' ? 'var(--ok)' : 'var(--muted)'} fill={leak ? 'var(--bad)' : s.out === 'safe' ? 'var(--ok)' : undefined} strokeWidth={leak || s.out === 'safe' ? 2.2 : 1.4} dashed={s.out === 'idle'} />
            <HandText x={630} y={270} size={TEXT_SIZES.label} color={leak ? 'var(--bad)' : s.out === 'safe' ? 'var(--ok)' : 'var(--muted)'}>
              {leak ? 'Attacker\ngets data' : s.out === 'safe' ? 'Attacker\ngets nothing' : 'Attacker\nserver'}
            </HandText>
          </SketchSvg>
        );
      }}
    </AnimFrame>
  );
}

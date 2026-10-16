import AnimFrame from '../AnimFrame';
import { HandText, SketchArrow, SketchBox, SketchCylinder, SketchSvg, TEXT_SIZES, seedOf } from '../sketch';

/** Replay of the Invariant Labs GitHub MCP attack (blog dated 2025-05-26). Issue #1 and PR #2 are real artifacts in github.com/ukend0464/pacman. */
type Tone = 'idle' | 'accent' | 'ok' | 'warn' | 'bad';
const COLOR: Record<Tone, string> = { idle: 'var(--muted)', accent: 'var(--accent)', ok: 'var(--ok)', warn: 'var(--warn)', bad: 'var(--bad)' };

interface Step {
  caption: string;
  node: Record<string, Tone>;
  arrow: Record<string, Tone>;
  /** How many context rows are shown. */
  rows: number;
  cuts?: boolean;
}

const ROWS = [
  { label: 'user: look at open issues', tone: 'idle' as Tone },
  { label: 'tool: issue #1 text', tone: 'bad' as Tone },
  { label: 'tool: private READMEs', tone: 'warn' as Tone },
  { label: 'call: create PR (public)', tone: 'accent' as Tone },
];

const STEPS: Step[] = [
  {
    caption: 'Setup. The user has a public repo, where anyone may open an issue, and private repos with personal data. The GitHub MCP server is connected with the user\'s own token. The model is Claude 4 Opus. Every tool is trusted and works as designed.',
    node: {}, arrow: {}, rows: 0,
  },
  {
    caption: 'The attacker opens issue #1 on the public repo (created 2025-05-23). The title is "IMPORTANT Author recognition!". The body is plain English that asks the reader to add a chapter about the author to the README. It needs no code, no special token, and no account with any rights.',
    node: { attacker: 'bad', pub: 'bad' }, arrow: { plant: 'bad' }, rows: 0,
  },
  {
    caption: 'The user sends a harmless request: "Have a look at the open issues" in the public repo. The user did nothing wrong. This is the only text the user wrote.',
    node: { user: 'accent', agent: 'idle' }, arrow: { ask: 'accent' }, rows: 1,
  },
  {
    caption: 'The agent lists the issues. The body of issue #1 comes back as a tool result and joins the context. Nothing marks it as written by a stranger. To the model it is one more block of text.',
    node: { agent: 'accent', pub: 'bad' }, arrow: { fetch: 'bad' }, rows: 2,
  },
  {
    caption: 'The agent follows the issue. It reads the README of each private repo, because the issue said to. The tool call is allowed: the token covers every repo of this user. Claude Desktop asks for confirmation by default, but Invariant notes that many users pick "Always Allow".',
    node: { agent: 'accent', priv: 'warn' }, arrow: { read: 'warn' }, rows: 3,
  },
  {
    caption: 'The agent creates pull request #2 in the public repo and puts what it found in the PR body. Per Invariant, the leak included a private repo name, a relocation plan, and a salary. The PR is filed under the repo owner\'s account, because the agent acted with the owner\'s rights.',
    node: { agent: 'idle', pr: 'accent' }, arrow: { write: 'accent' }, rows: 4,
  },
  {
    caption: 'The PR is in a public repo. Anyone can read it, including the attacker. No exploit code ran and no server was breached. The leak is complete.',
    node: { pr: 'bad', attacker: 'bad' }, arrow: {}, rows: 4,
  },
  {
    caption: 'Where to cut. Cut 1: limit the token to the one repo the task needs, so the private read fails. Cut 2: block writes to a public repo after the session read untrusted text. The attack text itself has no reliable filter, because it is ordinary English.',
    node: { priv: 'ok', pr: 'ok' }, arrow: { read: 'ok', write: 'ok' }, rows: 4, cuts: true,
  },
];

const c = (t?: Tone) => COLOR[t ?? 'idle'];
const fillOf = (t?: Tone) => (t && t !== 'idle' ? c(t) : undefined);

export default function Ai10InjHijack() {
  return (
    <AnimFrame title="Hijack through a public issue (GitHub MCP, 2025)" steps={STEPS} interval={5600}>
      {(_, s) => (
        <SketchSvg width={720} height={350} label="An attacker issue in a public repo makes an agent copy private repo data into a public pull request.">
          <SketchBox cx={76} cy={50} w={100} h={44} r={8} seed={seedOf('ih-at')} stroke={c(s.node.attacker)} fill={fillOf(s.node.attacker)} />
          <HandText x={76} y={50} size={TEXT_SIZES.label}>Attacker</HandText>
          <SketchBox cx={250} cy={50} w={100} h={44} r={8} seed={seedOf('ih-us')} stroke={c(s.node.user)} fill={fillOf(s.node.user)} />
          <HandText x={250} y={50} size={TEXT_SIZES.label}>User</HandText>
          <SketchCylinder cx={76} cy={180} w={104} h={70} seed={seedOf('ih-pub')} stroke={c(s.node.pub)} fill={fillOf(s.node.pub)} />
          <HandText x={76} y={180} size={TEXT_SIZES.label}>Public repo</HandText>
          <HandText x={76} y={228} size={TEXT_SIZES.note} color="var(--muted)">issue #1</HandText>
          <SketchBox cx={250} cy={180} w={120} h={70} r={8} seed={seedOf('ih-ag')} stroke={c(s.node.agent)} fill={fillOf(s.node.agent)} strokeWidth={s.node.agent === 'accent' ? 2.2 : 1.4} />
          <HandText x={250} y={180} size={TEXT_SIZES.label}>{'Agent\n+ GitHub MCP'}</HandText>
          <SketchCylinder cx={250} cy={305} w={130} h={64} seed={seedOf('ih-prv')} stroke={c(s.node.priv)} fill={fillOf(s.node.priv)} />
          <HandText x={250} y={305} size={TEXT_SIZES.label}>Private repos</HandText>
          <SketchBox cx={76} cy={305} w={104} h={44} r={8} seed={seedOf('ih-pr')} stroke={c(s.node.pr)} fill={fillOf(s.node.pr)} strokeWidth={s.node.pr === 'accent' ? 2.2 : 1.4} />
          <HandText x={76} y={305} size={TEXT_SIZES.label}>Public PR #2</HandText>

          <SketchArrow points={[[76, 78], [76, 140]]} stroke={c(s.arrow.plant)} seed={seedOf('ih-a1')} />
          <SketchArrow points={[[250, 78], [250, 140]]} stroke={c(s.arrow.ask)} seed={seedOf('ih-a2')} />
          <SketchArrow points={[[134, 180], [184, 180]]} stroke={c(s.arrow.fetch)} head="none" seed={seedOf('ih-a3')} />
          <SketchArrow points={[[250, 220], [250, 270]]} stroke={c(s.arrow.read)} head="both" seed={seedOf('ih-a4')} />
          <SketchArrow points={[[196, 218], [132, 290]]} stroke={c(s.arrow.write)} seed={seedOf('ih-a5')} />
          {s.cuts && (
            <>
              <HandText x={290} y={248} size={TEXT_SIZES.note} color="var(--ok)" anchor="start">cut 1</HandText>
              <HandText x={136} y={262} size={TEXT_SIZES.note} color="var(--ok)" anchor="end">cut 2</HandText>
            </>
          )}

          <HandText x={535} y={22} size={TEXT_SIZES.heading} color="var(--muted)">What the model reads</HandText>
          {ROWS.map((r, i) => {
            const shown = i < s.rows;
            const last = i === s.rows - 1;
            return (
              <g key={r.label}>
                <SketchBox cx={535} cy={70 + i * 56} w={300} h={44} r={8} seed={seedOf(`ih-r${i}`)} stroke={shown ? c(last && r.tone === 'accent' ? 'accent' : r.tone) : 'var(--muted)'} fill={shown && r.tone !== 'idle' ? c(r.tone) : undefined} dashed={!shown} strokeWidth={last ? 2.2 : 1.4} />
                <HandText x={535} y={70 + i * 56} size={TEXT_SIZES.label} color={shown ? 'var(--fg)' : 'var(--muted)'}>{r.label}</HandText>
              </g>
            );
          })}
          <HandText x={535} y={300} size={TEXT_SIZES.note} color="var(--muted)">{s.rows >= 2 ? 'One stream. No marker says whose words are whose.' : 'Rows join the context as the run goes on.'}</HandText>
        </SketchSvg>
      )}
    </AnimFrame>
  );
}

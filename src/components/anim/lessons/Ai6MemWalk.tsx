import AnimFrame from '../AnimFrame';
import { HandText, SketchArrow, SketchBox, SketchSvg, TEXT_SIZES, seedOf } from '../sketch';

/** A scripted, illustrative run. File names and notes are made up. The /memories path and the view-first habit follow the Anthropic memory tool docs. */
type T = 'idle' | 'ok' | 'warn' | 'bad' | 'accent';
const COLOR: Record<T, string> = { idle: 'var(--muted)', ok: 'var(--ok)', warn: 'var(--warn)', bad: 'var(--bad)', accent: 'var(--accent)' };

interface Item {
  text: string;
  tone: T;
}
interface S {
  caption: string;
  session: string;
  window: Item[];
  files: Item[];
  arrow?: { dir: 'write' | 'read'; label: string };
}

const STEPS: S[] = [
  {
    caption: 'Session 1. The context window is the working memory. The user says how this project deploys. Right now, that fact exists only in the window. The memory store on the right holds one older note.',
    session: 'Session 1', window: [{ text: 'user: deploy = make ship', tone: 'accent' }], files: [{ text: 'prefs.md', tone: 'idle' }],
  },
  {
    caption: 'The agent decides this fact is worth keeping and writes a file. With the Anthropic memory tool, the model asks and your app runs the write, under /memories. Writing is a decision, and a policy should say what to write.',
    session: 'Session 1', window: [{ text: 'user: deploy = make ship', tone: 'idle' }, { text: 'tool: create deploy.md', tone: 'accent' }], files: [{ text: 'prefs.md', tone: 'idle' }, { text: 'deploy.md', tone: 'ok' }],
    arrow: { dir: 'write', label: 'create' },
  },
  {
    caption: 'Session 1 ends. The window is gone. Anything not written to the store is lost. The store lives in your application, so it survives.',
    session: 'Session 1 ended', window: [], files: [{ text: 'prefs.md', tone: 'idle' }, { text: 'deploy.md', tone: 'ok' }],
  },
  {
    caption: 'Session 2 starts with an empty window. The memory tool docs add an instruction to view the memory directory first. The agent lists /memories. It sees names and sizes, not contents. An old file, old-api.md, has not been read for a long time.',
    session: 'Session 2', window: [{ text: 'view /memories: 3 files', tone: 'accent' }], files: [{ text: 'prefs.md', tone: 'idle' }, { text: 'deploy.md', tone: 'idle' }, { text: 'old-api.md', tone: 'warn' }],
    arrow: { dir: 'read', label: 'view' },
  },
  {
    caption: 'The user asks for a release. The agent reads only deploy.md. Loading one small file costs few tokens. Loading all notes would put old-api.md in the window too. Recall means pulling the right note, not all notes.',
    session: 'Session 2', window: [{ text: 'view /memories: 3 files', tone: 'idle' }, { text: 'deploy.md: make ship', tone: 'accent' }], files: [{ text: 'prefs.md', tone: 'idle' }, { text: 'deploy.md', tone: 'ok' }, { text: 'old-api.md', tone: 'warn' }],
    arrow: { dir: 'read', label: 'view' },
  },
  {
    caption: 'Expiry. The docs advise deleting memory files that have not been accessed for a long time, and capping file sizes. A cleanup job removes old-api.md. A stale note is worse than none, because the agent may trust it.',
    session: 'Cleanup job', window: [], files: [{ text: 'prefs.md', tone: 'idle' }, { text: 'deploy.md', tone: 'ok' }],
  },
  {
    caption: 'The risk. If the agent saved a note from a web page it read, and that page held hidden instructions, the note now carries them. Next session reads it back as if it were a trusted fact. This is prompt injection with a longer life. Check what gets written, and keep the source of each note.',
    session: 'Session 3', window: [{ text: 'read web-note.md', tone: 'bad' }], files: [{ text: 'prefs.md', tone: 'idle' }, { text: 'deploy.md', tone: 'idle' }, { text: 'web-note.md', tone: 'bad' }],
    arrow: { dir: 'read', label: 'view' },
  },
];

export default function Ai6MemWalk() {
  return (
    <AnimFrame title="Memory across sessions: write, recall, expire" steps={STEPS} interval={5600}>
      {(i, s) => (
        <SketchSvg width={720} height={360} label={`Step ${i + 1}: ${s.session}`}>
          <SketchBox cx={150} cy={190} w={250} h={270} r={14} seed={seedOf('mw-win')} stroke={s.window.length ? 'var(--fg)' : 'var(--muted)'} dashed={!s.window.length} />
          <HandText x={150} y={36} size={TEXT_SIZES.heading} color="var(--muted)">Context window</HandText>
          <HandText x={150} y={78} size={TEXT_SIZES.note} color="var(--accent)">{s.session}</HandText>
          <SketchBox cx={570} cy={190} w={250} h={270} r={14} seed={seedOf('mw-store')} stroke="var(--fg)" />
          <HandText x={570} y={36} size={TEXT_SIZES.heading} color="var(--muted)">Store: /memories</HandText>
          {s.window.map((it, k) => (
            <g key={`${i}-w${k}`}>
              <SketchBox cx={150} cy={125 + k * 56} w={220} h={44} r={8} seed={seedOf(`mw-w${k}-${it.text}`)} stroke={COLOR[it.tone]} fill={it.tone === 'idle' ? undefined : COLOR[it.tone]} strokeWidth={it.tone === 'idle' ? 1.4 : 2.2} />
              <HandText x={150} y={125 + k * 56} size={TEXT_SIZES.note} mono color="var(--fg)">{it.text}</HandText>
            </g>
          ))}
          {s.files.map((it, k) => (
            <g key={`${i}-f${k}`}>
              <SketchBox cx={570} cy={125 + k * 56} w={200} h={44} r={8} seed={seedOf(`mw-f-${it.text}`)} stroke={COLOR[it.tone]} fill={it.tone === 'idle' ? undefined : COLOR[it.tone]} strokeWidth={it.tone === 'idle' ? 1.4 : 2.2} />
              <HandText x={570} y={125 + k * 56} size={TEXT_SIZES.label} mono color="var(--fg)">{it.text}</HandText>
            </g>
          ))}
          {s.arrow && (
            <g>
              <SketchArrow points={s.arrow.dir === 'write' ? [[290, 190], [432, 190]] : [[432, 190], [290, 190]]} stroke="var(--accent)" strokeWidth={2.2} seed={seedOf(`mw-ar-${i}`)} />
              <HandText x={361} y={170} size={TEXT_SIZES.note} color="var(--accent)">{s.arrow.label}</HandText>
            </g>
          )}
        </SketchSvg>
      )}
    </AnimFrame>
  );
}

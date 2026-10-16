import AnimFrame from '../AnimFrame';
import { HandText, SketchArrow, SketchBox, SketchSvg, TEXT_SIZES, seedOf } from '../sketch';

type Tone = 'idle' | 'active' | 'done';
interface Step {
  caption: string;
  active: number; // index of the active stage
  t: string; // seconds since the edit (illustrative)
  index: string; // what the index holds
  indexTone: 'bad' | 'warn' | 'ok';
  stale: boolean;
}

const STAGES = ['Source DB', 'CDC event', 'Re-chunk', 'Embed', 'Index'];
const X = [76, 218, 360, 502, 644];

const steps: Step[] = [
  { caption: 'A user edits a policy page. The source database commits version 2. The index still holds the chunks of version 1, so every search now returns old text. The stale clock starts at t = 0.', active: 0, t: '0.0 s', index: 'v1 chunks only (stale)', indexTone: 'bad', stale: true },
  { caption: 'Change data capture reads the commit from the database log and publishes one event. This takes 2 s in this example (illustrative). The event carries the document id and a version, not the whole text.', active: 1, t: '2.0 s', index: 'v1 chunks only (stale)', indexTone: 'bad', stale: true },
  { caption: 'The worker re-chunks the page into 8 chunks and hashes each one. 6 hashes match the stored ones. Only 2 chunks changed. Content hashes decide what needs work, as in the Merkle tree idea of Cursor\'s indexer.', active: 2, t: '2.5 s', index: 'v1 chunks only (stale)', indexTone: 'bad', stale: true },
  { caption: 'Embed the 2 changed chunks. The 6 unchanged chunks reuse cached vectors, so 6 of 8 embedding calls are saved. At 100 chunks per second the 2 calls take 0.02 s; the queue and network take the rest (illustrative: 1 s).', active: 3, t: '3.5 s', index: 'v1 chunks only (stale)', indexTone: 'bad', stale: true },
  { caption: 'Upsert the 2 new chunks. The write is durable but batched: a store like turbopuffer commits one log entry per second per namespace. For now the index holds both versions, so a search can return old or new text for the same page.', active: 4, t: '4.0 s', index: 'v1 and v2 chunks (mixed)', indexTone: 'warn', stale: true },
  { caption: 'Delete the 2 old chunks by id. The vector store only marks them deleted (a tombstone). They vanish from results at once but keep using memory until a background vacuum removes them. The stale window ends: about 4.5 s in this example.', active: 4, t: '4.5 s', index: 'v2 chunks (deleted ids tombstoned)', indexTone: 'ok', stale: false },
];

export default function Ai5FreshWalk() {
  return (
    <AnimFrame title="One edit travels from the source to the index" steps={steps} interval={6500}>
      {(_, s) => {
        const toneOf = (k: number): Tone => (k === s.active ? 'active' : k < s.active ? 'done' : 'idle');
        const col = { idle: 'var(--muted)', active: 'var(--accent)', done: 'var(--ok)' } as const;
        const ic = { bad: 'var(--bad)', warn: 'var(--warn)', ok: 'var(--ok)' }[s.indexTone];
        return (
          <SketchSvg width={720} height={290} label="An edit moving through CDC, chunking, embedding and the index, with a stale timer">
            {STAGES.map((name, k) => {
              const t = toneOf(k);
              return (
                <g key={name}>
                  <SketchBox cx={X[k]} cy={70} w={120} h={44} r={8} seed={seedOf(`fw-${k}`)} stroke={col[t]} strokeWidth={t === 'active' ? 2.2 : 1.4} fill={t === 'idle' ? undefined : col[t]} />
                  <HandText x={X[k]} y={71} size={TEXT_SIZES.label}>{name}</HandText>
                  {k < 4 && <SketchArrow points={[[X[k] + 66, 70], [X[k + 1] - 66, 70]]} seed={seedOf(`fa-${k}`)} stroke={k < s.active ? 'var(--ok)' : 'var(--muted)'} />}
                </g>
              );
            })}
            <HandText x={24} y={150} anchor="start" size={TEXT_SIZES.note} color="var(--muted)">time since the edit</HandText>
            <HandText x={24} y={188} anchor="start" size={TEXT_SIZES.display} mono color={s.stale ? 'var(--bad)' : 'var(--ok)'}>{s.t}</HandText>
            <HandText x={24} y={222} anchor="start" size={TEXT_SIZES.label} color={s.stale ? 'var(--bad)' : 'var(--ok)'}>{s.stale ? 'stale: searches return old text' : 'fresh: stale window closed'}</HandText>
            <SketchBox cx={520} cy={190} w={340} h={84} r={8} seed={seedOf('fi')} stroke={ic} strokeWidth={2.2} fill={ic} />
            <HandText x={520} y={166} size={TEXT_SIZES.note} color="var(--muted)">the index holds</HandText>
            <HandText x={520} y={200} size={TEXT_SIZES.label} color="var(--fg)">{s.index}</HandText>
            <HandText x={360} y={268} size={TEXT_SIZES.note} color="var(--muted)">{`stage ${s.active + 1} of 5, times are illustrative`}</HandText>
          </SketchSvg>
        );
      }}
    </AnimFrame>
  );
}

import AnimFrame from '../AnimFrame';
import { TONE, type Tone } from '../FlowDiagram';
import { Fade } from '../data-kit';
import { HandText, SketchArrow, SketchBox, SketchSvg, TEXT_SIZES, seedOf } from '../sketch';

type Where = 'none' | 'buffer' | 'segment' | 'committed';

interface Step {
  caption: string;
  doc: Where;
  translog: boolean;
  /** Result of a search for the document, if one runs on this step. */
  search?: { text: string; tone: Tone };
  active?: 'buffer' | 'segment' | 'disk' | 'translog';
  arrow?: { id: string; points: [number, number][] };
}

const steps: Step[] = [
  {
    caption: 'A shard keeps new documents in three places. An in-memory buffer takes fresh writes. Segments are small immutable pieces of the index that search can read. The translog is a log on disk. We follow one document, d1, from write to searchable.',
    doc: 'none',
    translog: false,
  },
  {
    caption: 'Index d1. The shard adds it to the in-memory buffer and appends it to the translog. By default the write is acknowledged only after the translog is fsynced on the primary and the replicas. So d1 is safe if the node crashes, even though it is not in any segment.',
    doc: 'buffer',
    translog: true,
    active: 'buffer',
    arrow: { id: 'w', points: [[105, 176], [105, 203]] },
  },
  {
    caption: 'Search for d1 now. Search reads segments, and d1 sits in the buffer, which search does not read. The result: zero hits. A write is acknowledged before it is searchable.',
    doc: 'buffer',
    translog: true,
    search: { text: 'search: 0 hits', tone: 'bad' },
  },
  {
    caption: 'Refresh. By default Elasticsearch refreshes every second, but only on indices that got a search in the last 30 seconds. A refresh writes the buffer into a new segment and opens it for search. It lands in the filesystem cache first, so it is much cheaper than a commit to disk.',
    doc: 'segment',
    translog: true,
    active: 'segment',
    arrow: { id: 'r', points: [[196, 130], [249, 130]] },
  },
  {
    caption: 'Search for d1 again. The segment is open, so the search finds it. Search is near real time, not instant: a document becomes visible after the next refresh. That is about a second with the default setting.',
    doc: 'segment',
    translog: true,
    search: { text: 'search: 1 hit', tone: 'ok' },
  },
  {
    caption: 'Flush. A flush performs a Lucene commit and starts a new translog generation. The segments are written to disk for good. The old translog is no longer needed for recovery. Refresh makes data searchable. Flush makes it durable in the index files.',
    doc: 'committed',
    translog: false,
    active: 'disk',
    arrow: { id: 'f', points: [[431, 130], [484, 130]] },
  },
];

function Zone({ cx, cy, w, h, title, sub, dashed, tone = 'default', seed }: { cx: number; cy: number; w: number; h: number; title: string; sub: string; dashed?: boolean; tone?: Tone; seed: string }) {
  return (
    <g>
      <SketchBox cx={cx} cy={cy} w={w} h={h} r={10} seed={seedOf(seed)} dashed={dashed} stroke={TONE[tone]} strokeWidth={tone === 'accent' ? 2.2 : 1.4} fill="var(--surface)" />
      <HandText x={cx} y={cy - h / 2 + 18} size={TEXT_SIZES.label}>{title}</HandText>
      <HandText x={cx} y={cy - h / 2 + 38} size={TEXT_SIZES.note} color="var(--muted)">{sub}</HandText>
    </g>
  );
}

function Doc({ cx, cy, tone = 'default' }: { cx: number; cy: number; tone?: Tone }) {
  return (
    <g>
      <SketchBox cx={cx} cy={cy} w={52} h={32} r={6} seed={seedOf(`esdoc${cx}`)} stroke={TONE[tone]} fill={tone === 'default' ? 'var(--bg)' : TONE[tone]} />
      <HandText x={cx} y={cy} size={TEXT_SIZES.note} mono>d1</HandText>
    </g>
  );
}

export default function EsRefresh() {
  return (
    <AnimFrame title="Why a new document is not searchable for about a second" steps={steps} interval={4600}>
      {(i, s) => (
        <SketchSvg width={680} height={310} label="A document moves from the in-memory buffer to a searchable segment to a committed segment, with the translog recording it on the way">
          <Zone cx={105} cy={115} w={170} h={110} title="Memory buffer" sub="not searchable" tone={s.active === 'buffer' ? 'accent' : 'default'} seed="esbuf" />
          <Zone cx={340} cy={115} w={170} h={110} title="Segment" sub="searchable" tone={s.active === 'segment' ? 'accent' : 'default'} seed="esseg" />
          <Zone cx={575} cy={115} w={170} h={110} title="Segment on disk" sub="committed" tone={s.active === 'disk' ? 'accent' : 'default'} seed="esdisk" />
          <Zone cx={105} cy={256} w={170} h={92} title="Translog" sub="on disk" dashed seed="estrans" tone={s.translog ? 'default' : 'muted'} />

          {s.doc === 'buffer' && <Fade step={i} born={1}><Doc cx={105} cy={134} /></Fade>}
          {s.doc === 'segment' && <Fade step={i} born={3}><Doc cx={340} cy={134} tone="ok" /></Fade>}
          {s.doc === 'committed' && (
            <>
              <Doc cx={340} cy={134} tone="ok" />
              <Fade step={i} born={5}><Doc cx={575} cy={134} tone="ok" /></Fade>
            </>
          )}
          {s.translog && <Doc cx={105} cy={280} />}
          {!s.translog && i === 5 && <HandText x={105} y={282} size={TEXT_SIZES.note} color="var(--muted)">new generation</HandText>}

          {s.arrow && <SketchArrow points={s.arrow.points} stroke="var(--accent)" seed={seedOf(`esarrow${s.arrow.id}`)} />}
          {s.arrow?.id === 'r' && <HandText x={222} y={106} size={TEXT_SIZES.note} color="var(--accent)">refresh</HandText>}
          {s.arrow?.id === 'w' && <HandText x={150} y={190} size={TEXT_SIZES.note} anchor="start" color="var(--accent)">append</HandText>}
          {s.arrow?.id === 'f' && <HandText x={458} y={106} size={TEXT_SIZES.note} color="var(--accent)">flush</HandText>}

          {s.search && (
            <HandText x={500} y={256} size={TEXT_SIZES.heading} color={TONE[s.search.tone]}>{s.search.text}</HandText>
          )}
        </SketchSvg>
      )}
    </AnimFrame>
  );
}

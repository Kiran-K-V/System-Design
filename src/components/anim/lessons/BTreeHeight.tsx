import { HandText, SketchArrow, SketchBox, SketchSvg, Badge, seedOf } from '../sketch';

/** Static infographic: the pages of a B-tree over 1 billion keys. Numbers are derived in the lesson text. */

const LEVELS = [
  { y: 78, w: 200, text: 'root: 1 page', tone: 'var(--ok)' },
  { y: 142, w: 270, text: 'level 2: 16 pages', tone: 'var(--ok)' },
  { y: 206, w: 350, text: 'level 3: 6,250 pages (50 MB)', tone: 'var(--ok)' },
  { y: 270, w: 440, text: 'leaves: 2,500,000 pages (20 GB)', tone: 'var(--warn)' },
];
const CX = 264;

export default function BTreeHeight() {
  return (
    <figure className="not-prose my-8 overflow-hidden rounded-xl border border-line bg-bg px-2 py-4 sm:px-4">
      <SketchSvg width={700} height={350} label="A B-tree over one billion keys has four levels. The top three levels hold about 6,267 pages, or 51 megabytes.">
        <HandText x={350} y={18} size={15} weight={700}>
          1 billion keys, 8 KB pages, ~20 bytes per entry: fan-out F is about 400
        </HandText>
        {LEVELS.map((l, i) => (
          <g key={l.text}>
            <SketchBox cx={CX} cy={l.y} w={l.w} h={46} r={8} seed={seedOf(l.text)} stroke={l.tone} fill="var(--surface)" fillStyle="solid" />
            <HandText x={CX} y={l.y} size={15}>
              {l.text}
            </HandText>
            <Badge cx={CX - l.w / 2 - 22} cy={l.y} n={i + 1} seed={seedOf(`b${i}`)} />
            {i < 3 && <SketchArrow points={[[CX, l.y + 25], [CX, LEVELS[i + 1].y - 25]]} stroke="var(--accent)" seed={seedOf(`a${i}`)} />}
          </g>
        ))}
        <SketchBox cx={598} cy={142} w={196} h={150} r={12} dashed stroke="var(--ok)" seed={seedOf('cache-grp')} />
        <HandText x={598} y={142} size={14} color="var(--ok)" weight={700}>
          {'Top 3 levels:\n6,267 pages = 51 MB\nStay in RAM.\n0 disk reads.'}
        </HandText>
        <HandText x={598} y={270} size={14} color="var(--warn)" weight={700}>
          {'Leaf: 1 SSD read ~100 µs\n+ 1 table page ~100 µs'}
        </HandText>
        <HandText x={350} y={334} size={14} color="var(--muted)">
          400 x 400 x 400 x 400 = 25.6 billion, more than 1 billion. So 4 levels.
        </HandText>
      </SketchSvg>
      <figcaption className="px-2 pt-2 text-sm text-muted">The numbered badges show the order of page reads for one lookup.</figcaption>
    </figure>
  );
}

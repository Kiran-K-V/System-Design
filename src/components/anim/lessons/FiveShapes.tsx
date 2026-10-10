import AnimFrame from '../AnimFrame';
import { HandText, SketchArrow, SketchBox, SketchEllipse, SketchSvg, seedOf } from '../sketch';

/** The same Chirp facts (3 users, 3 posts, 2 follows) stored in five database shapes. */

type Shape = 'facts' | 'relational' | 'kv' | 'document' | 'wide' | 'graph';

interface Step {
  caption: string;
  shape: Shape;
  good: string;
  weak: string;
}

const steps: Step[] = [
  {
    caption: 'Three users, three posts, two follows. This is all the data. Five kinds of database can hold it. What differs is the primary access path: the one question the database answers cheaply. Watch how the same facts change shape.',
    shape: 'facts',
    good: 'Q1: latest posts\nof Ana?\nQ2: who is two\nfollows away from Ana?\nQ3: posts per day,\nall users?',
    weak: '',
  },
  {
    caption: 'Relational. Facts live in tables, one row per fact, joined by keys. A user is stored once. The posts table points at it with user_id. The database can answer questions you did not plan, because every column can be filtered, joined, and indexed (lesson 4.3), and a transaction can change several rows together (lesson 4.4).',
    shape: 'relational',
    good: 'Any filter, any join,\nmulti-row transactions.\nQ1, Q2 and Q3 all work.',
    weak: 'Writes go through one\nprimary machine until\nyou shard (lesson 4.7).',
  },
  {
    caption: 'Key-value. The whole database is a map from a key to a value. The database does not look inside the value. Get and put by key are the fastest operations any store offers. Redis adds atomic operations on values, such as INCR for counters. The price: there is no query by anything but the key.',
    shape: 'kv',
    good: 'get/put by key at very\nhigh rate. Sessions,\ncaches, counters.',
    weak: 'No "posts by Ana".\nYou would keep a list\nunder another key.',
  },
  {
    caption: 'Document. One record holds a nested structure. The rule from the MongoDB docs: data that is accessed together should be stored together. Ana and her posts come back in one read, with no join. Fields can differ from document to document. The price: facts shared across documents are copied, and unbounded lists make documents grow without limit.',
    shape: 'document',
    good: 'One read returns the\nwhole aggregate.\nVaried record shapes.',
    weak: 'Many-to-many links and\nshared facts are your\ncode. Q2 is hard.',
  },
  {
    caption: 'Wide-column. A row is addressed by a partition key, which picks the node, and a clustering key, which sorts rows inside the partition. All of Ana\'s posts sit together, newest first. Q1 is one sequential read. The store is a log-structured engine (lesson 4.3), so writes are fast. The price: you ask only what the keys were built for.',
    shape: 'wide',
    good: 'Huge write rates. "Latest\nN rows for one key" is\none partition read.',
    weak: 'A new question needs a\nnew table. Cassandra:\n"a table for each query".',
  },
  {
    caption: 'Graph. Entities are nodes. Relationships are first-class, typed, directed edges that are stored with the nodes. Q2 becomes a two-hop walk: Ana, Ben, Cy. In a relational store that is a self-join per hop. The price: totals over all the data (Q3) are not what this shape is for.',
    shape: 'graph',
    good: 'Paths across many hops:\nfriends of friends,\nfraud rings.',
    weak: 'Bulk totals over all\nnodes (Q3) are not\nits strength.',
  },
];

const MONO = 14;
const LINE = 24;

function Mono({ x, y, children, color, weight }: { x: number; y: number; children: string; color?: string; weight?: number }) {
  return (
    <HandText x={x} y={y} size={MONO} anchor="start" mono color={color} weight={weight}>
      {children}
    </HandText>
  );
}

/** One line of mono cells at fixed x offsets. SVG collapses runs of spaces, so columns are placed explicitly. */
function Cells({ x, y, cols, cells, color, weight }: { x: number; y: number; cols: number[]; cells: string[]; color?: string; weight?: number }) {
  return (
    <g>
      {cells.map((c, i) => (
        <Mono key={i} x={x + cols[i]} y={y} color={color} weight={weight}>
          {c}
        </Mono>
      ))}
    </g>
  );
}

function Table({ x, y, w, title, cols, head, rows }: { x: number; y: number; w: number; title: string; cols: number[]; head: string[]; rows: string[][] }) {
  const h = 34 + (rows.length + 1) * LINE;
  return (
    <g>
      <SketchBox cx={x + w / 2} cy={y + h / 2} w={w} h={h} r={8} seed={seedOf(`tb${title}`)} fill="var(--surface)" fillStyle="solid" />
      <HandText x={x + w / 2} y={y + 16} size={15} weight={700}>
        {title}
      </HandText>
      <Cells x={x + 12} y={y + 46} cols={cols} cells={head} color="var(--muted)" />
      {rows.map((r, i) => (
        <Cells key={i} x={x + 12} y={y + 46 + (i + 1) * LINE} cols={cols} cells={r} />
      ))}
    </g>
  );
}

function Drawing({ shape }: { shape: Shape }) {
  switch (shape) {
    case 'facts':
      return (
        <g>
          <HandText x={20} y={60} size={17} weight={700} anchor="start">
            The facts
          </HandText>
          <HandText x={20} y={150} size={16} anchor="start" lineHeight={1.9}>
            {'3 users: Ana (7), Ben (8), Cy (9)\n3 posts: Ana wrote "hi" and "Ok",\nBen wrote "yo"\n2 follows: Ana follows Ben,\nBen follows Cy'}
          </HandText>
        </g>
      );
    case 'relational':
      return (
        <g>
          <Table x={8} y={30} w={116} title="users" cols={[0, 34]} head={['id', 'name']} rows={[['7', 'Ana'], ['8', 'Ben'], ['9', 'Cy']]} />
          <Table x={138} y={30} w={176} title="posts" cols={[0, 38, 92]} head={['id', 'user', 'text']} rows={[['91', '7', 'hi'], ['92', '7', 'Ok'], ['93', '8', 'yo']]} />
          <Table x={328} y={30} w={116} title="follows" cols={[0, 52]} head={['who', 'whom']} rows={[['7', '8'], ['8', '9']]} />
          <SketchArrow points={[[225, 176], [145, 214], [66, 176]]} stroke="var(--accent)" seed={seedOf('join')} />
          <HandText x={225} y={246} size={14} color="var(--accent)">
            {'join: posts.user matches users.id'}
          </HandText>
        </g>
      );
    case 'kv':
      return (
        <g>
          {[
            ['user:7', '{"name":"Ana"}'],
            ['post:91', '{"user":7,"text":"hi"}'],
            ['follows:7', '[8]'],
          ].map(([k, v], i) => {
            const y = 70 + i * 66;
            return (
              <g key={k}>
                <SketchBox cx={80} cy={y} w={130} h={42} r={8} seed={seedOf(`k${k}`)} stroke="var(--accent)" fill="var(--surface)" fillStyle="solid" />
                <HandText x={80} y={y} size={14} mono weight={700}>
                  {k}
                </HandText>
                <SketchArrow points={[[150, y], [180, y]]} seed={seedOf(`ka${k}`)} />
                <SketchBox cx={320} cy={y} w={270} h={42} r={8} seed={seedOf(`v${k}`)} fill="var(--surface)" dashed />
                <HandText x={320} y={y} size={14} mono halo>
                  {v}
                </HandText>
              </g>
            );
          })}
          <HandText x={225} y={282} size={14} color="var(--muted)">
            The store sees the left side only. The right side is opaque bytes.
          </HandText>
        </g>
      );
    case 'document': {
      const lines: [number, string][] = [
        [0, '// users/7'],
        [0, '{ "name": "Ana",'],
        [14, '"posts": ['],
        [28, '{ "text": "hi" },'],
        [28, '{ "text": "Ok" }'],
        [14, '],'],
        [14, '"follows": [8] }'],
      ];
      return (
        <g>
          <SketchBox cx={190} cy={160} w={340} h={LINE * lines.length + 28} r={10} seed={seedOf('doc')} fill="var(--surface)" fillStyle="solid" />
          {lines.map(([dx, l], i) => (
            <Mono key={i} x={36 + dx} y={96 + i * LINE} color={i === 0 ? 'var(--muted)' : undefined}>
              {l}
            </Mono>
          ))}
          <SketchBox cx={190} cy={96 + 3.5 * LINE} w={296} h={LINE * 2 + 10} r={6} dashed stroke="var(--accent)" seed={seedOf('emb')} />
          <HandText x={348} y={96 + 3.5 * LINE} size={14} anchor="start" color="var(--accent)">
            {'embedded:\nread together'}
          </HandText>
        </g>
      );
    }
    case 'wide': {
      const cols = [0, 100, 220];
      return (
        <g>
          <Cells x={30} y={34} cols={cols} cells={['user_id', 'created_at', 'text']} color="var(--muted)" />
          <SketchBox cx={225} cy={112} w={420} h={104} r={10} dashed stroke="var(--accent)" seed={seedOf('p7')} />
          <HandText x={36} y={78} size={14} anchor="start" color="var(--accent)">
            partition user_id = 7 (one node)
          </HandText>
          <Cells x={30} y={108} cols={cols} cells={['7', 'Oct 03', 'Ok']} />
          <Cells x={30} y={134} cols={cols} cells={['7', 'Oct 02', 'hi']} />
          <HandText x={300} y={121} size={14} anchor="start" color="var(--muted)">
            {'sorted newest first\n(clustering key)'}
          </HandText>
          <SketchBox cx={225} cy={214} w={420} h={62} r={10} dashed stroke="var(--accent)" seed={seedOf('p8')} />
          <HandText x={36} y={198} size={14} anchor="start" color="var(--accent)">
            partition user_id = 8 (maybe another node)
          </HandText>
          <Cells x={30} y={224} cols={cols} cells={['8', 'Oct 01', 'yo']} />
          <HandText x={225} y={282} size={14} color="var(--muted)">
            Q1 reads partition 7 from the top: one sequential read.
          </HandText>
        </g>
      );
    }
    case 'graph':
      return (
        <g>
          {[
            ['Ana', 90, 100],
            ['Ben', 230, 100],
            ['Cy', 370, 100],
          ].map(([n, x, y]) => (
            <g key={n as string}>
              <SketchEllipse cx={x as number} cy={y as number} w={84} h={52} seed={seedOf(`g${n}`)} fill="var(--surface)" fillStyle="solid" />
              <HandText x={x as number} y={y as number} size={16} weight={700}>
                {n as string}
              </HandText>
            </g>
          ))}
          <SketchArrow points={[[136, 100], [184, 100]]} stroke="var(--accent)" seed={seedOf('f1')} />
          <SketchArrow points={[[276, 100], [324, 100]]} stroke="var(--accent)" seed={seedOf('f2')} />
          <HandText x={160} y={74} size={14} color="var(--accent)">
            FOLLOWS
          </HandText>
          <HandText x={300} y={74} size={14} color="var(--accent)">
            FOLLOWS
          </HandText>
          {[
            ['hi', 50, 230, 90],
            ['Ok', 140, 230, 90],
            ['yo', 230, 230, 230],
          ].map(([t, x, y, from]) => (
            <g key={t as string}>
              <SketchBox cx={x as number} cy={y as number} w={56} h={34} r={8} seed={seedOf(`gp${t}`)} fill="var(--surface)" fillStyle="solid" />
              <HandText x={x as number} y={y as number} size={14}>
                {t as string}
              </HandText>
              <SketchArrow points={[[(from as number) + ((x as number) - (from as number)) * 0.1, 128], [x as number, 212]]} stroke="var(--muted)" seed={seedOf(`gw${t}`)} />
            </g>
          ))}
          <HandText x={34} y={172} size={14} color="var(--muted)">
            WROTE
          </HandText>
          <HandText x={225} y={290} size={14} color="var(--accent)">
            Q2: Ana, then Ben, then Cy. Two hops, no join.
          </HandText>
        </g>
      );
  }
}

export default function FiveShapes() {
  return (
    <AnimFrame title="The same data in five shapes" steps={steps} interval={5000}>
      {(_, s) => (
        <SketchSvg width={700} height={320} label={`Chirp data drawn as ${s.shape}`}>
          <Drawing shape={s.shape} />
          <SketchBox cx={580} cy={160} w={216} h={296} r={12} dashed stroke="var(--muted)" seed={seedOf('side')} />
          {s.shape === 'facts' ? (
            <HandText x={580} y={150} size={14} weight={700} color="var(--accent)">
              {`Three questions\nto ask of it\n\n${s.good}`}
            </HandText>
          ) : (
            <g>
              <HandText x={580} y={48} size={15} weight={700} color="var(--ok)">
                Good at
              </HandText>
              <HandText x={580} y={102} size={14}>
                {s.good}
              </HandText>
              <HandText x={580} y={196} size={15} weight={700} color="var(--bad)">
                Weak at
              </HandText>
              <HandText x={580} y={252} size={14}>
                {s.weak}
              </HandText>
            </g>
          )}
        </SketchSvg>
      )}
    </AnimFrame>
  );
}

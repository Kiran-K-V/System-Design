import AnimFrame from '../AnimFrame';
import { HandText, SketchArrow, SketchBox, SketchSvg, TEXT_SIZES, seedOf } from '../sketch';
import { files, merkleCompares, treeNodes } from './Ai14CursorMath';

/**
 * Merkle sync of one edited file in a small tree: 4 entries per folder, 3 levels, 64 files.
 * ILLUSTRATIVE: the hashes are made-up 4-digit stand-ins for 64-character SHA-256 values.
 * Cursor's page says the sync compares hashes and syncs only entries whose hashes differ. The level-by-level order is our simplification.
 */

type Tone = 'ok' | 'warn' | 'accent' | 'default';

interface N {
  id: string;
  level: 0 | 1 | 2 | 3;
  row: number;
  name: string;
  old: string;
  fresh?: string;
}

const NODES: N[] = [
  { id: 'root', level: 0, row: 1.5, name: 'repo root', old: 'c41d', fresh: '57e0' },
  { id: 'api', level: 1, row: 0, name: 'api/', old: '7a02' },
  { id: 'web', level: 1, row: 1, name: 'web/', old: 'e55b' },
  { id: 'core', level: 1, row: 2, name: 'core/', old: '3b9c', fresh: 'a84e' },
  { id: 'docs', level: 1, row: 3, name: 'docs/', old: '08fa' },
  { id: 'auth', level: 2, row: 0, name: 'auth/', old: '91d4' },
  { id: 'db', level: 2, row: 1, name: 'db/', old: '2e67', fresh: '6f1b' },
  { id: 'ui', level: 2, row: 2, name: 'ui/', old: 'b3a8' },
  { id: 'util', level: 2, row: 3, name: 'util/', old: 'f10c' },
  { id: 'pool', level: 3, row: 0, name: 'pool.py', old: '5c13' },
  { id: 'query', level: 3, row: 1, name: 'query.py', old: '8d4e', fresh: 'd2a9' },
  { id: 'conn', level: 3, row: 2, name: 'conn.py', old: 'a729' },
  { id: 'retry', level: 3, row: 3, name: 'retry.py', old: '0b6f' },
];

const COL_X = [84, 250, 430, 620];
const ROW_Y = (r: number) => 96 + r * 80;
const W = 124;
const H = 54;

const FAN = 4;
const DEPTH = 3;

interface Step {
  caption: string;
  /** Edit has happened on the client. */
  edited: boolean;
  /** Levels 0..k have been compared. -1 means none. */
  compared: number;
  synced: boolean;
  /** Hashes compared so far in this sync. */
  count: number;
  /** Show only the root row (nothing below was read). */
  rootOnly?: boolean;
}

const steps: Step[] = [
  {
    caption:
      'Both sides hold the same tree. Each file has a hash of its content. Each folder has a hash of its children’s hashes, up to one root hash. The client and the server compare roots first. They match (c41d), so the sync ends after 1 comparison. Nothing below the root was read.',
    edited: false,
    compared: 0,
    synced: false,
    count: 1,
    rootOnly: true,
  },
  {
    caption:
      'A developer edits query.py. Its hash changes. So does the hash of db/, which hashes its children. So does core/, and so does the root. Four hashes changed on the client: the file and its three parents. The other 81 of the 85 hashes in the tree are untouched.',
    edited: true,
    compared: -1,
    synced: false,
    count: 0,
  },
  {
    caption:
      'The sync starts at the top. Client root 57e0 and server root c41d differ, so something below changed. That is 1 comparison. If they had matched, the walk would stop here.',
    edited: true,
    compared: 0,
    synced: false,
    count: 1,
  },
  {
    caption:
      'Compare the four folders under the root. api/, web/ and docs/ match, so their whole subtrees (48 files) are skipped without a look. Only core/ differs. That is 4 more comparisons, 5 so far.',
    edited: true,
    compared: 1,
    synced: false,
    count: 5,
  },
  {
    caption:
      'Compare the four entries inside core/. Only db/ differs. auth/, ui/ and util/ are skipped with their files. 4 more comparisons, 9 so far.',
    edited: true,
    compared: 2,
    synced: false,
    count: 9,
  },
  {
    caption:
      'Compare the four files inside db/. Only query.py differs. 4 more comparisons, 13 in total, for a tree of 64 files. The walk found exactly one file to sync.',
    edited: true,
    compared: 3,
    synced: false,
    count: 13,
  },
  {
    caption:
      'Sync that one file. Its changed chunks are re-embedded in the background and unchanged chunks hit the cache. Now both roots read 57e0, so the next sync costs 1 comparison. Cost: 13 comparisons, not 64. At 65,536 files with 16 entries per folder, one change costs 65.',
    edited: true,
    compared: 3,
    synced: true,
    count: 13,
  },
];

function nodeState(n: N, s: Step): { tone: Tone; line: string } {
  const hasFresh = n.fresh !== undefined;
  const client = s.edited && hasFresh ? n.fresh! : n.old;
  if (s.synced) return { tone: n.id === 'query' ? 'accent' : 'ok', line: client };
  if (s.compared >= n.level) {
    const differ = client !== n.old;
    return { tone: differ ? 'warn' : 'ok', line: differ ? `${client} ≠ ${n.old}` : client };
  }
  if (s.edited && s.compared === -1 && hasFresh) return { tone: 'warn', line: client };
  return { tone: 'default', line: client };
}

const stroke = (t: Tone) => (t === 'default' ? 'var(--fg)' : `var(--${t})`);

export default function Ai14CursorMerkle() {
  return (
    <AnimFrame title="One edited file, found by comparing hashes (illustrative)" steps={steps} interval={7000}>
      {(i, s) => {
        const visible = NODES.filter((n) => !s.rootOnly || n.level === 0);
        const byId = Object.fromEntries(NODES.map((n) => [n.id, n]));
        const pos = (n: N): [number, number] => [COL_X[n.level], ROW_Y(n.row)];
        const edge = (a: string, b: string) => {
          const [ax, ay] = pos(byId[a]);
          const [bx, by] = pos(byId[b]);
          return [
            [ax + W / 2 + 6, ay],
            [bx - W / 2 - 6, by],
          ] as [number, number][];
        };
        const fans: [string, string][] = [
          ...['api', 'web', 'core', 'docs'].map((c) => ['root', c] as [string, string]),
          ...['auth', 'db', 'ui', 'util'].map((c) => ['core', c] as [string, string]),
          ...['pool', 'query', 'conn', 'retry'].map((c) => ['db', c] as [string, string]),
        ];
        return (
          <SketchSvg width={720} height={464} label="A Merkle tree of 64 files with one edited file. The sync compares 13 hashes, level by level, and finds query.py.">
            {!s.rootOnly &&
              fans.map(([a, b]) => (
                <SketchArrow key={`${a}-${b}`} points={edge(a, b)} head="none" seed={seedOf(`mke-${a}-${b}`)} stroke="var(--muted)" />
              ))}
            {(s.rootOnly ? [] : ['repo root', 'folders', 'inside core/', 'inside db/']).map((t, k) => (
              <HandText key={t} x={COL_X[k]} y={30} size={TEXT_SIZES.note} color="var(--muted)">
                {t}
              </HandText>
            ))}
            {visible.map((n) => {
              const [cx, cy] = pos(n);
              const st = nodeState(n, s);
              const c = stroke(st.tone);
              return (
                <g key={n.id}>
                  <SketchBox
                    cx={cx}
                    cy={cy}
                    w={W}
                    h={H}
                    r={8}
                    seed={seedOf(`mk-${n.id}-${st.tone}`)}
                    stroke={c}
                    strokeWidth={st.tone === 'accent' ? 2.2 : 1.4}
                    fill={st.tone === 'default' ? undefined : c}
                  />
                  <HandText x={cx} y={cy - 9} size={TEXT_SIZES.label} color="var(--fg)">
                    {n.name}
                  </HandText>
                  <HandText x={cx} y={cy + 12} size={TEXT_SIZES.note} mono color={st.tone === 'warn' ? 'var(--warn)' : 'var(--muted)'}>
                    {st.line}
                  </HandText>
                </g>
              );
            })}
            <HandText x={24} y={392} anchor="start" size={TEXT_SIZES.label} color="var(--accent)">
              {`hashes compared in this sync: ${s.count}`}
            </HandText>
            <HandText x={24} y={420} anchor="start" size={TEXT_SIZES.note} color="var(--muted)">
              {`tree: ${files(FAN, DEPTH)} files, ${treeNodes(FAN, DEPTH)} hashes in all. Walk cost for one change: ${merkleCompares(FAN, DEPTH)} comparisons.`}
            </HandText>
            <HandText x={24} y={442} anchor="start" size={TEXT_SIZES.note} color="var(--muted)">
              Green: hashes match, subtree skipped. Amber: hashes differ, go down.
            </HandText>
            {i === 0 && (
              <HandText x={360} y={270} size={TEXT_SIZES.label} color="var(--muted)">
                the 84 hashes below the root are never read
              </HandText>
            )}
          </SketchSvg>
        );
      }}
    </AnimFrame>
  );
}

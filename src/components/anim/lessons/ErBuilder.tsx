import AnimFrame from '../AnimFrame';
import { Fade } from '../data-kit';
import { HandText, SketchArrow, SketchBox, SketchSvg, seedOf } from '../sketch';

interface Attr {
  name: string;
  tag?: string;
  tone?: 'accent' | 'warn';
}

interface Entity {
  id: string;
  title: string;
  x: number;
  y: number;
  w: number;
  attrs: Attr[];
  tone?: 'accent';
}

const ROW = 22;
const heightOf = (e: Entity) => 34 + e.attrs.length * ROW + 8;

function EntityBox({ e, step, born }: { e: Entity; step: number; born: number }) {
  const h = heightOf(e);
  return (
    <Fade step={step} born={born}>
      <SketchBox cx={e.x + e.w / 2} cy={e.y + h / 2} w={e.w} h={h} r={8} seed={seedOf(e.id)} stroke={e.tone ? 'var(--accent)' : 'var(--fg)'} fill="var(--surface)" fillStyle="solid" />
      <HandText x={e.x + e.w / 2} y={e.y + 17} size={17} weight={700}>
        {e.title}
      </HandText>
      <line x1={e.x + 8} x2={e.x + e.w - 8} y1={e.y + 32} y2={e.y + 32} stroke="var(--border)" />
      {e.attrs.map((a, i) => (
        <g key={a.name}>
          <HandText x={e.x + 14} y={e.y + 32 + 14 + i * ROW} size={14} anchor="start" color={a.tone ? `var(--${a.tone === 'accent' ? 'accent' : 'warn'})` : 'var(--fg)'}>
            {a.name}
          </HandText>
          {a.tag && (
            <HandText x={e.x + e.w - 12} y={e.y + 32 + 14 + i * ROW} size={12} anchor="end" color="var(--muted)">
              {a.tag}
            </HandText>
          )}
        </g>
      ))}
    </Fade>
  );
}

const FEATURES = [
  'Users post short messages',
  'Users follow other users',
  'Users like posts',
  'Home timeline: newest posts\nfrom people I follow',
  'Every post shows its\nlike count',
];

const steps = [
  { caption: 'A product spec is a list of features. Start with the nouns. Each noun that has its own facts becomes an entity (a table, a kind of record).' },
  { caption: 'Feature 1 gives two entities: User and Post. A user writes many posts. A post has one author. So we store the author’s id inside the post. That column is a foreign key (a pointer to a row in another table). The relationship is one-to-many.' },
  { caption: 'Feature 2: a user follows many users, and a user is followed by many users. That is many-to-many. A column cannot hold it. So we add a third table, Follow, with one row per pair. This is a junction table.' },
  { caption: 'Feature 3: a user likes many posts, and a post is liked by many users. Many-to-many again. Same fix: a Like table with one row per (user, post).' },
  { caption: 'Feature 4 is an access pattern: the query the app runs most. To build a timeline we join Follow to Post. Without an index on (user_id, created_at) this scans every post. We add the index because of the query, not because of the shape.' },
  { caption: 'Feature 5: every post shows its like count. Counting Like rows on every view is expensive, and views outnumber likes 100 to 1 or more. So we copy a derived number into Post: like_count. That is denormalization. We pay on each like, and we save on each view.' },
];

export default function ErBuilder() {
  return (
    <AnimFrame title="From a feature list to a schema" steps={steps} interval={3200}>
      {(i) => {
        const user: Entity = {
          id: 'User',
          title: 'User',
          x: 300,
          y: 30,
          w: 200,
          attrs: [{ name: 'id', tag: 'PK' }, { name: 'name' }, { name: 'handle' }],
        };
        const postAttrs: Attr[] = [
          { name: 'id', tag: 'PK' },
          { name: 'user_id', tag: 'FK → User' },
          { name: 'body' },
          { name: 'created_at' },
        ];
        if (i >= 4) postAttrs.push({ name: 'INDEX (user_id, created_at)', tone: 'accent' });
        if (i >= 5) postAttrs.push({ name: 'like_count (copy)', tone: 'warn' });
        const post: Entity = { id: 'Post', title: 'Post', x: 640, y: 30, w: 220, attrs: postAttrs };
        const follow: Entity = {
          id: 'Follow',
          title: 'Follow',
          x: 300,
          y: 270,
          w: 200,
          attrs: [{ name: 'follower_id', tag: 'FK → User' }, { name: 'followee_id', tag: 'FK → User' }],
        };
        const like: Entity = {
          id: 'Like',
          title: 'Like',
          x: 640,
          y: 270,
          w: 220,
          attrs: [{ name: 'user_id', tag: 'FK → User' }, { name: 'post_id', tag: 'FK → Post' }],
        };
        const hot = i === 4;
        const edge = (hot ? 'var(--accent)' : 'var(--fg)');
        return (
          <SketchSvg width={900} height={420} label="Entity relationship sketch that grows as features are added">
            {/* feature list */}
            <HandText x={14} y={22} size={16} weight={700} anchor="start">
              Feature list
            </HandText>
            {FEATURES.map((f, k) => {
              const y = 62 + k * 62;
              const done = i >= k + 1;
              const current = i === k + 1;
              return (
                <g key={f}>
                  <SketchBox cx={22} cy={y - 4} w={20} h={20} r={4} seed={seedOf('chk' + k)} stroke={done ? 'var(--ok)' : 'var(--muted)'} />
                  {done && (
                    <HandText x={22} y={y - 3} size={16} weight={700} color="var(--ok)">
                      ✓
                    </HandText>
                  )}
                  <HandText x={42} y={y + (f.includes('\n') ? 2 : -4)} size={14.5} anchor="start" color={current ? 'var(--accent)' : done ? 'var(--fg)' : 'var(--muted)'} weight={current ? 700 : 400}>
                    {f}
                  </HandText>
                </g>
              );
            })}

            {/* relationships */}
            {i >= 1 && (
              <Fade step={i} born={1}>
                <SketchArrow points={[[504, 70], [636, 70]]} head="none" seed={seedOf('rel-up')} />
                <HandText x={520} y={54} size={14} weight={700}>1</HandText>
                <HandText x={622} y={54} size={14} weight={700}>N</HandText>
                <HandText x={570} y={90} size={13} color="var(--muted)">writes</HandText>
              </Fade>
            )}
            {i >= 2 && (
              <Fade step={i} born={2}>
                <SketchArrow points={[[360, 138], [360, 266]]} head="none" stroke={hot ? edge : undefined} seed={seedOf('rel-fu1')} />
                <HandText x={346} y={150} size={14} weight={700}>1</HandText>
                <HandText x={346} y={254} size={14} weight={700}>N</HandText>
                <HandText x={316} y={204} size={13} color="var(--muted)" anchor="end">follower</HandText>
                <SketchArrow points={[[440, 138], [440, 266]]} head="none" stroke={hot ? edge : undefined} seed={seedOf('rel-fu2')} />
                <HandText x={426} y={150} size={14} weight={700}>1</HandText>
                <HandText x={426} y={254} size={14} weight={700}>N</HandText>
                <HandText x={456} y={204} size={13} color="var(--muted)" anchor="start">followee</HandText>
              </Fade>
            )}
            {i >= 3 && (
              <Fade step={i} born={3}>
                <SketchArrow points={[[750, 266], [750, 200]]} head="none" seed={seedOf('rel-lp')} />
                <HandText x={736} y={254} size={14} weight={700}>N</HandText>
                <HandText x={736} y={212} size={14} weight={700}>1</HandText>
                <SketchArrow points={[[636, 312], [480, 150]]} head="none" seed={seedOf('rel-lu')} />
                <HandText x={500} y={170} size={14} weight={700}>1</HandText>
                <HandText x={616} y={296} size={14} weight={700}>N</HandText>
              </Fade>
            )}
            {hot && (
              <>
                <SketchArrow points={[[500, 330], [560, 330], [640, 190]]} stroke="var(--accent)" seed={seedOf('hot-path')} />
                <HandText x={456} y={392} size={12.5} mono color="var(--accent)">
                  {'SELECT p.* FROM Follow f JOIN Post p ON p.user_id = f.followee_id\nWHERE f.follower_id = ? ORDER BY p.created_at DESC LIMIT 20'}
                </HandText>
              </>
            )}

            {i >= 1 && <EntityBox e={user} step={i} born={1} />}
            {i >= 1 && <EntityBox e={post} step={i} born={1} />}
            {i >= 2 && <EntityBox e={follow} step={i} born={2} />}
            {i >= 3 && <EntityBox e={like} step={i} born={3} />}
            {i === 0 && (
              <HandText x={580} y={200} size={20} color="var(--muted)">
                {'nothing designed yet\nread the nouns and the verbs'}
              </HandText>
            )}
          </SketchSvg>
        );
      }}
    </AnimFrame>
  );
}

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
}

const ROW = 24;
const heightOf = (e: Entity) => 36 + e.attrs.length * ROW + 8;

function EntityBox({ e, step, born }: { e: Entity; step: number; born: number }) {
  const h = heightOf(e);
  return (
    <Fade step={step} born={born}>
      <SketchBox cx={e.x + e.w / 2} cy={e.y + h / 2} w={e.w} h={h} r={8} seed={seedOf(e.id)} fill="var(--surface)" fillStyle="solid" />
      <HandText x={e.x + e.w / 2} y={e.y + 18} size={18} weight={700}>
        {e.title}
      </HandText>
      <line x1={e.x + 8} x2={e.x + e.w - 8} y1={e.y + 34} y2={e.y + 34} stroke="var(--border)" />
      {e.attrs.map((a, i) => (
        <g key={a.name}>
          <HandText x={e.x + 12} y={e.y + 34 + 15 + i * ROW} size={15} anchor="start" color={a.tone === 'accent' ? 'var(--accent)' : a.tone === 'warn' ? 'var(--warn)' : 'var(--fg)'}>
            {a.name}
          </HandText>
          {a.tag && (
            <HandText x={e.x + e.w - 10} y={e.y + 34 + 15 + i * ROW} size={14} anchor="end" color="var(--muted)">
              {a.tag}
            </HandText>
          )}
        </g>
      ))}
    </Fade>
  );
}

const FEATURES = [
  'Users post',
  'Users follow users',
  'Users like posts',
  'Home timeline',
  'Like counts',
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
          x: 4,
          y: 10,
          w: 200,
          attrs: [{ name: 'id', tag: 'PK' }, { name: 'name' }, { name: 'handle' }],
        };
        const postAttrs: Attr[] = [
          { name: 'id', tag: 'PK' },
          { name: 'user_id', tag: 'FK → User' },
          { name: 'body' },
          { name: 'created_at' },
        ];
        if (i >= 4) postAttrs.push({ name: 'idx: user_id, created_at', tone: 'accent' });
        if (i >= 5) postAttrs.push({ name: 'like_count (copy)', tone: 'warn' });
        const post: Entity = { id: 'Post', title: 'Post', x: 300, y: 10, w: 220, attrs: postAttrs };
        const follow: Entity = {
          id: 'Follow',
          title: 'Follow',
          x: 4,
          y: 310,
          w: 200,
          attrs: [{ name: 'follower_id', tag: 'FK' }, { name: 'followee_id', tag: 'FK' }],
        };
        const like: Entity = {
          id: 'Like',
          title: 'Like',
          x: 300,
          y: 310,
          w: 220,
          attrs: [{ name: 'user_id', tag: 'FK → User' }, { name: 'post_id', tag: 'FK → Post' }],
        };
        const hot = i === 4;
        const accentIf = hot ? 'var(--accent)' : undefined;
        return (
          <div>
            <ul className="flex flex-wrap gap-x-4 gap-y-1.5 px-2 text-[0.9rem] leading-snug">
              <li className="font-semibold">Features:</li>
              {FEATURES.map((f, k) => {
                const done = i >= k + 1;
                const current = i === k + 1;
                return (
                  <li key={f} className={`flex items-start gap-1.5 ${current ? 'font-semibold text-accent' : done ? '' : 'text-muted'}`}>
                    <span aria-hidden className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border text-[11px] ${done ? 'border-ok text-ok' : 'border-line'}`}>
                      {done ? '✓' : ''}
                    </span>
                    {f}
                  </li>
                );
              })}
            </ul>
            <div className="mx-auto mt-2 max-w-[560px]">
              <SketchSvg width={524} height={420} label="Entity relationship sketch that grows as features are added">
                {i >= 1 && (
                  <Fade step={i} born={1}>
                    <SketchArrow points={[[208, 60], [296, 60]]} head="none" seed={seedOf('rel-up')} />
                    <HandText x={218} y={44} size={15} weight={700}>1</HandText>
                    <HandText x={286} y={44} size={15} weight={700}>N</HandText>
                    <HandText x={252} y={82} size={14} color="var(--muted)">writes</HandText>
                  </Fade>
                )}
                {i >= 2 && (
                  <Fade step={i} born={2}>
                    <SketchArrow points={[[50, 122], [50, 306]]} head="none" stroke={accentIf} seed={seedOf('rel-fu1')} />
                    <SketchArrow points={[[150, 122], [150, 306]]} head="none" stroke={accentIf} seed={seedOf('rel-fu2')} />
                    <HandText x={38} y={136} size={15} weight={700}>1</HandText>
                    <HandText x={38} y={292} size={15} weight={700}>N</HandText>
                    <HandText x={138} y={136} size={15} weight={700}>1</HandText>
                    <HandText x={138} y={292} size={15} weight={700}>N</HandText>
                    <HandText x={50} y={214} size={14} color="var(--muted)" halo>follower</HandText>
                    <HandText x={150} y={214} size={14} color="var(--muted)" halo>followee</HandText>
                  </Fade>
                )}
                {i >= 3 && (
                  <Fade step={i} born={3}>
                    <SketchArrow points={[[410, 306], [410, 205]]} head="none" seed={seedOf('rel-lp')} />
                    <HandText x={396} y={292} size={15} weight={700}>N</HandText>
                    <HandText x={396} y={222} size={15} weight={700}>1</HandText>
                    <SketchArrow points={[[296, 345], [210, 135]]} head="none" seed={seedOf('rel-lu')} />
                    <HandText x={226} y={150} size={15} weight={700}>1</HandText>
                    <HandText x={282} y={326} size={15} weight={700}>N</HandText>
                  </Fade>
                )}
                {hot && <SketchArrow points={[[208, 360], [262, 300], [304, 196]]} stroke="var(--accent)" seed={seedOf('hot-path')} />}

                {i >= 1 && <EntityBox e={user} step={i} born={1} />}
                {i >= 1 && <EntityBox e={post} step={i} born={1} />}
                {i >= 2 && <EntityBox e={follow} step={i} born={2} />}
                {i >= 3 && <EntityBox e={like} step={i} born={3} />}
                {i === 0 && (
                  <HandText x={262} y={200} size={19} color="var(--muted)">
                    {'nothing designed yet\nread the nouns and verbs'}
                  </HandText>
                )}
              </SketchSvg>
              {hot && (
                <pre className="mx-2 mt-1 overflow-x-auto rounded-md border border-line bg-surface px-3 py-2 font-mono text-[12.5px] leading-snug text-accent">
                  {'SELECT p.* FROM Follow f JOIN Post p ON p.user_id = f.followee_id\nWHERE f.follower_id = ? ORDER BY p.created_at DESC LIMIT 20;'}
                </pre>
              )}
            </div>
          </div>
        );
      }}
    </AnimFrame>
  );
}

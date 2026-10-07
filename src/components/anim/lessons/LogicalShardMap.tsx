import { HandText, SketchArrow, SketchBox, SketchSvg, seedOf } from '../sketch';
import { NODE_COLORS } from '../HashRing';

/** Static infographic: many logical shards, few physical databases. Adding a database moves whole logical shards. */
const BEFORE = [0, 0, 0, 0, 1, 1, 1, 1, 2, 2, 2, 2];
// Shards 4, 8, and 12 (index 3, 7, 11) move to the new database.
const AFTER = BEFORE.map((db, i) => (i % 4 === 3 ? 3 : db));
const DB_X = [130, 340, 550, 760];

function Row({ title, y, owner, dbs, newDb }: { title: string; y: number; owner: number[]; dbs: number; newDb?: number }) {
  return (
    <g>
      <HandText x={30} y={y - 58} size={16} anchor="start">
        {title}
      </HandText>
      {Array.from({ length: dbs }, (_, db) => {
        const mine = owner.map((o, i) => [o, i] as const).filter(([o]) => o === db);
        return (
          <g key={db}>
            <SketchBox cx={DB_X[db]} cy={y + 4} w={190} h={92} dashed stroke="var(--muted)" seed={seedOf(`db${title}${db}`)} r={14} />
            <HandText x={DB_X[db]} y={y - 34} size={13} color="var(--muted)">
              {`database ${db + 1}`}
            </HandText>
            {mine.map(([, i], k) => {
              const x = DB_X[db] - ((mine.length - 1) * 42) / 2 + k * 42;
              const moved = newDb === db;
              return (
                <g key={i}>
                  <SketchBox cx={x} cy={y + 14} w={36} h={36} r={6} seed={seedOf(`l${title}${i}`)} fill={NODE_COLORS[owner[i]]} fillStyle="solid" stroke={moved ? 'var(--fg)' : undefined} strokeWidth={moved ? 2.4 : 1.2} />
                  <HandText x={x} y={y + 14} size={14} weight={700} halo>
                    {String(i + 1)}
                  </HandText>
                </g>
              );
            })}
          </g>
        );
      })}
    </g>
  );
}

export default function LogicalShardMap() {
  return (
    <SketchSvg width={900} height={380} label="Twelve logical shards on three databases, then on four databases after three logical shards move to the new one">
      <Row title="Before: 3 databases, 12 logical shards, 4 each" y={80} owner={BEFORE} dbs={3} />
      <SketchArrow points={[[450, 150], [450, 205]]} seed={seedOf('mv')} />
      <HandText x={470} y={178} size={14} anchor="start" color="var(--muted)">
        copy shards 4, 8, 12 to the new database, catch up, then switch the map
      </HandText>
      <Row title="After: add database 4. Only 3 of 12 logical shards moved." y={280} owner={AFTER} dbs={4} newDb={3} />
    </SketchSvg>
  );
}

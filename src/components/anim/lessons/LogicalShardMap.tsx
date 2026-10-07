import { HandText, SketchArrow, SketchBox, SketchSvg, seedOf } from '../sketch';
import { NODE_COLORS } from '../HashRing';

/** Static infographic: many logical shards, few physical databases. Adding a database moves whole logical shards. */
const BEFORE = [0, 0, 0, 0, 1, 1, 1, 1, 2, 2, 2, 2];
// Shards 4, 8, and 12 (index 3, 7, 11) move to the new database.
const AFTER = BEFORE.map((db, i) => (i % 4 === 3 ? 3 : db));
const DB_X = [95, 265, 435, 605];

function Row({ title, y, owner, dbs, newDb }: { title: string; y: number; owner: number[]; dbs: number; newDb?: number }) {
  return (
    <g>
      <HandText x={14} y={y - 62} size={17} anchor="start">
        {title}
      </HandText>
      {Array.from({ length: dbs }, (_, db) => {
        const mine = owner.map((o, i) => [o, i] as const).filter(([o]) => o === db);
        return (
          <g key={db}>
            <SketchBox cx={DB_X[db]} cy={y + 8} w={156} h={92} dashed stroke="var(--muted)" seed={seedOf(`db${title}${db}`)} r={14} />
            <HandText x={DB_X[db]} y={y - 28} size={14} color="var(--muted)">
              {`database ${db + 1}`}
            </HandText>
            {mine.map(([, i], k) => {
              const x = DB_X[db] - ((mine.length - 1) * 38) / 2 + k * 38;
              const moved = newDb === db;
              return (
                <g key={i}>
                  <SketchBox cx={x} cy={y + 18} w={34} h={34} r={6} seed={seedOf(`l${title}${i}`)} fill={NODE_COLORS[owner[i]]} fillStyle="solid" stroke={moved ? 'var(--fg)' : undefined} strokeWidth={moved ? 2.4 : 1.2} />
                  <HandText x={x} y={y + 18} size={15} weight={700} halo>
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
    <SketchSvg width={720} height={370} label="Twelve logical shards on three databases, then on four databases after three logical shards move to the new one">
      <Row title="Before: 3 databases, 12 logical shards, 4 each" y={82} owner={BEFORE} dbs={3} />
      <SketchArrow points={[[100, 150], [100, 208]]} seed={seedOf('mv')} />
      <HandText x={120} y={170} size={15} anchor="start" color="var(--muted)">
        copy shards 4, 8, 12 to the new database, catch up, switch the map
      </HandText>
      <Row title="After: add database 4. Only 3 of 12 logical shards moved." y={292} owner={AFTER} dbs={4} newDb={3} />
    </SketchSvg>
  );
}

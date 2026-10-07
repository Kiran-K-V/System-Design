import AnimFrame from '../AnimFrame';
import { Badge, HandText, SketchSvg, seedOf } from '../sketch';
import { NODE_COLORS } from '../HashRing';

const H = Array.from({ length: 20 }, (_, i) => i);
const LETTERS = ['A', 'B', 'C', 'D', 'E'];
const CELL = 40;
const X0 = 60;

interface Step {
  caption: string;
  stage: 'before' | 'after' | 'moved' | 'scale';
}

const steps: Step[] = [
  { caption: 'Four servers hold cached keys. A key goes to server number (hash % 4). We use 20 keys with hashes 0 to 19 so you can check every cell.', stage: 'before' },
  { caption: 'Traffic grows. Add a fifth server. The rule is now hash % 5. Each key is placed again with the new rule.', stage: 'after' },
  { caption: 'Compare the two rows. Only hashes 0, 1, 2, and 3 keep their server. The other 16 of 20 keys now map to a different server: 80% moved. Each moved key is a cache miss or a data copy.', stage: 'moved' },
  { caption: 'It gets worse as the cluster grows. Going from N to N+1 servers moves N/(N+1) of all keys with hash % N. A ring moves only 1/(N+1), the share the new server should own anyway.', stage: 'scale' },
];

const SCALE = [
  { n: 4, mod: 80, ring: 20 },
  { n: 9, mod: 90, ring: 10 },
  { n: 99, mod: 99, ring: 1 },
];

function Row({ y, mod, label, moved }: { y: number; mod: number; label: string; moved?: boolean }) {
  return (
    <g>
      <HandText x={X0 - 12} y={y} size={14} anchor="end" color="var(--muted)">
        {label}
      </HandText>
      {H.map((h) => {
        const owner = h % mod;
        const changed = moved && h % 4 !== h % 5;
        return (
          <g key={h}>
            <rect x={X0 + h * CELL + 2} y={y - 17} width={CELL - 4} height={34} rx={6} fill={NODE_COLORS[owner]} opacity={0.5} stroke={changed ? 'var(--bad)' : 'none'} strokeWidth={changed ? 2.4 : 0} />
            <HandText x={X0 + h * CELL + CELL / 2} y={y} size={15} weight={700}>
              {LETTERS[owner]}
            </HandText>
          </g>
        );
      })}
    </g>
  );
}

export default function ModNFail() {
  return (
    <AnimFrame title="Why hash % N breaks when N changes" steps={steps}>
      {(_, s) =>
        s.stage === 'scale' ? (
          <SketchSvg width={900} height={300} label="Share of keys moved: mod N versus a ring, for three cluster sizes">
            <HandText x={450} y={22} size={16}>
              Share of keys that move when one server is added
            </HandText>
            {SCALE.map((r, i) => {
              const y = 70 + i * 78;
              const bar = (v: number) => (v / 100) * 480;
              return (
                <g key={r.n}>
                  <HandText x={190} y={y + 26} size={18} anchor="end">
                    {`${r.n} → ${r.n + 1} servers`}
                  </HandText>
                  <rect x={210} y={y} width={bar(r.mod)} height={24} rx={4} fill="var(--bad)" opacity={0.75} />
                  <HandText x={218 + bar(r.mod)} y={y + 12} size={16} anchor="start">{`hash % N: ${r.mod}%`}</HandText>
                  <rect x={210} y={y + 28} width={Math.max(3, bar(r.ring))} height={24} rx={4} fill="var(--ok)" opacity={0.8} />
                  <HandText x={218 + Math.max(3, bar(r.ring))} y={y + 40} size={16} anchor="start">{`ring: ${r.ring}%`}</HandText>
                </g>
              );
            })}
          </SketchSvg>
        ) : (
          <SketchSvg width={900} height={250} label="Twenty keys and the server each one maps to, before and after adding a server">
            <Badge cx={26} cy={50} n={1} seed={seedOf('mn1')} />
            <Row y={50} mod={4} label="" />
            <HandText x={X0} y={92} size={16} anchor="start" color="var(--muted)">
              hash % 4: hash 0 → A, 1 → B, 2 → C, 3 → D, 4 → A, 5 → B ...
            </HandText>
            {s.stage !== 'before' && (
              <>
                <Badge cx={26} cy={150} n={2} seed={seedOf('mn2')} />
                <Row y={150} mod={5} label="" moved={s.stage === 'moved'} />
                <HandText x={X0} y={192} size={16} anchor="start" color="var(--muted)">
                  hash % 5: hash 0 → A, 1 → B, 2 → C, 3 → D, 4 → E, 5 → A ...
                </HandText>
              </>
            )}
            {s.stage === 'moved' && (
              <HandText x={X0 + 10 * CELL} y={228} size={18} color="var(--bad)" weight={700}>
                16 of 20 keys changed server (80%)
              </HandText>
            )}
            {[0, 5, 10, 15].map((h) => (
              <HandText key={h} x={X0 + h * CELL + CELL / 2} y={12} size={12} color="var(--muted)">
                {`h=${h}`}
              </HandText>
            ))}
          </SketchSvg>
        )
      }
    </AnimFrame>
  );
}

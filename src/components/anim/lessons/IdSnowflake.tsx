import AnimFrame from '../AnimFrame';
import { HandText, SketchBox, SketchSvg, TEXT_SIZES, seedOf } from '../sketch';
import { SNOWFLAKE_EPOCH, bin, decodeSnowflake, snowflakeId } from './idsMath';

/** One Snowflake ID, built field by field. The numbers come from idsMath.ts, and the test checks them. */
const ELAPSED = 1_000_000_000;
const MACHINE = 5;
const SEQ = 3;
const ID = snowflakeId(ELAPSED, MACHINE, SEQ);
const BACK = decodeSnowflake(ID);
const date = new Date(SNOWFLAKE_EPOCH + ELAPSED).toISOString().replace('T', ' ').replace('Z', ' UTC');
const idText = ID.toLocaleString('en-US');

const steps = [
  { caption: 'A Snowflake ID is one 64-bit integer cut into four fields: 1 sign bit, a 41-bit timestamp, a 10-bit machine ID, and a 12-bit sequence. Twitter\'s 2010 code splits the 10 machine bits into 5 for the building and 5 for the server in it. We will build one ID.', upTo: 0 },
  { caption: 'Sign bit: always 0. It keeps the number positive, because many databases use the first bit to mean a minus sign.', upTo: 1 },
  { caption: `Timestamp: milliseconds since a start date that you pick (the epoch). Twitter's source uses 1288834974657, which is 2010-11-04 01:42:54.657 UTC. Our ID is made ${ELAPSED.toLocaleString('en-US')} ms later, at ${date}. In 41 bits that is the binary shown. 41 bits last 2^41 ms, about 69.7 years.`, upTo: 2 },
  { caption: `Machine ID: this server is number ${MACHINE}. It is set by configuration, so two servers never share a number. Ten bits allow 1,024 servers.`, upTo: 3 },
  { caption: `Sequence: this is the 4th ID this machine made in this millisecond, so the counter reads ${SEQ}. The first ID in a millisecond uses 0. The counter resets to 0 in the next millisecond.`, upTo: 4 },
  { caption: `Put together: ${ELAPSED.toLocaleString('en-US')} × 2^22 + ${MACHINE} × 2^12 + ${SEQ} = ${idText}. Each field can be read back out of the number: ${BACK.elapsed.toLocaleString('en-US')} ms, machine ${BACK.machine}, sequence ${BACK.seq}. The timestamp sits in the high bits, so IDs sort by time.`, upTo: 5 },
  { caption: 'Limits. 12 bits allow 4,096 IDs per millisecond per machine, or 4,096,000 per second. The 4,097th ID in one millisecond must wait for the next one. If the clock moves backwards, the original code refuses to issue IDs until the clock passes the last timestamp. Without that guard, IDs could repeat.', upTo: 5, limits: true },
];

const SEGS = [
  { key: 'sign', x: 40, bits: 1, text: '0', label: 'sign' },
  { key: 'time', x: 50, bits: 41, text: bin(ELAPSED, 41), label: 'timestamp: 41 bits' },
  { key: 'machine', x: 460, bits: 10, text: bin(MACHINE, 10), label: 'machine: 10' },
  { key: 'seq', x: 560, bits: 12, text: bin(SEQ, 12), label: 'sequence: 12' },
];

export default function IdSnowflake() {
  return (
    <AnimFrame title="Building one Snowflake ID" steps={steps} interval={3200}>
      {(i, s) => (
        <SketchSvg width={720} height={300} label="A 64-bit integer split into sign, timestamp, machine, and sequence fields">
          {SEGS.map((g, k) => {
            const filled = s.upTo > k;
            const active = s.upTo === k + 1 && i >= 1 && i <= 4;
            const w = g.bits * 10;
            return (
              <g key={g.key}>
                <HandText x={g.x + w / 2} y={64} size={TEXT_SIZES.label} color={active ? 'var(--accent)' : 'var(--muted)'}>
                  {g.label}
                </HandText>
                <SketchBox
                  cx={g.x + w / 2}
                  cy={110}
                  w={w - 2}
                  h={44}
                  r={g.bits < 5 ? 3 : 6}
                  seed={seedOf(`seg${g.key}`)}
                  stroke={active ? 'var(--accent)' : filled ? 'var(--ok)' : 'var(--border)'}
                  fill={active ? 'var(--accent)' : filled ? 'var(--ok)' : undefined}
                  fillStyle="solid"
                  dashed={!filled && !active}
                />
                {filled && (
                  <HandText x={g.x + w / 2} y={110} size={TEXT_SIZES.note} mono>
                    {g.text}
                  </HandText>
                )}
              </g>
            );
          })}
          <HandText x={40} y={150} size={TEXT_SIZES.note} anchor="start" color="var(--muted)" mono>
            bit 63
          </HandText>
          <HandText x={680} y={150} size={TEXT_SIZES.note} anchor="end" color="var(--muted)" mono>
            bit 0
          </HandText>
          {s.upTo >= 2 && (
            <HandText x={255} y={176} size={TEXT_SIZES.label} color="var(--muted)">
              {`${ELAPSED.toLocaleString('en-US')} ms after the epoch`}
            </HandText>
          )}
          {s.upTo >= 3 && (
            <HandText x={510} y={176} size={TEXT_SIZES.label} color="var(--muted)">
              {`machine ${MACHINE}`}
            </HandText>
          )}
          {s.upTo >= 4 && (
            <HandText x={620} y={176} size={TEXT_SIZES.label} color="var(--muted)">
              {`seq ${SEQ}`}
            </HandText>
          )}
          {s.upTo >= 5 && !s.limits && (
            <>
              <HandText x={360} y={226} size={TEXT_SIZES.label} mono>
                {`${ELAPSED.toLocaleString('en-US')} × 2^22 + ${MACHINE} × 2^12 + ${SEQ}`}
              </HandText>
              <HandText x={360} y={262} size={TEXT_SIZES.title} color="var(--ok)" mono>
                {idText}
              </HandText>
            </>
          )}
          {s.limits && (
            <>
              <HandText x={360} y={222} size={TEXT_SIZES.label}>
                {'4,096 IDs per ms per machine: the 4,097th waits for the next ms'}
              </HandText>
              <HandText x={360} y={256} size={TEXT_SIZES.label} color="var(--bad)">
                {'clock moves back: refuse to issue IDs until it passes the last timestamp'}
              </HandText>
            </>
          )}
        </SketchSvg>
      )}
    </AnimFrame>
  );
}

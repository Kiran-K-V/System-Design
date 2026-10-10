import AnimFrame from '../AnimFrame';
import { HandText, SketchSvg, TEXT_SIZES } from '../sketch';
import { Arr, Cell, Panel, type TT } from './TechParts';

interface Step {
  caption: string;
  msg: string;
  /** Offset the group has committed. */
  committed: number;
  /** Where the running consumer will read next. Null while no consumer runs. */
  position: number | null;
  consumer: string;
  consumerTone: TT;
  /** Cells to mark as in flight (read, not yet committed) or as processed twice. */
  inflight?: number[];
  twice?: number[];
}

const steps: Step[] = [
  {
    caption:
      'One partition holds offsets 0 to 5. A consumer group keeps one number for this partition: the committed offset, here 3. It means "start reading at 3". Kafka stores the number as a message in an internal topic (__consumer_offsets), not in the partition and not on the consumer.',
    msg: 'The group has committed offset 3.',
    committed: 3,
    position: 3,
    consumer: 'Consumer: asks for its start offset',
    consumerTone: 'fg',
  },
  {
    caption: 'The consumer polls. It gets offsets 3 and 4. Its position in memory moves to 5. The committed offset in Kafka is still 3, because nothing told Kafka that 3 and 4 are done.',
    msg: 'poll() returns offsets 3 and 4.',
    committed: 3,
    position: 5,
    consumer: 'Consumer: holds 3 and 4',
    consumerTone: 'accent',
    inflight: [3, 4],
  },
  {
    caption: 'The consumer processes both messages and writes the results to its database. The work is done. The commit has not happened yet.',
    msg: 'Processing is done. Commit not sent yet.',
    committed: 3,
    position: 5,
    consumer: 'Consumer: DB write finished',
    consumerTone: 'accent',
    inflight: [3, 4],
  },
  {
    caption: 'The consumer crashes before it commits. Its in-memory position is gone. Kafka still says 3. The database already holds the results for 3 and 4.',
    msg: 'Consumer crashes before the commit.',
    committed: 3,
    position: null,
    consumer: 'Consumer: crashed',
    consumerTone: 'bad',
    inflight: [3, 4],
  },
  {
    caption: 'A new consumer takes over the partition and asks for the committed offset. It gets 3 and reads 3 and 4 again. Both messages are processed twice. This is at-least-once delivery. The fix is an idempotent write, not a different commit rule.',
    msg: 'The new consumer re-reads 3 and 4.',
    committed: 3,
    position: 5,
    consumer: 'Consumer: processes 3, 4 again',
    consumerTone: 'warn',
    twice: [3, 4],
  },
  {
    caption: 'This time the consumer commits offset 5 after processing. The commit is one more message in the internal topic. If it had committed before processing and then crashed, 3 and 4 would be lost. That is at-most-once.',
    msg: 'Commit offset 5.',
    committed: 5,
    position: 5,
    consumer: 'Consumer: committed 5',
    consumerTone: 'ok',
  },
];

const X = (i: number) => 110 + i * 100;
const CY = 140;

export default function KafkaOffsets() {
  return (
    <AnimFrame title="Kafka: consumer offsets and a crash before commit" steps={steps} interval={4600}>
      {(i, s) => (
        <SketchSvg width={720} height={330} label="One Kafka partition with six offsets, the committed offset and the consumer position">
          <HandText x={360} y={18} size={TEXT_SIZES.label} color="var(--accent)">
            {s.msg}
          </HandText>
          {[0, 1, 2, 3, 4, 5].map((o) => {
            let tone: TT = 'fg';
            if (o < s.committed) tone = 'ok';
            else if (s.twice?.includes(o)) tone = 'warn';
            else if (s.inflight?.includes(o)) tone = 'accent';
            return <Cell key={o} cx={X(o)} cy={CY} w={80} h={44} label={`offset ${o}`} tone={tone} dashed={tone === 'fg'} sk={`ko-${o}`} />;
          })}
          {s.position !== null && (
            <g>
              <HandText x={X(s.position)} y={62} size={TEXT_SIZES.note} color="var(--accent)">
                consumer position
              </HandText>
              <Arr from={[X(s.position), 76]} to={[X(s.position), 110]} tone="accent" sk={`pos-${i}`} />
            </g>
          )}
          <Arr from={[X(s.committed), 206]} to={[X(s.committed), 168]} tone="ok" sk={`com-${i}`} />
          <HandText x={X(s.committed)} y={222} size={TEXT_SIZES.note} color="var(--ok)">
            committed offset
          </HandText>
          <Panel cx={360} cy={282} w={380} label={s.consumer} tone={s.consumerTone} sk="kcons" />
        </SketchSvg>
      )}
    </AnimFrame>
  );
}

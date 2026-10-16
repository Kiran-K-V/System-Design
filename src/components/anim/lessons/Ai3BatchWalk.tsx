import AnimFrame from '../AnimFrame';
import { HandText, SketchBox, SketchSvg, TEXT_SIZES, seedOf } from '../sketch';

type St = 'idle' | 'queued' | 'ok' | 'err' | 'exp' | 'retry';
interface Step {
  caption: string;
  rows: St[];
  /** Order in which results arrive in the file, as input row indices. Empty before results exist. */
  arrival: number[];
  status: string;
  counts: string;
  active: 'input' | 'status' | 'results' | 'none';
}

const IDS = ['doc-1', 'doc-2', 'doc-3', 'doc-4', 'doc-5', 'doc-6'];

const steps: Step[] = [
  {
    caption: 'Prepare. A batch is a list of requests. Each has a custom_id you choose (1 to 64 letters, digits, hyphen, underscore) and the same params as a normal Messages call. One batch holds up to 100,000 requests or 256 MB.',
    rows: ['idle', 'idle', 'idle', 'idle', 'idle', 'idle'], arrival: [], status: 'not created', counts: '', active: 'input',
  },
  {
    caption: 'Submit. One call creates the batch and returns an id at once. Request params are validated later, not now. A mistake in doc-3 will show up only when the batch ends, so test one request on the normal API first.',
    rows: ['queued', 'queued', 'queued', 'queued', 'queued', 'queued'], arrival: [], status: 'in_progress', counts: 'processing: 6', active: 'status',
  },
  {
    caption: 'Processing. Each request runs on its own, in any order. You poll the batch, or check from a scheduled job. There is no partial download: results can be read when all requests have finished, or after 24 hours.',
    rows: ['ok', 'ok', 'queued', 'ok', 'queued', 'queued'], arrival: [], status: 'in_progress', counts: 'processing: 3', active: 'status',
  },
  {
    caption: 'Ended. processing_status is ended. Four requests succeeded. doc-3 errored: its params were invalid. doc-6 expired: the 24-hour window closed before it ran. Errored, expired, and canceled requests are not billed. This outcome is illustrative.',
    rows: ['ok', 'ok', 'err', 'ok', 'ok', 'exp'], arrival: [], status: 'ended', counts: 'succeeded 4\nerrored 1, expired 1', active: 'status',
  },
  {
    caption: 'Collect. Stream the results file. Lines come back in any order, here doc-4, doc-1, doc-5, doc-3, doc-2, doc-6. Never pair by position. Join on custom_id, and store each result next to its input row.',
    rows: ['ok', 'ok', 'err', 'ok', 'ok', 'exp'], arrival: [3, 0, 4, 2, 1, 5], status: 'ended', counts: 'results kept 29 days', active: 'results',
  },
  {
    caption: 'Retry the failures. Collect the ids that are not succeeded, fix the cause, and submit them as a new batch with the same custom_ids. Your own store keeps one row per custom_id, so a repeat overwrites and does not duplicate.',
    rows: ['ok', 'ok', 'retry', 'ok', 'ok', 'retry'], arrival: [], status: 'in_progress', counts: 'new batch of 2\ndoc-3, doc-6', active: 'input',
  },
];

const tone = (s: St) => (s === 'ok' ? 'var(--ok)' : s === 'err' ? 'var(--bad)' : s === 'exp' ? 'var(--warn)' : s === 'retry' ? 'var(--accent)' : 'var(--muted)');
const label = (s: St) => (s === 'ok' ? 'succeeded' : s === 'err' ? 'errored' : s === 'exp' ? 'expired' : s === 'retry' ? 'resubmit' : s === 'queued' ? 'queued' : 'not sent');

export default function Ai3BatchWalk() {
  return (
    <AnimFrame title="Life of a batch" steps={steps}>
      {(_, s) => {
        const hasArrival = s.arrival.length > 0;
        return (
          <SketchSvg width={720} height={300} label={`Batch status ${s.status}. ${s.counts.replace('\n', ', ')}`}>
            <HandText x={90} y={22} size={TEXT_SIZES.heading} color="var(--muted)">custom_id</HandText>
            <HandText x={290} y={22} size={TEXT_SIZES.heading} color="var(--muted)">request state</HandText>
            {IDS.map((id, i) => {
              const cy = 58 + i * 40;
              const st = s.rows[i];
              return (
                <g key={id}>
                  <SketchBox cx={90} cy={cy} w={120} h={32} r={6} seed={seedOf(`id${i}${s.active}`)} stroke={s.active === 'input' ? 'var(--accent)' : 'var(--muted)'} strokeWidth={s.active === 'input' ? 2.2 : 1.4} />
                  <HandText x={90} y={cy} size={TEXT_SIZES.label} mono>{id}</HandText>
                  <SketchBox cx={290} cy={cy} w={140} h={32} r={6} seed={seedOf(`st${i}${st}`)} stroke={tone(st)} fill={st === 'idle' ? undefined : tone(st)} dashed={st === 'idle'} />
                  <HandText x={290} y={cy} size={TEXT_SIZES.label}>{label(st)}</HandText>
                  {hasArrival && (
                    <HandText x={410} y={cy} size={TEXT_SIZES.label} color="var(--accent)" mono>{`line ${s.arrival.indexOf(i) + 1}`}</HandText>
                  )}
                </g>
              );
            })}
            <SketchBox cx={590} cy={124} w={210} h={100} r={8} seed={seedOf(`bs${s.status}`)} stroke={s.active === 'status' ? 'var(--accent)' : s.status === 'ended' ? 'var(--ok)' : 'var(--muted)'} strokeWidth={s.active === 'status' ? 2.2 : 1.4} />
            <HandText x={590} y={90} size={TEXT_SIZES.note} color="var(--muted)">processing_status</HandText>
            <HandText x={590} y={116} size={TEXT_SIZES.label} mono>{s.status}</HandText>
            <HandText x={590} y={150} size={TEXT_SIZES.note} color="var(--muted)">{s.counts}</HandText>
            {hasArrival && (
              <HandText x={590} y={215} size={TEXT_SIZES.label} color="var(--accent)">{'file order differs\nfrom input order'}</HandText>
            )}
          </SketchSvg>
        );
      }}
    </AnimFrame>
  );
}

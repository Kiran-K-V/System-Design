import { HandText, SketchSvg, TEXT_SIZES } from '../sketch';
import { Arr, Panel } from './TechParts';

const ROWS = [
  { name: 'Poll', y: 84, a: 'GET /jobs/42', b: 'RUNNING 40%', note: 'Simplest. Works through any proxy.\nCosts calls. Delay up to one gap.' },
  { name: 'Webhook', y: 194, a: '', b: 'POST: job 42 done', note: 'No wasted calls. Caller needs a\npublic URL, and you must retry.' },
  { name: 'Push', y: 304, a: 'open stream', b: 'progress 40%', note: 'Live progress. Needs an open\nconnection (SSE or WebSocket).' },
];

/** Static infographic: three ways a client learns the result of a job. */
export default function LongRunningStatus() {
  return (
    <figure className="not-prose my-8 overflow-hidden rounded-xl border border-line bg-bg px-2 py-4 sm:px-4">
      <SketchSvg width={720} height={344} label="Three ways to report job status. Poll: the client asks repeatedly. Webhook: the server calls the client when done. Push: the server sends updates over an open connection.">
        {ROWS.map((r) => (
          <g key={r.name}>
            <HandText x={245} y={r.y - 46} size={TEXT_SIZES.heading} color="var(--accent)">
              {r.name}
            </HandText>
            <Panel cx={120} cy={r.y} w={90} label="Client" sk={`lr-c-${r.name}`} />
            <Panel cx={370} cy={r.y} w={90} label="API" sk={`lr-a-${r.name}`} />
            {r.a && <Arr from={[170, r.y - 10]} to={[320, r.y - 10]} tone="muted" label={r.a} labelDy={-14} sk={`lr-x-${r.name}`} />}
            <Arr from={[320, r.y + 12]} to={[170, r.y + 12]} tone="accent" label={r.b} labelDy={17} sk={`lr-y-${r.name}`} />
            <HandText x={450} y={r.y} size={TEXT_SIZES.note} anchor="start" color="var(--muted)">
              {r.note}
            </HandText>
          </g>
        ))}
      </SketchSvg>
    </figure>
  );
}

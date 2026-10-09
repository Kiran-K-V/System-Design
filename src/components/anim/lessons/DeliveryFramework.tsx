import AnimFrame from '../AnimFrame';
import { Badge, HandText, SketchArrow, SketchBox, SketchSvg, seedOf } from '../sketch';

const W = 960;
const H = 400;
const CY = 335;
const X = [75, 229, 383, 537, 691, 845];
const NAMES = ['Requirements', 'Core\nEntities', 'API or\nInterface', 'Data Flow\n(optional)', 'High-Level\nDesign', 'Deep\nDives'];

interface S {
  caption: string;
  title: string;
  items: string[];
  focus: number; // 0-5 box, 6 = both loops
}

const steps: S[] = [
  { focus: 0, title: '1 Requirements for a URL shortener', caption: 'Start by asking, not drawing. Pin down what the system must do (functional) and how well it must do it (non-functional). Say your assumed numbers out loud.', items: ['Functional: create a short URL from a long one. Redirect a short URL to its long URL.', 'Below the line: custom aliases, click analytics, expiry.', 'Non-functional (assumed): redirect in ~100 ms, high availability, ~100:1 reads to writes.'] },
  { focus: 1, title: '2 Core entities', caption: 'List the nouns the system stores or moves. This is a rough first draft. It gives you words to use in the API and the schema.', items: ['User', 'ShortLink: short_id, long_url, owner, created_at', 'Maybe later: Click, if analytics comes above the line.'] },
  { focus: 2, title: '3 API or interface', caption: 'Write the contract between the user and the system. Each functional requirement should map to at least one endpoint. Module 3 covers API design in depth.', items: ['POST /links  { long_url }  returns  { short_url }', 'GET /{short_id}  returns a redirect to long_url (HTTP 302)', 'The user comes from the auth token, not from the body.'] },
  { focus: 3, title: '4 Data flow (optional)', caption: 'The dashed box is optional. Use it when the problem moves data through a long chain, such as a pipeline or a crawler. A URL shortener has no such chain, so skip it.', items: ['Skipped here: two short request paths, nothing to chain.', 'For a web crawler you would write: seed URLs, fetch page, parse links, drop duplicates, store, repeat.'] },
  { focus: 4, title: '5 High-level design', caption: 'Draw the simplest set of components that satisfies the API. Trace each endpoint through them. Leave caches and queues for the deep dives. Then check: do the functional requirements hold? If not, loop back.', items: ['Client, then an API server, then one database: short_id to long_url.', 'POST writes a row. GET reads a row and redirects.', 'No cache, no queue yet. Keep it boring.'] },
  { focus: 5, title: '6 Deep dives', caption: 'Now pick the parts that matter most for the non-functional requirements. Use numbers. This is where senior and staff candidates separate themselves.', items: ['ID generation: counter ranges per server, base62 encoding (lesson 0.2 showed this answer).', 'Latency at read-heavy load: add a cache in front of the database (Module 5).', 'Availability: replicate the database (Module 4).'] },
  { focus: 6, title: 'Loop back', caption: 'The two curved arrows are the point. After the high-level design, re-check the functional requirements. After the deep dives, re-check the non-functional ones. The requirements are the test, so keep returning to them.', items: ['After step 5: can a user still create and follow a link? (functional)', 'After step 6: is the redirect still ~100 ms and still up? (non-functional)'] },
];

function status(i: number, f: number) {
  if (f === 6) return 'on';
  return i === f ? 'on' : i < f ? 'done' : 'off';
}

export default function DeliveryFramework() {
  return (
    <AnimFrame title="The six-step delivery framework, with a URL shortener" steps={steps} interval={3500}>
      {(_i, s) => {
        const loopA = s.focus === 4 || s.focus === 6;
        const loopB = s.focus === 5 || s.focus === 6;
        return (
          <div>
            <SketchSvg width={W} height={H} label="Six boxes in order: Requirements, Core Entities, API, Data Flow, High-Level Design, Deep Dives, with two arrows looping back to Requirements">
              {X.slice(0, 5).map((x, k) => (
                <SketchArrow key={k} points={[[x + 70, CY], [X[k + 1] - 70, CY]]} seed={seedOf('ar' + k)} stroke={k + 1 <= s.focus || s.focus === 6 ? 'var(--fg)' : 'var(--muted)'} />
              ))}
              <SketchArrow points={[[691, CY - 50], [610, 215], [380, 175], [150, 215], [95, CY - 50]]} seed={seedOf('loopA')} stroke={loopA ? 'var(--ok)' : 'var(--muted)'} strokeWidth={loopA ? 2.8 : 1.2} dashed={!loopA} />
              <SketchArrow points={[[845, CY - 50], [800, 95], [420, 30], [70, 95], [55, CY - 50]]} seed={seedOf('loopB')} stroke={loopB ? 'var(--warn)' : 'var(--muted)'} strokeWidth={loopB ? 2.8 : 1.2} dashed={!loopB} />
              <HandText x={420} y={238} size={15} color={loopA ? 'var(--ok)' : 'var(--muted)'} weight={loopA ? 700 : 400}>{'Primary goal:\nsatisfy functional requirements'}</HandText>
              <HandText x={440} y={110} size={15} color={loopB ? 'var(--warn)' : 'var(--muted)'} weight={loopB ? 700 : 400}>{'Primary goal:\nsatisfy non-functional requirements'}</HandText>
              {NAMES.map((n, k) => {
                const st = status(k, s.focus);
                return (
                  <g key={n}>
                    <SketchBox cx={X[k]} cy={CY} w={140} h={80} r={12} seed={seedOf('box' + k)} dashed={k === 3} stroke={st === 'on' ? 'var(--accent)' : st === 'done' ? 'var(--fg)' : 'var(--muted)'} strokeWidth={st === 'on' ? 3 : 1.4} fill={st === 'on' ? 'var(--accent-soft)' : undefined} fillStyle="solid" />
                    <HandText x={X[k]} y={CY + 2} size={15} weight={st === 'on' ? 700 : 400} halo color={st === 'off' ? 'var(--muted)' : 'var(--fg)'}>{n}</HandText>
                    <Badge cx={X[k] - 62} cy={CY - 38} n={k + 1} seed={seedOf('b' + k)} color={st === 'off' ? 'var(--muted)' : undefined} />
                  </g>
                );
              })}
            </SketchSvg>
            <div className="mx-2 mt-1 min-h-[10.5rem] rounded-xl border border-line bg-surface px-4 py-3 text-[0.9rem] leading-relaxed sm:mx-4">
              <div className="mb-1 font-semibold text-accent">{s.title}</div>
              <ul className="m-0 list-disc space-y-1 pl-5">
                {s.items.map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ul>
            </div>
          </div>
        );
      }}
    </AnimFrame>
  );
}

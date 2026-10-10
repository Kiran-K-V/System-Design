import AnimFrame from '../AnimFrame';
import FlowDiagram, { type FlowEdge, type FlowNode, type FlowNote, type Tone } from '../FlowDiagram';

/**
 * Retries multiply across layers. Five callers in a row, A to E, each making 3 attempts at the layer below.
 * When the database is down, one user request makes 3 x 3 x 3 x 3 x 3 = 243 calls to it. The AWS Builders' Library gives the same 243x.
 */

const IDS = ['a', 'b', 'c', 'd', 'e', 'db'];
const NAMES = ['Service A', 'Service B', 'Service C', 'Service D', 'Service E', 'Database'];
const X = [56, 168, 280, 392, 504];

interface Step {
  caption: string;
  /** Calls that reach each of B, C, D, E, DB (5 numbers). */
  counts: number[];
  shown: number; // how many callees are revealed
  tone: Tone;
  note?: string;
}

const steps: Step[] = [
  {
    caption:
      'Five services call each other in a line. The last one calls a database. The database is down, so every call to it fails. Each service has a simple rule: try up to 3 times, then give up.',
    counts: [0, 0, 0, 0, 0],
    shown: 0,
    tone: 'default',
  },
  { caption: 'One user request reaches service A. A calls B. B is the first callee. 1 call so far.', counts: [1, 0, 0, 0, 0], shown: 1, tone: 'accent' },
  { caption: 'B fails, because everything below it fails. A tries 3 times in all. B now receives 3 calls.', counts: [3, 0, 0, 0, 0], shown: 1, tone: 'warn' },
  { caption: 'Each of those 3 calls to B makes 3 attempts at C. C receives 3 x 3 = 9 calls.', counts: [3, 9, 0, 0, 0], shown: 2, tone: 'warn' },
  { caption: 'Each layer multiplies the last. D receives 27 calls and E receives 81.', counts: [3, 9, 27, 81, 0], shown: 4, tone: 'bad' },
  {
    caption: 'The database receives 3 x 3 x 3 x 3 x 3 = 243 calls for one user request. A database that was merely slow is now buried and cannot recover. The AWS Builders\' Library gives this same 243x.',
    counts: [3, 9, 27, 81, 243],
    shown: 5,
    tone: 'bad',
    note: '243 calls for 1 request',
  },
  {
    caption: 'The fix is to retry at one layer only. Only the layer closest to the database, E, retries. The layers above it make 1 attempt and pass the error up. The database now receives 3 calls, not 243.',
    counts: [1, 1, 1, 1, 3],
    shown: 5,
    tone: 'ok',
    note: '3 calls for 1 request',
  },
];

export default function RelRetryChain() {
  return (
    <AnimFrame title="Retries multiply across layers" steps={steps} interval={3400}>
      {(_, st) => {
        const nodes: FlowNode[] = IDS.map((id, k) => {
          const isDb = k === 5;
          const reached = k >= 1 && k - 1 < st.shown;
          return {
            id,
            x: isDb ? 650 : X[k],
            y: 100,
            w: isDb ? 110 : 88,
            h: 56,
            label: isDb ? 'Database' : NAMES[k].replace('Service ', 'Svc '),
            shape: isDb ? 'db' : 'box',
            tone: isDb ? 'bad' : k === 0 || reached ? 'default' : 'muted',
          };
        });
        const edges: FlowEdge[] = IDS.slice(0, 5).map((id, k) => ({ from: id, to: IDS[k + 1], head: 'end' as const }));
        const notes: FlowNote[] = [];
        st.counts.forEach((c, k) => {
          if (k >= st.shown || c === 0) return;
          const x = k === 4 ? 650 : X[k + 1];
          notes.push({ x, y: 172, anchor: 'middle', size: 18, tone: st.tone === 'default' ? 'muted' : st.tone, text: `${c} ${c === 1 ? 'call' : 'calls'}` });
        });
        if (st.note) notes.push({ x: 360, y: 36, anchor: 'middle', size: 18, tone: st.tone, text: st.note });
        return (
          <FlowDiagram
            width={720}
            height={210}
            nodes={nodes}
            edges={edges}
            notes={notes}
            active={st.shown >= 1 && st.shown < 5 ? [IDS[st.shown]] : st.shown === 5 ? ['db'] : []}
            label="Five services in a line calling a database, with the number of calls each one receives"
          />
        );
      }}
    </AnimFrame>
  );
}

import AnimFrame from '../AnimFrame';
import { HandText, SketchArrow, SketchBox, SketchSvg, TEXT_SIZES, seedOf } from '../sketch';

/**
 * A distributed trace builds up one span at a time. Times are in ms from the start of the request. All numbers are examples.
 * Spans nest: each child starts after its parent starts and ends before its parent ends.
 */

interface Span {
  id: string;
  parent: string | null;
  name: string;
  service: string;
  start: number;
  end: number;
  depth: number;
}

const SPANS: Span[] = [
  { id: 'root', parent: null, name: 'GET /checkout', service: 'gateway', start: 0, end: 250, depth: 0 },
  { id: 'auth', parent: 'root', name: 'check token', service: 'auth', start: 5, end: 30, depth: 1 },
  { id: 'cart', parent: 'root', name: 'load cart', service: 'cart', start: 35, end: 110, depth: 1 },
  { id: 'sql', parent: 'cart', name: 'SELECT items', service: 'cart db', start: 45, end: 100, depth: 2 },
  { id: 'pay', parent: 'root', name: 'charge card', service: 'payments', start: 115, end: 235, depth: 1 },
  { id: 'bank', parent: 'pay', name: 'bank API call', service: 'external', start: 125, end: 225, depth: 2 },
  { id: 'order', parent: 'root', name: 'write order', service: 'orders', start: 238, end: 248, depth: 1 },
];

interface Step {
  caption: string;
  shown: number; // number of spans visible
  focus: string | null;
}

const steps: Step[] = [
  { caption: 'A user taps Pay. The gateway starts a trace and makes up a trace ID. Every span made for this request will carry that ID. A span is one timed unit of work. Here is the empty canvas: time runs left to right, 0 to 250 ms.', shown: 0, focus: null },
  { caption: 'The gateway opens the first span, the root: GET /checkout. It has no parent. It starts at 0 ms. Its bar will end when the response is sent, so it is the length of the whole request.', shown: 1, focus: 'root' },
  { caption: 'The gateway calls the auth service. The call carries the trace ID and the root span\'s ID in a header. Auth opens a child span with parent = root. It takes 25 ms.', shown: 2, focus: 'auth' },
  { caption: 'Next the gateway calls the cart service. Another child of the root. It runs from 35 ms to 110 ms.', shown: 3, focus: 'cart' },
  { caption: 'While it runs, the cart service queries its database. That is a child of the cart span, so it is nested one level deeper. A trace is a tree of spans.', shown: 4, focus: 'sql' },
  { caption: 'The gateway calls the payment service. Its span runs from 115 ms to 235 ms. That is 120 ms, almost half of the request.', shown: 5, focus: 'pay' },
  { caption: 'The payment service calls an outside bank API. The bank span is a child of the payment span and lasts 100 ms. Nothing else happens inside charge card for most of its life.', shown: 6, focus: 'bank' },
  { caption: 'The gateway writes the order in 10 ms, then answers. The root span ends at 250 ms. The trace is complete: 7 spans, one trace ID.', shown: 7, focus: 'order' },
  { caption: 'Now read it. The widest leaf is the bank call: 100 ms out of 250, which is 40% of the request. Fixing the cart query would save at most 55 ms. A trace answers "where did the time go for this one request?" Metrics cannot, because they only show averages across many requests.', shown: 7, focus: 'bank' },
];

const LABEL_X = 20;
const T0 = 330;
const T1 = 690;
const ROW0 = 70;
const ROW = 42;
const MAX_MS = 250;
const xOf = (ms: number) => T0 + (ms / MAX_MS) * (T1 - T0);

export default function RelTraceWaterfall() {
  return (
    <AnimFrame title="A distributed trace, span by span" steps={steps} interval={3800}>
      {(i, st) => {
        const shown = SPANS.slice(0, st.shown);
        const byId = new Map(SPANS.map((s) => [s.id, s]));
        const focusSpan = st.focus ? byId.get(st.focus)! : null;
        const height = ROW0 + SPANS.length * ROW + 36;
        return (
          <SketchSvg width={720} height={height} label="Waterfall of spans in one checkout request">
            <HandText x={LABEL_X} y={24} size={TEXT_SIZES.heading} anchor="start" color="var(--muted)">
              {st.shown === 0 ? 'trace 4bf9…  (no spans yet)' : 'trace 4bf9…'}
            </HandText>
            {[0, 50, 100, 150, 200, 250].map((ms) => (
              <g key={ms}>
                <SketchArrow points={[[xOf(ms), 46], [xOf(ms), ROW0 + SPANS.length * ROW - 12]]} head="none" dashed stroke="var(--border)" strokeWidth={1} seed={seedOf(`grid${ms}`)} />
                <HandText x={xOf(ms)} y={40} size={TEXT_SIZES.note} color="var(--muted)">{`${ms}`}</HandText>
              </g>
            ))}
            <HandText x={T1} y={22} size={TEXT_SIZES.note} anchor="end" color="var(--muted)">ms</HandText>
            {shown.map((s, k) => {
              const y = ROW0 + k * ROW;
              const isFocus = st.focus === s.id;
              const isBank = s.id === 'bank' && st.shown === 7 && i === steps.length - 1;
              const stroke = isBank ? 'var(--bad)' : isFocus ? 'var(--accent)' : 'var(--muted)';
              const w = Math.max(10, xOf(s.end) - xOf(s.start));
              return (
                <g key={s.id}>
                  <HandText x={LABEL_X + s.depth * 18} y={y} size={TEXT_SIZES.label} anchor="start" color={isFocus ? 'var(--accent)' : 'var(--fg)'}>
                    {s.name}
                  </HandText>
                  <HandText x={LABEL_X + s.depth * 18} y={y + 16} size={TEXT_SIZES.note} anchor="start" color="var(--muted)">
                    {s.service}
                  </HandText>
                  <SketchBox cx={xOf(s.start) + w / 2} cy={y + 4} w={w} h={22} r={6} seed={seedOf(`span${s.id}`)} stroke={stroke} strokeWidth={isFocus ? 2.2 : 1.4} fill={isBank ? 'var(--bad)' : isFocus ? 'var(--accent)' : 'var(--muted)'} fillStyle="solid" />
                </g>
              );
            })}
            {focusSpan && (
              <HandText x={360} y={height - 16} size={TEXT_SIZES.label} mono color="var(--muted)">
                {`${focusSpan.name}  parent: ${focusSpan.parent ? byId.get(focusSpan.parent)!.name : 'none (root)'}  ${focusSpan.end - focusSpan.start} ms`}
              </HandText>
            )}
          </SketchSvg>
        );
      }}
    </AnimFrame>
  );
}

import AnimFrame from '../AnimFrame';
import { HandText, SketchBox, TEXT_SIZES, SketchSvg, seedOf } from '../sketch';

/** A scripted, illustrative run. The tool names, results and call counts are made up to show the shape of the failure. */
type T = 'idle' | 'active' | 'bad' | 'ok';
const COLOR: Record<T, string> = { idle: 'var(--muted)', active: 'var(--accent)', bad: 'var(--bad)', ok: 'var(--ok)' };

const LEFT = ['search', 'find', 'lookup', 'get_order', 'get_data', 'query'];
const RIGHT = ['crm_find_customer', 'orders_list', 'orders_refund'];

interface S {
  caption: string;
  left: Partial<Record<string, T>>;
  right: Partial<Record<string, T>>;
  leftLog: string;
  rightLog: string;
  leftCalls: number;
  rightCalls: number;
}

const STEPS: S[] = [
  {
    caption: 'Task: refund order 4417 for the customer Ana. Two tool sets can do it. The left set has 6 tools with overlapping jobs and vague names. The right set has 3 tools with distinct jobs and a system prefix. The runs below are scripted and illustrative.',
    left: {}, right: {}, leftLog: 'Six tools. Which one finds an order?', rightLog: 'Three tools. One job each.', leftCalls: 0, rightCalls: 0,
  },
  {
    caption: 'Left: the agent must guess. Four tools could "find" something. It picks search. The description says only "Search for things", so nothing tells it what is searched.',
    left: { search: 'active' }, right: {}, leftLog: 'call 1: search("Ana")', rightLog: '', leftCalls: 1, rightCalls: 0,
  },
  {
    caption: 'search returns a long list of mixed hits with every field in each one. The result is big, and it does not hold the order id. The agent has paid tokens and learned little. Every later call resends this result.',
    left: { search: 'bad' }, right: {}, leftLog: 'call 1: 25 mixed hits, no order id', rightLog: '', leftCalls: 1, rightCalls: 0,
  },
  {
    caption: 'It tries lookup next. The parameter is called "id", but it does not say whose id. The call fails with "invalid parameter". Many invalid-parameter errors are a sign of unclear descriptions or missing examples.',
    left: { search: 'bad', lookup: 'bad' }, right: {}, leftLog: 'call 2: lookup("Ana") -> invalid parameter', rightLog: '', leftCalls: 2, rightCalls: 0,
  },
  {
    caption: 'After more wrong picks, get_order works. In this script it took 4 calls to reach a result that the right set reaches in 1. The tools were not broken. The set was hard to choose from.',
    left: { search: 'bad', lookup: 'bad', find: 'bad', get_order: 'ok' }, right: {}, leftLog: 'call 4: get_order(4417) -> ok', rightLog: '', leftCalls: 4, rightCalls: 0,
  },
  {
    caption: 'Right: crm_find_customer is the only tool that finds a customer. Its result is short: two matches, each with an id and a name. The agent picks the right Ana from this result.',
    left: { search: 'bad', lookup: 'bad', find: 'bad', get_order: 'ok' }, right: { crm_find_customer: 'ok' }, leftLog: 'left total so far: 4 calls', rightLog: 'call 1: 2 matches (id, name)', leftCalls: 4, rightCalls: 1,
  },
  {
    caption: 'orders_list returns the open orders for that customer id, with a page size and a cursor. The agent sees order 4417 and knows whether more pages exist, so it does not repeat the call.',
    left: { search: 'bad', lookup: 'bad', find: 'bad', get_order: 'ok' }, right: { crm_find_customer: 'ok', orders_list: 'ok' }, leftLog: '', rightLog: 'call 2: orders_list(cust=88)', leftCalls: 4, rightCalls: 2,
  },
  {
    caption: 'orders_refund finishes the job in call 3. Left: 4 calls to find the order, and the refund still waits. Right: 3 calls in all. Fewer calls mean fewer tokens, because each call resends the history. The cost is a design choice, not luck.',
    left: { search: 'bad', lookup: 'bad', find: 'bad', get_order: 'ok' }, right: { crm_find_customer: 'ok', orders_list: 'ok', orders_refund: 'active' }, leftLog: 'left: 4 calls, order found, no refund yet', rightLog: 'right: 3 calls, refund queued', leftCalls: 4, rightCalls: 3,
  },
];

export default function Ai6ToolWalk() {
  return (
    <AnimFrame title="The same task with a confusing tool set and a clear one" steps={STEPS} interval={5200}>
      {(i, s) => (
        <SketchSvg width={720} height={450} label={`Step ${i + 1}: agent tool choice on two tool sets`}>
          <SketchBox cx={185} cy={200} w={340} h={350} r={16} dashed stroke="var(--muted)" seed={seedOf('tw-lp')} />
          <SketchBox cx={535} cy={200} w={340} h={350} r={16} dashed stroke="var(--muted)" seed={seedOf('tw-rp')} />
          <HandText x={185} y={44} size={TEXT_SIZES.heading} color="var(--muted)">Overlapping set</HandText>
          <HandText x={535} y={44} size={TEXT_SIZES.heading} color="var(--muted)">Distinct set</HandText>
          {LEFT.map((n, k) => {
            const t = s.left[n] ?? 'idle';
            const y = 92 + k * 52;
            return (
              <g key={n}>
                <SketchBox cx={185} cy={y} w={220} h={44} r={8} seed={seedOf(`tw-l-${n}`)} fill={t === 'idle' ? undefined : COLOR[t]} stroke={COLOR[t]} strokeWidth={t === 'idle' ? 1.4 : 2.2} />
                <HandText x={185} y={y} size={TEXT_SIZES.label} mono color={t === 'idle' ? 'var(--fg)' : COLOR[t]}>{n}</HandText>
              </g>
            );
          })}
          {RIGHT.map((n, k) => {
            const t = s.right[n] ?? 'idle';
            const y = 92 + k * 52;
            return (
              <g key={n}>
                <SketchBox cx={535} cy={y} w={270} h={44} r={8} seed={seedOf(`tw-r-${n}`)} fill={t === 'idle' ? undefined : COLOR[t]} stroke={COLOR[t]} strokeWidth={t === 'idle' ? 1.4 : 2.2} />
                <HandText x={535} y={y} size={TEXT_SIZES.label} mono color={t === 'idle' ? 'var(--fg)' : COLOR[t]}>{n}</HandText>
              </g>
            );
          })}
          <HandText x={535} y={290} size={TEXT_SIZES.note} color="var(--muted)">{'Names say the system and the job.\nResults are short and carry a cursor.'}</HandText>
          <HandText x={185} y={398} size={TEXT_SIZES.heading} mono color={s.leftCalls > 3 ? 'var(--bad)' : 'var(--fg)'}>{`calls: ${s.leftCalls}`}</HandText>
          <HandText x={535} y={398} size={TEXT_SIZES.heading} mono color="var(--fg)">{`calls: ${s.rightCalls}`}</HandText>
          <HandText x={185} y={430} size={TEXT_SIZES.note} mono color="var(--muted)">{s.leftLog}</HandText>
          <HandText x={535} y={430} size={TEXT_SIZES.note} mono color="var(--muted)">{s.rightLog}</HandText>
        </SketchSvg>
      )}
    </AnimFrame>
  );
}

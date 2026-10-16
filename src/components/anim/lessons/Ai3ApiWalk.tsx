import AnimFrame from '../AnimFrame';
import Ai3Code, { type CLine } from './Ai3Code';
import { HandText, SketchBox, SketchSvg, TEXT_SIZES, seedOf } from '../sketch';

/** Illustrative token counts for a two-turn chat. The field names are real (Anthropic Messages API). */
const REQ1: CLine[] = [
  { t: '{' },
  { t: '  "model": "claude-opus-5-5",', g: 'model' },
  { t: '  "max_tokens": 1024,', g: 'max' },
  { t: '  "system": "Be brief.",', g: 'system' },
  { t: '  "messages": [', g: 'msgs' },
  { t: '    {"role":"user","content":"Hi"}', g: 'msgs' },
  { t: '  ]', g: 'msgs' },
  { t: '}' },
];
const REQ2: CLine[] = [
  { t: '{' },
  { t: '  "model": "claude-opus-5-5",' },
  { t: '  "max_tokens": 1024,' },
  { t: '  "system": "Be brief.",', g: 'old' },
  { t: '  "messages": [', g: 'old' },
  { t: '    {"role":"user","content":"Hi"},', g: 'old' },
  { t: '    {"role":"assistant",', g: 'new' },
  { t: '     "content":"Hello!"},', g: 'new' },
  { t: '    {"role":"user","content":"Why?"}', g: 'new' },
  { t: '  ]' },
  { t: '}' },
];
const RES: CLine[] = [
  { t: '{' },
  { t: '  "role": "assistant",' },
  { t: '  "content": [', g: 'content' },
  { t: '    {"type":"text","text":"Hello!"}', g: 'content' },
  { t: '  ],', g: 'content' },
  { t: '  "stop_reason": "end_turn",', g: 'stop' },
  { t: '  "usage": {', g: 'usage' },
  { t: '    "input_tokens": 12,', g: 'usage' },
  { t: '    "output_tokens": 5', g: 'usage' },
  { t: '  }', g: 'usage' },
  { t: '}' },
];

interface S {
  caption: string;
  turn: 1 | 2;
  res: boolean;
  hiReq: Record<string, string>;
  hiRes: Record<string, string>;
  meter: boolean;
}

const A = 'var(--accent)';
const O = 'var(--ok)';
const W = 'var(--warn)';

const steps: S[] = [
  {
    caption: 'One HTTP POST, one JSON body. "model" names the model. "max_tokens" is required: it caps how many tokens the model may write. It is a ceiling, not a target. All token counts in this walk are illustrative.',
    turn: 1, res: false, hiReq: { model: A, max: A }, hiRes: {}, meter: false,
  },
  {
    caption: '"system" holds your standing instructions and sits at the top level. "messages" is the conversation: a list of turns, each with a role of "user" or "assistant". There is no "system" role inside messages on this API.',
    turn: 1, res: false, hiReq: { system: A, msgs: A }, hiRes: {}, meter: false,
  },
  {
    caption: 'The reply is a list of content blocks, not one string. Here it is one text block. A reply can also hold tool_use blocks (lesson A3.4). "stop_reason" says why generation ended. "end_turn" means the model finished by itself.',
    turn: 1, res: true, hiReq: {}, hiRes: { content: A, stop: O }, meter: false,
  },
  {
    caption: '"usage" is the meter. input_tokens counts what you sent (12 here). output_tokens counts what the model wrote (5). You are billed from these two numbers, so log them on every call.',
    turn: 1, res: true, hiReq: {}, hiRes: { usage: W }, meter: false,
  },
  {
    caption: 'Turn 2. The server kept nothing from turn 1. Your code sends the system prompt, the first user turn, the reply, and the new question again. The old part is outlined in green and the new part in blue.',
    turn: 2, res: false, hiReq: { old: O, new: A }, hiRes: {}, meter: true,
  },
  {
    caption: 'The meter at the bottom shows the cost of statelessness. Turn 1 sent 12 input tokens. Turn 2 sends 12 + 5 + 6 = 23, and you pay for all 23 again. Input grows with every turn, even when each message is short.',
    turn: 2, res: false, hiReq: { old: O, new: A }, hiRes: {}, meter: true,
  },
];

export default function Ai3ApiWalk() {
  return (
    <AnimFrame title="One API call, field by field" steps={steps} interval={4200}>
      {(i, s) => {
        const px = 360 / 23;
        return (
          <SketchSvg width={720} height={420} label={`Step ${i + 1} of the API call walk`}>
            <Ai3Code x={16} y={18} w={340} title={s.turn === 1 ? 'Request, turn 1' : 'Request, turn 2'} lines={s.turn === 1 ? REQ1 : REQ2} hi={s.hiReq} />
            {s.res && <Ai3Code x={372} y={18} w={332} title="Response" lines={RES} hi={s.hiRes} />}
            {!s.res && s.turn === 1 && (
              <HandText x={540} y={150} size={TEXT_SIZES.label} color="var(--muted)">
                Response comes next
              </HandText>
            )}
            {s.meter && (
              <g>
                <HandText x={16} y={316} anchor="start" size={TEXT_SIZES.heading} color="var(--muted)">
                  input_tokens per call
                </HandText>
                <HandText x={16} y={352} anchor="start" size={TEXT_SIZES.note} mono>turn 1</HandText>
                <SketchBox cx={90 + (12 * px) / 2} cy={352} w={12 * px} h={22} r={6} seed={seedOf('m1')} fill={A} stroke={A} />
                <HandText x={100 + 12 * px} y={352} anchor="start" size={TEXT_SIZES.note} mono>12</HandText>
                <HandText x={16} y={386} anchor="start" size={TEXT_SIZES.note} mono>turn 2</HandText>
                <SketchBox cx={90 + (17 * px) / 2} cy={386} w={17 * px} h={22} r={6} seed={seedOf('m2a')} fill={O} stroke={O} />
                <SketchBox cx={90 + 17 * px + (6 * px) / 2} cy={386} w={6 * px} h={22} r={6} seed={seedOf('m2b')} fill={A} stroke={A} />
                <HandText x={100 + 23 * px} y={386} anchor="start" size={TEXT_SIZES.note} mono>
                  {'23 = 12 + 5 resent, 6 new'}
                </HandText>
              </g>
            )}
          </SketchSvg>
        );
      }}
    </AnimFrame>
  );
}

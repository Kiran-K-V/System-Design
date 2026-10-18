import { DesignCompare, type CompareVariant } from '../DesignBuild';

const common = {
  nodes: [
    { id: 'a', x: 90, y: 80, w: 130, h: 56, label: 'Gateway A' },
    { id: 'b', x: 90, y: 260, w: 130, h: 56, label: 'Gateway B' },
    { id: 'redis', x: 470, y: 170, w: 150, h: 80, label: 'Redis', shape: 'db' as const },
  ],
};

const naive: CompareVariant = {
  id: 'naive',
  label: 'Naive: GET then SET',
  ...common,
  edges: [
    { from: 'a', to: 'redis' },
    { from: 'b', to: 'redis' },
  ],
  steps: [
    { caption: 'One client has one token left. Two requests from it arrive at two gateways at the same moment.', notes: [{ x: 470, y: 250, text: 'tokens = 1', anchor: 'middle', tone: 'accent' }] },
    { caption: 'Gateway A sends GET tokens. Redis answers 1.', packets: [{ from: 'a', to: 'redis' }], notes: [{ x: 470, y: 250, text: 'tokens = 1', anchor: 'middle', tone: 'accent' }] },
    { caption: 'Before A writes anything, Gateway B also sends GET tokens. It also gets 1. Both gateways now believe a token is free.', packets: [{ from: 'b', to: 'redis' }], notes: [{ x: 470, y: 250, text: 'tokens = 1', anchor: 'middle', tone: 'accent' }], tones: { a: 'warn', b: 'warn' } },
    { caption: 'A sends SET tokens 0 and lets its request through. B sends SET tokens 0 and lets its request through too. One token paid for two requests. The limit leaked.', packets: [{ from: 'a', to: 'redis' }, { from: 'b', to: 'redis', delay: 0.5 }], notes: [{ x: 470, y: 250, text: 'tokens = 0, 2 passed', anchor: 'middle', tone: 'bad' }], tones: { a: 'bad', b: 'bad', redis: 'bad' } },
  ],
};

const lua: CompareVariant = {
  id: 'lua',
  label: 'Better: one script in Redis',
  ...common,
  edges: [
    { from: 'a', to: 'redis' },
    { from: 'b', to: 'redis' },
  ],
  steps: [
    { caption: 'Same start: one token left, two requests at two gateways. This time each gateway sends one call that runs a small script inside Redis. The script does refill, check, and take.', notes: [{ x: 470, y: 250, text: 'tokens = 1', anchor: 'middle', tone: 'accent' }] },
    { caption: 'Both calls reach Redis. Redis runs one script at a time. It starts A first. B waits its turn.', packets: [{ from: 'a', to: 'redis' }, { from: 'b', to: 'redis', delay: 0.3 }], tones: { redis: 'accent' }, notes: [{ x: 470, y: 250, text: 'running: A', anchor: 'middle', tone: 'accent' }] },
    { caption: 'A\'s script sees 1 token, takes it, and returns allowed. The script ends. Only then does B\'s script start.', packets: [{ from: 'redis', to: 'a', tone: 'ok' }], tones: { a: 'ok' }, notes: [{ x: 470, y: 250, text: 'tokens = 0', anchor: 'middle', tone: 'ok' }] },
    { caption: 'B\'s script sees 0 tokens, changes nothing, and returns rejected. One token, one pass. Gateway B answers 429.', packets: [{ from: 'redis', to: 'b', tone: 'bad' }], tones: { a: 'ok', b: 'warn' }, notes: [{ x: 470, y: 250, text: 'tokens = 0, 1 passed', anchor: 'middle', tone: 'ok' }] },
  ],
};

export default function RateLimiterAtomic() {
  return (
    <DesignCompare
      title="Two gateways, one last token"
      prompt="Check method:"
      variants={[naive, lua]}
      height={330}
      label="Two gateways race for the last token. A GET then SET lets both through. A single script run inside Redis lets only one through."
    />
  );
}

import { DesignCompare, type CompareVariant } from '../DesignBuild';

const nodes = [
  { id: 'sched', x: 100, y: 60, w: 140, h: 44, label: 'Match schedule' },
  { id: 'scaler', x: 340, y: 60, w: 140, h: 44, label: 'Scaler' },
  { id: 'fleet', x: 590, y: 60, w: 140, h: 60, label: 'Server fleet', sub: 'capacity' },
  { id: 'viewers', x: 590, y: 200, w: 140, h: 44, label: 'Viewers' },
];

const variants: CompareVariant[] = [
  {
    id: 'react',
    label: 'Reactive: scale on load',
    nodes,
    edges: [
      { from: 'fleet', to: 'scaler', label: 'load', labelAt: [0, -16] },
      { from: 'scaler', to: 'fleet', bend: 28 },
      { from: 'viewers', to: 'fleet' },
    ],
    steps: [
      {
        caption: 'Mid-over, the match is quiet. The fleet fits the audience. The scaler watches the load and adds servers when it rises.',
        active: ['fleet'],
        tones: { fleet: 'ok', viewers: 'ok', scaler: 'muted', sched: 'muted' },
      },
      {
        caption: 'A wicket falls. Within seconds, many more people open the app or jump back in. The load climbs faster than the fleet can take.',
        active: ['viewers'],
        tones: { viewers: 'warn', fleet: 'warn', scaler: 'muted', sched: 'muted' },
        packets: [{ from: 'viewers', to: 'fleet' }],
      },
      {
        caption: 'The fleet is full. Requests fail and the app shows errors. The scaler sees the load only now, and the talk reports that its reaction time alone was about a minute and a half.',
        active: ['scaler'],
        tones: { fleet: 'bad', viewers: 'bad', scaler: 'accent', sched: 'muted' },
        notes: [{ x: 24, y: 270, text: 'Late servers arrive after the spike', tone: 'bad' }],
      },
      {
        caption: 'The new servers finally boot. The fleet is big enough, but the spike has passed and viewers saw errors at the exact moment they cared most. Reacting is correct for slow drift. It is too slow for a wicket.',
        active: ['fleet'],
        tones: { fleet: 'ok', viewers: 'warn', scaler: 'ok', sched: 'muted' },
        notes: [{ x: 24, y: 270, text: 'Capacity came after the damage', tone: 'warn' }],
      },
    ],
  },
  {
    id: 'prewarm',
    label: 'Pre-warmed on the schedule',
    nodes,
    edges: [{ from: 'sched', to: 'scaler', label: 'big match', labelAt: [0, -16] }, { from: 'scaler', to: 'fleet', label: 'warm up', labelAt: [0, -16] }, { from: 'viewers', to: 'fleet' }],
    steps: [
      {
        caption: 'Hours before the match, the schedule says a big match is coming. The scaler starts servers early, so they are booted and warm before anyone arrives.',
        active: ['sched'],
        tones: { sched: 'accent', scaler: 'accent', fleet: 'accent', viewers: 'muted' },
        packets: [{ from: 'sched', to: 'scaler' }, { from: 'scaler', to: 'fleet', delay: 0.9 }],
      },
      {
        caption: 'The match starts. The fleet already holds more than the expected audience, so there is spare room. We have also load-tested this fleet in earlier rehearsals, so we know it holds.',
        active: ['fleet'],
        tones: { fleet: 'ok', viewers: 'ok', scaler: 'muted', sched: 'muted' },
      },
      {
        caption: 'A wicket falls. The same jump in viewers arrives. The spare room absorbs it, so nobody sees an error. No server had to boot during the spike.',
        active: ['viewers'],
        tones: { viewers: 'warn', fleet: 'ok', scaler: 'muted', sched: 'muted' },
        packets: [{ from: 'viewers', to: 'fleet' }],
      },
      {
        caption: 'After the match, the scaler shrinks the fleet. The price is paying for idle servers if the match turns out dull. We pay it so the big moments are safe. Reactive scaling still helps for the part we did not predict.',
        active: ['scaler'],
        tones: { scaler: 'accent', fleet: 'ok', viewers: 'ok', sched: 'muted' },
        notes: [{ x: 24, y: 270, text: 'Cost: idle servers before and after', tone: 'warn' }],
      },
    ],
  },
];

export default function LiveStreamSpike() {
  return (
    <DesignCompare
      title="A wicket falls"
      prompt="Scaling:"
      variants={variants}
      height={300}
      label="Match schedule, scaler, server fleet, and viewers"
    />
  );
}

import { DesignCompare, type CompareVariant } from '../DesignBuild';

const nodes = [
  { id: 'pub', x: 100, y: 130, w: 130, h: 60, label: 'Pub/sub', sub: 'comment on A' },
  { id: 's1', x: 340, y: 50, w: 130, h: 60, label: 'Server 1', sub: 'viewers of A' },
  { id: 's2', x: 340, y: 130, w: 130, h: 60, label: 'Server 2', sub: 'viewers of B' },
  { id: 's3', x: 340, y: 210, w: 130, h: 60, label: 'Server 3', sub: 'viewers of A' },
  { id: 'v1', x: 600, y: 50, w: 110, h: 44, label: 'Viewers A' },
  { id: 'v2', x: 600, y: 130, w: 110, h: 44, label: 'Viewers B' },
  { id: 'v3', x: 600, y: 210, w: 110, h: 44, label: 'Viewers A' },
];
const tail = [
  { from: 's1', to: 'v1' },
  { from: 's2', to: 'v2' },
  { from: 's3', to: 'v3' },
];

const variants: CompareVariant[] = [
  {
    id: 'naive',
    label: 'Naive: one global topic',
    nodes,
    edges: [{ from: 'pub', to: 's1' }, { from: 'pub', to: 's2' }, { from: 'pub', to: 's3' }, ...tail],
    steps: [
      {
        caption: 'Every comment on every video goes to one topic. Every stream server subscribes to it. A comment is posted on video A.',
        active: ['pub'],
        packets: [],
      },
      {
        caption: 'The topic copies the comment to all three servers. Server 2 only has viewers of video B, so its copy is useless. It must receive it, parse it, and throw it away.',
        active: ['pub'],
        tones: { s1: 'ok', s3: 'ok', s2: 'bad' },
        packets: [{ from: 'pub', to: 's1' }, { from: 'pub', to: 's2' }, { from: 'pub', to: 's3' }],
        notes: [{ x: 24, y: 300, text: 'Server 2 did work for nothing', tone: 'bad' }],
      },
      {
        caption: 'The waste grows with the fleet. With N servers, each comment is copied N times, and each server must read the comment rate of the whole site. Adding servers adds cost for every comment, not capacity.',
        active: ['s2'],
        tones: { s1: 'warn', s2: 'warn', s3: 'warn' },
        notes: [{ x: 24, y: 300, text: 'Each server reads all comments on the site', tone: 'warn' }],
      },
    ],
  },
  {
    id: 'better',
    label: 'Better: channel per video',
    nodes,
    edges: [{ from: 'pub', to: 's1' }, { from: 'pub', to: 's3' }, ...tail],
    steps: [
      {
        caption: 'Each video has its own channel. A server subscribes to a channel only while it has a viewer of that video. Servers 1 and 3 hold channel A. Server 2 holds channel B.',
        active: ['pub'],
        tones: { s1: 'accent', s3: 'accent', s2: 'muted' },
        packets: [],
        notes: [{ x: 24, y: 300, text: 'Subscriptions follow the viewers', tone: 'accent' }],
      },
      {
        caption: 'A comment on video A is published to channel A. Only servers 1 and 3 receive it. Both have viewers who need it.',
        active: ['pub'],
        tones: { s1: 'ok', s3: 'ok', s2: 'muted' },
        packets: [{ from: 'pub', to: 's1' }, { from: 'pub', to: 's3' }],
      },
      {
        caption: 'Server 2 is not touched. The cost per comment is the number of servers with viewers of that video. A small video touches one server. Only a huge video touches many, and that case needs the sampling or snapshot trick.',
        active: ['s2'],
        tones: { s1: 'ok', s3: 'ok', s2: 'ok' },
        notes: [{ x: 24, y: 300, text: 'Copies per comment = servers with viewers of that video', tone: 'ok' }],
      },
    ],
  },
];

export default function LiveCommentsFanout() {
  return (
    <DesignCompare
      title="Who receives a comment"
      prompt="Design:"
      variants={variants}
      height={320}
      label="A pub/sub box, three stream servers, and their viewers"
    />
  );
}

import { DesignCompare, type CompareVariant } from '../DesignBuild';

const variants: CompareVariant[] = [
  {
    id: 'naive',
    label: 'Naive: one worker, whole file',
    nodes: [
      { id: 'raw', x: 90, y: 120, w: 120, h: 60, label: 'Raw file', sub: '10 minutes' },
      { id: 'w', x: 360, y: 120, w: 160, h: 60, label: 'One worker', sub: 'whole file, in order' },
      { id: 'out', x: 620, y: 120, w: 130, h: 60, label: 'One output', sub: 'one bitrate' },
    ],
    edges: [{ from: 'raw', to: 'w' }, { from: 'w', to: 'out' }],
    steps: [
      {
        caption: 'The whole raw file goes to a single worker. It must encode every frame, one rung after another, if you want more than one bitrate.',
        active: ['w'],
        packets: [{ from: 'raw', to: 'w' }],
        notes: [{ x: 24, y: 250, text: '4 rungs, one at a time = 4 × the work in one queue', tone: 'warn' }],
      },
      {
        caption: 'The worker is 90% through the first rung when the machine is taken away. Nothing was saved in the middle. The job restarts from frame zero.',
        active: ['w'],
        tones: { w: 'bad' },
        notes: [{ x: 24, y: 250, text: 'Crash at 90%: all of that work is lost', tone: 'bad' }],
      },
      {
        caption: 'Even without a crash, the creator waits for the slowest possible path: one machine, one file. Adding machines does not make one video faster, because only one worker can take the job.',
        active: ['out'],
        tones: { w: 'warn', out: 'warn' },
        notes: [{ x: 24, y: 250, text: 'More workers do not speed up one video', tone: 'warn' }],
      },
    ],
  },
  {
    id: 'dag',
    label: 'Better: a graph of small jobs',
    nodes: [
      { id: 'raw', x: 70, y: 150, w: 100, h: 44, label: 'Raw file' },
      { id: 'split', x: 205, y: 150, w: 100, h: 44, label: 'Split' },
      { id: 'j1', x: 380, y: 60, w: 140, h: 60, label: 'Job: seg 1', sub: 'rung 720p' },
      { id: 'j2', x: 380, y: 150, w: 140, h: 60, label: 'Job: seg 2', sub: 'rung 720p' },
      { id: 'j3', x: 380, y: 240, w: 140, h: 60, label: 'Job: seg 3', sub: 'rung 720p' },
      { id: 'man', x: 550, y: 150, w: 110, h: 44, label: 'Manifest' },
      { id: 'done', x: 670, y: 60, w: 60, h: 44, label: 'Ready' },
    ],
    edges: [
      { from: 'raw', to: 'split' },
      { from: 'split', to: 'j1' },
      { from: 'split', to: 'j2' },
      { from: 'split', to: 'j3' },
      { from: 'j1', to: 'man' },
      { from: 'j2', to: 'man' },
      { from: 'j3', to: 'man' },
      { from: 'man', to: 'done' },
    ],
    steps: [
      {
        caption: 'The pipeline is a graph of jobs with no loops. A job may run when all its inputs are done. First job: split the raw file into segments a few seconds long, each starting at a keyframe that decodes on its own.',
        active: ['split'],
        packets: [{ from: 'raw', to: 'split' }],
        notes: [{ x: 24, y: 320, text: '10 min / 6 s = 100 segments. 4 rungs: 400 encode jobs', tone: 'accent' }],
      },
      {
        caption: 'Every (segment, rung) pair is an independent job. They do not depend on each other, so many workers take them at once. One video now finishes in about the time of its slowest job, not the sum.',
        active: ['j1', 'j2', 'j3'],
        tones: { j1: 'accent', j2: 'accent', j3: 'accent' },
        packets: [{ from: 'split', to: 'j1' }, { from: 'split', to: 'j2' }, { from: 'split', to: 'j3' }],
        notes: [{ x: 24, y: 320, text: 'Jobs run in parallel on many workers', tone: 'accent' }],
      },
      {
        caption: 'Job “seg 2” fails: its machine was taken away by the cloud provider. The orchestrator retries that one job. The other two outputs are safe in storage. The job writes to a key made from video, rung, and segment, so a retry overwrites instead of duplicating.',
        active: ['j2'],
        tones: { j1: 'ok', j2: 'bad', j3: 'ok' },
        notes: [{ x: 24, y: 320, text: 'Retry 1 job of 400, not the whole video', tone: 'bad' }],
      },
      {
        caption: 'The retry succeeds. Now every input of the manifest job is done, so it runs once and lists all segments. Only then is the video marked ready.',
        active: ['man', 'done'],
        tones: { j1: 'ok', j2: 'ok', j3: 'ok', man: 'ok', done: 'ok' },
        packets: [{ from: 'j1', to: 'man' }, { from: 'j2', to: 'man' }, { from: 'j3', to: 'man' }, { from: 'man', to: 'done', delay: 0.9 }],
        notes: [{ x: 24, y: 320, text: 'Ready only when every parent is done', tone: 'ok' }],
      },
    ],
  },
];

export default function YoutubeDagCompare() {
  return (
    <DesignCompare
      title="Transcoding one video"
      prompt="Design:"
      variants={variants}
      height={350}
      label="A raw file turned into playable renditions by one worker, or by a graph of small jobs"
    />
  );
}

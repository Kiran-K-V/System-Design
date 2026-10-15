import AnimFrame from '../AnimFrame';
import FlowDiagram, { type FlowNote, type FlowPacket, type Tone } from '../FlowDiagram';

interface S {
  caption: string;
  packets?: FlowPacket[];
  store: string[];
  storeTone?: Tone;
  active?: string[];
  tones?: Record<string, Tone>;
}

const STEPS: S[] = [
  { caption: 'Two people edit one rectangle at the same moment. Alice sets x to 10. Bob sets x to 40.', packets: [{ from: 'alice', to: 'server', label: 'x = 10' }, { from: 'bob', to: 'server', label: 'x = 40', delay: 0.15 }], store: ['x: 5', 'color: red'], active: ['server'] },
  { caption: 'The server is the single place that orders events. Alice\'s message arrives first, so the stored x becomes 10.', store: ['x: 10', 'color: red'], active: ['store'], storeTone: 'ok' },
  { caption: 'Bob\'s message arrives second. The server keeps the last value it received for that property. Alice\'s 10 is overwritten, not merged.', store: ['x: 40', 'color: red'], active: ['store'], storeTone: 'warn' },
  { caption: 'The server sends the stored value to both clients. Alice\'s screen jumps to 40. Both clients now agree.', packets: [{ from: 'server', to: 'alice', label: 'x = 40' }, { from: 'server', to: 'bob', label: 'x = 40', delay: 0.15 }], store: ['x: 40', 'color: red'], active: ['server'], tones: { alice: 'warn', bob: 'ok' }, storeTone: 'ok' },
  { caption: 'Now Alice changes the color. Color is a different property from x, so nothing conflicts and Bob\'s x edit stays.', packets: [{ from: 'alice', to: 'server', label: 'color = blue' }], store: ['x: 40', 'color: blue'], active: ['store'], storeTone: 'ok' },
];

export default function FigmaLww() {
  return (
    <AnimFrame title="Last writer wins, per property" steps={STEPS} interval={3600}>
      {(i, s) => {
        const notes: FlowNote[] = s.store.map((t, k) => ({ x: 560, y: 215 + k * 22, text: t, anchor: 'middle', tone: s.storeTone && k === 0 && i < 4 ? s.storeTone : undefined }));
        return (
          <FlowDiagram
            width={720}
            height={290}
            label="Alice and Bob set the same property. The server keeps the later value and sends it to both clients. A change to a different property is kept."
            nodes={[
              { id: 'alice', x: 80, y: 70, w: 110, h: 56, label: 'Alice', tone: s.tones?.alice },
              { id: 'bob', x: 80, y: 220, w: 110, h: 56, label: 'Bob', tone: s.tones?.bob },
              { id: 'server', x: 330, y: 145, w: 150, h: 64, label: 'Server', sub: 'orders events' },
              { id: 'store', x: 560, y: 145, w: 150, h: 80, shape: 'db', label: 'Rectangle', sub: 'stored values' },
            ]}
            edges={[
              { from: 'alice', to: 'server' },
              { from: 'bob', to: 'server' },
              { from: 'server', to: 'store' },
            ]}
            notes={notes}
            active={s.active}
            packets={s.packets}
            stepKey={i}
          />
        );
      }}
    </AnimFrame>
  );
}

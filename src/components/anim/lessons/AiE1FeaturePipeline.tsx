import AnimFrame from '../AnimFrame';
import { HandText, SketchArrow, SketchBox, SketchCylinder, SketchSvg, TEXT_SIZES, seedOf } from '../sketch';

interface Step {
  caption: string;
  active: string[];
}

const steps: Step[] = [
  { active: ['raw'], caption: 'Raw events arrive: payments, clicks, orders. They are the source of every feature. Nothing is a feature yet.' },
  { active: ['def'], caption: 'One feature definition says how to compute a feature, for example "payments in the last 7 days". Both paths below run this same definition, so the two stores agree.' },
  { active: ['batch', 'offline'], caption: 'The batch job reads the full history on a schedule and writes the results to the offline store. The offline store is big and cheap. It keeps old values with their timestamps.' },
  { active: ['stream', 'online'], caption: 'The stream job updates the same features as events arrive and writes only the newest value per key to the online store. The online store is small and fast.' },
  { active: ['offline', 'train'], caption: 'Training reads the offline store. A point-in-time join (below) gives each training row the values known at that moment.' },
  { active: ['online', 'serve'], caption: 'At request time the model server looks up a user\'s features by key in the online store, like a cache read. It must answer in milliseconds.' },
];

function tone(s: Step, id: string) {
  return s.active.includes(id) ? 'var(--accent)' : 'var(--muted)';
}

export default function AiE1FeaturePipeline() {
  return (
    <AnimFrame title="From raw events to a feature in two stores" steps={steps} interval={5500}>
      {(_, s) => {
        const t = (id: string) => tone(s, id);
        const w = (id: string) => (s.active.includes(id) ? 2.2 : 1.4);
        return (
          <SketchSvg width={720} height={400} label="Raw events feed a batch job and a stream job. Batch writes the offline store used for training. Stream writes the online store used for serving.">
            <SketchBox cx={360} cy={44} w={300} h={44} seed={seedOf('fp-def')} stroke={t('def')} fill={t('def')} strokeWidth={w('def')} dashed />
            <HandText x={360} y={44} size={TEXT_SIZES.label}>One feature definition</HandText>

            <SketchCylinder cx={90} cy={210} w={110} h={80} seed={seedOf('fp-raw')} stroke={t('raw')} fill={t('raw')} strokeWidth={w('raw')} />
            <HandText x={90} y={210} size={TEXT_SIZES.label}>Raw events</HandText>

            <SketchBox cx={260} cy={140} w={130} h={44} seed={seedOf('fp-batch')} stroke={t('batch')} fill={t('batch')} strokeWidth={w('batch')} />
            <HandText x={260} y={140} size={TEXT_SIZES.label}>Batch job</HandText>
            <SketchBox cx={260} cy={290} w={130} h={44} seed={seedOf('fp-stream')} stroke={t('stream')} fill={t('stream')} strokeWidth={w('stream')} />
            <HandText x={260} y={290} size={TEXT_SIZES.label}>Stream job</HandText>

            <SketchCylinder cx={450} cy={140} w={110} h={70} seed={seedOf('fp-off')} stroke={t('offline')} fill={t('offline')} strokeWidth={w('offline')} />
            <HandText x={450} y={146} size={TEXT_SIZES.label}>Offline store</HandText>
            <SketchCylinder cx={450} cy={290} w={110} h={70} seed={seedOf('fp-on')} stroke={t('online')} fill={t('online')} strokeWidth={w('online')} />
            <HandText x={450} y={296} size={TEXT_SIZES.label}>Online store</HandText>

            <SketchBox cx={630} cy={140} w={120} h={44} seed={seedOf('fp-train')} stroke={t('train')} fill={t('train')} strokeWidth={w('train')} />
            <HandText x={630} y={140} size={TEXT_SIZES.label}>Training</HandText>
            <SketchBox cx={630} cy={290} w={120} h={44} seed={seedOf('fp-serve')} stroke={t('serve')} fill={t('serve')} strokeWidth={w('serve')} />
            <HandText x={630} y={290} size={TEXT_SIZES.label}>Model server</HandText>

            <SketchArrow points={[[140, 190], [190, 150]]} seed={seedOf('fp-a1')} stroke="var(--muted)" />
            <SketchArrow points={[[140, 232], [190, 280]]} seed={seedOf('fp-a2')} stroke="var(--muted)" />
            <SketchArrow points={[[326, 140], [388, 140]]} seed={seedOf('fp-a3')} stroke={t('batch')} />
            <SketchArrow points={[[326, 290], [388, 290]]} seed={seedOf('fp-a4')} stroke={t('stream')} />
            <SketchArrow points={[[512, 140], [564, 140]]} seed={seedOf('fp-a5')} stroke={t('train')} />
            <SketchArrow points={[[512, 290], [564, 290]]} seed={seedOf('fp-a6')} stroke={t('serve')} />
            <HandText x={450} y={352} size={TEXT_SIZES.note} color="var(--muted)">newest value per key</HandText>
            <HandText x={450} y={96} size={TEXT_SIZES.note} color="var(--muted)">full history with timestamps</HandText>
          </SketchSvg>
        );
      }}
    </AnimFrame>
  );
}

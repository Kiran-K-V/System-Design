import { HandText, SketchArrow, SketchBox, SketchSvg, seedOf } from '../sketch';

/** Static infographic: the PACELC decision tree. */
function Box({ cx, cy, w, h, text, color, id, size = 15 }: { cx: number; cy: number; w: number; h: number; text: string; color?: string; id: string; size?: number }) {
  return (
    <g>
      <SketchBox cx={cx} cy={cy} w={w} h={h} seed={seedOf(id)} stroke={color} />
      <HandText x={cx} y={cy} size={size} color={color}>
        {text}
      </HandText>
    </g>
  );
}

export default function PacelcTree() {
  return (
    <SketchSvg width={720} height={350} label="PACELC decision tree: if partition, choose availability or consistency; else choose latency or consistency">
      <Box id="root" cx={360} cy={34} w={230} h={48} text="Is there a network partition?" size={17} />
      <SketchArrow points={[[300, 60], [190, 112]]} seed={seedOf('t1')} />
      <SketchArrow points={[[420, 60], [530, 112]]} seed={seedOf('t2')} />
      <HandText x={215} y={80} size={16} color="var(--bad)" weight={700}>
        yes (P)
      </HandText>
      <HandText x={505} y={80} size={16} color="var(--ok)" weight={700}>
        no (Else)
      </HandText>
      <Box id="p" cx={180} cy={140} w={280} h={52} text={'CAP applies:\navailability or consistency?'} size={16} color="var(--bad)" />
      <Box id="e" cx={540} cy={140} w={280} h={52} text={'Normal run:\nlatency or consistency?'} size={16} color="var(--ok)" />
      <SketchArrow points={[[120, 168], [95, 224]]} seed={seedOf('t3')} />
      <SketchArrow points={[[240, 168], [265, 224]]} seed={seedOf('t4')} />
      <SketchArrow points={[[480, 168], [455, 224]]} seed={seedOf('t5')} />
      <SketchArrow points={[[600, 168], [625, 224]]} seed={seedOf('t6')} />
      <Box id="pa" cx={95} cy={272} w={165} h={74} text={'A: keep answering.\nMay be stale or\ndiverge.'} size={14} />
      <Box id="pc" cx={265} cy={272} w={165} h={74} text={'C: reject requests\non the cut-off side.'} size={14} />
      <Box id="el" cx={455} cy={272} w={165} h={74} text={'L: answer from the\nnearest replica.\nMay be stale.'} size={14} />
      <Box id="ec" cx={625} cy={272} w={165} h={74} text={'C: wait for replicas\nto confirm. Slower.'} size={14} />
      <HandText x={360} y={336} size={14} color="var(--muted)">
        name = P then A or C, E then L or C. Example: Cassandra default is PA/EL.
      </HandText>
    </SketchSvg>
  );
}

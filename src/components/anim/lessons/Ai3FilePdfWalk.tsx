import AnimFrame from '../AnimFrame';
import { HandText, SketchArrow, SketchBox, SketchSvg, TEXT_SIZES, seedOf } from '../sketch';

type Tone = 'idle' | 'active' | 'ok' | 'bad' | 'warn';
interface Step {
  caption: string;
  pdf: Tone;
  text: Tone;
  img: Tone;
  model: Tone;
  textLabel: string;
  imgLabel: string;
  modelLabel: string;
  note?: string;
}

const steps: Step[] = [
  {
    caption: 'You send one PDF page, an invoice. A PDF is a container. It can hold a text layer, page graphics, or both. The API does not guess which you need. It uses both.',
    pdf: 'active', text: 'idle', img: 'idle', model: 'idle',
    textLabel: 'Text layer', imgLabel: 'Page image', modelLabel: 'Model input',
  },
  {
    caption: 'Path 1. The server pulls the text layer out of the page. This costs ordinary text tokens. Small and cheap, but it has no layout: a table becomes a run of words.',
    pdf: 'ok', text: 'active', img: 'idle', model: 'idle',
    textLabel: 'Text layer\ntext tokens', imgLabel: 'Page image', modelLabel: 'Model input',
  },
  {
    caption: 'Path 2. The server also rasterizes the page into an image, at a size you do not control. It then counts 28 x 28 patches like any image. Tables, stamps, and charts survive here.',
    pdf: 'ok', text: 'ok', img: 'active', model: 'idle',
    textLabel: 'Text layer\ntext tokens', imgLabel: 'Page image\nvisual tokens', modelLabel: 'Model input',
  },
  {
    caption: 'The model reads both for every page. So a PDF page costs more than its text alone. Anthropic gives one data point, for Bedrock: a 3-page PDF is about 1,000 tokens as text only and about 7,000 with page images.',
    pdf: 'ok', text: 'ok', img: 'ok', model: 'active',
    textLabel: 'Text layer\ntext tokens', imgLabel: 'Page image\nvisual tokens', modelLabel: 'text + image\nper page',
    note: 'Bedrock: about 1,000 vs 7,000 tokens for 3 pages',
  },
  {
    caption: 'A scanned PDF has no text layer. Path 1 returns nothing, and the model reads the image only. If the scan is blurry, the answer is wrong, and no token count shows it. Run OCR first when you need exact text.',
    pdf: 'warn', text: 'bad', img: 'active', model: 'warn',
    textLabel: 'Text layer\nempty', imgLabel: 'Page image\nonly source', modelLabel: 'image only',
  },
  {
    caption: 'Limits: 32 MB per request and 600 pages, or 100 pages when the context window is under 1M tokens. Dense pages can fill the context before the page limit. Split the file, or upload once and refer by file_id.',
    pdf: 'warn', text: 'idle', img: 'idle', model: 'warn',
    textLabel: 'Text layer', imgLabel: 'Page image', modelLabel: 'Context fills\nbefore 600 pages',
    note: '32 MB, 600 pages (100 under 1M context)',
  },
];

const col = (t: Tone) => (t === 'active' ? 'var(--accent)' : t === 'ok' ? 'var(--ok)' : t === 'bad' ? 'var(--bad)' : t === 'warn' ? 'var(--warn)' : 'var(--muted)');
const fill = (t: Tone) => (t === 'idle' ? undefined : col(t));

export default function Ai3FilePdfWalk() {
  return (
    <AnimFrame title="A PDF page becomes text and an image" steps={steps}>
      {(_, s) => (
        <SketchSvg width={720} height={290} label={`PDF path: ${s.textLabel.replace('\n', ' ')}, ${s.imgLabel.replace('\n', ' ')}, ${s.modelLabel.replace('\n', ' ')}`}>
          <SketchBox cx={100} cy={145} w={140} h={60} r={8} seed={seedOf('pdf')} stroke={col(s.pdf)} fill={fill(s.pdf)} strokeWidth={s.pdf === 'active' ? 2.2 : 1.4} />
          <HandText x={100} y={145} size={TEXT_SIZES.label}>PDF page</HandText>

          <SketchBox cx={360} cy={75} w={170} h={60} r={8} seed={seedOf('txt')} stroke={col(s.text)} fill={fill(s.text)} strokeWidth={s.text === 'active' ? 2.2 : 1.4} dashed={s.text === 'bad'} />
          <HandText x={360} y={75} size={TEXT_SIZES.label}>{s.textLabel}</HandText>

          <SketchBox cx={360} cy={215} w={170} h={60} r={8} seed={seedOf('img')} stroke={col(s.img)} fill={fill(s.img)} strokeWidth={s.img === 'active' ? 2.2 : 1.4} />
          <HandText x={360} y={215} size={TEXT_SIZES.label}>{s.imgLabel}</HandText>

          <SketchBox cx={620} cy={145} w={160} h={60} r={8} seed={seedOf('mdl')} stroke={col(s.model)} fill={fill(s.model)} strokeWidth={s.model === 'active' ? 2.2 : 1.4} />
          <HandText x={620} y={145} size={TEXT_SIZES.label}>{s.modelLabel}</HandText>

          <SketchArrow points={[[176, 130], [270, 85]]} seed={seedOf('a1')} stroke={col(s.text === 'idle' ? 'idle' : 'ok')} />
          <SketchArrow points={[[176, 160], [270, 205]]} seed={seedOf('a2')} stroke={col(s.img === 'idle' ? 'idle' : 'ok')} />
          <SketchArrow points={[[452, 85], [534, 130]]} seed={seedOf('a3')} stroke={col(s.text === 'bad' ? 'bad' : s.model === 'idle' ? 'idle' : 'ok')} dashed={s.text === 'bad'} />
          <SketchArrow points={[[452, 205], [534, 160]]} seed={seedOf('a4')} stroke={col(s.model === 'idle' ? 'idle' : 'ok')} />

          {s.note && (
            <HandText x={360} y={272} size={TEXT_SIZES.note} color="var(--muted)">{s.note}</HandText>
          )}
        </SketchSvg>
      )}
    </AnimFrame>
  );
}

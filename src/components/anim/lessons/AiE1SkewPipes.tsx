import AnimFrame from '../AnimFrame';
import FlowDiagram, { type FlowEdge, type FlowNode, type Tone } from '../FlowDiagram';

/**
 * Two pipelines compute "orders in the last 7 days" for one user (illustrative).
 * Training counts all 9 orders. Serving counts only the 6 that were delivered.
 */

interface Step {
  caption: string;
  active: string[];
  show: string[];
  tones?: Record<string, Tone>;
  sub?: Record<string, string>;
  label: string;
}

const BASE = ['raw', 'model'];

const steps: Step[] = [
  {
    caption: 'One user, last 7 days: 9 orders placed, 3 of them cancelled. Both pipelines start from the same raw events. The feature we want is "orders in the last 7 days".',
    active: ['raw'],
    show: BASE,
    label: 'Raw events feed two pipelines',
  },
  {
    caption: 'Training path. A data engineer wrote a warehouse query. It counts every order row in the window, cancelled or not, so the value is 9. The model trains on these rows.',
    active: ['sql', 'tf'],
    show: [...BASE, 'sql', 'tf'],
    label: 'Training path computes 9',
  },
  {
    caption: 'Serving path. A backend engineer wrote a live counter in the service. It adds one when an order is delivered, so cancelled orders never count. Two people, two languages, one name for the feature. The value is 6.',
    active: ['svc', 'sf'],
    show: [...BASE, 'sql', 'tf', 'svc', 'sf'],
    tones: { sf: 'warn', tf: 'ok' },
    label: 'Serving path computes 6',
  },
  {
    caption: 'The model learned what "9" means from training rows. In production it meets "6" for the same user and the same week. The score shifts. No error is raised, because 6 is a valid number.',
    active: ['model'],
    show: [...BASE, 'sql', 'tf', 'svc', 'sf'],
    tones: { sf: 'bad', tf: 'bad', model: 'warn' },
    label: 'Same user, two values',
  },
  {
    caption: 'Why offline tests stay green. The holdout set is built by the training path, so it also says 9. Offline AUC cannot see a problem that only exists on the serving path.',
    active: ['tf'],
    show: [...BASE, 'sql', 'tf', 'svc', 'sf'],
    tones: { sf: 'bad', tf: 'ok', model: 'ok' },
    sub: { model: 'offline AUC: fine' },
    label: 'Offline tests cannot see it',
  },
  {
    caption: 'Detection. The service writes the feature value it used into a log, with the request id. A job recomputes the same feature offline for the same request. The two values disagree for this user. That mismatch rate is the skew number to alert on.',
    active: ['log', 'cmp'],
    show: [...BASE, 'sql', 'tf', 'svc', 'sf', 'log', 'cmp'],
    tones: { sf: 'bad', tf: 'ok', cmp: 'bad', model: 'ok' },
    label: 'Log serving values, then compare',
  },
];

const NODES: FlowNode[] = [
  { id: 'raw', x: 90, y: 190, w: 130, h: 70, label: 'Order events', sub: '9 placed, 3 cancelled', shape: 'db' },
  { id: 'sql', x: 280, y: 90, w: 140, h: 60, label: 'Warehouse SQL', sub: 'training job' },
  { id: 'svc', x: 280, y: 290, w: 140, h: 60, label: 'Service code', sub: 'live counter' },
  { id: 'tf', x: 470, y: 90, w: 130, h: 60, label: 'orders_7d = 9', sub: 'all rows' },
  { id: 'sf', x: 470, y: 290, w: 130, h: 60, label: 'orders_7d = 6', sub: 'delivered only' },
  { id: 'model', x: 640, y: 190, w: 100, h: 60, label: 'Model' },
  { id: 'log', x: 280, y: 350, w: 140, h: 44, label: 'Feature log' },
  { id: 'cmp', x: 455, y: 190, w: 110, h: 50, label: 'Compare' },
];

const EDGES: FlowEdge[] = [
  { from: 'raw', to: 'sql' },
  { from: 'raw', to: 'svc' },
  { from: 'sql', to: 'tf' },
  { from: 'svc', to: 'sf' },
  { from: 'tf', to: 'model', label: 'trains' },
  { from: 'sf', to: 'model', label: 'scores' },
  { from: 'svc', to: 'log' },
  { from: 'log', to: 'cmp' },
  { from: 'tf', to: 'cmp' },
];

export default function AiE1SkewPipes() {
  return (
    <AnimFrame title="Same feature name, two pipelines, two values" steps={steps} interval={6500}>
      {(_, s) => {
        const nodes = NODES.filter((n) => s.show.includes(n.id)).map((n) => ({
          ...n,
          tone: s.tones?.[n.id] ?? n.tone,
          sub: s.sub?.[n.id] ?? n.sub,
        }));
        const edges = EDGES.filter((e) => s.show.includes(e.from) && s.show.includes(e.to));
        return <FlowDiagram width={720} height={400} nodes={nodes} edges={edges} active={s.active} label={s.label} />;
      }}
    </AnimFrame>
  );
}

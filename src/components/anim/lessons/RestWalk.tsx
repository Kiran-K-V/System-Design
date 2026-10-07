import { motion } from 'motion/react';
import AnimFrame from '../AnimFrame';
import { HandText, SketchArrow, SketchBox, SketchSvg, seedOf } from '../sketch';

interface Row {
  id: number;
  text: string;
}

interface WalkStep {
  caption: string;
  req?: { line: string; body?: string };
  res?: { line: string; extra?: string; ok: boolean };
  rows: Row[];
  /** Row id to highlight. */
  hl?: number;
  gone?: number;
}

const R980: Row = { id: 980, text: 'first!' };

const steps: WalkStep[] = [
  {
    caption:
      'A tiny Twitter-like API. The server stores a table of tweets. The API exposes it as two nouns: the collection /tweets, and one member /tweets/{id}. The HTTP verb says what to do to the noun.',
    rows: [R980],
  },
  {
    caption:
      'POST /tweets creates a tweet. The server picks the id and answers 201 Created. The Location header tells the client where the new tweet lives. The author comes from the auth token, not from the body.',
    req: { line: 'POST /tweets', body: '{ "text": "hello" }' },
    res: { line: '201 Created', extra: 'Location: /tweets/981', ok: true },
    rows: [R980, { id: 981, text: 'hello' }],
    hl: 981,
  },
  {
    caption: 'GET /tweets/981 reads one tweet. GET is safe: it never changes data. That is why caches and retries can use it freely.',
    req: { line: 'GET /tweets/981' },
    res: { line: '200 OK', extra: '{ "id": 981, "text": "hello" }', ok: true },
    rows: [R980, { id: 981, text: 'hello' }],
    hl: 981,
  },
  {
    caption:
      'PATCH /tweets/981 changes part of the tweet. PUT would replace the whole tweet. Sending this PATCH twice leaves the same text, because it sets a value. A PATCH that says "add 1 to likes" would not be safe to repeat.',
    req: { line: 'PATCH /tweets/981', body: '{ "text": "hello!" }' },
    res: { line: '200 OK', extra: '{ "id": 981, "text": "hello!" }', ok: true },
    rows: [R980, { id: 981, text: 'hello!' }],
    hl: 981,
  },
  {
    caption: 'DELETE /tweets/981 removes the tweet. The server answers 204 No Content: success, and nothing to send back.',
    req: { line: 'DELETE /tweets/981' },
    res: { line: '204 No Content', ok: true },
    rows: [R980],
    gone: 981,
  },
  {
    caption:
      'The client sends the same DELETE again, because it never saw the first answer. The tweet is already gone, so the server answers 404. The status code differs, but the server state is the same. That is what idempotent means.',
    req: { line: 'DELETE /tweets/981' },
    res: { line: '404 Not Found', ok: false },
    rows: [R980],
  },
  {
    caption:
      'A bad request. The body has an empty text. The server rejects it with 422 and says which field is wrong. This is a client error: sending the same request again will fail again.',
    req: { line: 'POST /tweets', body: '{ "text": "" }' },
    res: { line: '422 Unprocessable', extra: '"text" must not be empty', ok: false },
    rows: [R980],
  },
  {
    caption:
      'Now the danger. A client sends POST /tweets, the response is lost, and the client retries. POST is not idempotent, so the server creates two tweets. Lesson 3.4 shows how to fix this.',
    req: { line: 'POST /tweets  (sent twice)', body: '{ "text": "hi" }' },
    res: { line: '201 Created  ×2', extra: 'Location: 982, Location: 983', ok: false },
    rows: [R980, { id: 982, text: 'hi' }, { id: 983, text: 'hi' }],
    hl: 983,
  },
];

const TX = 530;
const ROW_H = 38;

export default function RestWalk() {
  return (
    <AnimFrame title="REST verbs on a tweets resource" steps={steps}>
      {(i, s) => (
        <SketchSvg width={640} height={330} label="A client sends REST requests and the server tweets table changes">
          <SketchBox cx={44} cy={165} w={78} h={52} seed={seedOf('client')} />
          <HandText x={44} y={165} size={15}>
            Client
          </HandText>

          <HandText x={236} y={16} size={13} color="var(--muted)">
            request
          </HandText>
          <SketchBox cx={236} cy={74} w={270} h={92} seed={seedOf('req')} stroke={s.req ? 'var(--accent)' : 'var(--muted)'} fill="var(--surface)" fillStyle="solid" />
          <HandText x={236} y={s.req?.body ? 62 : 74} size={14} mono color="var(--accent)">
            {s.req?.line ?? '(nothing sent yet)'}
          </HandText>
          {s.req?.body && (
            <HandText x={236} y={90} size={14} mono>
              {s.req.body}
            </HandText>
          )}

          <HandText x={236} y={168} size={13} color="var(--muted)">
            response
          </HandText>
          <SketchBox
            cx={236}
            cy={246}
            w={270}
            h={92}
            seed={seedOf('res')}
            stroke={s.res ? (s.res.ok ? 'var(--ok)' : 'var(--bad)') : 'var(--muted)'}
            fill="var(--surface)"
            fillStyle="solid"
          />
          <HandText x={236} y={s.res?.extra ? 234 : 246} size={14} mono color={s.res ? (s.res.ok ? 'var(--ok)' : 'var(--bad)') : 'var(--muted)'}>
            {s.res?.line ?? '(nothing yet)'}
          </HandText>
          {s.res?.extra && (
            <HandText x={236} y={262} size={13} mono>
              {s.res.extra}
            </HandText>
          )}

          <SketchArrow points={[[70, 150], [96, 92]]} seed={seedOf('a1')} stroke="var(--accent)" />
          <SketchArrow points={[[96, 232], [70, 182]]} seed={seedOf('a2')} stroke={s.res && !s.res.ok ? 'var(--bad)' : 'var(--ok)'} />
          <SketchArrow points={[[378, 74], [TX - 112, 96]]} seed={seedOf('a3')} dashed stroke="var(--muted)" />
          <HandText x={411} y={62} size={13} color="var(--muted)">
            changes
          </HandText>

          <SketchBox cx={TX} cy={165} w={218} h={300} seed={seedOf('table')} />
          <HandText x={TX} y={34} size={15} weight={700}>
            tweets table
          </HandText>
          <HandText x={TX - 96} y={62} size={13} anchor="start" color="var(--muted)">
            id
          </HandText>
          <HandText x={TX - 44} y={62} size={13} anchor="start" color="var(--muted)">
            text
          </HandText>
          {s.rows.map((r, k) => (
            <motion.g key={`${i}-${r.id}-${k}`} initial={s.hl === r.id ? { opacity: 0 } : false} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
              {s.hl === r.id && <rect x={TX - 104} y={74 + k * ROW_H} width={208} height={ROW_H - 6} rx={6} fill="var(--accent-soft)" />}
              <HandText x={TX - 96} y={91 + k * ROW_H} size={14} anchor="start" mono>
                {String(r.id)}
              </HandText>
              <HandText x={TX - 44} y={91 + k * ROW_H} size={14} anchor="start">
                {r.text}
              </HandText>
            </motion.g>
          ))}
          {s.gone && (
            <HandText x={TX} y={91 + s.rows.length * ROW_H} size={13} color="var(--bad)">
              {`row ${s.gone} deleted`}
            </HandText>
          )}
        </SketchSvg>
      )}
    </AnimFrame>
  );
}

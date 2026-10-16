import { useState } from 'react';
import CacheWidgetFrame, { Seg } from './CacheWidgetFrame';
import { HandText, SketchArrow, SketchBox, SketchSvg, TEXT_SIZES, seedOf } from '../sketch';
import { SERVERS, TOKENS_PER_TOOL, summarize, usable, type ClientFeature } from './Ai6McpMath';

const ys = [70, 150, 230];
const FEATURES: ClientFeature[] = ['roots', 'sampling', 'elicitation'];

export default function Ai6McpHost() {
  const [on, setOn] = useState<Record<string, boolean>>({ files: true, db: true, issues: false });
  const [caps, setCaps] = useState<Record<ClientFeature, boolean>>({ roots: true, sampling: false, elicitation: true });
  const sum = summarize(on);
  return (
    <CacheWidgetFrame title="One host, several servers" hint="Server contents are illustrative. Toggle a server or a client feature.">
      <div className="mb-3 space-y-2">
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
          <span className="w-28">Connected servers</span>
          {SERVERS.map((s) => (
            <Seg key={s.id} label={`Server ${s.name}`} value={on[s.id] ? 'on' : 'off'} onChange={(v) => setOn({ ...on, [s.id]: v === 'on' })} options={[{ id: 'on', label: `${s.name} on` }, { id: 'off', label: 'off' }]} />
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
          <span className="w-28">Host declares</span>
          {FEATURES.map((f) => (
            <Seg key={f} label={`Client feature ${f}`} value={caps[f] ? 'on' : 'off'} onChange={(v) => setCaps({ ...caps, [f]: v === 'on' })} options={[{ id: 'on', label: `${f} on` }, { id: 'off', label: 'off' }]} />
          ))}
        </div>
      </div>
      <SketchSvg width={720} height={300} label="A host with one client per server">
        <SketchBox cx={70} cy={150} w={110} h={220} r={10} seed={seedOf('mh-host')} stroke="var(--accent)" strokeWidth={2.2} />
        <HandText x={70} y={150} size={TEXT_SIZES.label}>{'Host\n+ model'}</HandText>
        {SERVERS.map((s, k) => {
          const live = on[s.id];
          const c = live ? 'var(--fg)' : 'var(--muted)';
          const ok = usable(s, caps);
          return (
            <g key={s.id}>
              <SketchArrow points={[[128, 150], [182, ys[k]]]} stroke={live ? 'var(--fg)' : 'var(--muted)'} dashed={!live} seed={seedOf(`mh-a${s.id}`)} head="none" />
              <SketchBox cx={240} cy={ys[k]} w={100} h={44} r={8} seed={seedOf(`mh-c${s.id}`)} stroke={c} dashed={!live} />
              <HandText x={240} y={ys[k]} size={TEXT_SIZES.label} color={c}>{`client ${k + 1}`}</HandText>
              <SketchArrow points={[[296, ys[k]], [338, ys[k]]]} stroke={live ? 'var(--fg)' : 'var(--muted)'} dashed={!live} seed={seedOf(`mh-b${s.id}`)} head="both" />
              <HandText x={317} y={ys[k] - 16} size={TEXT_SIZES.note} color="var(--muted)">{s.transport === 'stdio' ? 'stdio' : 'HTTP'}</HandText>
              <SketchBox cx={445} cy={ys[k]} w={200} h={60} r={8} seed={seedOf(`mh-s${s.id}`)} stroke={live ? 'var(--ok)' : 'var(--muted)'} fill={live ? 'var(--ok)' : undefined} dashed={!live} />
              <HandText x={445} y={ys[k] - 11} size={TEXT_SIZES.label} color={c}>{`server: ${s.name}`}</HandText>
              <HandText x={445} y={ys[k] + 11} size={TEXT_SIZES.note} color={live ? 'var(--muted)' : 'var(--muted)'}>
                {[s.tools ? `${s.tools} tools` : '', s.resources ? 'resources' : '', s.prompts ? `${s.prompts} prompts` : ''].filter(Boolean).join(', ')}
              </HandText>
              <HandText x={655} y={ys[k] - 10} size={TEXT_SIZES.note} color="var(--muted)">{`wants ${s.wants}`}</HandText>
              <HandText x={655} y={ys[k] + 10} size={TEXT_SIZES.note} color={!live ? 'var(--muted)' : ok ? 'var(--ok)' : 'var(--bad)'}>{!live ? 'not connected' : ok ? 'negotiated' : 'not declared'}</HandText>
            </g>
          );
        })}
      </SketchSvg>
      <div className="mt-3 grid grid-cols-2 gap-2 text-sm sm:grid-cols-4" aria-live="polite">
        <div className="rounded-lg border border-line bg-surface p-2.5"><div className="text-xs text-muted">Servers</div><div className="text-lg font-semibold tabular-nums">{sum.servers}</div></div>
        <div className="rounded-lg border border-line bg-surface p-2.5"><div className="text-xs text-muted">Tools offered</div><div className="text-lg font-semibold tabular-nums">{sum.tools}</div></div>
        <div className="rounded-lg border border-line bg-surface p-2.5"><div className="text-xs text-muted">Servers with resources</div><div className="text-lg font-semibold tabular-nums">{sum.resourceServers}</div></div>
        <div className="rounded-lg border border-line bg-surface p-2.5"><div className="text-xs text-muted">Prompt templates</div><div className="text-lg font-semibold tabular-nums">{sum.prompts}</div></div>
      </div>
      <p className="mt-3 text-sm text-muted">
        Tool definitions added to each model request: {sum.tools} x {TOKENS_PER_TOOL} (assumed tokens per tool) = {(sum.toolTokens).toLocaleString('en-US')} tokens. A server that wants a client feature the host did not declare must not use it.
      </p>
    </CacheWidgetFrame>
  );
}

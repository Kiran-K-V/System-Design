import { DesignCompare, type CompareVariant } from '../DesignBuild';

/** Turn 181 of a long dialogue, without and with the inter-turn cache. Mechanism text is from the 2024-06-20 post. */

const without: CompareVariant = {
  id: 'without',
  label: 'No inter-turn cache',
  nodes: [
    { id: 'user', x: 70, y: 150, w: 100, h: 56, label: 'User' },
    { id: 'route', x: 240, y: 150, w: 120, h: 56, label: 'Any server' },
    { id: 'gpu', x: 470, y: 150, w: 150, h: 70, label: 'GPU memory', sub: 'prefill all' },
  ],
  edges: [
    { from: 'user', to: 'route', head: 'both' },
    { from: 'route', to: 'gpu' },
  ],
  steps: [
    { caption: 'The user sends message 181. The prompt holds all 180 earlier messages plus the new one. The post says the average message has a dialogue history of 180 messages.', packets: [{ from: 'user', to: 'route', label: 'turn' }], active: ['route'] },
    { caption: 'Any server may take it. The GPU has no saved work for this dialogue, so prefill reads every message again. Prefill is the first pass over the prompt (the Prefill vs Decode: TTFT and TPOT lesson).', packets: [{ from: 'route', to: 'gpu', label: '181 msgs' }], active: ['gpu'], tones: { gpu: 'bad' } },
    { caption: 'The reply streams back and the work for the 180 old messages is thrown away. Turn 182 pays the same price again. The post calls refilling the cache on every turn "prohibitively expensive".', tones: { gpu: 'bad' }, notes: [{ x: 470, y: 225, text: 'repeated every turn', anchor: 'middle', tone: 'bad' }] },
  ],
};

const withCache: CompareVariant = {
  id: 'with',
  label: 'Inter-turn cache',
  nodes: [
    { id: 'user', x: 70, y: 180, w: 90, h: 56, label: 'User' },
    { id: 'route', x: 215, y: 180, w: 110, h: 56, label: 'Sticky route' },
    { id: 'host', x: 470, y: 110, w: 190, h: 70, shape: 'db', label: 'Host memory', sub: 'KV in LRU tree' },
    { id: 'gpu', x: 470, y: 255, w: 190, h: 70, label: 'GPU memory', sub: 'prefill new only' },
  ],
  edges: [
    { from: 'user', to: 'route', head: 'both' },
    { from: 'route', to: 'host' },
    { from: 'host', to: 'gpu' },
  ],
  groups: [{ x: 345, y: 15, w: 250, h: 345, label: 'Home server' }],
  steps: [
    { caption: 'Sticky sessions send every turn of this dialogue to the same server. The post says each server can cache "thousands of dialogues" because its KV cache is small.', packets: [{ from: 'user', to: 'route', label: 'turn' }, { from: 'route', to: 'host', label: 'turn', delay: 0.7 }], active: ['route'] },
    { caption: 'The server hashes each prefix of the prompt, one by one. A rolling hash lets it extend the hash by one token at a time. It looks each hash up in the tree and keeps the longest match, so even a half-matched message reuses its start.', active: ['host'], tones: { host: 'ok' } },
    { caption: 'The matched KV is copied from host memory into GPU memory. The GPU prefills only what did not match, here the new message. The post reports a "95% cache rate", with no definition.', packets: [{ from: 'host', to: 'gpu', label: 'KV copy' }], active: ['gpu'], tones: { host: 'ok', gpu: 'ok' } },
    { caption: 'The reply is generated. Its KV, and the KV of every prefix just filled, goes back to host memory for turn 182. If the cache is full, the least recently used dialogue is dropped first.', packets: [{ from: 'gpu', to: 'host', label: 'save KV' }], active: ['host'], tones: { host: 'ok', gpu: 'ok' } },
  ],
};

export default function Ai14CharacterLookup() {
  return <DesignCompare title="Turn 181 of a long dialogue" prompt="Design:" variants={[without, withCache]} height={375} label="Flow of one chat turn without and with the inter-turn KV cache on a sticky home server" />;
}

// Save the episode list of every series in src/lib/videos.ts to src/data/playlists.json,
// so series pages build without a network call. Reads the public playlist page once per series.
// YouTube serves the first 100 episodes in the page; the series page links to YouTube for the rest.
// Usage: node scripts/sync-playlists.mjs
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';

const src = readFileSync(new URL('../src/lib/videos.ts', import.meta.url), 'utf8');
const ids = [...src.matchAll(/yt: '([^']+)',\s*kind: 'series'/g)].map((m) => m[1]);

const out = {};
for (const id of ids) {
  const html = await (await fetch(`https://www.youtube.com/playlist?list=${id}`, { headers: { 'Accept-Language': 'en-US' } })).text();
  const m = html.match(/var ytInitialData = (\{.*?\});<\/script>/s);
  if (!m) throw new Error(`${id}: no playlist data in page`);
  const items = [];
  JSON.stringify(JSON.parse(m[1]), (k, v) => {
    if (k === 'lockupViewModel' && v.contentType === 'LOCKUP_CONTENT_TYPE_VIDEO') {
      const badge = JSON.stringify(v.contentImage).match(/"thumbnailBadgeViewModel":\{"text":"([^"]+)"/)?.[1];
      items.push({ v: v.contentId, t: v.metadata?.lockupMetadataViewModel?.title?.content ?? '', d: badge && /^\d+(:\d+)+$/.test(badge) ? badge : '' });
    }
    return v;
  });
  const total = Number(html.match(/"(?:text|content)":"([\d,]+) videos?"/)?.[1]?.replace(/,/g, '') ?? items.length);
  if (!items.length) throw new Error(`${id}: 0 episodes parsed`);
  out[id] = { total: Math.max(total, items.length), items };
  console.log(`${id}  ${items.length}/${out[id].total}  ${items[0].t}`);
}

mkdirSync(new URL('../src/data/', import.meta.url), { recursive: true });
writeFileSync(new URL('../src/data/playlists.json', import.meta.url), JSON.stringify(out, null, 1) + '\n');

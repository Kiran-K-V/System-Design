// Save YouTube data for every video in src/lib/videos.ts, so pages build without a network call.
//  - src/data/playlists.json: the episode list of each series, from the public playlist page.
//    YouTube serves the first 100 episodes in the page; the series page links to YouTube for the rest.
//  - src/data/stats.json: views, likes and publish date of each talk, or of episode 1 of each series,
//    from the public watch page. Shown on cards as the global audience signal.
// Usage: node scripts/sync-videos.mjs
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';

const src = readFileSync(new URL('../src/lib/videos.ts', import.meta.url), 'utf8');
const all = [...src.matchAll(/yt: '([^']+)',\s*kind: '(series|talk)'/g)].map((m) => ({ yt: m[1], kind: m[2] }));
const page = async (url) => (await fetch(url, { headers: { 'Accept-Language': 'en-US' } })).text();

const playlists = {};
for (const { yt: id } of all.filter((x) => x.kind === 'series')) {
  const html = await page(`https://www.youtube.com/playlist?list=${id}`);
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
  playlists[id] = { total: Math.max(total, items.length), items };
  console.log(`${id}  ${items.length}/${playlists[id].total}  ${items[0].t}`);
}

const stats = { checked: new Date().toISOString().slice(0, 10), videos: {} };
for (const { yt, kind } of all) {
  const video = kind === 'series' ? playlists[yt].items[0].v : yt;
  const html = await page(`https://www.youtube.com/watch?v=${video}`);
  const views = Number(html.match(/"viewCount":"(\d+)"/)?.[1]);
  const likes = Number(html.match(/"likeCount":"?(\d+)/)?.[1]);
  const year = Number(html.match(/"publishDate":"(\d{4})/)?.[1]);
  if (!views) throw new Error(`${yt}: no view count on watch page of ${video}`);
  stats.videos[yt] = { video, views, likes: likes || 0, year };
  console.log(`${yt}  ${views} views  ${likes} likes  ${year}`);
}

mkdirSync(new URL('../src/data/', import.meta.url), { recursive: true });
writeFileSync(new URL('../src/data/playlists.json', import.meta.url), JSON.stringify(playlists, null, 1) + '\n');
writeFileSync(new URL('../src/data/stats.json', import.meta.url), JSON.stringify(stats, null, 1) + '\n');

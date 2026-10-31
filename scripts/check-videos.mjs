// Check every video in src/lib/videos.ts against YouTube oEmbed.
// oEmbed fails for private, deleted and embed-disabled videos, so a pass means the card will play.
// Usage: node scripts/check-videos.mjs
import { readFileSync } from 'node:fs';

const src = readFileSync(new URL('../src/lib/videos.ts', import.meta.url), 'utf8');
const items = [...src.matchAll(/yt: '([^']+)',\s*kind: '(series|talk)'[\s\S]*?creator: '([^']+)'[\s\S]*?thumb: '([^']+)'/g)].map(
  ([, yt, kind, creator, thumb]) => ({ yt, kind, creator, thumb }),
);

const oembed = async (url) => {
  const r = await fetch(`https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(url)}`);
  return r.ok ? r.json() : null;
};

let bad = 0;
for (const v of items) {
  const url = v.kind === 'series' ? `https://www.youtube.com/playlist?list=${v.yt}` : `https://www.youtube.com/watch?v=${v.yt}`;
  const [main, thumb] = await Promise.all([oembed(url), oembed(`https://www.youtube.com/watch?v=${v.thumb}`)]);
  const ok = main && thumb;
  if (!ok) bad++;
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${v.yt}  ${main ? `${main.author_name} · ${main.title}` : '(not embeddable or gone)'}${thumb ? '' : `  thumb ${v.thumb} missing`}`);
}
console.log(`\n${items.length - bad}/${items.length} ok`);
process.exit(bad ? 1 : 0);

import { DesignCompare, type CompareVariant } from '../DesignBuild';

const pull: CompareVariant = {
  id: 'pull',
  label: 'Fan-out on read',
  nodes: [
    { id: 'reader', x: 80, y: 170, w: 100, h: 56, label: 'Reader' },
    { id: 'api', x: 300, y: 170, w: 130, h: 56, label: 'Feed service' },
    { id: 'posts', x: 560, y: 170, w: 150, h: 80, label: '500 authors', sub: 'recent posts', shape: 'db' },
  ],
  edges: [
    { from: 'reader', to: 'api' },
    { from: 'api', to: 'posts', label: 'x 500', labelAt: [0, -18] },
  ],
  steps: [
    { caption: 'Posting is cheap: one row. All the work waits until someone opens the app.', active: ['posts'] },
    { caption: 'A reader who follows 500 accounts opens the feed. The service must read recent posts of all 500 authors.', packets: [{ from: 'reader', to: 'api' }, { from: 'api', to: 'posts', delay: 0.7 }], tones: { api: 'warn' } },
    { caption: 'It merges 500 lists by time and cuts the top page. At 11,600 opens a second (assumed), that is 5.8 million lookups a second. Reads are slow and costly.', packets: [{ from: 'api', to: 'reader' }], tones: { api: 'bad', posts: 'bad' } },
  ],
};

const push: CompareVariant = {
  id: 'push',
  label: 'Fan-out on write',
  nodes: [
    { id: 'author', x: 80, y: 170, w: 110, h: 56, label: 'Author' },
    { id: 'workers', x: 290, y: 170, w: 130, h: 56, label: 'Fan-out workers' },
    { id: 'feeds', x: 550, y: 170, w: 160, h: 80, label: 'Follower feeds', sub: 'one list each', shape: 'db' },
  ],
  edges: [
    { from: 'author', to: 'workers' },
    { from: 'workers', to: 'feeds', label: 'x followers', labelAt: [0, -18] },
  ],
  steps: [
    { caption: 'Reading is cheap: one lookup of a ready-made list. All the work moves to posting time.', active: ['feeds'] },
    { caption: 'A normal author with 200 followers posts. Workers add the post id to 200 feeds. That is 200 small writes, done in the background.', packets: [{ from: 'author', to: 'workers' }, { from: 'workers', to: 'feeds', delay: 0.7 }], tones: { feeds: 'ok' } },
    { caption: 'A celebrity with 20 million followers posts. One post becomes 20 million writes. At 200,000 writes a second (assumed), the last follower waits 100 seconds, and the queue backs up behind it.', packets: [{ from: 'author', to: 'workers' }, { from: 'workers', to: 'feeds', tone: 'bad', delay: 0.7 }], tones: { workers: 'bad', feeds: 'bad' } },
  ],
};

const hybrid: CompareVariant = {
  id: 'hybrid',
  label: 'Hybrid',
  nodes: [
    { id: 'reader', x: 80, y: 170, w: 100, h: 56, label: 'Reader' },
    { id: 'api', x: 300, y: 170, w: 130, h: 56, label: 'Feed service' },
    { id: 'feed', x: 560, y: 80, w: 150, h: 70, label: 'Pushed feed', shape: 'db' },
    { id: 'stars', x: 560, y: 270, w: 150, h: 70, label: 'Celebrity posts', shape: 'db' },
  ],
  edges: [
    { from: 'reader', to: 'api' },
    { from: 'api', to: 'feed' },
    { from: 'api', to: 'stars' },
  ],
  steps: [
    { caption: 'Pick a follower threshold, such as 100,000. Authors under it are pushed to follower feeds. Authors over it are not pushed.', active: ['feed', 'stars'] },
    { caption: 'A reader opens the feed. The service reads the ready-made list: one lookup for all the ordinary authors.', packets: [{ from: 'reader', to: 'api' }, { from: 'api', to: 'feed', delay: 0.7 }], tones: { feed: 'ok' } },
    { caption: 'The service also reads recent posts of the few celebrities this reader follows. A typical reader follows only a handful, so this is a handful of lookups, not 500.', packets: [{ from: 'api', to: 'stars' }], tones: { stars: 'ok' } },
    { caption: 'It merges both lists by time and returns the page. Writes stay small. Reads stay small. The cost is one extra merge step and one more rule to keep right.', packets: [{ from: 'api', to: 'reader' }], tones: { api: 'ok' } },
  ],
};

export default function NewsFeedFanout() {
  return (
    <DesignCompare
      title="Building a feed"
      prompt="Fan-out:"
      variants={[pull, push, hybrid]}
      height={350}
      label="Three ways to build a home feed. Fan-out on read does heavy reads. Fan-out on write does heavy writes and breaks on celebrities. The hybrid pushes ordinary authors and pulls celebrities."
    />
  );
}

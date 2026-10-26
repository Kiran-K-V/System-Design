// Hands-on labs. Lab content lives next to the lab code in labs/<id>-<slug>/lab.json,
// so the site and the `./lab hint` CLI read the same text.

export interface Lab {
  id: string;
  slug: string;
  title: string;
  /** Lesson id this lab practises, e.g. "05-caching/invalidation-stampede". */
  lesson: string;
  minutes: number;
  goal: string;
  stack: string[];
  predict: { question: string; options: string[]; answer: number; explain: string };
  steps: { title: string; cmd: string; text: string }[];
  rules: string[];
  hints: string[];
  reflect: string[];
  /** Folder under labs/, e.g. "L04-cache-stampede". */
  dir: string;
}

const files = import.meta.glob<{ default: Omit<Lab, 'dir'> }>('../../labs/*/lab.json', { eager: true });

export const labs: Lab[] = Object.entries(files)
  .map(([path, mod]) => ({ ...mod.default, dir: path.split('/').at(-2)! }))
  .sort((a, b) => a.id.localeCompare(b.id));

export const labForLesson = (lessonId: string) => labs.find((l) => l.lesson === lessonId);

const BASE = import.meta.env.BASE_URL.replace(/\/$/, '');
export const labHref = (lab: Pick<Lab, 'slug'>) => `${BASE}/labs/${lab.slug}/`;

export const REPO = 'Kiran-K-V/System-Design';
export const codespaceUrl = `https://codespaces.new/${REPO}?devcontainer_path=.devcontainer/labs/devcontainer.json`;

// Progress. Client only: call from effects or handlers.

export interface LabProgress {
  predicted?: number;
  hints?: number;
  reflect?: Record<number, string>;
  done?: number; // epoch ms
}
type Store = Record<string, LabProgress>;
const KEY = 'sd-labs';

export function loadLabs(): Store {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '{}') as Store;
  } catch {
    return {};
  }
}

export function saveLab(id: string, patch: Partial<LabProgress>) {
  const all = loadLabs();
  all[id] = { ...all[id], ...patch };
  try {
    localStorage.setItem(KEY, JSON.stringify(all));
  } catch {}
  dispatchEvent(new Event('sd-labs'));
}

// Completion codes: UPT-<lab>-<4 char nonce><6 char MAC>, made by labs/shared/labkit.py.
// The key is public, so this is an honor system: it marks progress, it is not a credential.
const CODE_KEY = 'uptime-labs-honor-v1';
const B32 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

function base32(bytes: Uint8Array) {
  let bits = 0;
  let value = 0;
  let out = '';
  for (const b of bytes) {
    value = (value << 8) | b;
    bits += 8;
    while (bits >= 5) {
      out += B32[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  return out;
}

export async function verifyCode(labId: string, input: string): Promise<boolean> {
  const m = input.trim().toUpperCase().match(/^UPT-([A-Z0-9]+)-([A-Z2-7]{4})([A-Z2-7]{6})$/);
  if (!m || m[1] !== labId) return false;
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey('raw', enc.encode(CODE_KEY), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const mac = new Uint8Array(await crypto.subtle.sign('HMAC', key, enc.encode(`${labId}:${m[2]}`)));
  return base32(mac).slice(0, 6) === m[3];
}

// Flags terms a beginner meets before the lesson explains them.
// Heuristic, not a parser: it looks for acronyms and research-benchmark names whose first use in a lesson
// has no explanation nearby. Run: node scripts/check-jargon.mjs [--strict] [--all] [path...]
// With no path it scans src/content/lessons/ai. --strict exits 1 when anything is flagged.
import fs from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
const strict = args.includes('--strict');
const showAll = args.includes('--all');
const roots = args.filter((a) => !a.startsWith('--'));
if (!roots.length) roots.push('src/content/lessons/ai');

// Terms a reader who has shipped a web service already knows, plus labels that are not jargon.
const KNOWN = new Set(
  `API APIs URL URLs HTTP HTTPS JSON SQL HTML CSS JS TS OK ID IDs UI UX CLI SDK REST CRUD DNS TCP UDP IP TLS SSL SSH GB MB KB TB PB MS TTL OS IO PR PRs CI CD AWS GCP PDF CSV XML YAML UUID ASCII UTF
   AI JOIN DISTINCT LIMIT COUNT WHERE GROUP ORDER BY AM PM README TODO NOTE SYSTEM USD US UK EU FAQ NOT AND OR GET POST PUT PATCH DELETE HEAD OPTIONS SELECT INSERT UPDATE
   NVIDIA AMD IBM OPENAI GOOGLE META`.split(/\s+/),
);
// Names that belong in "Further reading", not in lesson text, unless the lesson explains them.
const TRIVIA = /^(BLEU|WMT\d*|MMLU|MTEB|GSM8K|HUMANEVAL|SWE|HELLASWAG|ROUGE|GLUE|SQUAD|TRUTHFULQA|BEIR|MS|MARCO|LMSYS|ARENA)$/;

const files = [];
const walk = (p) => {
  if (fs.statSync(p).isDirectory()) for (const e of fs.readdirSync(p)) walk(path.join(p, e));
  else if (p.endsWith('.mdx')) files.push(p);
};
roots.forEach(walk);

const report = {};
for (const f of files) {
  const lines = fs.readFileSync(f, 'utf8').split('\n');
  let fence = false;
  let fm = 0;
  const seen = new Set();
  const bad = [];
  for (const l of lines) {
    if (l === '---' && fm < 2) { fm++; continue; }
    if (fm < 2) continue;
    if (l.startsWith('```')) { fence = !fence; continue; }
    if (fence || /^\s*import /.test(l)) continue;
    const text = l.replace(/`[^`]*`/g, ' ').replace(/\]\([^)]*\)/g, ']').replace(/https?:\S+/g, ' ');
    for (const m of text.matchAll(/(?<![A-Za-z0-9/_.-])([A-Z][A-Z0-9]{1,7})(?![A-Za-z0-9_-])/g)) {
      const a = m[1];
      if (seen.has(a)) continue;
      if (/^(FR|NFR|LLM|ASI|LAB|Q)\d+$/.test(a) || /^[AE]\d+$/.test(a)) continue; // labels, OWASP codes
      if (KNOWN.has(a) && !TRIVIA.test(a)) continue;
      seen.add(a);
      const ctx = text.slice(Math.max(0, m.index - 90), m.index + a.length + 90);
      const explained = new RegExp(`\\(${a}\\)|${a} \\(|\\*\\*${a}\\*\\*|stands for|short for|called ${a}|${a},? (is|are|means) |known as ${a}|named ${a}`).test(ctx);
      if (!explained) bad.push(a);
    }
  }
  if (bad.length) report[f] = bad;
}

const rows = Object.entries(report).sort((a, b) => b[1].length - a[1].length);
const total = rows.reduce((n, [, b]) => n + b.length, 0);
console.log(`${files.length} lessons scanned, ${rows.length} with unexplained terms, ${total} terms in all`);
for (const [f, b] of showAll ? rows : rows.slice(0, 15)) console.log(`${String(b.length).padStart(3)}  ${f.replace('src/content/lessons/', '')}: ${b.slice(0, 10).join(' ')}${b.length > 10 ? ' ...' : ''}`);
if (strict && rows.length) process.exit(1);

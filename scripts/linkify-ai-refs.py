"""Turn plain-text 'lesson A6.10' mentions into links when that lesson file exists.

Only touches prose lines. Skips frontmatter, import lines, JSX component blocks
(Quiz, Diagnose, Ballpark and any other <Component ... /> spanning lines), code fences,
and mentions already inside a markdown link. Usage: python3 linkify.py <repo> [--write]
"""
import os, re, sys

repo = sys.argv[1]
write = '--write' in sys.argv
syl = open(os.path.join(repo, 'src/lib/ai-syllabus.ts')).read()

# Build number -> id from module order (core modules A0..A14 only; electives use labels).
num_to_id = {}
mods = re.findall(r"slug: '(ai/[^']+)',\s*(?:label: '([^']+)',\s*)?title: '[^']*',\s*(?:label: '([^']+)',\s*)?lessons: \[(.*?)\]", syl, re.S)
core = 0
for slug, label_before, label_after, body in mods:
    label = label_before or label_after
    prefix = label or f'A{core}'
    if not label:
        core += 1
    for j, ls in enumerate(re.findall(r"slug: '([^']+)'", body), 1):
        num_to_id[f'{prefix}.{j}'] = f'{slug}/{ls}'

def exists(lid):
    return os.path.exists(os.path.join(repo, 'src/content/lessons', lid + '.mdx'))

pat = re.compile(r'(?<![\[/\w])(lesson|Lesson|lessons|Lessons) (A\d+\.\d+|E\d+\.\d+)\b(?!\]|\()')
changes = 0
root = os.path.join(repo, 'src/content/lessons/ai')
for dp, _, fs in os.walk(root):
    for f in fs:
        if not f.endswith('.mdx'):
            continue
        p = os.path.join(dp, f)
        self_id = os.path.relpath(p, os.path.join(repo, 'src/content/lessons'))[:-4]
        lines = open(p).read().split('\n')
        out, in_fm, in_code, in_jsx = [], False, False, False
        for i, line in enumerate(lines):
            s = line.strip()
            if i == 0 and s == '---':
                in_fm = True; out.append(line); continue
            if in_fm:
                if s == '---':
                    in_fm = False
                out.append(line); continue
            if s.startswith('```'):
                in_code = not in_code; out.append(line); continue
            if in_code or s.startswith('import '):
                out.append(line); continue
            if in_jsx:
                if s.endswith('/>') or re.match(r'^</[A-Z]', s):
                    in_jsx = False
                out.append(line); continue
            if re.match(r'^<[A-Z]\w*', s) and not s.endswith('/>') and not s.endswith('>'):
                in_jsx = True; out.append(line); continue
            if s.startswith('<') or '={' in line:
                out.append(line); continue

            def rep(m):
                global changes
                lid = num_to_id.get(m.group(2))
                if not lid or lid == self_id or not exists(lid):
                    return m.group(0)
                changes += 1
                url = '/learn/' + lid.replace('ai/', 'ai/', 1) + '/'
                print(f'{self_id}:{i+1}: {m.group(0)} -> {lid}')
                return f'{m.group(1)} [{m.group(2)}]({url})'
            out.append(pat.sub(rep, line))
        if write:
            open(p, 'w').write('\n'.join(out))
print('changes', changes, '(written)' if write else '(dry run)')

"""List Diagnose steps whose correct option stands out by length. Read-only.

Usage: python3 scripts/diagnose-audit.py
"""
import glob
import re
import statistics
from collections import Counter

STRING = re.compile(r"'((?:[^'\\]|\\.)*)'|\"((?:[^\"\\]|\\.)*)\"")
OPTIONS = re.compile(r"options:\s*\[(.*?)\],\s*answer:\s*(\d+)", re.S)


def bracket_end(src, start):
    depth, quote, esc = 0, None, False
    for i in range(start, len(src)):
        c = src[i]
        if quote:
            if esc:
                esc = False
            elif c == '\\':
                esc = True
            elif c == quote:
                quote = None
        elif c in "'\"`":
            quote = c
        elif c == '[':
            depth += 1
        elif c == ']':
            depth -= 1
            if depth == 0:
                return i + 1
    raise ValueError('unclosed steps array')


def diagnose_steps(src):
    for m in re.finditer(r'<Diagnose\b', src):
        sm = re.search(r'steps=\{\s*\[', src[m.start():])
        start = m.start() + sm.end() - 1
        yield src[start:bracket_end(src, start)]


def main():
    rows = []
    for path in sorted(glob.glob('src/content/lessons/**/*.mdx', recursive=True)):
        src = open(path, encoding='utf-8').read()
        for block in diagnose_steps(src):
            for om in OPTIONS.finditer(block):
                opts = [a or b for a, b in STRING.findall(om.group(1))]
                ans = int(om.group(2))
                lens = [len(o) for o in opts]
                others = [l for i, l in enumerate(lens) if i != ans]
                flag = lens[ans] == max(lens) and lens[ans] > max(others)
                rows.append((path.split('/')[-1], ans, flag))
    flagged = sum(r[2] for r in rows)
    print(f'diagnose steps: {len(rows)}')
    print(f'answer is the single longest: {flagged} ({100 * flagged / len(rows):.0f}%)')
    print('answer position counts:', {k: Counter(r[1] for r in rows).get(k, 0) for k in range(4)})


if __name__ == '__main__':
    main()

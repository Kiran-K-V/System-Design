"""Report quiz answers that give themselves away.

Usage: python3 scripts/quiz-audit.py [--strict]

Checks every Quiz question in src/content/lessons/**/*.mdx:
- the correct option is the single longest option (a test-taker can guess it), and
- the correct option index is skewed (answers should spread across positions).

--strict exits 1 when any question is flagged, so it can gate a build later.
"""
import glob
import re
import statistics
import sys
from collections import Counter

LESSONS = 'src/content/lessons/**/*.mdx'
QUESTION_START = re.compile(r"\{\s*(?:id:\s*'[^']*',\s*)?q:\s*'((?:[^'\\]|\\.)*)'")
OPTIONS = re.compile(r"options:\s*\[(.*?)\],\s*answer:\s*(\d+)", re.S)
STRING = re.compile(r"'((?:[^'\\]|\\.)*)'|\"((?:[^\"\\]|\\.)*)\"")


def quiz_bodies(src):
    """Yield the text of each questions={[...]} literal."""
    for m in re.finditer(r'questions=\{\s*\[', src):
        start = m.end() - 1
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
                    yield src[start:i + 1]
                    break


def questions(path):
    for body in quiz_bodies(open(path, encoding='utf-8').read()):
        starts = list(QUESTION_START.finditer(body))
        for k, qm in enumerate(starts):
            end = starts[k + 1].start() if k + 1 < len(starts) else len(body)
            seg = body[qm.start():end]
            om = OPTIONS.search(seg)
            if not om:
                continue
            opts = [a or b for a, b in STRING.findall(om.group(1))]
            yield qm.group(1), opts, int(om.group(2))


def main():
    rows = []
    for path in sorted(glob.glob(LESSONS, recursive=True)):
        lesson = path.split('/')[-2] + '/' + path.split('/')[-1][:-4]
        for text, opts, ans in questions(path):
            lens = [len(o) for o in opts]
            others = [l for i, l in enumerate(lens) if i != ans]
            flags = []
            if lens[ans] == max(lens) and lens[ans] > max(others):
                flags.append('longest')
            if lens[ans] > statistics.mean(others) * 1.5:
                flags.append('much-longer')
            rows.append((lesson, text, ans, flags))

    total = len(rows)
    flagged = [r for r in rows if r[3]]
    print(f'questions: {total}')
    print(f'flagged (correct option stands out by length): {len(flagged)} ({100 * len(flagged) / total:.0f}%)')
    pos = Counter(r[2] for r in rows)
    print('correct-option position counts:', {k: pos.get(k, 0) for k in range(4)})
    print('\nflagged questions:')
    for lesson, text, ans, flags in flagged:
        print(f'  {lesson} [{",".join(flags)}] {text[:72]}')
    if '--strict' in sys.argv and flagged:
        sys.exit(1)


if __name__ == '__main__':
    main()

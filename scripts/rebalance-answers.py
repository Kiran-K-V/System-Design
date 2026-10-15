"""Spread correct-answer positions evenly across quiz and Diagnose options.

Usage: python3 scripts/rebalance-answers.py [--apply]

Dry run by default. Moves the correct option to a round-robin position and
keeps the other options in their original order. Skips any question whose
options refer to other options (above, below, both, none of, all of, previous),
because moving them would change the meaning.
Only the option order and the `answer` index change. Option text is untouched,
so explanations stay correct unless they name a position (check those by hand).
"""
import glob
import re
import sys

OPTIONS = re.compile(r"options:\s*\[(.*?)\],(\s*)answer:\s*(\d+)", re.S)
STRING = re.compile(r"'((?:[^'\\]|\\.)*)'|\"((?:[^\"\\]|\\.)*)\"")
BLOCKED = re.compile(r"\b(above|below|both|none of|all of|previous)\b", re.I)


def main():
    apply = '--apply' in sys.argv
    counter, changed, skipped = 0, 0, 0
    for path in sorted(glob.glob('src/content/lessons/**/*.mdx', recursive=True)):
        src = open(path, encoding='utf-8').read()
        edits = []
        for m in OPTIONS.finditer(src):
            group = m.group(1)
            tokens = list(STRING.finditer(group))
            opts = [t.group(1) if t.group(1) is not None else t.group(2) for t in tokens]
            ans = int(m.group(3))
            if len(opts) < 2 or ans >= len(opts):
                skipped += 1
                continue
            if any(BLOCKED.search(o) for o in opts):
                skipped += 1
                continue
            target = counter % len(opts)
            counter += 1
            if target == ans:
                continue
            # Rebuild the option list: same separators, options reordered.
            order = [i for i in range(len(opts)) if i != ans]
            order.insert(target, ans)
            raws = [t.group(0) for t in tokens]
            pieces = []
            for k, idx in enumerate(order):
                pieces.append(raws[idx])
                if k < len(order) - 1:
                    pieces.append(group[tokens[k].end():tokens[k + 1].start()])
            new_group = group[:tokens[0].start()] + ''.join(pieces) + group[tokens[-1].end():]
            new = f"options: [{new_group}],{m.group(2)}answer: {target}"
            edits.append((m.start(), m.end(), new))
            changed += 1
        if apply and edits:
            for start, end, new in reversed(edits):
                src = src[:start] + new + src[end:]
            open(path, 'w', encoding='utf-8').write(src)
    mode = 'applied' if apply else 'dry run'
    print(f'{mode}: {changed} questions reordered, {skipped} skipped (refer to other options)')


if __name__ == '__main__':
    main()

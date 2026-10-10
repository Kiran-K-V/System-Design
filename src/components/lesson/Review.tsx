import { useEffect, useMemo, useState } from 'react';
import QuestionCard from './QuestionCard';
import { loadCalibration, loadCards, loadDone, loadExplain, sureAccuracy, type Card } from '../../lib/mastery';
import type { Question } from '../../lib/questionId';

interface Row extends Question {
  id: string;
  lesson: string;
  lessonTitle: string;
  number: string;
}

const SESSION = 5;
const base = import.meta.env.BASE_URL.replace(/\/$/, '');

export default function Review() {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [queue, setQueue] = useState<Row[]>([]);
  const [stats, setStats] = useState<{ boxes: number[]; sure: number | null; sureTotal: number; due: number }>();
  const [explain, setExplain] = useState<Record<string, { text: string }>>({});
  const [round, setRound] = useState(0);
  const [points, setPoints] = useState(0);
  const [done, setDone] = useState(0);

  useEffect(() => {
    fetch(`${base}/questions.json`)
      .then((r) => r.json())
      .then(setRows)
      .catch(() => setRows([]));
  }, []);

  useEffect(() => {
    if (!rows) return;
    const cards = loadCards();
    const doneLessons = new Set(loadDone());
    const now = Date.now();
    const isDue = (r: Row) => {
      const c: Card | undefined = cards[r.id];
      return c ? c.due <= now : doneLessons.has(r.lesson);
    };
    const due = rows.filter(isDue).sort((a, b) => (cards[a.id]?.due ?? 0) - (cards[b.id]?.due ?? 0));
    const cal = loadCalibration();
    const boxes = [0, 0, 0, 0, 0];
    for (const c of Object.values(cards)) boxes[c.box - 1]++;
    setStats({ boxes, sure: sureAccuracy(cal), sureTotal: cal.sure[1], due: due.length });
    setQueue(due.slice(0, SESSION));
    setExplain(loadExplain());
  }, [rows, round]);

  const byId = useMemo(() => new Map((rows ?? []).map((r) => [r.id, r])), [rows]);

  if (!rows || !stats) return <p className="text-muted">Loading…</p>;

  const finished = queue.length > 0 && done === queue.length;
  const reasons = Object.entries(explain);

  return (
    <div className="not-prose space-y-8">
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Due now" value={String(stats.due)} />
        <Stat label="In box 4–5" value={String(stats.boxes[3] + stats.boxes[4])} />
        <Stat label="Questions seen" value={String(stats.boxes.reduce((a, b) => a + b, 0))} />
        <Stat
          label="When you say Sure"
          value={stats.sure === null ? `${stats.sureTotal}/5 to unlock` : `${Math.round(stats.sure * 100)}% right`}
        />
      </section>

      <section>
        <h2 className="text-lg font-semibold">Today's review</h2>
        {queue.length === 0 ? (
          <p className="mt-2 text-muted">
            Nothing due. Finish a lesson and answer its check questions. They come back here after a day, then after longer gaps.
          </p>
        ) : (
          <div className="mt-3 space-y-5">
            {queue.map((r, i) => (
              <div key={`${round}-${r.id}`}>
                <p className="mb-1 font-mono text-[12px] text-muted">
                  From <a className="hover:text-fg" href={`${base}/learn/${r.lesson}/`}>{r.number} {r.lessonTitle}</a>
                </p>
                <QuestionCard
                  question={r}
                  index={i}
                  attempt={round}
                  onResult={(p) => {
                    setPoints((n) => n + p);
                    setDone((n) => n + 1);
                  }}
                />
              </div>
            ))}
            {finished && (
              <div className="flex items-center justify-between rounded-lg bg-surface px-4 py-3 text-sm">
                <span>
                  Session done: <strong>{points}</strong> points.
                </span>
                {stats.due > queue.length && (
                  <button
                    type="button"
                    className="text-accent hover:underline"
                    onClick={() => {
                      setDone(0);
                      setPoints(0);
                      setRound((n) => n + 1);
                    }}
                  >
                    {stats.due - queue.length} more due. Keep going
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </section>

      {reasons.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold">Wrong ideas you wrote down</h2>
          <p className="mt-1 text-sm text-muted">Each time, you were sure and wrong. Read them again before you design something.</p>
          <ul className="mt-3 space-y-3 text-sm">
            {reasons.map(([id, e]) => (
              <li key={id} className="rounded-lg border border-line p-3">
                <p className="text-muted">{byId.get(id)?.q ?? id}</p>
                <p className="mt-1">“{e.text}”</p>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-line px-3 py-2">
      <div className="text-lg font-semibold tabular-nums">{value}</div>
      <div className="text-xs text-muted">{label}</div>
    </div>
  );
}

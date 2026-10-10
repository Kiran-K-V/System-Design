import { useRef, useState } from 'react';
import QuestionCard from './QuestionCard';
import { POINTS } from '../../lib/mastery';
import type { Question } from '../../lib/questionId';

export type { Question };

export default function Quiz({ questions }: { questions: Question[] }) {
  const [attempt, setAttempt] = useState(0);
  const [results, setResults] = useState<Record<number, { points: number; correct: boolean }>>({});
  const answered = Object.keys(results).length;
  const points = Object.values(results).reduce((n, r) => n + r.points, 0);
  const correct = Object.values(results).filter((r) => r.correct).length;
  const max = questions.length * POINTS.sure[0];
  const top = useRef<HTMLDivElement>(null);

  return (
    <div ref={top} className="not-prose my-6 space-y-5">
      {questions.map((question, qi) => (
        <QuestionCard
          key={`${attempt}-${qi}`}
          question={question}
          index={qi}
          attempt={attempt}
          onResult={(p, ok) => setResults((r) => ({ ...r, [qi]: { points: p, correct: ok } }))}
        />
      ))}
      {answered === questions.length && (
        <div className="flex items-center justify-between rounded-lg bg-surface px-4 py-3 text-sm">
          <span>
            <strong>{correct}</strong> / {questions.length} right · <strong>{points}</strong> of {max} points
          </span>
          <span className="flex items-center gap-4">
            <a className="text-accent hover:underline" href={`${import.meta.env.BASE_URL.replace(/\/$/, '')}/review/`}>
              Review
            </a>
            <button
              type="button"
              className="text-accent hover:underline"
              onClick={() => {
                setResults({});
                setAttempt((a) => a + 1);
                top.current?.scrollIntoView({ block: 'start' });
              }}
            >
              Try again
            </button>
          </span>
        </div>
      )}
    </div>
  );
}

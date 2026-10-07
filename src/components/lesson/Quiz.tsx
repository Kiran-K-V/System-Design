import { useState } from 'react';

export interface Question {
  q: string;
  options: string[];
  answer: number;
  explain: string;
}

export default function Quiz({ questions }: { questions: Question[] }) {
  const [picked, setPicked] = useState<(number | null)[]>(() => questions.map(() => null));
  const answered = picked.filter((p) => p !== null).length;
  const correct = picked.filter((p, i) => p === questions[i].answer).length;

  return (
    <div className="not-prose my-6 space-y-5">
      {questions.map((question, qi) => {
        const choice = picked[qi];
        return (
          <div key={qi} className="rounded-xl border border-line p-4">
            <p className="font-medium">
              <span className="mr-2 text-muted">{qi + 1}.</span>
              {question.q}
            </p>
            <ul className="mt-3 space-y-2">
              {question.options.map((opt, oi) => {
                const isAnswer = oi === question.answer;
                const state =
                  choice === null ? 'idle' : isAnswer ? 'right' : oi === choice ? 'wrong' : 'dim';
                return (
                  <li key={oi}>
                    <button
                      type="button"
                      disabled={choice !== null}
                      onClick={() => setPicked((p) => p.map((v, i) => (i === qi ? oi : v)))}
                      className={`w-full rounded-md border px-3 py-2 text-left text-sm transition-colors ${
                        state === 'idle'
                          ? 'border-line hover:bg-surface'
                          : state === 'right'
                            ? 'border-ok bg-ok/10'
                            : state === 'wrong'
                              ? 'border-bad bg-bad/10'
                              : 'border-line opacity-50'
                      }`}
                    >
                      {opt}
                    </button>
                  </li>
                );
              })}
            </ul>
            {choice !== null && (
              <p className="mt-3 text-sm leading-relaxed text-muted">
                <span className={choice === question.answer ? 'font-semibold text-ok' : 'font-semibold text-bad'}>
                  {choice === question.answer ? 'Correct. ' : 'Not quite. '}
                </span>
                {question.explain}
              </p>
            )}
          </div>
        );
      })}
      {answered === questions.length && (
        <div className="flex items-center justify-between rounded-lg bg-surface px-4 py-3 text-sm">
          <span>
            Score: <strong>{correct}</strong> / {questions.length}
          </span>
          <button
            type="button"
            className="text-accent hover:underline"
            onClick={() => setPicked(questions.map(() => null))}
          >
            Try again
          </button>
        </div>
      )}
    </div>
  );
}

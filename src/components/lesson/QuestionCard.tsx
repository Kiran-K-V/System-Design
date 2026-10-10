import { useMemo, useState } from 'react';
import { POINTS, canShuffle, recordAnswer, saveExplain, seededOrder, type Confidence } from '../../lib/mastery';
import { questionId, type Question } from '../../lib/questionId';

const LEVELS: { key: Confidence; label: string }[] = [
  { key: 'sure', label: 'Sure' },
  { key: 'think', label: 'Think so' },
  { key: 'guess', label: 'Guess' },
];

interface Props {
  question: Question;
  index: number;
  /** Changes the option order on retry. */
  attempt?: number;
  onResult: (points: number, correct: boolean) => void;
}

/** One question: pick confidence, then answer. Wrong and sure asks for a one-line reason. */
export default function QuestionCard({ question, index, attempt = 0, onResult }: Props) {
  const id = questionId(question);
  const order = useMemo(
    () => (canShuffle(question.options) ? seededOrder(question.options.length, `${id}:${attempt}`) : question.options.map((_, i) => i)),
    [id, attempt, question.options],
  );
  const [confidence, setConfidence] = useState<Confidence | null>(null);
  const [choice, setChoice] = useState<number | null>(null); // original option index
  const [why, setWhy] = useState('');
  const [saved, setSaved] = useState(false);

  const correct = choice === question.answer;
  const confidentMiss = choice !== null && !correct && confidence === 'sure';

  const answer = (orig: number) => {
    if (!confidence || choice !== null) return;
    const ok = orig === question.answer;
    setChoice(orig);
    recordAnswer(id, ok, confidence);
    onResult(POINTS[confidence][ok ? 0 : 1], ok);
  };

  return (
    <div className="rounded-xl border border-line p-4">
      <p className="font-medium">
        <span className="mr-2 text-muted">{index + 1}.</span>
        {question.q}
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-2 text-sm" role="group" aria-label="How sure are you?">
        <span className="text-muted">How sure?</span>
        {LEVELS.map((l) => (
          <button
            key={l.key}
            type="button"
            disabled={choice !== null}
            aria-pressed={confidence === l.key}
            onClick={() => setConfidence(l.key)}
            className={`rounded-full border px-3 py-1 transition-colors ${
              confidence === l.key ? 'border-accent bg-accent-soft text-fg' : 'border-line hover:bg-surface'
            } disabled:cursor-default`}
          >
            {l.label}
          </button>
        ))}
      </div>
      <ul className="mt-3 space-y-2">
        {order.map((orig) => {
          const isAnswer = orig === question.answer;
          const state = choice === null ? 'idle' : isAnswer ? 'right' : orig === choice ? 'wrong' : 'dim';
          return (
            <li key={orig}>
              <button
                type="button"
                disabled={choice !== null || !confidence}
                onClick={() => answer(orig)}
                className={`w-full rounded-md border px-3 py-2 text-left text-sm transition-colors ${
                  state === 'idle'
                    ? 'border-line enabled:hover:bg-surface disabled:opacity-60'
                    : state === 'right'
                      ? 'border-ok bg-ok/10'
                      : state === 'wrong'
                        ? 'border-bad bg-bad/10'
                        : 'border-line opacity-50'
                }`}
              >
                {question.options[orig]}
              </button>
            </li>
          );
        })}
      </ul>
      {choice === null && !confidence && <p className="mt-2 text-xs text-muted">Pick how sure you are first. Then pick an answer.</p>}
      {choice !== null && confidence && (
        <div className="mt-3 text-sm leading-relaxed text-muted">
          <p>
            <span className={correct ? 'font-semibold text-ok' : 'font-semibold text-bad'}>{correct ? 'Correct. ' : 'Not quite. '}</span>
            <span className="tabular-nums">{POINTS[confidence][correct ? 0 : 1] > 0 ? '+' : ''}{POINTS[confidence][correct ? 0 : 1]} points. </span>
            {question.explain}
          </p>
          {confidentMiss && (
            <form
              className="mt-3 rounded-lg bg-surface p-3"
              onSubmit={(e) => {
                e.preventDefault();
                if (why.trim()) {
                  saveExplain(id, why.trim());
                  setSaved(true);
                }
              }}
            >
              <label className="block font-medium text-fg" htmlFor={`why-${id}`}>
                You were sure, and wrong. Why did you think so?
              </label>
              <p className="mt-1 text-xs">Writing the wrong idea down is what fixes it. Saved on the Review page.</p>
              {saved ? (
                <p className="mt-2 text-ok">Saved.</p>
              ) : (
                <div className="mt-2 flex gap-2">
                  <input
                    id={`why-${id}`}
                    value={why}
                    onChange={(e) => setWhy(e.target.value)}
                    maxLength={200}
                    className="min-w-0 flex-1 rounded-md border border-line bg-bg px-2 py-1 text-fg"
                  />
                  <button type="submit" className="rounded-md border border-line px-3 py-1 text-fg hover:bg-bg">
                    Save
                  </button>
                </div>
              )}
            </form>
          )}
        </div>
      )}
    </div>
  );
}

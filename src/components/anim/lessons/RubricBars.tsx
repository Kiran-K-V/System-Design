import { useState } from 'react';

type Level = 'mid' | 'senior' | 'staff';

const LEVELS: { id: Level; label: string }[] = [
  { id: 'mid', label: 'Mid-level' },
  { id: 'senior', label: 'Senior' },
  { id: 'staff', label: 'Staff' },
];

/** Emphasis 1-5. An illustrative synthesis of public guidance, not an official rubric. */
const DIMS: { name: string; w: Record<Level, number>; look: Record<Level, string> }[] = [
  { name: 'Scope and requirements', w: { mid: 4, senior: 4, staff: 5 }, look: { mid: 'Asks the standard questions. Lists features and basic quality goals.', senior: 'Finds what makes this problem hard and cuts scope to match.', staff: 'Negotiates scope as a peer. Says what is out and why.' } },
  { name: 'Breadth of fundamentals', w: { mid: 5, senior: 3, staff: 2 }, look: { mid: 'Knows the core building blocks and what each one is for.', senior: 'Fundamentals are assumed. Moves through them fast.', staff: 'Assumed. Coverage is narrow and aimed at the hard parts.' } },
  { name: 'Depth', w: { mid: 2, senior: 4, staff: 5 }, look: { mid: 'Solid on concepts. Hands-on detail is not required.', senior: 'Goes deep in about two areas with real specifics.', staff: 'Deep across several areas. Can teach the interviewer something.' } },
  { name: 'Driving the conversation', w: { mid: 3, senior: 4, staff: 5 }, look: { mid: 'Leads the early phases. Interviewer leads the late ones.', senior: 'Steers with confidence. Picks the next topic.', staff: 'Leads almost the whole session, like a peer.' } },
  { name: 'Trade-offs', w: { mid: 2, senior: 4, staff: 5 }, look: { mid: 'Names options when asked. Does not need to find flaws alone.', senior: 'Points out limits in own design and offers alternatives.', staff: 'Sees problems coming and fixes them before they are raised.' } },
  { name: 'Communication', w: { mid: 4, senior: 4, staff: 5 }, look: { mid: 'Clear, organized, easy to follow.', senior: 'Clear, and checks in with the interviewer.', staff: 'Frames decisions so a team could act on them.' } },
  { name: 'Handling ambiguity', w: { mid: 2, senior: 3, staff: 5 }, look: { mid: 'Asks questions when stuck.', senior: 'Makes labelled assumptions and moves on.', staff: 'Turns a vague prompt into a clear problem statement.' } },
  { name: 'Quantitative reasoning', w: { mid: 2, senior: 3, staff: 4 }, look: { mid: 'Can do rough math if asked.', senior: 'Uses numbers to pick between designs.', staff: 'Numbers drive every major decision.' } },
  { name: 'Ops and failure thinking', w: { mid: 1, senior: 3, staff: 5 }, look: { mid: 'Happy path works.', senior: 'Covers failures, retries, monitoring.', staff: 'Covers rollout, recovery, and how the system evolves.' } },
];

export default function RubricBars() {
  const [lv, setLv] = useState<Level>('mid');
  return (
    <figure className="not-prose my-8 overflow-hidden rounded-2xl border border-line bg-surface/40">
      <div className="flex flex-wrap items-center gap-3 border-b border-line px-4 py-3">
        <span className="text-[15px] font-semibold">Where the weight sits, by level</span>
        <div role="group" aria-label="Level" className="ml-auto flex overflow-hidden rounded-lg border border-line text-sm">
          {LEVELS.map((l) => (
            <button
              key={l.id}
              type="button"
              aria-pressed={lv === l.id}
              onClick={() => setLv(l.id)}
              className={`px-3 py-2 ${lv === l.id ? 'bg-accent-soft font-semibold text-accent' : 'text-muted hover:text-fg'}`}
            >
              {l.label}
            </button>
          ))}
        </div>
      </div>
      <ul className="m-0 list-none space-y-3 bg-bg px-4 py-4">
        {DIMS.map((d) => (
          <li key={d.name} className="grid gap-x-4 gap-y-1 sm:grid-cols-[11rem_1fr]">
            <span className="text-[14px] font-medium">{d.name}</span>
            <div>
              <div className="h-2.5 overflow-hidden rounded-full bg-line" role="img" aria-label={`${d.name}: emphasis ${d.w[lv]} of 5`}>
                <div className="h-full rounded-full bg-accent transition-[width] duration-500 motion-reduce:transition-none" style={{ width: `${d.w[lv] * 20}%` }} />
              </div>
              <p className="m-0 mt-1 text-[13px] leading-snug text-muted">{d.look[lv]}</p>
            </div>
          </li>
        ))}
      </ul>
      <figcaption className="border-t border-line px-4 py-3 text-[13px] text-muted">
        Illustrative weights from typical public guidance. Companies differ. This is not any company's official rubric.
      </figcaption>
    </figure>
  );
}

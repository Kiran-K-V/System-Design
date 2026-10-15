/** Static infographic. Prompts are illustrative, written for this lesson, not quoted from any company. */
const CLASSIC = [
  'Rank the feed for a social app',
  'Recommend videos to a new user',
  'Detect fraud on card payments',
  'Predict ride arrival time',
  'Flag harmful posts at scale',
  'Suggest people you may know',
  'Rank search results for a store',
  'Forecast demand per warehouse',
];
const GENAI = [
  'Answer questions over company docs',
  'Build a customer support bot',
  'Design a coding assistant',
  'Serve a chat model to 1M users',
  'Build an agent that books travel',
  'Summarize long meetings',
  'Moderate content with an LLM',
  'Design an eval pipeline for a chatbot',
];

function Col({ title, tone, items, axes }: { title: string; tone: string; items: string[]; axes: string }) {
  return (
    <div className="rounded-xl border p-4" style={{ borderColor: tone }}>
      <p className="text-[15px] font-semibold" style={{ color: tone }}>{title}</p>
      <p className="mt-1 text-xs text-muted">{axes}</p>
      <ul className="mt-3 space-y-1.5 text-sm">
        {items.map((t) => (
          <li key={t} className="rounded-md bg-surface px-2.5 py-1.5">{t}</li>
        ))}
      </ul>
    </div>
  );
}

export default function Ai0FamilySort() {
  return (
    <figure className="not-prose my-8">
      <div className="grid gap-4 md:grid-cols-2">
        <Col title="Classic ML" tone="var(--ok)" items={CLASSIC} axes="Scored on: features, labels, model, metrics, deployment" />
        <Col title="GenAI" tone="var(--accent)" items={GENAI} axes="Scored on: quality bar, eval plan, cost, risk, plus serving" />
      </div>
      <figcaption className="mt-3 text-sm text-muted">
        Illustrative prompts, sorted by family. In a classic prompt the hard part is the data and the metric. In a GenAI prompt the model is a given, and the hard part is evaluation, cost, and failure handling.
      </figcaption>
    </figure>
  );
}

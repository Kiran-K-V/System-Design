import DesignBuild, { type BuildEdge, type BuildNode, type BuildStep } from '../DesignBuild';

/** Text-to-SQL analytics agent: the design grows one requirement at a time. */

const nodes: BuildNode[] = [
  { id: 'user', x: 90, y: 220, w: 120, label: 'User', step: 0 },
  { id: 'router', x: 250, y: 80, w: 130, label: 'Router', sub: 'pick a domain', step: 0 },
  { id: 'docs', x: 430, y: 80, w: 130, h: 80, label: 'Table docs', sub: 'retrieve top k', shape: 'db', step: 1 },
  { id: 'sem', x: 610, y: 80, w: 130, h: 80, label: 'Metrics', sub: 'one definition', shape: 'db', step: 2 },
  { id: 'llm', x: 250, y: 220, w: 130, label: 'SQL model', sub: 'structured output', step: 3 },
  { id: 'checks', x: 430, y: 220, w: 130, label: 'Checks', sub: 'parse, dry run', step: 4 },
  { id: 'wh', x: 610, y: 220, w: 130, h: 80, label: 'Warehouse', sub: 'as the user', shape: 'db', step: 5 },
  { id: 'answer', x: 430, y: 360, w: 130, label: 'Answer', sub: 'rows + SQL', step: 7 },
  { id: 'gold', x: 250, y: 360, w: 130, h: 80, label: 'Golden set', sub: 'score by rows', shape: 'db', step: 8 },
];

const edges: BuildEdge[] = [
  { from: 'user', to: 'router', label: 'question', labelAt: [-34, -8], step: 0 },
  { from: 'router', to: 'docs', step: 1 },
  { from: 'router', to: 'sem', bend: 40, step: 2 },
  { from: 'router', to: 'llm', step: 3 },
  { from: 'llm', to: 'checks', label: 'SQL', labelAt: [0, -16], step: 4 },
  { from: 'checks', to: 'wh', step: 5 },
  { from: 'checks', to: 'llm', dashed: true, bend: 36, label: 'error', labelAt: [0, 30], step: 6 },
  { from: 'wh', to: 'answer', step: 7 },
  { from: 'answer', to: 'user', step: 7 },
  { from: 'llm', to: 'user', dashed: true, label: 'ask back', labelAt: [0, -16], step: 7 },
  { from: 'answer', to: 'gold', label: 'log', labelAt: [0, -14], step: 8 },
];

const steps: BuildStep[] = [
  { req: 'FR1: ask in plain English', caption: 'The user types a question. A router maps it to a domain (sales, growth, finance). Each domain has its own curated tables, so the search starts small. Uber calls these workspaces.', packets: [{ from: 'user', to: 'router', label: 'question' }] },
  { req: 'FR2: find the right tables', caption: 'The router retrieves the top k table documents for the question: names, column descriptions, sample values. The warehouse holds thousands of tables, and a prompt cannot hold them all.', packets: [{ from: 'router', to: 'docs', label: 'search' }] },
  { req: 'FR3: one meaning per metric', caption: 'Certified metrics such as weekly active users sit in a semantic layer. If the question names a metric, the agent uses its definition and does not invent one.', packets: [{ from: 'router', to: 'sem', label: 'lookup' }] },
  { req: 'FR4: write the SQL', caption: 'The model gets the question, the retrieved tables, the metric definitions, and a few similar past queries. It returns SQL in a fixed shape (structured output).', packets: [{ from: 'router', to: 'llm', label: 'context' }] },
  { req: 'NFR: cheap and safe', caption: 'Before anything runs, code checks the SQL: it parses, it only reads, it touches only allowed schemas, and a dry run estimates the bytes scanned. Over the cap, it does not run.', packets: [{ from: 'llm', to: 'checks', label: 'SQL' }] },
  { req: 'NFR: see only your own rows', caption: 'The query runs with the asking user\'s identity. The warehouse applies that user\'s row-level rules. A shared admin account would skip them.', packets: [{ from: 'checks', to: 'wh', label: 'run' }] },
  { req: 'NFR: a right number', caption: 'On an error, the message goes back to the model for another try, with a cap on tries (generate, verify, fix). A query that runs is not yet a query that is right.', packets: [{ from: 'checks', to: 'llm', label: 'error' }] },
  { req: 'FR5: answer, or ask back', caption: 'The user gets the table, a chart, the SQL, and a plain sentence on what was assumed. If the question has two readings with different numbers, the model asks which one instead of guessing.', packets: [{ from: 'wh', to: 'answer', label: 'rows' }, { from: 'answer', to: 'user', label: 'result', delay: 0.9 }] },
  { req: 'NFR: measure by execution', caption: 'No new box on the request path. Each answer and the user\'s reaction (accept, edit, rerun) go to a golden set. Scoring compares result rows, never SQL text.', packets: [{ from: 'answer', to: 'gold', label: 'log' }], active: ['gold'] },
];

export default function Ai13SqlBuild() {
  return <DesignBuild title="Text-to-SQL agent, built up" steps={steps} nodes={nodes} edges={edges} height={430} label="Text-to-SQL agent architecture growing from router to golden set" />;
}

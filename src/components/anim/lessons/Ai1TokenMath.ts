/** Token and cost estimates built only from sourced ratios. These are estimates, not a real tokenizer. */
export interface Estimator {
  id: string;
  label: string;
  /** Characters per token on English text, or null when the source gives tokens per word. */
  charsPerToken: number | null;
  tokensPerWord: number | null;
  source: string;
}

export const ESTIMATORS: Estimator[] = [
  { id: 'gpt2', label: 'GPT-2 tokenizer (WebText2)', charsPerToken: 4.3, tokensPerWord: null, source: 'Kaplan et al. 2020: 4.3 characters per token (1.4 tokens per word)' },
  { id: 'llama3', label: 'Llama 3 tokenizer', charsPerToken: 3.94, tokensPerWord: null, source: 'Llama 3 paper: 3.94 characters per token on English (Llama 2: 3.17)' },
  { id: 'claude', label: 'Current Claude tokenizer', charsPerToken: null, tokensPerWord: 1_000_000 / 555_000, source: 'Anthropic models overview: 1M tokens is about 555K words' },
];

export interface Language {
  id: string;
  label: string;
  /** Median token count of the same message, relative to English. */
  factor: number;
  note: string;
}

/** TopBots, June 2023, cl100k_base, MASSIVE dataset (2,033 texts per language). Burmese is "over 10x", so 10 is a floor. */
export const LANGUAGES: Language[] = [
  { id: 'en', label: 'English', factor: 1, note: 'baseline' },
  { id: 'hi', label: 'Hindi', factor: 5, note: 'about 5x' },
  { id: 'bn', label: 'Bengali', factor: 5, note: 'about 5x' },
  { id: 'hy', label: 'Armenian', factor: 9, note: 'about 9x' },
  { id: 'my', label: 'Burmese', factor: 10, note: 'over 10x (10 used)' },
];

export const wordCount = (text: string) => (text.trim() ? text.trim().split(/\s+/).length : 0);

/** Estimated English tokens for a text. */
export function englishTokens(text: string, e: Estimator): number {
  if (!text.trim()) return 0;
  if (e.charsPerToken !== null) return text.length / e.charsPerToken;
  return wordCount(text) * (e.tokensPerWord as number);
}

export function estimate(text: string, e: Estimator, lang: Language, pricePerMTok: number) {
  const base = englishTokens(text, e);
  const tokens = base * lang.factor;
  return { baseTokens: base, tokens, cost: (tokens * pricePerMTok) / 1e6 };
}

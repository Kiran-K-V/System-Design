const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Regex for one surface form of a glossary term. Word-bounded; hyphens count as part of a word.
 * A plural "s"/"es" always matches. Case-sensitive when the form has an uppercase letter.
 * Lives apart from glossary.ts so the browser bundle does not pull in the glossary data.
 */
export function formPattern(form: string): RegExp {
  const body = escape(form).replace(/ /g, '\\s+');
  const flags = form === form.toLowerCase() ? 'gi' : 'g';
  return new RegExp(`(?<![\\w-])${body}(?:s|es)?(?![\\w-])`, flags);
}

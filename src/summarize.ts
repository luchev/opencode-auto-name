/**
 * Smart message summarization.
 *
 * - Strips leading filler phrases
 * - Takes first sentence
 * - Truncates to maxLength with "…" suffix
 */

const FILLER = /^(?:(?:i\s+)?(?:want\s+(?:to\s+)?|need\s+(?:to\s+)?|would\s+(?:like\s+)?to\s+|am\s+trying\s+to\s+)|can\s+(?:you\s+)?(?:please\s+)?|could\s+(?:you\s+)?(?:please\s+)?|hey\s+|hi\s+|hello\s+|please\s+)/i;

export function summarize(text: string, maxLength = 50): string {
  let s = text.trim();

  // strip filler
  s = s.replace(FILLER, "").trim();

  // take first sentence
  const match = s.match(/^.*?[.!?\n]|^[^.!?\n]+/);
  if (match) s = match[0].trim();

  // strip trailing punctuation
  s = s.replace(/[.!?]+$/, "").trim();

  // truncate
  if (s.length <= maxLength) return s;
  return s.slice(0, maxLength).replace(/\s+\S*$/, "") + "…";
}

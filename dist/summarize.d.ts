/**
 * Smart message summarization.
 *
 * - Strips leading filler phrases
 * - Takes first sentence
 * - Truncates to maxLength with "…" suffix
 */
export declare function summarize(text: string, maxLength?: number): string;

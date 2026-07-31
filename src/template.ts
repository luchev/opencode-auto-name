/**
 * Simple template engine with {var} substitution and || fallback.
 *
 * Syntax: "{project}: {task || firstMessage}"
 * Falls back to default if no keys match.
 */

export interface TemplateVars {
  project: string;
  task: string;
  firstMessage: string;
  messageCount: number;
  model: string;
  date: string;
  time: string;
}

export function render(
  template: string,
  vars: TemplateVars,
  defaultValue = "session",
): string {
  return template.replace(/\{(\w+(?:\s*\|\|\s*\w+)*)\}/g, (_match, expr) => {
    const alternatives = expr.split(/\s*\|\|\s*/);
    for (const key of alternatives) {
      const val = vars[key as keyof TemplateVars];
      if (val !== undefined && val !== null && val !== "") {
        return String(val);
      }
    }
    return defaultValue;
  });
}

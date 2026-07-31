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
export declare function render(template: string, vars: TemplateVars, defaultValue?: string): string;

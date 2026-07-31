/**
 * Simple template engine with {var} substitution and || fallback.
 *
 * Syntax: "{project}: {task || firstMessage}"
 * Falls back to default if no keys match.
 */
export function render(template, vars, defaultValue = "session") {
    return template.replace(/\{(\w+(?:\s*\|\|\s*\w+)*)\}/g, (_match, expr) => {
        const alternatives = expr.split(/\s*\|\|\s*/);
        for (const key of alternatives) {
            const val = vars[key];
            if (val !== undefined && val !== null && val !== "") {
                return String(val);
            }
        }
        return defaultValue;
    });
}

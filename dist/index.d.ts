import type { Plugin } from "@opencode-ai/plugin";
export interface SessionNameConfig {
    /** Template string, e.g. "{project}: {task || firstMessage}" */
    template: string;
    /** Max length of summarized message/task text */
    maxLength: number;
    /** Debounce delay in ms before updating title */
    debounceMs: number;
    /** How often to re-check and update (ms). 0 = disable periodic check. */
    intervalMs: number;
}
export default function sessionNamePlugin(opts?: Partial<SessionNameConfig>): Plugin;

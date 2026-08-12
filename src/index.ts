import type { Plugin, Hooks } from "@opencode-ai/plugin";
import { render, type TemplateVars } from "./template.js";
import { summarize } from "./summarize.js";

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

const defaultConfig: SessionNameConfig = {
  template: "{task || firstMessage}",
  maxLength: 50,
  debounceMs: 10_000,
  intervalMs: 60_000,
};

export default function sessionNamePlugin(
  opts?: Partial<SessionNameConfig>,
): Plugin {
  const cfg = { ...defaultConfig, ...opts };

  return async ({ client, project, directory }) => {
    const projectName =
      project.worktree.split("/").pop() ??
      directory?.split("/").pop() ??
      project.id;

    let sessionID = "";
    let firstMessage = "";
    let currentTask = "";
    let messageCount = 0;
    let lastTitle = "";
    let timerId: ReturnType<typeof setTimeout> | undefined;
    let intervalId: ReturnType<typeof setInterval> | undefined;

    // ---- helpers ----

    function getTitle(): string {
      const vars: TemplateVars = {
        project: projectName,
        task: currentTask,
        firstMessage: summarize(firstMessage, cfg.maxLength),
        messageCount,
        model: "",
        date: new Date().toLocaleDateString("en-US", {
          month: "2-digit",
          day: "2-digit",
        }),
        time: new Date().toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        }),
      };
      return render(cfg.template, vars, projectName);
    }

    async function applyTitle(): Promise<void> {
      if (!sessionID) return;
      const title = getTitle();
      if (title === lastTitle) return;
      lastTitle = title;
      try {
        await client.session.update({
          path: { id: sessionID },
          body: { title },
        });
      } catch {
        // silent
      }
    }

    function scheduleUpdate(): void {
      if (timerId) clearTimeout(timerId);
      timerId = setTimeout(applyTitle, cfg.debounceMs);
    }

    // ---- hooks ----

    const hooks: Hooks = {
      async event(input) {
        const ev = input.event as {
          type: string;
          properties: Record<string, unknown>;
        };

        switch (ev.type) {
          case "session.created": {
            const info = ev.properties.info as
              | { id?: string; title?: string; summary?: { title?: string } }
              | undefined;
            sessionID = info?.id ?? "";
            lastTitle = info?.title ?? "";
            firstMessage = "";
            currentTask = "";
            messageCount = 0;
            break;
          }

          case "message.updated": {
            messageCount++;
            const msg = ev.properties.info as
              | {
                  sessionID?: string;
                  role?: string;
                  summary?: { title?: string };
                }
              | undefined;
            if (msg?.sessionID) sessionID = msg.sessionID;
            if (msg?.role === "user" && msg.summary?.title && !firstMessage) {
              firstMessage = msg.summary.title;
            }
            scheduleUpdate();
            break;
          }

          case "todo.updated": {
            const props = ev.properties as { sessionID?: string };
            if (props?.sessionID) sessionID = props.sessionID;
            const todos = ev.properties.todos as
              | Array<{ content: string; status: string }>
              | undefined;
            const active = todos?.find((t) => t.status === "in_progress");
            currentTask = active
              ? summarize(active.content, cfg.maxLength)
              : "";
            scheduleUpdate();
            break;
          }

          case "command.executed": {
            const props = ev.properties as { sessionID?: string };
            if (props?.sessionID) sessionID = props.sessionID;
            scheduleUpdate();
            break;
          }
        }
      },

      async dispose() {
        if (timerId) clearTimeout(timerId);
        if (intervalId) clearInterval(intervalId);
      },
    };

    // periodic checker
    if (cfg.intervalMs > 0) {
      setTimeout(applyTitle, 2_000);
      intervalId = setInterval(applyTitle, cfg.intervalMs);
    }

    return hooks;
  };
}

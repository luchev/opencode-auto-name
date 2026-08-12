import { render } from "./template.js";
import { summarize } from "./summarize.js";
const defaultConfig = {
    template: "{task || firstMessage}",
    maxLength: 50,
    debounceMs: 10_000,
    intervalMs: 60_000,
};
export default function sessionNamePlugin(opts) {
    const cfg = { ...defaultConfig, ...opts };
    return async ({ client, project, directory }) => {
        const projectName = project.worktree.split("/").pop() ??
            directory?.split("/").pop() ??
            project.id;
        let sessionID = "";
        let firstMessage = "";
        let currentTask = "";
        let messageCount = 0;
        let lastTitle = "";
        let timerId;
        let intervalId;
        // ---- helpers ----
        function getTitle() {
            const vars = {
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
        async function applyTitle() {
            if (!sessionID)
                return;
            const title = getTitle();
            if (title === lastTitle)
                return;
            lastTitle = title;
            try {
                await client.session.update({
                    path: { id: sessionID },
                    body: { title },
                });
            }
            catch {
                // silent
            }
        }
        function scheduleUpdate() {
            if (timerId)
                clearTimeout(timerId);
            timerId = setTimeout(applyTitle, cfg.debounceMs);
        }
        // ---- hooks ----
        const hooks = {
            async event(input) {
                const ev = input.event;
                switch (ev.type) {
                    case "session.created": {
                        const info = ev.properties.info;
                        sessionID = info?.id ?? "";
                        lastTitle = info?.title ?? "";
                        firstMessage = "";
                        currentTask = "";
                        messageCount = 0;
                        break;
                    }
                    case "message.updated": {
                        messageCount++;
                        const msg = ev.properties.info;
                        if (msg?.sessionID)
                            sessionID = msg.sessionID;
                        if (msg?.role === "user" && msg.summary?.title && !firstMessage) {
                            firstMessage = msg.summary.title;
                        }
                        scheduleUpdate();
                        break;
                    }
                    case "todo.updated": {
                        const props = ev.properties;
                        if (props?.sessionID)
                            sessionID = props.sessionID;
                        const todos = ev.properties.todos;
                        const active = todos?.find((t) => t.status === "in_progress");
                        currentTask = active
                            ? summarize(active.content, cfg.maxLength)
                            : "";
                        scheduleUpdate();
                        break;
                    }
                    case "command.executed": {
                        const props = ev.properties;
                        if (props?.sessionID)
                            sessionID = props.sessionID;
                        scheduleUpdate();
                        break;
                    }
                }
            },
            async dispose() {
                if (timerId)
                    clearTimeout(timerId);
                if (intervalId)
                    clearInterval(intervalId);
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

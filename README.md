# OpenCode auto session rename

Auto-rename OpenCode sessions based on what you're working on.

OpenCode names sessions generically. This plugin watches session activity and
sets a meaningful title from your current todo task, falling back to a summary
of your first message.

## Install

Add it to the `plugin` array in `~/.config/opencode/opencode.jsonc`:

```jsonc
{
  "plugin": [
    "opencode-auto-name"
  ]
}
```

From a local checkout (like this repo):

```jsonc
{
  "plugin": [
    "file:///path/to/opencode-auto-name"
  ]
}
```

For a local checkout, run `npm install && npm run build` in the repo first,
then restart OpenCode.

## Example

Prompt the AI:

> Create a new plugin for OpenCode which sets the name of the session
> dynamically based on the content of the session.

The session is renamed to:

> Opencode plugin to automatically set the session name

## How it works

The plugin hooks into session events (`session.created`, `message.updated`,
`todo.updated`, `command.executed`) and renders a title from a configurable
template. Updates are debounced (10s) so the title doesn't churn mid-conversation,
with a periodic re-check (60s) as a safety net.

By default the title is `{task || firstMessage}`:

1. If there's an `in_progress` todo, use its content
2. Otherwise, summarize the first user message

The sessions menu already shows the project/directory, so the project name is
not included in the default title — but it's available if you want it.

## Configure

Pass options as a `[name, options]` tuple in the plugin array:

```jsonc
{
  "plugin": [
    ["opencode-auto-name", {
      "template": "{project}: {task || firstMessage}",
      "maxLength": 50,
      "debounceMs": 10000,
      "intervalMs": 60000
    }]
  ]
}
```

### Options

| Option | Default | Description |
|---|---|---|
| `template` | `"{task \|\| firstMessage}"` | Title template (see below) |
| `maxLength` | `50` | Max length of task/message text in the title |
| `debounceMs` | `10000` | Delay before updating the title after an event |
| `intervalMs` | `60000` | Periodic re-check interval. `0` disables it |

### Template syntax

- `{var}` — substitute a variable
- `{a || b}` — use `a`, fall back to `b` if empty

### Variables

| Variable | Meaning |
|---|---|
| `project` | Project name (git repo / directory basename) |
| `task` | Current `in_progress` todo content |
| `firstMessage` | Summarized first user message |
| `messageCount` | Number of messages so far |
| `model` | Model in use |
| `date` | Current date (MM/DD) |
| `time` | Current time (HH:MM) |

### Summarization

`firstMessage` and `task` are cleaned before going into the title:

- Leading filler is stripped ("i want to", "can you", "please", …)
- Only the first sentence is kept
- Trailing punctuation is removed
- Long text truncates at `maxLength` with a "…" suffix

## Development

```sh
npm install
npm run build   # tsc → dist/
npm run dev     # tsc --watch
```

The plugin entry point is `src/index.ts`. It exports the plugin factory as the
default export, per the `@opencode-ai/plugin` SDK.

## License

MIT

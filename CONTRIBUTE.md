# Contributing

## Publishing a new version

The plugin is published to npm as `opencode-auto-name`.

### Prerequisites

- Node/npm with credentials for the npm account that owns the package
  (`npm whoami` should not error)
- `typescript` (installed via `npm install`)

### Steps

```bash
# 1. Make sure you're on main with everything committed and pushed
git checkout main
git pull
git status            # should be clean

# 2. Install deps and run the build to make sure it compiles
npm install
npm run build         # tsc → dist/

# 3. Commit the freshly built dist (it is tracked in git)
git add dist
git commit -m "build dist for v0.x.y"

# 4. Bump the version (patch = bugfix, minor = feature, major = breaking)
npm version patch     # also creates a git tag, e.g. v0.1.2

# 5. Publish
npm publish

# 6. Push the version bump commit and tag
git push origin main
git push origin main --tags

# 7. Verify
npm view opencode-auto-name version   # should show the new version
```

### What gets published

`files: ["dist"]` — only `dist/` is published. The entrypoint is
`exports["."]` → `dist/index.js` (a server plugin). Unlike TUI plugins, server
plugins load via `main` / `exports["."]`, so keep that shape.

### Version bump conventions

| Change | Command |
|---|---|
| Bugfix / small change | `npm version patch` |
| New feature (backwards compatible) | `npm version minor` |
| Breaking change | `npm version major` |

### Testing before publishing

Test against a live opencode instance using a local checkout first:

```json
{
  "plugin": ["file:///path/to/opencode-auto-name"]
}
```

Run `npm install && npm run build` in the repo, restart opencode, and confirm
sessions get renamed. Only then publish.

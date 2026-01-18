# Agent Instructions

## Environment

- **Node.js**: Use `mise` for version management (not nvm, not system node)
- **Current Node version**: 24.1.0 (global default)
- Run `mise ls node` to see available versions
- Run `mise current node` to verify active version

## Commands

```bash
# Use node/npm directly - mise shims are in PATH
node --version    # Should show v24.1.0
npm --version

# If needed, explicitly run with mise
mise exec node@24.1 -- npm install
mise exec node@24.1 -- npm run build
```

## CLI Aliases (for reference)

- `cw` - Claude Code (`claude --dangerously-skip-permissions`)
- `co` - Codex (`codex --yolo`)

## Non-Interactive Mode

| Tool | Command |
|------|---------|
| Claude | `claude -p "prompt"` |
| Codex | `codex exec --full-auto "prompt"` |

## Raycast Extension Development

- Use `npm install` to install dependencies
- Use `npm run dev` for development mode
- Use `npm run build` to build
- Use `npm run lint` to lint
- Raycast extensions require specific package.json structure - see Raycast docs

## Git

- Commit after each completed task
- Use descriptive commit messages

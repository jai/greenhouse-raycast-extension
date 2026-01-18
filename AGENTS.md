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

## Dependencies & Versions

**Always use the latest stable versions of all libraries.**

Before installing or updating any package:
1. Use Perplexity to search for current latest version
2. Use Perplexity to crawl official docs for API changes/breaking changes
3. Verify with: `npm view <package> version`

When unsure about API usage, crawl the official documentation first.

## Raycast Extension Development

- Use `npm install` to install dependencies
- Use `npm run dev` for development mode
- Use `npm run build` to build
- Use `npm run lint` to lint
- Raycast extensions require specific package.json structure - see Raycast docs

## Git

- Commit after each completed task
- Use descriptive commit messages

## Notes

- Raycast CLI reads manifest fields from `package.json` (title, icon, preferences, commands) and generates `raycast-env.d.ts` from them.
- Place extension icons under `assets/` and reference them as `assets/...` in manifests.
- In sandboxed runs, set `HOME` to a repo-local directory when using `ray build` to avoid writes to `~/.config`.
- Harvest API jobs can be filtered by `status` and paginated via `Link` headers; `HarvestClient.listAll` is the expected way to traverse pages.
- Use `getHarvestErrorDisplay` from `src/api/harvestErrors.ts` for consistent Harvest auth/rate-limit messaging and toast handling.

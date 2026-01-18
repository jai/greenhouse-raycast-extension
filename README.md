# Greenhouse Raycast Extension

A Raycast extension for viewing Greenhouse jobs and applicant pipeline stages.

## Ralph Loop (Autonomous Coding)

This project uses [Ralph loops](https://github.com/snarktank/ralph) for autonomous AI-driven implementation.

### Running Ralph

```bash
# Run with default 10 iterations
./ralph.sh

# Run with custom iteration limit
./ralph.sh 20
```

### How It Works

1. Pipes `prompt.md` to Codex (agent reads files itself)
2. Agent reads `prd.json` for user stories with `passes: true/false`
3. Agent reads `progress.txt` for completed work and patterns
4. Agent reads `AGENTS.md` for environment setup and conventions
5. Picks highest priority story where `passes: false`
6. Implements one story, runs quality checks, commits
7. Updates `prd.json` to mark story as `passes: true`
8. Appends summary to `progress.txt`
9. Repeats until all stories pass or max iterations reached

### Files

| File | Purpose |
|------|---------|
| `ralph.sh` | Loop script (adapted from official Ralph) |
| `prompt.md` | Agent instructions (adapted from official Ralph) |
| `prd.json` | User stories with `passes: true/false` status |
| `progress.txt` | Append-only log of completed work |
| `AGENTS.md` | Environment setup and codebase patterns |
| `PLAN.md` | High-level project plan (reference) |

### Completion Signal

When ALL stories have `passes: true`, agent outputs `<promise>COMPLETE</promise>` and loop exits.

Script also verifies `prd.json` before accepting completion signal (safeguard against premature completion).

---

## Ralph: Official vs Our Implementation

This implementation adapts [snarktank/ralph](https://github.com/snarktank/ralph) for Codex CLI instead of Amp CLI.

### What Matches Official Ralph

| Feature | Status |
|---------|--------|
| `ralph.sh` loop structure | ✅ Matches |
| `prd.json` with stories + `passes` flag | ✅ Matches |
| `progress.txt` append-only log | ✅ Matches |
| `AGENTS.md` for patterns | ✅ Matches |
| Piped prompt delivery | ✅ Matches (`cat prompt.md \| codex exec`) |
| Archive on branch change | ✅ Matches |
| Completion signal `<promise>COMPLETE</promise>` | ✅ Matches |

### Differences from Official Ralph

| Feature | Official (Amp) | Ours (Codex) | Notes |
|---------|---------------|--------------|-------|
| CLI tool | `amp --dangerously-allow-all` | `codex exec --dangerously-bypass-approvals-and-sandbox` | Equivalent flags |
| Thread URL in progress | `$AMP_CURRENT_THREAD_ID` | ❌ Not available | Codex has no env var for session ID |
| `read_thread` tool | ✅ Can read previous sessions | ❌ Not available | No equivalent in Codex |
| `dev-browser` skill | ✅ Browser testing | ❌ Not available | No equivalent in Codex |
| Log file | ❌ None | ✅ `ralph.log` | Extra feature |
| Completion safeguard | ❌ Trusts agent | ✅ Verifies prd.json | Extra safeguard |

### Amp-Specific Features Not Ported

These features require Amp-specific tooling and have no Codex equivalent:

1. **Thread URLs** - Amp exposes `$AMP_CURRENT_THREAD_ID` for linking to conversation history
2. **`read_thread` tool** - Amp agents can read previous session content
3. **`dev-browser` skill** - Amp has built-in browser testing for frontend verification
4. **Thread Map** - Amp's visual workflow for navigating agent conversations

### CLI Reference

| Tool | Non-Interactive Command |
|------|------------------------|
| Claude Code | `claude -p "prompt"` |
| Codex | `codex exec "prompt"` or `cat prompt.md \| codex exec` |

### CLI Aliases (local)

- `cw` - Claude Code (`claude --dangerously-skip-permissions`)
- `co` - Codex (`codex --yolo`)

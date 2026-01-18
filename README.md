# Greenhouse Raycast Extension

A Raycast extension for viewing Greenhouse jobs and applicant pipeline stages.

## Ralph Loop (Autonomous Coding)

This project uses Ralph loops for autonomous AI-driven implementation.

### CLI Aliases

- `cw` - Claude Code (`claude --dangerously-skip-permissions`)
- `co` - Codex (`codex --yolo`)

### Non-Interactive Mode

| Tool | Command |
|------|---------|
| Claude | `cw -p "prompt"` or `claude -p "prompt"` |
| Codex | `codex exec --full-auto "prompt"` |

### Running Ralph

```bash
# Run with default 10 iterations
./ralph.sh

# Run with custom iteration limit
./ralph.sh 20
```

### How It Works

1. Reads `PLAN.md` for implementation tasks
2. Reads `progress.txt` for completed work
3. Picks highest priority incomplete task
4. Implements one task, runs build/lint, commits
5. Appends summary to `progress.txt`
6. Repeats until all tasks complete or max iterations reached

### Files

- `PLAN.md` - Implementation plan and requirements
- `progress.txt` - Log of completed work (updated each iteration)
- `ralph.sh` - The loop script

### Completion Signal

When all tasks are done, the AI outputs `<promise>COMPLETE</promise>` and the loop exits.

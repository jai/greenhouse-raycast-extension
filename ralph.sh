#!/bin/bash
set -e

MAX_ITERATIONS="${1:-10}"
LOG_FILE="ralph.log"
LAST_BRANCH_FILE=".last-branch"

# Log to file and stdout
exec > >(tee -a "$LOG_FILE") 2>&1

echo ""
echo "========================================"
echo "Ralph Loop Started: $(date)"
echo "========================================"

# Check dependencies
if ! command -v jq &> /dev/null; then
  echo "ERROR: jq is required. Install with: brew install jq"
  exit 1
fi

# Read branch from prd.json
BRANCH_NAME=$(jq -r '.branchName // "main"' prd.json)
echo "Branch: $BRANCH_NAME"

# Archive previous run if branch changed
if [ -f "$LAST_BRANCH_FILE" ]; then
  LAST_BRANCH=$(cat "$LAST_BRANCH_FILE")
  if [ "$LAST_BRANCH" != "$BRANCH_NAME" ]; then
    ARCHIVE_NAME=$(echo "$LAST_BRANCH" | sed 's|ralph/||')
    ARCHIVE_DIR="archives/$(date +%Y-%m-%d)-$ARCHIVE_NAME"
    echo "Branch changed from $LAST_BRANCH to $BRANCH_NAME"
    echo "Archiving previous run to $ARCHIVE_DIR"
    mkdir -p "$ARCHIVE_DIR"
    [ -f progress.txt ] && cp progress.txt "$ARCHIVE_DIR/"
    [ -f ralph.log ] && cp ralph.log "$ARCHIVE_DIR/"
    # Reset progress for new branch
    echo "# Progress Log" > progress.txt
    echo "# Branch: $BRANCH_NAME" >> progress.txt
    echo "# Started: $(date)" >> progress.txt
    echo "" >> progress.txt
  fi
fi
echo "$BRANCH_NAME" > "$LAST_BRANCH_FILE"

# Verify git branch matches prd.json (optional - create if needed)
CURRENT_BRANCH=$(git branch --show-current 2>/dev/null || echo "")
if [ "$CURRENT_BRANCH" != "$BRANCH_NAME" ] && [ -n "$BRANCH_NAME" ]; then
  echo "Switching to branch: $BRANCH_NAME"
  git checkout "$BRANCH_NAME" 2>/dev/null || git checkout -b "$BRANCH_NAME"
fi

echo "Max iterations: $MAX_ITERATIONS"
echo ""

for ((i=1; i<=MAX_ITERATIONS; i++)); do
  echo ""
  echo "═══════════════════════════════════════"
  echo "  Iteration $i / $MAX_ITERATIONS"
  echo "═══════════════════════════════════════"

  # Check if all stories complete before running
  INCOMPLETE=$(jq '[.stories[] | select(.passes == false)] | length' prd.json)
  if [ "$INCOMPLETE" -eq 0 ]; then
    echo ""
    echo "✓ ALL STORIES COMPLETE"
    exit 0
  fi

  # Show next story to work on
  NEXT_STORY=$(jq -r '[.stories[] | select(.passes == false)] | sort_by(.priority) | .[0] | "\(.id): \(.title)"' prd.json)
  echo "Next story: $NEXT_STORY"
  echo ""

  # Build prompt from files
  PROMPT="$(cat prompt.md)

---

## Current State

### prd.json
\`\`\`json
$(cat prd.json)
\`\`\`

### progress.txt
\`\`\`
$(cat progress.txt)
\`\`\`

### AGENTS.md
\`\`\`
$(cat AGENTS.md)
\`\`\`
"

  # Start background monitor
  (
    sleep 2
    while true; do
      pid=$(pgrep -f "codex" 2>/dev/null | head -1)
      if [ -n "$pid" ]; then
        stats=$(ps -p "$pid" -o %cpu,%mem,rss -w 2>/dev/null | tail -1)
        net=$(lsof -i -p "$pid" 2>/dev/null | wc -l | tr -d ' ')
        echo "[monitor] PID:$pid | CPU/MEM/RSS: $stats | Net: $net"
      fi
      sleep 5
    done
  ) &
  MONITOR_PID=$!

  # Run codex
  result=$(codex exec --full-auto "$PROMPT" 2>&1 | tee /dev/tty) || true

  # Kill monitor
  kill $MONITOR_PID 2>/dev/null || true

  echo ""
  echo "--- End of iteration $i ---"

  # Check for completion signal
  if [[ "$result" == *"<promise>COMPLETE</promise>"* ]]; then
    echo ""
    echo "═══════════════════════════════════════"
    echo "  ✓ ALL STORIES COMPLETE"
    echo "═══════════════════════════════════════"
    exit 0
  fi

  sleep 2
done

echo ""
echo "═══════════════════════════════════════"
echo "  ✗ Max iterations ($MAX_ITERATIONS) reached"
echo "═══════════════════════════════════════"
exit 1

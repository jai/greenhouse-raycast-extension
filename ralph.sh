#!/bin/bash
set -e

MAX_ITERATIONS="${1:-10}"

PROMPT='You are implementing a Raycast extension based on PLAN.md.

## Current Plan
'"$(cat PLAN.md)"'

## Progress So Far
'"$(cat progress.txt)"'

## Instructions
1. Review the plan and progress above
2. Pick the HIGHEST PRIORITY incomplete item from Implementation Steps
3. Implement ONLY ONE task fully (create files, write code, etc.)
4. Run `npm run build` and `npm run lint` if package.json exists
5. Fix any errors before continuing
6. Append a brief summary of what you completed to progress.txt
7. Commit your changes with a descriptive message

If ALL tasks in the plan are complete, output exactly: <promise>COMPLETE</promise>

ONLY DO ONE TASK PER ITERATION. Be thorough but focused.'

echo "=== Ralph Loop Starting ==="
echo "Max iterations: $MAX_ITERATIONS"
echo ""

for ((i=1; i<=MAX_ITERATIONS; i++)); do
  echo "=== Iteration $i / $MAX_ITERATIONS ==="

  # Rebuild prompt each iteration to get latest progress.txt
  CURRENT_PROMPT='You are implementing a Raycast extension based on PLAN.md.

## Current Plan
'"$(cat PLAN.md)"'

## Progress So Far
'"$(cat progress.txt)"'

## Instructions
1. Review the plan and progress above
2. Pick the HIGHEST PRIORITY incomplete item from Implementation Steps
3. Implement ONLY ONE task fully (create files, write code, etc.)
4. Run `npm run build` and `npm run lint` if package.json exists
5. Fix any errors before continuing
6. Append a brief summary of what you completed to progress.txt
7. Commit your changes with a descriptive message

If ALL tasks in the plan are complete, output exactly: <promise>COMPLETE</promise>

ONLY DO ONE TASK PER ITERATION. Be thorough but focused.'

  result=$(codex exec --full-auto "$CURRENT_PROMPT" 2>&1) || true

  echo "$result"

  if [[ "$result" == *"<promise>COMPLETE</promise>"* ]]; then
    echo ""
    echo "=== ALL TASKS COMPLETE ==="
    exit 0
  fi

  echo ""
  sleep 2
done

echo "=== Max iterations reached ==="
exit 1

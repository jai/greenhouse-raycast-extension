#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT_DIR"

if ! command -v node >/dev/null 2>&1; then
  echo "Node.js is not available in PATH."
  echo "Install Node.js (mise is recommended in AGENTS.md), then re-run this script."
  exit 1
fi

echo "Node: $(node --version)"
echo "npm: $(npm --version)"

if command -v mise >/dev/null 2>&1; then
  echo "mise current node: $(mise current node 2>/dev/null || echo 'unknown')"
fi

echo "Installing npm dependencies..."
npm install

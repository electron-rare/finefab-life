#!/bin/bash
set -e

echo "=== Goose Server (goosed) ==="
echo "Provider : ${GOOSE_PROVIDER:-anthropic}"
echo "Model    : ${GOOSE_MODEL:-claude-sonnet-4-20250514}"
echo "Bind     : ${GOOSE_HOST:-0.0.0.0}:${GOOSE_PORT:-3000}"

# Env vars used by goose-server configuration.rs:
#   GOOSE_HOST  (default 127.0.0.1 -> override to 0.0.0.0 for container)
#   GOOSE_PORT  (default 3000)
export GOOSE_HOST="${GOOSE_HOST:-0.0.0.0}"
export GOOSE_PORT="${GOOSE_PORT:-3000}"

if command -v goosed &>/dev/null; then
    exec goosed agent
else
    echo "ERROR: goosed binary not found in PATH"
    echo "Binaries available:"
    ls /usr/local/bin/ 2>&1 || true
    exit 1
fi

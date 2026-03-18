#!/bin/bash
set -euo pipefail

cd "$(dirname "$0")/.."

echo "Building CLI bundle with esbuild..."
node cli/build.mjs

echo "Compiling standalone binary with bun..."

# Detect current platform for default target
PLATFORM=$(uname -s | tr '[:upper:]' '[:lower:]')
ARCH=$(uname -m)
case "$ARCH" in
  x86_64) ARCH="x64" ;;
  aarch64|arm64) ARCH="arm64" ;;
esac

TARGET="${1:-$PLATFORM-$ARCH}"
OUTFILE="cli/dist/am-i-exposed-${TARGET}"

bun build cli/dist/index.js --compile --outfile "$OUTFILE"

echo ""
echo "Standalone binary: $OUTFILE"
ls -lh "$OUTFILE"
echo ""
echo "Test: $OUTFILE --version"
"$OUTFILE" --version

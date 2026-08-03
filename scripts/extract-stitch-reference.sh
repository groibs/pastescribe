#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ARCHIVE="$ROOT_DIR/stitch-reference/pastescribe-stitch-export.zip"
TARGET="$ROOT_DIR/stitch-reference/extracted"

if [[ ! -f "$ARCHIVE" ]]; then
  echo "Arquivo não encontrado: $ARCHIVE" >&2
  exit 1
fi

rm -rf "$TARGET"
mkdir -p "$TARGET"
unzip -q "$ARCHIVE" -d "$TARGET"
printf 'Referência extraída em %s\n' "$TARGET"

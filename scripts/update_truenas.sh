#!/usr/bin/env bash
set -euo pipefail

# Compatibility entry point for the documented TrueNAS command. The canonical
# updater is kept at the repository root so old installations can use either
# path without creating a second update implementation.
SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
exec bash "${SCRIPT_DIR}/update.sh" "$@"

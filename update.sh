#!/usr/bin/env bash
# ==============================================================================
# Universal Deployment Center - Automated Linux Update Script
# ==============================================================================

set -eo pipefail

APP_DIR="${APP_DIR:-$(cd "$(dirname "${BASH_SOURCE[0]}")" &>/dev/null && pwd)}"
REPO_URL="${REPO_URL:-https://github.com/DavidFFerreira/Deployment_center.git}"

echo "🚀 A atualizar o Universal Deployment Center em: $APP_DIR..."

if [ ! -d "$APP_DIR/.git" ]; then
  echo "⚠️ Pasta .git não encontrada em $APP_DIR. A inicializar repositório Git..."
  cd "$APP_DIR"
  git init
  git remote add origin "$REPO_URL" 2>/dev/null || git remote set-url origin "$REPO_URL"
  git fetch origin main
  git reset --hard origin/main
else
  cd "$APP_DIR"
  git remote set-url origin "$REPO_URL" 2>/dev/null || true
  git fetch origin main
  git reset --hard origin/main
fi

# Detect Compose command
COMPOSE_CMD="docker compose"
if ! docker compose version &>/dev/null; then
  COMPOSE_CMD="docker-compose"
fi

echo "🔄 A reconstruir imagem e reiniciar contentores..."
$COMPOSE_CMD up -d --build

PORT=$(grep -E '^PORT=' .env 2>/dev/null | cut -d '=' -f2 || echo "50000")
SERVER_IP=$(hostname -I 2>/dev/null | awk '{print $1}' || echo "127.0.0.1")

echo "✓ Universal Deployment Center atualizado e ativo em http://${SERVER_IP}:${PORT}!"

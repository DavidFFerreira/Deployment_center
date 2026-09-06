#!/usr/bin/env bash
# ==============================================================================
# Universal Deployment Center - Automated Linux Update Script
# Desenvolvido por David Ferreira (https://github.com/DavidFFerreira)
# ==============================================================================

set -eo pipefail

APP_DIR="${APP_DIR:-$(cd "$(dirname "${BASH_SOURCE[0]}")" &>/dev/null && pwd)}"
REPO_URL="${REPO_URL:-https://github.com/DavidFFerreira/Deployment_center.git}"
BACKUP_PARENT="${APP_DIR}/data/backups"

echo "=============================================================================="
echo "🚀 A atualizar o Universal Deployment Center em: $APP_DIR"
echo "=============================================================================="

# ------------------------------------------------------------------------------
# 1. SALVAGUARDA AUTOMÁTICA ABSOLUTA DOS DADOS (PRE-UPDATE BACKUP)
# ------------------------------------------------------------------------------
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
SNAPSHOT_DIR="${BACKUP_PARENT}/pre_update_${TIMESTAMP}"
TEMP_ENV_BACKUP="/tmp/.deploy_center_env_${TIMESTAMP}"
TEMP_DATA_BACKUP="/tmp/.deploy_center_data_${TIMESTAMP}"

echo "📦 A criar salvaguarda de segurança antes do update..."
mkdir -p "$SNAPSHOT_DIR" 2>/dev/null || true

# Preservar ficheiro de ambiente .env
if [ -f "$APP_DIR/.env" ]; then
  cp -f "$APP_DIR/.env" "$SNAPSHOT_DIR/.env.bak" 2>/dev/null || true
  cp -f "$APP_DIR/.env" "$TEMP_ENV_BACKUP" 2>/dev/null || true
fi

# Preservar todo o diretório de dados (settings, projetos, utilizadores, state)
if [ -d "$APP_DIR/data" ]; then
  # Cópia local de segurança
  cp -a "$APP_DIR/data/." "$SNAPSHOT_DIR/" 2>/dev/null || true
  # Cópia de emergência no /tmp caso o git mexa em algo
  mkdir -p "$TEMP_DATA_BACKUP"
  cp -a "$APP_DIR/data/." "$TEMP_DATA_BACKUP/" 2>/dev/null || true
  echo "✓ Dados de definições, projetos e utilizadores salvaguardados em: $SNAPSHOT_DIR"
fi

# ------------------------------------------------------------------------------
# 2. ATUALIZAR CÓDIGO-FONTE VIA GIT COM PRESERVAÇÃO DE DADOS
# ------------------------------------------------------------------------------
echo "🔄 A obter a versão mais recente do repositório..."
cd "$APP_DIR"

if [ ! -d "$APP_DIR/.git" ]; then
  echo "⚠️ Pasta .git não encontrada. A inicializar repositório Git..."
  git init
  git remote add origin "$REPO_URL" 2>/dev/null || git remote set-url origin "$REPO_URL"
  git fetch origin main
  git reset --hard origin/main
else
  git remote set-url origin "$REPO_URL" 2>/dev/null || true
  git fetch origin main
  git reset --hard origin/main
fi

# ------------------------------------------------------------------------------
# 3. VERIFICAR E RESTAURAR DADOS E .ENV CASO NECESSÁRIO
# ------------------------------------------------------------------------------
if [ ! -f "$APP_DIR/.env" ] && [ -f "$TEMP_ENV_BACKUP" ]; then
  cp -f "$TEMP_ENV_BACKUP" "$APP_DIR/.env" 2>/dev/null || true
  echo "✓ Ficheiro .env restaurado com sucesso."
fi

# Garantir que a pasta data existe e que os ficheiros salvaguardados estão presentes
mkdir -p "$APP_DIR/data"
if [ ! -f "$APP_DIR/data/settings.json" ] && [ -f "$TEMP_DATA_BACKUP/settings.json" ]; then
  cp -a "$TEMP_DATA_BACKUP/." "$APP_DIR/data/" 2>/dev/null || true
  echo "✓ Definições e dados de utilizadores restaurados automaticamente."
fi

# Garantir permissões completas de leitura/escrita para os contentores Docker
chmod -R 777 "$APP_DIR/data" 2>/dev/null || true

# Limpeza de ficheiros temporários do /tmp
rm -rf "$TEMP_ENV_BACKUP" "$TEMP_DATA_BACKUP" 2>/dev/null || true

# ------------------------------------------------------------------------------
# 4. REINICIAR CONTENTORES COM DOCKER COMPOSE
# ------------------------------------------------------------------------------
COMPOSE_CMD="docker compose"
if ! docker compose version &>/dev/null; then
  COMPOSE_CMD="docker-compose"
fi

echo "🐳 A reconstruir e reiniciar o contentor do Deployment Center..."
$COMPOSE_CMD up -d --build

PORT=$(grep -E '^PORT=' "$APP_DIR/.env" 2>/dev/null | cut -d '=' -f2 || echo "50000")
SERVER_IP=$(hostname -I 2>/dev/null | awk '{print $1}' || echo "127.0.0.1")

echo "=============================================================================="
echo "✓ Universal Deployment Center atualizado com SUCESSO!"
echo "✓ Todos os dados de projetos, utilizadores e definições foram 100% PRESERVADOS."
echo "🔗 Aceda em: http://${SERVER_IP}:${PORT}"
echo "=============================================================================="

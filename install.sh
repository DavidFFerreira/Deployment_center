#!/usr/bin/env bash
# ==============================================================================
# Universal Deployment Center - Automated Linux & TrueNAS Installer
# Compatible with: Ubuntu, Debian, TrueNAS SCALE, CentOS, Rocky Linux, Fedora, Alpine
# ==============================================================================

set -eo pipefail

# Visual Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m' # No Color

BANNER="
${CYAN}==============================================================================${NC}
${BOLD}${PURPLE}          🚀 UNIVERSAL DEPLOYMENT CENTER - INSTALADOR LINUX${NC}
${CYAN}==============================================================================${NC}
"

# Default Configuration
PORT="${PORT:-50000}"
INSTALL_DIR="${INSTALL_DIR:-/opt/deployment-center}"
ADMIN_PASSWORD="${ADMIN_PASSWORD:-deploy_master_admin_2026!}"
GITHUB_TOKEN="${GITHUB_TOKEN:-}"
AUTO_CONFIRM=false
REPO_URL="${REPO_URL:-https://github.com/DavidFFerreira/Deployment_center.git}"

# Helper Logging Functions
log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCESSO]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[AVISO]${NC} $1"; }
log_error() { echo -e "${RED}[ERRO]${NC} $1"; }

# Parse Command Line Arguments
while [[ "$#" -gt 0 ]]; do
  case $1 in
    -p|--port) PORT="$2"; shift ;;
    -d|--dir) INSTALL_DIR="$2"; shift ;;
    --password) ADMIN_PASSWORD="$2"; shift ;;
    --token) GITHUB_TOKEN="$2"; shift ;;
    -y|--yes|--non-interactive) AUTO_CONFIRM=true ;;
    -h|--help)
      echo "Uso: $0 [opções]"
      echo ""
      echo "Opções:"
      echo "  -p, --port <porta>       Porta HTTP do Deployment Center (Padrão: 50000)"
      echo "  -d, --dir <caminho>      Diretório de instalação (Padrão: /opt/deployment-center)"
      echo "  --password <senha>       Senha de administrador inicial"
      echo "  --token <github_token>   GitHub Personal Access Token (PAT)"
      echo "  -y, --yes                Modo não interativo (aceita todos os padrões)"
      echo "  -h, --help               Mostra esta mensagem de ajuda"
      exit 0
      ;;
    *) log_warn "Opção desconhecida: $1"; ;;
  esac
  shift
done

echo -e "$BANNER"

# 1. Check Root Privileges
if [[ $EUID -ne 0 ]]; then
  log_error "Este instalador requer privilégios de root ou sudo."
  log_info "Execute novamente com: sudo bash $0"
  exit 1
fi

log_info "A iniciar verificação do ambiente Linux / TrueNAS SCALE..."

# 2. Detect OS & Package Manager
OS="unknown"
PKG_MANAGER="unknown"

if [[ -f /etc/os-release ]]; then
  . /etc/os-release
  OS=$ID
elif [[ -f /etc/debian_version ]]; then
  OS="debian"
elif [[ -f /etc/redhat-release ]]; then
  OS="rhel"
fi

if command -v apt-get &>/dev/null; then
  PKG_MANAGER="apt"
elif command -v dnf &>/dev/null; then
  PKG_MANAGER="dnf"
elif command -v yum &>/dev/null; then
  PKG_MANAGER="yum"
elif command -v pacman &>/dev/null; then
  PKG_MANAGER="pacman"
elif command -v apk &>/dev/null; then
  PKG_MANAGER="apk"
fi

log_info "Sistema Operativo Detetado: ${BOLD}$OS${NC} (Gestor de Pacotes: $PKG_MANAGER)"

# 3. Check and Install Essential Dependencies (curl, git, tar, ca-certificates)
install_packages() {
  log_info "A instalar dependências essenciais (curl, git, tar, ca-certificates)..."
  case $PKG_MANAGER in
    apt)
      export DEBIAN_FRONTEND=noninteractive
      apt-get update -qq && apt-get install -y -qq curl git tar ca-certificates &>/dev/null || true
      ;;
    dnf|yum)
      $PKG_MANAGER install -y -q curl git tar ca-certificates &>/dev/null || true
      ;;
    pacman)
      pacman -Sy --noconfirm curl git tar ca-certificates &>/dev/null || true
      ;;
    apk)
      apk update && apk add --no-cache curl git tar ca-certificates &>/dev/null || true
      ;;
  esac
}

install_packages

# 4. Check Docker & Docker Compose
install_docker() {
  if ! command -v docker &>/dev/null; then
    log_warn "Docker não encontrado. A instalar Docker oficial..."
    curl -fsSL https://get.docker.com | sh
    systemctl enable --now docker 2>/dev/null || service docker start 2>/dev/null || true
    log_success "Docker instalado com sucesso."
  else
    log_success "Docker já se encontra instalado: $(docker --version)"
  fi

  # Check Docker Compose (v2 plugin or standalone)
  local has_compose=false
  if docker compose version &>/dev/null; then
    has_compose=true
    log_success "Docker Compose v2 detetado: $(docker compose version)"
  elif command -v docker-compose &>/dev/null; then
    has_compose=true
    log_success "Docker Compose clássico detetado: $(docker-compose --version)"
  fi

  if [ "$has_compose" = false ]; then
    log_warn "Docker Compose não detetado. A descarregar plugin oficial Compose v2..."
    DOCKER_CONFIG=${DOCKER_CONFIG:-/usr/local/lib/docker/cli-plugins}
    mkdir -p "$DOCKER_CONFIG" /root/.docker/cli-plugins
    curl -sSL https://github.com/docker/compose/releases/download/v2.29.7/docker-compose-linux-x86_64 -o "$DOCKER_CONFIG/docker-compose"
    chmod +x "$DOCKER_CONFIG/docker-compose"
    ln -sf "$DOCKER_CONFIG/docker-compose" /usr/local/bin/docker-compose || true
    ln -sf "$DOCKER_CONFIG/docker-compose" /root/.docker/cli-plugins/docker-compose || true
    log_success "Docker Compose v2 instalado com sucesso."
  fi
}

install_docker

# 5. Check if Target Port is in Use
if ss -tuln 2>/dev/null | grep -q ":$PORT "; then
  log_warn "A porta $PORT já se encontra em escuta neste servidor."
  if [ "$AUTO_CONFIRM" = false ]; then
    read -rp "Deseja continuar mesmo assim ou substituir o contentor existente? (s/N): " CONFIRM_PORT
    if [[ ! "$CONFIRM_PORT" =~ ^[sSyY]$ ]]; then
      log_error "Instalação interrompida pelo utilizador. Escolha outra porta com: --port <número>"
      exit 1
    fi
  fi
fi

# 6. Prepare Destination Directory
log_info "A configurar pasta de instalação em: ${BOLD}$INSTALL_DIR${NC}"
mkdir -p "$INSTALL_DIR"

if [ -d "$INSTALL_DIR/.git" ]; then
  log_info "Repositório existente detetado. A atualizar ficheiros..."
  cd "$INSTALL_DIR"
  git fetch origin main || true
  git reset --hard origin/main || true
else
  # If running from inside the cloned repo
  CURRENT_SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" &>/dev/null && pwd)"
  if [ -f "$CURRENT_SCRIPT_DIR/server.js" ] && [ "$CURRENT_SCRIPT_DIR" != "$INSTALL_DIR" ]; then
    log_info "A copiar ficheiros do diretório atual para $INSTALL_DIR..."
    cp -rf "$CURRENT_SCRIPT_DIR"/* "$INSTALL_DIR"/
    cp -rf "$CURRENT_SCRIPT_DIR"/.* "$INSTALL_DIR"/ 2>/dev/null || true
    cd "$INSTALL_DIR"
  elif [ ! -f "$INSTALL_DIR/server.js" ]; then
    log_info "A clonar o repositório oficial do Universal Deployment Center..."
    git clone "$REPO_URL" "$INSTALL_DIR"
    cd "$INSTALL_DIR"
  else
    cd "$INSTALL_DIR"
  fi
fi

# 7. Configure Environment & Data Directory
mkdir -p "$INSTALL_DIR/data" "$INSTALL_DIR/data/backups"
chmod -R 755 "$INSTALL_DIR/data"

cat <<EOF > "$INSTALL_DIR/.env"
PORT=$PORT
DEPLOYER_ADMIN_PASSWORD=$ADMIN_PASSWORD
GITHUB_TOKEN=$GITHUB_TOKEN
APP_DIR=$INSTALL_DIR
DATA_DIR=$INSTALL_DIR/data
NODE_ENV=production
EOF

# Ensure docker-compose.yml reflects the target port
if [ -f "$INSTALL_DIR/docker-compose.yml" ]; then
  sed -i "s/\"[0-9]*:50000\"/\"$PORT:50000\"/g" "$INSTALL_DIR/docker-compose.yml" 2>/dev/null || true
fi

# 8. Start Container Stack
log_info "A iniciar o contentor do Universal Deployment Center na porta ${BOLD}$PORT${NC}..."

COMPOSE_CMD="docker compose"
if ! docker compose version &>/dev/null; then
  COMPOSE_CMD="docker-compose"
fi

$COMPOSE_CMD -f "$INSTALL_DIR/docker-compose.yml" down --remove-orphans 2>/dev/null || true
$COMPOSE_CMD -f "$INSTALL_DIR/docker-compose.yml" up -d --build

# 9. Healthcheck Validation
log_info "A validar prontidão do serviço em http://localhost:$PORT..."
HEALTHY=false
for i in {1..30}; do
  if curl -s -f "http://127.0.0.1:$PORT/login" &>/dev/null || curl -s -f "http://localhost:$PORT/login" &>/dev/null; then
    HEALTHY=true
    break
  fi
  sleep 1
done

# Detect Host IP
SERVER_IP=$(hostname -I 2>/dev/null | awk '{print $1}' || echo "127.0.0.1")

if [ "$HEALTHY" = true ]; then
  echo ""
  echo -e "${GREEN}==============================================================================${NC}"
  echo -e "${BOLD}${GREEN}  ✓ UNIVERSAL DEPLOYMENT CENTER INSTALADO E EM EXECUÇÃO COM SUCESSO!${NC}"
  echo -e "${GREEN}==============================================================================${NC}"
  echo ""
  echo -e "  🌐 ${BOLD}URL de Acesso:${NC}     ${CYAN}http://${SERVER_IP}:${PORT}/${NC}"
  echo -e "  👤 ${BOLD}Utilizador:${NC}        ${YELLOW}admin${NC}"
  echo -e "  🔑 ${BOLD}Palavra-passe:${NC}     ${YELLOW}${ADMIN_PASSWORD}${NC}"
  echo -e "  📂 ${BOLD}Diretório Base:${NC}    ${BLUE}${INSTALL_DIR}${NC}"
  echo ""
  echo -e "${BOLD}Comandos Úteis de Gestão:${NC}"
  echo -e "  Ver registos ao vivo:  ${CYAN}cd ${INSTALL_DIR} && ${COMPOSE_CMD} logs -f${NC}"
  echo -e "  Reiniciar serviço:     ${CYAN}cd ${INSTALL_DIR} && ${COMPOSE_CMD} restart${NC}"
  echo -e "  Atualizar versão:      ${CYAN}cd ${INSTALL_DIR} && ./update.sh${NC}"
  echo ""
  echo -e "${GREEN}==============================================================================${NC}"
else
  log_warn "O serviço foi iniciado mas demorou mais de 30s a responder ao healthcheck HTTP."
  log_info "Consulte os logs com: cd $INSTALL_DIR && $COMPOSE_CMD logs -f"
fi

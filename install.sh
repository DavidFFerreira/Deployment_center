#!/usr/bin/env bash
# ==============================================================================
#  _   _       _                               _   ____             _               
# | | | |_ __ (_)_   _____ _ __ ___  __ _     | | |  _ \  ___ _ __ | | ___  _   _   
# | | | | '_ \| \ \ / / _ \ '__/ __|/ _` |    | | | | | |/ _ \ '_ \| |/ _ \| | | |  
# | |_| | | | | |\ V /  __/ |  \__ \ (_| |    | | | |_| |  __/ |_) | | (_) | |_| |  
#  \___/|_| |_|_| \_/ \___|_|  |___/\__,_|    |_| |____/ \___| .__/|_|\___/ \__, |  
#                                                            |_|            |___/   
#
#   🚀 UNIVERSAL DEPLOYMENT CENTER - INSTALADOR OFICIAL
#   Desenvolvido com mestria e café por: David Ferreira
#   GitHub Oficial: https://github.com/DavidFFerreira
# ==============================================================================
# AVISO DE DIREITOS DE AUTOR E PROPRIEDADE INTELECTUAL:
# Software Proprietário de David Ferreira. Proibida a reprodução, venda,
# sublicenciamento ou partilha pública não autorizada ao abrigo da:
# - Convenção de Berna (Artigos 2.º e 9.º)
# - Tratado da OMPI/WIPO sobre Direito de Autor (WCT)
# - Acordo TRIPS / ADPIC da OMC (Artigo 10.º)
# - Diretiva 2009/24/CE e Diretiva (UE) 2019/790 do Parlamento Europeu
# - Código do Direito de Autor e dos Direitos Conexos (CDADC - Portugal)
# ==============================================================================

set -eo pipefail

# Paleta de Cores ANSI
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
WHITE='\033[1;37m'
BOLD='\033[1m'
NC='\033[0m' # Sem Cor

clear 2>/dev/null || true

echo -e "${PURPLE}╔══════════════════════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${PURPLE}║${BOLD}${WHITE}               🚀 UNIVERSAL DEPLOYMENT CENTER - INSTALADOR LINUX               ${NC}${PURPLE}║${NC}"
echo -e "${PURPLE}╠══════════════════════════════════════════════════════════════════════════════════╣${NC}"
echo -e "${PURPLE}║${NC}  👤 ${BOLD}Lead Developer:${NC}  ${CYAN}David Ferreira${NC}                                              ${PURPLE}║${NC}"
echo -e "${PURPLE}║${NC}  🔗 ${BOLD}GitHub Perfil:${NC}   ${BLUE}https://github.com/DavidFFerreira${NC}                         ${PURPLE}║${NC}"
echo -e "${PURPLE}║${NC}  🛡️  ${BOLD}Licença:${NC}         ${YELLOW}Proprietária & Reservada (Convenção de Berna / CDADC)${NC}      ${PURPLE}║${NC}"
echo -e "${PURPLE}╚══════════════════════════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Configurações Padrão
PORT="${PORT:-50000}"
INSTALL_DIR="${INSTALL_DIR:-/opt/deployment-center}"
ADMIN_PASSWORD="${ADMIN_PASSWORD:-deploy_master_admin_2026!}"
GITHUB_TOKEN="${GITHUB_TOKEN:-}"
AUTO_CONFIRM=false
REPO_URL="${REPO_URL:-https://github.com/DavidFFerreira/Deployment_center.git}"

# Mensagens com Personalidade e Estilo
log_step()    { echo -e "\n${BOLD}${CYAN}==>${NC} ${BOLD}$1${NC}"; }
log_info()    { echo -e "  ${BLUE}ℹ${NC}  $1"; }
log_fun()     { echo -e "  ${PURPLE}✨${NC} $1"; }
log_success() { echo -e "  ${GREEN}✔${NC}  $1"; }
log_warn()    { echo -e "  ${YELLOW}⚠${NC}  ${YELLOW}$1${NC}"; }
log_error()   { echo -e "  ${RED}✖${NC}  ${BOLD}${RED}$1${NC}"; }

# Leitura de Argumentos da Linha de Comandos
while [[ "$#" -gt 0 ]]; do
  case $1 in
    -p|--port) PORT="$2"; shift ;;
    -d|--dir) INSTALL_DIR="$2"; shift ;;
    --password) ADMIN_PASSWORD="$2"; shift ;;
    --token) GITHUB_TOKEN="$2"; shift ;;
    -y|--yes|--non-interactive) AUTO_CONFIRM=true ;;
    -h|--help)
      echo -e "${BOLD}Uso:${NC} sudo bash $0 [opções]"
      echo ""
      echo -e "${BOLD}Opções:${NC}"
      echo -e "  ${CYAN}-p, --port <porta>${NC}       Porta HTTP do Deployment Center (Padrão: 50000)"
      echo -e "  ${CYAN}-d, --dir <caminho>${NC}      Diretório de instalação (Padrão: /opt/deployment-center)"
      echo -e "  ${CYAN}--password <senha>${NC}       Palavra-passe do utilizador admin inicial"
      echo -e "  ${CYAN}--token <github_pat>${NC}     GitHub Personal Access Token (PAT)"
      echo -e "  ${CYAN}-y, --yes${NC}                Modo automático não interativo"
      echo -e "  ${CYAN}-h, --help${NC}               Mostra esta ajuda simpática"
      echo ""
      echo -e "${YELLOW}Criado com carinho por David Ferreira:${NC} https://github.com/DavidFFerreira"
      exit 0
      ;;
    *) log_warn "Opção desconhecida ignorada: $1"; ;;
  esac
  shift
done

# 1. Verificação de Root / Sudo
log_step "Passo 1/6: A verificar credenciais de super-herói (Root / Sudo)..."
if [[ $EUID -ne 0 ]]; then
  log_error "Ops! O Linux precisa de poderes de administrador para orquestrar contentores."
  log_info "Por favor execute novamente com: ${BOLD}sudo bash $0${NC}"
  echo -e "Dica do David Ferreira: o Docker adora privilégios de root! 😉"
  exit 1
fi
log_success "Privilégios de Root confirmados! O tapete vermelho está estendido."

# 2. Deteção do Sistema Operativo
log_step "Passo 2/6: A farejar a sua distribuição Linux..."
OS="Linux Genérico"
PKG_MANAGER="desconhecido"

if [[ -f /etc/os-release ]]; then
  . /etc/os-release
  OS="${PRETTY_NAME:-$ID}"
fi

if command -v apt-get &>/dev/null; then PKG_MANAGER="apt";
elif command -v dnf &>/dev/null; then PKG_MANAGER="dnf";
elif command -v yum &>/dev/null; then PKG_MANAGER="yum";
elif command -v pacman &>/dev/null; then PKG_MANAGER="pacman";
elif command -v apk &>/dev/null; then PKG_MANAGER="apk";
fi

log_fun "Distribuição detetada: ${BOLD}${WHITE}$OS${NC} (Gestor de pacotes: ${CYAN}$PKG_MANAGER${NC})"

# 3. Instalação de Utilitários Base
log_step "Passo 3/6: A afinar as ferramentas básicas (curl, git, ca-certificates)..."
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
log_success "Ferramentas essenciais prontas e afiadas como um relógio suíço!"

# 4. Verificação e Instalação do Docker e Compose
log_step "Passo 4/6: A verificar a presença das baleias (Docker & Docker Compose)..."
if ! command -v docker &>/dev/null; then
  log_warn "Docker não encontrado! Não entre em pânico: o instalador vai resolver isso..."
  log_fun "A descarregar o instalador oficial do Docker da Docker Inc..."
  curl -fsSL https://get.docker.com | sh
  systemctl enable --now docker 2>/dev/null || service docker start 2>/dev/null || true
  log_success "Docker instalado e a ronronar no sistema!"
else
  log_success "Docker já estava presente: $(docker --version | head -n1)"
fi

# Validar Docker Compose v2
HAS_COMPOSE=false
if docker compose version &>/dev/null; then
  HAS_COMPOSE=true
  log_success "Docker Compose v2 detetado: $(docker compose version | head -n1)"
elif command -v docker-compose &>/dev/null; then
  HAS_COMPOSE=true
  log_success "Docker Compose clássico detetado: $(docker-compose --version | head -n1)"
fi

if [ "$HAS_COMPOSE" = false ]; then
  log_fun "A instalar o plugin oficial Docker Compose v2..."
  DOCKER_CONFIG=${DOCKER_CONFIG:-/usr/local/lib/docker/cli-plugins}
  mkdir -p "$DOCKER_CONFIG" /root/.docker/cli-plugins
  curl -sSL https://github.com/docker/compose/releases/download/v2.29.7/docker-compose-linux-x86_64 -o "$DOCKER_CONFIG/docker-compose"
  chmod +x "$DOCKER_CONFIG/docker-compose"
  ln -sf "$DOCKER_CONFIG/docker-compose" /usr/local/bin/docker-compose || true
  ln -sf "$DOCKER_CONFIG/docker-compose" /root/.docker/cli-plugins/docker-compose || true
  log_success "Plugin Docker Compose v2 instalado com distinção!"
fi

# 5. Validação de Conflito de Porta
log_step "Passo 5/6: A inspecionar o radar de portas (Porta Alvo: $PORT)..."
if ss -tuln 2>/dev/null | grep -q ":$PORT "; then
  log_warn "Atenção: A porta $PORT já está ocupada por outro processo no servidor."
  if [ "$AUTO_CONFIRM" = false ]; then
    read -rp "  Deseja que o instalador tente reiniciar/substituir o contentor na porta $PORT? (s/N): " CONFIRM_PORT
    if [[ ! "$CONFIRM_PORT" =~ ^[sSyY]$ ]]; then
      log_error "Instalação cancelada. Sugestão do David: use --port 50001 ou outra porta livre!"
      exit 1
    fi
  fi
else
  log_success "Porta $PORT livre e desimpedida para descolagem!"
fi

# 6. Preparação dos Ficheiros & Arranque da Stack
log_step "Passo 6/6: A preparar o hangar em: $INSTALL_DIR..."
mkdir -p "$INSTALL_DIR"

if [ -d "$INSTALL_DIR/.git" ]; then
  log_info "Repositório existente detetado em $INSTALL_DIR. A sincronizar novidades..."
  cd "$INSTALL_DIR"
  git fetch origin main || true
  git reset --hard origin/main || true
else
  CURRENT_SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" &>/dev/null && pwd)"
  if [ -f "$CURRENT_SCRIPT_DIR/server.js" ] && [ "$CURRENT_SCRIPT_DIR" != "$INSTALL_DIR" ]; then
    log_info "A copiar ficheiros da pasta atual para $INSTALL_DIR..."
    cp -rf "$CURRENT_SCRIPT_DIR"/* "$INSTALL_DIR"/
    cp -rf "$CURRENT_SCRIPT_DIR"/.* "$INSTALL_DIR"/ 2>/dev/null || true
    cd "$INSTALL_DIR"
  elif [ ! -f "$INSTALL_DIR/server.js" ]; then
    log_fun "A descarregar o repositório oficial de David Ferreira..."
    git clone "$REPO_URL" "$INSTALL_DIR"
    cd "$INSTALL_DIR"
  else
    cd "$INSTALL_DIR"
  fi
fi

mkdir -p "$INSTALL_DIR/data" "$INSTALL_DIR/data/backups"
chmod -R 755 "$INSTALL_DIR/data"

# Gerar .env
cat <<EOF > "$INSTALL_DIR/.env"
PORT=$PORT
DEPLOYER_ADMIN_PASSWORD=$ADMIN_PASSWORD
GITHUB_TOKEN=$GITHUB_TOKEN
APP_DIR=$INSTALL_DIR
DATA_DIR=$INSTALL_DIR/data
NODE_ENV=production
EOF

log_fun "A construir a imagem Docker e a subir os contentores (pode demorar 1 minutinho)..."

COMPOSE_CMD="docker compose"
if ! docker compose version &>/dev/null; then COMPOSE_CMD="docker-compose"; fi

$COMPOSE_CMD -f "$INSTALL_DIR/docker-compose.yml" down --remove-orphans 2>/dev/null || true
$COMPOSE_CMD -f "$INSTALL_DIR/docker-compose.yml" up -d --build

# Healthcheck
log_info "A validar se o Deployment Center já está a responder aos pedidos..."
HEALTHY=false
for i in {1..35}; do
  if curl -s -f "http://127.0.0.1:$PORT/login" &>/dev/null || curl -s -f "http://localhost:$PORT/login" &>/dev/null; then
    HEALTHY=true
    break
  fi
  sleep 1
done

SERVER_IP=$(hostname -I 2>/dev/null | awk '{print $1}' || echo "127.0.0.1")

if [ "$HEALTHY" = true ]; then
  echo ""
  echo -e "${GREEN}╔══════════════════════════════════════════════════════════════════════════════════╗${NC}"
  echo -e "${GREEN}║${BOLD}${WHITE}     🎉 PARABÉNS! O UNIVERSAL DEPLOYMENT CENTER ESTÁ OFICIALMENTE ATIVO!      ${NC}${GREEN}║${NC}"
  echo -e "${GREEN}╚══════════════════════════════════════════════════════════════════════════════════╝${NC}"
  echo ""
  echo -e "  🌐 ${BOLD}URL de Acesso:${NC}       ${CYAN}http://${SERVER_IP}:${PORT}/${NC}"
  echo -e "  👤 ${BOLD}Utilizador:${NC}          ${YELLOW}admin${NC}"
  echo -e "  🔑 ${BOLD}Palavra-passe:${NC}       ${YELLOW}${ADMIN_PASSWORD}${NC}"
  echo -e "  📂 ${BOLD}Pasta no Servidor:${NC}   ${BLUE}${INSTALL_DIR}${NC}"
  echo -e "  👨‍💻 ${BOLD}Desenvolvido por:${NC}    ${PURPLE}David Ferreira${NC} (${BLUE}https://github.com/DavidFFerreira${NC})"
  echo ""
  echo -e "${BOLD}Comandos Rápidos do Seu Novo Superpoder:${NC}"
  echo -e "  • Acompanhar logs:       ${CYAN}cd ${INSTALL_DIR} && ${COMPOSE_CMD} logs -f${NC}"
  echo -e "  • Reiniciar o painel:    ${CYAN}cd ${INSTALL_DIR} && ${COMPOSE_CMD} restart${NC}"
  echo -e "  • Atualizar tudo com 1 clique: ${CYAN}cd ${INSTALL_DIR} && ./update.sh${NC}"
  echo ""
  echo -e "${YELLOW}⚖️  AVISO LEGAL INTERNACIONAL:${NC}"
  echo -e "   Software proprietário de David Ferreira. Proibida a redistribuição, venda"
  echo -e "   ou partilha sem autorização expressa (Convenção de Berna, TRIPS, CDADC)."
  echo ""
  echo -e "${PURPLE}⭐ Se gostou, dê uma estrela no repositório: https://github.com/DavidFFerreira/Deployment_center${NC}"
  echo ""
else
  log_warn "O contentor iniciou mas o teste de resposta HTTP demorou mais do que o habitual."
  log_info "Pode verificar o progresso com o comando: cd $INSTALL_DIR && $COMPOSE_CMD logs -f"
fi

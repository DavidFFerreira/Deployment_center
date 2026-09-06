# Universal Deployment Center

Painel de Controlo Universal, Orquestração de Containers Docker, Gestão de Stacks, Base de Dados, Storage e Terminal Remoto para TrueNAS Scale.

---

## ?? Funcionalidades

- **Multi-Stack & Multi-Ambientes**: Gestão de Produção e Staging para múltiplos projetos simultâneos.
- **Gama de Portas 50XXX**: Execução isolada na porta `50000` sem conflitos com stacks locais.
- **Auto-Descoberta Universal**: Deteta automaticamente repositórios e stacks em `/mnt/*/apps` (`suavit-portal`, `teste`, etc.).
- **Deploy & Rollback com 1 Clique**: Histórico de commits, visualização de diffs e reversão instantânea de versões.
- **Terminal Shell Integrado**: Acesso direto ao host TrueNAS e aos contentores em tempo real.
- **Gestor de Backups & Restauro**: Backups automáticos e pontuais de PostgreSQL com restauro assistido.
- **Storage Manager**: Gestão visual de buckets e ficheiros.

---

## ?? Como Executar

### 1. Requisitos
- Docker e Docker Compose instalados no host
- Acesso ao socket `/var/run/docker.sock`

### 2. Arranque com Docker Compose
```bash
docker compose up -d --build
```

O painel fica acessível em:
```
http://<IP_DO_SERVIDOR>:50000/
```

### 3. Atualização Rápida no TrueNAS
```bash
curl -fsSL https://raw.githubusercontent.com/DavidFFerreira/Deployment_center/main/update_truenas.sh | bash
```

---

## ?? Segurança e Autenticação
- Autenticação baseada em HMAC seguro com cookies HttpOnly.
- Suporte a múltiplos utilizadores locais e auditoria de ações.


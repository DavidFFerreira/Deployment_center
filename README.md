<div align="center">

# 🚀 Universal Deployment Center
### Painel Centralizado de Orquestração Docker, Dual-Stack (Produção & Staging), Supabase On-Premise, Base de Dados, Storage e Governança de Agentes de IA para Servidores Linux

[![Node.js Version](https://img.shields.io/badge/node-%3E%3D20.0.0-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Docker Compose](https://img.shields.io/badge/docker_compose-v2.29+-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://docs.docker.com/compose/)
[![Linux Compatible](https://img.shields.io/badge/Linux-Ubuntu%20%7C%20Debian%20%7C%20RHEL%20%7C%20Alpine-FCC624?style=for-the-badge&logo=linux&logoColor=black)](https://www.kernel.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15%20%2F%2016-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Supabase Self-Hosted](https://img.shields.io/badge/Supabase-On--Premise-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)
[![Kong Gateway](https://img.shields.io/badge/Kong_Gateway-2.8.1-002F38?style=for-the-badge&logo=kong&logoColor=white)](https://konghq.com/)
[![Developer: David Ferreira](https://img.shields.io/badge/Developer-David%20Ferreira-4F46E5?style=for-the-badge&logo=github&logoColor=white)](https://github.com/DavidFFerreira)
[![License: All Rights Reserved](https://img.shields.io/badge/License-All%20Rights%20Reserved%20(Proprietary)-red?style=for-the-badge&logo=shield)](LICENSE)

<br/>

<p align="center">
  <b>O ecossistema definitivo para hospedar, orquestrar, manter e governar stacks completas de aplicações modernas com Supabase local e agentes de Inteligência Artificial em qualquer servidor Linux.</b>
</p>

[Instalação Rápida](#-instalação-rápida-em-qualquer-servidor-linux) •
[Visão Geral](#-visão-geral) •
[Funcionalidades com Capturas de Ecrã](#-todas-as-funcionalidades-com-capturas-de-ecrã) •
[Arquitetura de Contentores](#-arquitetura-de-contentores-16-contentores-por-stack) •
[Prompt de Arquitetura para IA](#-prompt-para-explicar-a-arquitetura-de-contentores-a-uma-ia) •
[Governança de IA](#-governança-de-ia-como-funcionam-as-skills-e-as-regras) •
[API RESTful & Integração SaaS](#-api-restful-m2m-para-integração-com-saas--aplicações-externas) •
[Como Obter os IDs dos Projetos](#2-como-listar-e-obter-os-ids-de-todos-os-projetos--tenants) •
[Guia Passo a Passo](#-guia-passo-a-passo-how-to) •
[Mapeamento de Portas](#-esquema-de-portas-e-isolamento) •
[Aviso Legal & Direitos de Autor](#-aviso-legal-propriedade-intelectual--direitos-de-autor)

---

</div>

## ⚡ Instalação Rápida em Qualquer Servidor Linux

Pode instalar o **Universal Deployment Center** em qualquer distribuição Linux (Ubuntu, Debian, CentOS, Rocky Linux, Fedora, Alpine) com apenas um comando interativo e visual:

```bash
curl -fsSL https://raw.githubusercontent.com/DavidFFerreira/Deployment_center/main/install.sh | sudo bash
```

### O que o `install.sh` faz automaticamente por si:
1. **Deteta a Distribuição Linux & Gestor de Pacotes** (`apt`, `dnf`, `yum`, `pacman`, `apk`).
2. **Verifica e Instala Dependências**: Garante a presença de `curl`, `git`, `ca-certificates` e `tar`.
3. **Garante o Docker & Docker Compose**: Se o Docker ou o plugin Docker Compose v2 não estiverem instalados, descarrega e instala as versões oficiais automaticamente.
4. **Configura o Ambiente e Diretórios**: Cria a estrutura em `/opt/deployment-center` e gera o ficheiro `.env` seguro.
5. **Inicia o Contentor**: Constrói e inicializa a stack isolada com `docker compose up -d --build`.
6. **Executa Healthcheck HTTP**: Testa a resposta do serviço na porta indicada e exibe um sumário com URL de acesso e credenciais de administrador.

### Opções Avançadas do `install.sh`

Pode personalizar parâmetros passando flags ao instalador:

```bash
# Exemplo 1: Instalação não interativa numa porta personalizada (ex: 51000)
curl -fsSL https://raw.githubusercontent.com/DavidFFerreira/Deployment_center/main/install.sh | sudo bash -s -- --port 51000 --password "MinhaSenhaForte2026!" -y

# Exemplo 2: Clonar e executar localmente com diretório customizado
git clone https://github.com/DavidFFerreira/Deployment_center.git /opt/deployment-center
cd /opt/deployment-center
sudo bash install.sh --port 50000 --dir /opt/deployment-center --yes
```

#### Tabela de Argumentos Disponíveis:
| Parâmetro | Padrão | Descrição |
|---|---|---|
| `-p, --port <porta>` | `50000` | Porta HTTP em que o painel web ficará acessível |
| `-d, --dir <caminho>` | `/opt/deployment-center` | Diretório no servidor onde os ficheiros residirão |
| `--password <senha>` | Gerada / `deploy_master_admin_2026!` | Palavra-passe do utilizador inicial `admin` |
| `--token <github_pat>` | Vazio | GitHub Personal Access Token para deploys e backups |
| `-y, --yes` | `false` | Modo não interativo (aceita confirmações automaticamente) |
| `-h, --help` | - | Mostra o menu de ajuda do instalador |

---

## 🌐 Visão Geral

O **Universal Deployment Center (v3.0)** é uma plataforma unificada de DevOps on-premise desenvolvida para servidores e ambientes **Linux**. Ele transforma qualquer servidor dedicado, VPS ou máquina local numa verdadeira infraestrutura *PaaS (Platform as a Service)* semelhante a um Supabase Cloud + Vercel auto-hospedado.

Com um clique no painel web ou através da API RESTful M2M, o Deployment Center gera ecossistemas isolados **Dual-Stack (Produção Oficial e Ambiente de Testes/Staging)**, equipados com persistência relacional PostgreSQL, API REST PostgREST automática, Autenticação GoTrue com JWT, Storage de ficheiros com suporte S3/MinIO, painel Supabase Studio e roteamento unificado Kong API Gateway.

Além disso, introduz uma camada de **Governança de Agentes de IA**, permitindo injetar dinamicamente diretivas arquiteturais (`.agents/rules/`) e bibliotecas de conhecimento técnico especializado (`.agents/skills/`) diretamente nos repositórios GitHub, garantindo que programadores e IAs (Cursor, Lovable, Claude Code, Antigravity) cumpram normas rigorosas de código, segurança RLS, zero-mock e conformidade jurídica.

---

## 📸 Todas as Funcionalidades (com Capturas de Ecrã)

Todas as funcionalidades descritas abaixo foram capturadas diretamente da interface gráfica do próprio Deployment Center.

---

### 1. 🛡️ Autenticação Segura & Ecrã de Login

<p align="center">
  <a href="https://github.com/DavidFFerreira/Deployment_center/blob/main/docs/images/01_login.png" target="_blank" rel="noopener noreferrer">
    <img src="https://github.com/DavidFFerreira/Deployment_center/blob/main/docs/images/01_login.png?raw=true" alt="Ecrã de Login Seguro" width="90%" />
  </a>
</p>

* **Segurança Criptográfica**: Autenticação com proteção HMAC SHA-256 e cookies `HttpOnly` com validade alargada.
* **Múltiplos Níveis de Acesso**: Suporte a utilizadores locais em JSON com hash seguro (`pgcrypto`/`bcrypt`) e auditoria de último acesso.
* **Proteção contra Brute Force**: Limitação de tentativas e mitigação de injeção SQL nos formulários de autenticação.
* **Interface Responsiva**: Design moderno em tons escuros (*dark glassmorphism*) otimizado para desktop, tablets e smartphones.

---

### 2. 🚀 Gestão de Versões, Commits Git & Deploys Dual-Stack

<p align="center">
  <a href="https://github.com/DavidFFerreira/Deployment_center/blob/main/docs/images/02_dashboard_versions.png" target="_blank" rel="noopener noreferrer">
    <img src="https://github.com/DavidFFerreira/Deployment_center/blob/main/docs/images/02_dashboard_versions.png?raw=true" alt="Painel de Versões e Deploys" width="90%" />
  </a>
</p>

* **Painel Dual-Stack em Tempo Real**: Monitorização lado a lado da **Versão Ativa de Produção** e da **Versão Ativa de Testes (Staging)** com indicação de porta, commit SHA, autor, data e mensagem.
* **Histórico de Commits Sincronizado**: Integração nativa com a API do GitHub com cache inteligente para listar commits com SHAs curtos, mensagens e autor.
* **Deploy Independente em 1 Clique**:
  * Botão **Testes**: Efetua o build e deploy instantâneo do commit selecionado no ambiente de Staging.
  * Botão **Produção**: Atualiza o ambiente oficial de produção.
* **Promoção Assistida (Staging ➔ Produção)**: Botão de promoção direta com modal de confirmação para levar a versão validada em testes para produção sem refazer builds.
* **Rollback Instantâneo**: Botão de reversão imediata para a versão anterior guardada em caso de anomalias detetadas.
* **Inspeção de Diffs & Commits**: Modal de detalhes para inspecionar os ficheiros modificados e o hash completo antes de aprovar o deploy.
* **Pré-visualização e Links Rápidos**: Botões diretos para aceder aos portais web ativos ou inspecionar os seus logs em tempo real.

---

### 3. 🐳 Orquestrador de Contentores Docker (16 Contentores por Stack)

<p align="center">
  <a href="https://github.com/DavidFFerreira/Deployment_center/blob/main/docs/images/03_containers_orchestrator.png" target="_blank" rel="noopener noreferrer">
    <img src="https://github.com/DavidFFerreira/Deployment_center/blob/main/docs/images/03_containers_orchestrator.png?raw=true" alt="Orquestrador de Contentores Docker" width="90%" />
  </a>
</p>

* **Supervisão Holística dos Contentores**: Monitoriza todos os contentores em execução criados pelo projeto, agrupados por ambiente (Produção e Staging).
* **Métricas de Recursos em Tempo Real**: Leitura do estado de saúde (*Healthy* / *Running* / *Exited*), mapeamento exato de portas no host e tempo de uptime.
* **Ações Rápidas por Contentor**:
  * **Reiniciar**: Reinicia um contentor individual (ex: apenas o PostgREST ou apenas a API de Auth).
  * **Logs**: Abre uma gaveta flutuante com o streaming dos últimos registos do contentor para diagnóstico veloz.
* **Botão Reiniciar Stack Completa**: Executa uma reinicialização sequencial ordenada de todos os contentores da stack para recuperar dependências de rede sem interrupções manuais.
* **Auto-Reparação de Stack**: Mecanismo que verifica a presença do socket Docker e recria redes ou dependências ausentes automaticamente.

---

### 4. 💻 Terminal Remoto Bash & Ferramentas de Manutenção

<p align="center">
  <a href="https://github.com/DavidFFerreira/Deployment_center/blob/main/docs/images/04_terminal_shell.png" target="_blank" rel="noopener noreferrer">
    <img src="https://github.com/DavidFFerreira/Deployment_center/blob/main/docs/images/04_terminal_shell.png?raw=true" alt="Terminal Shell Integrado" width="90%" />
  </a>
</p>

* **Shell Bash Integrado**: Consola web no navegador que executa comandos diretamente no host Linux ou dentro do contentor do Deployment Center.
* **Streaming de Saída**: Visualização em tempo real de fluxos de saída padrão (*stdout*) e erros (*stderr*).
* **Botões de Ação Rápida**:
  * **Atualizar Deployment Center**: Executa o script oficial `update.sh` para descarregar a versão mais recente do Deployment Center do GitHub e reconstruir a aplicação sem perdas de dados.
  * **Git Pull & Reset**: Força a sincronização do branch `main` com o token do repositório.
  * **Restart Stack**: Reinicia todos os contentores de forma segura.
  * **Docker Prune**: Limpa imagens suspensas, contentores parados e volumes órfãos para poupar espaço em disco no servidor.
  * **Docker Stats**: Apresenta a tabela em tempo real com o consumo de CPU, RAM e I/O de rede de cada contentor.
* **Histórico de Comandos & Cópia**: Navegação com teclas de seta (histórico bash) e botões para limpar consola ou copiar saídas para a área de transferência.

---

### 5. 🗄️ Gestor de Armazenamento Supabase Storage (MinIO / S3)

<p align="center">
  <a href="https://github.com/DavidFFerreira/Deployment_center/blob/main/docs/images/05_storage_manager.png" target="_blank" rel="noopener noreferrer">
    <img src="https://github.com/DavidFFerreira/Deployment_center/blob/main/docs/images/05_storage_manager.png?raw=true" alt="Gestor de Storage Supabase" width="90%" />
  </a>
</p>

* **Explorador Visual de Ficheiros**: Interface tipo gestor de ficheiros moderno para navegar por buckets, pastas e subdiretórios em árvore.
* **Gestão de Buckets Públicos e Privados**:
  * Criação, inspeção e remoção de buckets.
  * Badges visuais claras identificando se o bucket é **PÚBLICO** (acessível via URL direta sem token) ou **PRIVADO** (requer assinatura JWT/service_role).
  * Contagem instantânea de ficheiros e cálculo do espaço total ocupado (MB/GB).
* **Upload e Download em Lote**: Suporte a arrastar e largar (*drag & drop*), upload de pastas completas e validação de MIME type.
* **Backup & Restauro em ZIP**:
  * **Backup ZIP**: Exporta o conteúdo completo de um bucket ou subpasta diretamente num ficheiro ZIP comprimido.
  * **Repor ZIP**: Descomprime e restaura um ficheiro ZIP diretamente no bucket mantendo a hierarquia original.
* **Eliminação Segura**: Confirmação visual para prevenir exclusão acidental de ficheiros críticos.

---

### 6. 🐘 Gestor de Base de Dados PostgreSQL, RLS & Backups

<p align="center">
  <a href="https://github.com/DavidFFerreira/Deployment_center/blob/main/docs/images/06_database_manager.png" target="_blank" rel="noopener noreferrer">
    <img src="https://github.com/DavidFFerreira/Deployment_center/blob/main/docs/images/06_database_manager.png?raw=true" alt="Gestor de Base de Dados PostgreSQL" width="90%" />
  </a>
</p>

* **Métricas Principais da Base de Dados**:
  * Tamanho físico da base de dados PostgreSQL no disco.
  * Contagem total de tabelas criadas no schema `public`.
  * Quantidade total de objetos de storage registados e tamanho agregado.
  * Versão exata do motor PostgreSQL ativo.
* **Links Diretos ao Supabase Studio & Kong**: Acesso com 1 clique ao painel nativo do Supabase Studio e documentação da API Kong.
* **Tabela de Auditoria de Segurança RLS (Row Level Security)**:
  * Lista todas as tabelas com indicação clara do número de linhas e espaço consumido.
  * **Toggle Ativar/Desativar RLS**: Permite ligar ou desligar Row Level Security diretamente pela interface gráfica com feedback em tempo real.
* **Sistema de Backups Instantâneos (Snapshots SQL)**:
  * **Backup Completo (.sql.gz)**: Cria um dump gzip completo da base de dados (schemas `public`, `auth`, `storage` e permissões).
  * **Apenas Schema**: Exporta unicamente o DDL estrutural sem dados para facilitar migrações.
  * **Download Direto**: Descarrega os ficheiros de backup para o seu computador com um clique.
  * **Restaurar SQL Assistido**: Permite selecionar um backup histórico ou fazer upload de um ficheiro `.sql` ou `.sql.gz` para aplicar no banco de Produção ou Staging.

---

### 7. 📜 Histórico de Deploys & Auditoria de Operações

<p align="center">
  <a href="https://github.com/DavidFFerreira/Deployment_center/blob/main/docs/images/07_history_audit.png" target="_blank" rel="noopener noreferrer">
    <img src="https://github.com/DavidFFerreira/Deployment_center/blob/main/docs/images/07_history_audit.png?raw=true" alt="Histórico e Auditoria de Ações" width="90%" />
  </a>
</p>

* **Trilha de Auditoria Imutável**: Registo cronológico de todas as operações efetuadas na plataforma (deploys para staging, deploys para produção, reinicialização de contentores, backups de bases de dados e alterações de RLS).
* **Identificação do Operador**: Grava o nome e username do utilizador que desencadeou a ação.
* **Detalhes do Commit**: Apresenta o SHA curto, mensagem descritiva e carimbo temporal exato de cada evento.

---

### 8. 🪄 Wizard de Provisionamento Automático de Projetos (Stack Generator)

<p align="center">
  <a href="https://github.com/DavidFFerreira/Deployment_center/blob/main/docs/images/08_project_wizard.png" target="_blank" rel="noopener noreferrer">
    <img src="https://github.com/DavidFFerreira/Deployment_center/blob/main/docs/images/08_project_wizard.png?raw=true" alt="Wizard de Criação de Projetos" width="90%" />
  </a>
</p>

* **Processo Guiado em 4 Passos**:
  1. **Identificação**: Nome do projeto, slug único (apenas minúsculas e hífen) e opção de criar repositório privado no GitHub automaticamente com o token configurado.
  2. **Portas (Gama 50XXX)**: Atribuição de um prefixo de 2 dígitos (de 10 a 99). O sistema verifica dinamicamente se as 8 portas resultantes já estão em uso por outros contentores no servidor para garantir zero colisões.
  3. **Armazenamento no Host**: Escolha da pasta de destino no servidor (ex: `/opt/stacks/<slug>`) e seleção de ficheiros DDL Canónicos (`.sql`) para executar na inicialização da base de dados.
  4. **Criar Stack**: Provisionamento automático do ficheiro `docker-compose.yml` completo, ficheiros de configuração `kong.yml`, injeção de schemas do Supabase (`auth`, `storage`, roles), inicialização sequencial dos 16 contentores e criação de commit inicial.

---

### 9. 🧠 Gestor de Skills de Inteligência Artificial para Agentes

<p align="center">
  <a href="https://github.com/DavidFFerreira/Deployment_center/blob/main/docs/images/09_ai_skills_manager.png" target="_blank" rel="noopener noreferrer">
    <img src="https://github.com/DavidFFerreira/Deployment_center/blob/main/docs/images/09_ai_skills_manager.png?raw=true" alt="Gestor de Skills de IA" width="90%" />
  </a>
</p>

* **Biblioteca Centralizada de Conhecimento**: Gestão de pastas de skills padronizadas (`.agents/skills/<skill-id>/SKILL.md`) que ensinam aos modelos de IA (Claude, GPT, Gemini) as convenções exatas de engenharia.
* **Editor Markdown Integrado**: Crie, edite e formate ficheiros `SKILL.md` com pré-visualização, descrição curta e ícone visual.
* **Importação Direta do GitHub**: Permite colar o URL de qualquer ficheiro `SKILL.md` público ou de repositórios oficiais para importar uma nova competência em segundos.
* **Restaurar Padrão**: Repõe a coleção com as 9 skills oficiais pré-configuradas pela equipa de engenharia.

---

### 10. 📐 Editor de Diretivas & Regras dos Agentes de IA

<p align="center">
  <a href="https://github.com/DavidFFerreira/Deployment_center/blob/main/docs/images/10_agent_rules_editor.png" target="_blank" rel="noopener noreferrer">
    <img src="https://github.com/DavidFFerreira/Deployment_center/blob/main/docs/images/10_agent_rules_editor.png?raw=true" alt="Editor de Regras de IA" width="90%" />
  </a>
</p>

* **Diretivas Arquiteturais Estritas**: Regras lidas nativamente por ferramentas de IA (Cursor Rules, Lovable Rules, Claude Code, Antigravity) para impedir más práticas antes de serem escritas em código.
* **Variáveis Dinâmicas com Resolução Automática**:
  * `{name}`: Nome oficial do projeto.
  * `{slug}`: Slug do projeto.
  * `{token}`: Token de autenticação ou chaves Supabase.
  * `{repoOwner}` e `{repoName}`: Repositório no GitHub.
  * `{portProd}` e `{portStaging}`: Portas web atribuídas.
  * `{authorWebsite}`, `{authorName}` e `{currentYear}`: Metadados para copyright e rodapés legais.
* **Sincronização Direta com o Projeto Ativo**: O botão **Sincronizar com Projeto Ativo & GitHub** injeta todas as regras na pasta `.agents/rules/` do projeto no servidor e efetua o commit e push para o repositório GitHub sem intervenção manual.

---

### 11. ⚙️ Definições Globais, Vault de Credenciais & Gestão de Utilizadores

<p align="center">
  <a href="https://github.com/DavidFFerreira/Deployment_center/blob/main/docs/images/11_settings_credentials.png" target="_blank" rel="noopener noreferrer">
    <img src="https://github.com/DavidFFerreira/Deployment_center/blob/main/docs/images/11_settings_credentials.png?raw=true" alt="Definições e Vault de Credenciais" width="90%" />
  </a>
</p>

* **Vault Seguro de Credenciais**: Armazena de forma encriptada o GitHub Personal Access Token (PAT), IP do host servidor e caminhos base de armazenamento.
* **Gestão de Utilizadores Locais**: Criação, edição e revogação de acessos administrativos.
* **Configuração de Metadados de Autoria**: Define o nome do autor e o website para injeção automática nas regras legais.
* **Gestão de Projetos Registados**: Tabela completa com todos os projetos, respetivos IDs, portas e atalhos para clonagem rápida ou eliminação segura com backup prévio em ZIP.

---

## 🐳 Arquitetura de Contentores (16 Contentores por Stack)

Cada projeto gerido pelo Deployment Center é composto por uma infraestrutura **Dual-Stack completa**, totalizando **16 contentores Docker** rigorosamente orquestrados em redes isoladas:

| # | Contentor | Ambiente | Imagem Docker | Mapeamento Portas | Função & Descrição |
|:---:|:---|:---:|:---|:---:|:---|
| **1** | `{SLUG}-postgres-prod` | Produção | `supabase/postgres:15.1.0` | `XX432:5432` | **Motor Relacional de Produção**: PostgreSQL oficial com extensões `uuid-ossp`, `pgcrypto`, `pgvector`, schemas `auth`, `storage`, `public` e utilizadores configurados. |
| **2** | `{SLUG}-postgres-staging` | Testes | `supabase/postgres:15.1.0` | `XX433:5432` | **Motor Relacional de Testes**: Réplica isolada do PostgreSQL para testes de migração DDL sem tocar nos dados dos utilizadores reais. |
| **3** | `{SLUG}-postgrest-prod` | Produção | `postgrest/postgrest:v11.2` | Interna (`3000`) | **Motor REST API de Produção**: Transforma automaticamente o esquema relacional do PostgreSQL de produção numa API RESTful rápida e segura respeitando as regras RLS. |
| **4** | `{SLUG}-postgrest-staging` | Testes | `postgrest/postgrest:v11.2` | Interna (`3000`) | **Motor REST API de Testes**: Fornece os endpoints REST para o ambiente de testes e validações de pré-produção. |
| **5** | `{SLUG}-auth-prod` | Produção | `supabase/gotrue:v2.132` | Interna (`9999`) | **Serviço GoTrue Auth Produção**: Emite tokens JWT, gere sessões de utilizadores, recuperação de palavras-passe e login por email/password ou OAuth. |
| **6** | `{SLUG}-auth-staging` | Testes | `supabase/gotrue:v2.132` | Interna (`9999`) | **Serviço GoTrue Auth Testes**: Servidor de autenticação independente para validar novos fluxos de registo em testes. |
| **7** | `{SLUG}-storage-prod` | Produção | `supabase/storage-api:v0.43`| Interna (`5000`) | **API de Armazenamento de Produção**: Gere o upload, download, chunks e restrições de MIME types para ficheiros e buckets. |
| **8** | `{SLUG}-storage-staging` | Testes | `supabase/storage-api:v0.43`| Interna (`5000`) | **API de Armazenamento de Testes**: Permite testar uploads pesados sem poluir o bucket de produção. |
| **9** | `{SLUG}-meta-prod` | Produção | `supabase/postgres-meta:v0.68`| Interna (`8080`) | **Introspeção de Esquema Produção**: API interna que inspeciona tabelas, colunas, chaves primárias e relacionamentos do banco de produção. |
| **10**| `{SLUG}-meta-staging` | Testes | `supabase/postgres-meta:v0.68`| Interna (`8080`) | **Introspeção de Esquema Testes**: Fornece metadados do esquema do banco de testes ao Supabase Studio de Staging. |
| **11**| `{SLUG}-kong-prod` | Produção | `kong:2.8.1-alpine` | `XX000:8000` | **API Gateway Unificado de Produção**: Roteia chamadas externas do frontend para o serviço correto: `/auth/v1` ➔ GoTrue, `/rest/v1` ➔ PostgREST, `/storage/v1` ➔ Storage API. |
| **12**| `{SLUG}-kong-staging` | Testes | `kong:2.8.1-alpine` | `XX002:8000` | **API Gateway Unificado de Testes**: Roteador API isolado para as rotas do ambiente de testes. |
| **13**| `{SLUG}-studio-prod` | Produção | `supabase/studio:latest` | `XX323:3000` | **Dashboard Supabase Studio Produção**: Painel gráfico web para o administrador gerir tabelas, executar SQL no SQL Editor, gerir utilizadores e políticas RLS em produção. |
| **14**| `{SLUG}-studio-staging` | Testes | `supabase/studio:latest` | `XX324:3000` | **Dashboard Supabase Studio Testes**: Painel gráfico web para inspecionar e manipular o banco de dados de testes. |
| **15**| `{SLUG}-portal-prod` | Produção | *Imagem da App Web* | `XX100:80` | **Aplicação Web Oficial de Produção**: O frontend principal servido aos utilizadores e clientes finais. |
| **16**| `{SLUG}-portal-staging` | Testes | *Imagem da App Web* | `XX101:80` | **Aplicação Web de Testes (Staging)**: A aplicação acessível para a equipa interna testar novas funcionalidades antes de promover a produção. |

> **Contentor Mestre:** O próprio **`universal-deploy-center`** corre no host na porta configurada (padrão **`50000`**) com acesso ao socket `/var/run/docker.sock` para gerir todas as stacks com isolamento total.

---

## 🤖 Prompt para Explicar a Arquitetura de Contentores a uma IA

Se estiver a utilizar um assistente de IA (como ChatGPT, Claude, Cursor, Gemini ou Antigravity) para desenvolver novas funcionalidades, schemas SQL ou módulos para um projeto criado pelo Deployment Center, **copie e cole o prompt abaixo** para a IA compreender de imediato o ambiente de execução:

```text
Tu és um Arquiteto de Software Sénior e Especialista em DevOps e Supabase On-Premise.
Estou a trabalhar num projeto alojado no Universal Deployment Center (v3.0), criado por David Ferreira (https://github.com/DavidFFerreira).

Aqui está a descrição arquitetural completa dos contentores Docker criados e geridos por esta plataforma:

1. TOPOLOGIA DUAL-STACK (PRODUÇÃO & STAGING TOTALMENTE ISOLADOS):
Cada projeto gerado pelo Deployment Center é estruturado numa arquitetura Dual-Stack rigorosamente isolada em redes Docker bridge dedicadas. Para cada projeto existem 16 contentores ativos (8 em Produção e 8 em Staging/Testes), garantindo que testes de migração, novas funcionalidades e validações nunca afetam a estabilidade nem os dados reais dos utilizadores em produção.

2. AS 8 CAMADAS DE CONTENTORES POR AMBIENTE (SUFIXOS -prod E -staging):
Supondo um projeto com o identificador "{SLUG}" e prefixo de porta numérico de dois dígitos "{XX}" (ex: 52 ou 58):

  a) {SLUG}-postgres-prod / {SLUG}-postgres-staging:
     - Imagem: supabase/postgres:15.1.0
     - Portas Host: XX432 (Prod) / XX433 (Staging)
     - Função: Motor relacional PostgreSQL oficial. Contém as extensões necessárias (uuid-ossp, pgcrypto, pgvector), os schemas nativos ("public", "auth", "storage", "_realtime") e o motor de Row Level Security (RLS).

  b) {SLUG}-kong-prod / {SLUG}-kong-staging:
     - Imagem: kong:2.8.1-alpine
     - Portas Host: XX000 (Prod) / XX002 (Staging)
     - Função: API Gateway unificado de alto desempenho. Todas as chamadas externas do frontend passam pelo Kong e são roteadas internamente:
       • /auth/v1/*    -> Roteado para o GoTrue (porta interna 9999)
       • /rest/v1/*    -> Roteado para o PostgREST (porta interna 3000)
       • /storage/v1/* -> Roteado para a Storage API (porta interna 5000)
       • /pg/*         -> Roteado para a Postgres-Meta (porta interna 8080)

  c) {SLUG}-postgrest-prod / {SLUG}-postgrest-staging:
     - Imagem: postgrest/postgrest:v11.2
     - Rede: Interna (porta 3000)
     - Função: Motor RESTful que expõe automaticamente o esquema relacional do PostgreSQL numa API REST ultra-rápida, validando os tokens JWT e aplicando as regras RLS do utilizador.

  d) {SLUG}-auth-prod / {SLUG}-auth-staging:
     - Imagem: supabase/gotrue:v2.132
     - Rede: Interna (porta 9999)
     - Função: Servidor de autenticação GoTrue. Gere utilizadores, sessões, convites, recuperação de credenciais e emissão/verificação de tokens JWT assinados (anon_key e service_role_key).

  e) {SLUG}-storage-prod / {SLUG}-storage-staging:
     - Imagem: supabase/storage-api:v0.43
     - Rede: Interna (porta 5000)
     - Função: API de gestão de ficheiros e objetos. Suporta buckets públicos e privados, uploads em chunks, validação de MIME types e controlo de permissões via RLS no schema "storage".

  f) {SLUG}-meta-prod / {SLUG}-meta-staging:
     - Imagem: supabase/postgres-meta:v0.68
     - Rede: Interna (porta 8080)
     - Função: Serviço de introspeção técnica do banco de dados. Lê schemas, tabelas, colunas, chaves estrangeiras e índices para alimentar o editor gráfico.

  g) {SLUG}-studio-prod / {SLUG}-studio-staging:
     - Imagem: supabase/studio:latest
     - Portas Host: XX323 (Prod) / XX324 (Staging)
     - Função: Painel Web gráfico (Supabase Studio) para administração da base de dados, execução de scripts no SQL Editor e gestão visual de tabelas e buckets.

  h) {SLUG}-portal-prod / {SLUG}-portal-staging:
     - Imagem: Contentor da aplicação web do cliente (Node/React/Vite/Next.js)
     - Portas Host: XX100 (Prod) / XX101 (Staging)
     - Função: Frontend principal servido aos utilizadores. Comunica com o backend apontando exclusivamente para o Kong Gateway (porta XX000/XX002) usando a anon_key.

3. CONTENTOR MESTRE ORQUESTRADOR (universal-deploy-center):
   - Executa no host na porta configurada (padrão 50000).
   - Tem montagem direta do socket Docker (/var/run/docker.sock) para criar stacks, gerir lifecycles dos contentores, executar comandos via docker exec, validar portas livres e gerir rollbacks com zero downtime.

4. REGRAS OBRIGATÓRIAS PARA O DESENVOLVIMENTO COM IA:
   - NUNCA confunda Produção com Staging: todas as alterações experimentais e migrações DDL devem ser primeiro testadas em staging.
   - NUNCA utilize dados falsos (mocks) em memória quando o requisito exigir persistência real; integre sempre com o PostgreSQL via Supabase/PostgREST.
   - Crie e respeite sempre as políticas de Row Level Security (RLS) para proteger os dados entre diferentes utilizadores e organizações.
   - Mantenha a service_role_key estritamente protegida no backend; o frontend no browser deve utilizar apenas a anon_key.
   - O projeto e código-fonte são protegidos por direitos de autor de David Ferreira (https://github.com/DavidFFerreira).
```

---

## 🧠 Governança de IA: Como Funcionam as Skills e as Regras?

No desenvolvimento contemporâneo, ferramentas assistidas por IA como **Cursor**, **Lovable**, **Claude Code** ou **Antigravity** aceleram drasticamente a escrita de código. No entanto, sem regras estritas, estas IAs frequentemente:
* Utilizam dados falsos (*mocks*) em vez de persistirem no banco de dados.
* Omitem cláusulas de segurança RLS no PostgreSQL.
* Quebram rotas tipadas do TanStack Router através de `as any`.
* Esquecem termos de privacidade, políticas de cookies e conformidade RGPD/CNPD.

O Deployment Center resolve este desafio através de um sistema de governança modular de dois níveis:

### 1. As Regras dos Agentes (`.agents/rules/`)
As **Regras** são ficheiros de texto estruturados que definem diretivas invioláveis de conduta para o modelo de linguagem durante a sessão de programação.
* **Onde residem**: Na pasta `.agents/rules/` de cada repositório.
* **Injeção Dinâmica**: O Deployment Center interpola variáveis no momento da criação do projeto ou sincronização: `{name}`, `{portProd}`, `{portStaging}`, `{authorWebsite}`, `{authorName}` e `{currentYear}`.

### 2. As Skills dos Agentes (`.agents/skills/`)
As **Skills** são diretórios modulares contendo um ficheiro mestre `SKILL.md` com YAML frontmatter, exemplos práticos de implementação e referências aprofundadas. Enquanto uma regra define "o que é proibido", uma skill ensina o **"como fazer com excelência"**.

---

## 🔌 API RESTful M2M para Integração com SaaS & Aplicações Externas

O **Universal Deployment Center** disponibiliza uma API RESTful completa de nível empresarial concebida para comunicação **Machine-to-Machine (M2M)**. Se desenvolve uma plataforma SaaS (CRM, ERP, e-commerce, criador de sites ou portal de clientes), pode provisionar automaticamente instâncias completas e isoladas para novos clientes a partir do seu backend, sem qualquer intervenção manual.

### 🌐 Onde Aceder ao Portal Interativo da API?
Pode aceder à documentação visual e ao testador de API em tempo real de duas formas:
1. **Pelo Painel Web**: Clicando no botão **"API & SaaS Helper"** no topo da página ou no botão **"Site da API"** no banner do projeto.
2. **Diretamente via URL no Browser**: Acedendo a `http://SEU_SERVIDOR:50000/api/docs` (ou `/api`).

### 🛡️ Autenticação por Chave de API (Bearer Token)
Todas as chamadas à API v1 devem incluir o cabeçalho HTTP:
```http
Authorization: Bearer dc_live_sec_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```
> **Dica:** Pode gerar e revogar chaves de API diretamente no painel web, clicando no botão **"API & SaaS Helper"** ou nas Definições.

---

### 📋 Tabela de Endpoints RESTful v1

| Método | Endpoint | Permissões | Descrição |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/health` | Pública | Healthcheck do serviço, tempo de atividade e versão ativa. |
| `GET` | `/api/v1/projects` | `projects:read` | Lista todos os projetos/tenants ativos com respetivas portas e domínios. |
| `GET` | `/api/v1/projects/:id` | `projects:read` | Devolve detalhe exaustivo do tenant (portas, URLs Kong/Studio e chaves Supabase). |
| `POST` | `/api/v1/projects` | `projects:create` | **Cria e provisiona uma nova stack completa** (16 contentores, Postgres, Kong e App). Responde `202 Accepted` com `job_id` e stream de progresso. |
| `POST` | `/api/v1/projects/:id/deploy` | `projects:deploy` | Dispara um deploy programático para o ambiente de Produção ou Staging. |
| `DELETE` | `/api/v1/projects/:id` | `projects:delete` | Desliga os contentores Docker do tenant e remove o registo (suporta `?remove_volumes=true`). |
| `GET` | `/api/v1/jobs/:id/logs` | Pública / Key | Canal **SSE (Server-Sent Events)** para streaming dos logs de provisionamento em tempo real. |
| `POST` | `/api/v1/keys` | Admin Session | Cria uma nova Chave de API M2M. |
| `DELETE` | `/api/v1/keys/:id` | Admin Session | Revoga imediatamente uma Chave de API M2M. |

---

### 💻 Exemplos Práticos de Integração

#### 1. Criar e Provisionar um Novo Cliente (Tenant)

```bash
# Exemplo cURL
curl -X POST "http://SEU_SERVIDOR:50000/api/v1/projects" \
  -H "Authorization: Bearer dc_live_sec_SUA_CHAVE_AQUI" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Cliente Exemplo Lda",
    "slug": "cliente-exemplo",
    "repo_url": "https://github.com/DavidFFerreira/Deployment_center.git",
    "branch": "main",
    "webhook_url": "https://meu-saas.com/api/webhooks/deploy"
  }'
```

```javascript
// Exemplo Node.js / JavaScript
const payload = {
  name: "Cliente Exemplo Lda",
  slug: "cliente-exemplo",
  repo_url: "https://github.com/DavidFFerreira/Deployment_center.git",
  branch: "main",
  webhook_url: "https://meu-saas.com/api/webhooks/deploy"
};

const resp = await fetch("http://SEU_SERVIDOR:50000/api/v1/projects", {
  method: "POST",
  headers: {
    "Authorization": "Bearer dc_live_sec_SUA_CHAVE_AQUI",
    "Content-Type": "application/json"
  },
  body: JSON.stringify(payload)
});

const data = await resp.json();
console.log("Job de Provisionamento:", data.job_id);
console.log("ID do Projeto Criado:", data.project.id);
console.log("URL de Streaming:", data.stream_url);
```

```python
# Exemplo Python
import requests

payload = {
    "name": "Cliente Exemplo Lda",
    "slug": "cliente-exemplo",
    "repo_url": "https://github.com/DavidFFerreira/Deployment_center.git",
    "branch": "main",
    "webhook_url": "https://meu-saas.com/api/webhooks/deploy"
}

headers = {
    "Authorization": "Bearer dc_live_sec_SUA_CHAVE_AQUI",
    "Content-Type": "application/json"
}

r = requests.post("http://SEU_SERVIDOR:50000/api/v1/projects", json=payload, headers=headers)
print("Resultado:", r.json())
```

#### 2. Como Listar e Obter os IDs de Todos os Projetos / Tenants

Para obter a lista de todos os projetos criados e respetivos IDs (`id` / `slug`), chame o endpoint `GET /api/v1/projects`:

```bash
# Exemplo cURL (retorna todos os IDs)
curl -X GET "http://SEU_SERVIDOR:50000/api/v1/projects" \
  -H "Authorization: Bearer dc_live_sec_SUA_CHAVE_AQUI"
```

```javascript
// Exemplo Node.js para extrair apenas a lista de IDs
const resp = await fetch("http://SEU_SERVIDOR:50000/api/v1/projects", {
  headers: { "Authorization": "Bearer dc_live_sec_SUA_CHAVE_AQUI" }
});
const { projects } = await resp.json();

// Obter array com todos os IDs: ['cliente-alfa', 'cliente-beta', ...]
const projectIds = projects.map(p => p.id);
console.log("IDs dos Projetos Ativos:", projectIds);
```

```python
# Exemplo Python
import requests

res = requests.get("http://SEU_SERVIDOR:50000/api/v1/projects", headers={
    "Authorization": "Bearer dc_live_sec_SUA_CHAVE_AQUI"
})
projects = res.json().get("projects", [])
project_ids = [p["id"] for p in projects]
print("IDs dos Projetos:", project_ids)
```

#### 3. Streaming de Progresso em Tempo Real (SSE - Server-Sent Events)

Conecte o seu frontend ou worker ao canal SSE para exibir o progresso aos utilizadores enquanto a stack sobe:

```javascript
const evtSource = new EventSource("http://SEU_SERVIDOR:50000/api/v1/jobs/job_1772974249123_abc/logs");

evtSource.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log(`[${data.progress}%] ${data.log}`);
  
  if (data.status === "completed") {
    console.log("Stack provisionada com sucesso!", data.project);
    evtSource.close();
  } else if (data.status === "failed") {
    console.error("Falha na criação da stack:", data.error);
    evtSource.close();
  }
};
```

#### 4. Validação Criptográfica de Webhooks (HMAC SHA-256)

Quando a criação do tenant termina, o Deployment Center envia um POST para o seu `webhook_url` com o cabeçalho `X-Hub-Signature-256`:

```javascript
const crypto = require("crypto");

function verifyWebhookSignature(rawBodyBuffer, signatureHeader, secretKey) {
  const hmac = crypto.createHmac("sha256", secretKey);
  const digest = "sha256=" + hmac.update(rawBodyBuffer).digest("hex");
  return crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(signatureHeader));
}
```

---

## 📖 Guia Passo a Passo (How To)

### 1. Fazer o Primeiro Deploy de uma Aplicação
1. Aceda ao painel web do Deployment Center (`http://IP-DO-SERVIDOR:50000`).
2. No separador **Versões & Deploys**, observe a lista de commits do repositório sincronizada com o GitHub.
3. Clique no botão **Testes** ao lado de qualquer commit para efetuar o build no ambiente de Staging.
4. Clique no link **Ver Aplicação** de testes para inspecionar o resultado.
5. Se tudo estiver correto, clique no botão **Promover para Produção** para atualizar a versão oficial sem tempo de inatividade.

### 2. Criar um Novo Cliente ou Aplicação com o Wizard
1. Abra as **Definições Globais** (ícone da engrenagem `⚙️`).
2. No separador **Projetos**, clique em **Novo Projeto (Wizard)**.
3. Preencha o nome do cliente e o slug.
4. Escolha um prefixo de portas livre (ex: `52`). O sistema valida colisões automaticamente.
5. Clique em **Criar Projeto**. O Deployment Center gerará os 16 contentores Docker e a base de dados em segundos.

### 3. Fazer Backup e Repor a Base de Dados
1. No menu principal, clique no separador **Base de Dados**.
2. Clique no botão **Backup Completo (.sql.gz)**. O dump de todos os schemas (`public`, `auth`, `storage`) é gerado instantaneamente.
3. Para repor, selecione o backup desejado na tabela de snapshots e clique em **Restaurar**.

---

## 🔢 Esquema de Portas e Isolamento

O Deployment Center utiliza uma convenção padronizada de portas na gama **`50000` a `59999`** com prefixos de dois dígitos (`XX`):

| Serviço | Sufixo / Regra de Porta | Exemplo (Prefixo 58) |
|---|---|---|
| **Painel Deployment Center** | Porta Mestre Fixa | **`50000`** |
| **Kong API Gateway (Produção)** | `XX000` | `58000` |
| **Kong API Gateway (Staging)** | `XX002` | `58002` |
| **Frontend Web App (Produção)** | `XX100` | `58100` |
| **Frontend Web App (Staging)** | `XX101` | `58101` |
| **Supabase Studio (Produção)** | `XX323` | `58323` |
| **Supabase Studio (Staging)** | `XX324` | `58324` |
| **PostgreSQL Direto (Produção)** | `XX432` | `58432` |
| **PostgreSQL Direto (Staging)** | `XX433` | `58433` |

---

## ⚖️ Aviso Legal, Propriedade Intelectual & Direitos de Autor

<div align="center">

### © 2026 David Ferreira. Todos os direitos reservados.
**Website & Perfil Oficial:** [https://github.com/DavidFFerreira](https://github.com/DavidFFerreira)

</div>

> **AVISO LEGAL E DIREITOS DE AUTOR INTERNACIONAIS:**
> 
> Todo o código-fonte, arquitetura de software, scripts de instalação (`install.sh`, `update.sh`), lógica de orquestração Docker, templates de configuração Kong, esquemas de base de dados, skills de Inteligência Artificial, regras de governança e documentação presentes neste repositório são de **autoria exclusiva e propriedade intelectual proprietária de David Ferreira**.
>
> Este repositório e todo o seu conteúdo encontram-se rigorosamente protegidos pelas leis nacionais e internacionais de direitos de autor e propriedade intelectual, nomeadamente:
> 1. **Convenção de Berna para a Proteção das Obras Literárias e Artísticas** (Artigo 2.º e subsequentes);
> 2. **Tratado da Organização Mundial da Propriedade Intelectual sobre Direito de Autor (WIPO Copyright Treaty - WCT de 1996)**;
> 3. **Acordo sobre Aspetos dos Direitos de Propriedade Intelectual Relacionados com o Comércio (TRIPS)** da Organização Mundial do Comércio;
> 4. **Diretiva 2009/24/CE do Parlamento Europeu e do Conselho** relativa à proteção jurídica dos programas de computador;
> 5. **Código do Direito de Autor e dos Direitos Conexos (CDADC)**.
>
> **É ESTRITAMENTE PROIBIDO**, sem a autorização prévia, expressa e por escrito do autor David Ferreira:
> - Copiar, clonar, sublicenciar, comercializar, alugar ou vender este repositório ou partes do mesmo;
> - Publicar ou redistribuir o código-fonte ou binários derivados em plataformas públicas ou privadas;
> - Remover ou adulterar as menções de autoria, licença proprietária e hiperligações para o perfil do autor.
>
> A violação destas disposições constitui crime de usurpação e contrafação de direitos de autor, conferindo ao titular o direito de intentar providências cautelares imediatas e ações indemnizatórias cíveis e criminais ao abrigo da jurisdição nacional e internacional competente.

---

<div align="center">

Desenvolvido com excelência por **[David Ferreira](https://github.com/DavidFFerreira)** • 2026

</div>

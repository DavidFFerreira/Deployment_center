# Auditoria funcional dos commits de 9 de setembro de 2026

Comparação: `e3a1083` (último commit anterior a 9/9) → `a3361d6` (HEAD local, também apontado por origin/main local). Analisados os seis commits de 9/9, no fuso Europe/Lisbon. Não foi feito fetch remoto nem validada a versão instalada em 192.168.1.4:50000. A API dessa instalação exige autenticação. As conclusões abaixo são sobre o histórico disponível e o código local, não uma confirmação de incidentes em produção.

## Resultado principal

Não encontrei módulos antigos apagados nestes commits. Apenas `index.html` e `server.js` mudaram: 1943 linhas adicionadas e 108 removidas. A comparação de inventário encontrou:

| Inventário | Antes | Depois | Removidos |
|---|---:|---:|---:|
| Rotas app.get/post/put/delete/patch com caminho literal simples | 77 | 87 | 0 |
| Identificadores HTML, incluindo os presentes em templates | 418 | 456 | 0 |
| Funções JavaScript nomeadas da interface | 184 | 205 | 0 |

Este inventário verifica presença, não prova que cada fluxo funciona. Foram encontradas regressões comportamentais e várias funcionalidades novas que não cumprem o que a interface anuncia.

## Regressão confirmada numa funcionalidade existente

### 1. Deploy deixa de interromper quando Git falha — prioridade alta

- **Introdução:** `1d7a75d`.
- **Código:** `server.js:2358`, `server.js:2494`, `server.js:2497`, `server.js:2414`.
- **Antes:** fetch/reset/clean eram executados numa sequência com `&&` através de `execAsync`; uma falha interrompia a sequência e devolvia erro.
- **Agora:** `runCommandStreaming` resolve a Promise mesmo com código de saída diferente de zero. Quem chama não verifica `code`. O deploy continua para sincronização, migrações, reinício e gravação do estado.
- **Efeito:** o painel pode mostrar o commit solicitado como ativo sem o ter instalado. Também pode anunciar compilação concluída quando esta falhou. A confiança no histórico e no rollback fica comprometida.
- **Reprodução isolada:** o handler anterior devolveu `ok:false` perante falha Git; o atual devolveu `ok:true` e guardou `abcdef123456` como commit ativo, apesar dos comandos simulados devolverem código 1.
- **Correção recomendada:** rejeitar códigos não zero nas etapas obrigatórias; só atualizar versão/histórico depois de confirmar o resultado. Distinguir avisos opcionais de falhas impeditivas.

## Funcionalidades adicionadas ontem, mas incompletas ou incorretas

### 2. Métricas de CPU/RAM/disco e alerta de recursos não recebem os campos esperados

- **Introdução:** `bf48d42`; permanece após `c34d141`.
- **Código:** `server.js:3042`; `index.html:7574`.
- Servidor envia `load`, `memPerc`, `diskPerc`, `alert`; a interface lê `cpu_percent`, `ram_percent`, `disk_percent`, `alert_resource_high`.
- **Efeito:** valores mostrados como 0% e alerta oculto mesmo havendo valores reais. `load` também não é uma percentagem de CPU: exige medição/conversão adequada, não apenas mudar o nome.

### 3. Live Logs não acompanham novas linhas e os filtros estão incompletos

- **Introdução:** `bf48d42`.
- **Código:** `server.js:3078–3144`; `index.html:555`, `index.html:7640–7670`.
- A ligação SSE executa `docker logs --tail 40` uma única vez por contentor; não usa acompanhamento contínuo nem repetição periódica.
- A interface envia `search`, mas o servidor lê `q`; envia `tail=80`, mas o servidor fixa 40.
- O seletor só tem “Todos os Contentores”; não existe código que o preencha com os contentores individuais.
- A opção “Avisos & Erros” envia `warn`, mas o filtro do servidor exclui linhas classificadas como `error`.
- “Todos” só inclui os contentores explicitamente enumerados, não toda a stack dual de serviços.
- **Reprodução isolada:** uma chamada por contentor; uma pesquisa por “needle” deixou passar também “other”.
- **Correção:** acompanhar processos de logs e terminá-los ao desligar; harmonizar parâmetros; preencher seletor e definir semântica dos filtros.

### 4. Aviso de migrações SQL e resumo comparativo do deploy ficam ocultos

- **Introdução:** `bf48d42`.
- **Código:** `server.js:2702`; `index.html:6704`.
- API devolve `hasMigrations`, `sqlMigrations`, `diffStat`; interface procura `has_sql_migrations`, `sql_files`, `diff_stat`.
- **Efeito:** não aparece o novo aviso de migrações nem o novo resumo, mesmo quando a resposta contém alterações. O visualizador antigo de ficheiros do commit continua presente.

### 5. Webhook anuncia auto-deploy, mas o pedido interno não autentica

- **Introdução:** `bf48d42`.
- **Código:** `server.js:3150`, `server.js:3180`, `server.js:928`.
- O webhook chama `/api/deploy` por curl sem sessão; esse endpoint exige o cookie de sessão através de `requireAuth`.
- O comando não trata HTTP 401 como falha, e o webhook responde que iniciou o deploy.
- **Efeito esperado pelo código:** recebe-se confirmação sem ocorrer a publicação. Não foi enviado webhook real.
- **Correção:** reutilizar uma função interna de deploy com validação do evento, em vez de chamar a própria API sem autenticação.

### 6. Uptime de 30 dias é gerado, não medido

- **Introdução:** `bf48d42`.
- **Código:** `server.js:2956–2989`.
- Todos os dias recebem 100% e “operational”. A latência é calculada a partir do dia do mês e a média é fixa.
- **Efeito:** o novo painel não revela indisponibilidades reais. Não houve perda de um histórico real nesse endpoint: ele foi acrescentado assim.
- **Correção:** persistir observações reais e identificar períodos sem dados.

### 7. “Gravar & Aplicar” variáveis não está ligado à configuração dos contentores gerados

- **Introdução do editor:** `bf48d42`; compatibilidade de nomes parcialmente corrigida em `c34d141`.
- **Código:** `server.js:2917–2940`, `server.js:6951–6974`; `index.html:8066`.
- O editor grava `.env.production`/`.env.staging` e executa `docker restart`.
- O Compose gerado define variáveis explicitamente em `environment`; não referencia esses ficheiros através de `env_file` nem os monta no portal.
- **Efeito nas stacks geradas por este código:** o ficheiro pode ser gravado com sucesso sem a alteração chegar ao processo. O fluxo precisa de ligar os ficheiros à configuração e aplicar essa configuração ao contentor.
- **Limite:** projetos com Compose personalizado podem ter comportamento diferente.

### 8. Cache de builds não garante correspondência ao commit e pode desaparecer no deploy seguinte

- **Introdução:** `bf48d42`.
- **Código:** `server.js:2370–2435`, `server.js:2498`.
- A presença de qualquer `.output` ou `dist` é suficiente para copiar esse conteúdo para a cache identificada pelo commit pedido, sem verificar a sua origem.
- A limpeza Git não exclui `.build_cache`; se essa pasta não estiver ignorada no projeto, `git clean -fd` pode apagá-la antes de a rotina de cache a consultar.
- O fallback para a versão anterior é tratado como outputs assegurados. Não prova a instalação da versão solicitada.
- **Efeito:** a nova reconstrução/recuperação de versões não oferece as garantias anunciadas. A reutilização de outputs antigos já tinha riscos no deploy anterior; a cache por commit e o JIT são as partes novas.
- **Correção:** construir em diretório isolado, associar artefactos ao commit real e preservar explicitamente a cache.

### 9. Resultado da limpeza de builds aparece com valores indefinidos

- **Introdução:** `bf48d42`.
- **Código:** `server.js:2840–2846`; `index.html:7814`.
- API devolve `purgedCount` e `purgedFormatted`; mensagem usa `deleted_count` e `freed_bytes_pretty`.
- **Efeito:** notificação com “undefined”. Isto não prova falha da remoção em si.

### 10. Nova descoberta por contentores Docker nunca chega a executar a consulta

- **Introdução:** `ae45ac6`.
- **Código:** `server.js:395`; `package.json` declara `type: module`.
- A nova deteção usa `require("child_process")` num módulo ESM. O erro é engolido pelo catch.
- **Efeito:** projetos que dependam exclusivamente desta nova via de deteção não são encontrados. A deteção antiga por ficheiros continua presente.
- **Reprodução isolada:** diretório existente sem marcadores, com executor Docker disponível através do import, devolve false.
- **Correção:** usar o módulo `child_process` já importado.

## Mudanças de comportamento da lista de projetos

Estas alterações podem explicar projetos que parecem desaparecer ou reaparecer, mas a ocorrência concreta depende dos dados do servidor:

- `ae45ac6`: passa a fundir listas legadas em todas as leituras e a sincronizar gravações com ficheiros legados existentes (`server.js:552`, `server.js:587`). Isso pode voltar a trazer registos antigos e altera também esses catálogos.
- `ed6b64a`: dá prioridade explícita a `suavit-portal`/`suavit`, incluindo na escolha inicial quando não existe seleção válida (`server.js:577`, `index.html:6119`). Perde-se a neutralidade da ordem inicial, não os restantes projetos.
- `a3361d6`: grava IDs eliminados em `deleted_projects.json` antes de tentar toda a remoção (`server.js:8604`). Um projeto cujo teardown falhe pode ficar oculto nas leituras e na descoberta mesmo com recursos ainda existentes. A ocultação é intencional; é necessário consultar dados/logs reais para saber se aconteceu. Criar/importar, provisionar, restaurar e clonar passam a remover o respetivo marcador.

## Funcionalidades anteriores que continuam no código

Seletor e gestão de projetos; wizard e uploads ZIP; produção e staging; promoção e rollback; histórico e detalhes de commits; terminal web e atualização do Deployment Center; contentores; Storage e buckets; base de dados e backups; clonagem e restauro; documentação canónica; API v1 e gestão de chaves; utilizadores/definições; tema e idiomas; termos e rodapé.

Isto confirma a presença dos pontos de entrada, não uma execução completa de cada fluxo. Os blocos novos contêm texto fixo em português e não estendem integralmente as traduções existentes.

## Problemas anteriores que não devem ser atribuídos a ontem

- `C_RESET`: a correção explícita consta do commit `a5060f3`, de **6/9/2026 às 20:35**. Continua presente no HEAD. O erro do log anterior sugere uma instalação diferente/antiga, não uma reintrodução encontrada nos seis commits de 9/9.
- O envio de `is_rollback: false` pela interface já existia no baseline.
- Parte dos comandos Docker/SQL já suprimia erros com `|| true` antes de 9/9. A regressão nova confirmada é a perda da interrupção em erros Git e no executor de streaming.
- O fallback de projeto desconhecido para o primeiro projeto também já existia.

## Verificação e prioridade de recuperação

O script `docs/audits/2026-09-09-check.mjs` lê o histórico e executa handlers isolados com filesystem/comandos externos simulados. Não cria repositórios, não elimina recursos e não executa deploys. Comando: `node docs/audits/2026-09-09-check.mjs`.

Resultados: inventário sem remoções; regressão de deploy reproduzida antes/depois; deteção ESM falhada; pesquisa de logs ignorada. Os restantes casos foram confirmados por análise dos contratos e do fluxo do código; não são testes de integração no TrueNAS.

Ordem proposta: (1) impedir falsos sucessos no deploy; (2) validar artefactos/commit e cache; (3) rever projetos ocultos com os dados reais; (4) corrigir contratos de métricas, preview e limpeza; (5) completar logs, env, webhook e uptime. Não é aconselhável reverter indiscriminadamente todos os commits: também contêm correções e funcionalidades úteis.

Esta auditoria adiciona apenas o relatório e o script. Não altera o comportamento da aplicação nem publica nada. As alterações locais a Dockerfile, package.json e test/ são do trabalho anterior sobre C_RESET.

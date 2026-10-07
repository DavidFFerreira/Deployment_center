import { exec } from "child_process";
import { promisify } from "util";
import fs from "fs";
import path from "path";

const execAsync = promisify(exec);

// Especificações das Ferramentas MCP (Tools) do Deployment Center
export const MCP_TOOLS = [
  {
    name: "dc_list_projects",
    description: "Lista todos os projetos / tenants geridos no Deployment Center, com os respetivos identificadores, repositórios, branches e portas de rede.",
    inputSchema: {
      type: "object",
      properties: {
        filter: {
          type: "string",
          description: "Filtro opcional por nome ou id do projeto (ex: 'gymgest' ou 'suavit')"
        }
      }
    }
  },
  {
    name: "dc_get_project_info",
    description: "Obtém detalhes de infraestrutura de um projeto: commits ativos em Produção e Testes, portas (Postgres, Kong, Studio, App), diretório de instalação e URLs de acesso.",
    inputSchema: {
      type: "object",
      properties: {
        project_id: {
          type: "string",
          description: "ID do projeto (ex: 'gymgest', 'suavit-portal')"
        }
      },
      required: ["project_id"]
    }
  },
  {
    name: "dc_list_containers",
    description: "Lista os contentores Docker da stack de um projeto (portal, postgres, postgrest, kong, auth, storage, etc.), incluindo o estado de execução (running/stopped), status e mapeamento de portas.",
    inputSchema: {
      type: "object",
      properties: {
        project_id: {
          type: "string",
          description: "ID do projeto para filtrar os contentores (opcional; se omitido lista todos da stack atual)"
        },
        environment: {
          type: "string",
          enum: ["all", "production", "staging"],
          description: "Filtro por ambiente: 'production', 'staging' ou 'all' (padrão: 'all')"
        }
      }
    }
  },
  {
    name: "dc_get_logs",
    description: "Obtém as últimas linhas de log de um contentor específico da stack ou através da especificação do serviço e ambiente.",
    inputSchema: {
      type: "object",
      properties: {
        container_name: {
          type: "string",
          description: "Nome exato do contentor Docker (ex: 'gymgest-portal-prod'). Se omitido, deve fornecer project_id + service."
        },
        project_id: {
          type: "string",
          description: "ID do projeto (necessário se container_name não for fornecido)"
        },
        service: {
          type: "string",
          enum: ["portal", "postgres", "postgrest", "kong", "auth", "storage", "studio", "meta"],
          description: "Tipo de serviço a consultar (usado em conjunto com project_id e environment)"
        },
        environment: {
          type: "string",
          enum: ["production", "staging"],
          description: "Ambiente do serviço ('production' ou 'staging')"
        },
        tail: {
          type: "number",
          description: "Número de linhas de log a retornar (padrão: 50, máx: 300)"
        }
      }
    }
  },
  {
    name: "dc_restart_container",
    description: "Reinicia um contentor Docker da stack. Suporta indicação direta do nome do contentor OU resolução semântica automática através de project_id + service + environment sem ter de adivinhar o nome do contentor.",
    inputSchema: {
      type: "object",
      properties: {
        container_name: {
          type: "string",
          description: "Nome exato do contentor (ex: 'gymgest-portal-staging'). Se omitido, use project_id + service."
        },
        project_id: {
          type: "string",
          description: "ID do projeto (ex: 'gymgest', 'suavit-portal')"
        },
        service: {
          type: "string",
          enum: ["portal", "postgres", "postgrest", "kong", "auth", "storage", "studio", "meta", "all"],
          description: "Tipo de serviço a reiniciar (ex: 'portal', 'postgrest', 'postgres' ou 'all' para reiniciar toda a stack do projeto)"
        },
        environment: {
          type: "string",
          enum: ["production", "staging"],
          description: "Ambiente do serviço ('production' ou 'staging')"
        }
      }
    }
  },
  {
    name: "dc_deploy",
    description: "Inicia o processo oficial de publicação de uma versão para o ambiente de Produção ou Testes (Staging), executando sincronização git, compilação de outputs, migrações SQL e reinício controlado do contentor com verificação de saúde HTTP.",
    inputSchema: {
      type: "object",
      properties: {
        project_id: {
          type: "string",
          description: "ID do projeto onde publicar (ex: 'gymgest', 'suavit-portal')"
        },
        environment: {
          type: "string",
          enum: ["production", "staging"],
          description: "Ambiente de destino ('production' ou 'staging')"
        },
        commit_hash: {
          type: "string",
          description: "Hash SHA (7 a 40 caracteres) do commit a publicar"
        }
      },
      required: ["project_id", "environment", "commit_hash"]
    }
  },
  {
    name: "dc_rollback",
    description: "Reverte imediatamente o ambiente (Produção ou Testes) para a versão anterior funcional registada no Deployment Center.",
    inputSchema: {
      type: "object",
      properties: {
        project_id: {
          type: "string",
          description: "ID do projeto para efetuar rollback"
        },
        environment: {
          type: "string",
          enum: ["production", "staging"],
          description: "Ambiente a reverter ('production' ou 'staging')"
        }
      },
      required: ["project_id", "environment"]
    }
  }
];

// Utilitário para resolver nomes de contentores semânticos
export function resolveContainerName(project, service, environment = "production") {
  if (!project) return null;
  const cleanId = project.id;
  const isStg = environment === "staging";
  const suffix = isStg ? "staging" : "prod";
  const isDual = project.isDualStack || !!project.postgresContainerProd;

  switch (service) {
    case "portal":
      return isStg
        ? (project.staging?.containerName || `${cleanId}-portal-staging`)
        : (project.production?.containerName || `${cleanId}-portal-prod`);
    case "postgres":
      return isDual
        ? `${cleanId}-postgres-${suffix}`
        : (project.postgresContainer || `${cleanId}-postgres`);
    case "postgrest":
      return isDual
        ? `${cleanId}-postgrest-${suffix}`
        : (project.postgrestContainer || `${cleanId}-postgrest`);
    case "kong":
      return isDual
        ? `${cleanId}-kong-${suffix}`
        : (project.kongContainer || `${cleanId}-kong`);
    case "auth":
      return isDual
        ? `${cleanId}-auth-${suffix}`
        : (project.authContainer || `${cleanId}-auth`);
    case "storage":
      return isDual
        ? `${cleanId}-storage-${suffix}`
        : (project.storageContainer || `${cleanId}-storage`);
    case "studio":
      return isDual
        ? `${cleanId}-studio-${suffix}`
        : (project.studioContainer || `${cleanId}-studio`);
    case "meta":
      return isDual
        ? `${cleanId}-meta-${suffix}`
        : (project.metaContainer || `${cleanId}-meta`);
    default:
      return null;
  }
}

// Executor de Chamadas às Ferramentas MCP
export async function executeMcpTool(name, args = {}, context = {}) {
  const { getProjects, findProject, getGlobalState, handleDeployInternal, triggerRollbackInternal } = context;

  switch (name) {
    case "dc_list_projects": {
      const all = getProjects ? getProjects() : [];
      const filter = (args.filter || "").toLowerCase().trim();
      const filtered = filter
        ? all.filter(p => p.id.toLowerCase().includes(filter) || (p.name || "").toLowerCase().includes(filter))
        : all;

      const results = filtered.map(p => {
        const pNum = p.portPrefix || 58;
        return {
          id: p.id,
          name: p.name,
          repo: `${p.repoOwner}/${p.repoName}`,
          branch: p.branch || "main",
          ports: {
            production: p.production?.port || Number(`${pNum}100`),
            staging: p.staging?.port || Number(`${pNum}101`),
            postgres: p.postgresPort || Number(`${pNum}432`),
            kong: p.kongPort || Number(`${pNum}000`),
            studio: p.studioPort || Number(`${pNum}323`)
          }
        };
      });

      return {
        content: [{ type: "text", text: JSON.stringify(results, null, 2) }]
      };
    }

    case "dc_get_project_info": {
      if (!args.project_id) throw new Error("project_id é obrigatório.");
      const p = findProject ? findProject(args.project_id) : null;
      if (!p || p.id !== args.project_id) {
        throw new Error(`Projeto com id '${args.project_id}' não foi encontrado.`);
      }

      const globalState = getGlobalState ? getGlobalState() : {};
      const pState = globalState?.projects?.[p.id] || {};
      const pNum = p.portPrefix || 58;

      const info = {
        id: p.id,
        name: p.name,
        repo: `${p.repoOwner}/${p.repoName}`,
        branch: p.branch || "main",
        appDir: p.appDir,
        state: {
          production: {
            active_commit: pState.production?.commit || null,
            short_hash: pState.production?.shortHash || null,
            port: p.production?.port || Number(`${pNum}100`),
            container: p.production?.containerName || `${p.id}-portal-prod`
          },
          staging: {
            active_commit: pState.staging?.commit || null,
            short_hash: pState.staging?.shortHash || null,
            port: p.staging?.port || Number(`${pNum}101`),
            container: p.staging?.containerName || `${p.id}-portal-staging`
          }
        },
        infrastructure_ports: {
          kong: p.kongPort || Number(`${pNum}000`),
          postgres: p.postgresPort || Number(`${pNum}432`),
          studio: p.studioPort || Number(`${pNum}323`)
        }
      };

      return {
        content: [{ type: "text", text: JSON.stringify(info, null, 2) }]
      };
    }

    case "dc_list_containers": {
      let filter = "";
      if (args.project_id) filter = `--filter "name=${args.project_id}"`;

      let stdout = "";
      try {
        const res = await execAsync(`docker ps -a ${filter} --format "{{.Names}}\t{{.Status}}\t{{.State}}\t{{.Ports}}" 2>/dev/null || true`);
        stdout = res.stdout;
      } catch (e) {
        stdout = "";
      }

      const lines = stdout.trim().split("\n").filter(Boolean);
      let containers = lines.map(line => {
        const [name, status, state, ports] = line.split("\t");
        return { name, status, state, ports: ports || "internal" };
      });

      if (args.environment && args.environment !== "all") {
        const isStg = args.environment === "staging";
        containers = containers.filter(c => isStg ? c.name.includes("-staging") : !c.name.includes("-staging"));
      }

      return {
        content: [{ type: "text", text: JSON.stringify(containers, null, 2) }]
      };
    }

    case "dc_get_logs": {
      let targetContainer = args.container_name;
      if (!targetContainer && args.project_id && args.service) {
        const p = findProject ? findProject(args.project_id) : null;
        targetContainer = resolveContainerName(p, args.service, args.environment || "production");
      }

      if (!targetContainer) {
        throw new Error("Especifique 'container_name' ou 'project_id' + 'service'.");
      }

      const tail = Math.min(Math.max(Number(args.tail) || 50, 10), 300);
      try {
        const { stdout, stderr } = await execAsync(`docker logs --tail ${tail} ${targetContainer} 2>&1 || true`);
        const output = (stdout || stderr || "").trim();
        return {
          content: [{
            type: "text",
            text: `[Logs de ${targetContainer} (últimas ${tail} linhas)]:\n\n${output || "(Nenhum log registado)"}`
          }]
        };
      } catch (err) {
        throw new Error(`Falha ao obter logs de ${targetContainer}: ${err.message}`);
      }
    }

    case "dc_restart_container": {
      let targetContainer = args.container_name;
      const isAll = args.service === "all";

      if (isAll && args.project_id) {
        const p = findProject ? findProject(args.project_id) : null;
        if (!p) throw new Error(`Projeto '${args.project_id}' não encontrado.`);
        try {
          const composePath = path.join(p.appDir, "docker-compose.yml");
          if (fs.existsSync(composePath)) {
            await execAsync(`docker compose -f "${composePath}" restart 2>&1`);
          } else {
            await execAsync(`docker restart $(docker ps -q --filter "name=${p.id}") 2>&1`);
          }
          return {
            content: [{ type: "text", text: `Sucesso: Todos os contentores do projeto '${p.id}' foram reiniciados.` }]
          };
        } catch (err) {
          throw new Error(`Erro ao reiniciar stack de '${p.id}': ${err.message}`);
        }
      }

      if (!targetContainer && args.project_id && args.service) {
        const p = findProject ? findProject(args.project_id) : null;
        targetContainer = resolveContainerName(p, args.service, args.environment || "production");
      }

      if (!targetContainer) {
        throw new Error("Especifique 'container_name' ou forneça 'project_id' + 'service' ('portal', 'postgres', etc.).");
      }

      try {
        await execAsync(`docker restart ${targetContainer} 2>&1`);
        return {
          content: [{ type: "text", text: `Sucesso: O contentor '${targetContainer}' foi reiniciado com êxito.` }]
        };
      } catch (err) {
        throw new Error(`Falha ao reiniciar contentor '${targetContainer}': ${err.message}`);
      }
    }

    case "dc_deploy": {
      if (!handleDeployInternal) throw new Error("Deploy handler não configurado no contexto MCP.");
      const { project_id, environment, commit_hash } = args;
      const result = await handleDeployInternal({ project_id, environment, commit_hash });
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }]
      };
    }

    case "dc_rollback": {
      if (!triggerRollbackInternal) throw new Error("Rollback handler não configurado no contexto MCP.");
      const { project_id, environment } = args;
      const result = await triggerRollbackInternal({ project_id, environment });
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }]
      };
    }

    default:
      throw new Error(`Ferramenta MCP desconhecida: '${name}'`);
  }
}

// Processador do protocolo JSON-RPC 2.0 (MCP Specification)
export async function handleMcpJsonRpc(payload, context = {}) {
  const { id, method, params } = payload || {};

  if (!method) {
    return {
      jsonrpc: "2.0",
      id: id || null,
      error: { code: -32600, message: "Invalid Request: method is required" }
    };
  }

  // MCP handshake / initialize
  if (method === "initialize") {
    return {
      jsonrpc: "2.0",
      id,
      result: {
        protocolVersion: "2024-11-05",
        capabilities: {
          tools: { listChanged: false }
        },
        serverInfo: {
          name: "deployment-center-mcp",
          version: "3.0.0"
        }
      }
    };
  }

  // Notificação de inicialização confirmada pelo cliente
  if (method === "notifications/initialized") {
    return null; // Notificações não devolvem resposta no JSON-RPC
  }

  if (method === "ping") {
    return { jsonrpc: "2.0", id, result: {} };
  }

  // Listagem de ferramentas disponíveis
  if (method === "tools/list") {
    return {
      jsonrpc: "2.0",
      id,
      result: { tools: MCP_TOOLS }
    };
  }

  // Execução de ferramentas
  if (method === "tools/call") {
    const toolName = params?.name;
    const toolArgs = params?.arguments || {};
    try {
      const toolResult = await executeMcpTool(toolName, toolArgs, context);
      return {
        jsonrpc: "2.0",
        id,
        result: toolResult
      };
    } catch (err) {
      return {
        jsonrpc: "2.0",
        id,
        result: {
          isError: true,
          content: [{ type: "text", text: `Erro na execução da ferramenta '${toolName}': ${err.message}` }]
        }
      };
    }
  }

  return {
    jsonrpc: "2.0",
    id: id || null,
    error: { code: -32601, message: `Method not found: ${method}` }
  };
}

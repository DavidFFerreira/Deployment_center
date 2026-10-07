import test from "node:test";
import assert from "node:assert/strict";
import { handleMcpJsonRpc, MCP_TOOLS, resolveContainerName } from "../lib/mcp-service.js";

test("MCP: tools list contains expected deployment center tools", () => {
  const toolNames = MCP_TOOLS.map(t => t.name);
  assert.ok(toolNames.includes("dc_list_projects"));
  assert.ok(toolNames.includes("dc_get_project_info"));
  assert.ok(toolNames.includes("dc_list_containers"));
  assert.ok(toolNames.includes("dc_get_logs"));
  assert.ok(toolNames.includes("dc_restart_container"));
  assert.ok(toolNames.includes("dc_deploy"));
  assert.ok(toolNames.includes("dc_rollback"));
});

test("MCP: resolveContainerName computes correct semantic container names", () => {
  const mockProject = {
    id: "gymgest",
    isDualStack: true,
    production: { containerName: "gymgest-portal-prod" },
    staging: { containerName: "gymgest-portal-staging" }
  };

  assert.equal(resolveContainerName(mockProject, "portal", "production"), "gymgest-portal-prod");
  assert.equal(resolveContainerName(mockProject, "portal", "staging"), "gymgest-portal-staging");
  assert.equal(resolveContainerName(mockProject, "postgres", "production"), "gymgest-postgres-prod");
  assert.equal(resolveContainerName(mockProject, "postgres", "staging"), "gymgest-postgres-staging");
  assert.equal(resolveContainerName(mockProject, "postgrest", "staging"), "gymgest-postgrest-staging");
});

test("MCP: handleMcpJsonRpc handles initialize and tools/list", async () => {
  const initRes = await handleMcpJsonRpc({
    jsonrpc: "2.0",
    id: 1,
    method: "initialize",
    params: {}
  });

  assert.equal(initRes.id, 1);
  assert.equal(initRes.result.serverInfo.name, "deployment-center-mcp");

  const listRes = await handleMcpJsonRpc({
    jsonrpc: "2.0",
    id: 2,
    method: "tools/list"
  });

  assert.equal(listRes.id, 2);
  assert.ok(Array.isArray(listRes.result.tools));
  assert.ok(listRes.result.tools.length >= 7);
});

test("MCP: handleMcpJsonRpc executes tool dc_list_projects with mock context", async () => {
  const mockContext = {
    getProjects: () => [
      { id: "gymgest", name: "GymGest", repoOwner: "DavidFFerreira", repoName: "gymgest", portPrefix: 62 },
      { id: "suavit-portal", name: "Suavit Portal", repoOwner: "DavidFFerreira", repoName: "Suavit_portal", portPrefix: 58 }
    ]
  };

  const callRes = await handleMcpJsonRpc({
    jsonrpc: "2.0",
    id: 3,
    method: "tools/call",
    params: {
      name: "dc_list_projects",
      arguments: {}
    }
  }, mockContext);

  assert.equal(callRes.id, 3);
  assert.equal(callRes.result.isError, undefined);
  const data = JSON.parse(callRes.result.content[0].text);
  assert.equal(data.length, 2);
  assert.equal(data[0].id, "gymgest");
  assert.equal(data[0].ports.production, 62100);
});

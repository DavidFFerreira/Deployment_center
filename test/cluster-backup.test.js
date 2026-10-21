import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

test("cluster migration: restore_full_cluster.sh script generator includes required automated steps", () => {
  const source = fs.readFileSync(new URL("../server.js", import.meta.url), "utf8");
  
  assert.ok(source.includes("function generateRestoreFullClusterScript("), "generateRestoreFullClusterScript must exist in server.js");
  assert.ok(source.includes("function generateClusterMigrationReadme("), "generateClusterMigrationReadme must exist in server.js");

  // Extract function and run in isolated context
  const fnStart = source.indexOf("function generateRestoreFullClusterScript(metadata) {");
  const fnEnd = source.indexOf("function generateClusterMigrationReadme(", fnStart);
  assert.ok(fnStart >= 0 && fnEnd > fnStart);

  const fnCode = source.slice(fnStart, fnEnd);
  const context = { CURRENT_DEPLOY_CENTER_COMMIT: "test-commit" };
  const generateScript = vm.runInNewContext(`(${fnCode.replace(/^function generateRestoreFullClusterScript/, "function")})`, context);

  const metadata = {
    timestamp: "2026-10-21T10:00:00Z",
    projects: [
      { id: "project-alpha", name: "Alpha App", postgresContainer: "alpha-postgres" },
      { id: "project-beta", name: "Beta Web", postgresContainer: "beta-postgres" }
    ]
  };

  const script = generateScript(metadata);

  assert.ok(script.startsWith("#!/usr/bin/env bash"), "Script must start with bash shebang");
  assert.ok(script.includes("TARGET_STACKS_DIR"), "Script must configure TARGET_STACKS_DIR");
  assert.ok(script.includes("TARGET_DC_DIR"), "Script must configure TARGET_DC_DIR");
  assert.ok(script.includes("TARGET_IP"), "Script must configure TARGET_IP");
  assert.ok(script.includes("curl -fsSL https://get.docker.com | sh"), "Script must offer automated Docker installation");
  assert.ok(script.includes("deploy-center-network"), "Script must ensure deploy-center-network bridge");
  assert.ok(script.includes("psql -U postgres -d postgres"), "Script must restore PostgreSQL databases");
  assert.ok(script.includes("RESTAURO COMPLETO DO CLUSTER CONCLUÍDO"), "Script must print final summary");
});

test("cluster migration: UI elements and endpoints exist in index.html and server.js", () => {
  const html = fs.readFileSync(new URL("../index.html", import.meta.url), "utf8");
  const server = fs.readFileSync(new URL("../server.js", import.meta.url), "utf8");

  // Server endpoints
  assert.ok(server.includes('app.post("/api/cluster/backup-full"'), "Endpoint /api/cluster/backup-full must be registered");
  assert.ok(server.includes('app.get("/api/cluster/backup-full/download/:filename"'), "Endpoint /api/cluster/backup-full/download must be registered");

  // UI elements
  assert.ok(html.includes('id="set-tab-btn-cluster"'), "Tab button set-tab-btn-cluster must exist in settings-modal");
  assert.ok(html.includes('id="set-content-cluster"'), "Tab content set-content-cluster must exist in settings-modal");
  assert.ok(html.includes('function exportFullClusterBackup('), "Function exportFullClusterBackup must exist in index.html");
  assert.ok(html.includes('data-i18n="set_tab_cluster"'), "set_tab_cluster data-i18n must exist");
  assert.ok(html.includes('data-i18n="btn_export_cluster"'), "btn_export_cluster data-i18n must exist");
  assert.ok(html.includes('data-i18n="cluster_explanation_title"'), "cluster_explanation_title data-i18n must exist");
  assert.ok(html.includes('data-i18n="cluster_item_dc_title"'), "cluster_item_dc_title data-i18n must exist");
  assert.ok(html.includes('data-i18n="cluster_item_projects_title"'), "cluster_item_projects_title data-i18n must exist");
  assert.ok(html.includes('data-i18n="cluster_item_db_title"'), "cluster_item_db_title data-i18n must exist");
  assert.ok(html.includes('data-i18n="cluster_item_script_title"'), "cluster_item_script_title data-i18n must exist");
  assert.ok(html.includes('data-i18n="cluster_how_to_restore_title"'), "cluster_how_to_restore_title data-i18n must exist");
  assert.ok(html.includes('data-i18n="cluster_step1_title"'), "cluster_step1_title data-i18n must exist");
  assert.ok(html.includes('data-i18n="cluster_step2_title"'), "cluster_step2_title data-i18n must exist");
  assert.ok(html.includes('data-i18n="cluster_step3_title"'), "cluster_step3_title data-i18n must exist");
  assert.ok(html.includes('data-i18n="cluster_scenarios_title"'), "cluster_scenarios_title data-i18n must exist");
});

test("cluster migration: all guide and explanation keys exist across all 28 languages in I18N", () => {
  const html = fs.readFileSync(new URL("../index.html", import.meta.url), "utf8");
  const match = html.match(/const I18N = (\{[\s\S]*?\n\s*\};)/);
  assert.ok(match, "I18N found in index.html");
  const i18n = new Function(`return ${match[1].replace(/;$/, "")}`)();

  const requiredClusterKeys = [
    "set_tab_cluster",
    "cluster_title",
    "cluster_desc",
    "btn_export_cluster",
    "btn_exporting_cluster",
    "cluster_how_to_restore_title",
    "cluster_badge_universal",
    "cluster_badge_self_contained",
    "cluster_badge_dr",
    "cluster_hero_title",
    "cluster_hero_desc",
    "cluster_export_progress_label",
    "cluster_explanation_title",
    "cluster_item_dc_title",
    "cluster_item_dc_desc",
    "cluster_item_projects_title",
    "cluster_item_projects_desc",
    "cluster_item_db_title",
    "cluster_item_db_desc",
    "cluster_item_script_title",
    "cluster_item_script_desc",
    "cluster_step1_title",
    "cluster_step1_desc",
    "cluster_step2_title",
    "cluster_step2_desc",
    "cluster_step3_title",
    "cluster_step3_details_title",
    "cluster_step3_feat1",
    "cluster_step3_feat2",
    "cluster_step3_feat3",
    "cluster_step3_feat4",
    "cluster_scenarios_title",
    "cluster_scen_dr_title",
    "cluster_scen_dr_desc",
    "cluster_scen_mig_title",
    "cluster_scen_mig_desc",
    "cluster_scen_clone_title",
    "cluster_scen_clone_desc",
    "cluster_status_collecting",
    "cluster_status_dumps",
    "cluster_status_compressing",
    "cluster_status_completed",
    "cluster_status_error",
    "alert_cmd_copied"
  ];

  const langs = Object.keys(i18n);
  assert.equal(langs.length, 28, "Must support all 28 languages");

  for (const lang of langs) {
    for (const key of requiredClusterKeys) {
      assert.ok(
        i18n[lang][key] && typeof i18n[lang][key] === "string" && i18n[lang][key].trim().length > 0,
        `Language ${lang} is missing non-empty cluster key "${key}"`
      );
    }
  }
});

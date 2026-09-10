import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import test from "node:test";

// Evaluate the actual provisioning template without starting the server or
// creating repositories, directories, or Docker resources.
const source = readFileSync(new URL("../server.js", import.meta.url), "utf8");
const start = source.indexOf("    const updateScriptContent = ");
const end = source.indexOf("    const updateScriptFile = ", start);
assert.ok(start >= 0 && end > start, "Provisioning update script template must exist");
const template = source.slice(start, end);
const context = {
  tokenVal: "test-token",
  repoOwner: "test-owner",
  cleanSlug: "test-project",
  targetAppDir: "/mnt/test/apps/test-project",
  portStaging: 50101,
  portProd: 50100,
};

test("provisioning generates update.sh with literal Bash variables", () => {
  const script = vm.runInNewContext(`${template}\nupdateScriptContent;`, { ...context });
  assert.ok(script.startsWith("#!/usr/bin/env bash"));
  assert.ok(script.includes('GITHUB_REPO="test-project"'));
  assert.ok(script.includes('PORT_STAGING="50101"'));
  assert.ok(script.includes('GITHUB_TOKEN="${1:-test-token}"'));
  assert.ok(script.includes('C_RESET="\\033[0m"'));
  for (const name of ["C_RESET", "C_BOLD", "C_GREEN", "C_BLUE", "C_CYAN",
    "C_YELLOW", "GITHUB_REPO", "APP_DIR", "HOST_IP", "ACTIVE_COMMIT_SHORT"]) {
    assert.ok(script.includes("${" + name + "}"), `${name} must be expanded by Bash`);
  }
});

test("regression check detects an unescaped C_RESET interpolation", () => {
  const brokenTemplate = template.replace('\\${C_RESET}', '${C_RESET}');
  assert.notEqual(brokenTemplate, template);
  assert.throws(
    () => vm.runInNewContext(`${brokenTemplate}\nupdateScriptContent;`, { ...context }),
    /C_RESET is not defined/,
  );
});

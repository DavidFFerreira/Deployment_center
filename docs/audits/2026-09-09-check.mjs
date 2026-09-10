import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';
import assert from 'node:assert/strict';

// Read-only audit: external operations are mocked, no application is started.
const root = new URL('../../', import.meta.url);
const before = file => execFileSync('git', ['show', `e3a1083:${file}`], { cwd: root, encoding: 'utf8' });
// Freeze the historical comparison even after the working tree is repaired.
const after = file => execFileSync('git', ['show', `a3361d6:${file}`], { cwd: root, encoding: 'utf8' });
const inventory = (text, re) => new Set([...text.matchAll(re)].map(m => m.slice(1).join(' ')));
const compare = (file, re) => {
  const old = inventory(before(file), re), current = inventory(after(file), re);
  return { before: old.size, after: current.size, removed: [...old].filter(x => !current.has(x)), added: [...current].filter(x => !old.has(x)) };
};
const result = {
  routes: compare('server.js', /app\.(get|post|put|delete|patch)\(\s*["']([^"']+)["']/g),
  htmlIds: compare('index.html', /\bid="([^"]+)"/g),
  frontendFunctions: compare('index.html', /\bfunction\s+(\w+)\s*\(/g),
};
result.inlineScriptsParsed = 0;
for (const match of after('index.html').matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)) {
  if (/\bsrc\s*=/.test(match[1]) || !match[2].trim()) continue;
  new vm.Script(match[2]);
  result.inlineScriptsParsed++;
}
function route(source, marker) {
  const start = source.indexOf(marker);
  assert.ok(start >= 0);
  const end = source.indexOf('\n// ==============================================================================', start);
  return source.slice(start, end);
}
async function simulateDeploy(source, streaming) {
  let handler, response, saved;
  const commands = [];
  const state = {};
  const ctx = {
    app: { post: (...args) => { handler = args.at(-1); } }, requireAuth() {},
    findProject: () => ({ id: 'audit', appDir: '/audit', production: { containerName: 'audit-prod', port: 50000 }, postgresContainer: 'audit-pg' }),
    getGlobalState: () => state, saveGlobalState: s => { saved = s; },
    fs: { existsSync: p => !String(p).includes('supabase') }, path,
    getActiveGithubToken: () => '', commitsCache: new Map(),
    ensureProjectBuildOutputs: async () => ({ ok: true, source: 'previous' }),
    runCommandStreaming: async cmd => { commands.push(cmd); return { code: 1, stdout: '', stderr: 'simulated failure' }; },
    execAsync: async cmd => {
      commands.push(cmd);
      if (!streaming) throw new Error('simulated git fetch failure');
      return { stdout: '200' };
    },
  };
  vm.runInNewContext(route(source, 'app.post("/api/deploy",'), ctx);
  const res = { status() { return this; }, json(data) { response = data; } };
  await handler({ body: { project_id: 'audit', environment: 'production', commit_hash: 'abcdef123456' }, query: {}, headers: {}, user: { username: 'audit' } }, res);
  return { ok: response.ok, savedCommit: saved?.projects.audit.production?.commit, commandsAttempted: commands.length };
}
result.failedGitBefore = await simulateDeploy(before('server.js'), false);
result.failedGitAfter = await simulateDeploy(after('server.js'), true);
assert.equal(result.failedGitBefore.ok, false);
assert.equal(result.failedGitAfter.ok, true);

const source = after('server.js');
const detector = source.slice(source.indexOf('function isDeployCenterProject('), source.indexOf('function autoDiscoverProjects('));
result.dockerOnlyProjectDetected = vm.runInNewContext(`${detector}\nisDeployCenterProject('/audit', 'audit');`, {
  fs: { existsSync: p => p === '/audit' }, path,
  child_process: { execSync: () => 'audit-prod' },
});
assert.equal(result.dockerOnlyProjectDetected, false);

let logsHandler, logCalls = 0;
const messages = [];
vm.runInNewContext(route(source, 'app.get("/api/projects/:id/logs/stream",'), {
  app: { get: (...args) => { logsHandler = args.at(-1); } }, requireAuth() {},
  findProject: () => ({ production: { containerName: 'audit-prod' } }),
  execAsync: async () => { logCalls++; return { stdout: 'needle\nother' }; },
});
logsHandler({ params: { id: 'audit' }, query: { search: 'needle' }, on() {} }, {
  setHeader() {}, write: text => messages.push(text),
});
await new Promise(resolve => setImmediate(resolve));
result.logs = { commandCalls: logCalls, linesDespiteSearch: messages.length };
assert.equal(messages.length, 2);
console.log(JSON.stringify(result, null, 2));

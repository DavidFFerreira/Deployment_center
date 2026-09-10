import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
const source = fs.readFileSync(new URL('../server.js', import.meta.url), 'utf8');
const code = source.slice(source.indexOf('const deploymentsInProgress ='), source.indexOf('app.post("/api/deploy", requireAuth, handleDeploy);'));
const old = '1'.repeat(40), next = '2'.repeat(40);

async function simulate(failure) {
  let saved, restored = false, restarted = false, result;
  const state = { projects: { audit: { production: { commit: old }, history: [] } } };
  const project = { id: 'audit', appDir: '/audit', production: { containerName: 'audit-prod', port: 5000 }, repoOwner: 'owner', repoName: 'repo' };
  const ctx = {
    path, structuredClone, Buffer, setTimeout: callback => callback(),
    getProjects: () => [project], findProject: () => project, getSettings: () => ({ server_host_ip: 'host' }),
    getGlobalState: () => state, saveGlobalState: value => { saved = value; },
    getActiveGithubToken: () => '', shellQuote: value => `'${value}'`, commitsCache: new Map(),
    fs: { existsSync: value => failure !== 'directory' && !value.includes('supabase') },
    runCommandStreaming: async command => {
      if (failure === 'git' && command.includes('fetch origin')) throw Error('Git failed');
      if (command === 'recreate') { restarted = true; if (failure === 'docker') throw Error('Docker failed'); }
      return { code: 0, stdout: command.includes('rev-parse') ? next : '' };
    },
    getComposeRecreateCommand: async () => 'recreate',
    execAsync: async () => ({ stdout: failure === 'health' ? '503' : '200' }),
    ensureProjectBuildOutputs: async () => {
      if (failure === 'build') throw Error('Build failed');
      return { ok: true, rollback() { restored = true; }, finish() {} };
    },
  };
  vm.runInNewContext(code, ctx);
  const res = { status() { return this; }, json(data) { result = data; } };
  await ctx.handleDeploy({ body: { project_id: 'audit', environment: 'production', commit_hash: next }, query: {}, headers: {}, user: { username: 'audit' } }, res);
  assert.equal(state.projects.audit.production.commit, old, 'in-memory original state is not mutated');
  return { saved, restored, restarted, result };
}
for (const failure of ['git', 'directory', 'build', 'docker', 'health']) {
  test(`${failure} failure cannot be recorded as a successful deploy`, async () => {
    const actual = await simulate(failure);
    assert.equal(actual.result.ok, false);
    assert.equal(actual.saved, undefined);
    if (['docker', 'health'].includes(failure)) assert.equal(actual.restored, true);
    if (['git', 'directory', 'build'].includes(failure)) assert.equal(actual.restarted, false);
  });
}
test('verified healthy deploy records new and previous commits', async () => {
  const actual = await simulate();
  assert.equal(actual.result.ok, true);
  assert.equal(actual.saved.projects.audit.production.commit, next);
  assert.equal(actual.saved.projects.audit.previousProduction.commit, old);
});

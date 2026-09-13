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

test('migrations only execute unapplied files and record them in tracking table', async () => {
  const executedPsql = [];
  const state = { projects: { audit: { production: { commit: old }, history: [] } } };
  const project = { id: 'audit', appDir: '/audit', postgresContainer: 'audit-pg', postgrestContainer: 'audit-pgrst', production: { containerName: 'audit-prod', port: 5000 }, repoOwner: 'owner', repoName: 'repo' };
  const files = ['20260601000000_init.sql', '20260910000002_new.sql'];
  const applied = new Set(['20260601000000_init']);
  const ctx = {
    path, structuredClone, Buffer, setTimeout: callback => callback(),
    getProjects: () => [project], findProject: () => project, getSettings: () => ({ server_host_ip: 'host' }),
    getGlobalState: () => state, saveGlobalState: () => {},
    getActiveGithubToken: () => '', shellQuote: value => `'${value}'`, commitsCache: new Map(),
    fs: {
      existsSync: () => true,
      readdirSync: () => files,
    },
    runCommandStreaming: async command => {
      if (command.includes('SELECT version FROM supabase_migrations')) {
        return { code: 0, stdout: Array.from(applied).join('\n') };
      }
      if (command.includes('psql -v ON_ERROR_STOP=1')) {
        executedPsql.push(command);
      }
      if (command.includes('INSERT INTO supabase_migrations')) {
        const match = command.match(/VALUES \('([^']+)'\)/);
        if (match) applied.add(match[1]);
      }
      return { code: 0, stdout: command.includes('rev-parse') ? next : '' };
    },
    getComposeRecreateCommand: async () => 'recreate',
    execAsync: async () => ({ stdout: '200' }),
    ensureProjectBuildOutputs: async () => ({ ok: true, finish() {} }),
  };
  vm.runInNewContext(code, ctx);
  const res = { status() { return this; }, json(data) {} };
  await ctx.handleDeploy({ body: { project_id: 'audit', environment: 'production', commit_hash: next }, query: {}, headers: {}, user: { username: 'audit' } }, res);

  assert.equal(executedPsql.length, 1, 'only the unapplied migration was executed');
  assert.match(executedPsql[0], /20260910000002_new\.sql/, 'correct migration file executed');
  assert.ok(applied.has('20260910000002_new'), 'new migration was registered in schema_migrations');
});

test('migrations bootstrap marks historical migrations as applied on existing populated database', async () => {
  const executedPsql = [];
  const state = { projects: { audit: { production: { commit: old }, history: [] } } };
  const project = { id: 'audit', appDir: '/audit', postgresContainer: 'audit-pg', postgrestContainer: 'audit-pgrst', production: { containerName: 'audit-prod', port: 5000 }, repoOwner: 'owner', repoName: 'repo' };
  const files = ['20260601000000_old.sql', '20260910000002_new.sql'];
  const applied = new Set();
  const ctx = {
    path, structuredClone, Buffer, setTimeout: callback => callback(),
    getProjects: () => [project], findProject: () => project, getSettings: () => ({ server_host_ip: 'host' }),
    getGlobalState: () => state, saveGlobalState: () => {},
    getActiveGithubToken: () => '', shellQuote: value => `'${value}'`, commitsCache: new Map(),
    fs: {
      existsSync: () => true,
      readdirSync: () => files,
    },
    runCommandStreaming: async command => {
      if (command.includes('SELECT version FROM supabase_migrations')) {
        return { code: 0, stdout: Array.from(applied).join('\n') };
      }
      if (command.includes('SELECT count(*) FROM information_schema.tables')) {
        return { code: 0, stdout: '42' };
      }
      if (command.includes('git diff --name-only')) {
        return { code: 0, stdout: 'supabase/migrations/20260910000002_new.sql\n' };
      }
      if (command.includes('psql -v ON_ERROR_STOP=1')) {
        executedPsql.push(command);
      }
      if (command.includes('INSERT INTO supabase_migrations')) {
        const match = command.match(/VALUES \('([^']+)'\)/);
        if (match) applied.add(match[1]);
      }
      return { code: 0, stdout: command.includes('rev-parse') ? next : '' };
    },
    getComposeRecreateCommand: async () => 'recreate',
    execAsync: async () => ({ stdout: '200' }),
    ensureProjectBuildOutputs: async () => ({ ok: true, finish() {} }),
  };
  vm.runInNewContext(code, ctx);
  const res = { status() { return this; }, json(data) {} };
  await ctx.handleDeploy({ body: { project_id: 'audit', environment: 'production', commit_hash: next }, query: {}, headers: {}, user: { username: 'audit' } }, res);

  assert.ok(applied.has('20260601000000_old'), 'historical migration was bootstrapped into schema_migrations');
  assert.ok(applied.has('20260910000002_new'), 'new migration was registered in schema_migrations');
  assert.equal(executedPsql.length, 1, 'only the new migration was executed with psql');
  assert.match(executedPsql[0], /20260910000002_new\.sql/, 'only new migration ran');
});



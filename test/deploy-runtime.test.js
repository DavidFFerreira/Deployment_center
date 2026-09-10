import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { ensureProjectBuildOutputs, runCommandStreaming } from '../lib/deploy-runtime.js';

test('command failures reject instead of returning success', async () => {
  await assert.rejects(runCommandStreaming(`"${process.execPath}" -e "process.exit(7)"`), err => err.code === 7);
});

test('stream preserves fragmented lines and the final unterminated line', async () => {
  const lines = [];
  await runCommandStreaming(`"${process.execPath}" -e "process.stdout.write('hel');setTimeout(()=>process.stdout.write('lo\\nlast'),20)"`, undefined, line => lines.push(line));
  assert.deepEqual(lines, ['hello', 'last']);
});

function fixture(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'deploy-test-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  for (const name of ['.output', '.output_prod']) {
    fs.mkdirSync(path.join(root, name));
    fs.writeFileSync(path.join(root, name, 'index.html'), 'OLD VERSION');
  }
  return root;
}
const commit = 'a'.repeat(40);
function archiveRunner(content, calls) {
  return async command => {
    calls.push(command);
    if (command.startsWith('tar ')) {
      const checkout = command.match(/ -C '([^']+)'/)[1];
      fs.mkdirSync(path.join(checkout, '.output'));
      fs.writeFileSync(path.join(checkout, '.output', 'index.html'), content);
    }
    return { code: 0, stdout: '', stderr: '' };
  };
}
test('build uses commit archive, replaces obsolete files, and restores previous output on rollback', async t => {
  const root = fixture(t), calls = [];
  fs.writeFileSync(path.join(root, '.output_prod', 'removed.js'), 'obsolete');
  const transaction = await ensureProjectBuildOutputs({ appDir: root }, commit, 'production', () => {}, archiveRunner('NEW VERSION', calls));
  assert.equal(fs.readFileSync(path.join(root, '.output_prod', 'index.html'), 'utf8'), 'NEW VERSION');
  assert.equal(fs.existsSync(path.join(root, '.output_prod', 'removed.js')), false);
  assert.equal(calls.length, 2);
  transaction.rollback();
  assert.equal(fs.readFileSync(path.join(root, '.output_prod', 'index.html'), 'utf8'), 'OLD VERSION');
  assert.equal(fs.existsSync(path.join(root, '.output_prod', 'removed.js')), true);
});
test('archive failure preserves active version and does not accept stale root outputs', async t => {
  const root = fixture(t);
  await assert.rejects(ensureProjectBuildOutputs({ appDir: root }, commit, 'production', () => {}, async () => { throw Error('archive failed'); }), /archive failed/);
  assert.equal(fs.readFileSync(path.join(root, '.output_prod', 'index.html'), 'utf8'), 'OLD VERSION');
});
test('cache requires full commit provenance and separates environments', async t => {
  const root = fixture(t), calls = [];
  const project = { appDir: root };
  const first = await ensureProjectBuildOutputs(project, commit, 'production', () => {}, archiveRunner('PROD', calls));
  first.finish();
  const second = await ensureProjectBuildOutputs(project, commit, 'production', () => {}, async () => { throw Error('should use cache'); });
  assert.equal(second.source, 'verified_cache'); second.finish();
  const staging = await ensureProjectBuildOutputs(project, commit, 'staging', () => {}, archiveRunner('STAGING', calls));
  staging.finish();
  assert.equal(fs.readFileSync(path.join(root, '.output_prod', 'index.html'), 'utf8'), 'PROD');
  assert.equal(fs.readFileSync(path.join(root, '.output_staging', 'index.html'), 'utf8'), 'STAGING');
  // A different commit with the same short prefix must not reuse this entry.
  const collision = await ensureProjectBuildOutputs(project, 'a'.repeat(7) + 'b'.repeat(33), 'production', () => {}, archiveRunner('COLLISION', calls));
  assert.equal(collision.source, 'verified_commit'); collision.finish();
  assert.equal(fs.readFileSync(path.join(root, '.output_prod', 'index.html'), 'utf8'), 'COLLISION');
});

import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import crypto from 'node:crypto';

export const shellQuote = value => "'" + String(value).replaceAll("'", "'\\''") + "'";

export function runCommandStreaming(cmd, cwd, onLine = () => {}, options = {}) {
  return new Promise((resolve, reject) => {
    const windows = process.platform === 'win32';
    const shell = windows ? (process.env.ComSpec || 'cmd.exe') : '/bin/bash';
    const child = spawn(shell, windows ? ['/d', '/s', '/c', `"${cmd}"`] : ['-c', cmd], {
      cwd: cwd || process.cwd(), env: options.env || process.env, windowsVerbatimArguments: windows, detached: !windows,
    });
    let stdout = '', stderr = '', timedOut = false;
    const timer = setTimeout(() => {
      timedOut = true;
      try { if (windows) child.kill(); else process.kill(-child.pid, 'SIGKILL'); } catch {}
      reject(new Error('Tempo limite de execução excedido.'));
    }, options.timeout || 300000);
    for (const [stream, isError] of [[child.stdout, false], [child.stderr, true]]) {
      let pending = '';
      stream?.on('data', chunk => {
        const text = chunk.toString();
        if (isError) stderr += text; else stdout += text;
        pending += text;
        const lines = pending.split(/\r?\n/);
        pending = lines.pop();
        for (const line of lines) if (line.trim()) onLine(line.trim());
      });
      stream?.on('end', () => { if (pending.trim()) onLine(pending.trim()); });
    }
    child.on('error', err => { clearTimeout(timer); reject(err); });
    child.on('close', (code, signal) => {
      clearTimeout(timer);
      if (code !== 0 || timedOut) {
        // Do not include the command: it may contain authentication credentials.
        const error = new Error(timedOut ? 'Tempo limite de execução excedido.' : `Comando falhou (código ${code ?? signal}).`);
        Object.assign(error, { code, stdout, stderr });
        reject(error);
      } else resolve({ code, stdout, stderr });
    });
  });
}

const hasFiles = dir => fs.existsSync(dir) && fs.statSync(dir).isDirectory() && fs.readdirSync(dir).length > 0;

// Only accept artifacts extracted from the requested commit, or built in its
// isolated checkout. Legacy caches without provenance are deliberately rebuilt.
export async function ensureProjectBuildOutputs(project, commitHash, environment, emitLog = () => {}, run = runCommandStreaming) {
  if (!/^[a-f0-9]{40}$/i.test(commitHash)) throw new Error('Commit completo inválido para compilação.');
  if (!['production', 'staging'].includes(environment)) throw new Error('Ambiente inválido.');
  const root = path.resolve(project.appDir);
  const cacheRoot = path.join(root, '.build_cache');
  const cacheDir = path.join(cacheRoot, commitHash.slice(0, 7), environment);
  const output = path.join(cacheDir, 'output');
  const manifestFile = path.join(cacheDir, 'manifest.json');
  const envDigest = crypto.createHash('sha256');
  for (const name of ['.env', `.env.${environment}`]) {
    envDigest.update(name);
    const file = path.join(root, name);
    if (fs.existsSync(file)) envDigest.update(fs.readFileSync(file));
  }
  const environmentHash = envDigest.digest('hex');
  let valid = false;
  try {
    const manifest = JSON.parse(fs.readFileSync(manifestFile, 'utf8'));
    valid = manifest.commit === commitHash && manifest.environment === environment && manifest.environmentHash === environmentHash && hasFiles(output);
  } catch {}
  fs.mkdirSync(cacheRoot, { recursive: true });
  if (!valid) {
    const work = fs.mkdtempSync(path.join(cacheRoot, '.work-'));
    try {
      const checkout = path.join(work, 'source');
      const archive = path.join(work, 'source.tar');
      fs.mkdirSync(checkout);
      await run(`git archive --format=tar -o ${shellQuote(archive)} ${commitHash}`, root, emitLog);
      await run(`tar -xf ${shellQuote(archive)} -C ${shellQuote(checkout)}`, root, emitLog);
      let artifact = ['.output', 'dist'].map(dir => path.join(checkout, dir)).find(hasFiles);
      if (!artifact) {
        const pkgPath = path.join(checkout, 'package.json');
        const pkg = fs.existsSync(pkgPath) ? JSON.parse(fs.readFileSync(pkgPath, 'utf8')) : {};
        const script = pkg.scripts?.build ? 'build' : pkg.scripts?.['build:prod'] ? 'build:prod' : null;
        if (!script) throw new Error('O commit não contém outputs nem um script de compilação. A versão ativa foi preservada.');
        // Environment files are deployment inputs, never read from an unrelated checkout.
        for (const name of ['.env', `.env.${environment}`]) {
          const from = path.join(root, name);
          if (fs.existsSync(from)) fs.copyFileSync(from, path.join(checkout, name));
        }
        emitLog(`A compilar o commit ${commitHash.slice(0, 7)} num diretório isolado...`);
        const install = fs.existsSync(path.join(checkout, 'package-lock.json')) ? 'npm ci' : 'npm install';
        await run(`docker run --rm -v ${shellQuote(`${checkout}:/app`)} -w /app node:20-bookworm-slim sh -c ${shellQuote(`${install} --no-audit --legacy-peer-deps && npm run ${script}`)}`, root, emitLog);
        artifact = ['.output', 'dist'].map(dir => path.join(checkout, dir)).find(hasFiles);
        if (!artifact) throw new Error('A compilação terminou sem gerar .output ou dist.');
      }
      fs.mkdirSync(cacheDir, { recursive: true });
      fs.rmSync(output, { recursive: true, force: true });
      fs.cpSync(artifact, output, { recursive: true });
      fs.writeFileSync(manifestFile, JSON.stringify({ commit: commitHash, environment, environmentHash }));
    } finally {
      fs.rmSync(work, { recursive: true, force: true });
    }
  }
  const target = path.join(root, environment === 'production' ? '.output_prod' : '.output_staging');
  const transaction = fs.mkdtempSync(path.join(cacheRoot, '.previous-'));
  const backup = path.join(transaction, 'output');
  const hadPrevious = fs.existsSync(target);
  if (hadPrevious) fs.cpSync(target, backup, { recursive: true });
  const restore = () => {
    fs.rmSync(target, { recursive: true, force: true });
    if (hadPrevious) fs.cpSync(backup, target, { recursive: true });
  };
  try {
    fs.rmSync(target, { recursive: true, force: true });
    fs.cpSync(output, target, { recursive: true });
  } catch (err) { restore(); fs.rmSync(transaction, { recursive: true, force: true }); throw err; }
  return {
    ok: true, source: valid ? 'verified_cache' : 'verified_commit',
    rollback() { restore(); fs.rmSync(transaction, { recursive: true, force: true }); },
    finish() { fs.rmSync(transaction, { recursive: true, force: true }); },
  };
}

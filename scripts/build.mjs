import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const root = resolve(new URL('..', import.meta.url).pathname);
const nodeCommand = process.platform === 'win32' ? 'node' : process.execPath;
const run = (command, args) => execFileSync(command, args, { cwd: root, stdio: 'inherit', shell: process.platform === 'win32' });

// This repository is the Deployment Center itself, so its production artifact
// is the Docker image. There is no frontend bundler or application .output
// bundle to copy here. Keep a small, deterministic manifest for the image and
// let Dockerfile run the complete test suite before packaging it.
run(nodeCommand, ['--check', 'server.js']);
run(nodeCommand, ['--test']);
const outputDir = resolve(root, '.deployment-build');
mkdirSync(outputDir, { recursive: true });
writeFileSync(resolve(outputDir, 'manifest.json'), JSON.stringify({
  artifact: 'docker-image',
  source: 'server.js',
  generatedAt: new Date().toISOString(),
}, null, 2) + '\n');
console.log(`Build validado. Artefacto de produção: Docker image (manifest em ${outputDir}).`);

import { cpSync, copyFileSync, mkdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

copyFileSync('source-index.html', 'index.html');
const result = spawnSync(process.execPath, ['node_modules/vite/bin/vite.js', 'build'], { stdio: 'inherit' });

if (result.status !== 0) process.exit(result.status ?? 1);

copyFileSync('dist/index.html', 'index.html');
mkdirSync('assets', { recursive: true });
cpSync('dist/assets', 'assets', { recursive: true });
copyFileSync('public/icon.svg', 'icon.svg');
copyFileSync('public/medicines.json', 'medicines.json');

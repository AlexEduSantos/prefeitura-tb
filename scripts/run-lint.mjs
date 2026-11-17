import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { relative, resolve } from 'node:path';

const workspace = process.argv[2];
const files = process.argv.slice(3);

if (!workspace || files.length === 0) {
  process.exit(0);
}

const workspaceDir = resolve(process.cwd(), workspace);
const relativeFiles = files.map((file) => relative(workspaceDir, resolve(file)));
const eslintScript = resolve(workspaceDir, 'node_modules', 'eslint', 'bin', 'eslint.js');

if (!existsSync(eslintScript)) {
  process.exit(0);
}

const result = spawnSync(
  process.execPath,
  [
    eslintScript,
    '--quiet',
    '--fix',
    '--no-error-on-unmatched-pattern',
    ...relativeFiles,
  ],
  {
    cwd: workspaceDir,
    stdio: 'inherit',
  },
);

process.exit(result.status ?? 1);

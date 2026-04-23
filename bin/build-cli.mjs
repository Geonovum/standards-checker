#!/usr/bin/env node
import { spawn } from 'node:child_process';
import { realpathSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(realpathSync(fileURLToPath(import.meta.url)));
const tsdownEntry = require.resolve('tsdown');
const tsdownRoot = tsdownEntry.match(/^(.+[/\\]tsdown)[/\\]/)[1];
const bin = join(tsdownRoot, 'dist', 'run.mjs');

const userArgs = process.argv.slice(2);
const args = [bin, ...userArgs, '--format', 'esm', '--platform', 'node', '--sourcemap', '--out-dir', 'dist', '--clean'];
const child = spawn(process.execPath, args, { stdio: 'inherit' });
child.on('exit', code => process.exit(code ?? 1));

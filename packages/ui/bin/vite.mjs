#!/usr/bin/env node
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { join } from 'node:path';

const require = createRequire(import.meta.url);
const viteEntry = require.resolve('vite');
const viteRoot = viteEntry.match(/^(.+[/\\]vite)[/\\]/)[1];
const bin = join(viteRoot, 'bin', 'vite.js');
const child = spawn(process.execPath, [bin, ...process.argv.slice(2)], { stdio: 'inherit' });
child.on('exit', code => process.exit(code ?? 1));

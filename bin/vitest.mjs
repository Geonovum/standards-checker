#!/usr/bin/env node
import { spawn } from 'node:child_process';
import { realpathSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(realpathSync(fileURLToPath(import.meta.url)));
const vitestEntry = require.resolve('vitest');
const vitestRoot = vitestEntry.match(/^(.+[/\\]vitest)[/\\]/)[1];
const bin = join(vitestRoot, 'vitest.mjs');
const child = spawn(process.execPath, [bin, ...process.argv.slice(2)], { stdio: 'inherit' });
child.on('exit', code => process.exit(code ?? 1));

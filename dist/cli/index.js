#!/usr/bin/env node
import { Command } from 'commander';
import { pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import process from 'node:process';
import { globby } from 'globby';
import * as Engine from '../index.js';
const program = new Command().name('standards-checker');
program
    .command('validate')
    .requiredOption('--rule <name>', "Ruleset naam, bv. 'json-fg'")
    .option('--ruleset-index <file>', 'Pad naar index.js van de ruleset')
    .option('--ruleset-dir <dir>', 'Map met index.js van de ruleset')
    .option('--json <file>', "JSON bestand of '-' voor stdin", '-')
    .option('--format <fmt>', 'table|json|sarif|junit', 'table')
    .option('--fail-on <lvl>', 'none|warn|error', 'error')
    .action(async (options) => {
    try {
        const indexPath = await resolveIndexPath(options);
        const mod = await importModule(indexPath);
        const plugins = extractPluginIndex(mod, indexPath);
        const plugin = selectPlugin(plugins, options.rule);
        const document = await readJsonInput(options.json ?? '-');
        const runResult = await invokeEngine(document, plugin, options);
        if (runResult.output) {
            console.log(runResult.output);
        }
        process.exitCode = runResult.exitCode;
    }
    catch (error) {
        const err = error;
        let message = err?.message ?? String(err);
        if (!message && Array.isArray(err.errors) && err.errors.length > 0) {
            message = err.errors
                .map(inner => (inner && typeof inner === 'object' && 'message' in inner ? String(inner.message) : String(inner)))
                .join('; ');
        }
        console.error(`[standards-checker] ${message}`);
        process.exit(2);
    }
});
program.parseAsync(process.argv);
async function resolveIndexPath(options) {
    if (options.rulesetIndex && options.rulesetDir) {
        throw new Error('Gebruik óf --ruleset-index óf --ruleset-dir (niet allebei).');
    }
    if (options.rulesetIndex) {
        const target = resolve(process.cwd(), options.rulesetIndex);
        if (!existsSync(target)) {
            throw new Error(`--ruleset-index niet gevonden: ${target}`);
        }
        return target;
    }
    if (options.rulesetDir) {
        const dir = resolve(process.cwd(), options.rulesetDir);
        const matches = await globby(['index.{js,cjs,mjs}'], {
            cwd: dir,
            absolute: true,
            deep: 0,
        });
        if (matches.length === 0) {
            throw new Error(`Geen index.{js,cjs,mjs} gevonden in: ${dir}`);
        }
        return matches[0];
    }
    throw new Error('Verplicht: --ruleset-index <file> of --ruleset-dir <dir>.');
}
async function importModule(filePath) {
    const url = pathToFileURL(filePath).href;
    try {
        return await import(url);
    }
    catch (error) {
        const require = createRequire(import.meta.url);
        return require(filePath);
    }
}
const extractPluginIndex = (mod, sourcePath) => {
    const maybeIndex = (mod && typeof mod === 'object' && mod.default && typeof mod.default === 'object' && mod.default) ||
        (mod && typeof mod === 'object' && mod.rulesets && typeof mod.rulesets === 'object' && mod.rulesets);
    if (!maybeIndex) {
        throw new Error(`Index '${sourcePath}' levert geen bruikbare export. Verwacht default export { "<rule>": plugin } of named export { rulesets: {...} }.`);
    }
    const normalized = {};
    for (const [key, value] of Object.entries(maybeIndex)) {
        if (value && typeof value === 'object') {
            const plugin = value;
            normalized[key] = {
                ...plugin,
                id: plugin.id ?? key,
            };
        }
        else {
        }
    }
    if (Object.keys(normalized).length === 0) {
        throw new Error(`Index '${sourcePath}' bevat geen rulesets.`);
    }
    return normalized;
};
const selectPlugin = (index, rule) => {
    const plugin = index[rule];
    if (!plugin) {
        const available = Object.keys(index).sort().join(', ');
        throw new Error(`Ruleset '${rule}' niet gevonden. Beschikbaar: ${available || '(geen)'} .`);
    }
    return plugin;
};
async function readJsonInput(specifier) {
    if (!specifier || specifier === '-') {
        const chunks = [];
        for await (const chunk of process.stdin) {
            chunks.push(Buffer.from(chunk));
        }
        const content = Buffer.concat(chunks).toString('utf8').trim();
        if (!content) {
            throw new Error('Lege stdin (geen JSON ontvangen).');
        }
        return parseMaybeJson(content, 'stdin');
    }
    if (isHttpUrl(specifier)) {
        const response = await fetch(specifier, {
            headers: { Accept: 'application/json' },
        });
        if (!response.ok) {
            throw new Error(`Kon URL niet ophalen (${response.status} ${response.statusText}): ${specifier}`);
        }
        const body = await response.text();
        if (!body.trim()) {
            throw new Error(`Lege respons ontvangen van URL: ${specifier}`);
        }
        return parseMaybeJson(body, specifier);
    }
    const filePath = resolve(process.cwd(), specifier);
    if (!existsSync(filePath)) {
        throw new Error(`JSON bestand niet gevonden: ${filePath}`);
    }
    const buffer = readFileSync(filePath, 'utf8');
    return parseMaybeJson(buffer, filePath);
}
async function invokeEngine(document, plugin, options) {
    if (typeof Engine.run !== 'function') {
        throw new Error('Core-engine exporteert geen run(doc, plugin, opts) methode.');
    }
    return Engine.run(document, plugin, {
        format: options.format,
        failOn: options.failOn,
    });
}
const isHttpUrl = (value) => /^https?:\/\//i.test(value);
const parseMaybeJson = (value, source) => {
    try {
        return JSON.parse(value);
    }
    catch (error) {
        if (source) {
            if (!value.trim()) {
                throw new Error(`JSON bestand is leeg: ${source}`);
            }
        }
        return value;
    }
};

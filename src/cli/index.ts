#!/usr/bin/env node
import { Command } from 'commander';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import process from 'node:process';
import { run } from '../run';
import type { RulesetPlugin, RulesetPluginIndex } from '../types';

export interface CliConfig {
  name: string;
  plugins: RulesetPluginIndex;
}

interface ValidateOptions {
  ruleset: string;
  input?: string;
  format?: string;
  failOn?: string;
}

export const createCli = (config: CliConfig) => {
  const { name, plugins } = config;

  const program = new Command().name(name);

  program
    .command('validate')
    .requiredOption('--ruleset <name>', `Ruleset name (available: ${Object.keys(plugins).join(', ')})`)
    .option('--input <file>', "Input file, URL, or '-' for stdin", '-')
    .option('--format <fmt>', 'table|json', 'table')
    .option('--fail-on <lvl>', 'none|warn|error', 'error')
    .action(async (options: ValidateOptions) => {
      try {
        const plugin = selectPlugin(plugins, options.ruleset);
        const document = await readInput(options.input ?? '-');
        const runResult = await invokeEngine(document, plugin, options);

        if (runResult.output) {
          console.log(runResult.output);
        }

        process.exitCode = runResult.exitCode;
      } catch (error) {
        const err = error as Error & { errors?: unknown[] };
        let message = err?.message ?? String(err);

        if (!message && Array.isArray(err.errors) && err.errors.length > 0) {
          message = err.errors
            .map(inner =>
              inner && typeof inner === 'object' && 'message' in inner ? String((inner as { message: unknown }).message) : String(inner),
            )
            .join('; ');
        }

        console.error(`[${name}] ${message}`);
        process.exit(2);
      }
    });

  program.parseAsync(process.argv);
};

const selectPlugin = (index: RulesetPluginIndex, rule: string): RulesetPlugin => {
  const plugin = index[rule];

  if (!plugin) {
    const available = Object.keys(index).sort().join(', ');
    throw new Error(`Ruleset '${rule}' not found. Available: ${available || '(none)'}.`);
  }

  return plugin;
};

const ACCEPT_HEADER = 'application/json, application/yaml;q=0.9, text/yaml;q=0.9, */*;q=0.1';

async function readInput(specifier: string): Promise<string> {
  if (!specifier || specifier === '-') {
    const chunks: Buffer[] = [];

    for await (const chunk of process.stdin) {
      chunks.push(Buffer.from(chunk));
    }

    const content = Buffer.concat(chunks).toString('utf8').trim();

    if (!content) {
      throw new Error('Empty stdin (no content received).');
    }

    return content;
  }

  if (isHttpUrl(specifier)) {
    const response = await fetch(specifier, {
      headers: { Accept: ACCEPT_HEADER },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch URL (${response.status} ${response.statusText}): ${specifier}`);
    }

    const body = await response.text();

    if (!body.trim()) {
      throw new Error(`Empty response from URL: ${specifier}`);
    }

    return body;
  }

  const filePath = resolve(process.cwd(), specifier);

  if (!existsSync(filePath)) {
    throw new Error(`Input file not found: ${filePath}`);
  }

  return readFileSync(filePath, 'utf8');
}

async function invokeEngine(document: unknown, plugin: RulesetPlugin, options: ValidateOptions) {
  return run(document, plugin, {
    format: options.format,
    failOn: options.failOn,
  });
}

const isHttpUrl = (value: string): boolean => /^https?:\/\//i.test(value);

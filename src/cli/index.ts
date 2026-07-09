#!/usr/bin/env node
import { Command } from 'commander';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import process from 'node:process';
import { run } from '../run';
import { buildLegacyIndex, findStandard, findVersion, resolveDefaultVersion, type Standard, type StandardVersion } from '../standards';
import type { RulesetPlugin } from '../types';

export interface CliConfig {
  name: string;
  standards: Standard[];
}

interface ValidateOptions {
  standard?: string;
  version?: string;
  ruleset?: string;
  input?: string;
  format?: string;
  failOn?: string;
}

interface Selection {
  standard: Standard;
  version: StandardVersion;
}

export const createCli = (config: CliConfig) => {
  const { name, standards } = config;

  const program = new Command().name(name);

  program
    .command('validate')
    .option('--standard <slug>', `Standard to validate against (available: ${standards.map(standard => standard.slug).join(', ')})`)
    .option('--version <id>', 'Version id of the standard (default: latest final version)')
    .option('--ruleset <name>', 'Deprecated alias for --standard/--version')
    .option('--input <file>', "Input file, URL, or '-' for stdin", '-')
    .option('--format <fmt>', 'table|json', 'table')
    .option('--fail-on <lvl>', 'none|warn|error', 'error')
    .action(async (options: ValidateOptions) => {
      try {
        const { standard, version } = resolveSelection(standards, options);
        const plugin: RulesetPlugin = { id: `${standard.slug}@${version.id}`, rulesets: version.rulesets };
        const document = await readInput(options.input ?? '-');
        const runResult = await run(document, plugin, { format: options.format, failOn: options.failOn });

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

// `--ruleset` takes precedence and resolves via the legacy map (auto-derived
// from the config), so old slugs keep resolving to the exact same
// (standard, version). Otherwise `--standard` (+ optional `--version`) is used,
// defaulting to the same version the UI would pick.
const resolveSelection = (standards: Standard[], options: ValidateOptions): Selection => {
  if (options.ruleset) {
    // stderr keeps `--format json` stdout clean.
    console.error('Warning: --ruleset is deprecated; use --standard/--version');

    const legacy = buildLegacyIndex(standards);
    const hit = legacy.get(options.ruleset);

    if (!hit) {
      const available = [...legacy.keys()].sort().join(', ');
      throw new Error(`Ruleset '${options.ruleset}' not found. Available: ${available || '(none)'}.`);
    }

    return { standard: hit.standard, version: hit.version };
  }

  if (!options.standard) {
    const available = standards.map(standard => standard.slug).join(', ');
    throw new Error(`--standard is required. Available: ${available || '(none)'}.`);
  }

  const standard = findStandard(standards, options.standard);

  if (!standard) {
    const available = standards.map(candidate => candidate.slug).join(', ');
    throw new Error(`Standard '${options.standard}' not found. Available: ${available || '(none)'}.`);
  }

  if (options.version) {
    const version = findVersion(standard, options.version);

    if (!version) {
      const available = standard.versions.map(candidate => candidate.id).join(', ');
      throw new Error(`Version '${options.version}' not found for standard '${standard.slug}'. Available: ${available}.`);
    }

    return { standard, version };
  }

  return { standard, version: resolveDefaultVersion(standard) };
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

const isHttpUrl = (value: string): boolean => /^https?:\/\//i.test(value);

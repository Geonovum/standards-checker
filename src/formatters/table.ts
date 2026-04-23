import type { RulesetPlugin, ValidationDiagnostic, ValidationResult } from '../types';
import { groupBy } from '../util';

const renderPath = (path: (string | number)[]): string => {
  if (!path || path.length === 0) {
    return '[]';
  }

  return JSON.stringify(path);
};

const SEVERITY_ORDER = ['error', 'warning', 'info', 'hint'] as const;

const SEVERITY_LABELS: Record<string, string> = {
  error: 'Errors',
  warning: 'Warnings',
  info: 'Info',
  hint: 'Hints',
};

const renderDiagnosticGroup = (severity: string, diagnostics: ValidationDiagnostic[], startIndex: number): string[] => {
  if (diagnostics.length === 0) return [];

  const lines: string[] = [];
  lines.push(`${SEVERITY_LABELS[severity]} (${diagnostics.length})`);

  diagnostics.forEach((diagnostic, i) => {
    lines.push(`  ${startIndex + i + 1}. ${diagnostic.code}`);
    lines.push(`     message: ${diagnostic.message}`);
    lines.push(`     path: ${renderPath(diagnostic.path)}`);

    if (diagnostic.source) {
      lines.push(`     source: ${diagnostic.source}`);
    }

    if (diagnostic.documentationUrl) {
      lines.push(`     docs: ${diagnostic.documentationUrl}`);
    }
  });

  return lines;
};

export const renderTable = (plugin: RulesetPlugin, result: ValidationResult): string => {
  const title = plugin.id;

  const counts = result.diagnostics.reduce(
    (acc, diagnostic) => {
      acc[diagnostic.severity] += 1;
      return acc;
    },
    { error: 0, warning: 0, info: 0, hint: 0 },
  );

  const summaryLines = [
    `Ruleset: ${title}`,
    `Applied rulesets: ${result.rulesets.join(', ') || '(none)'}`,
    `Diagnostics: ${result.diagnostics.length} (errors ${counts.error}, warnings ${counts.warning}, info ${counts.info}, hints ${counts.hint})`,
  ];

  if (result.diagnostics.length === 0) {
    return summaryLines.concat('No diagnostics.').join('\n');
  }

  const lines: string[] = [...summaryLines, ''];

  const grouped = groupBy(result.diagnostics, d => d.severity);
  let index = 0;

  for (const severity of SEVERITY_ORDER) {
    const group = grouped[severity] ?? [];
    const groupLines = renderDiagnosticGroup(severity, group, index);

    if (groupLines.length > 0) {
      lines.push(...groupLines, '');
      index += group.length;
    }
  }

  return lines.join('\n').trimEnd();
};

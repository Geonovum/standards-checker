import type { RulesetPlugin, ValidationDiagnostic, ValidationResult } from '../types';

const renderPath = (path: (string | number)[]): string => {
  if (!path || path.length === 0) {
    return '(root)';
  }

  return path.map(segment => (typeof segment === 'number' ? `[${segment}]` : segment.replace(/\./g, '\\.'))).join('.');
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
    return summaryLines.concat('No issues found.').join('\n');
  }

  const lines: string[] = [...summaryLines, ''];

  result.diagnostics.forEach((diagnostic: ValidationDiagnostic, index: number) => {
    const location = diagnostic.range ? `${diagnostic.range.start.line + 1}:${diagnostic.range.start.character + 1}` : 'n/a';

    lines.push(`${index + 1}. ${diagnostic.severity.toUpperCase()} ${diagnostic.code}`);
    lines.push(`   message: ${diagnostic.message}`);
    lines.push(`   path: ${renderPath(diagnostic.path)} @ ${location}`);

    if (diagnostic.source) {
      lines.push(`   source: ${diagnostic.source}`);
    }

    if (diagnostic.documentationUrl) {
      lines.push(`   docs: ${diagnostic.documentationUrl}`);
    }
  });

  return lines.join('\n');
};

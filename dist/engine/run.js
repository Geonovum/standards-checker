import * as SpectralCore from '@stoplight/spectral-core';
import * as Parsers from '@stoplight/spectral-parsers';
import * as SpectralFormats from '@stoplight/spectral-formats';
import { mapSeverity } from './types';
const spectralCore = SpectralCore.default ?? SpectralCore;
const parsers = Parsers.default ?? Parsers;
const spectralFormats = (SpectralFormats.default ??
    SpectralFormats);
const { Document, Spectral } = spectralCore;
const { Json } = parsers;
const severityWeight = {
    error: 3,
    warning: 2,
    info: 1,
    hint: 0,
};
const sarifSeverity = {
    error: 'error',
    warning: 'warning',
    info: 'note',
    hint: 'note',
};
const DEFAULT_FORMAT = 'table';
const DEFAULT_FAIL_ON = 'error';
const toRulesetDefinition = (value) => {
    if (!value || typeof value !== 'object') {
        return undefined;
    }
    if ('rules' in value || 'extends' in value) {
        return value;
    }
    return undefined;
};
const normalizeRulesets = (plugin) => {
    const map = {};
    if (plugin.rulesets && typeof plugin.rulesets === 'object') {
        for (const [key, value] of Object.entries(plugin.rulesets)) {
            const ruleset = toRulesetDefinition(value);
            if (ruleset) {
                map[key] = withResolvedFormats(ruleset, `${plugin.id}:${key}`);
            }
        }
    }
    if (plugin.rules) {
        const rulesArray = Array.isArray(plugin.rules) ? plugin.rules : [plugin.rules];
        const ruleset = rulesArray.map(toRulesetDefinition).find(Boolean);
        if (ruleset) {
            map[plugin.id] = withResolvedFormats(ruleset, plugin.id);
        }
    }
    const ids = Object.keys(map);
    if (ids.length === 0) {
        throw new Error(`Ruleset plugin '${plugin.id}' bevat geen geldige rulesets.`);
    }
    return { map, ids };
};
const isFormatFunction = (candidate) => typeof candidate === 'function';
const resolveFormat = (format) => {
    if (isFormatFunction(format)) {
        return format;
    }
    if (typeof format === 'string' && isFormatFunction(spectralFormats[format])) {
        return spectralFormats[format];
    }
    return undefined;
};
const withResolvedFormats = (ruleset, id) => {
    if (!ruleset.formats) {
        return ruleset;
    }
    const original = Array.isArray(ruleset.formats) ? ruleset.formats : Array.from(ruleset.formats);
    const resolved = original.map(resolveFormat).filter((format) => isFormatFunction(format));
    if (Array.isArray(ruleset.formats)) {
        ruleset.formats = resolved;
    }
    else {
        ruleset.formats = new Set(resolved);
    }
    return ruleset;
};
const ensureValidationResult = (value) => {
    if (!value || typeof value !== 'object') {
        throw new Error('Postprocess hook moet een validation result teruggeven.');
    }
    const candidate = value;
    if (!Array.isArray(candidate.diagnostics)) {
        throw new Error('Validation result mist diagnostics array.');
    }
    return candidate;
};
const shouldFail = (diagnostics, failOn) => {
    switch (failOn) {
        case 'none':
            return false;
        case 'warn':
            return diagnostics.some(diagnostic => severityWeight[diagnostic.severity] >= severityWeight.warning);
        default:
            return diagnostics.some(diagnostic => diagnostic.severity === 'error');
    }
};
const renderPath = (path) => {
    if (!path || path.length === 0) {
        return '(root)';
    }
    return path.map(segment => (typeof segment === 'number' ? `[${segment}]` : segment.replace(/\./g, '\\.'))).join('.');
};
const renderTable = (plugin, result) => {
    const title = plugin.id;
    const counts = result.diagnostics.reduce((acc, diagnostic) => {
        acc[diagnostic.severity] += 1;
        return acc;
    }, { error: 0, warning: 0, info: 0, hint: 0 });
    const summaryLines = [
        `Ruleset: ${title}`,
        `Applied rulesets: ${result.rulesets.join(', ') || '(none)'}`,
        `Diagnostics: ${result.diagnostics.length} (errors ${counts.error}, warnings ${counts.warning}, info ${counts.info}, hints ${counts.hint})`,
    ];
    if (result.diagnostics.length === 0) {
        return summaryLines.concat('No issues found.').join('\n');
    }
    const lines = [...summaryLines, ''];
    result.diagnostics.forEach((diagnostic, index) => {
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
const renderJson = (plugin, result) => JSON.stringify({
    plugin: {
        id: plugin.id,
    },
    result,
}, null, 2);
const renderSarif = (plugin, result) => {
    const title = plugin.id;
    const sarif = {
        version: '2.1.0',
        runs: [
            {
                tool: {
                    driver: {
                        name: title,
                        rules: Array.from(new Map(result.diagnostics.map(diagnostic => [
                            diagnostic.code,
                            {
                                id: diagnostic.code,
                                name: diagnostic.code,
                                shortDescription: { text: diagnostic.message },
                                helpUri: diagnostic.documentationUrl,
                            },
                        ])).values()),
                    },
                },
                results: result.diagnostics.map(diagnostic => ({
                    ruleId: diagnostic.code,
                    level: sarifSeverity[diagnostic.severity],
                    message: { text: diagnostic.message },
                    locations: [
                        {
                            physicalLocation: {
                                artifactLocation: {
                                    uri: 'input.json',
                                },
                                region: diagnostic.range
                                    ? {
                                        startLine: diagnostic.range.start.line + 1,
                                        startColumn: diagnostic.range.start.character + 1,
                                        endLine: diagnostic.range.end.line + 1,
                                        endColumn: diagnostic.range.end.character + 1,
                                    }
                                    : undefined,
                            },
                        },
                    ],
                })),
            },
        ],
    };
    return JSON.stringify(sarif, null, 2);
};
const escapeXml = (value) => value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
const renderJUnit = (plugin, result) => {
    const suiteName = plugin.id;
    const failures = result.diagnostics.filter(diagnostic => diagnostic.severity === 'error' || diagnostic.severity === 'warning');
    const total = result.diagnostics.length || 1;
    const lines = [];
    lines.push('<?xml version="1.0" encoding="UTF-8"?>');
    lines.push('<testsuites>');
    lines.push(`  <testsuite name="${escapeXml(suiteName)}" tests="${total}" failures="${failures.length}" time="0">`);
    if (result.diagnostics.length === 0) {
        lines.push(`    <testcase name="${escapeXml(suiteName)}" classname="${escapeXml(suiteName)}"/>`);
    }
    else {
        result.diagnostics.forEach(diagnostic => {
            const location = diagnostic.range ? `${diagnostic.range.start.line + 1}:${diagnostic.range.start.character + 1}` : 'n/a';
            lines.push(`    <testcase name="${escapeXml(diagnostic.code)}" classname="${escapeXml(suiteName)}">`);
            if (diagnostic.severity === 'error' || diagnostic.severity === 'warning') {
                lines.push(`      <failure type="${diagnostic.severity}" message="${escapeXml(diagnostic.message)}">`);
                lines.push(escapeXml(`path=${renderPath(diagnostic.path)} location=${location}`));
                lines.push('      </failure>');
            }
            else {
                lines.push('      <system-out>');
                lines.push(escapeXml(`${diagnostic.severity.toUpperCase()}: ${diagnostic.message}`));
                lines.push('      </system-out>');
            }
            lines.push('    </testcase>');
        });
    }
    lines.push('  </testsuite>');
    lines.push('</testsuites>');
    return lines.join('\n');
};
const formatOutput = (plugin, result, format) => {
    switch (format) {
        case 'table':
            return renderTable(plugin, result);
        case 'json':
            return renderJson(plugin, result);
        case 'sarif':
            return renderSarif(plugin, result);
        case 'junit':
            return renderJUnit(plugin, result);
        default:
            throw new Error(`Unsupported output format '${format}'.`);
    }
};
const normalizeFormat = (format) => {
    if (!format) {
        return DEFAULT_FORMAT;
    }
    const value = format.toLowerCase();
    if (value === 'table' || value === 'json' || value === 'sarif' || value === 'junit') {
        return value;
    }
    throw new Error(`Unknown format '${format}'. Expected table, json, sarif, or junit.`);
};
const normalizeFailLevel = (level) => {
    if (!level) {
        return DEFAULT_FAIL_ON;
    }
    const value = level.toLowerCase();
    if (value === 'none' || value === 'warn' || value === 'warning' || value === 'error') {
        return value === 'warning' ? 'warn' : value;
    }
    throw new Error(`Unknown fail level '${level}'. Expected none, warn, or error.`);
};
const withPluginFunctions = (ruleset, plugin) => {
    if (!plugin.funcs || typeof plugin.funcs !== 'object') {
        return ruleset;
    }
    const existing = ruleset.functions;
    return {
        ...ruleset,
        functions: {
            ...(existing ?? {}),
            ...plugin.funcs,
        },
    };
};
export const run = async (document, plugin, options = {}) => {
    if (!plugin || typeof plugin !== 'object') {
        throw new Error('Invalid ruleset plugin provided.');
    }
    if (!plugin.id) {
        throw new Error('Ruleset plugin is missing an id property.');
    }
    const format = normalizeFormat(options.format ? String(options.format) : undefined);
    const failOn = normalizeFailLevel(options.failOn ? String(options.failOn) : undefined);
    const context = { plugin };
    const normalized = normalizeRulesets(plugin);
    let workingDocument = document;
    if (plugin.preprocess) {
        workingDocument = await plugin.preprocess(document, context);
    }
    const jsonContent = typeof workingDocument === 'string' ? workingDocument : JSON.stringify(workingDocument, null, 2);
    const diagnostics = [];
    for (const rulesetId of normalized.ids) {
        const spectral = new Spectral();
        spectral.setRuleset(withPluginFunctions(normalized.map[rulesetId], plugin));
        const doc = new Document(jsonContent, Json);
        const violations = await spectral.run(doc);
        diagnostics.push(...violations.map(violation => ({
            severity: mapSeverity(violation.severity),
            message: violation.message,
            code: String(violation.code),
            path: violation.path,
            range: violation.range,
            documentationUrl: violation.documentationUrl,
            source: violation.source ?? rulesetId,
        })));
    }
    const valid = !diagnostics.some(diagnostic => diagnostic.severity === 'error');
    let result = {
        valid,
        diagnostics,
        content: jsonContent,
        rulesets: normalized.ids,
    };
    if (plugin.postprocess) {
        const postResult = await plugin.postprocess(result, context);
        if (postResult) {
            result = ensureValidationResult(postResult);
        }
    }
    const output = formatOutput(plugin, result, format);
    const exitCode = shouldFail(result.diagnostics, failOn) ? 1 : 0;
    return {
        exitCode,
        output,
        result,
    };
};

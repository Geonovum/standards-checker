import { linter } from '@codemirror/lint';
import * as SpectralCore from '@stoplight/spectral-core';
import * as Parsers from '@stoplight/spectral-parsers';
import { DiagnosticSeverity } from '@stoplight/types';
const spectralCore = (SpectralCore.default ??
    SpectralCore);
const parsers = (Parsers.default ??
    Parsers);
const { Document, Spectral } = spectralCore;
const { Json } = parsers;
const mapSeverity = (severity) => {
    switch (severity) {
        case DiagnosticSeverity.Warning:
            return 'warning';
        case DiagnosticSeverity.Information:
            return 'info';
        case DiagnosticSeverity.Hint:
            return 'hint';
        default:
            return 'error';
    }
};
export const spectralLinter = (name, ruleset) => {
    const spectral = new Spectral();
    spectral.setRuleset(ruleset);
    return linter(async (view) => {
        const doc = view.state.doc;
        const document = new Document(doc.toString(), Json);
        const violations = await spectral.run(document);
        return violations.map(violation => ({
            source: name,
            from: doc.line(violation.range.start.line + 1).from + violation.range.start.character,
            to: doc.line(violation.range.end.line + 1).from + violation.range.end.character,
            severity: mapSeverity(violation.severity),
            message: `[${violation.code}] ${violation.message}`,
            documentationUrl: violation.documentationUrl,
        }));
    });
};

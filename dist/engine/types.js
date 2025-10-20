/**
 * Map DiagnosticSeverity to string
 */
export const mapSeverity = (severity) => {
    switch (severity) {
        case 1: // DiagnosticSeverity.Warning
            return 'warning';
        case 2: // DiagnosticSeverity.Information
            return 'info';
        case 3: // DiagnosticSeverity.Hint
            return 'hint';
        default:
            return 'error';
    }
};

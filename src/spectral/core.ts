/** @deprecated Import from '@geonovum/standards-checker/openlint/core' instead. Removed in the next major. */
export * from '../openlint/core';

/** @deprecated Use `OpenLint`. */
export { OpenLint as Spectral } from '../openlint/core';

/** @deprecated Use `IOpenLintDiagnostic` / `IOpenLintFullResult`. */
export type { IOpenLintDiagnostic as ISpectralDiagnostic, IOpenLintFullResult as ISpectralFullResult } from '../openlint/core';

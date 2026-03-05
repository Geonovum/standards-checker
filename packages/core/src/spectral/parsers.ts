/**
 * Re-exports from @stoplight/spectral-parsers.
 * Consumer apps can import from '@geonovum/standards-checker/spectral/parsers'
 * instead of depending on @stoplight/spectral-parsers directly.
 *
 * Uses default import + destructured re-export because @stoplight/spectral-parsers
 * is CJS and `export *` from CJS doesn't expose named exports properly in ESM bundlers.
 */
import SpectralParsers from '@stoplight/spectral-parsers';

export const { parseJson, Json, parseYaml, Yaml } = SpectralParsers;

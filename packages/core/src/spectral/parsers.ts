/**
 * Re-exports from @stoplight/spectral-parsers.
 * Consumer apps can import from '@geonovum/standards-checker/spectral/parsers'
 * instead of depending on @stoplight/spectral-parsers directly.
 *
 * CJS→ESM interop: Node's native ESM puts CJS exports on `.default`, while
 * bundlers (Vite/esbuild) put them directly on the namespace. We handle both.
 */
import * as _SpectralParsers from '@stoplight/spectral-parsers';

const SpectralParsers = (_SpectralParsers as unknown as { default?: typeof _SpectralParsers }).default ?? _SpectralParsers;

export const { parseJson, Json, parseYaml, Yaml } = SpectralParsers;

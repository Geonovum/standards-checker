/**
 * Re-exports from @stoplight/spectral-functions.
 * Consumer apps can import from '@geonovum/standards-checker/spectral/functions'
 * instead of depending on @stoplight/spectral-functions directly.
 *
 * CJS→ESM interop: Node's native ESM puts CJS exports on `.default`, while
 * bundlers (Vite/esbuild) put them directly on the namespace. We handle both.
 */
import * as _spectralFunctions from '@stoplight/spectral-functions';

const spectralFunctions = (_spectralFunctions as unknown as { default?: typeof _spectralFunctions }).default ?? _spectralFunctions;

export const { alphabetical, casing, defined, enumeration, falsy, length, pattern, schema, truthy, unreferencedReusableObject, xor } =
  spectralFunctions;

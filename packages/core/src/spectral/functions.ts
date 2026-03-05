/**
 * Re-exports from @stoplight/spectral-functions.
 * Consumer apps can import from '@geonovum/standards-checker/spectral/functions'
 * instead of depending on @stoplight/spectral-functions directly.
 *
 * Uses default import + destructured re-export because @stoplight/spectral-functions
 * is CJS and `export *` from CJS doesn't expose named exports properly in ESM bundlers.
 */
import spectralFunctions from '@stoplight/spectral-functions';

export const { alphabetical, casing, defined, enumeration, falsy, length, pattern, schema, truthy, unreferencedReusableObject, xor } =
  spectralFunctions;

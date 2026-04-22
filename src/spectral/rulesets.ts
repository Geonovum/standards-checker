/**
 * Re-exports from @stoplight/spectral-rulesets.
 * Consumer apps can import from '@geonovum/standards-checker/spectral/rulesets'
 * instead of depending on @stoplight/spectral-rulesets directly.
 *
 * CJS→ESM interop: Node's native ESM puts CJS exports on `.default`, while
 * bundlers (Vite/esbuild) put them directly on the namespace. We handle both.
 */
import type { RulesetDefinition } from '@stoplight/spectral-core';
import * as _oasModule from '@stoplight/spectral-rulesets/dist/oas';
import * as _oasFunctions from '@stoplight/spectral-rulesets/dist/oas/functions';

const oasModule = (_oasModule as unknown as { default?: RulesetDefinition }).default ?? (_oasModule as unknown as RulesetDefinition);

export const oas: RulesetDefinition = oasModule;

export const {
  oasDiscriminator,
  oasDocumentSchema,
  oasExample,
  oasOpFormDataConsumeCheck,
  oasOpIdUnique,
  oasOpParams,
  oasOpSuccessResponse,
  oasPathParam,
  oasSchema,
  oasSecurityDefined,
  oasTagDefined,
  oasUnusedComponent,
  refSiblings,
  typedEnum,
} = _oasFunctions;

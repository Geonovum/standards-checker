import { describe, expect, expectTypeOf, it } from 'vitest';
import packageJson from '../../package.json';
import * as root from '../index';
import * as openLintCore from '../openlint/core';
import * as openLintFunctions from '../openlint/functions';
import * as openLintParsers from '../openlint/parsers';
import * as openLintRulesets from '../openlint/rulesets';
import * as ui from '../ui';
import type { IOpenLintDiagnostic, IOpenLintFullResult } from '../openlint/core';
import * as spectralCore from './core';
import type { ISpectralDiagnostic, ISpectralFullResult } from './core';
import * as spectralFunctions from './functions';
import * as spectralParsers from './parsers';
import * as spectralRulesets from './rulesets';

// The Spectral names are the public API of 1.4.x. They stay as deprecated aliases until the
// next major, so a consumer that hasn't migrated yet keeps working on a minor upgrade.
describe('deprecated Spectral aliases', () => {
  it('keeps the ./spectral/* subpath export next to ./openlint/*', () => {
    const { exports } = packageJson;

    expect(exports['./spectral/*']).toEqual({ types: './dist/spectral/*.d.ts', import: './dist/spectral/*.js' });
    expect(exports['./openlint/*']).toEqual({ types: './dist/openlint/*.d.ts', import: './dist/openlint/*.js' });
  });

  it.each([
    ['core', spectralCore, openLintCore],
    ['functions', spectralFunctions, openLintFunctions],
    ['parsers', spectralParsers, openLintParsers],
    ['rulesets', spectralRulesets, openLintRulesets],
  ])('spectral/%s re-exports every openlint/%s value unchanged', (_, spectral, openLint) => {
    for (const [name, value] of Object.entries(openLint)) {
      expect(spectral, name).toHaveProperty(name, value);
    }
  });

  it('spectral/core adds Spectral as the OpenLint class', () => {
    expect(spectralCore.Spectral).toBe(openLintCore.OpenLint);
  });

  it('the root entry exports Spectral as the OpenLint class', () => {
    expect(root.Spectral).toBe(root.OpenLint);
  });

  it('the ui entry exports spectralChecker as openLintChecker', () => {
    expect(ui.spectralChecker).toBe(ui.openLintChecker);
  });

  it('keeps the ISpectral* type names', () => {
    expectTypeOf<ISpectralDiagnostic>().toEqualTypeOf<IOpenLintDiagnostic>();
    expectTypeOf<ISpectralFullResult>().toEqualTypeOf<IOpenLintFullResult>();
  });

  it('a deprecated Spectral instance still validates', async () => {
    const spectral = new spectralCore.Spectral();
    spectral.setRuleset({ rules: { 'has-title': { given: '$', then: { field: 'title', function: spectralFunctions.truthy } } } });

    const violations = await spectral.run({ name: 'no title' });

    expect(violations.map(violation => violation.code)).toEqual(['has-title']);
  });
});

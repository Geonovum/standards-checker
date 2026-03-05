# @geonovum/standards-checker

Core validation engine and CLI toolkit for checking documents against [Spectral](https://github.com/stoplightio/spectral) rulesets.

Part of the [standards-checker](../../) workspace. For the web UI, see [`@geonovum/standards-checker-ui`](../ui/).

## Installation

```bash
npm install @geonovum/standards-checker
```

## Exports

| Entry point                                    | Description                                                                                                               |
| ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `@geonovum/standards-checker`                  | Main: validators, types (`RulesetPlugin`, `RulesetPluginIndex`, etc.), constants, Spectral functions                      |
| `@geonovum/standards-checker/engine`           | Engine internals: `validate`, `validateUrl`, `mapSeverity`, utility functions                                             |
| `@geonovum/standards-checker/engine/functions` | Spectral rule functions: `remoteSchema`, `hasParameter`, `hasSchemaMatch`, `hasPathMatch`, `includes`, `date`, `datetime` |
| `@geonovum/standards-checker/engine/util`      | Engine utilities: `errorMessage`, `matchSchema`, `queryPath`, `getParent`, `groupBy`, `groupBySource`                     |
| `@geonovum/standards-checker/shared/util`      | Shared utilities: `formatDocument`, `handleResponse`, `handleResponseJson`, `groupBy`, `groupBySource`                    |
| `@geonovum/standards-checker/shared/constants` | Constants: `APPLICATION_JSON_TYPE`, `APPLICATION_GEO_JSON_TYPE`, `APPLICATION_OPENAPI_JSON_3_0_TYPE`                      |
| `@geonovum/standards-checker/cli`              | CLI toolkit: `createCli` for building per-checker CLIs                                                                    |

## Building a CLI

Each checker app creates its own CLI binary using `createCli`:

```ts
#!/usr/bin/env node
import { createCli } from '@geonovum/standards-checker/cli';
import plugins from './index';

createCli({ name: 'my-checker', plugins });
```

Add a `bin` entry and build script to your `package.json`:

```json
{
  "bin": {
    "my-checker": "./dist/cli.js"
  },
  "scripts": {
    "build:cli": "tsdown src/cli.ts --format esm --platform node --out-dir dist"
  }
}
```

This gives you a CLI with baked-in rulesets:

```bash
my-checker validate --ruleset my-spec --input ./data/document.json
```

See the [workspace README](../../) for all CLI flags and output formats.

## Building a ruleset plugin

A ruleset plugin exposes rulesets to the CLI runner. Create a `RulesetPluginIndex` as the default export of your index:

```ts
import type { RulesetPlugin, RulesetPluginIndex } from '@geonovum/standards-checker';

const plugin: RulesetPlugin = {
  id: 'my-spec',
  rulesets: {
    'http://example.com/conf/core': coreRuleset,
    'http://example.com/conf/extended': extendedRuleset,
  },
};

const index: RulesetPluginIndex = {
  'my-spec': plugin,
};

export default index;
```

### Plugin hooks

Plugins can define optional lifecycle hooks:

```ts
const plugin: RulesetPlugin = {
  id: 'my-spec',
  rulesets: { ... },
  funcs: { myCustomFunction },            // Custom Spectral functions
  preprocess: (doc, ctx) => transform(doc), // Transform input before validation
  postprocess: (result, ctx) => result,     // Modify results after validation
};
```

## Using Spectral functions

The package includes reusable Spectral rule functions:

```ts
import { remoteSchema, hasSchemaMatch, hasParameter } from '@geonovum/standards-checker';
import { errorMessage } from '@geonovum/standards-checker/engine/util';
```

- **`remoteSchema`** — Validates against a remote JSON Schema
- **`hasSchemaMatch`** — Checks if an OpenAPI schema matches a reference schema
- **`hasParameter`** — Checks if an operation has a specific parameter
- **`hasPathMatch`** — Checks if paths matching a pattern exist
- **`includes`** — Checks if a value is included in an array
- **`date` / `datetime`** — Validates date/datetime strings

## License

[EUPL-1.2](../../LICENSE)

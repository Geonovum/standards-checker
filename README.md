# @geonovum/standards-checker

CLI and core library to validate API specifications using **Spectral** rulesets — with an optional, embeddable web UI.

* ✅ Validate OpenAPI/JSON documents against one or more rulesets
* ✅ Use it as a CLI **or** as a library (UI router + linters)
* ✅ Pipe from `stdin`, choose output formats, and fail builds on errors

---

## Installation

### CLI

```bash
# project-local
npm i -D @geonovum/standards-checker

# or global
npm i -g @geonovum/standards-checker
```

### Web UI (library)

Add the UI and hook it up to your ruleset “specs”.

---

## Quick start (CLI)

Validate a JSON/OpenAPI file with a specific rule:

```bash
npx standards-checker validate \
  --ruleset-index ../ogc-checker/dist/index.js \
  --ruleset json-fg \
  --json ./data/spec.json
```

Via **stdin**:

```bash
cat ./data/spec.json | npx standards-checker validate \
  --ruleset-index ../ogc-checker/dist/index.js \
  --ruleset json-fg \
  --json -
```

### CLI flags

* `--ruleset-index <path>`: path to a built ruleset index (required unless `--ruleset-dir` is used)
* `--ruleset-dir <path>`: directory that contains an `index.{js,mjs,cjs}` (auto-detected)
* `--ruleset <name>`: the rule/ruleset key to run (e.g. `json-fg`)
* `--json <file|->`: the JSON/OpenAPI document to validate, or `-` for stdin
* `--format <table|json|sarif|junit>`: output format (default: `table`)
* `--fail-on <none|warn|error>`: exit code policy (default: `error`; exit 1 on errors)

Exit codes:

* `0` = success (no errors beyond threshold)
* `1` = failed per `--fail-on` policy
* `>1` = unexpected error

---

## Building your own ruleset project

In your own repo (e.g. [ogc-checker]), produce a build artifact `dist/index.js` that **default-exports** your rulesets:

```js
// dist/index.js
export default {
  'json-fg': {
    id: 'json-fg',
    version: '1.0.0',
    rules: [
      /* your declarative Spectral rules */
    ],
    funcs: {
      /* optional custom functions */
    },
  },
  // more rulesets...
};
```

You can then pass that index to the CLI via `--ruleset-index` or point `--ruleset-dir` at the folder containing `index.js`.

---

## Using the Web UI (library)

Integrate the UI by exposing your specs and mounting a router.

**1) Define `Spec`s** — connect each ruleset to a Spectral linter.

```ts
// specs/json-fg.ts
import { Spec, spectralLinter } from '@geonovum/standards-checker';
import rulesets from './rulesets';
import example from './examples/feature.json';

const linterName = (confClass: string) => confClass.replace('http://www.opengis.net/spec/', '');

export const jsonFgSpec: Spec = {
  name: 'JSON-FG',
  slug: 'json-fg',
  example: JSON.stringify(example, undefined, 2),
  linters: Object.entries(rulesets).map(([confClass, ruleset]) => ({
    name: linterName(confClass),
    linter: spectralLinter(linterName(confClass), ruleset),
  })),
  strings: {
    noViolations: 'Geen fouten gevonden.',
    showInEditor: 'Toon in editor',
    documentation: 'Documentatie',
  },
};
```

**2) Gather specs and build a router**

```tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { createRouter } from '@geonovum/standards-checker';
import specs from './specs';
import '@geonovum/standards-checker/ui/index.css';

const router = createRouter(specs);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>
);
```

A complete example of this flow lives in the **ogc-checker** repository.

### UI text overrides

Specs can optionally provide a `strings` object to override UI copy:

| Key | Description |
| --- | ----------- |
| `checking` | Message shown while validation runs |
| `noMatchingRulesets` | Message when no linters are available for the spec |
| `noViolations` | Success message when a linter finds no diagnostics |
| `lintingErrorsSummary` | Summary shown when diagnostics exist (`{count}` placeholder is replaced with the number of issues) |
| `showInEditor` | Label for the “jump to location” button in the diagnostics list |
| `documentation` | Label for the documentation link |

---

## Output formats

* `table` (human-readable)
* `json` (machine-readable results)
* `sarif` (for code scanning integrations)
* `junit` (for CI test reporting)

Example `json` (shape simplified):

```json
{
  "rule": "json-fg",
  "summary": { "errors": 2, "warnings": 1 },
  "results": [
    { "code": "my-rule", "severity": "error", "path": ["paths","/items","get"], "message": "..." }
  ]
}
```

---

## Best practices

* **Pin ruleset versions** (e.g., `version: "1.2.0"`) to avoid surprises.
* **Fail fast in CI** with `--fail-on error`.
* **Use `stdin`** when the spec is produced by a previous pipeline step.

---

## Troubleshooting

**“Named export 'oas3_0' not found … '@stoplight/spectral-formats' is a CommonJS module”**

Use a default import with destructuring (ESM ↔ CJS interop):

```ts
// instead of: import { oas3_0 } from '@stoplight/spectral-formats'
import spectralFormats from '@stoplight/spectral-formats';
const { oas3_0 } = spectralFormats;
```

Or use Node’s `createRequire` inside ESM:

```ts
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { oas3_0 } = require('@stoplight/spectral-formats');
```

If using TypeScript, enabling `"esModuleInterop": true` and/or `"allowSyntheticDefaultImports": true` helps.

---

## Requirements

* Node.js **18+** (ESM-compatible setup)
* For TypeScript users: a modern TS config (ESNext modules recommended)

---

## Contributing

Issues and PRs are welcome. Keep PRs focused and include tests where relevant.

---

## License

See `LICENSE` in this repository.

---

## Acknowledgements

Built on top of the excellent **Spectral** linter and the OpenAPI ecosystem.

# @geonovum/standards-checker

CLI en kernbibliotheek voor het valideren van API-specificaties met Spectral-rulesets.

## Installatie

```bash
npm i -D @geonovum/standards-checker
# of globaal
npm i -g @geonovum/standards-checker
```

## Ruleset-project bouwen

In je eigen project (bijv. `ogc-checker`) lever je een build-artifact `dist/index.js` met een default export:

```js
// dist/index.js
export default {
  'json-fg': {
    id: 'json-fg',
    version: '1.0.0',
    meta: { title: 'JSON-FG', targets: ['json'] },
    rules: [/* jouw declaratieve regels */],
    funcs: { /* optionele custom functies */ },
  },
};
```

Bouw:

```bash
npm run build
# verwacht: dist/index.js
```

## Runnen

Met een pad naar de index:

```bash
npx standards-checker run \
  --ruleset-index ../ogc-checker/dist/index.js \
  --rule json-fg \
  --json ./data/spec.json
```

Of met een map (de CLI zoekt `index.{js,mjs,cjs}`):

```bash
npx standards-checker run \
  --ruleset-dir ../ogc-checker/dist \
  --rule json-fg \
  --json ./data/spec.json
```

### Stdin

```bash
cat ./data/spec.json | npx standards-checker run \
  --ruleset-index ../ogc-checker/dist/index.js \
  --rule json-fg \
  --json -
```

### Flags

- `--ruleset-index <pad>`: verplicht, tenzij `--ruleset-dir` is opgegeven
- `--ruleset-dir <pad>`: zoekt automatisch een `index.{js,mjs,cjs}`
- `--rule <naam>`: bijv. `json-fg`
- `--json <bestand|->`: JSON-bestand of `-` voor stdin
- `--format <table|json|sarif|junit>`: standaard `table`
- `--fail-on <none|warn|error>`: standaard `error` (exitcode 1 bij errors)

### Exitcodes

- `0` – OK volgens `--fail-on`
- `1` – Validatiefouten met ernst ≥ ingestelde drempel
- `2` – CLI/IO-fout (onbekende vlaggen, index niet gevonden, enz.)

## Voorbeeld ruleset-project

```json
{
  "name": "ogc-checker",
  "type": "module",
  "scripts": {
    "build": "tsup src/index.ts --format esm --out-dir dist --clean"
  },
  "devDependencies": {
    "tsup": "^8.0.0",
    "typescript": "^5.6.0"
  }
}
```

```ts
// src/index.ts
import type { RulesetPlugin } from '@geonovum/standards-checker';

const jsonFg: RulesetPlugin = {
  id: 'json-fg',
  version: '1.0.0',
  meta: { title: 'JSON-FG', targets: ['json'] },
  rules: [
    // jouw declaratieve regels
  ],
};

export default { 'json-fg': jsonFg };
```

Bouw en verwijs daarna naar `dist/index.js` in de CLI.

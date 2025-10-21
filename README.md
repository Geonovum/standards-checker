# @geonovum/standards-checker

CLI en kernbibliotheek voor het valideren van API-specificaties met Spectral-rulesets.

## Installatie

### website

Integreer de UI door de specs van je ruleset-project beschikbaar te maken en een router op te zetten.

1; **Maak `Spec` definities** – koppel elke ruleset aan een Spectral-linter.

```ts
// specs/json-fg.ts
import { Spec, spectralLinter } from '@geonovum/standards-checker';
import rulesets from './rulesets';
import example from './examples/feature.json';

const linterNaam = (confClass: string) => confClass.replace('http://www.opengis.net/spec/', '');

export const jsonFgSpec: Spec = {
  name: 'JSON-FG',
  slug: 'json-fg',
  example: JSON.stringify(example, undefined, 2),
  linters: Object.entries(rulesets).map(([confClass, ruleset]) => ({
    name: linterNaam(confClass),
    linter: spectralLinter(linterNaam(confClass), ruleset),
  })),
};
```

2; **Verzamel de specs en bouw een router**

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

Een compleet voorbeeld van deze flow staat in de [ogc-checker](https://github.com/Geonovum/ogc-checker) repository.

### cli

```bash
npm i -D @geonovum/standards-checker
# of globaal
npm i -g @geonovum/standards-checker
```

## Ruleset-project bouwen

In je eigen project (bijv. [ogc-checker](https://github.com/Geonovum/ogc-checker)) lever je een build-artifact `dist/index.js` met een default export:

```js
// dist/index.js
export default {
  'json-fg': {
    id: 'json-fg',
    version: '1.0.0',
    rules: [/* jouw declaratieve regels */],
    funcs: { /* optionele custom functies */ },
  },
};
```

## Runnen

Met een pad naar de index:

```bash
npx standards-checker validate \
  --ruleset-index ../ogc-checker/dist/index.js \
  --rule json-fg \
  --json ./data/spec.json
```

### Stdin

```bash
cat ./data/spec.json | npx standards-checker validate \
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

---
'@geonovum/standards-checker': patch
---

Fix YAML stringify under js-yaml v5. js-yaml 5.x dropped its default export in
favor of named exports only, so `import jsYaml from 'js-yaml'` was `undefined`
and `jsYaml.dump(...)` threw. Switch `src/encodings.ts` to the named `dump`
import, which works on both v4 and v5.

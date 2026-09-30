---
'@geonovum/standards-checker': patch
---

Build with tsdown 0.23. `tsdown` is a runtime dependency because the `build-cli` bin drives it, so consumer CLI
builds move to tsdown 0.23 too. The bundle still lands at `dist/cli.mjs`.

The `spectral/rulesets` entry now imports the OAS rule functions from
`@stoplight/spectral-rulesets/dist/oas/functions/index.js` instead of the bare directory. That package has no `exports`
map. tsdown 0.22 appended `/index.js` to the directory import; tsdown 0.23 emits it as written, and Node then rejects
it with `ERR_UNSUPPORTED_DIR_IMPORT`. Naming the file keeps `@geonovum/standards-checker/spectral/rulesets` loadable
from consumer CLIs and Vitest suites.

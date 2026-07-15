---
'@geonovum/standards-checker': minor
---

Support Vite-style `?raw` raw-text imports in CLI builds. `build-cli` now drives the
tsdown JS API with the standard CLI-build options plus a plugin that resolves and
inlines `*?raw` imports (rolldown doesn't implement the suffix natively), and the
`client` types declare `*?raw` modules as strings. Consumers can import example
fixtures (e.g. YAML files) as raw text without a local tsdown config or ambient
module declaration — remove those shims when upgrading, or the duplicate `*?raw`
declaration will conflict. Note: `build-cli` now takes entries only
(`build-cli <entry> [...entry]`), no longer forwards other CLI flags to tsdown, and
never loads a consumer `tsdown.config.ts`.

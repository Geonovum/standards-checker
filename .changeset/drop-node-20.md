---
'@geonovum/standards-checker': minor
---

Drop Node 20 support: `engines.node` is now `>=22.18`. Node 20 reached end-of-life in April
2026, and tsdown (which powers `build-cli`) requires a TypeScript-capable Node runtime as of
0.22.14. Use Node 22 or 24 to build and run the CLI toolkit.

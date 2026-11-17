---
'@geonovum/standards-checker': patch
---

Make the CLI's top-level `--help` useful. It now describes the `validate` command, shows example invocations, and points
to `<name> validate --help` for all options. An unknown option now ends with a hint to run `--help`. Fixes #185.

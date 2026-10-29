---
'@geonovum/standards-checker': minor
---

Validate with [OpenLint](https://github.com/openlint/openlint) instead of Stoplight Spectral, using the libraries from
the `openlint@1.1.2` release. OpenLint is the community fork of Spectral and reads the same ruleset format, so existing
rulesets and custom rule functions run unchanged. The `@stoplight/spectral-*` dependencies are replaced by
`@openlint/openlint-core` 0.1, `openlint-functions` 0.1, `openlint-parsers` 1.0, `openlint-rulesets` 0.1,
`openlint-formats` 0.1 and `openlint-ref-resolver` 0.1.

New names, with the old ones kept as deprecated aliases until the next major:

| Deprecated                                   | Use instead                                  |
| -------------------------------------------- | -------------------------------------------- |
| `@geonovum/standards-checker/spectral/*`     | `@geonovum/standards-checker/openlint/*`     |
| `Spectral` (root and `spectral/core`)        | `OpenLint`                                   |
| `ISpectralDiagnostic`, `ISpectralFullResult` | `IOpenLintDiagnostic`, `IOpenLintFullResult` |
| `spectralChecker` (`./ui`)                   | `openLintChecker`                            |

The shared Vite config now emits the validation engine as an `openlint` chunk instead of `spectral`. The chunk also
takes in the `@stoplight/*` utility packages OpenLint builds on.

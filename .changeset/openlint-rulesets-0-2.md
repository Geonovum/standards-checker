---
'@geonovum/standards-checker': patch
---

Update `@openlint/openlint-rulesets` to `^0.2.0`. That release moves the OAS ruleset into `@openlint/ruleset-spectral-oas`, so
the OAS rule functions re-exported from `./openlint/rulesets` now come from there (added as a dependency). The exported names
and the OAS rules are unchanged.

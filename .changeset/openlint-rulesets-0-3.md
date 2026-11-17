---
'@geonovum/standards-checker': patch
---

Update `@openlint/openlint-rulesets` to `^0.3.0`. It depends on `@openlint/ruleset-spectral-oas` `^1.0.0`, the same version
`standards-checker` already uses for the re-exported OAS rule functions, so a single copy of the OAS ruleset is installed instead of
both 0.1.0 and 1.0.0. The exported names and the OAS rules are unchanged.

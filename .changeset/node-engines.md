---
'@geonovum/standards-checker': patch
---

Require Node `^22.18 || >=24.0`, which drops Node 23. The `@openlint/*` libraries that 1.5.0 moved to already require
`^22.0 || >=24.0`, so Node 23 was not supported in practice; `engines` now says so.

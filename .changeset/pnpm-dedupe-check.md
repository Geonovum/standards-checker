---
'@geonovum/standards-checker': patch
---

Guard CI against un-deduplicated lockfiles: the build and publish workflows now run `pnpm dedupe --check` after install, and the lockfile has been deduplicated. This prevents partial installs from splitting shared dependencies into duplicate copies in published builds.

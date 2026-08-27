---
'@geonovum/standards-checker': minor
---

Resolve external `$ref`s against the document's own location. The CLI read its input and threw away
where it came from, so `run()` built a Spectral `Document` without a source. Spectral only sets a
resolver base URI when the document has one, which meant a sibling `"$ref": "./schema.json"` was
opened relative to the process working directory and failed with `ENOENT` unless you happened to run
from the document's own folder. `readInput` now returns the absolute path (or, for `--input <url>`,
the final URL after redirects) alongside the content, and `run()` passes it through as the new
`RunOptions.source`. Absolute `http(s)` `$ref`s were unaffected and keep working; stdin has no
location and keeps resolving relative `$ref`s against the working directory.

Because rules now run against the resolved document, a violation can land in a referenced file, so
diagnostic attribution is split across two fields. `ValidationDiagnostic.source` takes Spectral's own
meaning (the file or URL the diagnostic lives in, absent when the input had no location) and the new
`ValidationDiagnostic.ruleset` carries the conformance class that flagged it. Previously `source`
held the conformance class as a fallback; JSON output consumers reading it that way should switch to
`ruleset`, and the `table` formatter prints both.

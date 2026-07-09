---
"@geonovum/standards-checker": major
---

Introduce a first-class **Standard → Version** model, with the UI and CLI to drive it.

**Breaking:** the `Spec` model is replaced. `mount(el, specs, …)` and `createCli({ plugins })`
now take `mount(el, standards, …)` / `createCli({ standards })`; the `Spec`, `SpecInput`,
`SpecLinter`, and `SpecResponseMapper` types, the `spectralLinter` export, and the `SpecSelector`
component are removed (replaced by `Standard`/`StandardVersion`/`ConformanceClass`,
`spectralChecker`, and `StandardSelector`/`VersionSelector`). Consumers must migrate their config
to a `Standard[]`.

A standard (e.g. "API Design Rules") is now version-less and owns an ordered list of
versions, each bound to its own Spectral rulesets, example document, and status
(`final` / `draft`). A single `Standard[]` config powers both the web app (`mount`) and
the CLI (`createCli`), so the version list, order, and default are defined once.

- **CLI:** new `--standard <slug>` and optional `--version <id>` flags (default = the latest
  `final` version). The old `--ruleset <slug>` flag keeps working as a **deprecated** alias
  that warns on stderr and resolves to the equivalent standard/version.
- **UI:** the header gains a standard selector and an always-visible version selector. The
  canonical URL anchor is now `/#/{standard}/{version}`; legacy single-slug URLs redirect to
  it, and a `?url=`-loaded document is preserved across a version switch.
- **Editor UX:** switching version keeps your edits when the document has been modified and
  reloads the version's example when it is untouched; switching standard resets to the new
  example. Clicking the site title fully resets — back to the home standard's default version,
  reloading its example and dropping any loaded `?url=`.
- **Validation feedback:** a loading indicator is shown while a validation is in flight, so the
  green "no violations" bar no longer flashes before the first result arrives on initial load.
- **Source links** in the result panel are underlined (and drop the underline on hover) so they
  read as links, with the surrounding brackets kept outside the link.

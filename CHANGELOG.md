# @geonovum/standards-checker

## 1.3.0

### Minor Changes

- fcf0e25: Drop Node 20 support: `engines.node` is now `>=22.18`. Node 20 reached end-of-life in April
  2026, and tsdown (which powers `build-cli`) requires a TypeScript-capable Node runtime as of
  0.22.14. Use Node 22 or 24 to build and run the CLI toolkit.
- f16564e: Resolve external `$ref`s against the document's own location. The CLI read its input and threw away
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

### Patch Changes

- 46835f4: Fix YAML stringify under js-yaml v5. js-yaml 5.x dropped its default export in
  favor of named exports only, so `import jsYaml from 'js-yaml'` was `undefined`
  and `jsYaml.dump(...)` threw. Switch `src/encodings.ts` to the named `dump`
  import, which works on both v4 and v5.

## 1.2.0

### Minor Changes

- 98606e8: Support Vite-style `?raw` raw-text imports in CLI builds. `build-cli` now drives the
  tsdown JS API with the standard CLI-build options plus a plugin that resolves and
  inlines `*?raw` imports (rolldown doesn't implement the suffix natively), and the
  `client` types declare `*?raw` modules as strings. Consumers can import example
  fixtures (e.g. YAML files) as raw text without a local tsdown config or ambient
  module declaration — remove those shims when upgrading, or the duplicate `*?raw`
  declaration will conflict. Note: `build-cli` now takes entries only
  (`build-cli <entry> [...entry]`), no longer forwards other CLI flags to tsdown, and
  never loads a consumer `tsdown.config.ts`.
- 417ed6f: Introduce a first-class **Standard → Version** model, with the UI and CLI to drive it.

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

### Patch Changes

- 14634d0: Inset the JSON/YAML format toggle by the editor's vertical scrollbar width so it no longer overlaps the scrollbar track on platforms with classic (non-overlay) scrollbars. The measurement ships as a new `useScrollbarWidth(view)` hook exported from `@geonovum/standards-checker/ui`.
- a7a0f8e: Guard CI against un-deduplicated lockfiles: the build and publish workflows now run `pnpm dedupe --check` after install, and the lockfile has been deduplicated. This prevents partial installs from splitting shared dependencies into duplicate copies in published builds.

## 1.2.0-beta.3

### Patch Changes

- 14634d0: Inset the JSON/YAML format toggle by the editor's vertical scrollbar width so it no longer overlaps the scrollbar track on platforms with classic (non-overlay) scrollbars. The measurement ships as a new `useScrollbarWidth(view)` hook exported from `@geonovum/standards-checker/ui`.

## 1.2.0-beta.2

### Minor Changes

- 98606e8: Support Vite-style `?raw` raw-text imports in CLI builds. `build-cli` now drives the
  tsdown JS API with the standard CLI-build options plus a plugin that resolves and
  inlines `*?raw` imports (rolldown doesn't implement the suffix natively), and the
  `client` types declare `*?raw` modules as strings. Consumers can import example
  fixtures (e.g. YAML files) as raw text without a local tsdown config or ambient
  module declaration — remove those shims when upgrading, or the duplicate `*?raw`
  declaration will conflict. Note: `build-cli` now takes entries only
  (`build-cli <entry> [...entry]`), no longer forwards other CLI flags to tsdown, and
  never loads a consumer `tsdown.config.ts`.

## 1.2.0-beta.1

### Minor Changes

- 417ed6f: Introduce a first-class **Standard → Version** model, with the UI and CLI to drive it.

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

### Patch Changes

- a7a0f8e: Guard CI against un-deduplicated lockfiles: the build and publish workflows now run `pnpm dedupe --check` after install, and the lockfile has been deduplicated. This prevents partial installs from splitting shared dependencies into duplicate copies in published builds.

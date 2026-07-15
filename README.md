# @geonovum/standards-checker

A validation framework for checking documents and APIs against specifications using [Spectral](https://github.com/stoplightio/spectral) rulesets. Ships a CLI toolkit, a programmatic engine, an embeddable React UI, and shared build/lint/format/typescript configs so consumer apps stay small.

[![npm](https://img.shields.io/npm/v/@geonovum/standards-checker)](https://www.npmjs.com/package/@geonovum/standards-checker)

Release notes are in [`CHANGELOG.md`](CHANGELOG.md); see [Versioning & releasing](#versioning--releasing) for how it is produced.

## Checker apps built on this framework

| App                                                                 | Description                                                                      |
| ------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| [ogc-checker](https://github.com/Geonovum/ogc-checker)              | Validates JSON-FG documents and OGC API endpoints (Features, Processes, Records) |
| [don-checker](https://github.com/developer-overheid-nl/don-checker) | Validates OpenAPI specs (ADR 2.0.2/2.1.0) and publiccode.yml files               |

---

## Quick start

### CLI

Each checker app ships its own CLI with baked-in standards and versions:

```bash
ogc-checker validate --standard json-fg --input ./data/spec.json
don-checker validate --standard adr --version 2.0.2 --input ./openapi.json
```

Or via stdin:

```bash
cat spec.json | ogc-checker validate --standard json-fg
```

`--version` is optional and defaults to the latest final version. The old `--ruleset <slug>` flag
still works as a **deprecated** alias — it warns on stderr and resolves the old slug to the same
standard/version.

### CLI flags

| Flag                | Description                                       | Default      |
| ------------------- | ------------------------------------------------- | ------------ |
| `--standard <slug>` | Standard to validate against                      | _(required)_ |
| `--version <id>`    | Version of the standard                           | latest final |
| `--ruleset <slug>`  | **Deprecated** alias for `--standard`/`--version` | —            |
| `--input <file\|->` | Input file, URL, or `-` for stdin                 | `-`          |
| `--format <fmt>`    | Output: `table`, `json`                           | `table`      |
| `--fail-on <level>` | Exit code policy: `none`, `warn`, `error`         | `error`      |

Exit codes: `0` = pass, `1` = failed per `--fail-on` policy, `>1` = unexpected error.

### Web UI

```ts
import { mount } from '@geonovum/standards-checker/ui';
import '@geonovum/standards-checker/index.css';
import standards from './standards';

// `standards` is a `Standard[]` — each standard owns an ordered list of versions.
mount(document.getElementById('root')!, standards, {
  title: 'My Checker',
});
```

The user picks a version-less **standard** in the header; a dependent **version** dropdown then
refreshes and auto-selects the default version (explicit `defaultVersion`, else the latest `final`).
Switching version keeps the editor content and only re-lints; switching standard resets the editor
to the new standard's example. The URL anchor is `/#/{standard}/{version}`; old single-slug links
(and CLI `--ruleset` slugs) redirect to their new `{standard}/{version}` anchor.

---

## Package entry points

One package, many subpaths:

| Subpath                                          | What it is                                                                               |
| ------------------------------------------------ | ---------------------------------------------------------------------------------------- |
| `@geonovum/standards-checker`                    | Core validation engine, types, and utilities                                             |
| `@geonovum/standards-checker/ui`                 | React components, router, `mount()`                                                      |
| `@geonovum/standards-checker/cli`                | `createCli` toolkit for building a CLI entry point                                       |
| `@geonovum/standards-checker/vite`               | Shared Vite config factory (`createConfig`) — React + YAML                               |
| `@geonovum/standards-checker/vitest`             | Shared Vitest config (`createVitestConfig` + default export)                             |
| `@geonovum/standards-checker/vitest-matchers`    | Setup file registering the `toContainViolation` custom matcher                           |
| `@geonovum/standards-checker/spectral/core`      | Re-export of `@stoplight/spectral-core`                                                  |
| `@geonovum/standards-checker/spectral/functions` | Re-export of `@stoplight/spectral-functions`                                             |
| `@geonovum/standards-checker/spectral/parsers`   | Re-export of `@stoplight/spectral-parsers`                                               |
| `@geonovum/standards-checker/spectral/rulesets`  | Re-export of `@stoplight/spectral-rulesets` (`oas`, `asyncapi`, `arazzo`, OAS functions) |
| `@geonovum/standards-checker/eslint.config`      | Shared ESLint flat config                                                                |
| `@geonovum/standards-checker/prettier`           | Shared Prettier config (use via `"prettier":` field)                                     |
| `@geonovum/standards-checker/tsconfig.app.json`  | Base TS config for app source                                                            |
| `@geonovum/standards-checker/tsconfig.node.json` | Base TS config for Node-side scripts (`vite.config.ts`)                                  |
| `@geonovum/standards-checker/client`             | `*.css` module declaration for TS                                                        |
| `@geonovum/standards-checker/vitest-client`      | Vitest matcher type augmentation (`toContainViolation`)                                  |
| `@geonovum/standards-checker/index.css`          | Pre-built CSS (Tailwind compiled at build time)                                          |

Bin shipped with the package: `build-cli` — wraps `tsdown` with the standard CLI-build flags. `vite` and `vitest` are peer deps that live in the consumer's tree; scripts invoke their native bins directly.

---

## Building a checker app

Minimum consumer `package.json`:

```jsonc
{
  "type": "module",
  "scripts": {
    "dev": "vite --open",
    "build": "tsc -b && pnpm run build:cli && vite build",
    "build:cli": "build-cli src/cli.ts",
    "lint": "eslint .",
    "test": "vitest",
  },
  "prettier": "@geonovum/standards-checker/prettier",
  "dependencies": {
    "@geonovum/standards-checker": "^1.1.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "react-router-dom": "^7.0.0",
  },
  "devDependencies": {
    "esbuild": "^0.28.0",
    "eslint": "^10.0.0",
    "prettier": "^3.0.0",
    "typescript": "^6.0.0",
    "vite": "^8.0.0",
    "vitest": "^4.0.0",
  },
}
```

The package ships **pre-built CSS** (`@geonovum/standards-checker/index.css`), so consumers don't install Tailwind, PostCSS, or any CSS plugins.

Minimum consumer config files:

```ts
// vite.config.ts
import { createConfig } from '@geonovum/standards-checker/vite';
export default createConfig({ base: '/my-checker/' });
```

```js
// eslint.config.js
export { default } from '@geonovum/standards-checker/eslint.config';
```

```jsonc
// tsconfig.app.json
{ "extends": "@geonovum/standards-checker/tsconfig.app.json", "include": ["src"] }
```

```ts
// vitest.config.ts
export { default } from '@geonovum/standards-checker/vitest';
```

The shipped Vitest config registers the `toContainViolation` matcher via its setup file. To override any option, use the `createVitestConfig` factory:

```ts
// vitest.config.ts
import { createVitestConfig } from '@geonovum/standards-checker/vitest';
export default createVitestConfig({ test: { environment: 'jsdom' } });
```

Typical project layout:

```
my-checker/
├── src/
│   ├── main.ts             # Web app entry point (mount(root, standards, ...))
│   ├── cli.ts              # CLI entry point (createCli({ name, standards }))
│   └── standards/
│       ├── index.ts        # exports the Standard[] — used by BOTH main.ts and cli.ts
│       └── my-standard/
│           ├── standard.ts # Standard definition (name, slug, versions[] with raw rulesets)
│           ├── rulesets/
│           ├── examples/
│           └── functions/
├── tsconfig.app.json
├── tsconfig.node.json
├── eslint.config.js
├── vite.config.ts
├── vitest.config.ts
└── package.json
```

---

## Development

### Prerequisites

- Node.js 24+
- pnpm 10+

### Setup

```bash
pnpm install
pnpm build
```

### Commands

| Command         | Description                                                            |
| --------------- | ---------------------------------------------------------------------- |
| `pnpm build`    | Type-check + bundle via tsdown + Tailwind CLI (via tsdown `onSuccess`) |
| `pnpm dev`      | Watch mode (tsdown --watch)                                            |
| `pnpm test`     | Run vitest                                                             |
| `pnpm lint`     | Check for lint and formatting issues                                   |
| `pnpm lint:fix` | Auto-fix lint and formatting issues                                    |

### Local development with a checker app

The package is unbundled: each source file becomes its own dist file with bare imports preserved. Vite's resolver follows symlinks' realpath through the installed package, which lets it find this package's own `node_modules` and resolve transitive deps automatically — no custom Vite plugin needed.

To iterate on standards-checker against a consumer app, use `pnpm link`:

```bash
# Terminal 1: watch mode
cd standards-checker
pnpm dev

# Terminal 2: link the local checkout, then run the checker app
cd ../ogc-checker
pnpm link ../standards-checker
pnpm dev
```

Undo with `pnpm unlink @geonovum/standards-checker && pnpm install`. A subsequent `pnpm install` in the consumer can overwrite the symlink with a registry install — re-run `pnpm link ../standards-checker` if that happens.

The peer deps (React family, vite, vitest, esbuild) are already listed in each consumer's `package.json` because the consumer uses them directly (React imports, vite/vitest/esbuild bins), so peer resolution across the link works without extra steps.

### Versioning & releasing

Versioning, the changelog, and npm publishing are driven by [Changesets](https://changesets.dev/). Describing a change is decoupled from cutting a release:

1. **Add a changeset with your change.** Run `pnpm changeset`, pick the bump (`major` / `minor` / `patch`), and write a one-line summary. This creates a `.changeset/<name>.md` file — commit it with your PR. Omit only for changes that don't affect the published package (CI, internal docs, tests).

2. **Cut the release.** Run `pnpm version-packages` (alias for `changeset version`). It consumes the pending `.changeset/*.md` files, bumps `package.json` to the computed version (the highest pending bump wins), and prepends the summaries to `CHANGELOG.md`. Review and commit the result. Don't hand-edit the `version` field — Changesets owns it.

3. **Publish.** Tag the released version and push; the `publish.yml` workflow verifies `package.json` matches the tag, runs build + lint + tests, and publishes to npm with provenance:

   ```bash
   git tag v1.2.0
   git push --tags
   ```

   `pnpm release` (`pnpm build && changeset publish`) publishes locally if you need to bypass the workflow.

#### Pre-releases

To publish `-beta.N` prereleases before a final release, enter Changesets pre-release mode first; steps 2–3 above then produce prereleases until you exit:

```bash
pnpm changeset pre enter beta   # writes .changeset/pre.json — commit it
```

While in pre mode:

- `pnpm version-packages` computes e.g. `1.2.0-beta.0`; running it again after new changesets land bumps to `-beta.1`, and so on. Final releases are blocked until you exit pre mode.
- Tag and push as usual (`git tag v1.2.0-beta.0`). `publish.yml` publishes any version containing a `-` under the npm dist-tag `beta`, so `latest` keeps pointing at the last final release.
- Consumed `.changeset/*.md` files are **kept** (tracked in `.changeset/pre.json`) so the final release's changelog can aggregate them — don't delete them by hand.
- The `-beta.N` counter is derived from the current `package.json` version — one more reason never to hand-edit `version`; a hand-set version shifts the counter.

When the release is ready to go final, exit pre mode and version again:

```bash
pnpm changeset pre exit         # removes .changeset/pre.json
pnpm version-packages           # computes the final version and cleans up the consumed changesets
```

Commit, tag (`v1.2.0`), and push — the same workflow now publishes under `latest`.

---

## License

[EUPL-1.2](LICENSE)

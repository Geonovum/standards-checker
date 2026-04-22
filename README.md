# @geonovum/standards-checker

A validation framework for checking documents and APIs against specifications using [Spectral](https://github.com/stoplightio/spectral) rulesets. Ships a CLI toolkit, a programmatic engine, an embeddable React UI, and shared build/lint/format/typescript configs so consumer apps stay small.

[![npm](https://img.shields.io/npm/v/@geonovum/standards-checker)](https://www.npmjs.com/package/@geonovum/standards-checker)

## Checker apps built on this framework

| App                                                                 | Description                                                                      |
| ------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| [ogc-checker](https://github.com/Geonovum/ogc-checker)              | Validates JSON-FG documents and OGC API endpoints (Features, Processes, Records) |
| [don-checker](https://github.com/developer-overheid-nl/don-checker) | Validates OpenAPI specs (ADR 2.0/2.1), publiccode.yml, and ADR consult docs      |

---

## Quick start

### CLI

Each checker app ships its own CLI with baked-in rulesets:

```bash
ogc-checker validate --ruleset json-fg --input ./data/spec.json
don-checker validate --ruleset adr-20 --input ./openapi.json
```

Or via stdin:

```bash
cat spec.json | ogc-checker validate --ruleset json-fg
```

### CLI flags

| Flag                | Description                               | Default      |
| ------------------- | ----------------------------------------- | ------------ |
| `--ruleset <name>`  | Ruleset to run (listed in `--help`)       | _(required)_ |
| `--input <file\|->` | Input file, URL, or `-` for stdin         | `-`          |
| `--format <fmt>`    | Output: `table`, `json`                   | `table`      |
| `--fail-on <level>` | Exit code policy: `none`, `warn`, `error` | `error`      |

Exit codes: `0` = pass, `1` = failed per `--fail-on` policy, `>1` = unexpected error.

### Web UI

```ts
import { mount } from '@geonovum/standards-checker/ui';
import '@geonovum/standards-checker/index.css';
import specs from './specs';

mount(document.getElementById('root')!, specs, {
  title: 'My Checker',
});
```

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
│   ├── main.ts             # Web app entry point (calls mount())
│   ├── cli.ts              # CLI entry point (calls createCli)
│   ├── index.ts            # Ruleset plugin index
│   └── specs/
│       └── my-spec/
│           ├── spec.ts     # Spec definition (name, slug, linters)
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

The package is unbundled: each source file becomes its own dist file with bare imports preserved. Vite's resolver follows symlinks' realpath when importing from the linked package, which lets it find this package's own `node_modules` and resolve transitive deps automatically — no custom Vite plugin needed.

The cleanest pattern is a pnpm override in the consumer's `pnpm-workspace.yaml`:

```yaml
# consumer/pnpm-workspace.yaml
overrides:
  '@geonovum/standards-checker': link:../standards-checker
```

Then:

```bash
# Terminal 1: watch mode
cd standards-checker
pnpm dev

# Terminal 2: run the checker app
cd ../ogc-checker
pnpm install
pnpm dev
```

`pnpm link` does not auto-install the linked package's peers, so the consumer keeps the peer deps (React family, vitest, esbuild) listed in its own `package.json` — otherwise local dev would fail to resolve them.

### Publishing

Packages are published to npm automatically when a version tag is pushed:

```bash
git tag v1.1.0
git push --tags
```

The `publish.yml` workflow verifies `package.json` version matches the tag, runs the build + lint + tests, and publishes with provenance.

---

## License

[EUPL-1.2](LICENSE)

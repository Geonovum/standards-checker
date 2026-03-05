# @geonovum/standards-checker

A validation framework for checking documents and APIs against specifications using [Spectral](https://github.com/stoplightio/spectral) rulesets. Provides a CLI toolkit, a programmatic engine, and an embeddable web UI.

This repository is a **pnpm workspace** containing two publishable packages:

| Package                                          | npm                                                                                                                                 | Description                                                 |
| ------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| [`@geonovum/standards-checker`](packages/core/)  | [![npm](https://img.shields.io/npm/v/@geonovum/standards-checker)](https://www.npmjs.com/package/@geonovum/standards-checker)       | Core validation engine, Spectral functions, and CLI toolkit |
| [`@geonovum/standards-checker-ui`](packages/ui/) | [![npm](https://img.shields.io/npm/v/@geonovum/standards-checker-ui)](https://www.npmjs.com/package/@geonovum/standards-checker-ui) | React components for building checker web apps              |

## Checker apps built on this framework

| App                                                                               | Description                                                                      |
| --------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| [ogc-checker](https://github.com/Geonovum/ogc-checker)                            | Validates JSON-FG documents and OGC API endpoints (Features, Processes, Records) |
| [oas-checker](https://github.com/developer-overheid-nl/oas-checker)               | Validates OpenAPI specifications against ADR 2.0, ADR 2.1, and OAS rulesets      |
| [publiccode-checker](https://github.com/developer-overheid-nl/publiccode-checker) | Validates publiccode.yml files (not yet migrated to this framework)              |

---

## Quick start

### CLI

Each checker app ships its own CLI with baked-in rulesets:

```bash
ogc-checker validate --ruleset json-fg --input ./data/spec.json
oas-checker validate --ruleset adr-20 --input ./openapi.json
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
| `--format <fmt>`    | Output: `table`, `json`, `sarif`, `junit` | `table`      |
| `--fail-on <level>` | Exit code policy: `none`, `warn`, `error` | `error`      |

Exit codes: `0` = pass, `1` = failed per `--fail-on` policy, `>1` = unexpected error.

### Web UI

```tsx
import { createRouter } from '@geonovum/standards-checker-ui';
import '@geonovum/standards-checker-ui/index.css';
import specs from './specs';

const router = createRouter(specs);
```

See the [UI package README](packages/ui/) for the full integration guide.

---

## Building a checker app

A checker app follows a standard structure. See the [core package README](packages/core/) for how to define rulesets and create a CLI, and the [UI package README](packages/ui/) for how to wire up the web interface.

Typical project layout:

```
my-checker/
├── src/
│   ├── main.tsx            # Web app entry point
│   ├── cli.ts              # CLI entry point (calls createCli)
│   ├── index.ts            # Ruleset plugin index
│   └── specs/
│       └── my-spec/
│           ├── spec.ts     # Spec definition (name, slug, linters)
│           ├── rulesets/
│           │   ├── index.ts
│           │   └── core.ts # Spectral RulesetDefinition
│           ├── examples/   # Sample fixtures
│           └── functions/  # Custom Spectral functions
├── vite.config.ts
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

| Command         | Description                          |
| --------------- | ------------------------------------ |
| `pnpm build`    | Build both packages                  |
| `pnpm dev`      | Watch mode for both packages         |
| `pnpm test`     | Run tests in all packages            |
| `pnpm lint`     | Check for lint and formatting issues |
| `pnpm lint:fix` | Auto-fix lint and formatting issues  |

### Local development with a checker app

```bash
# Terminal 1: build + watch both packages
cd standards-checker
pnpm dev

# Terminal 2: link and run the app
cd ogc-checker
pnpm link ../standards-checker/packages/core ../standards-checker/packages/ui
pnpm dev
```

Unlink when done:

```bash
pnpm unlink @geonovum/standards-checker @geonovum/standards-checker-ui
pnpm install
```

### Publishing

Packages are published to npm automatically when a version tag is pushed:

```bash
git tag v1.0.0
git push --tags
```

This triggers the CI workflow that builds, tests, and publishes both packages with provenance.

---

## License

[EUPL-1.2](LICENSE)

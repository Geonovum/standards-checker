# @geonovum/standards-checker-ui

React components and router for building Spectral-based checker web apps.

Part of the [standards-checker](../../) workspace. Depends on [`@geonovum/standards-checker`](../core/) for engine types and shared utilities.

## Installation

```bash
npm install @geonovum/standards-checker-ui
```

Peer dependencies: `react ^19`, `react-dom ^19`.

## Exports

| Entry point                                | Description                                                 |
| ------------------------------------------ | ----------------------------------------------------------- |
| `@geonovum/standards-checker-ui`           | All UI exports: components, router, store, types, utilities |
| `@geonovum/standards-checker-ui/index.css` | Tailwind-based stylesheet (must be imported in your app)    |

## Quick start

### 1. Define specs

Connect each specification to its Spectral rulesets:

```ts
import { Spec, spectralLinter } from '@geonovum/standards-checker-ui';
import rulesets from './rulesets';
import example from './examples/feature.json';

export const mySpec: Spec = {
  name: 'My Spec',
  slug: 'my-spec',
  example: JSON.stringify(example, undefined, 2),
  linters: Object.entries(rulesets).map(([name, ruleset]) => ({
    name,
    linter: spectralLinter(name, ruleset),
  })),
};
```

### 2. Create the router and mount

```tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { createRouter } from '@geonovum/standards-checker-ui';
import '@geonovum/standards-checker-ui/index.css';
import specs from './specs';

const router = createRouter(specs);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
```

### 3. Customize UI text (optional)

```tsx
const router = createRouter(specs, {
  strings: {
    noViolations: 'Geen fouten gevonden.',
    showInEditor: 'Toon in editor',
    documentation: 'Hoe op te lossen?',
  },
});
```

Available string keys:

| Key                    | Default                             | Description                              |
| ---------------------- | ----------------------------------- | ---------------------------------------- |
| `checking`             | `"Checking..."`                     | Shown while validation runs              |
| `noMatchingRulesets`   | `"No matching rulesets found."`     | When no linters match the spec           |
| `noViolations`         | `"No violations found."`            | Success message per linter               |
| `lintingErrorsSummary` | `"Found {count} linting error(s)."` | Summary (`{count}` is replaced)          |
| `showInEditor`         | `"Show in editor"`                  | Button label for jumping to a diagnostic |
| `documentation`        | `"Documentation"`                   | Link label for rule documentation        |

## URL input and response mapping

Specs can optionally define a `responseMapper` to support loading documents from a URL. When a user enters a URL, the app fetches it and passes the response through the mapper, which can resolve linked resources (e.g., fetching an OpenAPI spec from a `service-desc` link):

```ts
import { SpecResponseMapper, handleResponse, handleResponseJson } from '@geonovum/standards-checker-ui';

const responseMapper: SpecResponseMapper = async responseText => {
  const doc = JSON.parse(responseText);
  // Resolve linked documents, select rulesets based on conformance classes, etc.
  return { content: resolvedContent, linters: matchedLinters };
};
```

## Components

All components are exported and can be used individually:

- **`App`** — Full checker layout (header + editor + diagnostics)
- **`CodeEditor`** — CodeMirror-based JSON editor with inline linting
- **`SpecSelector`** — Dropdown to switch between specs (uses react-router)
- **`UriInput`** — URL input form for loading remote documents
- **`GitHubIcon`** — GitHub SVG icon

## State management

The `useChecker` Zustand store manages shared state between components:

```ts
import { useChecker } from '@geonovum/standards-checker-ui';

const { content, setContent, linters, checking, error } = useChecker();
```

## License

[EUPL-1.2](../../LICENSE)

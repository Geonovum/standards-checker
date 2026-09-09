---
'@geonovum/standards-checker': minor
---

Require Vitest 5. `peerDependencies.vitest` moves from `^4.0.0` to `^5.0.0`, so consumers upgrade
Vitest in the same change. Vitest 5 needs Node 22.12 or newer, which `engines.node` already covers.

Vitest also moves from `dependencies` to `devDependencies`. It was listed in both `dependencies` and
`peerDependencies`, so one entry pinned a major that the other forbade. The peer dependency alone now
decides which Vitest a consumer runs, matching how `vite` is declared.

The shipped `vitest-client` type augmentation is rewritten for the Vitest 5 matcher interfaces.
Vitest 5 gives `Assertion` and `Matchers` two type parameters, `R` for the assertion's return type
and `T` for the received value. The previous augmentation declared `Assertion<T = any>`, whose sole
parameter lines up with Vitest 5's `R`. It still merges, which is why `toContainViolation` kept its
type, but the names disagree, so TypeScript reports TS2428 and only the `skipLibCheck` in the shipped
`tsconfig.app.json` suppresses it. The matcher now sits on `Matchers<R>`, using Vitest's own name,
constraint and default. `AsymmetricMatchersContaining` and `ExpectStatic` both extend `Matchers`, so
one declaration replaces the previous pair. Consumers that re-export the shipped Vitest config and
list `@geonovum/standards-checker/vitest-client` in their `tsconfig.app.json` types need no source
change.

`toContainViolation` gains its own tests. The matcher and its type augmentation both ship from here
and neither was exercised, so the package could publish a broken matcher or an augmentation that
declares nothing while its own build stayed green.

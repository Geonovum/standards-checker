import 'vitest';

declare module 'vitest' {
  // `R` must repeat vitest's own `Matchers` parameter exactly, name, constraint and
  // default alike. Anything else is a TS2428 mismatch that only `skipLibCheck` hides.
  interface Matchers<R extends void | Promise<void> = void | Promise<void>> {
    toContainViolation: (code: string, count?: number, message?: string | RegExp) => R;
  }
}

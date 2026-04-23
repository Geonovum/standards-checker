/* eslint-disable @typescript-eslint/no-empty-object-type */
import 'vitest';

interface CustomMatchers<R = unknown> {
  toContainViolation: (code: string, count?: number, message?: string | RegExp) => R;
}

declare module 'vitest' {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  interface Assertion<T = any> extends CustomMatchers<T> {}
  interface AsymmetricMatchersContaining extends CustomMatchers {}
}
